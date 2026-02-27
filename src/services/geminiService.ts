import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface SystemPlan {
  summary: string;
  itemizedList: string[];
  developmentPlan: {
    phase: string;
    tasks: string[];
  }[];
}

export async function generateSystemPlan(dictation: string): Promise<SystemPlan> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following dictation and generate a structured system development plan. 
    The dictation is: "${dictation}"
    
    Provide:
    1. A concise summary of the system.
    2. An itemized list of core features/requirements.
    3. A phased development plan.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          itemizedList: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          developmentPlan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                phase: { type: Type.STRING },
                tasks: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["phase", "tasks"]
            }
          }
        },
        required: ["summary", "itemizedList", "developmentPlan"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Invalid response from AI");
  }
}
