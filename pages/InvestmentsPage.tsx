import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Investment, MarketTrendRecommendation, PortfolioSuggestion } from '../types';
import {
    AddIcon,
    BalanceIcon,
    BriefcaseIcon,
    DeleteIcon,
    ProfitIcon,
    SparklesIcon,
    TrendingUpIcon,
} from '../components/Icons';
import { useI18n } from '../hooks/useI18n';
import AddInvestmentModal from '../components/AddInvestmentModal';
import ManageInvestmentModal from '../components/ManageInvestmentModal';
import PortfolioAdvisorModal from '../components/PortfolioAdvisorModal';
import EmptyState from '../components/EmptyState';
import { getAiPortfolioAnalysis, getMarketRecommendations, getPortfolioMarketData } from '../services/geminiService';
import { formatCurrency, formatDate, getLocaleCode } from '../utils/intl';

interface InvestmentsPageProps {
    investments: Investment[];
    currency: string;
    operatingBalance: number;
    onAddInvestment: (investment: Omit<Investment, 'id' | 'currentPrice'>) => void;
    onDeleteInvestment: (id: string) => void;
    onUpdatePrices: (prices: { [symbol: string]: number }) => void;
    onBatchUpdate: (investments: Investment[]) => void;
}

const ASSET_TYPES = new Set(['Stock', 'Crypto', 'Bond', 'Real Estate', 'Mutual Fund', 'Cash']);
const ALLOCATION_COLORS = ['#2F81F7', '#2DA44E', '#DB6D28', '#A371F7', '#E5534B', '#087D9A'];

const toFiniteNumber = (value: unknown, fallback = 0): number => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const parseDateFromInvestment = (investment: Investment): Date | null => {
    if (investment.lastUpdated) {
        const direct = new Date(investment.lastUpdated);
        if (!Number.isNaN(direct.getTime())) {
            return direct;
        }
    }

    const match = investment.id.match(/(\d{10,})$/);
    if (!match) {
        return null;
    }

    const fromId = new Date(Number(match[1]));
    return Number.isNaN(fromId.getTime()) ? null : fromId;
};

const normalizeInvestment = (investment: Partial<Investment>, index: number): Investment => {
    const fallbackSymbol = `AST${index + 1}`;
    const quantity = Math.max(0, toFiniteNumber(investment.quantity));
    const avgBuyPrice = Math.max(0, toFiniteNumber(investment.avgBuyPrice));
    const currentPrice = Math.max(0, toFiniteNumber(investment.currentPrice, avgBuyPrice || 0));
    const type = ASSET_TYPES.has(String(investment.type)) ? String(investment.type) : 'Stock';

    return {
        id: typeof investment.id === 'string' && investment.id.trim() ? investment.id : `investment-${index}`,
        symbol: typeof investment.symbol === 'string' && investment.symbol.trim() ? investment.symbol.toUpperCase() : fallbackSymbol,
        name: typeof investment.name === 'string' && investment.name.trim() ? investment.name : `Asset ${index + 1}`,
        quantity,
        avgBuyPrice,
        currentPrice,
        type: type as Investment['type'],
        targetAllocation: Number.isFinite(Number(investment.targetAllocation)) ? Number(investment.targetAllocation) : undefined,
        lastUpdated: typeof investment.lastUpdated === 'string' ? investment.lastUpdated : undefined,
    };
};

