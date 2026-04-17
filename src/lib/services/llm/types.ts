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

/** A single item extracted by an LLM provider. */
export type ParsedItem = { itemName: string; count: number; confidence: number };

/** Signature shared by every LLM transcript-parsing function. */
export type ParseTranscriptFn = (transcript: string, products: string[]) => Promise<ParsedItem[]>;
