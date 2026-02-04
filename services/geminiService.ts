import type {
  ReceiptAnalysisResult,
  BudgetSuggestionResult,
  GoalSuggestion,
  MarketTrendRecommendation,
  PortfolioSuggestion,
  CashFlowPoint,
  AssetType,
  AiActionResponse,
  Invoice,
  Transaction,
  Category,
  FinancialSummary,
  Investment,
  EnterpriseMetrics,
  Anomaly,
} from '../types';

export type AssetSearchResult = {
  symbol: string;
  name: string;
  type: AssetType;
  currentPrice: number;
};

// ===== compatibility fallback for analyzeReceipt =====
export async function analyzeReceipt(_base64Image: string, _mimeType?: string): Promise<ReceiptAnalysisResult> {
  return {
    vendor: 'Mock Store',
    date: new Date().toISOString().split('T')[0],
    totalAmount: 0,
  };
}

// ===== compatibility exports auto-appended =====

export async function getChatResponse(..._args: unknown[]): Promise<AiActionResponse> {
  return {
    responseType: 'ANSWER',
    responseText: 'AI not configured. Please connect a provider in services/geminiService.ts.',
  };
}

export async function getBudgetSuggestion(
  _categoryId: string,
  _categories: Category[],
  _transactions: Transaction[]
): Promise<BudgetSuggestionResult> {
  return {
    suggestedAmount: 0,
    explanation: 'AI budget suggestion is not configured yet.',
  };
}

export async function getGoalSuggestion(_query: string, _currency: string): Promise<GoalSuggestion> {
  return {
    name: 'New Goal',
    targetAmount: 0,
    reasoning: 'AI goal suggestion is not configured yet.',
  };
}

export async function searchAssets(_query: string): Promise<AssetSearchResult[]> {
  return [];
}

export async function generateCashFlowForecast(_input: Array<{ month: string; netFlow: number }>): Promise<CashFlowPoint[]> {
  return [];
}

export async function getInvoiceReminderDraft(_invoice: Invoice, _profileName: string): Promise<string> {
  return 'Reminder draft is not available yet.';
}

export async function generateExecutiveSummary(
  _metrics: EnterpriseMetrics,
  _anomalies: Anomaly[],
  _profileName: string
): Promise<string> {
  return 'Executive summary is not available yet.';
}

export async function getPortfolioMarketData(
  _symbols: string[],
  currentPrices: Record<string, number>
): Promise<Record<string, number>> {
  return { ...currentPrices };
}

export async function getMarketRecommendations(): Promise<{
  recommendations: MarketTrendRecommendation[];
  sources: { title: string; uri: string }[];
}> {
  return { recommendations: [], sources: [] };
}

export async function getAiPortfolioAnalysis(
  _investments: Investment[],
  _portfolioValue: number
): Promise<{ suggestions: PortfolioSuggestion[]; sources: { title: string; uri: string }[] }> {
  return { suggestions: [], sources: [] };
}

export async function analyzeFinancialData(..._args: unknown[]): Promise<string> {
  return 'Financial analysis is not available yet.';
}

export async function getFinancialAnalysis(
  _transactions: Transaction[],
  _summary: FinancialSummary,
  _query: string
): Promise<{ text: string; sources: { title: string; uri: string }[] }> {
  return { text: 'Financial insight is not available yet.', sources: [] };
}

export const analyzeReceiptImage = analyzeReceipt;
