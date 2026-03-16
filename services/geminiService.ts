import { GoogleGenAI } from "@google/genai";

export const generateSuggestion = async (prompt: string, type: 'terms' | 'category_items'): Promise<string> => {
  
  // Safe access to API key that works in both Node and Browser (Vite)
  let apiKey = '';
  try {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env) {
          // @ts-ignore
          apiKey = import.meta.env.VITE_API_KEY || '';
      }
      if (!apiKey && typeof process !== 'undefined' && process.env) {
          apiKey = process.env.API_KEY || '';
      }
  } catch (e) {
      console.warn("Could not load API Key");
  }

  // If no API key, return empty (avoids crash)
  if (!apiKey) return "";

  const ai = new GoogleGenAI({ apiKey });

  let systemInstruction = "";
  
  if (type === 'terms') {
    systemInstruction = "Si skúsený obchodný manažér. Tvojou úlohou je navrhnúť profesionálne, stručné a jasné obchodné a platové podmienky pre cenovú ponuku v Slovenčine. Použi formálny tón.";
  } else {
    systemInstruction = "Si expert na naceňovanie projektov. Tvojou úlohou je navrhnúť zoznam 3-5 položiek pre danú kategóriu prác v Slovenčine. Vráť len zoznam oddelený čiarkami.";
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    return response.text || "";
  } catch (error) {
    console.error("Error generating content:", error);
    return "";
  }
};