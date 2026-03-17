export interface StockItem {
	id: string;
	itemName: string;
	count: number;
	confidence: number; // 0-1
	rawTranscript: string;
}

export interface LLMService {
	parseStockItem(transcript: string, products: string[]): Promise<StockItem | null>;
}