const MetricCard: React.FC<{
    title: string;
    value: string;
    description: string;
    icon: React.ReactNode;
    tone: 'positive' | 'negative' | 'neutral' | 'accent';
}> = ({ title, value, description, icon, tone }) => {
    const toneClasses = {
        positive: {
            icon: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
            value: 'text-green-600 dark:text-green-300',
            border: 'border-green-100 dark:border-green-500/20',
        },
        negative: {
            icon: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300',
            value: 'text-red-600 dark:text-red-300',
            border: 'border-red-100 dark:border-red-500/20',
        },
        accent: {
            icon: 'bg-brand-accent/10 text-brand-accent dark:bg-brand-accent/20 dark:text-blue-300',
            value: 'text-brand-accent dark:text-blue-300',
            border: 'border-blue-100 dark:border-brand-accent/20',
        },
        neutral: {
            icon: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-200',
            value: 'text-gray-900 dark:text-white',
            border: 'border-gray-200 dark:border-gray-700',
        },
    }[tone];

    return (
        <article className={`rounded-3xl border bg-white p-5 shadow-sm dark:bg-brand-secondary ${toneClasses.border}`}>
            <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClasses.icon}`}>
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-brand-muted">{title}</p>
                    <p className={`mt-2 text-2xl font-bold ${toneClasses.value}`}>{value}</p>
                    <p className="mt-2 text-sm text-gray-500 dark:text-brand-muted">{description}</p>
                </div>
            </div>
        </article>
    );
};

const getSentimentClasses = (sentiment: MarketTrendRecommendation['sentiment']) => {
    switch (sentiment) {
        case 'Bullish':
            return 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300';
        case 'Bearish':
            return 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300';
        default:
            return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
    }
};

const getActionClasses = (action: MarketTrendRecommendation['suggestedAction']) => {
    switch (action) {
        case 'Buy':
            return 'text-green-600 dark:text-green-300';
        case 'Hold':
            return 'text-amber-600 dark:text-amber-300';
        default:
            return 'text-blue-600 dark:text-blue-300';
    }
};

const InvestmentsPage: React.FC<InvestmentsPageProps> = ({
    investments,
    currency,
    operatingBalance,
    onAddInvestment,
    onDeleteInvestment,
    onUpdatePrices,
    onBatchUpdate,
}) => {
    const { t, locale } = useI18n();
    const localeCode = getLocaleCode(locale);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [recommendations, setRecommendations] = useState<MarketTrendRecommendation[]>([]);
    const [recommendationSources, setRecommendationSources] = useState<{ title: string; uri: string }[]>([]);
    const [isLoadingRecs, setIsLoadingRecs] = useState(false);
    const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
    const [advisorSuggestions, setAdvisorSuggestions] = useState<PortfolioSuggestion[]>([]);
    const [advisorSources, setAdvisorSources] = useState<{ title: string; uri: string }[]>([]);
    const [isLoadingAdvisor, setIsLoadingAdvisor] = useState(false);
    const [managingAsset, setManagingAsset] = useState<Investment | null>(null);

    const safeInvestments = useMemo(() => {
        if (!Array.isArray(investments)) {
            return [];
        }

        return investments.reduce<Investment[]>((acc, investment, index) => {
            if (!investment || typeof investment !== 'object') {
                return acc;
            }

            acc.push(normalizeInvestment(investment, index));
            return acc;
        }, []);
    }, [investments]);

    const safeOperatingBalance = toFiniteNumber(operatingBalance);

    const cashWallet = useMemo<Investment>(() => {
        return safeInvestments.find(investment => investment.type === 'Cash') ?? {
            id: 'virtual-cash',
            symbol: currency,
            name: 'Cash Wallet',
            quantity: 0,
            avgBuyPrice: 1,
            currentPrice: 1,
            type: 'Cash',
        };
    }, [currency, safeInvestments]);

    const activeInvestments = useMemo(() => {
        return safeInvestments.filter(investment => investment.type !== 'Cash' && investment.quantity > 0);
    }, [safeInvestments]);

    const portfolioSummary = useMemo(() => {
        const totalInvested = activeInvestments.reduce((sum, investment) => sum + investment.avgBuyPrice * investment.quantity, 0);
        const currentValue = activeInvestments.reduce(
            (sum, investment) => sum + (investment.currentPrice || investment.avgBuyPrice) * investment.quantity,
            0,
        );
        const totalReturns = currentValue - totalInvested;
        const growthRate = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

        return {
            totalInvested,
            currentValue,
            totalReturns,
            growthRate,
            activeCount: activeInvestments.length,
        };
    }, [activeInvestments]);

    const totalCompanyFunds = safeOperatingBalance + cashWallet.quantity + portfolioSummary.currentValue;
    const chartAxisFormatter = useMemo(
        () => new Intl.NumberFormat(localeCode, { notation: 'compact', maximumFractionDigits: 1 }),
        [localeCode],
    );
    const percentFormatter = useMemo(
        () => new Intl.NumberFormat(localeCode, { maximumFractionDigits: 1 }),
        [localeCode],
    );

    const performanceData = useMemo(() => {
        return activeInvestments
            .map(investment => {
                const invested = investment.avgBuyPrice * investment.quantity;
                const current = (investment.currentPrice || investment.avgBuyPrice) * investment.quantity;

                return {
                    id: investment.id,
                    symbol: investment.symbol,
                    name: investment.name,
                    invested,
                    current,
                };
            })
            .sort((a, b) => b.current - a.current)
            .slice(0, 8);
    }, [activeInvestments]);

    const allocationData = useMemo(() => {
        const total = Math.max(portfolioSummary.currentValue, 1);
        return performanceData.map((item, index) => ({
            ...item,
            allocation: (item.current / total) * 100,
            color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length],
        }));
    }, [performanceData, portfolioSummary.currentValue]);

    const holdingsRows = useMemo(() => {
        const total = Math.max(portfolioSummary.currentValue, 1);

        return activeInvestments
            .map(investment => {
                const currentPrice = investment.currentPrice || investment.avgBuyPrice;
                const invested = investment.avgBuyPrice * investment.quantity;
                const value = currentPrice * investment.quantity;
                const returnValue = value - invested;
                const returnRate = invested > 0 ? (returnValue / invested) * 100 : 0;

                return {
                    investment,
                    value,
                    returnValue,
                    returnRate,
                    allocation: (value / total) * 100,
                };
            })
            .sort((a, b) => b.value - a.value);
    }, [activeInvestments, portfolioSummary.currentValue]);

    const recentActivity = useMemo(() => {
        return safeInvestments
            .filter(investment => investment.type !== 'Cash')
            .map(investment => ({
                id: investment.id,
                symbol: investment.symbol,
                name: investment.name,
                amount: (investment.currentPrice || investment.avgBuyPrice) * investment.quantity,
                date: parseDateFromInvestment(investment),
                status: investment.quantity > 0 ? t('investmentsPage.recentActivity.buy') : t('investmentsPage.recentActivity.sell'),
            }))
            .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
            .slice(0, 6);
    }, [safeInvestments, t]);

    const safeRecommendations = useMemo(() => {
        return Array.isArray(recommendations) ? recommendations : [];
    }, [recommendations]);

    const handleRefreshRecommendations = useCallback(async () => {
        setIsLoadingRecs(true);
        try {
            const response = await getMarketRecommendations();
            setRecommendations(Array.isArray(response?.recommendations) ? response.recommendations : []);
            setRecommendationSources(Array.isArray(response?.sources) ? response.sources : []);
        } catch (error) {
            console.error(error);
            setRecommendations([]);
            setRecommendationSources([]);
        } finally {
            setIsLoadingRecs(false);
        }
    }, []);

    useEffect(() => {
        if (safeRecommendations.length === 0) {
            void handleRefreshRecommendations();
        }
    }, [handleRefreshRecommendations, safeRecommendations.length]);

    const handleRefreshPrices = async () => {
        if (activeInvestments.length === 0) {
            return;
        }

        setIsRefreshing(true);
        try {
            const symbols = activeInvestments.map(investment => investment.symbol);
            const currentPrices: { [key: string]: number } = {};

            activeInvestments.forEach(investment => {
                currentPrices[investment.symbol] = investment.currentPrice || investment.avgBuyPrice;
            });

            const response = await getPortfolioMarketData(symbols, currentPrices);
            const safePriceMap = response && typeof response === 'object' && !Array.isArray(response) ? response : {};
            onUpdatePrices(safePriceMap as { [symbol: string]: number });
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleGetAiAdvice = async () => {
        setIsAdvisorOpen(true);
        setIsLoadingAdvisor(true);
        setAdvisorSuggestions([]);
        setAdvisorSources([]);

        try {
            const response = await getAiPortfolioAnalysis(activeInvestments, portfolioSummary.currentValue);
            setAdvisorSuggestions(Array.isArray(response?.suggestions) ? response.suggestions : []);
            setAdvisorSources(Array.isArray(response?.sources) ? response.sources : []);
        } catch (error) {
            console.error(error);
            setAdvisorSuggestions([]);
            setAdvisorSources([]);
        } finally {
            setIsLoadingAdvisor(false);
        }
    };

    const promptForWalletAmount = (mode: 'deposit' | 'withdraw') => {
        const promptText = mode === 'deposit' ? t('investmentsPage.prompts.deposit') : t('investmentsPage.prompts.withdraw');
        const rawValue = window.prompt(promptText);
        if (rawValue === null) return null;

        const amount = Number(rawValue);
        if (!Number.isFinite(amount) || amount <= 0) return null;
        if (mode === 'withdraw' && amount > cashWallet.quantity) {
            window.alert(t('investmentsPage.prompts.insufficientFunds'));
            return null;
        }

        return amount;
    };

    const handleWalletAction = (mode: 'deposit' | 'withdraw') => {
        const amount = promptForWalletAmount(mode);
        if (!amount) return;

        onBatchUpdate([{
            ...cashWallet,
            id: cashWallet.id === 'virtual-cash' ? `inv-cash-${Date.now()}` : cashWallet.id,
            quantity: mode === 'deposit' ? cashWallet.quantity + amount : cashWallet.quantity - amount,
            lastUpdated: new Date().toISOString(),
        }]);
    };

    const handleBuyAsset = (qty: number, price: number) => {
        if (!managingAsset) return;

        const cost = qty * price;
        const newQty = managingAsset.quantity + qty;
        const updatedCash: Investment = {
            ...cashWallet,
            id: cashWallet.id === 'virtual-cash' ? `inv-cash-${Date.now()}` : cashWallet.id,
            quantity: cashWallet.quantity - cost,
            lastUpdated: new Date().toISOString(),
        };
        const updatedAsset: Investment = {
            ...managingAsset,
            quantity: newQty,
            avgBuyPrice: newQty > 0 ? ((managingAsset.quantity * managingAsset.avgBuyPrice) + cost) / newQty : price,
            currentPrice: price,
            lastUpdated: new Date().toISOString(),
        };

        onBatchUpdate([updatedCash, updatedAsset]);
        setManagingAsset(updatedAsset);
    };

    const handleSellAsset = (qty: number, price: number) => {
        if (!managingAsset) return;

        const updatedCash: Investment = {
            ...cashWallet,
            id: cashWallet.id === 'virtual-cash' ? `inv-cash-${Date.now()}` : cashWallet.id,
            quantity: cashWallet.quantity + (qty * price),
            lastUpdated: new Date().toISOString(),
        };
        const updatedAsset: Investment = {
            ...managingAsset,
            quantity: Math.max(0, managingAsset.quantity - qty),
            currentPrice: price,
            lastUpdated: new Date().toISOString(),
        };

        onBatchUpdate([updatedCash, updatedAsset]);
        setManagingAsset(updatedAsset.quantity > 0 ? updatedAsset : null);
    };

    const handleUpdateTarget = (targetPercent: number) => {
        if (!managingAsset) return;

        const updatedAsset = { ...managingAsset, targetAllocation: targetPercent, lastUpdated: new Date().toISOString() };
        onBatchUpdate([updatedAsset]);
        setManagingAsset(updatedAsset);
    };

    const handleDelete = (id: string) => {
        if (window.confirm(t('investmentsPage.table.deleteConfirm'))) {
            onDeleteInvestment(id);
            if (managingAsset?.id === id) {
                setManagingAsset(null);
            }
        }
    };

    const formatMoney = (value: number) => {
        return formatCurrency(value, currency, locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    };

    return (
        <main className="min-h-full bg-gray-50 dark:bg-brand-primary">
            <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
                <header className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.95fr)]">
                    <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-brand-secondary">
                        <div className="bg-gradient-to-r from-brand-accent/10 via-white to-green-50/70 p-6 dark:from-brand-accent/10 dark:via-brand-secondary dark:to-brand-primary/70 sm:p-8">
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">{t('investmentsPage.title')}</p>
                            <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{t('investmentsPage.title')}</h1>
                            <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-600 dark:text-brand-muted sm:text-base">{t('investmentsPage.subtitle')}</p>
                        </div>
                    </section>

                    <aside className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-brand-secondary sm:p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-400 dark:text-brand-muted">{t('investmentsPage.detailsTitle')}</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{formatMoney(totalCompanyFunds)}</p>
                        <div className="mt-5 grid gap-3">
                            <button
                                onClick={handleGetAiAdvice}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
                            >
                                <SparklesIcon className="h-4 w-4 text-white" />
                                {t('portfolioAdvisor.getAdvice')}
                            </button>
                            <button
                                onClick={handleRefreshPrices}
                                disabled={isRefreshing || activeInvestments.length === 0}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-200 px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                            >
                                <TrendingUpIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                {isRefreshing ? t('investmentsPage.refreshing') : t('investmentsPage.refresh')}
                            </button>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                            >
                                <AddIcon className="h-4 w-4" />
                                {t('investmentsPage.add')}
                            </button>
                        </div>
                    </aside>
                </header>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        title={t('investmentsPage.stats.totalInvested')}
                        value={formatMoney(portfolioSummary.totalInvested)}
                        description={t('investmentsPage.chartSubtitle')}
                        icon={<BriefcaseIcon className="h-6 w-6" />}
                        tone="neutral"
                    />
                    <MetricCard
                        title={t('investmentsPage.stats.totalReturns')}
                        value={formatMoney(portfolioSummary.totalReturns)}
                        description={formatMoney(portfolioSummary.currentValue)}
                        icon={<ProfitIcon className="h-6 w-6" />}
                        tone={portfolioSummary.totalReturns >= 0 ? 'positive' : 'negative'}
                    />
                    <MetricCard
                        title={t('investmentsPage.stats.growth')}
                        value={`${portfolioSummary.growthRate.toFixed(2)}%`}
                        description={t('investmentsPage.allocationSubtitle')}
                        icon={<TrendingUpIcon className="h-6 w-6" />}
                        tone={portfolioSummary.growthRate >= 0 ? 'accent' : 'negative'}
                    />
                    <MetricCard
                        title={t('investmentsPage.stats.activeInvestments')}
                        value={String(portfolioSummary.activeCount)}
                        description={t('investmentsPage.holdingsTitle')}
                        icon={<BalanceIcon className="h-6 w-6" />}
                        tone="accent"
                    />
                </section>

                {safeInvestments.length === 0 && (
                    <EmptyState
                        Icon={BriefcaseIcon}
                        title={t('investmentsPage.emptyTitle')}
                        message={t('investmentsPage.emptyDescription')}
                        action={{ label: t('investmentsPage.add'), onClick: () => setIsAddModalOpen(true) }}
                    />
                )}

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,1fr)]">
                    <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-brand-secondary sm:p-6">
                        <header>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('investmentsPage.chartTitle')}</h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-brand-muted">{t('investmentsPage.chartSubtitle')}</p>
                        </header>

                        {performanceData.length > 0 ? (
                            <div className="mt-6 h-[320px] w-full min-w-0 md:h-[360px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={performanceData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                        <XAxis dataKey="symbol" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                                        <YAxis
                                            width={72}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value: number) => chartAxisFormatter.format(value)}
                                        />
                                        <Tooltip
                                            formatter={(value: number, name: string) => [formatMoney(value), name]}
                                            contentStyle={{
                                                borderRadius: '16px',
                                                borderColor: '#E5E7EB',
                                                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
                                            }}
                                        />
                                        <Bar dataKey="invested" name={t('investmentsPage.stats.totalInvested')} fill="#94A3B8" radius={[10, 10, 0, 0]} />
                                        <Bar dataKey="current" name={t('investmentsPage.totalFunds.portfolio')} fill="#2F81F7" radius={[10, 10, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="mt-8 flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/80 text-center dark:border-gray-700 dark:bg-brand-primary/40">
                                <p className="max-w-sm text-sm text-gray-500 dark:text-brand-muted">{t('investmentsPage.noChartData')}</p>
                            </div>
                        )}
                    </article>

                    <div className="grid gap-6">
                        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-brand-secondary sm:p-6">
                            <header className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('investmentsPage.detailsTitle')}</h2>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-brand-muted">{t('investmentsPage.totalFunds.title')}</p>
                                </div>
                                <BriefcaseIcon className="h-6 w-6 text-brand-accent" />
                            </header>

                            <div className="mt-6 space-y-4">
                                <div className="rounded-2xl bg-gray-900 p-4 text-white dark:bg-black">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">{t('investmentsPage.wallet')}</p>
                                    <p className="mt-2 text-2xl font-bold">{formatMoney(cashWallet.quantity)}</p>
                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                        <button onClick={() => handleWalletAction('deposit')} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20">
                                            + {t('investmentsPage.deposit')}
                                        </button>
                                        <button onClick={() => handleWalletAction('withdraw')} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20">
                                            - {t('investmentsPage.withdraw')}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-brand-primary/50">
                                        <span className="text-sm text-gray-500 dark:text-brand-muted">{t('investmentsPage.totalFunds.operating')}</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{formatMoney(safeOperatingBalance)}</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-brand-primary/50">
                                        <span className="text-sm text-gray-500 dark:text-brand-muted">{t('investmentsPage.totalFunds.portfolio')}</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{formatMoney(portfolioSummary.currentValue)}</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-brand-primary/50">
                                        <span className="text-sm text-gray-500 dark:text-brand-muted">{t('investmentsPage.buyingPower')}</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{formatMoney(cashWallet.quantity)}</span>
                                    </div>
                                </div>
                            </div>
                        </article>

                        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-brand-secondary sm:p-6">
                            <header>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('investmentsPage.allocationTitle')}</h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-brand-muted">{t('investmentsPage.allocationSubtitle')}</p>
                            </header>

                            {allocationData.length > 0 ? (
                                <ul className="mt-6 space-y-4">
                                    {allocationData.slice(0, 5).map(item => (
                                        <li key={item.id}>
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{item.symbol}</p>
                                                    <p className="truncate text-xs text-gray-500 dark:text-brand-muted">{item.name}</p>
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.allocation.toFixed(1)}%</span>
                                            </div>
                                            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                                                <div className="h-full rounded-full" style={{ width: `${Math.min(item.allocation, 100)}%`, backgroundColor: item.color }} />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="mt-8 flex min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/80 text-center dark:border-gray-700 dark:bg-brand-primary/40">
                                    <p className="max-w-sm text-sm text-gray-500 dark:text-brand-muted">{t('investmentsPage.noAllocationData')}</p>
                                </div>
                            )}
                        </article>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,1fr)]">
                    <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-brand-secondary sm:p-6">
                        <header className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('investmentsPage.holdingsTitle')}</h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-brand-muted">{t('investmentsPage.chartSubtitle')}</p>
                            </div>
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                                {portfolioSummary.activeCount}
                            </span>
                        </header>

                        <div className="mt-6 overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-700">
                            {holdingsRows.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-brand-primary/60">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-brand-muted">{t('investmentsPage.table.asset')}</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-brand-muted">{t('investmentsPage.table.qty')}</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-brand-muted">{t('investmentsPage.table.avgPrice')}</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-brand-muted">{t('investmentsPage.table.currentPrice')}</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-brand-muted">{t('investmentsPage.table.value')}</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-brand-muted">{t('investmentsPage.table.alloc')}</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-brand-muted">{t('investmentsPage.table.target')}</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-brand-muted">{t('investmentsPage.table.return')}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-brand-muted">{t('investmentsPage.table.actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-brand-secondary">
                                            {holdingsRows.map(row => (
                                                <tr key={row.investment.id} className="align-top">
                                                    <td className="px-4 py-4">
                                                        <div className="min-w-[180px]">
                                                            <p className="font-semibold text-gray-900 dark:text-white">{row.investment.symbol}</p>
                                                            <p className="mt-1 text-sm text-gray-500 dark:text-brand-muted">{row.investment.name}</p>
                                                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-brand-muted">{row.investment.type}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-200">{row.investment.quantity.toLocaleString(localeCode, { maximumFractionDigits: 4 })}</td>
                                                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-200">{formatMoney(row.investment.avgBuyPrice)}</td>
                                                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-200">{formatMoney(row.investment.currentPrice || row.investment.avgBuyPrice)}</td>
                                                    <td className="px-4 py-4 text-sm font-semibold text-gray-900 dark:text-white">{formatMoney(row.value)}</td>
                                                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-200">{percentFormatter.format(row.allocation)}%</td>
                                                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-200">
                                                        {typeof row.investment.targetAllocation === 'number'
                                                            ? `${percentFormatter.format(row.investment.targetAllocation)}%`
                                                            : '--'}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className={row.returnValue >= 0 ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}>
                                                            <p className="text-sm font-semibold">{formatMoney(row.returnValue)}</p>
                                                            <p className="text-xs">{percentFormatter.format(row.returnRate)}%</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => setManagingAsset(row.investment)}
                                                                className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                                            >
                                                                {t('investmentsPage.manage')}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(row.investment.id)}
                                                                title={t('general.delete')}
                                                                className="rounded-xl bg-red-50 p-2 text-red-600 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                                                            >
                                                                <DeleteIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex min-h-[220px] items-center justify-center bg-gray-50/80 px-6 text-center dark:bg-brand-primary/40">
                                    <p className="max-w-sm text-sm text-gray-500 dark:text-brand-muted">{t('investmentsPage.table.empty')}</p>
                                </div>
                            )}
                        </div>
                    </article>

                    <div className="grid gap-6">
                        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-brand-secondary sm:p-6">
                            <header>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('investmentsPage.recentActivity.title')}</h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-brand-muted">{t('investmentsPage.holdingsTitle')}</p>
                            </header>

                            {recentActivity.length > 0 ? (
                                <ul className="mt-6 space-y-3">
                                    {recentActivity.map(activity => (
                                        <li key={activity.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-700 dark:bg-brand-primary/50">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold text-gray-900 dark:text-white">{activity.symbol}</p>
                                                    <p className="truncate text-sm text-gray-500 dark:text-brand-muted">{activity.name}</p>
                                                </div>
                                                <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-500/15 dark:text-green-300">
                                                    {activity.status}
                                                </span>
                                            </div>
                                            <div className="mt-3 flex items-end justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-brand-muted">{t('investmentsPage.recentActivity.amount')}</p>
                                                    <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{formatMoney(activity.amount)}</p>
                                                </div>
                                                <p className="text-right text-xs text-gray-500 dark:text-brand-muted">
                                                    {activity.date
                                                        ? t('investmentsPage.recentActivity.updated', {
                                                            date: formatDate(activity.date, locale, { day: '2-digit', month: 'short', year: 'numeric' }),
                                                        })
                                                        : '--'}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="mt-8 flex min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/80 text-center dark:border-gray-700 dark:bg-brand-primary/40">
                                    <p className="max-w-sm text-sm text-gray-500 dark:text-brand-muted">{t('investmentsPage.recentActivity.empty')}</p>
                                </div>
                            )}
                        </article>

                        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-brand-secondary sm:p-6">
                            <header className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('investmentsPage.marketInsights.title')}</h2>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-brand-muted">{t('investmentsPage.marketInsights.subtitle')}</p>
                                </div>
                                <button
                                    onClick={handleRefreshRecommendations}
                                    className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                >
                                    {isLoadingRecs ? t('investmentsPage.refreshing') : t('investmentsPage.marketInsights.refresh')}
                                </button>
                            </header>

                            {isLoadingRecs ? (
                                <div className="mt-8 flex min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/80 text-center dark:border-gray-700 dark:bg-brand-primary/40">
                                    <p className="max-w-sm text-sm text-gray-500 dark:text-brand-muted">{t('investmentsPage.refreshing')}</p>
                                </div>
                            ) : safeRecommendations.length > 0 ? (
                                <div className="mt-6 space-y-3">
                                    {safeRecommendations.slice(0, 4).map((item, index) => (
                                        <article key={`${item.sector}-${index}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-brand-primary/50">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{item.sector}</p>
                                                    <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getSentimentClasses(item.sentiment)}`}>
                                                        {item.sentiment}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-semibold ${getActionClasses(item.suggestedAction)}`}>{item.suggestedAction}</p>
                                                    <p className="mt-1 text-xs text-gray-500 dark:text-brand-muted">{item.riskLevel} {t('portfolioAdvisor.risk')}</p>
                                                </div>
                                            </div>
                                            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-brand-muted">{item.reasoning}</p>
                                        </article>
                                    ))}

                                    {recommendationSources.length > 0 && (
                                        <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-3 dark:border-gray-700">
                                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-brand-muted">{t('portfolioAdvisor.sources')}</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {recommendationSources.map((source, index) => (
                                                    <a
                                                        key={`${source.uri}-${index}`}
                                                        href={source.uri}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                                                    >
                                                        {source.title}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-8 flex min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/80 text-center dark:border-gray-700 dark:bg-brand-primary/40">
                                    <p className="max-w-sm text-sm text-gray-500 dark:text-brand-muted">{t('investmentsPage.marketInsights.empty')}</p>
                                </div>
                            )}
                        </article>
                    </div>
                </section>

                <AddInvestmentModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onAdd={onAddInvestment}
                    currency={currency}
                />
                <ManageInvestmentModal
                    isOpen={Boolean(managingAsset)}
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
        </main>
    );
};

export default InvestmentsPage;
