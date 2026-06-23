import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { Groq } from 'groq-sdk';

export interface AiAnalysisResult {
  bodyType: string;
  aiStatus: string;
  aiDamages: string;
  aiPriceMin: number;
  aiPriceMax: number;
  aiScore?: number;
  brand?: string;
  model?: string;
  confidence?: number;
  isFraud?: boolean;
  fraudReason?: string;
}

export interface MarketValueEstimation {
  status: 'excellent' | 'good' | 'fair' | 'repairs_needed';
  marketPriceRange: {
    min: number;
    max: number;
  };
  evaluation: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly ai: GoogleGenAI;
  private readonly groq: Groq;

  constructor(private readonly configService: ConfigService) {
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    const groqKey = this.configService.get<string>('GROQ_API_KEY');

    if (!geminiKey) {
      this.logger.warn('GEMINI_API_KEY no encontrada en ConfigService. Fallback a process.env para retrocompatibilidad, pero esto incumple la norma.');
    }

    this.ai = new GoogleGenAI({ apiKey: geminiKey || process.env.GEMINI_API_KEY });
    this.groq = new Groq({ apiKey: groqKey || process.env.GROQ_API_KEY });
  }

  /**
   * Obtiene la cotización actual del Dólar Blue en Argentina.
   */
  private async getUsdRate(): Promise<number> {
    try {
      const res = await fetch('https://dolarapi.com/v1/dolares/blue');
      if (!res.ok) throw new Error('DolarAPI HTTP error');
      const data = await res.json();
      return data.venta || 1100;
    } catch (error) {
      this.logger.warn('No se pudo obtener cotización del dólar, usando fallback 1100: ' + error.message);
      return 1100; // Fallback razonable
    }
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
      const currentUsdRate = await this.getUsdRate();

      // Preparamos las partes con las imágenes
      const imageParts = files.map((f) => ({
        inlineData: {
          data: f.buffer.toString('base64'),
          mimeType: f.mimetype,
        },
      }));

      const promptText = `
Eres un tasador experto de vehículos usados y un analista del mercado automotor en Argentina.
Analiza detenidamente las imágenes provistas del vehículo.
Debes identificar la marca y el modelo exacto del auto en la foto, y asignar un nivel de certeza (confidence) de 0.0 a 1.0.
Infiere también el tipo de carrocería, estado general, daños visibles, y estima un rango de precio en dólares para un auto con las siguientes características proporcionadas por el usuario (si las hay):
- Marca provista: ${brand}
- Modelo provisto: ${model}
- Año: ${year}
- Kilómetros: ${km} km
- Color: ${color}
- Puertas: ${doors}
- Motor: ${engine}

Si la Marca y Modelo provistos están vacíos o no coinciden con la foto, prioriza tu propia detección visual para 'brand' y 'model'.

También debes evaluar qué tan buena "oportunidad" es esta publicación y asignarle un puntaje del 1 al 100 ("aiScore"), donde 100 es una ganga espectacular o un auto impecable a gran precio, y 1 es un vehículo muy deteriorado o extremadamente caro para su estado.

Debes conectarte a internet (Google Search) para buscar e investigar EXPRESAMENTE en Mercado Libre (MercadoLibre Argentina) y en Facebook Marketplace el precio de venta actual real en el mercado de Argentina para el vehículo detectado (año ${year} usado).
Utiliza el precio referencial ingresado por el usuario ($${price}) como base para tu tasación final. 

REGLAS DE ORO DEL MERCADO ARGENTINO:
1. Los autos en Argentina son EXTREMADAMENTE caros comparados con el resto del mundo.
2. Un auto funcional (como un VW Golf, Peugeot 206, etc.) de los años 1999-2005 NUNCA vale menos de $3.500 a $5.000 USD. Precios como $1.500 o $2.000 USD corresponden a motos o autos destruidos para desarme.
3. Si en tu búsqueda encuentras precios absurdamente bajos (ej. $1.800 USD por un Golf 2005), asume que es un error de publicación o un adelanto de cuota.
4. Si no encuentras un precio confiable en internet, confía ciegamente en el precio pretendido por el usuario ($${price} USD) y establece el rango en un +/- 15% de ese valor, ajustando levemente según el estado que deduzcas de las fotos.

MUY IMPORTANTE (AUDITORÍA ANTI-FRAUDE): Eres el primer filtro de seguridad de la plataforma.
Debes analizar si las fotos subidas provienen de una estafa, concesionaria competidora, o son irreales. 
DEBES MARCAR "isFraud": true SI DETECTAS ALGUNO DE LOS SIGUIENTES CASOS:
- Hay marcas de agua explícitas de otras plataformas (Kavak, MercadoLibre, OLX, Karvi, etc.).
- La foto es claramente de un banco de imágenes (stock photo), una publicidad oficial de la marca o un render 3D de computadora.
- La foto está burdamente photoshopeada o es un montaje.
Si marcas "isFraud": true, debes explicar el motivo en "fraudReason". Si la foto parece legítima y sacada por un usuario real en la calle, garage o agencia limpia, marca "isFraud": false y deja "fraudReason" vacío.

MUY IMPORTANTE: Los precios que devuelvas (aiPriceMin y aiPriceMax) DEBEN estar EXPRESADOS ESTRICTAMENTE EN DÓLARES ESTADOUNIDENSES (USD). 
Si al buscar en internet encuentras precios publicados en Pesos Argentinos (ARS) en el rango de los millones (ej. 6.000.000 ARS), DEBES convertirlos a dólares dividiendo por ${currentUsdRate} (aprox) antes de generar el número final.

PROHIBIDO devolver texto introductorio, bloques de código markdown o emojis.
Devuelve EXCLUSIVAMENTE un objeto JSON plano con esta estructura exacta y sin formato extra:
{
  "brand": "Marca detectada",
  "model": "Modelo detectado",
  "confidence": 0.95,
  "bodyType": "Sedán",
  "aiStatus": "Buen estado",
  "aiDamages": "Descripción corta de problemas deducidos (o 'Ninguno detectado')",
  "aiPriceMin": 0,
  "aiPriceMax": 0,
  "aiScore": 0,
  "isFraud": false,
  "fraudReason": ""
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

      // Control de Errores: Si la confianza es menor a 0.6, retornamos marca y modelo vacíos
      const confidence = parsed.confidence || 0;
      const detectedBrand = confidence >= 0.6 ? parsed.brand : '';
      const detectedModel = confidence >= 0.6 ? parsed.model : '';

      if (confidence < 0.6) {
        this.logger.warn(`Baja confianza en detección de marca/modelo (${confidence}). Se enviarán vacíos.`);
      }

      return {
        brand: detectedBrand,
        model: detectedModel,
        confidence: confidence,
        bodyType: parsed.bodyType || 'Sedán',
        aiStatus: parsed.aiStatus || 'Buen estado',
        aiDamages: parsed.aiDamages || 'No analizado',
        aiPriceMin: parsed.aiPriceMin || Math.round(price * 0.9),
        aiPriceMax: parsed.aiPriceMax || Math.round(price * 1.1),
        aiScore: parsed.aiScore || 0,
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

  /**
   * Estima el valor de mercado de un vehículo basándose en sus características e imágenes.
   */
  async estimateMarketValue(
    price: number,
    year: number,
    km: number,
    brand: string,
    model: string,
    images: Express.Multer.File[] | string[]
  ): Promise<MarketValueEstimation> {
    try {
      this.logger.log(`Estimando valor de mercado para ${brand} ${model}...`);
      const currentUsdRate = await this.getUsdRate();

      const imageParts: any[] = [];
      for (const img of images) {
        if (typeof img === 'string') {
          try {
            const res = await fetch(img);
            if (res.ok) {
              const buffer = await res.arrayBuffer();
              const mimeType = res.headers.get('content-type') || 'image/jpeg';
              imageParts.push({
                inlineData: {
                  data: Buffer.from(buffer).toString('base64'),
                  mimeType,
                },
              });
            }
          } catch (e) {
            this.logger.warn(`No se pudo descargar imagen ${img}: ${e.message}`);
          }
        } else {
          imageParts.push({
            inlineData: {
              data: img.buffer.toString('base64'),
              mimeType: img.mimetype,
            },
          });
        }
      }

      const promptText = `
Eres un tasador experto de vehículos usados y analista del mercado automotor en Argentina (y Latinoamérica) en el contexto actual.
Se te proporciona información e imágenes de un vehículo para estimar su valor de mercado.

Datos provistos:
- Marca: ${brand}
- Modelo: ${model}
- Año: ${year}
- Kilómetros: ${km} km
- Precio pretendido por el vendedor: $${price} USD

Instrucciones:
1. Analiza las imágenes proporcionadas para determinar el estado real del vehículo.
2. Basado en búsquedas en internet EXPRESAMENTE en Mercado Libre (MercadoLibre Argentina) y Facebook Marketplace, estima un rango de precio justo (min y max) real en el mercado de Argentina, expresado en Dólares Estadounidenses (USD).
   REGLAS DE ORO DEL MERCADO ARGENTINO:
   - Los autos usados son desproporcionadamente caros. Un auto año 1999-2005 rara vez baja de los $4.000 a $6.000 USD.
   - Precios por debajo de $2.500 USD suelen ser estafas, anticipos de plan de ahorro, o vehículos fundidos/para desarme.
   - Si tu búsqueda arroja precios irreales (ej. $1.500 USD), IGNÓRALOS y toma como base principal el precio pretendido por el vendedor ($${price} USD) con un margen de +/- 15%.
   - Convierte los montos millonarios en Pesos Argentinos a USD dividiendo por ${currentUsdRate}.
3. Escribe una evaluación ("evaluation") justificando el rango de precio propuesto y el estado detectado.
4. "Do not use emojis under any circumstance in the 'evaluation' string response".

PROHIBIDO devolver texto introductorio, bloques de código markdown o emojis en la respuesta.
Devuelve EXCLUSIVAMENTE un objeto JSON plano con la siguiente estructura exacta:
{
  "status": "excellent" | "good" | "fair" | "repairs_needed",
  "marketPriceRange": {
    "min": 0,
    "max": 0
  },
  "evaluation": "string"
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

      const parsed = JSON.parse(response.text || '{}');

      return {
        status: parsed.status || 'good',
        marketPriceRange: {
          min: parsed.marketPriceRange?.min || Math.round(price * 0.9),
          max: parsed.marketPriceRange?.max || Math.round(price * 1.1),
        },
        evaluation: parsed.evaluation || 'No se pudo generar la evaluación.',
      };

    } catch (error) {
      this.logger.error('Error al estimar valor de mercado:', error);
      throw error;
    }
  }

