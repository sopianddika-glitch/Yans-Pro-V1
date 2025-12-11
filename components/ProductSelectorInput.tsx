import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product } from '../types';

interface ProductSelectorInputProps {
    products: Product[];
    value: string;
    onChange: (value: string) => void;
    onSelect: (product: Product) => void;
    isMobile?: boolean;
    disabled?: boolean;
}

const ProductSelectorInput: React.FC<ProductSelectorInputProps> = ({ products, value, onChange, onSelect, isMobile = false, disabled = false }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const suggestions = useMemo(() => {
        if (!value) return [];
        const searchTerm = value.toLowerCase();
        return products.filter(p => p.name.toLowerCase().includes(searchTerm));
    }, [products, value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (product: Product) => {
        onSelect(product);
        setShowSuggestions(false);
    };

    const inputClasses = isMobile
        ? "w-full text-lg font-semibold bg-transparent focus:outline-none text-gray-800 dark:text-gray-100 disabled:bg-transparent disabled:cursor-not-allowed"
        : "w-full bg-gray-50 dark:bg-brand-primary border-gray-300 dark:border-gray-700 rounded my-1 p-2 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed";
        
    return (
        <div className="relative w-full" ref={wrapperRef}>
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                onFocus={() => !disabled && setShowSuggestions(true)}
                className={inputClasses}
                placeholder="Service or product name"
                autoComplete="off"
                disabled={disabled}
            />
            {showSuggestions && !disabled && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-brand-secondary border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                    {suggestions.map(product => (
                        <li key={product.id}>
                            <button
                                type="button"
                                onClick={() => handleSelect(product)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-brand-accent hover:text-white"
                            >
                                <div className="flex justify-between">
                                    <span className="font-semibold">{product.name}</span>
                                    <span className="text-gray-500 dark:text-brand-muted">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price)}</span>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ProductSelectorInput;