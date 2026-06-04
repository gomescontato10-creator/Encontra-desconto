import { GoogleGenAI, Type } from "@google/genai";
import type { Request, Response } from "express";

export default async function handler(req: Request, res: Response) {
  // Allow only POST requests
  if (req.method !== "POST" && req.method !== "OPTIONS") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Handle CORS for Vercel
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { query, imageBase64, mimeType } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY environment variable is required (configure on Vercel)" });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    let contents: any[] = [];
    let promptText = "Você é um assistente de economia em compras. Identifique o produto fornecido (pela imagem ou texto) e estime seu preço normal. Sua tarefa número um é encontrar o EXATO MESMO PRODUTO em outras lojas por um preço mais barato, listando-os em 'exactMatches'. Depois, sugira de 2 a 3 recomendações de outros produtos alternativos mais baratos que ofereçam funcionalidade e valor semelhantes em 'alternatives'. Explique as razões, forneça links reais de compra (como Amazon, Mercado Livre, Kabum, Magalu, etc) e mostre a diferença de preço/economia. Responda em português.";

    if (query) {
      contents.push(`User query: ${query}`);
      contents.push(promptText);
    } else if (imageBase64 && mimeType) {
      contents.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      });
      contents.push(promptText);
    } else {
      return res.status(400).json({ error: "Provide either a 'query' string or 'imageBase64' with 'mimeType'." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalProduct: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: "The name of the identified original product.",
                },
                estimatedPrice: {
                  type: Type.STRING,
                  description: "The estimated price of the original product (e.g. 'R$ 500,00').",
                },
              },
              required: ["name"],
            },
            exactMatches: {
              type: Type.ARRAY,
              description: "The exact same product found at cheaper prices in different stores.",
              items: {
                type: Type.OBJECT,
                properties: {
                  store: {
                    type: Type.STRING,
                    description: "Name of the store (e.g. 'Amazon', 'Mercado Livre').",
                  },
                  price: {
                    type: Type.STRING,
                    description: "The price at this store.",
                  },
                  purchaseUrl: {
                    type: Type.STRING,
                    description: "A real, actionable URL to buy this exact product at this store.",
                  },
                  savings: {
                    type: Type.STRING,
                    description: "A short string indicating the savings compared to the original estimated price.",
                  },
                },
                required: ["store", "price", "purchaseUrl", "savings"],
              },
            },
            alternatives: {
              type: Type.ARRAY,
              description: "Cheaper alternative products that are similar but different brands/models.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description: "The name of the cheaper alternative product.",
                  },
                  price: {
                    type: Type.STRING,
                    description: "The estimated price of the alternative product (e.g. 'R$ 250,00').",
                  },
                  reason: {
                    type: Type.STRING,
                    description: "Why this is a good alternative.",
                  },
                  purchaseUrl: {
                    type: Type.STRING,
                    description: "A real, actionable URL where the user can buy this alternative product (e.g., a search link or direct product link on an ecommerce site like Mercado Livre or Amazon).",
                  },
                  savings: {
                    type: Type.STRING,
                    description: "A short string indicating the savings compared to the original product (e.g., 'Economia de R$ 250,00' or '50% mais barato').",
                  },
                },
                required: ["name", "price", "reason", "purchaseUrl", "savings"],
              },
            },
          },
          required: ["originalProduct", "alternatives"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text returned from Gemini API");
    }

    const result = JSON.parse(text);
    return res.json(result);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message || "Something went wrong" });
  }
}
