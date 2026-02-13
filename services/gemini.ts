
import { GoogleGenAI, Chat, Type } from "@google/genai";
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
        Specs: ${strainOrType}
        Focus on flavor intensity, cloud production, and mention the device longevity or battery efficiency based on the puff count. Do not mention cannabis/THC effects.`;
    } else {
        prompt = `Write a short, premium, seductive 2-sentence description for a cannabis product.
        Brand: ${brand}
        Flavor: ${flavor}
        Strain Type: ${strainOrType}
        
        Requirements:
        - Mention specific flavor notes (terpenes) associated with the name/strain.
        - Describe potential effects typical for a ${strainOrType} (e.g., deep relaxation for Indica, creative energy for Sativa, balanced buzz for Hybrid).
        - Use luxurious, sensory language.
        - Do not make medical claims.`;
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

export const generateMarketingEmail = async (type: 'Product_Drop' | 'Special_Event', data: any): Promise<{subject: string, body: string}> => {
    if (!apiKey) return { subject: "Update from Billionaire Level", body: "Check out our latest updates." };
    try {
        const model = 'gemini-3-flash-preview';
        let prompt = '';
        
        if (type === 'Product_Drop') {
            prompt = `
                Write a premium, high-energy email newsletter announcing a new product drop.
                Product: ${data.brand} ${data.flavor} (${data.category})
                Description: ${data.description}
                
                Requirements:
                - Tone: Exclusive, Urgent, Luxury.
                - Subject Line: Short, emojis allowed, high click-through rate.
                - Body: Engaging, 2-3 short paragraphs, Call to Action at end.
                
                Return JSON only: { "subject": string, "body": string }
            `;
        } else {
            prompt = `
                Write a fun, celebratory email newsletter inviting customers to a special event.
                Event: ${data.title}
                Message: ${data.message}
                Dates: ${data.startDate} to ${data.endDate}
                
                Requirements:
                - Tone: Festive, Community-focused, Exciting.
                - Subject Line: Short, party emojis allowed.
                - Body: Engaging, clear details, invite them to store.
                
                Return JSON only: { "subject": string, "body": string }
            `;
        }

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        subject: { type: Type.STRING },
                        body: { type: Type.STRING }
                    },
                    required: ["subject", "body"]
                }
            }
        });
        
        return response.text ? JSON.parse(response.text) : { subject: "Update", body: "New updates available." };
    } catch (e) {
        console.error("Email Gen Failed", e);
        return { subject: "New Update", body: "Check our store for new updates!" };
    }
}

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

export const enhanceImage = async (base64Image: string): Promise<string | null> => {
    if (!apiKey) return null;
    try {
        const model = 'gemini-2.5-flash-image';
        const match = base64Image.match(/^data:(image\/[a-z]+);base64,(.+)$/);
        if (!match) return null;

        const mimeType = match[1];
        const data = match[2];

        const prompt = "Enhance this product image for a luxury e-commerce store. Improve lighting, increase sharpness, and correct colors to make the product pop. Keep the background neutral if possible or transparent. High resolution, professional finish.";

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
        console.error("Image enhancement failed", e);
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
        - LIVE INVENTORY: Access the product list below for stock and pricing.
        - GOOGLE SEARCH: Access the world's information for real-time news, strains, effects, weather, and cannabis culture.

        Rules:
        1. FOR SHOPPING: ONLY recommend products from the provided Inventory List.
        2. FOR INFORMATION: Use Google Search to provide real-time, accurate answers to questions like "What is CBN?", "Effects of Sativa vs Indica", or "Latest cannabis news".
        3. If a user asks for vapes, check the Vape list.
        4. If a product is 'Sold Out', inform the user.
        5. Keep responses short (under 3 sentences) unless asked for a detailed explanation.

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
