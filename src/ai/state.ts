import { Annotation } from "@langchain/langgraph";
import { IProduct } from "../models/Product";
import { IAnalysis } from "../models/Analysis";

export interface ResearchFindings {
  chronicIssues: Array<{ title: string; description: string; severity: "low" | "medium" | "high" }>;
  topComplaints: string[];
  marketingAdvantages: string[];
}

export interface RiskReport {
  overallScore: number;
  risks: Array<{ issue: string; impact: string }>;
}

/**
 * Langgraph Ajanlarının kullandığı merkezi state (durum) yapısı.
 * Her ajan bu state'i okuyup üzerine eklemeler yapar.
 */
export const AnalysisState = Annotation.Root({
  // Başlangıç girdileri
  product: Annotation<IProduct>({
    reducer: (x, y) => y ?? x,
  }),
  competitorReviews: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
  }),
  ownReviews: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),

  // Ajan çıktıları
  researchFindings: Annotation<ResearchFindings | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  draftDescription: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  seoKeywords: Annotation<string[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  generatedAdvantages: Annotation<string | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  riskReport: Annotation<RiskReport | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  finalDescription: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  revisionNotes: Annotation<string[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),

  // Süreç takibi (DB update için)
  currentAgent: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "started",
  }),
  analysisId: Annotation<string>({
    reducer: (x, y) => y ?? x,
  }),
});

// Tip tanımını export et (Ajanlarda kullanmak için)
export type AnalysisStateType = typeof AnalysisState.State;
