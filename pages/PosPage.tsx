
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Product, CartItem, ProductType, Page } from '../types';
import { useI18n } from '../hooks/useI18n';
import EmptyState from '../components/EmptyState';
import { DeleteIcon, StorefrontIcon, TagIcon, CameraIcon, ChevronDownIcon, CheckIcon } from '../components/Icons';
import BarcodeScannerModal from '../components/BarcodeScannerModal';

interface PosPageProps {
    products: Product[];
    currency: string;
    onCharge: (cart: CartItem[], total: number) => void;
    onNavigate: (page: Page) => void;
}

const formatCurrency = (value: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

const PosPage: React.FC<PosPageProps> = ({ products, currency, onCharge, onNavigate }) => {
    const { t } = useI18n();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | ProductType>('all');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scanMessage, setScanMessage] = useState<string | null>(null);
    const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    
    // Reset cart when component is unmounted or profile changes
    useEffect(() => {
        return () => {
            setCart([]);
        };
    }, [products]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            if (e.key === 'Escape') {
                setIsMobileCartOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const addToCart = useCallback((product: Product) => {
        setScanMessage(null);
        // Check stock availability
        if (product.trackStock && (product.stock || 0) <= 0) {
            setScanMessage(t('posPage.outOfStock', {name: product.name}));
            return;
        }

        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            const currentQtyInCart = existingItem ? existingItem.quantity : 0;
            
            // Check if adding one more exceeds available stock
            if (product.trackStock && (currentQtyInCart + 1) > (product.stock || 0)) {
                setScanMessage(t('posPage.notEnoughStock', {name: product.name}));
                return prevCart;
            }

            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
    }, [t]);

    const updateQuantity = useCallback((productId: string, newQuantity: number) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        if (product.trackStock && newQuantity > (product.stock || 0)) {
             setScanMessage(t('posPage.notEnoughStock', {name: product.name}));
             return;
        }

        setCart(prevCart => {
            if (newQuantity <= 0) {
                return prevCart.filter(item => item.id !== productId);
            }
            return prevCart.map(item =>
                item.id === productId ? { ...item, quantity: newQuantity } : item
            );
        });
        setScanMessage(null);
    }, [products, t]);

    const filteredProducts = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return products.filter(p => {
            const searchMatch = p.name.toLowerCase().includes(lowerSearch) || 
                                (p.sku && p.sku.toLowerCase().includes(lowerSearch));
            const filterMatch = filter === 'all' || p.type === filter;
            return searchMatch && filterMatch;
        });
    }, [products, searchTerm, filter]);

    const total = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [cart]);
    
    const cartCount = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }, [cart]);

    const handleChargeClick = () => {
        if(cart.length > 0) {
            onCharge(cart, total);
            setCart([]); // Reset cart after charging
            setIsMobileCartOpen(false);
        }
    }

    const handleScan = (code: string) => {
        const foundProduct = products.find(p => p.sku === code);
        if (foundProduct) {
            addToCart(foundProduct);
            setScanMessage(t('posPage.addedToCart', {name: foundProduct.name}));
        } else {
            setScanMessage(t('posPage.productNotFound', {code}));
        }
    };
    
    if (products.length === 0) {
        return (
             <div className="flex h-full items-center justify-center p-4 bg-gray-50 dark:bg-brand-primary">
                <EmptyState
                    Icon={TagIcon}
                    title={t('posPage.noProductsTitle')}
                    message={t('posPage.noProductsDescription')}
                    action={{
                        label: t('posPage.addProduct'),
                        onClick: () => onNavigate('products')
                    }}
                />
            </div>
        )
    }

    return (
        <div className="flex flex-col md:flex-row h-full bg-gray-100 dark:bg-brand-primary overflow-hidden relative">
            
            {/* --- RIGHT PANEL: PRODUCT GRID (Main Content) --- */}
            {/* Note: In DOM order, this is mainly 2nd on desktop, but we put it first for logic structure, then use flex order/size */}
            <div className="flex-1 flex flex-col h-full w-full overflow-hidden order-1 md:order-1">
                {/* Search Header */}
                <div className="p-4 bg-white/80 dark:bg-brand-secondary/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 flex-shrink-0 z-10 sticky top-0">
                    <div className="flex gap-2">
                        <div className="relative flex-grow">
                            <input
                                ref={searchInputRef}
                                id="pos-search"
                                type="text"
                                placeholder={`${t('posPage.searchPlaceholder')} (Ctrl+K)`}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-100 dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-3 pr-12 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition appearance-none"
                                inputMode="search"
                            />
                        </div>
                        <button 
                            onClick={() => setIsScannerOpen(true)}
                            className="bg-brand-accent hover:bg-blue-600 text-white font-bold p-3 rounded-lg flex items-center justify-center transition-colors shadow-sm active:scale-95"
                            aria-label={t('posPage.scanBarcode')}
                        >
                            <CameraIcon className="w-6 h-6" />
                        </button>
                    </div>
                     <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
                        {(['all', 'good', 'service'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors whitespace-nowrap border ${filter === f ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white dark:bg-brand-primary hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
                            >
                                {f === 'all' ? t('posPage.allProducts') : f === 'good' ? t('posPage.goods') : t('posPage.services')}
                            </button>
                        ))}
                    </div>
                    {scanMessage && (
                        <div className="mt-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 p-2 text-center text-sm font-medium rounded animate-fade-in-scale flex items-center justify-center gap-2">
                            <CheckIcon className="w-4 h-4"/> {scanMessage}
                        </div>
                    )}
                </div>

                {/* Product Grid */}
                <div className="flex-grow p-4 overflow-y-auto grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3 content-start pb-24 md:pb-4">
                    {filteredProducts.map(product => {
                        const isOutOfStock = product.trackStock && (product.stock || 0) <= 0;
                        return (
                            <button 
                                key={product.id} 
                                onClick={() => addToCart(product)} 
                                disabled={isOutOfStock}
                                className={`group bg-white dark:bg-brand-secondary rounded-xl shadow-sm hover:shadow-lg active:scale-95 border border-gray-100 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-1 dark:focus:ring-offset-brand-primary transition-all duration-150 flex flex-col text-center relative overflow-hidden h-36 sm:h-48 ${isOutOfStock ? 'opacity-60 cursor-not-allowed' : ''}`}
                                aria-label={`Add ${product.name} to cart. Price: ${product.price}`}
                            >
                                {isOutOfStock && (
                                    <div className="absolute inset-0 bg-gray-100/80 dark:bg-black/60 flex items-center justify-center z-10">
                                        <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">{t('productsPage.outOfStock')}</span>
                                    </div>
                                )}
                                <div className="p-3 flex-grow flex flex-col justify-center items-center w-full">
                                    <h3 className="font-bold text-gray-800 dark:text-white text-sm sm:text-base leading-tight group-hover:text-brand-accent dark:group-hover:text-blue-400 line-clamp-2 w-full break-words">
                                        {product.name}
                                    </h3>
                                    {product.trackStock && (
                                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-brand-muted mt-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{t('productsPage.stock', {count: product.stock ?? 0})}</p>
                                    )}
                                </div>
                                <div className="bg-gray-50 dark:bg-brand-primary/50 py-2 px-3 w-full border-t border-gray-100 dark:border-gray-700/50">
                                    <p className="font-extrabold text-sm sm:text-lg text-brand-accent truncate">
                                        {formatCurrency(product.price, currency)}
                                    </p>
                                </div>
                            </button>
                        )
                    })}
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full py-10 text-center text-gray-500 dark:text-gray-400">
                            <p>No products found matching &ldquo;{searchTerm}&rdquo;</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- LEFT PANEL: CART (Sidebar on Desktop, Drawer on Mobile) --- */}
            <div className={`
                fixed inset-0 z-40 bg-white dark:bg-brand-secondary flex flex-col
                transition-transform duration-300 ease-in-out
                md:static md:w-96 md:border-l md:border-gray-200 md:dark:border-gray-700 md:translate-y-0 md:z-auto order-2 md:order-2
                ${isMobileCartOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
            `}>
                {/* Mobile Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 md:hidden bg-gray-50 dark:bg-brand-primary">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <StorefrontIcon className="w-5 h-5"/>
                        {t('posPage.orderSummary')}
                    </h2>
                    <button 
                        onClick={() => setIsMobileCartOpen(false)} 
                        className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        aria-label="Close cart"
                    >
                        <ChevronDownIcon className="w-5 h-5"/>
                    </button>
                </div>

                {/* Desktop Header */}
                <div className="hidden md:flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-brand-primary">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <StorefrontIcon className="w-5 h-5"/>
                        {t('posPage.orderSummary')}
                    </h2>
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs font-bold">
                        {cartCount} items
                    </span>
                </div>

                {/* Cart Items List */}
                <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-white dark:bg-brand-secondary">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                            <StorefrontIcon className="w-16 h-16 mb-4 opacity-20"/>
                            <p className="text-center">{t('posPage.noItems')}</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex flex-col bg-gray-50 dark:bg-brand-primary p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all animate-fade-in-scale">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-grow min-w-0 pr-2">
                                        <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm leading-tight line-clamp-2">{item.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-brand-muted mt-0.5">{formatCurrency(item.price, currency)} / unit</p>
                                    </div>
                                    <button onClick={() => updateQuantity(item.id, 0)} className="text-gray-400 hover:text-red-500 p-1" aria-label="Remove item"><DeleteIcon className="w-4 h-4"/></button>
                                </div>
                                <div className="flex justify-between items-center bg-white dark:bg-brand-secondary p-1 rounded-lg">
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                                            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-lg font-bold flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors active:scale-90"
                                            aria-label="Decrease quantity"
                                        >
                                            -
                                        </button>
                                        <span className="w-10 text-center font-bold text-gray-800 dark:text-gray-200">{item.quantity}</span>
                                        <button 
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                                            className="w-8 h-8 rounded-lg bg-brand-accent text-white hover:bg-blue-600 text-lg font-bold flex items-center justify-center transition-colors active:scale-90 shadow-sm"
                                            aria-label="Increase quantity"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white mr-2">{formatCurrency(item.price * item.quantity, currency)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Cart Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-brand-primary space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>{t('posPage.subtotal')}</span>
                            <span>{formatCurrency(total, currency)}</span>
                        </div>
                         <div className="flex justify-between text-2xl font-extrabold text-gray-900 dark:text-white">
                            <span>{t('posPage.total')}</span>
                            <span>{formatCurrency(total, currency)}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleChargeClick}
                        disabled={cart.length === 0}
                        className="w-full bg-brand-accent hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl text-lg transition-all shadow-md active:scale-95 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        <span>{t('posPage.charge')}</span>
                        {cart.length > 0 && <span>• {formatCurrency(total, currency)}</span>}
                    </button>
                </div>
            </div>

            {/* --- MOBILE BOTTOM BAR (Trigger for Cart) --- */}
            {!isMobileCartOpen && cart.length > 0 && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-brand-secondary border-t border-gray-200 dark:border-gray-700 p-4 pb-safe z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <button 
                        onClick={() => setIsMobileCartOpen(true)}
                        className="w-full bg-brand-accent text-white font-bold py-3 rounded-xl flex justify-between items-center px-4 shadow-lg active:scale-95 transition-transform"
                    >
                        <div className="flex items-center gap-2">
                            <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-extrabold">{cartCount}</span>
                            <span>View Cart</span>
                        </div>
                        <span className="text-lg">{formatCurrency(total, currency)}</span>
                    </button>
                </div>
            )}
            
            <BarcodeScannerModal 
                isOpen={isScannerOpen} 
                onClose={() => setIsScannerOpen(false)} 
                onScan={handleScan}
            />
        </div>
    );
};

export default PosPage;
