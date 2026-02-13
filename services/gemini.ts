
import { GoogleGenAI, Chat } from "@google/genai";
import { Product, ProductType, ProductSEO } from "../types";

const apiKey = process.env.API_KEY || ''; // Ideally this is set in env
const ai = new GoogleGenAI({ apiKey });

export const generateDescription = async (brand: string, flavor: string, strainOrType: string, productType: ProductType = 'Cannabis'): Promise<string> => {
  if (!apiKey) return "AI Description unavailable (Missing API Key).";
  try {
    const model = 'gemini-3-flash-preview';
    let prompt = '';
    
    if (productType === 'Vape') {
        prompt = `Write a short, punchy, energetic 2-sentence description for a nicotine vape product.
        Brand: ${brand}
        Flavor: ${flavor}
        Puff Count/Type: ${strainOrType}
        Focus on flavor intensity, cloud production, and longevity. Do not mention cannabis/THC effects.`;
    } else {
        prompt = `Write a short, premium, seductive 2-sentence description for a cannabis product.
        Brand: ${brand}
        Flavor: ${flavor}
        Strain: ${strainOrType}
        Focus on flavor notes and effects. Do not make medical claims.`;
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text?.trim() || "Premium product selection.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Experience the peak of quality with this premium selection.";
  }
};

export const generateProductSEO = async (product: Product): Promise<ProductSEO | null> => {
    if (!apiKey) return null;
    try {
        const model = 'gemini-3-flash-preview';
        const prompt = `
            Act as an SEO Expert for a high-end cannabis and vape store.
            Generate SEO metadata for the following product:
            
            Product: ${product.brand} ${product.flavor}
            Category: ${product.category}
            Type: ${product.productType}
            Description: ${product.description}
            
            Requirements:
            1. Meta Title: Catchy, includes keywords, max 60 characters.
            2. Meta Description: Persuasive, click-worthy, max 160 characters.
            3. Keywords: A list of 5 comma-separated high-traffic keywords.

            Return ONLY a JSON object with keys: "title", "description", "keywords" (array of strings).
        `;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        
        return response.text ? JSON.parse(response.text) : null;
    } catch (e) {
        console.error("SEO Gen Failed", e);
        return null;
    }
};

export const generateAdCopy = async (product: Product, platform: 'Google' | 'Facebook' | 'Instagram' | 'Email'): Promise<string> => {
    if (!apiKey) return "AI unavailable.";
    try {
        const model = 'gemini-3-flash-preview';
        let prompt = `Write a ${platform} ad for: ${product.brand} ${product.flavor}.`;
        
        if (platform === 'Google') {
            prompt += ` Strict format: Headline 1 | Headline 2. Description 1. Description 2. Focus on keywords and urgency. No hashtags.`;
        } else if (platform === 'Facebook') {
            prompt += ` Casual, engaging tone. Focus on lifestyle and benefits. Include a Call to Action.`;
        } else if (platform === 'Instagram') {
            prompt += ` Visual, trendy, high-energy. Short caption. Include 10 relevant hashtags.`;
        } else {
            prompt += ` Subject Line and Body copy for an email blast. VIP tone.`;
        }

        const response = await ai.models.generateContent({
            model,
            contents: prompt
        });
        return response.text || "Ad generation failed.";
    } catch (e) {
        console.error("Ad Gen Failed", e);
        return "Ad generation failed.";
    }
};

export const analyzeImage = async (base64Image: string, productType: ProductType = 'Cannabis'): Promise<Partial<Product>> => {
    if (!apiKey) return {};
    try {
        const model = 'gemini-3-flash-preview';
        let prompt = '';

        if (productType === 'Vape') {
             prompt = `Analyze this image of a Vape / E-cigarette packaging. 
             Extract the Brand Name, Flavor, and Puff Count (e.g. 5000 puffs).
             Return ONLY a JSON object with keys: brand, flavor, puffCount (number). 
             If not found, return null for that key.`;
        } else {
             prompt = `Analyze this image of a cannabis product packaging. 
             Extract the likely Brand Name, Flavor/Strain Name, Strain Type (Indica/Sativa/Hybrid), and THC percentage if visible.
             Return ONLY a JSON object with keys: brand, flavor, strain, thcPercentage. 
             If not found, return null for that key.`;
        }
        
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

export const getCoordinates = async (address: string): Promise<{lat: number, lng: number} | null> => {
    if (!apiKey) return null;
    try {
        const model = 'gemini-3-flash-preview';
        const prompt = `Return the approximate latitude and longitude for this address or city: "${address}". 
        Return JSON format ONLY: {"lat": number, "lng": number}. 
        Example: {"lat": 40.7128, "lng": -74.0060}`;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        
        return response.text ? JSON.parse(response.text) : null;
    } catch (e) {
        console.error("Geocoding failed", e);
        return null;
    }
};

// Virtual Assistant Chat Initialization
export const initBudtenderChat = (inventory: Product[]): Chat | null => {
    if (!apiKey) return null;
    
    // Format inventory for the AI context
    const inventoryContext = inventory
        .filter(p => p.isPublished)
        .map(p => {
            if (p.productType === 'Vape') {
                return `- Vape: ${p.brand} ${p.flavor}, ${p.puffCount || 'Standard'} puffs, $${p.weights[0]?.price}`;
            }
            return `- Cannabis: ${p.flavor} (${p.strain}), ${p.brand}, ${p.thcPercentage}% THC, $${p.weights[0]?.price}`;
        }).join('\n');

    const systemInstruction = `
        You are "The Concierge", a premium AI Budtender for 'Billionaire Level'. 
        Your goal is to assist customers in finding the perfect cannabis OR vape product.
        
        Personality:
        - Sophisticated, helpful, and concise. 
        - Use emojis sparingly but effectively (🌿, 🔥, 💨).
        - Do NOT act like a doctor. Do not give medical advice.
        - Act like a high-end sommelier.

        Capabilities:
        - You have access to the store's LIVE INVENTORY (below). Use this for product requests.
        - You have access to Google Search. Use this for general knowledge.

        Rules:
        1. ONLY recommend products from the provided Inventory List below.
        2. If a user asks for vapes, check the Vape list.
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
                tools: [{ googleSearch: {} }], // Enable Search Grounding
            }
        });
    } catch (e) {
        console.error("Failed to init chat", e);
        return null;
    }
};
