
import React, { useState } from 'react';
import { Investment, AssetType } from '../types';
import { XIcon, SparklesIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';
import { searchAssets, AssetSearchResult } from '../services/geminiService';

interface AddInvestmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (investment: Omit<Investment, 'id' | 'currentPrice'>) => void;
    currency: string;
}

const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({ isOpen, onClose, onAdd, currency }) => {
    const { t } = useI18n();
    const [symbol, setSymbol] = useState('');
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [avgBuyPrice, setAvgBuyPrice] = useState('');
    const [type, setType] = useState<AssetType>('Stock');
    const [error, setError] = useState('');

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<AssetSearchResult[]>([]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!symbol || !name || !quantity || !avgBuyPrice) {
            setError(t('general.error.requiredFields'));
            return;
        }
        
        onAdd({
            symbol: symbol.toUpperCase(),
            name,
            quantity: parseFloat(quantity),
            avgBuyPrice: parseFloat(avgBuyPrice),
            type
        });
        
        // Reset form
        setSymbol('');
        setName('');
        setQuantity('');
        setAvgBuyPrice('');
        setType('Stock');
        setError('');
        setSearchQuery('');
        setSearchResults([]);
        onClose();
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setSearchResults([]);
        const results = await searchAssets(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
    };

    const handleSelectAsset = (asset: AssetSearchResult) => {
        setSymbol(asset.symbol);
        setName(asset.name);
        setType(asset.type);
        setAvgBuyPrice(asset.currentPrice.toString());
        setSearchResults([]); // Clear results after selection
        setSearchQuery(''); // Clear search query
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-brand-secondary rounded-xl shadow-2xl w-full max-w-md animate-fade-in-scale max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('modals.addInvestment.title')}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white"><XIcon /></button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-grow">
                    {/* Search Section */}
                    <div className="mb-6 bg-gray-50 dark:bg-brand-primary p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <label className="block text-xs font-bold text-brand-accent uppercase mb-2 flex items-center gap-1">
                            <SparklesIcon className="w-3 h-3" /> {t('modals.addInvestment.searchLabel')}
                        </label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('modals.addInvestment.searchPlaceholder')}
                                className="flex-grow w-full bg-white dark:bg-brand-secondary border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                            />
                            <button 
                                onClick={handleSearch}
                                disabled={isSearching || !searchQuery.trim()}
                                className="bg-brand-accent hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                            >
                                {isSearching ? "..." : t('general.search')}
                            </button>
                        </div>

                        {/* Search Results */}
                        {isSearching && <p className="text-xs text-gray-500 mt-2">{t('modals.addInvestment.searching')}</p>}
                        {!isSearching && searchResults.length === 0 && searchQuery && <p className="text-xs text-gray-400 mt-2 hidden">{t('modals.addInvestment.noResults')}</p>}
                        
                        {searchResults.length > 0 && (
                            <ul className="mt-3 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                {searchResults.map((result, idx) => (
                                    <li key={idx}>
                                        <button 
                                            type="button"
                                            onClick={() => handleSelectAsset(result)}
                                            className="w-full text-left bg-white dark:bg-brand-secondary hover:bg-blue-50 dark:hover:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-700 flex justify-between items-center group transition-colors"
                                        >
                                            <div>
                                                <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{result.symbol}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{result.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-mono text-gray-800 dark:text-gray-200">${result.currentPrice}</p>
                                                <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">{result.type}</span>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.addInvestment.symbol')}</label>
                            <input type="text" value={symbol} onChange={e => setSymbol(e.target.value)} className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200" placeholder="AAPL" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.addInvestment.name')}</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200" placeholder="Apple Inc." required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.addInvestment.quantity')}</label>
                                <input type="number" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200" placeholder="10" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.addInvestment.avgPrice')}</label>
                                <input type="number" step="any" value={avgBuyPrice} onChange={e => setAvgBuyPrice(e.target.value)} className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200" placeholder="150.00" required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.addInvestment.type')}</label>
                            <select value={type} onChange={e => setType(e.target.value as AssetType)} className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200">
                                <option value="Stock">Stock</option>
                                <option value="Crypto">Crypto</option>
                                <option value="Bond">Bond</option>
                                <option value="Real Estate">Real Estate</option>
                                <option value="Mutual Fund">Mutual Fund</option>
                            </select>
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div className="flex justify-end gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg text-gray-800 dark:text-white font-semibold transition-colors hover:bg-gray-300 dark:hover:bg-gray-500">{t('general.cancel')}</button>
                            <button type="submit" className="px-4 py-2 bg-brand-accent hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors">{t('modals.addInvestment.add')}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddInvestmentModal;
