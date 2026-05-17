import { StateGraph, START, END } from "@langchain/langgraph";
import { AnalysisState } from "./state";
import { researcherAgent } from "./agents/researcher";
import { writerAgent } from "./agents/writer";
import { auditorAgent } from "./agents/auditor";
import { editorAgent } from "./agents/editor";

// Grafiği Tanımla
const workflow = new StateGraph(AnalysisState)
  // Düğümleri (Ajanları) ekle
  .addNode("researcher", researcherAgent)
  .addNode("writer", writerAgent)
  .addNode("auditor", auditorAgent)
  .addNode("editor", editorAgent)
  
  // Bağlantıları (Kenarları) ekle
  .addEdge(START, "researcher")
  .addEdge("researcher", "writer")
  .addEdge("writer", "auditor")
  .addEdge("auditor", "editor")
  .addEdge("editor", END);

// Grafiği derle
export const app = workflow.compile();

