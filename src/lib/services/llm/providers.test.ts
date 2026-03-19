import { describe, it } from 'vitest';
import { createOpenAIParser } from './openaiProvider';
import { createGeminiParser } from './geminiProvider';
import { createGroqParser } from './groqProvider';
import type { ParsedItem } from './openaiProvider';

//const OPEN_AI_API_KEY = process.env.OPEN_AI_API_KEY ?? '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';
const GROQ_API_KEY = process.env.GROQ_API_KEY ?? '';

const TEST_PRODUCTS = ["Captain Morgan's Spiced", 'Orange Juice', 'Heineken', 'Corona', 'Amstel'];

type TestCase = {
	transcript: string;
	expected: ParsedItem[];
};

const TEST_CASES: TestCase[] = [
	{
		transcript: "1 Captain Morgan's Spiced, 24 Heineken, .75 Amstel",
		expected: [
			{ itemName: "Captain Morgan's Spiced", count: 1, confidence: 1 },
			{ itemName: 'Heineken', count: 24, confidence: 1 },
			{ itemName: 'Amstel', count: 0.75, confidence: 1 }
		]
	},
	{
		transcript: '12 Corona',
		expected: [{ itemName: 'Corona', count: 12, confidence: 1 }]
	},
	{
		transcript: '1.5 Amstel, 5 Orange Juice, 13 Heineken',
		expected: [
			{ itemName: 'Amstel', count: 1.5, confidence: 1 },
			{ itemName: 'Orange Juice', count: 5, confidence: 1 },
			{ itemName: 'Heineken', count: 13, confidence: 1 }
		]
	},
	{
		transcript: '2.5 Guinness, 2 Amstel',
		// Guinness is not in the product list, should be excluded
		expected: [{ itemName: 'Amstel', count: 2, confidence: 1 }]
	},
	{
		transcript: '2.5 Kraken Spiced Rum',
		// Nothing matches the product list
		expected: []
	}
];

type RunResult = {
	transcript: string;
	actual: ParsedItem[];
	expected: ParsedItem[];
	durationMs: number;
	error?: string;
};

type ProviderResult = {
	provider: string;
	runs: RunResult[];
	error?: string;
};

async function benchmarkProvider(
	label: string,
	parse: ReturnType<typeof createOpenAIParser>
): Promise<ProviderResult> {
	const runs: RunResult[] = [];

	for (const { transcript, expected } of TEST_CASES) {
		const start = performance.now();
		try {
			const actual = await parse(transcript, TEST_PRODUCTS);
			runs.push({
				transcript,
				actual,
				expected,
				durationMs: Math.round(performance.now() - start)
			});
		} catch (e) {
			return {
				provider: label,
				runs,
				error: e instanceof Error ? e.message : String(e)
			};
		}
	}

	return { provider: label, runs };
}

function formatItems(items: ParsedItem[]): string {
	if (items.length === 0) return '(none)';
	return items.map((i) => `${i.itemName}: ${i.count} (conf: ${i.confidence})`).join(', ');
}

function printResults(results: ProviderResult[]) {
	console.log('\n======= Provider Benchmark Results =======');

	for (const r of results) {
		console.log(`\n  ${r.provider}`);
		if (r.error) {
			console.log(`  FAILED: ${r.error}`);
			continue;
		}

		for (const [i, run] of r.runs.entries()) {
			console.log(`\n  #${i + 1} (${run.durationMs}ms) — "${run.transcript}"`);
			console.log(`    Expected : ${formatItems(run.expected)}`);
			console.log(`    Actual   : ${formatItems(run.actual)}`);
		}

		const runMs = r.runs.map((r) => r.durationMs);
		const total = runMs.reduce((a, b) => a + b, 0);
		const avg = Math.round(total / runMs.length);
		console.log(`\n  First : ${runMs[0]}ms`);
		console.log(`  Total : ${total}ms`);
		console.log(`  Avg   : ${avg}ms`);
		const cacheSpeedup = runMs[0] - avg;
		if (cacheSpeedup > 50) {
			console.log(`  Cache : avg ${cacheSpeedup}ms faster than first request`);
		}
	}

	const succeeded = results.filter((r) => !r.error);
	if (succeeded.length > 1) {
		console.log('\n--- Comparison ---');
		const byFirst = [...succeeded].sort((a, b) => a.runs[0].durationMs - b.runs[0].durationMs);
		const total = (r: ProviderResult) => r.runs.reduce((sum, run) => sum + run.durationMs, 0);
		const byTotal = [...succeeded].sort((a, b) => total(a) - total(b));
		console.log(
			`  Fastest first request : ${byFirst[0].provider} (${byFirst[0].runs[0].durationMs}ms)`
		);
		console.log(`  Fastest total (5 runs): ${byTotal[0].provider} (${total(byTotal[0])}ms)`);
	}

	console.log('\n==========================================\n');
}

describe('LLM Provider Benchmark', () => {
	it('compares first request and total time across providers', { timeout: 120_000 }, async () => {
		const jobs: Promise<ProviderResult>[] = [];

		/*
		if (OPEN_AI_API_KEY) {
			const openaiModels = ['gpt-5.4-mini'];
			for (const model of openaiModels) {
				jobs.push(benchmarkProvider(`OpenAI (${model})`, createOpenAIParser(OPEN_AI_API_KEY, model)));
			}
		} else {
			console.warn('Skipping OpenAI — OPEN_AI_API_KEY not set');
		}
		*/

		if (GEMINI_API_KEY) {
			const geminiModels = [
				'gemini-2.5-flash',
				'gemini-3-flash-preview',
				'gemini-3.1-flash-lite-preview'
			];
			for (const model of geminiModels) {
				jobs.push(
					benchmarkProvider(`Gemini (${model})`, createGeminiParser(GEMINI_API_KEY, model))
				);
			}
		} else {
			console.warn('Skipping Gemini — GEMINI_API_KEY not set');
		}

		if (GROQ_API_KEY) {
			const groqModels = [
				'openai/gpt-oss-20b',
				'openai/gpt-oss-120b',
				'meta-llama/llama-4-scout-17b-16e-instruct',
				'qwen/qwen3-32b',
				'meta-llama/llama-4-maverick-17b-128e-instruct',
				'llama-3.3-70b-versatile'
			];
			for (const model of groqModels) {
				jobs.push(benchmarkProvider(`Groq (${model})`, createGroqParser(GROQ_API_KEY, model)));
			}
		} else {
			console.warn('Skipping Groq — GROQ_API_KEY not set');
		}

		if (jobs.length === 0) {
			console.warn('No API keys configured — nothing to benchmark');
			return;
		}

		// Providers run in parallel, but each provider's runs are sequential
		// so per-provider caching behaviour is measured accurately
		const results = await Promise.all(jobs);
		printResults(results);
	});
});
