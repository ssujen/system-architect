export interface SystemPlan {
  summary: string;
  itemizedList: string[];
  developmentPlan: {
    phase: string;
    tasks: string[];
  }[];
}

export async function generateSystemPlan(dictation: string): Promise<SystemPlan> {
  const OLLAMA_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434/api/generate";
  const MODEL = "gemma4:e2b";

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
  
  Provide:
  1. A concise summary of the system.
  2. An itemized list of core features/requirements.
  3. A phased development plan.`;

  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: prompt,
        format: 'json',
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed with status ${response.status}`);
    }

    const data = await response.json();
    return JSON.parse(data.response || "{}");
  } catch (e) {
    console.error("Failed to generate or parse Ollama response", e);
    throw new Error("Invalid response from local Ollama server");
  }
}
