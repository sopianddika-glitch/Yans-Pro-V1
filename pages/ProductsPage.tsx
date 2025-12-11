
import React, { useState, useMemo } from 'react';
import { Product, Page } from '../types';
import { AddIcon, TagIcon, EditIcon, DeleteIcon, CameraIcon } from '../components/Icons';
import EmptyState from '../components/EmptyState';
import { useI18n } from '../hooks/useI18n';
import BarcodeScannerModal from '../components/BarcodeScannerModal';

interface ProductsPageProps {
    products: Product[];
    currency: string;
    onOpenModal: (product: Product | null) => void;
    onDelete: (id: string) => void;
    onNavigate: (page: Page) => void;
}

const formatCurrency = (value: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

const ProductCard: React.FC<{ product: Product; currency: string; onEdit: () => void; onDelete: () => void; }> = 
({ product, currency, onEdit, onDelete }) => {
    const { t } = useI18n();
    
    // Logic for low stock badge
    const isLowStock = product.trackStock && (product.stock || 0) <= (product.minStock || 0);
    const stockCount = product.trackStock ? product.stock : null;

    return (
        <div className="bg-white dark:bg-brand-secondary p-5 rounded-xl shadow-md dark:shadow-lg flex flex-col justify-between transform hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
            {isLowStock && (
                <div className="absolute top-0 right-0 bg-brand-red text-white text-xs font-bold px-2 py-1 rounded-bl-lg z-10">
                    {t('productsPage.lowStock')}
                </div>
            )}
            <div>
                <div className="flex justify-between items-start gap-2">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex-grow line-clamp-1" title={product.name}>{product.name}</h3>
                    <div className="flex items-center flex-shrink-0 pt-1">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 text-gray-500 dark:text-gray-400 hover:text-brand-accent transition-colors"><EditIcon className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-gray-500 dark:text-gray-400 hover:text-brand-red transition-colors"><DeleteIcon className="w-4 h-4" /></button>
                    </div>
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-brand-primary dark:text-gray-300">
                        {product.type === 'service' ? t('modals.addProduct.service') : t('modals.addProduct.good')}
                    </span>
                    {product.trackStock && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isLowStock ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                            {t('productsPage.stock', {count: stockCount})}
                        </span>
                    )}
                </div>
                {product.sku && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-mono">SKU: {product.sku}</p>}
                {product.description && <p className="text-sm text-gray-500 dark:text-brand-muted mt-2 line-clamp-2">{product.description}</p>}
            </div>
            <div className="mt-4 text-right">
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{formatCurrency(product.price, currency)}</p>
            </div>
        </div>
    );
};

const ProductsPage: React.FC<ProductsPageProps> = ({ products, currency, onOpenModal, onDelete, onNavigate }) => {
    const { t } = useI18n();
    const [searchTerm, setSearchTerm] = useState('');
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const handleDelete = (id: string, name: string) => {
        if(window.confirm(t('productsPage.deleteConfirm', { productName: name }))) {
            onDelete(id);
        }
    };
    
    const filteredProducts = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return products.filter(product =>
            product.name.toLowerCase().includes(lowerSearch) || 
            (product.sku && product.sku.toLowerCase().includes(lowerSearch))
        );
    }, [products, searchTerm]);

    const handleScan = (code: string) => {
        setSearchTerm(code);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-brand-primary min-h-full">
            <div className="flex flex-col gap-4 sm:flex-row justify-between sm:items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{t('productsPage.title')}</h1>
                <button
                    onClick={() => onOpenModal(null)}
                    className="flex items-center justify-center gap-2 bg-brand-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                >
                    <AddIcon />
                    <span>{t('productsPage.create')}</span>
                </button>
            </div>
            
            <div className="mb-6 relative max-w-md">
                <input
                    type="text"
                    placeholder={t('productsPage.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-brand-secondary border border-gray-300 dark:border-gray-700 rounded-lg p-3 pr-12 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                />
                <button 
                    onClick={() => setIsScannerOpen(true)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-accent"
                    title={t('posPage.scanBarcode')}
                >
                    <CameraIcon className="w-5 h-5"/>
                </button>
            </div>

            {filteredProducts.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProducts.map(product => (
                        <ProductCard 
                            key={product.id} 
                            product={product} 
                            currency={currency}
                            onEdit={() => onOpenModal(product)}
                            onDelete={() => handleDelete(product.id, product.name)}
                        />
                    ))}
                 </div>
            ) : (
                <EmptyState
                    Icon={TagIcon}
                    title={t('productsPage.noProducts')}
                    message={t('productsPage.getStarted')}
                    action={{
                        label: t('productsPage.create'),
                        onClick: () => onOpenModal(null)
                    }}
                />
            )}
            
            <BarcodeScannerModal 
                isOpen={isScannerOpen} 
                onClose={() => setIsScannerOpen(false)} 
                onScan={handleScan}
            />
        </div>
    );
};

export default ProductsPage;
