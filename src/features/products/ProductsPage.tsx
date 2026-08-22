import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, RefreshCw, Layers, Eye } from 'lucide-react';
import { ProductModal } from './ProductModal';

interface Product {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
  brand_id?: number;
  brand_name?: string;
  material?: string;
  description?: string;
  is_active: number;
}

interface Variant {
  id: number;
  product_id: number;
  sku: string;
  barcode?: string;
  size?: string;
  color?: string;
  purchase_price: number;
  selling_price: number;
  current_stock: number;
}

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');

  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedProductVariants, setSelectedProductVariants] = useState<{ product: Product; list: Variant[] } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (window.api && window.api.products) {
        const pList = await window.api.products.getAll();
        const vList = await window.api.variants.getAll();
        const cList = await window.api.categories.getAll();
        const bList = await window.api.brands.getAll();

        setProducts(pList);
        setVariants(vList);
        setCategories(cList);
        setBrands(bList);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeactivate = async (id: number) => {
    if (!window.confirm('Are you sure you want to deactivate this product? Historical sales will be preserved.')) return;
    try {
      if (window.api && window.api.products) {
        const res = await window.api.products.deactivate(id);
        if (res.success) {
          fetchData();
        }
      }
    } catch (err) {
      console.error('Failed to deactivate product:', err);
    }
  };

  // Filter Logic
  const filteredProducts = products.filter((p) => {
    const pVariants = variants.filter((v) => v.product_id === p.id);
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.material && p.material.toLowerCase().includes(searchTerm.toLowerCase())) ||
      pVariants.some((v) => v.sku.toLowerCase().includes(searchTerm.toLowerCase()) || (v.barcode && v.barcode.includes(searchTerm)));

    const matchesCategory = selectedCategory === 'ALL' || p.category_name === selectedCategory;
    const matchesBrand = selectedBrand === 'ALL' || p.brand_name === selectedBrand;

    return matchesSearch && matchesCategory && matchesBrand;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-[#2012ad]">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Textile Product Catalog</h1>
            <p className="text-xs font-medium text-slate-500">Manage textile master items, variants, SKUs and prices</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all"
            title="Refresh Catalog"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#2012ad] hover:bg-[#1a0e91] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#2012ad]/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Product Name, SKU, Barcode, Fabric Material..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Filters:</span>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
          >
            <option value="ALL">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-[#2012ad] mx-auto mb-2" />
            <span className="text-sm font-medium">Loading catalog items...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Products Found</h3>
            <p className="text-xs text-slate-400 mt-1">Try clearing filters or add your first product.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Category / Brand</th>
                <th className="px-6 py-4">Fabric Material</th>
                <th className="px-6 py-4">Variants Count</th>
                <th className="px-6 py-4">Total Stock Units</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredProducts.map((p) => {
                const pVariants = variants.filter((v) => v.product_id === p.id);
                const totalStock = pVariants.reduce((sum, v) => sum + v.current_stock, 0);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{p.name}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                      <div>{p.category_name}</div>
                      <div className="text-[10px] text-slate-400">{p.brand_name || 'Generic'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-medium">
                        {p.material || 'Cotton'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="w-4 h-4 text-[#2012ad]" />
                        {pVariants.length} Variants
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${totalStock === 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {totalStock} units
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.is_active === 1 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-xs font-semibold">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedProductVariants({ product: p, list: pVariants })}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#2012ad] border border-indigo-200 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Variants</span>
                      </button>
                      <button
                        onClick={() => handleDeactivate(p.id)}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition-all"
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Variants View Modal */}
      {selectedProductVariants && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedProductVariants.product.name}</h3>
                <p className="text-xs text-slate-500">Variants & Pricing Matrix</p>
              </div>
              <button onClick={() => setSelectedProductVariants(null)} className="p-1 text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs max-h-96 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Barcode</th>
                    <th className="p-3">Color / Size</th>
                    <th className="p-3">Cost (₹)</th>
                    <th className="p-3">Price (₹)</th>
                    <th className="p-3">Current Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedProductVariants.list.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-900">{v.sku}</td>
                      <td className="p-3 font-mono text-slate-500">{v.barcode || 'N/A'}</td>
                      <td className="p-3 font-medium text-slate-700">{v.color} / {v.size}</td>
                      <td className="p-3">₹{v.purchase_price}</td>
                      <td className="p-3 font-bold text-slate-900">₹{v.selling_price}</td>
                      <td className="p-3 font-semibold text-emerald-600">{v.current_stock} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 text-right">
              <button
                onClick={() => setSelectedProductVariants(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Creation Wizard Modal */}
      <ProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => fetchData()}
      />
    </div>
  );
};
