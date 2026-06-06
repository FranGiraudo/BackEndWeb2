// src/ai/ai.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

export interface AiAnalysisResult {
  bodyType: string;
  aiStatus: string;
  aiDamages: string;
  aiPriceMin: number;
  aiPriceMax: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  /**
   * Analiza imágenes de un vehículo usando Gemini 2.5 Flash y devuelve un JSON estructurado.
   */
  async analyzeVehicle(
    brand: string,
    model: string,
    price: number,
    files: Array<{ buffer: Buffer; mimetype: string }>,
  ): Promise<AiAnalysisResult> {
    try {
      this.logger.log(`Enviando ${files.length} imágenes a Gemini para análisis...`);

      // Preparamos las partes con las imágenes
      const imageParts = files.map(file => ({
        inlineData: {
          data: file.buffer.toString('base64'),
          mimeType: file.mimetype,
        }
      }));

      const promptText = `
Eres un tasador experto de vehículos usados y un analista del mercado automotor.
Analiza detenidamente las imágenes provistas de este ${brand} ${model}.
Debes conectarte a internet (Google Search) para buscar e investigar el precio de venta actual en el mercado de Argentina para un ${brand} ${model} usado (buscá en Mercado Libre Argentina u otros sitios de clasificados).
IGNORA el precio referencial ingresado por el usuario ($${price}) para la tasación final, utilizá EXCLUSIVAMENTE los precios reales que encuentres en internet en Argentina para ese modelo.
Tu trabajo es confirmar el estado real visual y establecer un precio basado en el mercado real, ajustado por los daños que veas.

Debes devolver EXCLUSIVAMENTE un objeto JSON válido con la siguiente estructura (sin markdown adicional, solo el JSON):
{
  "bodyType": "...", // Valores permitidos: "Sedán", "Hatchback", "SUV / Crossover", "Pickup", "Coupe", "Convertible", "Wagon". Si no estás seguro, usa "Sedán".
  "aiStatus": "...", // Valores permitidos exactos: "Excelente estado", "Buen estado", "Estado regular", "Requiere reparación". Elige uno basado estrictamente en los daños o desgaste que veas.
  "aiDamages": "...", // Descripción concisa de los daños visibles (ej: "Rayón en puerta trasera", "Abolladura leve", "Pintura desgastada"). Si no hay, pon "Ninguno detectado".
  "aiPriceMin": 0, // Precio mínimo sugerido (entero numérico). Basado en tu búsqueda de internet del mercado argentino para este modelo, descontando daños.
  "aiPriceMax": 0 // Precio máximo sugerido (entero numérico). Basado en tu búsqueda de internet.
}
`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [...imageParts, { text: promptText }],
          }
        ],
        tools: [{ googleSearch: {} }],
        config: {
          responseMimeType: "application/json"
        }
      } as any);

      const responseText = response.text;
      const parsed = JSON.parse(responseText || '{}');

      return {
        bodyType: parsed.bodyType || 'Sedán',
        aiStatus: parsed.aiStatus || 'Buen estado',
        aiDamages: parsed.aiDamages || 'No analizado',
        aiPriceMin: parsed.aiPriceMin || Math.round(price * 0.9),
        aiPriceMax: parsed.aiPriceMax || Math.round(price * 1.1),
      };

    } catch (error) {
      this.logger.error('Error al analizar vehículo con Gemini:', error);
      
      // Fallback seguro en caso de error para no bloquear la publicación
      return {
        bodyType: 'Sedán',
        aiStatus: 'Buen estado',
        aiDamages: 'Análisis IA no disponible temporalmente',
        aiPriceMin: Math.round(price * 0.9),
        aiPriceMax: Math.round(price * 1.1),
      };
    }
  }
}
