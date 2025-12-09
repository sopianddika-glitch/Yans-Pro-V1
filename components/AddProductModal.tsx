
import React, { useState, useEffect, useCallback } from 'react';
import { Product, ProductType } from '../types';
import { XIcon, CameraIcon, DeleteIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';
import BarcodeScannerModal from './BarcodeScannerModal';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (productData: Omit<Product, 'id'>, productId?: string) => void;
    existingProduct: Product | null;
    currency: string;
    onDelete?: (id: string) => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onSave, existingProduct, currency, onDelete }) => {
    const { t } = useI18n();
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<ProductType>('service');
    
    // Inventory State
    const [sku, setSku] = useState('');
    const [trackStock, setTrackStock] = useState(false);
    const [stock, setStock] = useState('');
    const [minStock, setMinStock] = useState('');
    
    const [error, setError] = useState('');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    
    const isEditMode = !!existingProduct;
    
    const resetForm = useCallback(() => {
        setName(existingProduct?.name || '');
        setPrice(existingProduct?.price.toString() || '');
        setDescription(existingProduct?.description || '');
        setType(existingProduct?.type || 'service');
        
        setSku(existingProduct?.sku || '');
        setTrackStock(existingProduct?.trackStock || false);
        setStock(existingProduct?.stock?.toString() || '0');
        setMinStock(existingProduct?.minStock?.toString() || '5');
        
        setError('');
    }, [existingProduct]);

    useEffect(() => {
        if (isOpen) {
            resetForm();
        }
    }, [isOpen, resetForm]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name || !price) {
            setError(t('general.error.requiredFields'));
            return;
        }
        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice) || numericPrice < 0) {
            setError(t('general.error.positiveAmount'));
            return;
        }
        
        const productData: Omit<Product, 'id'> = {
            name,
            price: numericPrice,
            description,
            type,
            sku: sku || undefined,
            trackStock,
            stock: trackStock ? parseInt(stock) || 0 : undefined,
            minStock: trackStock ? parseInt(minStock) || 0 : undefined
        };
        
        onSave(productData, existingProduct?.id);
    };

    const handleScan = (code: string) => {
        setSku(code);
        setIsScannerOpen(false);
    };

    const handleDelete = () => {
        if (onDelete && existingProduct) {
            if (window.confirm(t('productsPage.deleteConfirm', { productName: existingProduct.name }))) {
                onDelete(existingProduct.id);
            }
        }
    }

    if (!isOpen) return null;
    
    const modalTitle = isEditMode ? t('modals.addProduct.editTitle') : t('modals.addProduct.createTitle');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity duration-300 p-4" aria-modal="true" role="dialog" aria-labelledby="modal-title">
            <div className="bg-white dark:bg-brand-secondary rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h2 id="modal-title" className="text-xl font-bold text-gray-800 dark:text-white">{modalTitle}</h2>
                    <button onClick={onClose} aria-label={t('general.close')} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} noValidate className="flex-grow overflow-hidden flex flex-col">
                    <div className="p-6 space-y-4 overflow-y-auto">
                        <div>
                            <label htmlFor="product-name" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.addProduct.name')}</label>
                            <input type="text" id="product-name" value={name} onChange={e => setName(e.target.value)} required autoFocus className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" placeholder={t('modals.addProduct.namePlaceholder')} />
                        </div>
                        
                        {/* Type Selection */}
                        <div>
                             <label className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.addProduct.type')}</label>
                             <div className="flex gap-4 pt-1">
                                 <label className="inline-flex items-center cursor-pointer">
                                     <input type="radio" name="product-type" value="service" checked={type === 'service'} onChange={() => setType('service')} className="h-4 w-4 text-brand-accent focus:ring-brand-accent border-gray-300"/>
                                     <span className="ml-2 text-gray-900 dark:text-gray-300">{t('modals.addProduct.service')}</span>
                                 </label>
                                  <label className="inline-flex items-center cursor-pointer">
                                     <input type="radio" name="product-type" value="good" checked={type === 'good'} onChange={() => setType('good')} className="h-4 w-4 text-brand-accent focus:ring-brand-accent border-gray-300"/>
                                     <span className="ml-2 text-gray-900 dark:text-gray-300">{t('modals.addProduct.good')}</span>
                                 </label>
                             </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="product-price" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{`${t('modals.addProduct.price')} (${currency})`}</label>
                                <input type="number" id="product-price" value={price} onChange={e => setPrice(e.target.value)} required min="0" step="0.01" className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" placeholder="0.00" />
                            </div>
                            
                            {/* SKU with Scan Button */}
                            <div>
                                <label htmlFor="product-sku" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.addProduct.sku')}</label>
                                <div className="relative flex items-center">
                                    <input type="text" id="product-sku" value={sku} onChange={e => setSku(e.target.value)} className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 pr-10 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" placeholder="SCAN-123" />
                                    <button 
                                        type="button" 
                                        onClick={() => setIsScannerOpen(true)}
                                        className="absolute right-2 text-gray-500 hover:text-brand-accent transition-colors"
                                        title={t('modals.addProduct.scanBarcode')}
                                    >
                                        <CameraIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Inventory Tracking Section */}
                        {type === 'good' && (
                            <div className="bg-gray-50 dark:bg-brand-primary/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox" checked={trackStock} onChange={e => setTrackStock(e.target.checked)} className="h-4 w-4 text-brand-accent focus:ring-brand-accent border-gray-300 rounded" />
                                    <span className="ml-2 font-medium text-gray-700 dark:text-gray-200">{t('modals.addProduct.trackStock')}</span>
                                </label>
                                
                                {trackStock && (
                                    <div className="grid grid-cols-2 gap-4 animate-fade-in-scale">
                                        <div>
                                            <label htmlFor="current-stock" className="block text-xs font-medium text-gray-500 dark:text-brand-muted mb-1">{t('modals.addProduct.currentStock')}</label>
                                            <input type="number" id="current-stock" value={stock} onChange={e => setStock(e.target.value)} className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                                        </div>
                                        <div>
                                            <label htmlFor="min-stock" className="block text-xs font-medium text-gray-500 dark:text-brand-muted mb-1">{t('modals.addProduct.minStock')}</label>
                                            <input type="number" id="min-stock" value={minStock} onChange={e => setMinStock(e.target.value)} className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label htmlFor="product-description" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.addProduct.description')}</label>
                            <textarea id="product-description" rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" placeholder={t('modals.addProduct.descriptionPlaceholder')} />
                        </div>
                        
                        {error && <p className="text-sm text-red-600 dark:text-brand-red text-center" role="alert">{error}</p>}
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-800/50 px-6 py-4 flex justify-between gap-4 rounded-b-xl flex-shrink-0">
                        <div>
                            {isEditMode && onDelete && existingProduct && (
                                <button type="button" onClick={handleDelete} className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-400 transition-colors" aria-label={t('general.delete')}>
                                    <DeleteIcon />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold transition-colors">{t('general.cancel')}</button>
                            <button type="submit" className="py-2 px-4 rounded-lg bg-brand-accent hover:bg-blue-600 text-white font-semibold transition-colors">{t('general.save')}</button>
                        </div>
                    </div>
                </form>
            </div>
            
            <BarcodeScannerModal 
                isOpen={isScannerOpen} 
                onClose={() => setIsScannerOpen(false)} 
                onScan={handleScan}
            />

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

export default AddProductModal;
