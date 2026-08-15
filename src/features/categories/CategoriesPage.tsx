import React, { useState, useEffect } from 'react';
import { Layers, Tag, Plus, RefreshCw, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  description?: string;
  parent_name?: string;
}

interface Brand {
  id: number;
  name: string;
  description?: string;
}

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'CATEGORIES' | 'BRANDS'>('CATEGORIES');

  // Form Modals
  const [showCatModal, setShowCatModal] = useState<boolean>(false);
  const [showBrandModal, setShowBrandModal] = useState<boolean>(false);

  const [catName, setCatName] = useState<string>('');
  const [catDesc, setCatDesc] = useState<string>('');

  const [brandName, setBrandName] = useState<string>('');
  const [brandDesc, setBrandDesc] = useState<string>('');

  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      if (window.api) {
        const cList = await window.api.categories.getAll();
        const bList = await window.api.brands.getAll();
        setCategories(cList);
        setBrands(bList);
      }
    } catch (err) {
      console.error('Failed to fetch categories/brands:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      setError('Category Name is required.');
      return;
    }
    setError('');
    setActionLoading(true);
    try {
      if (window.api && window.api.categories) {
        const res = await window.api.categories.create({ name: catName.trim(), description: catDesc.trim() });
        if (res.success) {
          setSuccess(`Category '${catName}' created successfully.`);
          setCatName('');
          setCatDesc('');
          setShowCatModal(false);
          fetchData();
        } else {
          setError(res.error || 'Failed to create category.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Category error.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      setError('Brand Name is required.');
      return;
    }
    setError('');
    setActionLoading(true);
    try {
      if (window.api && window.api.brands) {
        const res = await window.api.brands.create({ name: brandName.trim(), description: brandDesc.trim() });
        if (res.success) {
          setSuccess(`Brand '${brandName}' created successfully.`);
          setBrandName('');
          setBrandDesc('');
          setShowBrandModal(false);
          fetchData();
        } else {
          setError(res.error || 'Failed to create brand.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Brand error.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-[#2818cf]">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Categories & Brands Setup</h1>
            <p className="text-xs font-medium text-slate-500">Manage textile product classifications, subcategories, and manufacturer brands</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => (activeTab === 'CATEGORIES' ? setShowCatModal(true) : setShowBrandModal(true))}
            className="px-4 py-2.5 bg-[#2818cf] hover:bg-[#2012ad] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#2818cf]/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add {activeTab === 'CATEGORIES' ? 'Category' : 'Brand'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 font-bold">×</button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-700 text-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-700 font-bold">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('CATEGORIES')}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'CATEGORIES' ? 'bg-[#2818cf] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Product Categories ({categories.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('BRANDS')}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'BRANDS' ? 'bg-[#2818cf] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Textile Brands ({brands.length})</span>
        </button>
      </div>

      {/* List Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-[#2818cf] mx-auto mb-2" />
            <span className="text-sm font-medium">Loading data...</span>
          </div>
        ) : activeTab === 'CATEGORIES' ? (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="px-6 py-4">Category Name</th>
                <th className="px-6 py-4">Parent Category</th>
                <th className="px-6 py-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-slate-900">{c.name}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">{c.parent_name || 'Top-Level Master'}</td>
                  <td className="px-6 py-4 text-xs text-slate-600 italic">{c.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="px-6 py-4">Brand Name</th>
                <th className="px-6 py-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {brands.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-slate-900">{b.name}</td>
                  <td className="px-6 py-4 text-xs text-slate-600 italic">{b.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Product Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Category Name *</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Sarees, Shirts, Kurtis..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2818cf]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                <input
                  type="text"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Optional description"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2818cf]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCatModal(false)} className="w-1/2 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl">Cancel</button>
                <button type="submit" disabled={actionLoading} className="w-1/2 py-2.5 bg-[#2818cf] text-white text-sm font-semibold rounded-xl shadow-md flex items-center justify-center gap-2">
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Category</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Brand Modal */}
      {showBrandModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Textile Brand</h3>
            <form onSubmit={handleAddBrand} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Brand Name *</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Raymond, Levis, Allen Solly..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2818cf]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                <input
                  type="text"
                  value={brandDesc}
                  onChange={(e) => setBrandDesc(e.target.value)}
                  placeholder="Optional brand description"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2818cf]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowBrandModal(false)} className="w-1/2 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl">Cancel</button>
                <button type="submit" disabled={actionLoading} className="w-1/2 py-2.5 bg-[#2818cf] text-white text-sm font-semibold rounded-xl shadow-md flex items-center justify-center gap-2">
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Brand</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
