// src/ai/ai.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

export interface AiAnalysisResult {
  bodyType: string;
  aiStatus: string;
  aiDamages: string;
  aiPriceMin: number;
  aiPriceMax: number;
  aiScore?: number;
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
    files: Express.Multer.File[],
    year: number = 2020,
    km: number = 0,
    color: string = 'No especificado',
    doors: number = 5,
    engine: string = 'No especificado'
  ): Promise<AiAnalysisResult> {
    try {
      this.logger.log(`Enviando ${files.length} imágenes a Gemini para análisis...`);

      // Preparamos las partes con las imágenes
      const imageParts = files.map((f) => ({
        inlineData: {
          data: f.buffer.toString('base64'),
          mimeType: f.mimetype,
        },
      }));

      const promptText = `
Eres un tasador experto de vehículos usados y un analista del mercado automotor en Argentina.
Analiza detenidamente las imágenes provistas de este ${brand} ${model}.
Infiere el tipo de carrocería, estado general, daños visibles, y estima un rango de precio en dólares para un auto con las siguientes características:
- Marca: ${brand}
- Modelo: ${model}
- Año: ${year}
- Kilómetros: ${km} km
- Color: ${color}
- Puertas: ${doors}
- Motor: ${engine}

También debes evaluar qué tan buena "oportunidad" es esta publicación y asignarle un puntaje del 1 al 100 ("aiScore"), donde 100 es una ganga espectacular o un auto impecable a gran precio, y 1 es un vehículo muy deteriorado o extremadamente caro para su estado.

Debes conectarte a internet (Google Search) para buscar e investigar el precio de venta actual en el mercado de Argentina para un ${brand} ${model} año ${year} usado.
Utiliza el precio referencial ingresado por el usuario ($${price}) como base para tu tasación final. Debes agregar o restar valor a este precio base dependiendo del estado general deducido de las imágenes, los daños visibles, y el kilometraje (${km} km). Si el auto está en excelente estado o tiene poco kilometraje, el precio sugerido debe ser mayor. Si tiene daños o mucho kilometraje, debe ser menor.

MUY IMPORTANTE: Los precios que devuelvas (aiPriceMin y aiPriceMax) DEBEN estar EXPRESADOS ESTRICTAMENTE EN DÓLARES ESTADOUNIDENSES (USD). 
Si al buscar en internet encuentras precios publicados en Pesos Argentinos (ARS) en el rango de los millones, DEBES convertirlos a dólares (asume 1 USD = 1100 ARS aproximadamente) antes de generar el número final.

Devuelve EXCLUSIVAMENTE un JSON con esta estructura exacta y sin formato extra:
{
  "bodyType": "Sedán", // Opciones: Sedán, Hatchback, SUV / Crossover, Pickup, Coupe, Convertible, Wagon
  "aiStatus": "Buen estado", // Opciones: Excelente estado, Buen estado, Estado regular, Requiere reparación
  "aiDamages": "Descripción corta de problemas deducidos (o 'Ninguno detectado')",
  "aiPriceMin": 0,
  "aiPriceMax": 0,
  "aiScore": 0
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
Eres un asesor experto en compra de vehículos usados y un gran conocedor del mercado automotor.
El usuario está comparando los siguientes vehículos y necesita ayuda para decidir:
${carsData}

Tu objetivo es elegir el mejor vehículo en términos de relación precio-calidad.
MUY IMPORTANTE: No te guíes solamente por el año más nuevo o los kilómetros más bajos. Debes tener muy en cuenta el SEGMENTO y la CATEGORÍA de cada auto (por ejemplo, no es lo mismo un auto base segmento B como un Polo Track, que un auto de gama media/alta segmento C o D como un Vento o un Passat). Evalúa la calidad de construcción, equipamiento, motorización y confort inherente a cada modelo al compararlos.

Escribe un párrafo corto, amable y directo (máximo 4 líneas) dando tu veredicto final sobre cuál es la mejor opción contemplando la jerarquía de los vehículos.
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
