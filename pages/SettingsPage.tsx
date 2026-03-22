import React, { useState, useMemo, useEffect } from 'react';
import { Category, TransactionType, RecurringTransaction, Profile, SupportedLocale, Language } from '../types';
import { EditIcon, DeleteIcon, SaveIcon, AddIcon, XIcon, FolderIcon, RepeatIcon, BriefcaseIcon, ExportIcon, ImportIcon, AlertTriangleIcon, LanguageIcon, ChevronLeftIcon, SettingsIcon, DesktopComputerIcon, TrendingUpIcon } from '../components/Icons';
import ProfileManagerModal from '../components/ProfileManagerModal';
import { useI18n } from '../hooks/useI18n';
import { smoothEngine } from '../ui/smoothEngine';
import { SmoothCard } from '../components/SmoothCard';

type ProfileSettingsUpdate = { allowEdit?: boolean; showDeleted?: boolean; investmentsEnabled?: boolean };

interface SettingsPageProps {
    categories: Category[];
    onAddCategory: (category: Omit<Category, 'id'>) => void;
    onUpdateCategory: (category: Category) => void;
    onDeleteCategory: (id: string) => void;
    recurringTransactions: RecurringTransaction[];
    onDeleteRecurringTransaction: (id: string) => void;
    onOpenRecurringModal: (rule: RecurringTransaction | null) => void;
    profiles: Profile[];
    activeProfileId: string;
    onAddProfile: (profileData: Omit<Profile, 'id'>) => void;
    onUpdateProfile: (profile: Profile) => void;
    onDeleteProfile: (id: string) => void;
    onExportData: (profileId: string) => void;
    onResetProfileData: (profileId: string) => void;
    onOpenImportModal: () => void;
    locale: SupportedLocale;
    onSetLocale: (locale: SupportedLocale) => void;
}

