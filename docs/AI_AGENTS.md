# 🤖 İnceAyar — AI Ajanları Dökümanı

> Bu döküman, İnceAyar'ın Langgraph tabanlı çoklu ajan sisteminin tasarımını detaylandırır.

---

## 1. Genel Bakış

İnceAyar, 4 uzman ajandan oluşan bir yapay zeka pipeline'ı kullanır. Bu ajanlar **Langgraph** tarafından orkestre edilir ve **Gemini API** üzerinden çalışır. Her ajan belirli bir göreve odaklanmış bağımsız bir birimdir.

```
Araştırmacı → Yazılımcı → Risk Denetçi → Düzeltmen → Çıktı
```

---

## 2. Paylaşılan Durum (State)

Tüm ajanlar, Langgraph'ın stateful yapısı üzerinden ortak bir `AnalysisState` nesnesini okur ve günceller:

```typescript
// src/ai/state.ts
interface AnalysisState {
  // Girdiler
  product: IProduct;
  competitorReviews: any[];
  ownReviews?: any[]; // Kullanıcının kendi ürününün yorumları (varsa)

  // Araştırmacı çıktısı
  researchFindings: {
    chronicIssues: Array<{ title: string; description: string; severity: "low" | "medium" | "high" }>;
    topComplaints: string[];
    marketingAdvantages: string[];
  };

  // Yazılımcı çıktısı
  draftDescription: string;
  seoKeywords: string[];

  // Risk Denetçi çıktısı
  riskReport: {
    overallScore: number;
    risks: Array<{ issue: string; impact: string }>;
  };

  // Düzeltmen çıktısı
  finalDescription: string;
  revisionNotes: string[];

  // Meta
  currentAgent: string;
  analysisId: string;
}
```

---

## 3. Ajan Detayları

### 3.1 Araştırmacı Ajan (Researcher)

**Görev:** Rakip yorumlarını analiz ederek kronik sorunları tespit etmek.

**Dosya:** `src/ai/agents/researcher.ts`

**Model:** Gemini 3.1 Flash Lite

**Girdi:** `competitorReviews[]` + *(Opsiyonel)* `ownReviews[]`

**Çıktı:** `researchFindings`

**Prompt Stratejisi:**
- Sadece rakip yorumları varsa: Rakibin negatif yorumlarını kategorize et ve en kritik sorunları listele.
- Eğer kullanıcının kendi ürün yorumları (`ownReviews`) da verilmişse (Süper Mod):
  - Rakipte en çok şikayet edilen noktalar ile kullanıcının kendi ürününde en çok övülen/sevilen noktaları karşılaştır (Zıtlaştırma analizi).
  - Kullanıcının kendi ürünündeki olası zayıf noktaları da dürüstçe belirle (Bumerang etkisi yaratmamak için).
- Her kategorideki şikayet frekansını hesapla ve en kritik 3-5 kronik sorunu listele.

---

### 3.2 Yazılımcı Ajan (Writer)

**Görev:** Araştırmacının bulgularına dayanarak agresif, SEO uyumlu satış metni yazmak.

**Dosya:** `src/ai/agents/writer.ts`

**Model:** Gemini 3.1 Flash Lite

**Girdi:** `researchFindings` + `product`

**Çıktı:** `draftDescription` + `seoKeywords`

**Prompt Stratejisi:**
- Rakiplerin kronik sorunlarını avantaja çeviren ifadeler kullan
- Ürün özelliklerini sorun çözücü olarak konumla
- SEO anahtar kelimelerini doğal akışta entegre et
- E-ticaret platformlarının metin formatına uygun yapı (başlık, bullet point, detay)
- Duygusal tetikleyiciler ve aciliyet hissi oluştur

---

### 3.3 Risk Denetçi Ajan (Risk Auditor)

**Görev:** Yazılan metni ürün fotoğraflarıyla karşılaştırarak iade riski analizi yapmak.

**Dosya:** `src/ai/agents/auditor.ts`

**Model:** Gemini 3.1 Flash Lite (Multimodal/Vision)

**Girdi:** `draftDescription` + `product.images[]` + *(Opsiyonel)* `ownReviews[]`

