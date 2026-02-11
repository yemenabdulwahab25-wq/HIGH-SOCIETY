import { GoogleGenAI } from "@google/genai";
import { Product } from "../types";

const apiKey = process.env.API_KEY || ''; // Ideally this is set in env
const ai = new GoogleGenAI({ apiKey });

export const generateDescription = async (brand: string, flavor: string, strain: string): Promise<string> => {
  if (!apiKey) return "AI Description unavailable (Missing API Key).";
  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `Write a short, premium, seductive 2-sentence description for a cannabis product.
    Brand: ${brand}
    Flavor: ${flavor}
    Strain: ${strain}
    Focus on flavor notes and effects. Do not make medical claims.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text?.trim() || "Premium cannabis product.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Experience the peak of quality with this premium selection.";
  }
};

export const analyzeImage = async (base64Image: string): Promise<Partial<Product>> => {
    if (!apiKey) return {};
    try {
        const model = 'gemini-3-flash-preview';
        const prompt = `Analyze this image of a cannabis product packaging. 
        Extract the likely Brand Name, Flavor/Strain Name, Strain Type (Indica/Sativa/Hybrid), and THC percentage if visible.
        Return ONLY a JSON object with keys: brand, flavor, strain, thcPercentage. 
        If not found, return null for that key.`;
        
        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = response.text;
        if (!text) return {};
        return JSON.parse(text);
    } catch (e) {
        console.error("Image analysis failed", e);
        return {};
    }
}
