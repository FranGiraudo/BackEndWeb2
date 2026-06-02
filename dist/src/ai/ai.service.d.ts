export interface AiAnalysisResult {
    bodyType: string;
    aiStatus: string;
    aiDamages: string;
    aiPriceMin: number;
    aiPriceMax: number;
}
export declare class AiService {
    analyzeVehicle(brand: string, model: string, price: number, imageCount: number): AiAnalysisResult;
}