const FeatureFlagManager: React.FC<{
    investmentsEnabled: boolean;
    onToggleInvestments: (enabled: boolean) => void;
}> = ({ investmentsEnabled, onToggleInvestments }) => {
    const [isUltraSmooth, setIsUltraSmooth] = useState(smoothEngine.status);

    const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const enabled = e.target.checked;
        setIsUltraSmooth(enabled);
        smoothEngine.toggle(enabled);
    };

    return (
        <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-300 text-sm">Experimental features for advanced users.</p>

            <div className="bg-gray-50 dark:bg-brand-primary p-4 rounded-xl border border-gray-200 dark:border-gray-700 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-2 min-w-0">
                    <div className="min-w-0">
                        <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 break-words">
                            <TrendingUpIcon className="w-4 h-4 text-green-500" />
                            Investments Page Visibility
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 break-words">Hide or show the Investments page and sidebar entry.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={investmentsEnabled}
                            onChange={(e) => onToggleInvestments(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                    </label>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Disable to remove Investments from navigation without deleting your data.</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-brand-primary p-4 rounded-xl border border-gray-200 dark:border-gray-700 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-4 min-w-0">
                    <div className="min-w-0">
                        <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 break-words">
                            <DesktopComputerIcon className="w-4 h-4 text-purple-500" /> 
                            ULTRA_SMOOTH_UI
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 break-words">Enables 500Hz logic loop & interpolated rendering.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={isUltraSmooth}
                            onChange={handleToggle}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                    </label>
                </div>

                {isUltraSmooth && (
                    <div className="mt-4 animate-fade-in-scale">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Live Preview</p>
                        <SmoothCard />
                    </div>
                )}
            </div>
        </div>
    );
};

const LanguageManager: React.FC<{
    currentLocale: SupportedLocale;
    onSetLocale: (locale: SupportedLocale) => void;
}> = ({ currentLocale, onSetLocale }) => {
    const { t } = useI18n();
    const [searchTerm, setSearchTerm] = useState('');

    const availableLanguages: Language[] = [
        { code: 'en', name: 'English' },
        { code: 'id', name: 'Bahasa Indonesia' },
    ];

    const filteredLanguages = availableLanguages.filter(lang =>
        lang.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="mb-4">
                 <input
                    type="text"
                    placeholder={t('settingsPage.language.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                />
            </div>
            <div className="max-h-96 overflow-y-auto">
                <fieldset>
                    <legend className="sr-only">{t('settingsPage.language.select')}</legend>
                    <div className="space-y-2">
                        {filteredLanguages.map((lang) => (
                             <label key={lang.code} htmlFor={`lang-${lang.code}`} className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${currentLocale === lang.code ? 'bg-brand-accent text-white' : 'bg-gray-50 dark:bg-brand-primary hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                <input
                                    type="radio"
                                    id={`lang-${lang.code}`}
                                    name="language"
                                    value={lang.code}
                                    checked={currentLocale === lang.code}
                                    onChange={() => onSetLocale(lang.code)}
                                    className="h-4 w-4 text-brand-accent bg-gray-100 border-gray-300 focus:ring-brand-accent dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span className="ml-3 block text-sm font-medium">{lang.name}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>
            </div>
        </div>
    );
};

const ProfileManager: React.FC<{
    profiles: Profile[];
    activeProfileId: string;
    onEdit: (profile: Profile) => void;
    onDelete: (id: string) => void;
    onAdd: () => void;
}> = ({ profiles, activeProfileId, onEdit, onDelete, onAdd }) => {
    const { t } = useI18n();
    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-3">
                <p className="text-gray-600 dark:text-gray-300 text-sm">Manage your business entities or personal accounts.</p>
                <button onClick={onAdd} className="flex-shrink-0 bg-brand-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 self-start sm:self-center">
                    <AddIcon /> <span>{t('settingsPage.profiles.add')}</span>
                </button>
            </div>
            <ul className="space-y-3">
                {profiles.map(profile => (
                     <li key={profile.id} className={`bg-gray-50 dark:bg-brand-primary p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${profile.id === activeProfileId ? 'ring-2 ring-brand-accent shadow-md' : 'border border-gray-200 dark:border-gray-700'}`}>
                        <div className="flex items-center gap-4 min-w-0">
                             <div className={`flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full ${profile.id === activeProfileId ? 'bg-brand-accent text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                <BriefcaseIcon className="h-6 w-6"/>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <p className="font-bold text-gray-800 dark:text-gray-200 text-lg truncate">{profile.name}</p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded font-mono">{profile.currency}</span>
                                    {profile.taxId && <span className="text-xs text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-2 py-0.5 rounded">{profile.taxId}</span>}
                                    {profile.id === activeProfileId && <span className="text-xs text-brand-green font-bold uppercase tracking-wider">{t('settingsPage.profiles.active')}</span>}
                                </div>
                                {(profile.email || profile.website) && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                        {profile.email} {profile.email && profile.website && '•'} {profile.website}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                            <button onClick={(e) => { e.stopPropagation(); onEdit(profile); }} className="text-gray-500 hover:text-brand-accent p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label={`Edit ${profile.name}`}><EditIcon /></button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(profile.id); }} className={`p-2 rounded-full transition-colors ${profiles.length <= 1 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 hover:text-brand-red hover:bg-red-50 dark:hover:bg-red-900/20'}`} aria-label={`Delete ${profile.name}`} disabled={profiles.length <= 1}><DeleteIcon /></button>
                        </div>
                     </li>
                ))}
            </ul>
        </div>
    );
};

const AddCategoryForm: React.FC<{
    categories: Category[];
    onSave: (newCategory: Omit<Category, 'id'>) => void;
    onCancel: () => void;
}> = ({ categories, onSave, onCancel }) => {
    const { t } = useI18n();
    const [name, setName] = useState('');
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [parentId, setParentId] = useState<string | null>(null);

    const parentCandidates = useMemo(() => {
        return categories.filter(c => !c.parentId && c.type === type);
    }, [categories, type]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave({
                name: name.trim(),
                type,
                parentId: parentId || undefined,
            });
        }
    };
    
    useEffect(() => {
        if (parentId) {
            const parentIsValid = parentCandidates.some(p => p.id === parentId);
            if (!parentIsValid) {
                setParentId(null);
            }
        }
    }, [type, parentId, parentCandidates]);

    return (
        <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-brand-primary p-4 rounded-lg mt-4 border border-gray-200 dark:border-gray-700 space-y-4 animate-fade-in-scale">
            <h4 className="text-md font-semibold text-gray-800 dark:text-white">{t('settingsPage.categories.newFormTitle')}</h4>
            <div>
                <label htmlFor="cat-name" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('settingsPage.categories.name')}</label>
                <input id="cat-name" type="text" value={name} onChange={e => setName(e.target.value)} required autoFocus className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" placeholder="e.g., Office Rent"/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="cat-type" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('settingsPage.categories.type')}</label>
                    <select id="cat-type" value={type} onChange={e => setType(e.target.value as TransactionType)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition">
                        <option value={TransactionType.EXPENSE}>{t('general.expense')}</option>
                        <option value={TransactionType.INCOME}>{t('general.income')}</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="cat-parent" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('settingsPage.categories.parent')}</label>
                    <select id="cat-parent" value={parentId || ''} onChange={e => setParentId(e.target.value || null)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" disabled={parentCandidates.length === 0}>
                        <option value="">{t('settingsPage.categories.parentGroup')}</option>
                        {parentCandidates.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
                 <button type="button" onClick={onCancel} className="py-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold transition-colors">{t('general.cancel')}</button>
                 <button type="submit" className="py-2 px-4 rounded-lg bg-brand-accent hover:bg-blue-600 text-white font-semibold transition-colors">{t('settingsPage.categories.save')}</button>
            </div>
        </form>
    );
};


const CategoryManager: React.FC<{
    categories: Category[];
    onAddCategory: (category: Omit<Category, 'id'>) => void;
    onUpdateCategory: (category: Category) => void;
    onDeleteCategory: (id: string) => void;
}> = ({ categories, onAddCategory, onUpdateCategory, onDeleteCategory }) => {
    const { t } = useI18n();
    const [editingState, setEditingState] = useState<{ id: string; name: string; parentId: string | null } | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

    const handleSaveNewCategory = (newCategoryData: Omit<Category, 'id'>) => {
        onAddCategory(newCategoryData);
        setIsAdding(false);
    };
    
    const handleDelete = (category: Category) => {
        setCategoryToDelete(category);
    };

    const confirmDelete = () => {
        if (categoryToDelete) {
            onDeleteCategory(categoryToDelete.id);
            setCategoryToDelete(null);
        }
    };

    const CategoryItem: React.FC<{category: Category, level: number}> = ({ category, level }) => {
        const isEditing = editingState?.id === category.id;
        const parentCandidates = categories.filter(c => !c.parentId && c.id !== category.id && c.type === category.type);

        const handleSave = () => {
            if (editingState && editingState.name.trim()) {
                onUpdateCategory({ ...category, name: editingState.name.trim(), parentId: editingState.parentId || undefined });
                setEditingState(null);
            }
        };

        return (
            <li style={{ marginLeft: `${level * 1.5}rem`}} className="bg-gray-50 dark:bg-brand-primary p-2 rounded-lg flex flex-col gap-2 border border-gray-200 dark:border-gray-700 transition-all hover:border-brand-accent/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-grow truncate">
                        {!category.parentId && <FolderIcon className={`w-5 h-5 flex-shrink-0 ${category.type === TransactionType.INCOME ? 'text-brand-green' : 'text-brand-red'}`}/>}
                        {isEditing ? (
                            <input
                                type="text"
                                value={editingState.name}
                                onChange={(e) => setEditingState({ ...editingState!, name: e.target.value })}
                                className="flex-grow bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md py-1 px-2 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-accent focus:outline-none"
                                autoFocus
                            />
                        ) : (
                            <span className="text-gray-700 dark:text-gray-300 truncate font-medium">{category.name}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {isEditing ? (
                             <>
                                <button onClick={(e) => { e.stopPropagation(); handleSave(); }} className="text-brand-green hover:text-green-400 p-1"><SaveIcon /></button>
                                <button onClick={(e) => { e.stopPropagation(); setEditingState(null); }} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white p-1"><XIcon /></button>
                            </>
                        ) : (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); setEditingState({ id: category.id, name: category.name, parentId: category.parentId || null }); }} className="text-brand-accent hover:text-blue-400 p-1"><EditIcon /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(category); }} className="text-brand-red hover:text-red-400 p-1"><DeleteIcon /></button>
                            </>
                        )}
                    </div>
                </div>
                 {isEditing && category.parentId && (
                    <div className="ml-7">
                        <label className="text-xs text-gray-500 dark:text-brand-muted">{t('settingsPage.categories.parent')}</label>
                        <select
                            value={editingState.parentId || ''}
                            onChange={(e) => setEditingState({...editingState!, parentId: e.target.value || null })}
                            className="w-full text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md py-1 px-2 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-accent focus:outline-none"
                        >
                            <option value="">{t('settingsPage.categories.parentGroup')}</option>
                            {parentCandidates.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                 )}
            </li>
        )
    }

    const renderCategories = (cats: Category[], level = 0) => {
        const categoryMap = new Map(cats.map(c => [c.id, {...c, children: [] as Category[]}]));
        const roots: (Category & { children: Category[] })[] = [];
        for (const cat of cats) {
            const mappedCat = categoryMap.get(cat.id)!;
            if (cat.parentId && categoryMap.has(cat.parentId)) {
                categoryMap.get(cat.parentId)!.children.push(mappedCat);
            } else {
                roots.push(mappedCat);
            }
        }

        return roots.map(cat => (
            <React.Fragment key={cat.id}>
                <CategoryItem category={cat} level={level} />
                {cat.children && cat.children.length > 0 && <ul className="space-y-2 mt-2">{renderCategories(cat.children, level + 1)}</ul>}
            </React.Fragment>
        ));
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-3">
                <p className="text-gray-600 dark:text-gray-300 text-sm">Organize your finances by customizing your income and expense categories.</p>
                {!isAdding && (
                    <button onClick={() => setIsAdding(true)} className="flex-shrink-0 bg-brand-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 self-start sm:self-center">
                        <AddIcon /> <span>{t('settingsPage.categories.add')}</span>
                    </button>
                )}
            </div>

            {isAdding && (
                <AddCategoryForm 
                    categories={categories} 
                    onSave={handleSaveNewCategory} 
                    onCancel={() => setIsAdding(false)} 
                />
            )}

             {categories.length > 0 ? (
                <ul className="space-y-2 mt-4 max-h-[60vh] overflow-y-auto pr-2">{renderCategories(categories)}</ul>
            ) : (
                !isAdding && <p className="text-sm text-gray-500 dark:text-brand-muted text-center py-4">{t('settingsPage.categories.noCategories')}</p>
            )}

            {/* Confirmation Modal */}
            {categoryToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 transition-opacity" aria-modal="true" role="dialog">
                    <div className="bg-white dark:bg-brand-secondary rounded-xl shadow-2xl w-full max-w-sm p-6 animate-fade-in-scale flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                                <DeleteIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">{t('general.delete')} &ldquo;{categoryToDelete.name}&rdquo;?</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                            {t('settingsPage.categories.deleteConfirm')}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setCategoryToDelete(null)}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 transition-colors"
                            >
                                {t('general.cancel')}
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                            >
                                {t('general.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


const RecurringTransactionManager: React.FC<{
    recurringTransactions: RecurringTransaction[];
    currency: string;
    onDelete: (id: string) => void;
    onEdit: (rule: RecurringTransaction) => void;
    onAddNew: () => void;
}> = ({ recurringTransactions, currency, onDelete, onEdit, onAddNew }) => {
    const { t } = useI18n();

    const formatFrequency = (rule: RecurringTransaction) => {
        const intervalText = rule.interval > 1 ? `${rule.interval} ` : '';
        const frequencyText = t(`modals.addTransaction.${rule.frequency}`);
        return t('settingsPage.recurring.repeats', {
            interval: intervalText,
            frequency: frequencyText
        });
    };

    const handleDelete = (id: string) => {
        if(window.confirm("Are you sure you want to delete this recurring rule?")) {
            onDelete(id);
        }
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-3">
                 <p className="text-gray-600 dark:text-gray-300 text-sm">Automate your regular income and expenses.</p>
                 <button onClick={onAddNew} className="flex-shrink-0 bg-brand-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 self-start sm:self-center">
                    <AddIcon /> <span>{t('settingsPage.recurring.add')}</span>
                </button>
            </div>
            <ul className="space-y-3">
                {recurringTransactions.map(rule => (
                    <li key={rule.id} className="bg-gray-50 dark:bg-brand-primary p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:border-brand-accent/50 transition-colors">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                                <RepeatIcon className="h-5 w-5"/>
                            </div>
                            <div className="flex-grow truncate min-w-0">
                                <p className="font-bold text-gray-800 dark:text-gray-200 truncate">{rule.description}</p>
                                <p className="text-sm text-gray-500 dark:text-brand-muted">{formatFrequency(rule)} • <span className={rule.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(rule.amount)}</span></p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                            <button onClick={(e) => { e.stopPropagation(); onEdit(rule); }} className="text-gray-500 hover:text-brand-accent p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors" aria-label={`Edit ${rule.description}`}><EditIcon /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(rule.id); }} className="text-gray-500 hover:text-brand-red p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" aria-label={`Delete ${rule.description}`}><DeleteIcon /></button>
                        </div>
                    </li>
                ))}
                {recurringTransactions.length === 0 && <p className="text-sm text-gray-500 dark:text-brand-muted text-center py-8">{t('settingsPage.recurring.noRecurring')}</p>}
            </ul>
        </div>
    )
}

const DataManagement: React.FC<{
    activeProfileId: string;
    profileName: string;
    onExportData: (profileId: string) => void;
    onResetProfileData: (profileId: string) => void;
    onOpenImportModal: () => void;
    onUpdateProfileSettings: (settings: ProfileSettingsUpdate) => void;
    currentSettings?: ProfileSettingsUpdate;
}> = ({ activeProfileId, profileName, onExportData, onResetProfileData, onOpenImportModal, onUpdateProfileSettings, currentSettings }) => {
    const { t } = useI18n();
    const handleResetDataClick = () => {
        if (window.confirm(t('settingsPage.data.resetConfirm', { profileName }))) {
            onResetProfileData(activeProfileId);
        }
    }

    return (
        <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-300 text-sm">{t('settingsPage.data.description')}</p>
            
            {/* Transaction Controls */}
            <div className="bg-gray-50 dark:bg-brand-primary p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4" /> Transaction Management
                </h4>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Allow Editing Transactions</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={currentSettings?.allowEdit !== false}
                                onChange={(e) => onUpdateProfileSettings({ allowEdit: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => onExportData(activeProfileId)} className="flex items-center justify-center gap-3 bg-gray-100 dark:bg-brand-primary border border-gray-200 dark:border-gray-700 hover:border-brand-accent dark:hover:border-brand-accent p-6 rounded-xl transition-all group min-w-0">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <ExportIcon className="w-6 h-6"/>
                    </div>
                    <div className="text-left min-w-0">
                        <span className="block font-bold text-gray-800 dark:text-white break-words">{t('settingsPage.data.export')}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 break-words">Save as JSON</span>
                    </div>
                </button>
                 <button onClick={onOpenImportModal} className="flex items-center justify-center gap-3 bg-gray-100 dark:bg-brand-primary border border-gray-200 dark:border-gray-700 hover:border-brand-accent dark:hover:border-brand-accent p-6 rounded-xl transition-all group min-w-0">
                    <div className="p-3 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 group-hover:bg-green-600 group-hover:text-white transition-colors">
                        <ImportIcon className="w-6 h-6"/>
                    </div>
                    <div className="text-left min-w-0">
                        <span className="block font-bold text-gray-800 dark:text-white break-words">{t('settingsPage.data.import')}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 break-words">From CSV</span>
                    </div>
                </button>
            </div>

            <div className="mt-8 p-6 border border-red-200 dark:border-red-900/50 rounded-xl bg-red-50 dark:bg-red-900/10">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                        <AlertTriangleIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-grow">
                        <h4 className="text-lg font-bold text-red-800 dark:text-red-400">{t('settingsPage.data.dangerZone')}</h4>
                        <p className="mt-1 text-sm text-red-700 dark:text-red-300">{t('settingsPage.data.dangerWarning')}</p>
                        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{t('settingsPage.data.resetWarning')}</p>
                        <div className="mt-4">
                            <button onClick={handleResetDataClick} className="bg-white border border-red-300 text-red-600 hover:bg-red-600 hover:text-white dark:bg-transparent dark:border-red-600 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                                {t('settingsPage.data.resetProfile')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- MAIN SETTINGS PAGE ---

const SettingsPage: React.FC<SettingsPageProps> = ({ 
    categories, onAddCategory, onUpdateCategory, onDeleteCategory,
    recurringTransactions, onDeleteRecurringTransaction, onOpenRecurringModal,
    profiles, activeProfileId, onAddProfile, onUpdateProfile, onDeleteProfile,
    onExportData, onResetProfileData, onOpenImportModal,
    locale, onSetLocale
}) => {
    const { t } = useI18n();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
    const [activeSection, setActiveSection] = useState<string | null>(null);

    const activeProfile = profiles.find(p => p.id === activeProfileId)!;
    const investmentsEnabled = activeProfile.settings?.investmentsEnabled === true;

    const handleOpenProfileModal = (profile: Profile | null = null) => {
        setEditingProfile(profile);
        setIsProfileModalOpen(true);
    };

    const handleSaveProfile = (profileData: Omit<Profile, 'id'>, profileId?: string) => {
        if (profileId) {
            onUpdateProfile({ id: profileId, ...profileData });
        } else {
            onAddProfile(profileData);
        }
    };
    
    const handleDeleteProfileClick = (id: string) => {
        if (profiles.length <= 1) {
            alert(t('settingsPage.profiles.deleteLastProfile'));
            return;
        }
        if (window.confirm(t('settingsPage.profiles.deleteConfirm'))) {
            onDeleteProfile(id);
        }
    };

    const handleUpdateProfileSettings = (settings: ProfileSettingsUpdate) => {
        onUpdateProfile({
            ...activeProfile,
            settings: { ...activeProfile.settings, ...settings }
        });
    }

    // Configuration for the "App Grid"
    const settingsApps = [
        {
            id: 'profiles',
            title: t('settingsPage.profiles.title'),
            description: 'Manage business entities & currencies',
            icon: <BriefcaseIcon className="w-8 h-8"/>,
            colorClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
        },
        {
            id: 'categories',
            title: t('settingsPage.categories.title'),
            description: 'Customize income & expense types',
            icon: <FolderIcon className="w-8 h-8"/>,
            colorClass: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
        },
        {
            id: 'recurring',
            title: t('settingsPage.recurring.title'),
            description: 'Automate repetitive transactions',
            icon: <RepeatIcon className="w-8 h-8"/>,
            colorClass: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
        },
        {
            id: 'language',
            title: t('settingsPage.language.title'),
            description: 'Change application language',
            icon: <LanguageIcon className="w-8 h-8"/>,
            colorClass: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
        },
        {
            id: 'data',
            title: t('settingsPage.data.title'),
            description: 'Import, export, or reset data',
            icon: <SaveIcon className="w-8 h-8"/>,
            colorClass: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        },
        {
            id: 'features',
            title: 'Feature Flags',
            description: 'Experimental & Beta features',
            icon: <DesktopComputerIcon className="w-8 h-8"/>,
            colorClass: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
        }
    ];

    const renderActiveSection = () => {
        switch(activeSection) {
            case 'profiles':
                return <ProfileManager profiles={profiles} activeProfileId={activeProfileId} onEdit={handleOpenProfileModal} onDelete={handleDeleteProfileClick} onAdd={() => handleOpenProfileModal(null)} />;
            case 'categories':
                return <CategoryManager categories={categories} onAddCategory={onAddCategory} onUpdateCategory={onUpdateCategory} onDeleteCategory={onDeleteCategory} />;
            case 'recurring':
                return <RecurringTransactionManager recurringTransactions={recurringTransactions} currency={activeProfile.currency} onDelete={onDeleteRecurringTransaction} onEdit={(rule) => onOpenRecurringModal(rule)} onAddNew={() => onOpenRecurringModal(null)} />;
            case 'language':
                return <LanguageManager currentLocale={locale} onSetLocale={onSetLocale} />;
            case 'data':
                return <DataManagement activeProfileId={activeProfileId} profileName={activeProfile.name} onExportData={onExportData} onResetProfileData={onResetProfileData} onOpenImportModal={onOpenImportModal} onUpdateProfileSettings={handleUpdateProfileSettings} currentSettings={activeProfile.settings} />;
            case 'features':
                return <FeatureFlagManager investmentsEnabled={investmentsEnabled} onToggleInvestments={(enabled) => handleUpdateProfileSettings({ investmentsEnabled: enabled })} />;
            default:
                return null;
        }
    }

    const activeApp = settingsApps.find(app => app.id === activeSection);

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-brand-primary min-h-full">
            
            {/* Header */}
            <div className="flex items-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
                    {t('settingsPage.title')}
                </h1>
            </div>

            {/* Main Content Area */}
            <div className="max-w-6xl mx-auto">
                {activeSection ? (
                    // Detail View
                    <div className="bg-white dark:bg-brand-secondary rounded-2xl shadow-xl overflow-hidden animate-fade-in-scale min-w-0">
                        <div className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex items-center gap-4 min-w-0">
                            <button 
                                onClick={() => setActiveSection(null)}
                                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                                aria-label="Back to settings"
                            >
                                <ChevronLeftIcon className="w-6 h-6"/>
                            </button>
                            <div className={`p-2 rounded-lg ${activeApp?.colorClass}`}>
                                {activeApp?.icon}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white break-words">{activeApp?.title}</h2>
                            </div>
                        </div>
                        <div className="p-4 sm:p-6">
                            {renderActiveSection()}
                        </div>
                    </div>
                ) : (
                    // Grid View (App Drawer)
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {settingsApps.map(app => (
                            <button
                                key={app.id}
                                onClick={() => setActiveSection(app.id)}
                                className="group bg-white dark:bg-brand-secondary p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left border border-transparent hover:border-gray-200 dark:hover:border-gray-700 flex flex-col h-full min-w-0"
                            >
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${app.colorClass}`}>
                                    {app.icon}
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 group-hover:text-brand-accent transition-colors break-words">
                                    {app.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-brand-muted leading-relaxed break-words">
                                    {app.description}
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            <ProfileManagerModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onSave={handleSaveProfile}
                existingProfile={editingProfile}
            />
            
            <style>{`
                @keyframes fade-in-scale {
                    from { opacity: 0; transform: scale(0.98); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-scale {
                    animation: fade-in-scale 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default SettingsPage;
