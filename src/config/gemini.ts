import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { env } from "./env";

/**
 * Gemini AI Model Konfigürasyonu
 * Model olarak daha yeni, çok modlu (multimodal), hızlı ve ücretsiz sürümleri olan
 * "gemini-2.0-flash" kullanıyoruz.
 */
export const llm = new ChatGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
  model: "gemini-3.1-flash-lite", // Hızlı ve ücretsiz versiyon (Vision destekli)
  temperature: 0.7, // Yaratıcılık/tutarlılık dengesi
});
