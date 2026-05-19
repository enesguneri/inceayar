import { llm } from "../../config/gemini";
import { z } from "zod";
import { AnalysisStateType } from "../state";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { withRetry } from "../../utils/retry";

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${base64}`;
  } catch (e) {
    console.error("Failed to fetch image:", url, e);
    return null;
  }
}

const auditorSchema = z.object({
  riskReport: z.object({
    overallScore: z.number().min(0).max(100).describe("Ürün görselleri ve açıklamasının uyuşma/ikna edicilik skoru (0=Çok Riskli, 100=Mükemmel)"),
    risks: z.array(
      z.object({
        issue: z.string().describe("Tespit edilen uyumsuzluk veya iade riski"),
        impact: z.string().describe("Bunun müşteri tarafındaki potansiyel etkisi"),
      })
    ).describe("Metin ve fotoğraflar arasındaki tutarsızlıklar veya olası iade sebepleri"),
  }),
});

export const auditorAgent = async (state: AnalysisStateType): Promise<Partial<AnalysisStateType>> => {
  console.log("🔍 [Risk Auditor] Ajan çalışıyor...");

  const structuredLlm = llm.withStructuredOutput(auditorSchema, { name: "risk_auditor_report" });

  const ownReviewsText = state.ownReviews && state.ownReviews.length > 0 
    ? state.ownReviews.map(r => `Puan: ${r.rating || "?"}/5 - Yorum: ${r.comment}`).join("\n\n")
    : "Kendi ürün yorumu bulunmuyor.";

  const systemPrompt = `
Sen "İnce Ayar" platformunun Risk Denetçi (Risk Auditor) ajansın.
Görev: Yazar ajanın hazırladığı taslak metni, satıcının yüklediği ürün fotoğraflarını ve (varsa) bizim kendi ürünümüzün yorumlarını inceleyerek iade risk analizi yapmak.

**Kritik Kontrol 1 (Görsel Uyumsuzluk):** Eğer metin "çok parlak" diyorsa ama görsel mat duruyorsa, bu bir iade riskidir.
**Kritik Kontrol 2 (Bumerang Etkisi):** Eğer taslak metin rakibe bir konuda (örn. şarj süresi) yükleniyorsa ama bizim KENDİ ürün yorumlarımızda da aynı konudan şikayet edilmişse, bu büyük bir yalan/risk yaratır! Bu durumu tespit edersen "Kritik Risk" olarak raporla.

Taslak Metin:
${state.draftDescription}

Ürün Bilgileri:
İsim: ${state.product.name}
Kategori: ${state.product.category}
Marka: ${state.product.brand}
Avantajlar: ${state.product.advantages}

Kendi Ürün Yorumlarımız:
${ownReviewsText}
  `;

  // Multimodal mesaj oluştur
  const contentParams: any[] = [
    { type: "text", text: "Lütfen ürün görsellerini taslak metinle karşılaştırarak iade risk analiz raporunu oluştur." }
  ];

  // Görseller varsa ekle
  if (state.product.images && state.product.images.length > 0) {
    for (const imageUrl of state.product.images) {
      const base64Url = await fetchImageAsBase64(imageUrl);
      if (base64Url) {
        contentParams.push({
          type: "image_url",
          image_url: { url: base64Url }
        });
      }
    }
  } else {
    contentParams.push({ type: "text", text: "(Not: Ürüne ait görsel bulunamadı, sadece metni mantıksal ve tutarlılık açısından analiz et.)" });
  }

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage({ content: contentParams })
  ];

  const result = await withRetry(() => structuredLlm.invoke(messages));

  return {
    riskReport: result.riskReport,
    currentAgent: "auditor", // Akıştaki adım güncelleniyor
  };
};
