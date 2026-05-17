import { llm } from "../../config/gemini";
import { z } from "zod";
import { AnalysisStateType } from "../state";
import { PromptTemplate } from "@langchain/core/prompts";

const writerSchema = z.object({
  draftDescription: z.string().describe("SEO uyumlu ve ikna edici taslak e-ticaret ürün açıklaması"),
  seoKeywords: z.array(z.string()).describe("Bu metin için hedeflenmiş SEO anahtar kelimeleri (en az 5 adet)"),
});

const prompt = PromptTemplate.fromTemplate(`
Sen e-ticaret satışlarını artıran, "conversion" odaklı profesyonel bir Metin Yazarı (Copywriter) ajansın.
Görev: Araştırmacı ajanın çıkardığı raporu ve ürünümüzün özelliklerini kullanarak, rakip ürünlerin zafiyetlerine vuran, 
müşteriyi satın almaya ikna eden güçlü bir ürün açıklaması yazmak.

Ürünümüz:
İsim: {productName}
Kategori: {category}
Özellikler: {features}

Araştırma Raporu (Rakiplerin Eksikleri ve Bizim Fırsatlarımız):
{researchFindings}

Yazacağın metin:
1. Dikkat çekici bir başlıkla başlamalı.
2. Ürünün teknik özelliklerini değil, müşteriye sağladığı "faydayı" satmalı.
3. Rakiplerin kronik sorunlarını (isim vermeden) bizde çözüldüğünü ima ederek güven vermeli.
4. Okunması kolay, paragraflara veya bullet point'lere ayrılmış olmalı.
5. SEO uyumlu olmalı.
`);

export const writerAgent = async (state: AnalysisStateType): Promise<Partial<AnalysisStateType>> => {
  console.log("✍️ [Writer] Ajan çalışıyor...");

  const structuredLlm = llm.withStructuredOutput(writerSchema, { name: "product_copy" });

  const formattedPrompt = await prompt.format({
    productName: state.product.name,
    category: state.product.category,
    features: JSON.stringify(state.product.features || {}),
    researchFindings: JSON.stringify(state.researchFindings || {}),
  });

  const result = await structuredLlm.invoke(formattedPrompt);

  return {
    draftDescription: result.draftDescription,
    seoKeywords: result.seoKeywords,
    currentAgent: "reviewer", // Bir sonraki ajana geçir
  };
};
