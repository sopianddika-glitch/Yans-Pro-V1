
export enum TransactionType {
  INCOME = 'Income',
  EXPENSE = 'Expense',
}

export enum Frequency {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    YEARLY = 'yearly'
}

export enum InvoiceStatus {
    DRAFT = 'Draft',
    SENT = 'Sent',
    PAID = 'Paid',
    OVERDUE = 'Overdue',
}

export interface Transaction {
  id: string;
  date: string; // ISO string format YYYY-MM-DDTHH:mm:ssZ
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  recurringTransactionId?: string;
  invoiceId?: string;
  productId?: string;
  clientId?: string;
  // New fields for Audit/Soft Delete
  deletedAt?: string | null; 
  lastModified?: string;
}

// New Interface for Audit Logs
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';

export interface TransactionAudit {
    id: string;
    transactionId: string;
    action: AuditAction;
    timestamp: string;
    changes?: {
        field: string;
        oldValue: unknown;
        newValue: unknown;
    }[];
    description?: string;
}

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  frequency: Frequency;
  interval: number;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD
}

export interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    price: number;
}

export interface Invoice {
    id:string;
    profileId: string;
    clientName: string;
    issueDate: string; // YYYY-MM-DD
    dueDate: string; // YYYY-MM-DD
    items: InvoiceItem[];
    notes?: string;
    status: InvoiceStatus;
    transactionId?: string;
}

export interface FinancialSummary {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    balance: number;
}

export interface Category {
  id:string;
  name: string;
  type: TransactionType;
  parentId?: string | null;
}

export interface TransactionGroup {
    title: string;
    transactions: Transaction[];
    total: number;
}

export type Page = 'dashboard' | 'transactions' | 'reports' | 'settings' | 'budgets' | 'invoices' | 'invoice-editor' | 'goals' | 'products' | 'pos' | 'clients' | 'investments' | 'enterprise';

export interface ReceiptAnalysisResult {
  vendor: string;
  date: string; // YYYY-MM-DD
  totalAmount: number;
}

export type BudgetPeriod = 'monthly' | 'yearly';

export interface Budget {
    id: string;
    categoryId: string;
    amount: number;
    period: BudgetPeriod;
}

export interface BudgetSuggestionResult {
    suggestedAmount: number;
    explanation: string;
}

export interface Profile {
  id: string;
  name: string;
  currency: string; // e.g., 'USD', 'IDR', 'EUR'
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string; // NPWP or similar
  settings?: {
      allowEdit?: boolean;
      showDeleted?: boolean;
      investmentsEnabled?: boolean;
  };
}

export type Theme = 'light' | 'dark' | 'system';

export type SupportedLocale = 'en' | 'id';

export interface Language {
    code: SupportedLocale;
    name: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string | null;
  createdAt: string; // ISO String
}

export interface GoalSuggestion {
    name: string;
    targetAmount: number;
    reasoning: string;
}

export type ProductType = 'service' | 'good';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  type: ProductType;
  // Inventory fields
  sku?: string;
  trackStock?: boolean;
  stock?: number;
  minStock?: number;
}

export interface Client {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    createdAt: string;
}

export interface CartItem extends Product {
    quantity: number;
}

export interface ChatMessage {
    role: 'user' | 'ai';
    content: string;
    isActionConfirmation?: boolean;
}

export interface AiActionResponse {
    responseType: 'ANSWER' | 'ACTION';
    responseText: string;
    action?: {
        type: 'add_transaction' | 'create_invoice' | 'add_product';
        params: Record<string, unknown>;
    };
}

export interface CashFlowPoint {
    month: string;
    historicalAmount?: number;
    forecastAmount?: number;
    isForecast: boolean;
    reasoning?: string;
}

// --- INVESTMENT & ENTERPRISE TYPES ---

export type AssetType = 'Stock' | 'Crypto' | 'Bond' | 'Real Estate' | 'Mutual Fund' | 'Cash';

export interface Investment {
    id: string;
    symbol: string; // Ticker or Identifier
    name: string;
    quantity: number;
    avgBuyPrice: number;
    currentPrice?: number;
    type: AssetType;
    targetAllocation?: number; // Desired % of portfolio
    lastUpdated?: string;
}

export interface MarketTrendRecommendation {
    sector: string;
    sentiment: 'Bullish' | 'Bearish' | 'Neutral';
    reasoning: string;
    riskLevel: 'Low' | 'Medium' | 'High';
    suggestedAction: 'Buy' | 'Hold' | 'Watch';
}

export interface PortfolioSuggestion {
    symbol: string;
    name: string;
    action: 'Buy' | 'Sell' | 'Hold' | 'Rebalance';
    reasoning: string;
    riskLevel: 'Low' | 'Medium' | 'High';
    targetPrice?: number;
}

export interface Anomaly {
    id: string;
    transactionId: string;
    type: 'high_value' | 'duplicate_potential' | 'off_hours';
    description: string;
    severity: 'medium' | 'high';
}

export interface EnterpriseMetrics {
    valuation: number;
    burnRate: number;
    runwayMonths: number;
    healthScore: number; // 0-100
    ebitdaEst: number;
}

export type NotificationType = 'success' | 'error' | 'info';

export interface AppNotification {
    id: string;
    type: NotificationType;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
}
