import React from 'react';
import { Invoice, Profile } from '../types';

interface InvoicePDFTemplateProps {
    invoice: Invoice;
    profile: Profile;
    currency: string;
}

const formatCurrency = (value: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(value);

const InvoicePDFTemplate: React.FC<InvoicePDFTemplateProps> = ({ invoice, profile, currency }) => {
    const totalAmount = invoice.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    return (
        <div className="bg-white text-gray-900 font-sans p-8" id="invoice-pdf">
            <div className="grid grid-cols-2 gap-8 mb-12 border-b-2 border-gray-100 pb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">{profile.name}</h1>
                    <div className="text-gray-500 text-sm mt-2 space-y-1">
                        {profile.address && <p>{profile.address}</p>}
                        {profile.phone && <p>{profile.phone}</p>}
                        {profile.email && <p>{profile.email}</p>}
                        {profile.website && <p>{profile.website}</p>}
                        {profile.taxId && <p className="font-semibold text-gray-600 mt-2">Tax ID: {profile.taxId}</p>}
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-4xl font-bold text-gray-400 uppercase tracking-wider">Invoice</h2>
                    <p className="text-gray-600 mt-1 font-mono text-lg"># {invoice.id.slice(-6)}</p>
                    <div className="mt-4 text-sm text-gray-600">
                        <p><span className="font-bold text-gray-500">Issued:</span> {new Date(invoice.issueDate + 'T00:00:00').toLocaleDateString()}</p>
                        <p><span className="font-bold text-gray-500">Due:</span> {new Date(invoice.dueDate + 'T00:00:00').toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            <div className="mb-12">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>
                <div className="text-gray-800 text-lg font-semibold">{invoice.clientName}</div>
            </div>

            <table className="w-full mb-12">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="text-left py-3 px-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Description</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Quantity</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Unit Price</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {invoice.items.map(item => (
                        <tr key={item.id}>
                            <td className="py-4 px-4 text-left font-medium">{item.description}</td>
                            <td className="py-4 px-4 text-right text-gray-600">{item.quantity}</td>
                            <td className="py-4 px-4 text-right text-gray-600">{formatCurrency(item.price, currency)}</td>
                            <td className="py-4 px-4 text-right font-semibold text-gray-800">{formatCurrency(item.quantity * item.price, currency)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end mb-12">
                <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between text-gray-600 text-sm">
                        <p>Subtotal</p>
                        <p>{formatCurrency(totalAmount, currency)}</p>
                    </div>
                     <div className="flex justify-between text-gray-600 text-sm border-b border-gray-200 pb-2">
                        <p>Tax (0%)</p>
                        <p>{formatCurrency(0, currency)}</p>
                    </div>
                    <div className="flex justify-between font-bold text-gray-800 text-xl pt-2">
                        <p>Total</p>
                        <p>{formatCurrency(totalAmount, currency)}</p>
                    </div>
                </div>
            </div>

            {invoice.notes && (
                <div className="mt-12 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h4 className="font-bold text-gray-700 mb-1 text-sm">Notes</h4>
                    <p className="text-gray-600 text-sm">{invoice.notes}</p>
                </div>
            )}
            
            <div className="mt-12 text-center text-xs text-gray-400 pt-8 border-t border-gray-100">
                <p>Thank you for your business!</p>
                {profile.email && <span>{profile.email}</span>}
                {profile.email && profile.website && <span> • </span>}
                {profile.website && <span>{profile.website}</span>}
            </div>
        </div>
    );
};

export default InvoicePDFTemplate;
