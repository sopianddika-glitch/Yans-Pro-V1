
 
// ===== compatibility fallback for analyzeReceipt =====
export async function analyzeReceipt(data: any, _mimeType?: string): Promise<any> {
  // Fallback mock used during development/build if real implementation is missing.
  // Structure should match ReceiptAnalysisResult expected by components.
  return {
    vendor: 'Mock Store',
    date: new Date().toISOString(),
    total: 0,
    items: []
  };
}

// ===== compatibility exports auto-appended =====

export async function getChatResponse(...args: any[]): Promise<any> {
  // compatibility fallback mock (auto-generated)
  // TODO: replace with real implementation in services/geminiService.ts
  return {
    ok: false,
    name: 'getChatResponse',
    note: 'Development fallback: implement getChatResponse in services/geminiService.ts'
  };
}

export async function getBudgetSuggestion(...args: any[]): Promise<any> {
  // compatibility fallback mock (auto-generated)
  // TODO: replace with real implementation in services/geminiService.ts
  return {
    suggestedAmount: 0,
    explanation: 'AI budget suggestions are unavailable in this build.'
  };
}

export async function getGoalSuggestion(...args: any[]): Promise<any> {
  // compatibility fallback mock (auto-generated)
  // TODO: replace with real implementation in services/geminiService.ts
  return {
    name: 'Suggested Goal',
    targetAmount: 0,
    reasoning: 'AI goal suggestions are unavailable in this build.'
  };
}

export async function searchAssets(...args: any[]): Promise<any> {
  // compatibility fallback mock (auto-generated)
  // TODO: replace with real implementation in services/geminiService.ts
  return [];
}

export async function generateCashFlowForecast(...args: any[]): Promise<any> {
  // compatibility fallback mock (auto-generated)
  // TODO: replace with real implementation in services/geminiService.ts
  return [];
}

export async function getInvoiceReminderDraft(...args: any[]): Promise<any> {
  // compatibility fallback mock (auto-generated)
  // TODO: replace with real implementation in services/geminiService.ts
  return 'AI reminder drafting is unavailable in this build.';
}

export async function generateExecutiveSummary(...args: any[]): Promise<any> {
  // compatibility fallback mock (auto-generated)
  // TODO: replace with real implementation in services/geminiService.ts
  return {
    ok: false,
    name: 'generateExecutiveSummary',
    note: 'Development fallback: implement generateExecutiveSummary in services/geminiService.ts'
  };
}

export async function getPortfolioMarketData(...args: any[]): Promise<any> {
  // compatibility fallback mock (auto-generated)
  // TODO: replace with real implementation in services/geminiService.ts
  return {};
}

export async function getMarketRecommendations(...args: any[]): Promise<any> {
  // compatibility fallback mock (auto-generated)
  // TODO: replace with real implementation in services/geminiService.ts
  return {
    recommendations: [],
    sources: []
  };
}

export async function getAiPortfolioAnalysis(...args: any[]): Promise<any> {
  // compatibility fallback mock (auto-generated)
  // TODO: replace with real implementation in services/geminiService.ts
  return {
    suggestions: [],
    sources: []
  };
}

export async function analyzeFinancialData(...args: any[]): Promise<any> {
  // compatibility fallback mock (auto-generated)
  // TODO: replace with real implementation in services/geminiService.ts
  return {
    ok: false,
    name: 'analyzeFinancialData',
    note: 'Development fallback: implement analyzeFinancialData in services/geminiService.ts'
  };
}

export async function getFinancialAnalysis(...args: any[]): Promise<any> {
  // compatibility fallback mock (auto-generated)
  // TODO: replace with real implementation in services/geminiService.ts
  return {
    ok: false,
    name: 'getFinancialAnalysis',
    note: 'Development fallback: implement analyzeFinancialData in services/geminiService.ts'
  };
}

export const analyzeReceiptImage = analyzeReceipt;

