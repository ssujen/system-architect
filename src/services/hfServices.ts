import { OpenAI } from "openai";

export interface SystemPlan {
  summary: string;
  itemizedList: string[];
  developmentPlan: {
    phase: string;
    tasks: string[];
  }[];
}

const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN,
  dangerouslyAllowBrowser: true,
});

/**
 * Service to interact with Hugging Face Inference API using @huggingface/inference client.
 * This service is designed to be interchangeable with geminiService and ollamaServices.
 */
export async function generateSystemPlan(dictation: string): Promise<SystemPlan> {
  const MODEL_ID = process.env.HUGGINGFACE_MODEL_ID || "google/gemma-4-26B-A4B-it:novita";

  const prompt = `Analyze the following dictation and generate a structured system development plan in JSON format.
  The dictation is: "${dictation}"
  
  The response MUST be a single JSON object with the following structure:
  {
    "summary": "string",
    "itemizedList": ["string"],
    "developmentPlan": [
      {
        "phase": "string",
        "tasks": ["string"]
      }
    ]
  }
  
  Provide only the JSON object, nothing else.`;

  try {
    const chatCompletion = await client.chat.completions.create({
      model: MODEL_ID,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2048,
      temperature: 0.1,
    });

    const text = chatCompletion.choices[0].message.content || "";

    // Clean up markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const cleanedText = jsonMatch ? jsonMatch[1].trim() : text.trim();

    try {
      return JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON Parse Error. Raw text:", text);
      console.error("Cleaned text attempted:", cleanedText);
      throw new Error("Failed to parse AI response as JSON");
    }
  } catch (e) {
    console.error("Failed to generate or parse Hugging Face response", e);
    throw e instanceof Error ? e : new Error("Invalid response from Hugging Face server");
  }
}
