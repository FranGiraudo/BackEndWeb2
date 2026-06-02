// src/ai/ai.service.ts
import { Injectable } from '@nestjs/common';

export interface AiAnalysisResult {
  bodyType: string;
  aiStatus: string;
  aiDamages: string;
  aiPriceMin: number;
  aiPriceMax: number;
}

/**
 * AiService — Servicio de Análisis de Imágenes con IA
 *
 * En este entorno simula el análisis. En producción, esta lógica
 * se reemplaza con una llamada a la API de Gemini Vision o similar.
 *
 * La lógica de detección de carrocería replica exactamente la del
 * frontend (publish.js) para mantener consistencia.
 */
@Injectable()
export class AiService {
  /**
   * Analiza imágenes de un vehículo y devuelve:
   * - Tipo de carrocería detectada
   * - Estado general del vehículo
   * - Daños visibles
   * - Rango de precio sugerido
   *
   * @param brand  - Marca del vehículo
   * @param model  - Modelo del vehículo
   * @param price  - Precio ingresado por el vendedor (para calcular el rango)
   * @param imageCount - Cantidad de imágenes subidas
   */
  analyzeVehicle(
    brand: string,
    model: string,
    price: number,
    imageCount: number,
  ): AiAnalysisResult {
    const textoBusqueda = `${brand} ${model}`.toLowerCase();

    // ================================================================
    // DETECCIÓN DE CARROCERÍA
    // Diccionario de palabras clave por categoría (igual al frontend)
    // ================================================================
    const diccionarios: Record<string, string[]> = {
      Hatchback: ['golf', '208', '308', 'onix', 'sandero', 'etios', 'fiesta', 'focus', 'argo', 'mobi', 'kwid', 'up'],
      'SUV / Crossover': ['sw4', 'crv', 'tracker', 'renegade', 'duster', 'kicks', 't-cross', 'nivus', 'compass', 'hrv', 'ecosport', 'taos', 'corolla cross'],
      Pickup: ['hilux', 'amarok', 'ranger', 'frontier', 'toro', 'oroch', 's10', 'f150', 'ram', 'saveiro', 'strada'],
      Sedán: ['corolla', 'cruze', 'cronos', 'virtus', 'yaris', 'civic', 'sentra', 'logan', 'prisma'],
    };

    let bodyType = 'Sedán'; // Default
    for (const [categoria, palabras] of Object.entries(diccionarios)) {
      if (palabras.some((p) => textoBusqueda.includes(p))) {
        bodyType = categoria;
        break;
      }
    }

    // ================================================================
    // ESTIMACIÓN DE ESTADO
    // En producción: análisis real de las imágenes con Gemini Vision API
    // Aquí: lógica determinista basada en cantidad de fotos y precio
    // ================================================================
    const estados = [
      'Excelente estado',
      'Buen estado',
      'Estado regular',
      'Requiere reparación',
    ];

    // Simulación determinista: más fotos → indica más confianza → mejor score
    let aiStatus: string;
    if (imageCount >= 5) aiStatus = estados[0];
    else if (imageCount >= 3) aiStatus = estados[1];
    else if (imageCount >= 2) aiStatus = estados[2];
    else aiStatus = estados[3];

    const aiDamages =
      aiStatus === 'Excelente estado'
        ? 'Ninguno detectado'
        : aiStatus === 'Buen estado'
          ? 'Leves marcas de uso normal'
          : 'Leves rayones en paragolpes y carrocería';

    // ================================================================
    // RANGO DE PRECIO SUGERIDO (±15% del precio ingresado)
    // ================================================================
    const aiPriceMin = Math.round(price * 0.85);
    const aiPriceMax = Math.round(price * 1.15);

    return {
      bodyType,
      aiStatus,
      aiDamages,
      aiPriceMin,
      aiPriceMax,
    };
  }
}
