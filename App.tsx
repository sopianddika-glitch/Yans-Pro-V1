
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Transaction, TransactionType, FinancialSummary, Page, Category, ReceiptAnalysisResult, RecurringTransaction, Frequency, Budget, Profile, Invoice, InvoiceItem, InvoiceStatus, Theme, SupportedLocale, Goal, Product, CartItem, ChatMessage, AiActionResponse, ProductType, Client, Investment, AppNotification, NotificationType, TransactionAudit, AuditAction } from './types';
import Header from './components/Header';
import AddTransactionModal from './components/AddTransactionModal';
import ReceiptScannerModal from './components/ReceiptScannerModal';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/TransactionsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import BudgetsPage from './pages/BudgetsPage';
import InvoicesPage from './pages/InvoicesPage';
import InvoiceEditorPage from './pages/InvoiceEditorPage';
import GoalsPage from './pages/GoalsPage';
import AddGoalModal from './components/AddGoalModal';
import AddFundsModal from './components/AddFundsModal';
import ProductsPage from './pages/ProductsPage';
import AddProductModal from './components/AddProductModal';
import PosPage from './pages/PosPage';
import PaymentModal from './components/PaymentModal';
import ClientSelectorModal from './components/ClientSelectorModal';
import ChatAssistantButton from './components/ChatAssistantButton';
import ChatAssistantModal from './components/ChatAssistantModal';
import InstallInstructionsModal from './components/InstallInstructionsModal';
import ImportTransactionsModal from './components/ImportTransactionsModal';
import ClientsPage from './pages/ClientsPage';
import InvestmentsPage from './pages/InvestmentsPage';
import EnterprisePage from './pages/EnterprisePage';
import NotificationToast from './components/NotificationToast';
import AddClientModal from './components/AddClientModal';
import AddBudgetModal from './components/AddBudgetModal';
import AuditLogModal from './components/AuditLogModal';
import { I18nProvider } from './context/I18nContext';
import { useI18n } from './hooks/useI18n';
import { encryptData, decryptData } from './services/cryptoService';
import { getChatResponse } from './services/geminiService';


// --- PROFILE DATA STRUCTURE ---
interface ProfileData {
    transactions: Transaction[];
    auditLog: TransactionAudit[];
    categories: Category[];
    budgets: Budget[];
    recurringTransactions: RecurringTransaction[];
    invoices: Invoice[];
    goals: Goal[];
    products: Product[];
    clients: Client[];
    investments: Investment[];
    lastRecurringCheck?: string;
}

// --- INITIAL & DEFAULT DATA ---
const defaultCategories: Category[] = [
    { id: 'group-inc-1', name: 'Client Revenue', type: TransactionType.INCOME },
    { id: 'cat-1', name: 'Service Fees', type: TransactionType.INCOME, parentId: 'group-inc-1' },
    { id: 'cat-2', name: 'Product Sales', type: TransactionType.INCOME, parentId: 'group-inc-1' },
    { id: 'group-exp-1', name: 'Operating Expenses', type: TransactionType.EXPENSE },
    { id: 'cat-4', name: 'Software & Subscriptions', type: TransactionType.EXPENSE, parentId: 'group-exp-1' },
    { id: 'cat-5', name: 'Marketing & Advertising', type: TransactionType.EXPENSE, parentId: 'group-exp-1' },
    { id: 'group-exp-2', name: 'General & Admin', type: TransactionType.EXPENSE },
    { id: 'cat-6', name: 'Office Supplies', type: TransactionType.EXPENSE, parentId: 'group-exp-2' },
    { id: 'cat-7', name: 'Utilities', type: TransactionType.EXPENSE, parentId: 'group-exp-2' },
    { id: 'cat-goals', name: 'Savings & Goals', type: TransactionType.EXPENSE, parentId: 'group-exp-2' }
];

const initialData: ProfileData = {
    transactions: [
        { id: '1', date: '2024-07-15T09:30:00Z', description: 'Initial Project Payment', amount: 5000, type: TransactionType.INCOME, category: 'Service Fees' },
        { id: '2', date: '2024-07-14T14:00:00Z', description: 'Cloud Hosting Subscription', amount: 75, type: TransactionType.EXPENSE, category: 'Software & Subscriptions', recurringTransactionId: 'rec-1' },
    ],
    auditLog: [],
    categories: defaultCategories,
    budgets: [ { id: 'bud-1', categoryId: 'group-exp-1', amount: 2000, period: 'monthly' } ],
    recurringTransactions: [ { id: 'rec-1', description: 'Cloud Hosting Subscription', amount: 75, type: TransactionType.EXPENSE, category: 'Software & Subscriptions', frequency: Frequency.MONTHLY, interval: 1, startDate: '2024-01-14' } ],
    invoices: [],
    goals: [],
    products: [
        { id: 'prod-1', name: 'Web Design Package', description: 'Complete 5-page website design', price: 1500, type: 'service' },
        { id: 'prod-2', name: 'SEO Audit', description: 'Comprehensive site analysis and report', price: 300, type: 'service' },
        { id: 'prod-3', name: 'Logo Design', description: 'Custom vector logo with 3 revisions', price: 500, type: 'service' },
        { id: 'prod-4', name: 'Social Media Management', description: 'Monthly management of 3 platforms', price: 800, type: 'service' },
        { id: 'prod-5', name: 'Consulting Hour', description: 'One hour of business strategy consulting', price: 150, type: 'service' },
        { id: 'prod-6', name: 'Premium WordPress Theme', description: 'Responsive multi-purpose theme license', price: 59, type: 'good', sku: 'THEME-001', trackStock: true, stock: 1000, minStock: 10 },
        { id: 'prod-7', name: 'E-book: Marketing 101', description: 'Digital guide for beginners', price: 29, type: 'good', sku: 'EBOOK-MKT', trackStock: false },
        { id: 'prod-8', name: 'Branded T-Shirt', description: 'Cotton t-shirt with company logo', price: 25, type: 'good', sku: 'MERCH-TSHIRT', trackStock: true, stock: 50, minStock: 5 },
        { id: 'prod-9', name: 'Business Card Printing', description: 'Pack of 500 premium cards', price: 45, type: 'good', sku: 'PRINT-BC500', trackStock: true, stock: 100, minStock: 20 },
        { id: 'prod-10', name: 'Software License (Annual)', description: 'Yearly subscription license key', price: 120, type: 'good', sku: 'SW-LIC-1Y', trackStock: true, stock: 500, minStock: 50 },
    ],
    clients: [],
    investments: [],
};

type PreloadedTransaction = {
    description: string;
    amount: number;
    date: string;
    time: string;
}

// --- HELPER FUNCTIONS ---
const getNextDueDate = (currentDate: Date, frequency: Frequency, interval: number): Date => {
    const nextDate = new Date(currentDate);
    switch(frequency) {
        case Frequency.DAILY: nextDate.setDate(nextDate.getDate() + interval); break;
        case Frequency.WEEKLY: nextDate.setDate(nextDate.getDate() + 7 * interval); break;
        case Frequency.MONTHLY: nextDate.setMonth(nextDate.getMonth() + interval); break;
        case Frequency.YEARLY: nextDate.setFullYear(nextDate.getFullYear() + interval); break;
    }
    return nextDate;
};


