import { GoogleGenAI, Chat } from "@google/genai";
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

export const removeBackground = async (base64Image: string): Promise<string | null> => {
    if (!apiKey) return null;
    try {
        const model = 'gemini-2.5-flash-image';
        const match = base64Image.match(/^data:(image\/[a-z]+);base64,(.+)$/);
        if (!match) return null;
        
        const mimeType = match[1];
        const data = match[2];

        // Prompt for editing/generating the image with a new background
        const prompt = "Remove the background from this product image. Isolate the product on a solid black background (hex code #000000). Keep the product sharp and centered. Professional product photography.";

        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [
                    { inlineData: { mimeType, data } },
                    { text: prompt }
                ]
            }
        });

        if (response.candidates?.[0]?.content?.parts) {
             for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
             }
        }
        return null;
    } catch (e) {
        console.error("Background removal failed", e);
        return null;
    }
}

// Virtual Assistant Chat Initialization
export const initBudtenderChat = (inventory: Product[]): Chat | null => {
    if (!apiKey) return null;
    
    // Format inventory for the AI context
    const inventoryContext = inventory
        .filter(p => p.isPublished)
        .map(p => `
            - Name: ${p.flavor}
            - Brand: ${p.brand}
            - Type: ${p.category} (${p.strain})
            - THC: ${p.thcPercentage}%
            - Price: $${p.weights[0]?.price} for ${p.weights[0]?.label}
            - Status: ${p.stock > 0 ? 'In Stock' : 'Sold Out'}
            - Desc: ${p.description}
        `).join('\n');

    const systemInstruction = `
        You are "The Concierge", a premium AI Budtender for 'Billionaire Level'. 
        Your goal is to assist customers in finding the perfect cannabis product.
        
        Personality:
        - Sophisticated, helpful, and concise. 
        - Use emojis sparingly but effectively (🌿, 🔥, 💨).
        - Do NOT act like a doctor. Do not give medical advice.
        - Act like a high-end sommelier but for weed.

        Rules:
        1. ONLY recommend products from the provided Inventory List below. Do not hallucinate products.
        2. If a user asks for something we don't have, politely suggest the closest alternative from the list.
        3. If a product is 'Sold Out', inform the user.
        4. Keep responses short (under 3 sentences) unless asked for a detailed explanation.

        Current Inventory List:
        ${inventoryContext}
    `;

    try {
        return ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: systemInstruction,
            }
        });
    } catch (e) {
        console.error("Failed to init chat", e);
        return null;
    }
};