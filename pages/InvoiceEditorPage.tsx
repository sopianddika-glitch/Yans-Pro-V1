

import React, { useState, useEffect, useCallback } from 'react';
import { Invoice, InvoiceItem, InvoiceStatus, Profile, Product } from '../types';
import { AddIcon, DeleteIcon, PrintIcon, CheckIcon } from '../components/Icons';
import InvoicePDFTemplate from '../components/InvoicePDFTemplate';
import ProductSelectorInput from '../components/ProductSelectorInput';
import { renderToStaticMarkup } from 'react-dom/server';
import { useI18n } from '../hooks/useI18n';

interface InvoiceEditorPageProps {
    onSave: (invoice: Omit<Invoice, 'id' | 'profileId'> | Invoice) => void;
    onBack: () => void;
    existingInvoice?: Invoice;
    currency: string;
    profile: Profile;
    products: Product[];
    onDelete: (id: string) => void;
}

const InvoiceEditorPage: React.FC<InvoiceEditorPageProps> = ({ onSave, onBack, existingInvoice, currency, profile, products, onDelete }) => {
    const { t } = useI18n();
    const [clientName, setClientName] = useState('');
    const [issueDate, setIssueDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [items, setItems] = useState<Omit<InvoiceItem, 'id'>[]>([]);
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState<InvoiceStatus>(InvoiceStatus.DRAFT);
    const [error, setError] = useState('');

    const isPaidAndLocked = existingInvoice?.status === InvoiceStatus.PAID;
    
    useEffect(() => {
        if (existingInvoice) {
            setClientName(existingInvoice.clientName);
            setIssueDate(existingInvoice.issueDate);
            setDueDate(existingInvoice.dueDate);
            setItems(existingInvoice.items.map(({id, ...rest}) => rest)); // remove id for editing
            setNotes(existingInvoice.notes || '');
            setStatus(existingInvoice.status);
        } else {
            const today = new Date().toISOString().split('T')[0];
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            const defaultDueDate = futureDate.toISOString().split('T')[0];
            setClientName('');
            setIssueDate(today);
            setDueDate(defaultDueDate);
            setItems([{ description: '', quantity: 1, price: 0 }]);
            setNotes('');
            setStatus(InvoiceStatus.DRAFT);
        }
    }, [existingInvoice]);

    const handleItemChange = (index: number, field: keyof Omit<InvoiceItem, 'id'>, value: string | number) => {
        const newItems = [...items];
        const itemToUpdate = { ...newItems[index] };
        
        if (field === 'quantity' || field === 'price') {
            const numericValue = Number(value);
            if (!isNaN(numericValue) && numericValue >= 0) {
                 itemToUpdate[field] = numericValue;
            }
        } else {
            itemToUpdate[field] = value as string;
        }
        
        newItems[index] = itemToUpdate;
        setItems(newItems);
    };
    
    const handleProductSelect = (index: number, product: Product) => {
        const newItems = [...items];
        newItems[index] = {
            ...newItems[index],
            description: product.name,
            price: product.price,
        };
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, price: 0 }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
        }
    };
    
    const handleSave = () => {
        if (isPaidAndLocked) return; // Prevent saving if locked
        if (!clientName || !issueDate || !dueDate) {
            setError(t('general.error.requiredFields'));
            return;
        }
        if (items.some(item => !item.description || item.quantity <= 0 || item.price < 0)) {
            setError(t('invoiceEditor.errorItems'));
            return;
        }
        
        const invoiceData = {
            clientName,
            issueDate,
            dueDate,
            items: items.map(item => ({ ...item, id: Math.random().toString() })), // Add temp id
            notes,
            status,
        };
        
        if (existingInvoice) {
            onSave({ ...existingInvoice, ...invoiceData });
        } else {
            onSave(invoiceData);
        }
    };
    
    const handleDownloadPdf = () => {
        const invoiceDataForPdf = {
            id: existingInvoice?.id || 'DRAFT-ID',
            profileId: existingInvoice?.profileId || profile.id,
            clientName, issueDate, dueDate, items: items.map(item => ({...item, id: Math.random().toString()})), notes, status
        };
        const markup = renderToStaticMarkup(<InvoicePDFTemplate invoice={invoiceDataForPdf} profile={profile} currency={currency} />);
        const printWindow = window.open('', '_blank');
        printWindow?.document.write(`
            <html>
                <head>
                    <title>Invoice #${invoiceDataForPdf.id.slice(-6)}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                </head>
                <body class="bg-white">${markup}</body>
            </html>
        `);
        printWindow?.document.close();
        printWindow?.focus();
        setTimeout(() => { printWindow?.print(); printWindow?.close(); }, 250);
    }
    
    const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const pageTitle = existingInvoice 
        ? t('invoiceEditor.editTitle', { id: existingInvoice.id.slice(-6) }) 
        : t('invoiceEditor.createTitle');

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-brand-primary min-h-full">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{pageTitle}</h1>
                    <div className="flex items-center gap-2 flex-wrap">
                         <button onClick={onBack} className="py-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold transition-colors">{t('invoiceEditor.back')}</button>
                         {existingInvoice && (
                             <button onClick={() => onDelete(existingInvoice.id)} className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-400 font-semibold transition-colors" aria-label={t('general.delete')}>
                                 <DeleteIcon />
                             </button>
                         )}
                         <button onClick={handleDownloadPdf} className="p-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold transition-colors" aria-label={t('reportsPage.print')}><PrintIcon/></button>
                         <button onClick={handleSave} disabled={isPaidAndLocked} className="py-2 px-4 rounded-lg bg-brand-accent hover:bg-blue-600 text-white font-semibold transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">{t('invoiceEditor.save')}</button>
                    </div>
                </div>

                {isPaidAndLocked && (
                    <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-600 text-green-800 dark:text-green-300 p-4 rounded-lg text-sm mb-6 flex items-center gap-3">
                        <CheckIcon className="w-5 h-5 flex-shrink-0" />
                        <div>
                            <span className="font-bold">{t('invoiceEditor.paidNoticeTitle')}</span>
                            <span> {t('invoiceEditor.paidNoticeDescription')}</span>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-brand-secondary p-4 sm:p-6 rounded-xl shadow-md dark:shadow-lg space-y-6">
                    {error && <div className="bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-brand-red text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">{error}</div>}

                    {/* Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                         <div className="md:col-span-2">
                            <label htmlFor="clientName" className="block text-sm font-medium text-gray-500 dark:text-brand-muted mb-1">{t('invoiceEditor.clientName')}</label>
                            <input type="text" id="clientName" value={clientName} onChange={e => setClientName(e.target.value)} disabled={isPaidAndLocked} className="w-full bg-gray-50 dark:bg-brand-primary border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed" />
                        </div>
                        <div>
                            <label htmlFor="issueDate" className="block text-sm font-medium text-gray-500 dark:text-brand-muted mb-1">{t('invoiceEditor.issueDate')}</label>
                            <input type="date" id="issueDate" value={issueDate} onChange={e => setIssueDate(e.target.value)} disabled={isPaidAndLocked} className="w-full bg-gray-50 dark:bg-brand-primary border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed" />
                        </div>
                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-500 dark:text-brand-muted mb-1">{t('invoicesPage.dueDate')}</label>
                            <input type="date" id="dueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} disabled={isPaidAndLocked} className="w-full bg-gray-50 dark:bg-brand-primary border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed" />
                        </div>
                    </div>

                    {/* Items List */}
                    <div>
                        {/* Desktop Table View */}
                        <div className="hidden md:block">
                            <table className="min-w-full">
                                <thead className="border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 w-1/2">{t('invoiceEditor.itemDescription')}</th>
                                        <th className="py-2 px-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">{t('invoiceEditor.itemQty')}</th>
                                        <th className="py-2 px-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">{t('invoiceEditor.itemPrice')}</th>
                                        <th className="py-2 px-2 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">{t('invoiceEditor.itemTotal')}</th>
                                        <th className="py-2 w-12"><span className="sr-only">Delete</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                                            <td className="pr-2 py-1 align-top">
                                                 <ProductSelectorInput
                                                    products={products}
                                                    value={item.description}
                                                    onChange={value => handleItemChange(index, 'description', value)}
                                                    onSelect={product => handleProductSelect(index, product)}
                                                    disabled={isPaidAndLocked}
                                                 />
                                            </td>
                                            <td className="px-2 py-1 align-top"><input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} disabled={isPaidAndLocked} className="w-20 bg-gray-50 dark:bg-brand-primary border-gray-300 dark:border-gray-700 rounded my-1 p-2 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed" min="1" /></td>
                                            <td className="px-2 py-1 align-top"><input type="number" value={item.price} onChange={e => handleItemChange(index, 'price', e.target.value)} disabled={isPaidAndLocked} className="w-28 bg-gray-50 dark:bg-brand-primary border-gray-300 dark:border-gray-700 rounded my-1 p-2 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed" min="0" step="0.01" /></td>
                                            <td className="text-right p-2 font-mono text-gray-800 dark:text-gray-200 align-top leading-10">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(item.quantity * item.price)}</td>
                                            <td className="text-right p-2 align-top"><button onClick={() => removeItem(index)} disabled={isPaidAndLocked} className="text-brand-red hover:text-red-400 p-1 mt-1 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed" aria-label="Delete item"><DeleteIcon /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {items.map((item, index) => (
                                <div key={index} className="p-4 rounded-lg border bg-gray-50 dark:bg-brand-primary border-gray-200 dark:border-gray-700 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="w-full">
                                            <ProductSelectorInput
                                                products={products}
                                                value={item.description}
                                                onChange={value => handleItemChange(index, 'description', value)}
                                                onSelect={product => handleProductSelect(index, product)}
                                                isMobile={true}
                                                disabled={isPaidAndLocked}
                                             />
                                        </div>
                                        <button onClick={() => removeItem(index)} disabled={isPaidAndLocked} className="text-brand-red hover:text-red-400 p-1 -mt-1 -mr-1 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed" aria-label="Delete item"><DeleteIcon /></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-brand-muted">{t('invoiceEditor.itemQty')}</label>
                                            <input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} disabled={isPaidAndLocked} className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded mt-1 p-2 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed" min="1" />
                                        </div>
                                         <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-brand-muted">{t('invoiceEditor.itemPrice')}</label>
                                            <input type="number" value={item.price} onChange={e => handleItemChange(index, 'price', e.target.value)} disabled={isPaidAndLocked} className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded mt-1 p-2 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed" min="0" />
                                        </div>
                                    </div>
                                     <div className="text-right text-lg font-bold text-gray-800 dark:text-gray-200">
                                         {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(item.quantity * item.price)}
                                     </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={addItem} disabled={isPaidAndLocked} className="mt-4 flex items-center gap-1 text-sm font-semibold text-brand-accent hover:text-blue-400 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed"><AddIcon /> {t('invoiceEditor.addItem')}</button>
                    </div>

                    {/* Footer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-500 dark:text-brand-muted mb-1">{t('general.notes')}</label>
                            <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} disabled={isPaidAndLocked} className="w-full bg-gray-50 dark:bg-brand-primary border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed" placeholder="e.g., Thank you for your business."></textarea>
                            
                            <div className="mt-4">
                                <label htmlFor="status" className="block text-sm font-medium text-gray-500 dark:text-brand-muted mb-1">{t('general.status')}</label>
                                <select id="status" value={status} onChange={e => setStatus(e.target.value as InvoiceStatus)} disabled={isPaidAndLocked} className="w-full sm:w-auto bg-gray-50 dark:bg-brand-primary border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed">
                                    <option value={InvoiceStatus.DRAFT}>Draft</option>
                                    <option value={InvoiceStatus.SENT}>Sent</option>
                                    <option value={InvoiceStatus.PAID}>Paid</option>
                                </select>
                            </div>
                        </div>
                        <div className="text-right space-y-2 mt-4 md:mt-0">
                             <div className="flex justify-between text-lg">
                                <span className="text-gray-500 dark:text-brand-muted">{t('invoiceEditor.subtotal')}</span>
                                <span className="font-mono text-gray-800 dark:text-gray-200">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(total)}</span>
                             </div>
                             <div className="flex justify-between text-2xl font-bold text-gray-800 dark:text-gray-100">
                                 <span>{t('invoicesPage.total')}:</span>
                                 <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(total)}</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceEditorPage;