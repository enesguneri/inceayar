import { llm } from "../../config/gemini";
import { z } from "zod";
import { AnalysisStateType } from "../state";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { withRetry } from "../../utils/retry";

const editorSchema = z.object({
  finalDescription: z.string().describe("Risk raporuna göre revize edilmiş ve ince ayar çekilmiş son satış metni."),
  revisionNotes: z.array(z.string()).describe("Taslak metinde nelerin neden değiştirildiğine veya neden aynı bırakıldığına dair satıcıya yönelik Türkçe açıklayıcı notlar."),
});

export const editorAgent = async (state: AnalysisStateType): Promise<Partial<AnalysisStateType>> => {
  console.log("✍️ [Editor] Ajan çalışıyor...");

  const structuredLlm = llm.withStructuredOutput(editorSchema, { name: "edited_description" });

  const systemPrompt = `
Sen "İnce Ayar" platformunun Düzeltmen (Editor) ajansın.
Görev: Risk Denetçi (Risk Auditor) ajanın hazırladığı risk raporuna göre, Yazar ajanın taslak metnini optimize etmek.

Kurallar:
1. Agresif ve ikna edici satış tonunu mümkün olduğunca koru.
2. Risk raporunda belirtilen yüksek riskli ve yanıltıcı/abartılı ifadeleri (örneğin pamuklu kumaşta 'asla kırışmaz' veya 'kolay ütülenir' denmesini) tespit et ve daha gerçekçi/güvenli ifadelerle yumuşat.
3. Gerekirse satıcıyı korumak için "Görseller temsilidir" gibi koruyucu veya "doğru bakım standartları" gibi açıklayıcı vurgular ekle.
4. Yapılan her düzeltmenin gerekçesini (satıcıya tavsiye niteliğinde) 'revisionNotes' içerisine Türkçe olarak yaz.
5. Risk skoru çok düşükse (örneğin < 25), metni neredeyse hiç değiştirmeden onaylayabilirsin.

Taslak Metin:
${state.draftDescription}

Risk Raporu (Overall Score: ${state.riskReport?.overallScore || 100}):
${JSON.stringify(state.riskReport || { risks: [] }, null, 2)}

Ürün Bilgileri:
İsim: ${state.product.name}
Kategori: ${state.product.category}
Marka: ${state.product.brand}
  `;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage("Lütfen risk raporunu inceleyerek taslak metni revize et ve düzeltme notlarını oluştur.")
  ];

  const result = await withRetry(() => structuredLlm.invoke(messages));

  return {
    finalDescription: result.finalDescription,
    revisionNotes: result.revisionNotes,
    currentAgent: "editor", // Akıştaki adım güncelleniyor
  };
};
