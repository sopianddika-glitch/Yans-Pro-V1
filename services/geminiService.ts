
 
// ===== compatibility fallback for analyzeReceipt =====
export async function analyzeReceipt(data: any): Promise<any> {
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
    ok: false,
    name: 'getBudgetSuggestion',
    note: 'Development fallback: implement getBudgetSuggestion in services/geminiService.ts'
  };
}

export async function getGoalSuggestion(...args: any[]): Promise<any> {
  // compatibility fallback mock (auto-generated)
  // TODO: replace with real implementation in services/geminiService.ts
  return {
    ok: false,
    name: 'getGoalSuggestion',
    note: 'Development fallback: implement getGoalSuggestion in services/geminiService.ts'
  };
}

export async function searchAssets(...args: any[]): Promise<any> {
  // compatibility fallback mock (auto-generated)
  // TODO: replace with real implementation in services/geminiService.ts
  return {
    ok: false,
    name: 'searchAssets',
    note: 'Development fallback: implement searchAssets in services/geminiService.ts'
  };
}

export async function generateCashFlowForecast(...args: any[]): Promise<any> {
  // compatibility fallback mock (auto-generated)
  // TODO: replace with real implementation in services/geminiService.ts
  return {
    ok: false,
    name: 'generateCashFlowForecast',
    note: 'Development fallback: implement generateCashFlowForecast in services/geminiService.ts'
  };
}

export async function getInvoiceReminderDraft(...args: any[]): Promise<any> {
  // compatibility fallback mock (auto-generated)
  // TODO: replace with real implementation in services/geminiService.ts
  return {
    ok: false,
    name: 'getInvoiceReminderDraft',
    note: 'Development fallback: implement getInvoiceReminderDraft in services/geminiService.ts'
  };
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
  return {
    ok: false,
    name: 'getPortfolioMarketData',
    note: 'Development fallback: implement getPortfolioMarketData in services/geminiService.ts'
  };
}

export async function getMarketRecommendations(...args: any[]): Promise<any> {
  // compatibility fallback mock (auto-generated)
  // TODO: replace with real implementation in services/geminiService.ts
  return {
    ok: false,
    name: 'getMarketRecommendations',
    note: 'Development fallback: implement getMarketRecommendations in services/geminiService.ts'
  };
}

export async function getAiPortfolioAnalysis(...args: any[]): Promise<any> {
  // compatibility fallback mock (auto-generated)
  // TODO: replace with real implementation in services/geminiService.ts
  return {
    ok: false,
    name: 'getAiPortfolioAnalysis',
    note: 'Development fallback: implement getAiPortfolioAnalysis in services/geminiService.ts'
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