  async compareVehicles(cars: any[]): Promise<{ recommendation: string }> {
    try {
      this.logger.log(`Solicitando recomendación IA para ${cars.length} vehículos...`);

      const carsData = cars.map((c, index) => 
        `Vehículo ${index + 1}: ${c.brand} ${c.model} (${c.year}) - ${c.km} km - $${c.price} - Estado: ${c.aiStatus}`
      ).join('\n');

      const promptText = [
        "Eres un asesor experto en compra de vehículos usados y un gran conocedor del mercado automotor.",
        "El usuario está comparando los siguientes vehículos y necesita ayuda para decidir:",
        carsData,
        "",
        "Tu objetivo es elegir el mejor vehículo en términos de relación precio-calidad.",
        "MUY IMPORTANTE: No te guíes solamente por el año más nuevo o los kilómetros más bajos. Debes tener muy en cuenta el SEGMENTO y la CATEGORÍA de cada auto (por ejemplo, no es lo mismo un auto base segmento B como un Polo Track, que un auto de gama media/alta segmento C o D como un Vento o un Passat). Evalúa la calidad de construcción, equipamiento, motorización y confort inherente a cada modelo al compararlos.",
        "",
        "Escribe un párrafo corto, amable y directo (máximo 4 líneas) dando tu veredicto final sobre cuál es la mejor opción contemplando la jerarquía de los vehículos.",
        "Debes devolver EXCLUSIVAMENTE un JSON con la siguiente estructura:",
        "{",
        '  "recommendation": "Tu veredicto aquí..."',
        "}"
      ].join('\n');

      const response = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: "Eres un asesor experto en compra de vehículos usados y un gran conocedor del mercado automotor. Debes devolver EXCLUSIVAMENTE un JSON con la propiedad 'recommendation'." },
          { role: 'user', content: promptText }
        ],
        response_format: { type: "json_object" }
      });

      const cleanText = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(cleanText);
      
      return {
        recommendation: parsed.recommendation || "Basado en los datos, te sugiero revisar personalmente ambos vehículos para tomar la mejor decisión."
      };
    } catch (error) {
      this.logger.error('Error al comparar vehículos con Groq:', error);
      return {
        recommendation: "El servicio de Inteligencia Artificial no está disponible en este momento para hacer la recomendación."
      };
    }
  }

  async generateWeeklyRecommendations(userContext: string, catalog: string): Promise<number[]> {
    try {
      this.logger.log('Solicitando recomendaciones semanales a Groq (Llama 3)...');

      const promptText = `
Eres un sistema de recomendación automático de vehículos.
Contexto del usuario (búsquedas recientes y autos favoritos):
${userContext}

Catálogo de autos disponibles (JSON):
${catalog}

Tu tarea:
Analiza los intereses del usuario y busca en el catálogo los 3 autos que más se alineen con sus preferencias (por marca, precio, año o segmento).
Do not output any emoji or explanatory markdown.
Devuelve EXCLUSIVAMENTE un JSON limpio con el formato: { "recommendedCarIds": [number, number, number] }
`;

      const response = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: "Eres un sistema estricto de recomendación JSON." },
          { role: 'user', content: promptText }
        ],
        response_format: { type: "json_object" }
      });

      const cleanText = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(cleanText);

      return parsed.recommendedCarIds || [];
    } catch (error) {
      this.logger.error('Error al generar recomendaciones con Groq:', error);
      return [];
    }
  }

  async generateAdvisorReview(carData: any): Promise<{ review: string }> {
    try {
      this.logger.log(`Solicitando reseña del Asesor IA para vehículo...`);

      const promptText = `
Eres un asesor experto en compraventa de autos en Argentina con 20 años de experiencia en agencias y concesionarias, y un fanático de los "fierros" que conoce a la perfección todos los modelos.
El usuario está viendo el siguiente vehículo y quiere tu opinión honesta y directa sobre si es una buena compra:
- Marca: ${carData.brand}
- Modelo: ${carData.model}
- Año: ${carData.year}
- Kilómetros: ${carData.km} km
- Precio publicado: $${carData.price} USD
- Estado visual evaluado por otra IA: ${carData.aiStatus || 'Desconocido'}
- Valor real de mercado calculado por la plataforma: Entre $${carData.aiPriceMin || 'desconocido'} USD y $${carData.aiPriceMax || 'desconocido'} USD.

Tu objetivo: Evalúa este auto de forma objetiva, hablále directo al comprador en un tono amable, profesional pero bien "fierrero" y coloquial (argentino). 

REGLAS ESTRICTAS PARA TU ANÁLISIS:
1. NO SEAS REPETITIVO. No pierdas tiempo resumiendo los datos que el comprador ya está viendo (no repitas el año, km o precio textualmente a menos que sea necesario para hacer una crítica).
2. APORTA VALOR MECÁNICO Y TÉCNICO: Utiliza tu enorme base de datos para mencionar características REALES de este modelo en específico (${carData.brand} ${carData.model}). Por ejemplo, hablale del espacio interior, la calidad del motor (si usa correa o cadena, si gasta mucho, si es confiable), el nivel de equipamiento, confort de marcha o costo típico de los repuestos.
3. COHERENCIA DE PRECIO: Si el "Precio publicado" es menor o igual al rango de mercado, recomendá la compra. Si es superior, advertí que está caro.
4. Escribe un párrafo unificado y fluido de máximo 4 o 5 oraciones. NO devuelvas markdown, ni viñetas, ni emojis.
5. Debes devolver EXCLUSIVAMENTE un JSON con la propiedad 'review'.
`;

      const response = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: "Eres un asesor experto automotriz argentino. Devuelve JSON." },
          { role: 'user', content: promptText }
        ],
        response_format: { type: "json_object" }
      });

      const cleanText = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(cleanText);
      
      return {
        review: parsed.review || "El vehículo se ve interesante, pero te sugiero revisarlo en persona con tu mecánico de confianza antes de tomar una decisión."
      };
    } catch (error) {
      this.logger.error('Error al generar reseña del Asesor:', error);
      return {
        review: "En este momento no puedo procesar el análisis, pero te sugiero revisar bien la publicación y consultar con un mecánico."
      };
    }
  }
}
