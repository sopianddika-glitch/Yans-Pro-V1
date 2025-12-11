
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Investment, MarketTrendRecommendation, PortfolioSuggestion } from '../types';
import { AddIcon, TrendingUpIcon, SparklesIcon, DeleteIcon, ProfitIcon, BalanceIcon, BriefcaseIcon, CheckIcon } from '../components/Icons';
import { useI18n } from '../hooks/useI18n';
import AddInvestmentModal from '../components/AddInvestmentModal';
import ManageInvestmentModal from '../components/ManageInvestmentModal';
import PortfolioAdvisorModal from '../components/PortfolioAdvisorModal';
import { getPortfolioMarketData, getMarketRecommendations, getAiPortfolioAnalysis } from '../services/geminiService';
import { Treemap, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface InvestmentsPageProps {
    investments: Investment[];
    currency: string;
    operatingBalance: number;
    onAddInvestment: (investment: Omit<Investment, 'id' | 'currentPrice'>) => void;
    onDeleteInvestment: (id: string) => void;
    onUpdatePrices: (prices: { [symbol: string]: number }) => void;
    onBatchUpdate: (investments: Investment[]) => void;
}

const COLORS = ['#2F81F7', '#2DA44E', '#E5534B', '#DB6D28', '#A371F7', '#087D9A'];

// --- SAP 2025 Widget Component ---
const SapStructureWidget: React.FC<{ investments: Investment[], currentValue: number }> = ({ investments, currentValue }) => {
    const { t } = useI18n();

    // Logic to categorize investments
    const structure = useMemo(() => {
        let core = 0;
        let satellite = 0;
        let defensive = 0;

        investments.forEach(inv => {
            const value = (inv.currentPrice || inv.avgBuyPrice) * inv.quantity;
            switch(inv.type) {
                case 'Stock':
                case 'Real Estate':
                case 'Mutual Fund':
                    core += value;
                    break;
                case 'Crypto':
                    satellite += value;
                    break;
                case 'Bond':
                case 'Cash':
                    defensive += value;
                    break;
                default:
                    core += value;
            }
        });

        const total = Math.max(currentValue, 1); // Avoid division by zero
        return {
            core: { value: core, percent: (core / total) * 100, target: 60 },
            satellite: { value: satellite, percent: (satellite / total) * 100, target: 15 },
            defensive: { value: defensive, percent: (defensive / total) * 100, target: 25 }
        };
    }, [investments, currentValue]);

    return (
        <div className="bg-white dark:bg-brand-secondary p-6 rounded-xl shadow-md border-l-4 border-purple-500">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    {t('sap2025.title')}
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full dark:bg-purple-900 dark:text-purple-300">AI Strategy</span>
                </h3>
                <p className="text-sm text-gray-500 dark:text-brand-muted">{t('sap2025.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Core Bucket */}
                <div className="bg-gray-50 dark:bg-brand-primary p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-800 dark:text-white">{t('sap2025.core')}</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">{structure.core.percent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(structure.core.percent, 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{t('sap2025.target')}: {structure.core.target}%</span>
                        <span className={Math.abs(structure.core.percent - structure.core.target) > 5 ? 'text-orange-500' : 'text-green-500'}>
                            {structure.core.percent > structure.core.target ? '+' : ''}{(structure.core.percent - structure.core.target).toFixed(1)}%
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">{t('sap2025.coreDesc')}</p>
                </div>

                {/* Satellite Bucket */}
                <div className="bg-gray-50 dark:bg-brand-primary p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-800 dark:text-white">{t('sap2025.satellite')}</span>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-mono">{structure.satellite.percent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
                        <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${Math.min(structure.satellite.percent, 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{t('sap2025.target')}: {structure.satellite.target}%</span>
                        <span className={Math.abs(structure.satellite.percent - structure.satellite.target) > 5 ? 'text-orange-500' : 'text-green-500'}>
                            {structure.satellite.percent > structure.satellite.target ? '+' : ''}{(structure.satellite.percent - structure.satellite.target).toFixed(1)}%
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">{t('sap2025.satelliteDesc')}</p>
                </div>

                {/* Defensive Bucket */}
                <div className="bg-gray-50 dark:bg-brand-primary p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-800 dark:text-white">{t('sap2025.defensive')}</span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-mono">{structure.defensive.percent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
                        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${Math.min(structure.defensive.percent, 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{t('sap2025.target')}: {structure.defensive.target}%</span>
                        <span className={Math.abs(structure.defensive.percent - structure.defensive.target) > 5 ? 'text-orange-500' : 'text-green-500'}>
                            {structure.defensive.percent > structure.defensive.target ? '+' : ''}{(structure.defensive.percent - structure.defensive.target).toFixed(1)}%
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">{t('sap2025.defensiveDesc')}</p>
                </div>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3">
                <span className="font-semibold">DATA SOURCES:</span>
                <span>Yahoo Finance API</span>
                <span>•</span>
                <span>Bloomberg</span>
                <span>•</span>
                <span>CoinMarketCap</span>
                <span>•</span>
                <span>TradingView</span>
                <span>•</span>
                <span>FRED</span>
            </div>
        </div>
    );
};


const InvestmentsPage: React.FC<InvestmentsPageProps> = ({ investments, currency, operatingBalance, onAddInvestment, onDeleteInvestment, onUpdatePrices, onBatchUpdate }) => {
    const { t } = useI18n();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [recommendations, setRecommendations] = useState<MarketTrendRecommendation[]>([]);
    const [recommendationSources, setRecommendationSources] = useState<{ title: string; uri: string }[]>([]);
    const [isLoadingRecs, setIsLoadingRecs] = useState(false);
    
    // Advisor State
    const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
    const [advisorSuggestions, setAdvisorSuggestions] = useState<PortfolioSuggestion[]>([]);
    const [advisorSources, setAdvisorSources] = useState<{ title: string; uri: string }[]>([]);
    const [isLoadingAdvisor, setIsLoadingAdvisor] = useState(false);
    
    // Manage Modal State
    const [managingAsset, setManagingAsset] = useState<Investment | null>(null);

    // Initial load for recommendations
    useEffect(() => {
        if (recommendations.length === 0) {
            handleRefreshRecommendations();
        }
    }, []);

    // Ensure Cash Wallet Exists
    const cashWallet = useMemo(() => {
        return investments.find(inv => inv.type === 'Cash') || {
            id: 'virtual-cash', 
            symbol: currency, 
            name: 'Cash Wallet', 
            quantity: 0, 
            avgBuyPrice: 1, 
            currentPrice: 1, 
            type: 'Cash'
        } as Investment;
    }, [investments, currency]);

    // --- Derived Data ---

    const portfolioSummary = useMemo(() => {
        let totalInvested = 0;
        let currentValue = 0;

        investments.forEach(inv => {
            if (inv.type === 'Cash') {
                currentValue += inv.quantity; // Cash is 1:1
                totalInvested += inv.quantity; 
            } else {
                totalInvested += inv.avgBuyPrice * inv.quantity;
                currentValue += (inv.currentPrice || inv.avgBuyPrice) * inv.quantity;
            }
        });

        const nonCashInvested = investments.filter(i => i.type !== 'Cash').reduce((sum, i) => sum + i.avgBuyPrice * i.quantity, 0);
        const nonCashValue = investments.filter(i => i.type !== 'Cash').reduce((sum, i) => sum + (i.currentPrice || i.avgBuyPrice) * i.quantity, 0);
        
        const totalReturn = nonCashValue - nonCashInvested;
        const returnPercentage = nonCashInvested > 0 ? (totalReturn / nonCashInvested) * 100 : 0;

        return { currentValue, totalReturn, returnPercentage };
    }, [investments]);

    // Calculate Grand Total
    const totalCompanyFunds = operatingBalance + portfolioSummary.currentValue;

    const handleRefreshPrices = async () => {
        setIsRefreshing(true);
        const symbols = investments.filter(i => i.type !== 'Cash').map(inv => inv.symbol);
        
        // Map current prices for simulation fallback
        const currentPrices: {[key: string]: number} = {};
        investments.forEach(inv => {
            if (inv.type !== 'Cash') {
                currentPrices[inv.symbol] = inv.currentPrice || inv.avgBuyPrice;
            }
        });

        const prices = await getPortfolioMarketData(symbols, currentPrices);
        onUpdatePrices(prices);
        setIsRefreshing(false);
    };

    const handleRefreshRecommendations = async () => {
        setIsLoadingRecs(true);
        const { recommendations: recs, sources } = await getMarketRecommendations();
        setRecommendations(recs);
        setRecommendationSources(sources);
        setIsLoadingRecs(false);
    };

    const handleGetAiAdvice = async () => {
        setIsAdvisorOpen(true);
        setIsLoadingAdvisor(true);
        setAdvisorSuggestions([]); // Clear previous
        setAdvisorSources([]);
        try {
            const { suggestions, sources } = await getAiPortfolioAnalysis(investments, portfolioSummary.currentValue);
            setAdvisorSuggestions(suggestions);
            setAdvisorSources(sources);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingAdvisor(false);
        }
    };

    // --- Helpers for Modal Actions ---

    const handleWalletAction = (amount: number, isDeposit: boolean) => {
        const newQty = isDeposit ? cashWallet.quantity + amount : cashWallet.quantity - amount;
        if (newQty < 0) return alert("Insufficient funds");
        
        const updatedCash: Investment = { ...cashWallet, quantity: newQty };
        
        if (updatedCash.id === 'virtual-cash') {
            updatedCash.id = 'inv-cash-' + new Date().getTime();
        }
        onBatchUpdate([updatedCash]);
    };

    const handleBuyAsset = (qty: number, price: number) => {
        if (!managingAsset) return;
        const cost = qty * price;
        
        // Update Cash
        let updatedCash = { ...cashWallet };
        updatedCash.quantity -= cost;
        if (updatedCash.id === 'virtual-cash') updatedCash.id = 'inv-cash-' + new Date().getTime();

        // Update Asset (Weighted Average)
        const oldTotalCost = managingAsset.quantity * managingAsset.avgBuyPrice;
        const newTotalCost = oldTotalCost + cost;
        const newTotalQty = managingAsset.quantity + qty;
        const newAvgPrice = newTotalQty > 0 ? newTotalCost / newTotalQty : price;

        const updatedAsset = {
            ...managingAsset,
            quantity: newTotalQty,
            avgBuyPrice: newAvgPrice,
            currentPrice: price 
        };

        onBatchUpdate([updatedCash, updatedAsset]);
    };

    const handleSellAsset = (qty: number, price: number) => {
        if (!managingAsset) return;
        const proceeds = qty * price;

        // Update Cash
        let updatedCash = { ...cashWallet };
        updatedCash.quantity += proceeds;
        if (updatedCash.id === 'virtual-cash') updatedCash.id = 'inv-cash-' + new Date().getTime();

        // Update Asset
        const updatedAsset = {
            ...managingAsset,
            quantity: managingAsset.quantity - qty,
            currentPrice: price
        };

        onBatchUpdate([updatedCash, updatedAsset]);
    };

    const handleUpdateTarget = (targetPercent: number) => {
        if (!managingAsset) return;
        onBatchUpdate([{ ...managingAsset, targetAllocation: targetPercent }]);
    };

    const treemapData = useMemo(() => {
        return investments
            .filter(inv => inv.type !== 'Cash' && inv.quantity > 0)
            .map(inv => ({
                name: inv.symbol,
                size: (inv.currentPrice || inv.avgBuyPrice) * inv.quantity,
                fill: '#8884d8' // Will be overridden
            }))
            .sort((a, b) => b.size - a.size);
    }, [investments]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(val);

    // Custom Treemap Content
    const CustomizedContent = (props: any) => {
        const { root, depth, x, y, width, height, index, name, size } = props;
        return (
            <g>
                <rect x={x} y={y} width={width} height={height} style={{ fill: COLORS[index % COLORS.length], stroke: '#fff', strokeWidth: 2, opacity: 0.9 }} />
                {width > 30 && height > 30 && (
                    <text x={x + width / 2} y={y + height / 2 + 7} textAnchor="middle" fill="#fff" fontSize={12} fontWeight="bold">
                        {name}
                    </text>
                )}
            </g>
        );
    };

    const handleDelete = (id: string) => {
        if (window.confirm(t('investmentsPage.table.deleteConfirm'))) {
            onDeleteInvestment(id);
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-brand-primary min-h-full space-y-6">
            
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{t('investmentsPage.title')}</h1>
                <div className="flex flex-wrap gap-2">
                    <button onClick={handleGetAiAdvice} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-md">
                        <SparklesIcon className="w-5 h-5" />
                        {t('portfolioAdvisor.getAdvice')}
                    </button>
                    <button onClick={handleRefreshPrices} disabled={isRefreshing} className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50">
                        <TrendingUpIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? t('investmentsPage.refreshing') : t('investmentsPage.refresh')}
                    </button>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-brand-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold transition-colors">
                        <AddIcon />
                        {t('investmentsPage.add')}
                    </button>
                </div>
            </div>

            {/* Total Company Funds Card */}
            <div className="bg-gray-900 dark:bg-black rounded-xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <BriefcaseIcon className="w-32 h-32" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
                    <div>
                        <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">{t('investmentsPage.totalFunds.title')}</p>
                        <p className="text-4xl md:text-5xl font-bold mt-2">{formatCurrency(totalCompanyFunds)}</p>
                    </div>
                    <div className="flex gap-8 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                        <div>
                            <p className="text-gray-400 text-[10px] uppercase font-bold">{t('investmentsPage.totalFunds.operating')}</p>
                            <p className="font-mono font-semibold text-lg">{formatCurrency(operatingBalance)}</p>
                        </div>
                        <div className="w-px bg-white/20"></div>
                        <div>
                            <p className="text-gray-400 text-[10px] uppercase font-bold">{t('investmentsPage.totalFunds.portfolio')}</p>
                            <p className="font-mono font-semibold text-lg text-brand-accent">{formatCurrency(portfolioSummary.currentValue)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Wallet Card */}
                <div className="bg-white dark:bg-brand-secondary p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-semibold text-gray-500 dark:text-brand-muted uppercase tracking-wider">{t('investmentsPage.wallet')}</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(cashWallet.quantity)}</p>
                        </div>
                        <BriefcaseIcon className="w-8 h-8 text-blue-500 opacity-50" />
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button 
                            onClick={() => { const amt = prompt("Amount to deposit:"); if(amt) handleWalletAction(parseFloat(amt), true); }}
                            className="flex-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors"
                        >
                            + {t('investmentsPage.deposit')}
                        </button>
                        <button 
                            onClick={() => { const amt = prompt("Amount to withdraw:"); if(amt) handleWalletAction(parseFloat(amt), false); }}
                            className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                        >
                            - {t('investmentsPage.withdraw')}
                        </button>
                    </div>
                </div>

                {/* 2. Portfolio Stats */}
                <div className="bg-white dark:bg-brand-secondary p-6 rounded-xl shadow-md flex flex-col justify-between">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-brand-muted">{t('investmentsPage.stats.totalValue')}</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(portfolioSummary.currentValue)}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-brand-muted">{t('investmentsPage.stats.totalReturn')}</p>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-xl font-bold ${portfolioSummary.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {portfolioSummary.totalReturn >= 0 ? '+' : ''}{formatCurrency(portfolioSummary.totalReturn)}
                            </span>
                            <span className={`text-sm font-semibold px-2 py-0.5 rounded ${portfolioSummary.returnPercentage >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {portfolioSummary.returnPercentage.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Allocation Treemap */}
                <div className="bg-white dark:bg-brand-secondary p-4 rounded-xl shadow-md h-64 flex flex-col overflow-hidden">
                    <p className="text-sm font-semibold text-gray-500 dark:text-brand-muted mb-2 flex-shrink-0">Asset Allocation</p>
                    <div className="flex-grow w-full overflow-hidden min-h-[200px]" style={{ minHeight: '200px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            {treemapData.length > 0 ? (
                                <Treemap
                                    data={treemapData}
                                    dataKey="size"
                                    aspectRatio={4 / 3}
                                    stroke="#fff"
                                    content={<CustomizedContent />}
                                >
                                    <RechartsTooltip 
                                        formatter={(value: any) => formatCurrency(value)} 
                                        contentStyle={{backgroundColor: '#1F2937', color: 'white', borderRadius: '8px', border: 'none'}}
                                    />
                                </Treemap>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm">No assets to display</div>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* STRUKTUR INTI PORTOFOLIO — SAP 2025 */}
            <div className="animate-fade-in-scale">
                <SapStructureWidget investments={investments} currentValue={portfolioSummary.currentValue} />
            </div>

            {/* Asset Table */}
            <div className="bg-white dark:bg-brand-secondary rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('investmentsPage.table.asset')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('investmentsPage.table.qty')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">{t('investmentsPage.table.avgPrice')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('investmentsPage.table.value')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">{t('investmentsPage.table.target')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('investmentsPage.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {investments.filter(i => i.type !== 'Cash').map((inv) => {
                                const currentPrice = inv.currentPrice || inv.avgBuyPrice;
                                const currentValue = currentPrice * inv.quantity;
                                const allocationPct = (currentValue / portfolioSummary.currentValue) * 100;
                                const deviation = inv.targetAllocation ? allocationPct - inv.targetAllocation : 0;

                                return (
                                    <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent font-bold text-xs">
                                                    {inv.symbol.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <span className="block font-bold text-gray-900 dark:text-white">{inv.symbol}</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{inv.name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-800 dark:text-gray-200">{inv.quantity}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">{formatCurrency(inv.avgBuyPrice)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(currentValue)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm hidden md:table-cell">
                                            {inv.targetAllocation ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-gray-800 dark:text-gray-200 font-medium">{inv.targetAllocation}%</span>
                                                    <span className={`text-xs ${Math.abs(deviation) < 5 ? 'text-green-500' : 'text-orange-500'}`}>
                                                        {allocationPct.toFixed(1)}% (act)
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); setManagingAsset(inv); }} className="bg-brand-accent/10 hover:bg-brand-accent text-brand-accent hover:text-white px-3 py-1 rounded-md text-xs font-bold transition-colors">
                                                    {t('investmentsPage.manage')}
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(inv.id); }} className="text-gray-400 hover:text-red-500 p-1 transition-colors">
                                                    <DeleteIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* AI Market Insights */}
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {isLoadingRecs ? (
                        [1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>)
                    ) : (
                        (recs ?? []).map((rec, idx) => (
                            <div key={idx} className="bg-white dark:bg-brand-secondary p-5 rounded-xl shadow-md border-t-4 border-brand-accent flex flex-col hover:-translate-y-1 transition-transform">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-800 dark:text-white">{rec.sector}</h3>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${rec.sentiment === 'Bullish' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{rec.sentiment}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 italic mb-4 flex-grow">"{rec.reasoning}"</p>
                                <div className="flex justify-between text-xs font-semibold pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <span className={`${rec.riskLevel === 'High' ? 'text-red-500' : 'text-blue-500'}`}>{rec.riskLevel} Risk</span>
                                    <span className="text-gray-800 dark:text-white">{rec.suggestedAction}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {recommendationSources.length > 0 && !isLoadingRecs && (
                    <div className="bg-gray-50 dark:bg-brand-secondary/50 p-3 rounded-lg text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-bold mr-2">Search Sources:</span>
                        {(recs ?? []).map((source, idx) => (
                            <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="mr-3 hover:text-brand-accent underline decoration-dotted">
                                {source.title}
                            </a>
                        ))}
                    </div>
                )}
            </div>

            <AddInvestmentModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onAdd={onAddInvestment}
                currency={currency}
            />

            <ManageInvestmentModal
                isOpen={!!managingAsset}
                onClose={() => setManagingAsset(null)}
                investment={managingAsset}
                cashBalance={cashWallet.quantity}
                currency={currency}
                onBuy={handleBuyAsset}
                onSell={handleSellAsset}
                onUpdateTarget={handleUpdateTarget}
                totalPortfolioValue={portfolioSummary.currentValue}
            />
            
            <PortfolioAdvisorModal 
                isOpen={isAdvisorOpen}
                onClose={() => setIsAdvisorOpen(false)}
                suggestions={advisorSuggestions}
                isLoading={isLoadingAdvisor}
                sources={advisorSources}
            />
        </div>
    );
};

export default InvestmentsPage;





