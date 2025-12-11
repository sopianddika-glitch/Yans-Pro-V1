
import React, { useState, useEffect, useMemo } from 'react';
import { Investment } from '../types';
import { XIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface ManageInvestmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    investment: Investment | null;
    cashBalance: number;
    currency: string;
    onBuy: (qty: number, price: number) => void;
    onSell: (qty: number, price: number) => void;
    onUpdateTarget: (percentage: number) => void;
    totalPortfolioValue?: number;
}

const ManageInvestmentModal: React.FC<ManageInvestmentModalProps> = ({ 
    isOpen, onClose, investment, cashBalance, currency, onBuy, onSell, onUpdateTarget, totalPortfolioValue = 0 
}) => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'rebalance'>('buy');
    
    // Inputs
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [targetPercent, setTargetPercent] = useState('');

    useEffect(() => {
        if (isOpen && investment) {
            setPrice(investment.currentPrice?.toString() || investment.avgBuyPrice.toString() || '0');
            setTargetPercent(investment.targetAllocation?.toString() || '0');
            setQuantity('');
        }
    }, [isOpen, investment]);

    if (!isOpen || !investment) return null;

    const numQty = parseFloat(quantity) || 0;
    const numPrice = parseFloat(price) || 0;
    const totalCost = numQty * numPrice;
    const totalProceeds = numQty * numPrice;

    // Validation for Buy/Sell tabs
    const canBuy = numQty > 0 && numPrice > 0 && totalCost <= cashBalance;
    const canSell = numQty > 0 && numPrice > 0 && numQty <= investment.quantity;

    // --- Rebalancing Logic ---
    const numTargetPercent = parseFloat(targetPercent) || 0;
    const currentVal = (investment.quantity || 0) * numPrice;
    // Current allocation based on TOTAL portfolio value
    const currentAllocation = totalPortfolioValue > 0 ? (currentVal / totalPortfolioValue) * 100 : 0;
    
    // Calculate target value and difference
    const targetVal = totalPortfolioValue * (numTargetPercent / 100);
    const valDiff = targetVal - currentVal;
    
    // Calculate quantity to buy/sell to reach target
    const qtyDiff = numPrice > 0 ? valDiff / numPrice : 0;
    const isBuyAction = qtyDiff > 0;
    const absQtyDiff = Math.abs(qtyDiff);
    
    // Validation for Rebalance execution
    // Allow small tolerance for floating point comparisons
    const canExecuteRebalance = 
        numTargetPercent >= 0 && numTargetPercent <= 100 && 
        numPrice > 0 &&
        absQtyDiff > 0.000001 &&
        (isBuyAction ? valDiff <= cashBalance + 0.01 : true) && 
        (!isBuyAction ? absQtyDiff <= investment.quantity + 0.000001 : true);

    const handleBuy = () => {
        if (canBuy) {
            onBuy(numQty, numPrice);
            onClose();
        }
    }

    const handleSell = () => {
        if (canSell) {
            onSell(numQty, numPrice);
            onClose();
        }
    }

    const handleSaveTarget = () => {
        const p = parseFloat(targetPercent);
        if (!isNaN(p) && p >= 0 && p <= 100) {
            onUpdateTarget(p);
            onClose();
        }
    }

    const handleExecuteRebalance = () => {
        // First save the target
        onUpdateTarget(numTargetPercent);
        
        if (absQtyDiff < 0.000001) {
            onClose();
            return;
        }

        if (isBuyAction) {
            onBuy(absQtyDiff, numPrice);
        } else {
            onSell(absQtyDiff, numPrice);
        }
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 transition-opacity" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-brand-secondary rounded-xl shadow-2xl w-full max-w-md animate-fade-in-scale flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-brand-primary">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('manageInvestment.title', {symbol: investment.symbol})}</h2>
                        <p className="text-sm text-gray-500 dark:text-brand-muted">{investment.name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white"><XIcon /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button onClick={() => setActiveTab('buy')} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'buy' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>{t('manageInvestment.buy')}</button>
                    <button onClick={() => setActiveTab('sell')} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'sell' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>{t('manageInvestment.sell')}</button>
                    <button onClick={() => setActiveTab('rebalance')} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'rebalance' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>{t('manageInvestment.rebalance')}</button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {activeTab === 'buy' && (
                        <>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex justify-between items-center text-sm">
                                <span className="text-blue-800 dark:text-blue-300">{t('manageInvestment.availableCash')}</span>
                                <span className="font-bold text-blue-900 dark:text-blue-100">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cashBalance)}</span>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{t('modals.addInvestment.quantity')}</label>
                                <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-brand-primary dark:border-gray-700" placeholder="0" autoFocus />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{t('manageInvestment.currentPrice')}</label>
                                <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-brand-primary dark:border-gray-700" />
                            </div>
                            <div className="flex justify-between text-sm pt-2">
                                <span>{t('manageInvestment.estCost')}</span>
                                <span className="font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(totalCost)}</span>
                            </div>
                            {totalCost > cashBalance && (
                                <p className="text-xs text-red-500">{t('manageInvestment.insufficientFunds')}</p>
                            )}
                            <button onClick={handleBuy} disabled={!canBuy} className="w-full py-3 mt-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                                {t('manageInvestment.buy')}
                            </button>
                        </>
                    )}

                    {activeTab === 'sell' && (
                        <>
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg flex justify-between items-center text-sm">
                                <span className="text-gray-600 dark:text-gray-400">{t('productsPage.stock', {count: investment.quantity})}</span>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{t('modals.addInvestment.quantity')}</label>
                                <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-brand-primary dark:border-gray-700" placeholder="0" autoFocus />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{t('manageInvestment.currentPrice')}</label>
                                <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-brand-primary dark:border-gray-700" />
                            </div>
                            <div className="flex justify-between text-sm pt-2">
                                <span>{t('manageInvestment.proceeds')}</span>
                                <span className="font-bold text-green-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(totalProceeds)}</span>
                            </div>
                            {numQty > investment.quantity && (
                                <p className="text-xs text-red-500">{t('manageInvestment.insufficientQty')}</p>
                            )}
                            <button onClick={handleSell} disabled={!canSell} className="w-full py-3 mt-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                                {t('manageInvestment.sell')}
                            </button>
                        </>
                    )}

                    {activeTab === 'rebalance' && (
                        <>
                            <div className="text-center py-4">
                                <p className="text-gray-500 text-sm mb-2">{t('manageInvestment.targetAllocation')}</p>
                                <div className="flex justify-center items-center gap-2">
                                    <input 
                                        type="number" 
                                        value={targetPercent} 
                                        onChange={e => setTargetPercent(e.target.value)} 
                                        className="text-4xl font-bold text-center w-24 bg-transparent border-b-2 border-brand-accent focus:outline-none"
                                        min="0" max="100"
                                        placeholder="0"
                                    />
                                    <span className="text-2xl text-gray-400">%</span>
                                </div>
                            </div>

                            {/* Analysis Dashboard */}
                            <div className="bg-gray-50 dark:bg-brand-primary p-4 rounded-lg space-y-3 text-sm border border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-brand-muted">{t('manageInvestment.currentAlloc')}</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-200">{currentAllocation.toFixed(2)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-brand-muted">{t('manageInvestment.deviation')}</span>
                                    <span className={`font-bold ${Math.abs(currentAllocation - numTargetPercent) > 1 ? 'text-red-500' : 'text-green-500'}`}>
                                        {(currentAllocation - numTargetPercent).toFixed(2)}%
                                    </span>
                                </div>
                                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <span className="block text-xs font-bold text-gray-400 uppercase mb-1">{t('manageInvestment.actionRequired')}</span>
                                    {Math.abs(qtyDiff) > 0.000001 ? (
                                        <div className="flex justify-between items-center">
                                            <span className={`font-bold ${isBuyAction ? 'text-green-600' : 'text-red-600'}`}>
                                                {isBuyAction 
                                                    ? t('manageInvestment.buyMore', {qty: absQtyDiff.toFixed(2), symbol: investment.symbol}) 
                                                    : t('manageInvestment.sellSome', {qty: absQtyDiff.toFixed(2), symbol: investment.symbol})
                                                }
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Math.abs(valDiff))}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-green-600 font-bold flex items-center gap-1">
                                            {t('manageInvestment.onTrack')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button onClick={handleSaveTarget} className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-bold transition-colors">
                                    {t('manageInvestment.saveTarget')}
                                </button>
                                {Math.abs(valDiff) > 1 && (
                                    <button 
                                        onClick={handleExecuteRebalance} 
                                        disabled={!canExecuteRebalance}
                                        className={`flex-1 py-3 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isBuyAction ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                                    >
                                        {isBuyAction ? t('manageInvestment.buy') : t('manageInvestment.sell')}
                                    </button>
                                )}
                            </div>
                            {isBuyAction && valDiff > cashBalance && (
                                <p className="text-xs text-red-500 text-center mt-2">{t('manageInvestment.insufficientFunds')}</p>
                            )}
                        </>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes fade-in-scale {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ManageInvestmentModal;
