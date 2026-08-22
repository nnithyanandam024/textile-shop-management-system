import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, RefreshCw, Layers, Eye, Tag } from 'lucide-react';
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
    if (!window.confirm('Are you sure you want to change this product status? Historical records will be preserved.')) return;
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
    <div className="space-y-5 select-none">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-[#2012ad] shadow-sm">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Textile Product Catalog</h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Manage master textile items, colors, sizes, SKUs and live stock</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all shadow-xs"
            title="Refresh Catalog"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#2012ad] hover:bg-[#1a0e91] active:bg-[#150b74] text-white text-sm font-semibold rounded-xl shadow-md shadow-[#2012ad]/20 transition-all flex items-center gap-2"
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
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad] focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Filters:</span>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2012ad] focus:bg-white"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2012ad] focus:bg-white"
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
          <div className="p-16 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-[#2012ad] mx-auto mb-3" />
            <span className="text-sm font-semibold">Loading catalog items...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mx-auto mb-3">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Products Found</h3>
            <p className="text-xs text-slate-400 mt-1">Try clearing your search filters or click 'Add New Product' above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[920px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5 w-[30%]">Product Name</th>
                  <th className="py-3.5 px-4 w-[18%]">Category & Brand</th>
                  <th className="py-3.5 px-4 w-[16%]">Fabric Material</th>
                  <th className="py-3.5 px-4 w-[12%]">Variants</th>
                  <th className="py-3.5 px-4 w-[12%]">Total Stock</th>
                  <th className="py-3.5 px-3 w-[8%] text-center">Status</th>
                  <th className="py-3.5 px-5 w-[14%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProducts.map((p) => {
                  const pVariants = variants.filter((v) => v.product_id === p.id);
                  const totalStock = pVariants.reduce((sum, v) => sum + v.current_stock, 0);
                  const minPrice = pVariants.length > 0 ? Math.min(...pVariants.map((v) => v.selling_price)) : 0;
                  const maxPrice = pVariants.length > 0 ? Math.max(...pVariants.map((v) => v.selling_price)) : 0;
                  const priceDisplay = minPrice === maxPrice ? `₹${minPrice.toLocaleString()}` : `₹${minPrice.toLocaleString()} – ₹${maxPrice.toLocaleString()}`;

                  return (
                    <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors group">
                      {/* Column 1: Product Name */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 group-hover:border-[#2012ad]/30 group-hover:bg-indigo-50/50 transition-colors">
                            <Tag className="w-4 h-4 text-[#2012ad]" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">{p.name}</p>
                            <p className="text-[11px] font-semibold text-[#2012ad] mt-0.5">{priceDisplay}</p>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Category & Brand */}
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-800 block">{p.category_name || 'General'}</span>
                        <span className="text-[11px] font-medium text-slate-400 block">{p.brand_name || 'Generic'}</span>
                      </td>

                      {/* Column 3: Fabric Material */}
                      <td className="py-4 px-4">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 font-medium rounded-lg border border-slate-200/80 whitespace-nowrap text-[11px]">
                          {p.material || 'Cotton'}
                        </span>
                      </td>

                      {/* Column 4: Variants Count */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-[#2012ad] font-bold rounded-lg border border-indigo-100 text-xs whitespace-nowrap">
                          <Layers className="w-3.5 h-3.5" />
                          {pVariants.length} Variants
                        </span>
                      </td>

                      {/* Column 5: Total Stock */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className={`w-2 h-2 rounded-full ${totalStock === 0 ? 'bg-red-500 animate-pulse' : totalStock <= 10 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          <span className={`font-bold ${totalStock === 0 ? 'text-red-600' : totalStock <= 10 ? 'text-amber-700' : 'text-slate-800'}`}>
                            {totalStock} units
                          </span>
                        </div>
                      </td>

                      {/* Column 6: Status */}
                      <td className="py-4 px-3 text-center">
                        {p.is_active === 1 ? (
                          <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px] uppercase">
                            Active
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-full font-bold text-[10px] uppercase">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Column 7: Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center justify-end gap-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedProductVariants({ product: p, list: pVariants })}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-[#2012ad] border border-indigo-200/80 rounded-xl font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs"
                            title="View product variants & SKUs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Variants</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeactivate(p.id)}
                            className="px-2.5 py-1.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-xl font-semibold transition-all text-xs"
                            title={p.is_active === 1 ? 'Deactivate Product' : 'Activate Product'}
                          >
                            {p.is_active === 1 ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Variants View Modal */}
      {selectedProductVariants && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 relative animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#2012ad] flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedProductVariants.product.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">Variants, Barcodes & Pricing Matrix</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProductVariants(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors text-base font-bold"
              >
                ×
              </button>
            </div>

            <div className="border border-slate-200/80 rounded-2xl overflow-hidden text-xs max-h-96 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">SKU</th>
                    <th className="p-3.5">Barcode</th>
                    <th className="p-3.5">Color / Size</th>
                    <th className="p-3.5">Cost (₹)</th>
                    <th className="p-3.5">Price (₹)</th>
                    <th className="p-3.5">Current Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedProductVariants.list.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{v.sku}</td>
                      <td className="p-3.5 font-mono text-slate-500">{v.barcode || '—'}</td>
                      <td className="p-3.5 font-medium text-slate-700">
                        <span className="font-semibold text-slate-900">{v.color}</span> • {v.size}
                      </td>
                      <td className="p-3.5 text-slate-600">₹{v.purchase_price.toLocaleString()}</td>
                      <td className="p-3.5 font-bold text-[#2012ad]">₹{v.selling_price.toLocaleString()}</td>
                      <td className="p-3.5">
                        <span className={`font-bold ${v.current_stock <= 5 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {v.current_stock} units
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-5 flex items-center justify-between">
              <p className="text-xs text-slate-400 font-medium">
                Total {selectedProductVariants.list.length} active variant SKU(s) configured
              </p>
              <button
                onClick={() => setSelectedProductVariants(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
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
