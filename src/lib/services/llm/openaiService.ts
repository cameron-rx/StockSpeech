import { supabase } from '../../lib/supabase'
import type { LLMService, StockItem } from './types'

export class OpenAIService implements LLMService {
  async parseStockItem(transcript: string, products: string[]): Promise<StockItem | null> {
    if (products.length === 0) return null

    try {
      const { data: parsed, error } = await supabase.functions.invoke<{ itemName: string; count: number; confidence: number } | null>('parse-stock-item', {
        body: { transcript, products },
      })

      if (error) return null
      if (!parsed) return null

      return { ...parsed, rawTranscript: transcript }
    } catch {
      return null
    }
  }
}
