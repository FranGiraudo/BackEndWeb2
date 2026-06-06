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

MUY IMPORTANTE: Los precios que devuelvas (aiPriceMin y aiPriceMax) DEBEN estar EXPRESADOS ESTRICTAMENTE EN DÓLARES ESTADOUNIDENSES (USD). 
Si al buscar en internet (como en Mercado Libre) encuentras precios publicados en Pesos Argentinos (ARS) en el rango de los millones (ej: $15.000.000), DEBES convertirlos a dólares (asume 1 USD = 1100 ARS aproximadamente) antes de generar el número final. Por ejemplo, si el auto vale 11.000.000 ARS, debes devolver 10000. Nunca devuelvas un precio en millones.

Debes devolver EXCLUSIVAMENTE un objeto JSON válido con la siguiente estructura (sin markdown adicional, solo el JSON):
{
  "bodyType": "...", // Valores permitidos: "Sedán", "Hatchback", "SUV / Crossover", "Pickup", "Coupe", "Convertible", "Wagon". Si no estás seguro, usa "Sedán".
  "aiStatus": "...", // Valores permitidos exactos: "Excelente estado", "Buen estado", "Estado regular", "Requiere reparación". Elige uno basado estrictamente en los daños o desgaste que veas.
  "aiDamages": "...", // Descripción concisa de los daños visibles (ej: "Rayón en puerta trasera", "Abolladura leve", "Pintura desgastada"). Si no hay, pon "Ninguno detectado".
  "aiPriceMin": 0, // Precio mínimo sugerido en USD (entero numérico). Basado en tu búsqueda de internet, descontando daños.
  "aiPriceMax": 0 // Precio máximo sugerido en USD (entero numérico). Basado en tu búsqueda de internet.
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

  async compareVehicles(cars: any[]): Promise<{ recommendation: string }> {
    try {
      this.logger.log(`Solicitando recomendación IA para ${cars.length} vehículos...`);

      const carsData = cars.map((c, index) => 
        `Vehículo ${index + 1}: ${c.brand} ${c.model} (${c.year}) - ${c.km} km - $${c.price} - Estado: ${c.aiStatus}`
      ).join('\n');

      const promptText = `
Eres un asesor experto en compra de vehículos usados.
El usuario está comparando los siguientes vehículos y necesita ayuda para decidir:
${carsData}

Tu objetivo es elegir el mejor vehículo en términos de relación precio-calidad.
Escribe un párrafo corto, amable y directo (máximo 4 líneas) dando tu veredicto final.
Debes devolver EXCLUSIVAMENTE un JSON con la siguiente estructura:
{
  "recommendation": "Tu veredicto aquí..."
}
`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: promptText }],
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      // Sanitizar por si Gemini devuelve markdown a pesar del mimeType
      const rawText = response.text || '{}';
      const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

      const parsed = JSON.parse(cleanText);
      return {
        recommendation: parsed.recommendation || "Basado en los datos, te sugiero revisar personalmente ambos vehículos para tomar la mejor decisión."
      };
    } catch (error) {
      this.logger.error('Error al comparar vehículos con Gemini:', error);
      return {
        recommendation: "El servicio de Inteligencia Artificial no está disponible en este momento para hacer la recomendación."
      };
    }
  }
}
