import { llm } from "../../config/gemini";
import { z } from "zod";
import { AnalysisStateType } from "../state";
import { PromptTemplate } from "@langchain/core/prompts";

const researcherSchema = z.object({
  chronicIssues: z.array(
    z.object({
      title: z.string().describe("Sorunun kısa başlığı"),
      description: z.string().describe("Sorunun detaylı açıklaması"),
      severity: z.enum(["low", "medium", "high"]).describe("Sorunun ciddiyet derecesi"),
    })
  ).describe("Rakip ürünlerdeki kronik müşteri şikayetleri"),
  topComplaints: z.array(z.string()).describe("En çok dile getirilen 3 şikayet"),
  marketingAdvantages: z.array(z.string()).describe("Bizim ürünümüzde öne çıkarılması gereken rekabet avantajları (rakiplerin açıklarına göre)"),
});

const prompt = PromptTemplate.fromTemplate(`
Sen e-ticaret dünyasında uzman bir Pazar Araştırmacısı (Market Researcher) ajansın.
Görev: Sana verilen rakip ürün yorumlarını analiz ederek, pazardaki zafiyetleri ve bizim ürünümüzün nasıl öne çıkabileceğini bulmak.

Bizim Ürünümüz:
İsim: {productName}
Kategori: {category}
Özellikler: {features}
Bizim Belirttiğimiz Avantajlar: {advantages}

Rakip Ürün Yorumları:
{competitorReviews}

Lütfen bu yorumları dikkatlice oku. Müşterilerin rakiplerde en çok neden şikayet ettiğini bul.
Ardından, bizim ürünümüzün özelliklerini göz önünde bulundurarak, bu şikayetleri nasıl kendi avantajımıza çevirebileceğimize dair pazarlama avantajları (marketingAdvantages) çıkar.
`);

export const researcherAgent = async (state: AnalysisStateType): Promise<Partial<AnalysisStateType>> => {
  console.log("🕵️‍♂️ [Researcher] Ajan çalışıyor...");

  const structuredLlm = llm.withStructuredOutput(researcherSchema, { name: "research_report" });
  
  // Rakip yorumlarını tek bir string'e çevir
  const reviewsText = state.competitorReviews
    .map((r: any) => `Puan: ${r.rating || "?"}/5 - Yorum: ${r.comment}`)
    .join("\n\n");

  const formattedPrompt = await prompt.format({
    productName: state.product.name,
    category: state.product.category,
    features: JSON.stringify(state.product.features || {}),
    advantages: state.product.advantages || "Belirtilmemiş",
    competitorReviews: reviewsText || "Henüz rakip yorumu yok.",
  });

  const result = await structuredLlm.invoke(formattedPrompt);

  return {
    researchFindings: result as any, // Zod schema ile arayüz eşleşiyor
    currentAgent: "writer", // Bir sonraki ajana geçir
  };
};
