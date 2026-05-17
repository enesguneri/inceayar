import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { env } from "./env";

/**
 * Gemini AI Model Konfigürasyonu
 * Model olarak en güncel, çok modlu (multimodal), hızlı ve yüksek limitlere sahip
 * "gemini-3.1-flash-lite" kullanıyoruz.
 */
export const llm = new ChatGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
  model: "gemini-3.1-flash-lite", // Hızlı ve ücretsiz versiyon (Vision destekli)
  temperature: 0.7, // Yaratıcılık/tutarlılık dengesi
});
