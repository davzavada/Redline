import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize Gemini Client
// Note: We create a new instance per call in complex apps, but a singleton is fine here 
// as long as we handle the key correctly.
const getAIClient = () => new GoogleGenAI({ apiKey });

export const analyzeLegalDiff = async (original: string, modified: string) => {
  if (!original || !modified) return null;

  const ai = getAIClient();
  const prompt = `
    You are a senior legal associate. Compare the following "Original Clause" and "Modified Clause".
    
    Identify:
    1. The summary of legal impact of the changes.
    2. Potential risks introduced or removed.
    3. Any subtle wording changes that shift liability.

    Original Clause:
    "${original.substring(0, 5000)}"

    Modified Clause:
    "${modified.substring(0, 5000)}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a precise, risk-averse legal assistant. Output JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Executive summary of changes" },
            risks: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of potential legal risks" 
            },
            formattingIssues: {
               type: Type.ARRAY,
               items: { type: Type.STRING },
               description: "Any potential formatting or reference errors"
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const getDraftingSuggestion = async (text: string) => {
  const ai = getAIClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Rewrite the following legal text to be more concise and neutral, while retaining its legal meaning:\n\n"${text}"`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Drafting Error:", error);
    return null;
  }
};
