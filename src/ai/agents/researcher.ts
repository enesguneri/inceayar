import { llm } from "../../config/gemini";
import { z } from "zod";
import { AnalysisStateType } from "../state";
import { PromptTemplate } from "@langchain/core/prompts";
import { withRetry } from "../../utils/retry";

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
Görev: Sana verilen rakip ürün yorumlarını analiz ederek pazardaki zafiyetleri bulmak. Eğer bizim ürünümüzün kendi müşteri yorumları (Kendi Ürün Yorumlarımız) da verilmişse, rakipteki şikayetlerle bizim ürünümüzdeki övgüleri zıtlaştır (Super Mod).

Bizim Ürünümüz:
İsim: {productName}
Kategori: {category}
Özellikler: {features}
Bizim Belirttiğimiz Avantajlar: {advantages}

Rakip Ürün Yorumları:
{competitorReviews}

Kendi Ürün Yorumlarımız (Opsiyonel - Eğer varsa bizim zayıf/güçlü yönlerimiz):
{ownReviews}

Lütfen bu yorumları dikkatlice oku. 
1. Müşterilerin rakiplerde en çok neden şikayet ettiğini bul.
2. (Eğer Kendi Ürün Yorumlarımız varsa): Rakipte şikayet edilen noktanın bizim ürünümüzde sevilip sevilmediğine bak. Ayrıca bumerang etkisi olmaması için bizim ürünümüzde eleştirilen şeyleri dürüstçe analiz et.
3. Bu verilerle, rakibin şikayetlerini ve (varsa) bizim güçlü yönlerimizi harmanlayarak pazarlama avantajları (marketingAdvantages) çıkar.
`);

export const researcherAgent = async (state: AnalysisStateType): Promise<Partial<AnalysisStateType>> => {
  console.log("🕵️‍♂️ [Researcher] Ajan çalışıyor...");

  const structuredLlm = llm.withStructuredOutput(researcherSchema, { name: "research_report" });
  
  // Yorumları parti parti (chunking) işlemek için 25'erli gruplara bölelim
  const chunkSize = 25;
  const reviewChunks = [];
  for (let i = 0; i < state.competitorReviews.length; i += chunkSize) {
    reviewChunks.push(state.competitorReviews.slice(i, i + chunkSize));
  }

  // Kendi yorumlarımızı birleştir
  const ownReviewsText = state.ownReviews && state.ownReviews.length > 0 
    ? state.ownReviews.map(r => `Puan: ${r.rating || "?"}/5 - Yorum: ${r.comment}`).join("\n\n")
    : "Kendi ürün yorumu bulunmuyor. Sadece rakip yorumlarına odaklan.";

  const aggregatedFindings = {
    chronicIssues: [] as any[],
    topComplaints: [] as string[],
    marketingAdvantages: [] as string[]
  };

  for (const [index, chunk] of reviewChunks.entries()) {
    console.log(`🕵️‍♂️ [Researcher] Chunk ${index + 1}/${reviewChunks.length} analiz ediliyor...`);
    
    const reviewsText = chunk
      .map((r: any) => `Puan: ${r.rating || "?"}/5 - Yorum: ${r.comment}`)
      .join("\n\n");

    const formattedPrompt = await prompt.format({
      productName: state.product.name,
      category: state.product.category,
      features: JSON.stringify(state.product.features || {}),
      advantages: state.product.advantages || "Belirtilmemiş",
      competitorReviews: reviewsText || "Henüz rakip yorumu yok.",
      ownReviews: ownReviewsText,
    });

    const result = await withRetry(() => structuredLlm.invoke(formattedPrompt)) as any;
    
    // Sonuçları birleştir (Aggregate)
    if (result) {
      if (result.chronicIssues) aggregatedFindings.chronicIssues.push(...result.chronicIssues);
      if (result.topComplaints) aggregatedFindings.topComplaints.push(...result.topComplaints);
      if (result.marketingAdvantages) aggregatedFindings.marketingAdvantages.push(...result.marketingAdvantages);
    }
  }

  // Eğer çok fazla madde biriktiyse (örneğin 4 chunk = 12 şikayet) ve sınırlandırmak istersek
  // burada slice veya ekstra bir AI adımıyla elemeler yapılabilir, ancak şimdilik 
  // yazar ajanı (writer) tüm bu detayları görüp ona göre daha zengin bir metin yazacaktır.
  console.log(`🕵️‍♂️ [Researcher] Tüm chunk'lar işlendi. Toplam ${aggregatedFindings.chronicIssues.length} kronik sorun tespit edildi.`);

  return {
    researchFindings: aggregatedFindings,
    currentAgent: "writer", // Bir sonraki ajana geçir
  };
};