**Çıktı:** `riskReport`

**Prompt Stratejisi:**
- Her fotoğrafı metin iddiaları açısından denetle
- **Bumerang Etkisi Kontrolü:** Eğer yazılan metin rakibe bir konuda (örn. şarj) yükleniyorsa ama kullanıcının kendi ürün yorumlarında (`ownReviews`) da aynı konudan şikayet edilmişse, bu iddiayı "Kritik Risk" olarak işaretle!
- Renk, boyut, malzeme, kalite vaatlerini fotoğrafla karşılaştır
- Aşırı yükseltilmiş beklenti ifadelerini tespit et
- Her uyumsuzluk için 0-100 arası risk skoru ata

**Risk Seviyeleri:**
| Skor Aralığı | Seviye | Aksiyon |
|--------------|--------|---------|
| 0-25 | Düşük | Onay |
| 26-50 | Orta | Uyarı |
| 51-75 | Yüksek | Düzeltme önerisi |
| 76-100 | Kritik | Zorunlu düzeltme |

---

### 3.4 Düzeltmen Ajan (Editor)

**Görev:** Risk raporuna göre metni optimize etmek; agresifliği korurken riskleri azaltmak.

**Dosya:** `src/ai/agents/editor.ts`

**Model:** Gemini 3.1 Flash Lite

**Girdi:** `draftDescription` + `riskReport`

**Çıktı:** `finalDescription` + `revisionNotes`

**Prompt Stratejisi:**
- Yüksek riskli ifadeleri tespit et ve yumuşat
- Agresif satış tonunu mümkün olduğunca koru
- "Görseller temsilidir" gibi koruyucu ifadeler ekle (gerekirse)
- SEO performansını bozmadan düzeltme yap
- Yapılan her değişikliğin gerekçesini revisionNotes'a yaz

**Karar Mantığı:**
```
IF overallRiskScore < 25  → Metni olduğu gibi onayla
IF overallRiskScore 25-75 → Riskli ifadeleri düzelt, geri kalanı koru
IF overallRiskScore > 75  → Metni önemli ölçüde yeniden yaz
```

---

## 4. Langgraph Akış Grafiği

```typescript
// src/ai/graph.ts — Güncel yapı

import { StateGraph, START, END } from "@langchain/langgraph";
import { AnalysisState } from "./state";
import { researcherAgent } from "./agents/researcher";
import { writerAgent } from "./agents/writer";
import { auditorAgent } from "./agents/auditor";
import { editorAgent } from "./agents/editor";

const workflow = new StateGraph(AnalysisState)
  .addNode("researcher", researcherAgent)
  .addNode("writer", writerAgent)
  .addNode("auditor", auditorAgent)
  .addNode("editor", editorAgent)

  .addEdge(START, "researcher")
  .addEdge("researcher", "writer")
  .addEdge("writer", "auditor")
  .addEdge("auditor", "editor")
  .addEdge("editor", END);

export const app = workflow.compile();
```

---

## 5. Hata Yönetimi

Her ajan seviyesinde:
- **Retry mekanizması**: Gemini API hataları için 3 deneme, exponential backoff
- **Timeout**: Her ajan için 30 saniye maksimum süre
- **Fallback**: Ajan başarısız olursa, state'e hata bilgisi yazılır ve süreç sonlandırılır
- **SSE bildirimi**: Her durum değişikliğinde frontend'e bildirim gönderilir

---

## 6. Prompt Yapısı

Her ajan, kendi dosyası (`src/ai/agents/*.ts`) içinde **system prompt** ve **Zod schema** tanımlarını barındırır.
Structured Output kullanılarak model çıktısı doğrudan parse edilir, ayrıca JSON parse'a gerek kalmaz.

```typescript
// Örnek: agents/researcher.ts
const researcherSchema = z.object({
  chronicIssues: z.array(z.object({
    title: z.string(),
    description: z.string(),
    severity: z.enum(["low", "medium", "high"]),
  })),
  topComplaints: z.array(z.string()),
  marketingAdvantages: z.array(z.string()),
});

const structuredLlm = llm.withStructuredOutput(researcherSchema, { name: "research_report" });
```