const App: React.FC = () => {
    // --- APP LOADING STATE ---
    const [isDataLoading, setIsDataLoading] = useState(true);

    // --- LOCALE & THEME STATE ---
    const [locale, setLocale] = useState<SupportedLocale>(() => {
        const savedLocale = localStorage.getItem('yans-pro-locale');
        return (savedLocale || 'en') as SupportedLocale;
    });

    const [theme, setTheme] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem('yans-pro-theme');
        return (savedTheme || 'system') as Theme;
    });
    
    // --- DATA & UI STATE (with default values) ---
    const [profiles, setProfiles] = useState<Profile[]>([{ id: 'default-profile', name: 'My First Business', currency: 'USD', settings: { allowEdit: true, showDeleted: false } }]);
    const [activeProfileId, setActiveProfileId] = useState<string>('default-profile');
    const [dataByProfile, setDataByProfile] = useState<{ [key: string]: ProfileData }>({ 'default-profile': JSON.parse(JSON.stringify(initialData)) });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For mobile overlay
    const [isSidebarMini, setIsSidebarMini] = useState(false); // For desktop mini mode
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    
    // Transaction Editing State
    const [preloadedTransaction, setPreloadedTransaction] = useState<PreloadedTransaction | null>(null);
    const [editingRecurringTransaction, setEditingRecurringTransaction] = useState<RecurringTransaction | null>(null);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
    const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [posSaleInfo, setPosSaleInfo] = useState<{ cart: CartItem[], total: number } | null>(null);
    const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
    const [transactionsToInvoice, setTransactionsToInvoice] = useState<Transaction[]>([]);
    const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [installPlatform, setInstallPlatform] = useState<'windows' | 'macos' | 'android' | 'ios' | null>(null);
    const [notification, setNotification] = useState<AppNotification | null>(null);
    
    // Client Editing State
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    
    // Budget Editing State
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const [isAddBudgetModalOpen, setIsAddBudgetModalOpen] = useState(false);

    // Audit State
    const [auditTransactionId, setAuditTransactionId] = useState<string | null>(null);

    // --- AI CHAT STATE ---
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const { t } = useI18n();

    useEffect(() => {
        if(isChatOpen && chatHistory.length === 0) {
            setChatHistory([{ role: 'ai', content: t('ai.chat.welcome') }]);
        }
    }, [isChatOpen, chatHistory, t]);
    
    // --- NOTIFICATION HANDLER ---
    const showNotification = useCallback((type: NotificationType, message: string, actionLabel?: string, onAction?: () => void) => {
        setNotification({ id: Date.now().toString(), type, message, actionLabel, onAction });
    }, []);

    const closeNotification = useCallback(() => {
        setNotification(null);
    }, []);

    // --- DATA LOADING EFFECT (DECRYPTION) ---
    useEffect(() => {
        const loadData = async () => {
            setIsDataLoading(true);
            try {
                const savedActiveProfile = localStorage.getItem('yans-pro-active-profile');
                const encryptedProfiles = localStorage.getItem('yans-pro-profiles-encrypted');
                const encryptedData = localStorage.getItem('yans-pro-data-encrypted');
                
                let loadedProfiles: Profile[] | null = null;
                let loadedData: { [key: string]: ProfileData } | null = null;
                let corruptionDetected = false;

                if (encryptedProfiles) {
                    const decrypted = await decryptData(encryptedProfiles);
                    if (decrypted) {
                        try {
                            loadedProfiles = JSON.parse(decrypted);
                        } catch (e) {
                            corruptionDetected = true;
                        }
                    } else {
                        corruptionDetected = true;
                    }
                } else {
                    const legacyProfiles = localStorage.getItem('yans-pro-profiles');
                    if (legacyProfiles) {
                        try {
                            loadedProfiles = JSON.parse(legacyProfiles);
                        } catch(e) { corruptionDetected = true; }
                    }
                }
                
                if (encryptedData && !corruptionDetected) {
                    const decrypted = await decryptData(encryptedData);
                     if (decrypted) {
                        try {
                            loadedData = JSON.parse(decrypted);
                        } catch (e) {
                            corruptionDetected = true;
                        }
                    } else {
                        corruptionDetected = true;
                    }
                } else if (!encryptedData && !corruptionDetected) {
                    const legacyData = localStorage.getItem('yans-pro-data');
                    if (legacyData) {
                        try {
                            loadedData = JSON.parse(legacyData);
                        } catch(e) { corruptionDetected = true; }
                    }
                }

                if (corruptionDetected) {
                    console.info("Data format change or corruption detected. Resetting storage to defaults.");
                    localStorage.removeItem('yans-pro-profiles-encrypted');
                    localStorage.removeItem('yans-pro-data-encrypted');
                    localStorage.removeItem('yans-pro-crypto-key');
                    localStorage.removeItem('yans-pro-profiles');
                    localStorage.removeItem('yans-pro-data');
                }

                if (loadedProfiles) {
                    // Ensure new settings structure exists
                    const updatedProfiles = loadedProfiles.map(p => ({
                        ...p,
                        settings: { allowEdit: true, showDeleted: false, ...p.settings }
                    }));
                    setProfiles(updatedProfiles);
                }
                if (loadedData) {
                    // Ensure audit log exists
                    const migratedData = { ...loadedData };
                    Object.keys(migratedData).forEach(key => {
                        if(!migratedData[key].auditLog) migratedData[key].auditLog = [];
                    });
                    setDataByProfile(migratedData);
                }

                const finalProfiles = loadedProfiles || profiles;
                if (savedActiveProfile && finalProfiles.some(p => p.id === savedActiveProfile)) {
                    setActiveProfileId(savedActiveProfile);
                } else {
                    setActiveProfileId(finalProfiles[0]?.id || 'default-profile');
                }

            } catch (error) {
                console.error("Critical error during data loading. Resetting to defaults.", error);
                localStorage.removeItem('yans-pro-profiles');
                localStorage.removeItem('yans-pro-data');
                localStorage.removeItem('yans-pro-profiles-encrypted');
                localStorage.removeItem('yans-pro-data-encrypted');
            } finally {
                setIsDataLoading(false);
            }
        };

        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- DATA PERSISTENCE EFFECTS (ENCRYPTION) ---
    useEffect(() => {
        if (!isDataLoading) {
            encryptData(JSON.stringify(profiles)).then(encrypted => localStorage.setItem('yans-pro-profiles-encrypted', encrypted));
            if (localStorage.getItem('yans-pro-profiles')) localStorage.removeItem('yans-pro-profiles');
        }
    }, [profiles, isDataLoading]);
    
    useEffect(() => {
        if (!isDataLoading) {
            localStorage.setItem('yans-pro-active-profile', activeProfileId);
        }
    }, [activeProfileId, isDataLoading]);
    
    useEffect(() => {
        if (!isDataLoading) {
            encryptData(JSON.stringify(dataByProfile)).then(encrypted => localStorage.setItem('yans-pro-data-encrypted', encrypted));
            if (localStorage.getItem('yans-pro-data')) localStorage.removeItem('yans-pro-data');
        }
    }, [dataByProfile, isDataLoading]);


    // --- THEME & LOCALE EFFECT ---
    useEffect(() => {
        localStorage.setItem('yans-pro-locale', locale);
        document.documentElement.lang = locale;
    }, [locale]);

    useEffect(() => {
        const root = window.document.documentElement;
        const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        root.classList.toggle('dark', isDark);
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => { if (theme === 'system') root.classList.toggle('dark', mediaQuery.matches); };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);
    
    const handleSetTheme = (newTheme: Theme) => {
        setTheme(newTheme);
        localStorage.setItem('yans-pro-theme', newTheme);
    };

    // --- DERIVED STATE & DATA HELPERS ---
    const activeProfile = useMemo(() => profiles.find(p => p.id === activeProfileId) || profiles[0], [profiles, activeProfileId]);

    const activeProfileData = useMemo(() => {
        const data = dataByProfile[activeProfileId] || initialData;
        return { 
            ...data, 
            transactions: data.transactions || [],
            auditLog: data.auditLog || [],
            products: data.products || [],
            clients: data.clients || [],
            investments: data.investments || []
        };
    }, [dataByProfile, activeProfileId]);

    const { transactions, categories, budgets, recurringTransactions, invoices, goals, products, clients, investments, auditLog } = activeProfileData;

    const setDataForProfile = useCallback((profileId: string, updates: Partial<ProfileData>) => {
        setDataByProfile(prev => ({ ...prev, [profileId]: { ...(prev[profileId] || initialData), ...updates } }));
    }, []);

    const financialSummary = useMemo<FinancialSummary>(() => {
        // Only count non-deleted transactions for summary
        const activeTransactions = transactions.filter(t => !t.deletedAt);
        const totalRevenue = activeTransactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = activeTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
        return { totalRevenue, totalExpenses, netProfit: totalRevenue - totalExpenses, balance: totalRevenue - totalExpenses };
    }, [transactions]);
    
    // --- NAVIGATION & MODAL HANDLERS ---
    const handleNavigate = useCallback((page: Page) => { 
        setCurrentPage(page); 
        setIsSidebarOpen(false);
    }, []);

    const handleSwitchProfile = useCallback((id: string) => setActiveProfileId(id), []);
    const handleOpenAddTransaction = useCallback(() => { 
        setPreloadedTransaction(null); 
        setEditingRecurringTransaction(null); 
        setEditingTransaction(null);
        setIsModalOpen(true); 
    }, []);
    const handleOpenScanner = useCallback(() => setIsScannerOpen(true), []);
    const handleOpenImportModal = useCallback(() => setIsImportModalOpen(true), []);
    
    const handleNavigateToInvoice = useCallback((invoiceId: string | null = null) => {
        setEditingInvoiceId(invoiceId);
        setCurrentPage('invoice-editor');
    }, []);
    
    const handleNavigateToInvoiceFromTransaction = useCallback((invoiceId: string) => {
        setEditingInvoiceId(invoiceId);
        setCurrentPage('invoice-editor');
    }, []);

    const handleOpenInstallModal = useCallback((platform: 'windows' | 'macos' | 'android' | 'ios') => {
        setInstallPlatform(platform);
        setIsInstallModalOpen(true);
    }, []);

    // --- PWA SHORTCUT HANDLER ---
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');
        if (action === 'new_transaction') handleOpenAddTransaction();
        if (action === 'new_invoice') handleNavigateToInvoice();
        if (action && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [handleOpenAddTransaction, handleNavigateToInvoice]);
    
    // --- DATA PROCESSING EFFECTS ---
    useEffect(() => {
        if (isDataLoading) return;
        const today = new Date();
        const updatedInvoices = invoices.map(inv => {
            if (inv.status === InvoiceStatus.SENT || inv.status === InvoiceStatus.DRAFT) {
                const dueDate = new Date(inv.dueDate + 'T00:00:00Z');
                if (dueDate < today) return { ...inv, status: InvoiceStatus.OVERDUE };
            }
            return inv;
        });
        if (JSON.stringify(updatedInvoices) !== JSON.stringify(invoices)) {
            setDataForProfile(activeProfileId, { invoices: updatedInvoices });
        }
    }, [invoices, activeProfileId, setDataForProfile, isDataLoading]);

    const logAudit = useCallback((action: AuditAction, transactionId: string, description?: string, changes?: {field: string, oldValue: unknown, newValue: unknown}[]) => {
        const auditEntry: TransactionAudit = {
            id: `audit-${Date.now()}`,
            transactionId,
            action,
            timestamp: new Date().toISOString(),
            description,
            changes
        };
        const newLog = [auditEntry, ...activeProfileData.auditLog];
        return newLog;
    }, [activeProfileData.auditLog]);

    useEffect(() => {
        if (isDataLoading) return;
        const lastCheck = new Date(activeProfileData.lastRecurringCheck || 0);
        const now = new Date();
        if (now.getTime() - lastCheck.getTime() < 60 * 60 * 1000) return; // Only check once per hour

        const newTransactions: Transaction[] = [];
        recurringTransactions.forEach(rule => {
            const lastTransactionDate: Date | null = transactions.slice().reverse().find(t => t.recurringTransactionId === rule.id)?.date ? new Date(transactions.slice().reverse().find(t => t.recurringTransactionId === rule.id)!.date) : null;
            let cursorDate = lastTransactionDate || new Date(rule.startDate + 'T00:00:00');
            let nextDueDate = getNextDueDate(cursorDate, rule.frequency, rule.interval);

            while(nextDueDate <= now && (!rule.endDate || nextDueDate <= new Date(rule.endDate + 'T23:59:59'))) {
                 newTransactions.push({
                    id: `${rule.id}-${nextDueDate.toISOString()}`, date: nextDueDate.toISOString(), description: rule.description,
                    amount: rule.amount, type: rule.type, category: rule.category, recurringTransactionId: rule.id,
                });
                cursorDate = nextDueDate;
                nextDueDate = getNextDueDate(cursorDate, rule.frequency, rule.interval);
            }
        });

        if (newTransactions.length > 0) {
            // No audit needed for system recurring generation for now, but could be added
            setDataForProfile(activeProfileId, { transactions: [...transactions, ...newTransactions], lastRecurringCheck: now.toISOString() });
            showNotification('info', `${newTransactions.length} recurring transactions created.`);
        } else {
             setDataForProfile(activeProfileId, { lastRecurringCheck: now.toISOString() });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeProfileId, recurringTransactions, isDataLoading]);

    const handleAddTransaction = useCallback((newTransaction: Omit<Transaction, 'id'>) => {
        const fullTransaction = { ...newTransaction, id: new Date().toISOString() + Math.random() };
        const newAuditLog = logAudit('CREATE', fullTransaction.id, 'Transaction created');
        setDataForProfile(activeProfileId, { transactions: [...transactions, fullTransaction], auditLog: newAuditLog });
        setIsModalOpen(false);
        showNotification('success', 'Transaction added successfully.');
    }, [activeProfileId, transactions, setDataForProfile, showNotification, logAudit]);

    const handleUpdateTransaction = useCallback((updatedTransaction: Transaction) => {
        const oldTransaction = transactions.find(t => t.id === updatedTransaction.id);
        if (!oldTransaction) return;

        const changes = [];
        if (oldTransaction.amount !== updatedTransaction.amount) changes.push({ field: 'amount', oldValue: oldTransaction.amount, newValue: updatedTransaction.amount });
        if (oldTransaction.description !== updatedTransaction.description) changes.push({ field: 'description', oldValue: oldTransaction.description, newValue: updatedTransaction.description });
        if (oldTransaction.date !== updatedTransaction.date) changes.push({ field: 'date', oldValue: oldTransaction.date, newValue: updatedTransaction.date });
        if (oldTransaction.category !== updatedTransaction.category) changes.push({ field: 'category', oldValue: oldTransaction.category, newValue: updatedTransaction.category });

        const newAuditLog = logAudit('UPDATE', updatedTransaction.id, 'Transaction updated', changes);
        const finalTransaction = { ...updatedTransaction, lastModified: new Date().toISOString() };

        setDataForProfile(activeProfileId, { 
            transactions: transactions.map(t => t.id === updatedTransaction.id ? finalTransaction : t),
            auditLog: newAuditLog
        });
        setIsModalOpen(false);
        setEditingTransaction(null);
        showNotification('success', 'Transaction updated.');
    }, [activeProfileId, transactions, setDataForProfile, showNotification, logAudit]);

    const handleOpenEditTransactionModal = useCallback((transaction: Transaction) => {
        setEditingTransaction(transaction);
        setEditingRecurringTransaction(null);
        setPreloadedTransaction(null);
        setIsModalOpen(true);
    }, []);

    const handleRestoreTransaction = useCallback((id: string) => {
        const newAuditLog = logAudit('RESTORE', id, 'Transaction restored');
        const updatedTransactions = transactions.map(t => 
            t.id === id ? { ...t, deletedAt: null } : t
        );
        setDataForProfile(activeProfileId, { transactions: updatedTransactions, auditLog: newAuditLog });
        showNotification('success', 'Transaction restored.');
    }, [activeProfileId, transactions, setDataForProfile, showNotification, logAudit]);

    const handleDeleteTransactions = useCallback((ids: string[], isHardDelete = false) => {
        let newTransactions = [...transactions];
        const newAuditLog = [...activeProfileData.auditLog];

        if (isHardDelete) {
            newTransactions = newTransactions.filter(t => !ids.includes(t.id));
            ids.forEach(id => {
                const entry = {
                    id: `audit-${Date.now()}`, transactionId: id, action: 'DELETE' as AuditAction, timestamp: new Date().toISOString(), description: 'Hard deleted'
                };
                newAuditLog.unshift(entry);
            });
        } else {
            // Soft Delete
            const now = new Date().toISOString();
            newTransactions = newTransactions.map(t => {
                if (ids.includes(t.id)) {
                    const entry: TransactionAudit = {
                        id: `audit-${Date.now()}-${t.id}`,
                        transactionId: t.id,
                        action: 'DELETE',
                        timestamp: now,
                        description: 'Transaction soft deleted'
                    };
                    newAuditLog.unshift(entry);
                    return { ...t, deletedAt: now };
                }
                return t;
            });
        }
        
        setDataForProfile(activeProfileId, { transactions: newTransactions, auditLog: newAuditLog });
        
        if (!isHardDelete && ids.length === 1) {
            showNotification('success', 'Transaction deleted.', 'Undo', () => handleRestoreTransaction(ids[0]));
        } else {
            showNotification('success', isHardDelete ? 'Transaction(s) permanently deleted.' : 'Transaction(s) deleted.');
        }

    }, [activeProfileId, transactions, activeProfileData.auditLog, setDataForProfile, showNotification, handleRestoreTransaction]);
    
    // Wrapper for deleting single transaction from modal
    const handleDeleteTransactionFromModal = useCallback((id: string) => {
        handleDeleteTransactions([id]);
        setIsModalOpen(false);
    }, [handleDeleteTransactions]);

    const handleImportTransactions = useCallback((importedTransactions: Omit<Transaction, 'id'>[]) => {
        const newTransactionsWithIds = importedTransactions.map(t => ({
            ...t,
            id: new Date().toISOString() + Math.random(),
        }));
        
        const newAuditLog = [...activeProfileData.auditLog];
        newTransactionsWithIds.forEach(t => {
             newAuditLog.unshift({ id: `audit-${Date.now()}-${t.id}`, transactionId: t.id, action: 'CREATE', timestamp: new Date().toISOString(), description: 'Imported' });
        });

        setDataForProfile(activeProfileId, { transactions: [...transactions, ...newTransactionsWithIds], auditLog: newAuditLog });
        setIsImportModalOpen(false);
        showNotification('success', `${importedTransactions.length} transactions imported successfully!`);
    }, [activeProfileId, transactions, activeProfileData.auditLog, setDataForProfile, showNotification]);


    const handleReceiptSuccess = useCallback((result: ReceiptAnalysisResult) => {
        const now = new Date();
        setPreloadedTransaction({ description: result.vendor, amount: result.totalAmount, date: result.date, time: now.toTimeString().slice(0, 5) });
        setIsScannerOpen(false); setIsModalOpen(true);
    }, []);

    const handleAddRecurringTransaction = useCallback((rule: Omit<RecurringTransaction, 'id'>) => {
        const newRule = { ...rule, id: 'rec-' + new Date().getTime() };
        setDataForProfile(activeProfileId, { recurringTransactions: [...recurringTransactions, newRule] });
        setIsModalOpen(false);
        showNotification('success', 'Recurring transaction rule added.');
    }, [activeProfileId, recurringTransactions, setDataForProfile, showNotification]);

    const handleUpdateRecurringTransaction = useCallback((rule: RecurringTransaction) => {
        const newRules = recurringTransactions.map(r => r.id === rule.id ? rule : r);
        setDataForProfile(activeProfileId, { recurringTransactions: newRules });
        setIsModalOpen(false);
        showNotification('success', 'Recurring transaction rule updated.');
    }, [activeProfileId, recurringTransactions, setDataForProfile, showNotification]);

    const handleDeleteRecurringTransaction = useCallback((id: string) => {
        setDataForProfile(activeProfileId, { recurringTransactions: recurringTransactions.filter(r => r.id !== id) });
        setIsModalOpen(false);
        showNotification('success', 'Recurring transaction rule deleted.');
    }, [activeProfileId, recurringTransactions, setDataForProfile, showNotification]);
    
    const handleOpenRecurringModal = useCallback((rule: RecurringTransaction | null) => {
        setEditingRecurringTransaction(rule); setPreloadedTransaction(null); setEditingTransaction(null); setIsModalOpen(true);
    }, []);

    const handleAddCategory = useCallback((category: Omit<Category, 'id'>) => {
        setDataForProfile(activeProfileId, { categories: [...categories, { ...category, id: 'cat-' + new Date().getTime() }] });
        showNotification('success', 'Category added.');
    }, [activeProfileId, categories, setDataForProfile, showNotification]);

    const handleUpdateCategory = useCallback((category: Category) => {
        setDataForProfile(activeProfileId, { categories: categories.map(c => c.id === category.id ? category : c) });
        showNotification('success', 'Category updated.');
    }, [activeProfileId, categories, setDataForProfile, showNotification]);
    
    const handleDeleteCategory = useCallback((id: string) => {
        setDataForProfile(activeProfileId, { categories: categories.filter(c => c.id !== id && c.parentId !== id) });
        showNotification('success', 'Category deleted.');
    }, [activeProfileId, categories, setDataForProfile, showNotification]);

    const handleAddBudget = useCallback((budget: Omit<Budget, 'id'>) => {
        setDataForProfile(activeProfileId, { budgets: [...budgets, { ...budget, id: 'bud-' + new Date().getTime() }] });
        setIsAddBudgetModalOpen(false);
        showNotification('success', 'Budget added.');
    }, [activeProfileId, budgets, setDataForProfile, showNotification]);

    const handleUpdateBudget = useCallback((budget: Budget) => {
        setDataForProfile(activeProfileId, { budgets: budgets.map(b => b.id === budget.id ? budget : b) });
        setIsAddBudgetModalOpen(false);
        showNotification('success', 'Budget updated.');
    }, [activeProfileId, budgets, setDataForProfile, showNotification]);

    const handleDeleteBudget = useCallback((id: string) => {
        setDataForProfile(activeProfileId, { budgets: budgets.filter(b => b.id !== id) });
        setIsAddBudgetModalOpen(false);
        showNotification('success', 'Budget deleted.');
    }, [activeProfileId, budgets, setDataForProfile, showNotification]);
    
    const handleOpenBudgetModal = useCallback((budget: Budget | null = null) => {
        setEditingBudget(budget);
        setIsAddBudgetModalOpen(true);
    }, []);

    const handleAddProfile = useCallback((profileData: Omit<Profile, 'id'>) => {
        const newProfile = { ...profileData, id: 'prof-' + new Date().getTime(), settings: { allowEdit: true, showDeleted: false } };
        setProfiles(p => [...p, newProfile]);
        setDataByProfile(d => ({ ...d, [newProfile.id]: JSON.parse(JSON.stringify(initialData)) }));
        setActiveProfileId(newProfile.id);
        showNotification('success', 'New profile created.');
    }, [showNotification]);
    
    const handleUpdateProfile = useCallback((profile: Profile) => {
        setProfiles(p => p.map(pr => pr.id === profile.id ? profile : pr));
        showNotification('success', 'Profile updated.');
    }, [showNotification]);

    const handleDeleteProfile = useCallback((id: string) => {
        if (profiles.length <= 1) return;
        const newProfiles = profiles.filter(p => p.id !== id);
        setProfiles(newProfiles);
        setDataByProfile(d => { const newData = { ...d }; delete newData[id]; return newData; });
        if (activeProfileId === id) setActiveProfileId(newProfiles[0].id);
        showNotification('success', 'Profile deleted.');
    }, [profiles, activeProfileId, showNotification]);

    // Client Management Handlers
    const handleOpenClientModal = useCallback((client: Client | null = null) => {
        setEditingClient(client);
        setIsAddClientModalOpen(true);
    }, []);

    const handleAddClient = useCallback((clientData: Omit<Client, 'id' | 'createdAt'>) => {
        const newClient: Client = {
            ...clientData,
            id: 'client-' + new Date().getTime(),
            createdAt: new Date().toISOString()
        };
        setDataForProfile(activeProfileId, { clients: [...clients, newClient] });
        setIsAddClientModalOpen(false);
        showNotification('success', 'Client added.');
    }, [activeProfileId, clients, setDataForProfile, showNotification]);

    const handleUpdateClient = useCallback((client: Client) => {
        setDataForProfile(activeProfileId, { clients: clients.map(c => c.id === client.id ? client : c) });
        setIsAddClientModalOpen(false);
        showNotification('success', 'Client updated.');
    }, [activeProfileId, clients, setDataForProfile, showNotification]);

    const handleDeleteClient = useCallback((id: string) => {
        setDataForProfile(activeProfileId, { clients: clients.filter(c => c.id !== id) });
        setIsAddClientModalOpen(false);
        showNotification('success', 'Client deleted.');
    }, [activeProfileId, clients, setDataForProfile, showNotification]);

    // Investment Handlers
    const handleAddInvestment = useCallback((investmentData: Omit<Investment, 'id' | 'currentPrice'>) => {
        const newInvestment: Investment = {
            ...investmentData,
            id: 'inv-' + new Date().getTime(),
            currentPrice: investmentData.avgBuyPrice // Init with buy price
        };
        setDataForProfile(activeProfileId, { investments: [...investments, newInvestment] });
        showNotification('success', 'Asset added to portfolio.');
    }, [activeProfileId, investments, setDataForProfile, showNotification]);

    const handleDeleteInvestment = useCallback((id: string) => {
        setDataForProfile(activeProfileId, { investments: investments.filter(i => i.id !== id) });
        showNotification('success', 'Asset removed.');
    }, [activeProfileId, investments, setDataForProfile, showNotification]);

    const handleUpdateInvestmentPrices = useCallback((priceMap: { [symbol: string]: number }) => {
        const updatedInvestments = investments.map(inv => {
            if (priceMap[inv.symbol]) {
                return { ...inv, currentPrice: priceMap[inv.symbol], lastUpdated: new Date().toISOString() };
            }
            return inv;
        });
        setDataForProfile(activeProfileId, { investments: updatedInvestments });
        showNotification('success', 'Market prices updated.');
    }, [activeProfileId, investments, setDataForProfile, showNotification]);

    const handleBatchUpdateInvestments = useCallback((updatedInvestments: Investment[]) => {
        const updatedMap = new Map(updatedInvestments.map(i => [i.id, i]));
        const mergedInvestments = investments.map(inv => updatedMap.get(inv.id) || inv);
        
        updatedInvestments.forEach(inv => {
            if (!investments.some(existing => existing.id === inv.id)) {
                mergedInvestments.push(inv);
            }
        });

        setDataForProfile(activeProfileId, { investments: mergedInvestments });
        showNotification('success', 'Portfolio updated.');
    }, [activeProfileId, investments, setDataForProfile, showNotification]);


    const handleSaveInvoice = useCallback((invoiceData: Omit<Invoice, 'id' | 'profileId'> | Invoice) => {
        let updatedInvoice: Invoice;
        let finalTransactions = transactions;
        const newAuditLog = [...activeProfileData.auditLog];

        if ('id' in invoiceData) { // update
            const existingInvoice = invoices.find(i => i.id === invoiceData.id);
            if (!existingInvoice) return;
            updatedInvoice = { ...invoiceData };
            if (updatedInvoice.status === InvoiceStatus.PAID && !updatedInvoice.transactionId) {
                const totalAmount = updatedInvoice.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                const matchedClient = clients.find(c => c.name === updatedInvoice.clientName);
                const paymentTransaction = {
                    id: `txn-inv-${updatedInvoice.id}`, date: new Date().toISOString(), description: `Payment for Invoice #${updatedInvoice.id.slice(-6)}`,
                    amount: totalAmount, type: TransactionType.INCOME, category: 'Service Fees', invoiceId: updatedInvoice.id,
                    clientId: matchedClient?.id
                };
                updatedInvoice.transactionId = paymentTransaction.id;
                finalTransactions = [...transactions, paymentTransaction];
                newAuditLog.unshift({ id: `audit-${Date.now()}`, transactionId: paymentTransaction.id, action: 'CREATE', timestamp: new Date().toISOString(), description: 'Invoice payment recorded' });
            }
            setDataForProfile(activeProfileId, { invoices: invoices.map(i => (i.id === updatedInvoice.id ? updatedInvoice : i)), transactions: finalTransactions, auditLog: newAuditLog });
            showNotification('success', 'Invoice updated.');
        } else { // add new
            updatedInvoice = { ...invoiceData, id: 'inv-' + new Date().getTime(), profileId: activeProfileId };
            if (updatedInvoice.status === InvoiceStatus.PAID) {
                const totalAmount = updatedInvoice.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                const matchedClient = clients.find(c => c.name === updatedInvoice.clientName);
                const paymentTransaction = {
                    id: `txn-inv-${updatedInvoice.id}`, date: new Date().toISOString(), description: `Payment for Invoice #${updatedInvoice.id.slice(-6)}`,
                    amount: totalAmount, type: TransactionType.INCOME, category: 'Service Fees', invoiceId: updatedInvoice.id,
                    clientId: matchedClient?.id
                };
                updatedInvoice.transactionId = paymentTransaction.id;
                finalTransactions = [...transactions, paymentTransaction];
                newAuditLog.unshift({ id: `audit-${Date.now()}`, transactionId: paymentTransaction.id, action: 'CREATE', timestamp: new Date().toISOString(), description: 'Invoice payment recorded' });
            }
            setDataForProfile(activeProfileId, { invoices: [...invoices, updatedInvoice], transactions: finalTransactions, auditLog: newAuditLog });
            showNotification('success', 'Invoice created.');
        }
    
        setCurrentPage('invoices');
    }, [activeProfileId, invoices, transactions, activeProfileData.auditLog, setDataForProfile, clients, showNotification]);
    
    const handleGenerateInvoiceFromTransactions = useCallback((clientName: string) => {
        if (transactionsToInvoice.length === 0) return;
        
        const newInvoiceId = 'inv-' + new Date().getTime();
        const today = new Date();
        
        const newInvoice: Invoice = {
            id: newInvoiceId,
            profileId: activeProfileId,
            clientName,
            issueDate: today.toISOString().split('T')[0],
            dueDate: today.toISOString().split('T')[0],
            items: transactionsToInvoice.map(t => ({
                id: Math.random().toString(),
                description: t.description,
                quantity: 1,
                price: t.amount,
            })),
            status: InvoiceStatus.PAID,
            notes: `Generated from ${transactionsToInvoice.length} transaction(s).`,
        };
        
        const sourceIds = transactionsToInvoice.map(t => t.id);
        const matchedClient = clients.find(c => c.name === clientName);

        const updatedTransactions = transactions.map(t =>
            sourceIds.includes(t.id) ? { ...t, invoiceId: newInvoiceId, clientId: t.clientId || matchedClient?.id } : t
        );
        
        setDataForProfile(activeProfileId, {
            invoices: [...invoices, newInvoice],
            transactions: updatedTransactions,
        });
        
        setIsClientSelectorOpen(false);
        setTransactionsToInvoice([]);
        setCurrentPage('invoices');
        showNotification('success', 'Paid invoice generated.');
    }, [activeProfileId, transactionsToInvoice, transactions, invoices, setDataForProfile, clients, showNotification]);

    const handleOpenClientSelectorForInvoice = useCallback((selectedTransactions: Transaction[]) => {
        setTransactionsToInvoice(selectedTransactions);
        setIsClientSelectorOpen(true);
    }, []);


    const handleDeleteInvoice = useCallback((id: string) => {
        const invoiceToDelete = invoices.find(i => i.id === id);
        const transactionIdToDelete = invoiceToDelete?.transactionId;
        const newInvoices = invoices.filter(i => i.id !== id);
        
        let newTransactions = transactions;
        if (transactionIdToDelete) {
            // Soft delete linked transaction
            newTransactions = transactions.map(t => 
                t.id === transactionIdToDelete ? { ...t, deletedAt: new Date().toISOString() } : t
            );
        }
        
        setDataForProfile(activeProfileId, { invoices: newInvoices, transactions: newTransactions });
        showNotification('success', 'Invoice deleted.');
    }, [activeProfileId, invoices, transactions, setDataForProfile, showNotification]);
    
    const handleDeleteInvoiceFromEditor = useCallback((id: string) => {
        handleDeleteInvoice(id);
        setCurrentPage('invoices');
    }, [handleDeleteInvoice]);

    const handleExportData = useCallback((profileId: string) => {
        const dataToExport = { profile: profiles.find(p => p.id === profileId), data: dataByProfile[profileId] };
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString; link.download = `yans-pro-backup-${profileId}.json`; link.click();
        showNotification('success', 'Data exported successfully.');
    }, [profiles, dataByProfile, showNotification]);

    const handleResetProfileData = useCallback((profileId: string) => {
        setDataForProfile(profileId, { ...JSON.parse(JSON.stringify(initialData)), recurringTransactions: activeProfileData.recurringTransactions, categories: activeProfileData.categories });
        showNotification('success', 'Profile data has been reset.');
    }, [setDataForProfile, activeProfileData, showNotification]);
    
    const handleOpenGoalModal = useCallback((goal: Goal | null) => { setEditingGoal(goal); setIsAddGoalModalOpen(true); }, []);
    
    const handleSaveGoal = useCallback((goalData: Omit<Goal, 'id' | 'currentAmount' | 'createdAt'>, goalId?: string) => {
        if (goalId) {
            setDataForProfile(activeProfileId, { goals: goals.map(g => g.id === goalId ? { ...g, ...goalData } : g) });
            showNotification('success', 'Goal updated.');
        } else {
            const newGoal: Goal = { ...goalData, id: 'goal-' + new Date().getTime(), currentAmount: 0, createdAt: new Date().toISOString() };
            setDataForProfile(activeProfileId, { goals: [...goals, newGoal] });
            showNotification('success', 'New goal created.');
        }
        setIsAddGoalModalOpen(false);
    }, [activeProfileId, goals, setDataForProfile, showNotification]);

    const handleDeleteGoal = useCallback((id: string) => {
        setDataForProfile(activeProfileId, { goals: goals.filter(g => g.id !== id) });
        setIsAddGoalModalOpen(false);
        showNotification('success', 'Goal deleted.');
    }, [activeProfileId, goals, setDataForProfile, showNotification]);

    const handleAddFundsToGoal = useCallback((goalId: string, amount: number) => {
        const goal = goals.find(g => g.id === goalId); if (!goal) return;
        const updatedGoal = { ...goal, currentAmount: Math.min(goal.currentAmount + amount, goal.targetAmount) };
        const newTransaction: Transaction = {
            id: `t-goal-${new Date().toISOString()}`, date: new Date().toISOString(), description: `Contribution to goal: "${goal.name}"`,
            amount: amount, type: TransactionType.EXPENSE, category: 'Savings & Goals',
        };
        const newAuditLog = logAudit('CREATE', newTransaction.id, 'Goal contribution');
        setDataForProfile(activeProfileId, { goals: goals.map(g => g.id === goalId ? updatedGoal : g), transactions: [...transactions, newTransaction], auditLog: newAuditLog });
        setIsAddFundsModalOpen(false); setEditingGoal(null);
        showNotification('success', 'Funds added to goal.');
    }, [activeProfileId, goals, transactions, setDataForProfile, showNotification, logAudit]);

    const handleOpenFundsModal = useCallback((goal: Goal) => {
        setEditingGoal(goal);
        setIsAddFundsModalOpen(true);
    }, []);

    const handleOpenProductModal = useCallback((product: Product | null) => { setEditingProduct(product); setIsAddProductModalOpen(true); }, []);
    
    const handleSaveProduct = useCallback((productData: Omit<Product, 'id'>, productId?: string) => {
        if (productId) {
            setDataForProfile(activeProfileId, { products: products.map(p => p.id === productId ? { id: productId, ...productData } : p) });
            showNotification('success', 'Product updated.');
        } else {
            const newProd = { ...productData, id: 'prod-' + new Date().getTime() };
            setDataForProfile(activeProfileId, { products: [...products, newProd] });
            showNotification('success', 'Product added.');
        }
        setIsAddProductModalOpen(false);
    }, [activeProfileId, products, setDataForProfile, showNotification]);

    const handleDeleteProduct = useCallback((id: string) => {
        setDataForProfile(activeProfileId, { products: products.filter(p => p.id !== id) });
        setIsAddProductModalOpen(false);
        showNotification('success', 'Product deleted.');
    }, [activeProfileId, products, setDataForProfile, showNotification]);

    const handleCharge = useCallback((cart: CartItem[], total: number) => { setPosSaleInfo({ cart, total }); setIsPaymentModalOpen(true); }, []);

    const handleConfirmSale = useCallback(() => {
        if (!posSaleInfo) return;
        const { cart, total } = posSaleInfo;
        const description = `POS Sale: ${cart.map(item => `${item.quantity}x ${item.name}`).join(', ')}`;
        
        // Update stock levels
        const updatedProducts = products.map(product => {
            const cartItem = cart.find(item => item.id === product.id);
            if (cartItem && product.trackStock && product.stock !== undefined) {
                return { ...product, stock: Math.max(0, product.stock - cartItem.quantity) };
            }
            return product;
        });

        const saleTransaction: Omit<Transaction, 'id'> = {
            date: new Date().toISOString(), description, amount: total,
            type: TransactionType.INCOME, category: 'Product Sales',
        };
        
        const fullTransaction = { ...saleTransaction, id: new Date().toISOString() + Math.random() };
        const newAuditLog = logAudit('CREATE', fullTransaction.id, 'POS Sale');

        setDataForProfile(activeProfileId, { 
            transactions: [...transactions, fullTransaction],
            products: updatedProducts,
            auditLog: newAuditLog
        });
        
        setIsPaymentModalOpen(false); setPosSaleInfo(null);
        showNotification('success', 'Sale completed successfully!');
    }, [posSaleInfo, activeProfileId, transactions, products, setDataForProfile, showNotification, logAudit]);
    
    const handleSaveClient = useCallback((clientData: Omit<Client, 'id' | 'createdAt'>, clientId?: string) => {
        if (clientId) {
            const existing = clients.find(c => c.id === clientId);
            if (existing) {
                handleUpdateClient({ ...existing, ...clientData });
            }
        } else {
            handleAddClient(clientData);
        }
    }, [clients, handleAddClient, handleUpdateClient]);

    // --- AI CHAT HANDLERS ---
    const handleAiChatAction = useCallback((response: AiActionResponse) => {
        if (response.responseType !== 'ACTION' || !response.action) return;

        const { type, params } = response.action;
        const paramsRecord = (params && typeof params === 'object') ? (params as Record<string, unknown>) : {};
        const toNumber = (value: unknown, fallback = 0) => {
            if (typeof value === 'number' && !Number.isNaN(value)) return value;
            if (typeof value === 'string' && value.trim() !== '') {
                const parsed = Number(value);
                if (!Number.isNaN(parsed)) return parsed;
            }
            return fallback;
        };
        const toString = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);

        switch(type) {
            case 'add_transaction': {
                const transactionType = paramsRecord.transactionType;
                const safeType =
                    transactionType === TransactionType.INCOME || transactionType === TransactionType.EXPENSE
                        ? transactionType
                        : TransactionType.EXPENSE;
                const transaction: Omit<Transaction, 'id'> = {
                    date: toString(paramsRecord.date, new Date().toISOString()),
                    description: toString(paramsRecord.description, 'AI Transaction'),
                    amount: toNumber(paramsRecord.amount, 0),
                    type: safeType,
                    category: toString(paramsRecord.category, 'Uncategorized'),
                };
                if (typeof paramsRecord.invoiceId === 'string') transaction.invoiceId = paramsRecord.invoiceId;
                if (typeof paramsRecord.recurringTransactionId === 'string') transaction.recurringTransactionId = paramsRecord.recurringTransactionId;
                if (typeof paramsRecord.productId === 'string') transaction.productId = paramsRecord.productId;
                if (typeof paramsRecord.clientId === 'string') transaction.clientId = paramsRecord.clientId;
                handleAddTransaction(transaction);
                break;
            }
            case 'create_invoice': {
                const rawItems = Array.isArray(paramsRecord.items) ? paramsRecord.items : [];
                const items: InvoiceItem[] = rawItems
                    .map((item, index) => {
                        const itemRecord = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
                        return {
                            id: `item-${Date.now()}-${index}`,
                            description: toString(itemRecord.description, 'Item'),
                            quantity: Math.max(1, toNumber(itemRecord.quantity, 1)),
                            price: toNumber(itemRecord.price, 0),
                        };
                    });

                if (items.length === 0) {
                    items.push({ id: `item-${Date.now()}`, description: 'Item', quantity: 1, price: 0 });
                }

                const dueDate =
                    typeof paramsRecord.dueDate === 'string'
                        ? new Date(paramsRecord.dueDate).toISOString().split('T')[0]
                        : new Date().toISOString().split('T')[0];
                const invoiceData: Omit<Invoice, 'id' | 'profileId'> = {
                    clientName: toString(paramsRecord.clientName, 'Client'),
                    issueDate: new Date().toISOString().split('T')[0],
                    dueDate,
                    items,
                    status: InvoiceStatus.DRAFT,
                };
                const notes = toString(paramsRecord.notes, '');
                if (notes) invoiceData.notes = notes;
                handleSaveInvoice(invoiceData);
                break;
            }
            case 'add_product': {
                const productType = paramsRecord.productType;
                const safeType: ProductType =
                    productType === 'good' || productType === 'service' ? productType : 'service';
                const productData: Omit<Product, 'id'> = {
                    name: toString(paramsRecord.name, 'AI Product'),
                    price: toNumber(paramsRecord.price, 0),
                    type: safeType,
                };
                const description = toString(paramsRecord.description, '');
                if (description) productData.description = description;
                const sku = toString(paramsRecord.sku, '');
                if (sku) productData.sku = sku;
                if (typeof paramsRecord.trackStock === 'boolean') productData.trackStock = paramsRecord.trackStock;
                if (typeof paramsRecord.stock === 'number') productData.stock = paramsRecord.stock;
                if (typeof paramsRecord.minStock === 'number') productData.minStock = paramsRecord.minStock;
                handleSaveProduct(productData);
                break;
            }
            default:
                console.warn("Unknown AI action type:", type);
        }
    }, [handleAddTransaction, handleSaveInvoice, handleSaveProduct]);

    const handleAiChatRequest = useCallback(async (message: string) => {
        setIsChatLoading(true);
        setChatHistory(prev => [...prev, { role: 'user', content: message }]);

        try {
            // Filter deleted transactions for AI context
            const activeTransactions = transactions.filter(t => !t.deletedAt);
            const dataContext = {
                profile: activeProfile,
                summary: financialSummary,
                transactions: activeTransactions,
                invoices,
                budgets,
                goals,
                products,
                categories,
            };
            const response = await getChatResponse(dataContext, chatHistory, message);
            
            setChatHistory(prev => [...prev, {
                role: 'ai',
                content: response.responseText,
                isActionConfirmation: response.responseType === 'ACTION'
            }]);
            
            if (response.responseType === 'ACTION' && response.action) {
                handleAiChatAction(response);
            }

        } catch (error) {
            console.error("AI Chat Error:", error);
            const errorMessage = error instanceof Error ? error.message : t('general.error.unknown');
            setChatHistory(prev => [...prev, { role: 'ai', content: t('ai.chat.error', { error: errorMessage }) }]);
        } finally {
            setIsChatLoading(false);
        }
    }, [activeProfile, financialSummary, transactions, invoices, budgets, goals, products, categories, chatHistory, handleAiChatAction, t]);


    // --- RENDER LOGIC ---
    const renderPage = useCallback(() => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard transactions={transactions} invoices={invoices} recurringTransactions={recurringTransactions} budgets={budgets} categories={categories} summary={financialSummary} activeProfile={activeProfile} onAddTransactionClick={handleOpenAddTransaction} onAddFromReceiptClick={handleOpenScanner} onNavigateToInvoice={handleNavigateToInvoice} onNavigateToSettings={() => handleNavigate('settings')} onNavigate={handleNavigate} theme={theme} onOpenInstallModal={handleOpenInstallModal} />;
            case 'transactions':
                return <TransactionsPage 
                    transactions={transactions} 
                    currency={activeProfile.currency} 
                    profileSettings={activeProfile.settings}
                    onAddTransactionClick={handleOpenAddTransaction} 
                    onDeleteTransactions={handleDeleteTransactions} 
                    onRestoreTransaction={handleRestoreTransaction}
                    onAddFromReceiptClick={handleOpenScanner} 
                    onNavigateToInvoice={handleNavigateToInvoiceFromTransaction} 
                    onGenerateInvoice={handleOpenClientSelectorForInvoice}
                    onEditTransaction={handleOpenEditTransactionModal}
                    onViewAudit={(id) => setAuditTransactionId(id)}
                />;
            case 'reports':
                return <ReportsPage transactions={transactions} summary={financialSummary} currency={activeProfile.currency} />;
            case 'settings':
                return <SettingsPage categories={categories} onAddCategory={handleAddCategory} onUpdateCategory={handleUpdateCategory} onDeleteCategory={handleDeleteCategory} recurringTransactions={recurringTransactions} onDeleteRecurringTransaction={handleDeleteRecurringTransaction} onOpenRecurringModal={handleOpenRecurringModal} profiles={profiles} activeProfileId={activeProfileId} onAddProfile={handleAddProfile} onUpdateProfile={handleUpdateProfile} onDeleteProfile={handleDeleteProfile} onExportData={handleExportData} onResetProfileData={handleResetProfileData} onOpenImportModal={handleOpenImportModal} locale={locale} onSetLocale={setLocale} />;
            case 'budgets':
                return <BudgetsPage budgets={budgets} categories={categories} transactions={transactions} currency={activeProfile.currency} onAddBudget={handleAddBudget} onUpdateBudget={handleUpdateBudget} onDeleteBudget={handleDeleteBudget} />;
            case 'invoices':
                return <InvoicesPage invoices={invoices} currency={activeProfile.currency} onNavigateToInvoice={handleNavigateToInvoice} onDeleteInvoice={handleDeleteInvoice} />;
            case 'invoice-editor':
                return <InvoiceEditorPage
                    onSave={handleSaveInvoice}
                    onBack={() => setCurrentPage('invoices')}
                    existingInvoice={editingInvoiceId ? invoices.find(i => i.id === editingInvoiceId) : undefined}
                    currency={activeProfile.currency} profile={activeProfile} products={products}
                    onDelete={handleDeleteInvoiceFromEditor}
                />;
            case 'goals':
                return <GoalsPage goals={goals} currency={activeProfile.currency} onOpenGoalModal={handleOpenGoalModal} onDeleteGoal={handleDeleteGoal} onOpenFundsModal={handleOpenFundsModal} />;
            case 'products':
                return <ProductsPage products={products} currency={activeProfile.currency} onOpenModal={handleOpenProductModal} onDelete={handleDeleteProduct} />;
            case 'clients':
                return <ClientsPage clients={clients} transactions={transactions} currency={activeProfile.currency} onAddClient={handleAddClient} onUpdateClient={handleUpdateClient} onDeleteClient={handleDeleteClient}/>;
            case 'pos':
                return <PosPage products={products} currency={activeProfile.currency} onCharge={handleCharge} onNavigate={handleNavigate} />;
            case 'investments':
                return <InvestmentsPage 
                    investments={investments} 
                    currency={activeProfile.currency} 
                    operatingBalance={financialSummary.balance}
                    onAddInvestment={handleAddInvestment} 
                    onDeleteInvestment={handleDeleteInvestment} 
                    onUpdatePrices={handleUpdateInvestmentPrices} 
                    onBatchUpdate={handleBatchUpdateInvestments} 
                />;
            case 'enterprise':
                return <EnterprisePage 
                    transactions={transactions} 
                    summary={financialSummary} 
                    currency={activeProfile.currency}
                    profileName={activeProfile.name}
                />;
            default:
                return <Dashboard transactions={transactions} invoices={invoices} recurringTransactions={recurringTransactions} budgets={budgets} categories={categories} summary={financialSummary} activeProfile={activeProfile} onAddTransactionClick={handleOpenAddTransaction} onAddFromReceiptClick={handleOpenScanner} onNavigateToInvoice={handleNavigateToInvoice} onNavigateToSettings={() => handleNavigate('settings')} onNavigate={handleNavigate} theme={theme} onOpenInstallModal={handleOpenInstallModal} />;
        }
    }, [currentPage, transactions, invoices, financialSummary, activeProfile, handleOpenAddTransaction, handleOpenScanner, handleNavigateToInvoice, theme, handleDeleteTransactions, handleAddCategory, handleUpdateCategory, handleDeleteCategory, recurringTransactions, handleDeleteRecurringTransaction, handleOpenRecurringModal, profiles, activeProfileId, handleAddProfile, handleUpdateProfile, handleDeleteProfile, handleExportData, handleResetProfileData, budgets, categories, handleOpenBudgetModal, handleUpdateBudget, handleDeleteBudget, handleDeleteInvoice, handleSaveInvoice, editingInvoiceId, locale, goals, handleOpenGoalModal, handleDeleteGoal, handleOpenFundsModal, products, handleOpenProductModal, handleDeleteProduct, handleCharge, handleNavigateToInvoiceFromTransaction, handleNavigate, handleOpenClientSelectorForInvoice, handleOpenInstallModal, handleOpenImportModal, clients, handleOpenClientModal, handleUpdateClient, handleDeleteClient, investments, handleAddInvestment, handleDeleteInvestment, handleUpdateInvestmentPrices, handleBatchUpdateInvestments, handleOpenEditTransactionModal, handleDeleteInvoiceFromEditor, handleRestoreTransaction]);

    if (isDataLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-brand-primary">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-accent"></div>
            </div>
        );
    }

    return (
        <I18nProvider locale={locale}>
            <div className="flex h-screen bg-gray-100 dark:bg-brand-primary font-sans">
                <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} isMini={isSidebarMini} setIsMini={setIsSidebarMini} currentPage={currentPage} onNavigate={handleNavigate} />
                <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isSidebarMini ? 'lg:ml-20' : 'lg:ml-64'}`}>
                    <Header onMenuClick={() => setIsSidebarOpen(true)} profiles={profiles} activeProfile={activeProfile} onSwitchProfile={handleSwitchProfile} onManageProfiles={() => handleNavigate('settings')} theme={theme} onSetTheme={handleSetTheme} />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto">
                        {renderPage()}
                    </main>
                </div>
                <AddTransactionModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onAddTransaction={handleAddTransaction} 
                    onUpdateTransaction={handleUpdateTransaction}
                    onAddRecurringTransaction={handleAddRecurringTransaction} 
                    onUpdateRecurringTransaction={handleUpdateRecurringTransaction}
                    onDelete={editingRecurringTransaction ? handleDeleteRecurringTransaction : handleDeleteTransactionFromModal}
                    categories={categories} 
                    currency={activeProfile.currency} 
                    products={products}
                    clients={clients}
                    preloadedData={preloadedTransaction} 
                    recurringTransactionToEdit={editingRecurringTransaction}
                    transactionToEdit={editingTransaction}
                />
                <ReceiptScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onSuccess={handleReceiptSuccess} />
                <AddGoalModal isOpen={isAddGoalModalOpen} onClose={() => setIsAddGoalModalOpen(false)} onSave={handleSaveGoal} onDelete={handleDeleteGoal} existingGoal={editingGoal} currency={activeProfile.currency} />
                {editingGoal && isAddFundsModalOpen && (
                    <AddFundsModal isOpen={isAddFundsModalOpen} onClose={() => { setIsAddFundsModalOpen(false); setEditingGoal(null); }} onAddFunds={handleAddFundsToGoal} goal={editingGoal} currency={activeProfile.currency} />
                )}
                <AddProductModal isOpen={isAddProductModalOpen} onClose={() => setIsAddProductModalOpen(false)} onSave={handleSaveProduct} onDelete={handleDeleteProduct} existingProduct={editingProduct} currency={activeProfile.currency} />
                
                <AddClientModal isOpen={isAddClientModalOpen} onClose={() => setIsAddClientModalOpen(false)} onSave={handleSaveClient} onDelete={handleDeleteClient} existingClient={editingClient} />
                
                <AddBudgetModal isOpen={isAddBudgetModalOpen} onClose={() => setIsAddBudgetModalOpen(false)} onAddBudget={handleAddBudget} onUpdateBudget={handleUpdateBudget} onDelete={handleDeleteBudget} categories={categories} transactions={transactions} existingBudget={editingBudget} currency={activeProfile.currency} />

                {posSaleInfo && (
                    <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onConfirm={handleConfirmSale} total={posSaleInfo.total} currency={activeProfile.currency} />
                )}
                <ClientSelectorModal 
                    isOpen={isClientSelectorOpen} 
                    onClose={() => {setIsClientSelectorOpen(false); setTransactionsToInvoice([]);}}
                    onConfirm={handleGenerateInvoiceFromTransactions}
                    existingClients={[...new Set(invoices.map(inv => inv.clientName))]}
                />
                <ChatAssistantButton onClick={() => setIsChatOpen(true)} />
                <ChatAssistantModal 
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    history={chatHistory}
                    onSend={handleAiChatRequest}
                    isLoading={isChatLoading}
                />
                <InstallInstructionsModal 
                    isOpen={isInstallModalOpen}
                    onClose={() => setIsInstallModalOpen(false)}
                    platform={installPlatform}
                />
                <ImportTransactionsModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onImport={handleImportTransactions}
                />
                <NotificationToast 
                    notification={notification} 
                    onClose={closeNotification} 
                />
                <AuditLogModal 
                    isOpen={!!auditTransactionId} 
                    onClose={() => setAuditTransactionId(null)} 
                    transactionId={auditTransactionId}
                    auditLog={auditLog}
                />
            </div>
        </I18nProvider>
    );
};


// We need a wrapper for App to use the I18n context within App.tsx itself for the AI chat logic
const AppContainer = () => {
  const [initialLocale] = useState<SupportedLocale>(
    () => (localStorage.getItem('yans-pro-locale') || 'en') as SupportedLocale
  );

  return (
    <I18nProvider locale={initialLocale}>
      <App />
    </I18nProvider>
  );
};

export default AppContainer;
