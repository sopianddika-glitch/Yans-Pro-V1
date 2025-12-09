
import { Transaction, TransactionType, EnterpriseMetrics, Anomaly } from '../types';

export const calculateEnterpriseMetrics = (
    transactions: Transaction[], 
    currentBalance: number
): EnterpriseMetrics => {
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    // 1. Calculate Burn Rate (Avg monthly expenses over last 3 months)
    const recentExpenses = transactions
        .filter(t => t.type === TransactionType.EXPENSE && new Date(t.date) >= threeMonthsAgo)
        .reduce((sum, t) => sum + t.amount, 0);
    
    const burnRate = recentExpenses / 3; // Simplified monthly average

    // 2. Calculate Runway
    // If burn rate is 0 or negative (impossible for expense but safe check), runway is infinite (999)
    const runwayMonths = burnRate > 0 ? currentBalance / burnRate : 999;

    // 3. Estimate EBITDA (Earnings Before Interest, Taxes, Depreciation, Amortization)
    // Simplified: Net Income over last year
    const lastYearTransactions = transactions.filter(t => new Date(t.date) >= oneYearAgo);
    const revenue1Y = lastYearTransactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);
    const expense1Y = lastYearTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);
    
    const ebitdaEst = revenue1Y - expense1Y;

    // 4. Valuation Estimation
    // Common multiplier for small service businesses is 1-2x Revenue or 3-5x EBITDA
    // We'll use a conservative 3x EBITDA or 1x Revenue, whichever is higher but non-negative
    const valuationByEbitda = Math.max(0, ebitdaEst * 4);
    const valuationByRevenue = revenue1Y * 1.5;
    const valuation = Math.max(valuationByEbitda, valuationByRevenue);

    // 5. Health Score (0-100)
    let score = 50; // Base score
    if (runwayMonths > 6) score += 20;
    else if (runwayMonths < 3) score -= 20;
    
    if (ebitdaEst > 0) score += 20;
    else score -= 10;

    // Growth check (compare last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date(); sixtyDaysAgo.setDate(now.getDate() - 60);
    
    const revLast30 = transactions
        .filter(t => t.type === TransactionType.INCOME && new Date(t.date) >= thirtyDaysAgo)
        .reduce((sum, t) => sum + t.amount, 0);
    const revPrev30 = transactions
        .filter(t => t.type === TransactionType.INCOME && new Date(t.date) < thirtyDaysAgo && new Date(t.date) >= sixtyDaysAgo)
        .reduce((sum, t) => sum + t.amount, 0);
    
    if (revLast30 > revPrev30) score += 10;

    return {
        valuation,
        burnRate,
        runwayMonths: Math.min(runwayMonths, 99), // Cap for display
        healthScore: Math.min(Math.max(score, 0), 100),
        ebitdaEst
    };
};

export const detectAnomalies = (transactions: Transaction[]): Anomaly[] => {
    const anomalies: Anomaly[] = [];
    const recentTransactions = transactions.slice(-100); // Analyze last 100

    // 1. High Value Detection
    // Calculate mean and std deviation for expenses
    const expenses = recentTransactions.filter(t => t.type === TransactionType.EXPENSE).map(t => t.amount);
    if (expenses.length > 5) {
        const mean = expenses.reduce((a, b) => a + b, 0) / expenses.length;
        const variance = expenses.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / expenses.length;
        const stdDev = Math.sqrt(variance);
        const threshold = mean + (stdDev * 3); // 3 Sigma

        recentTransactions.filter(t => t.type === TransactionType.EXPENSE && t.amount > threshold).forEach(t => {
            anomalies.push({
                id: `anom-${t.id}`,
                transactionId: t.id,
                type: 'high_value',
                description: `Unusually high expense: ${t.amount.toLocaleString()} is significantly above average.`,
                severity: 'high'
            });
        });
    }

    // 2. Duplicate Potential
    // Same amount and description within 24 hours
    for (let i = 0; i < recentTransactions.length; i++) {
        for (let j = i + 1; j < recentTransactions.length; j++) {
            const t1 = recentTransactions[i];
            const t2 = recentTransactions[j];
            
            if (t1.amount === t2.amount && t1.description === t2.description && t1.type === t2.type) {
                const date1 = new Date(t1.date);
                const date2 = new Date(t2.date);
                const diffTime = Math.abs(date2.getTime() - date1.getTime());
                const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

                if (diffHours < 24) {
                    // Check if already added
                    if (!anomalies.some(a => a.transactionId === t2.id && a.type === 'duplicate_potential')) {
                         anomalies.push({
                            id: `anom-dup-${t2.id}`,
                            transactionId: t2.id,
                            type: 'duplicate_potential',
                            description: `Potential duplicate of transaction on ${date1.toLocaleDateString()}.`,
                            severity: 'medium'
                        });
                    }
                }
            }
        }
    }

    // 3. Off-Hours Activity (1 AM to 5 AM)
    recentTransactions.forEach(t => {
        const date = new Date(t.date);
        const hour = date.getHours();
        
        // Check if transaction is between 1:00 AM and 5:00 AM
        if (hour >= 1 && hour < 5) {
             anomalies.push({
                id: `anom-time-${t.id}`,
                transactionId: t.id,
                type: 'off_hours',
                description: `Transaction occurred during unusual hours (${date.toLocaleTimeString()}).`,
                severity: 'medium'
            });
        }
    });

    return anomalies;
};
