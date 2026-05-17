import { llm } from "../../config/gemini";
import { z } from "zod";
import { AnalysisStateType } from "../state";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

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

  const systemPrompt = `
Sen "İnce Ayar" platformunun Risk Denetçi (Risk Auditor) ajansın.
Görev: Yazar ajanın hazırladığı taslak metni ve satıcının yüklediği ürün fotoğraflarını inceleyerek,
metinde vadedilenlerle fotoğraftaki ürünün birbiriyle uyuşup uyuşmadığını denetlemek.
Eğer metin "çok parlak" diyorsa ama görsel mat duruyorsa, bu bir iade riskidir.
Metin ve fotoğraflar arasındaki tutarsızlıkları bul, her biri için risk skoru belirle ve detaylıca listele.

Taslak Metin:
${state.draftDescription}

Ürün Bilgileri:
İsim: ${state.product.name}
Kategori: ${state.product.category}
Marka: ${state.product.brand}
Avantajlar: ${state.product.advantages}
  `;

  // Multimodal mesaj oluştur
  const contentParams: any[] = [
    { type: "text", text: "Lütfen ürün görsellerini taslak metinle karşılaştırarak iade risk analiz raporunu oluştur." }
  ];

  // Görseller varsa ekle
  if (state.product.images && state.product.images.length > 0) {
    state.product.images.forEach((imageUrl) => {
      contentParams.push({
        type: "image_url",
        image_url: { url: imageUrl }
      });
    });
  } else {
    contentParams.push({ type: "text", text: "(Not: Ürüne ait görsel bulunamadı, sadece metni mantıksal ve tutarlılık açısından analiz et.)" });
  }

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage({ content: contentParams })
  ];

  const result = await structuredLlm.invoke(messages);

  return {
    riskReport: result.riskReport,
    currentAgent: "auditor", // Akıştaki adım güncelleniyor
  };
};
