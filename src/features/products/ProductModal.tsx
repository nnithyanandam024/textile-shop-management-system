import React, { useState, useEffect } from 'react';
import { X, Package, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface Brand {
  id: number;
  name: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_COLORS = ['Blue', 'Black', 'White', 'Red', 'Green', 'Gold', 'Navy Blue', 'Maroon', 'Pink', 'Grey', 'Beige'];
const PRESET_SIZES = ['Free Size', 'S', 'M', 'L', 'XL', '2XL', '3XL', '28', '30', '32', '34', '36', '38', '40'];
const MATERIALS = ['Cotton', 'Silk', 'Linen', 'Wool', 'Polyester', 'Rayon', 'Denim', 'Viscose'];

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<number>(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Step 1: Basic Details
  const [name, setName] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number>(0);
  const [brandId, setBrandId] = useState<number>(0);
  const [material, setMaterial] = useState<string>('Cotton');
  const [description] = useState<string>('');

  // Step 2: Matrix Variant Selector
  const [selectedColors, setSelectedColors] = useState<string[]>(['Blue']);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['M', 'L']);
  const [purchasePrice, setPurchasePrice] = useState<number>(600);
  const [sellingPrice, setSellingPrice] = useState<number>(999);
  const [taxRate, setTaxRate] = useState<number>(5);
  const [minimumStock, setMinimumStock] = useState<number>(5);
  const [initialStock, setInitialStock] = useState<number>(10);

  // Step 3: Generated Variants List
  const [generatedVariants, setGeneratedVariants] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchMetadata();
    }
  }, [isOpen]);

  const fetchMetadata = async () => {
    try {
      if (window.api) {
        const cats = await window.api.categories.getAll();
        const bnds = await window.api.brands.getAll();
        setCategories(cats);
        setBrands(bnds);
        if (cats.length > 0) setCategoryId(cats[0].id);
        if (bnds.length > 0) setBrandId(bnds[0].id);
      }
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  };

  if (!isOpen) return null;

  const toggleColor = (c: string) => {
    setSelectedColors((prev) => (prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c]));
  };

  const toggleSize = (s: string) => {
    setSelectedSizes((prev) => (prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]));
  };

  const handleGenerateMatrix = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product Name is required.');
      return;
    }
    if (selectedColors.length === 0 || selectedSizes.length === 0) {
      setError('Please select at least one Color and one Size.');
      return;
    }

    setError('');
    const matrix: any[] = [];
    let seq = 101;

    const pPrefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, 'TX');

    for (const color of selectedColors) {
      for (const size of selectedSizes) {
        const cPrefix = color.substring(0, 3).toUpperCase();
        const sPrefix = size.toUpperCase().replace(/\s+/g, '');
        const sku = `${pPrefix}-${cPrefix}-${sPrefix}-${seq++}`;
        const barcode = `890${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`;

        matrix.push({
          sku,
          barcode,
          color,
          size,
          purchase_price: purchasePrice,
          selling_price: sellingPrice,
          tax_rate: taxRate,
          minimum_stock: minimumStock,
          initial_stock: initialStock,
        });
      }
    }

    setGeneratedVariants(matrix);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (generatedVariants.length === 0) {
      setError('No variants generated.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (window.api && window.api.products) {
        const res = await window.api.products.createWithVariants({
          name: name.trim(),
          category_id: categoryId,
          brand_id: brandId || undefined,
          material,
          description,
          variants: generatedVariants,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to create product.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Product creation error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative animate-scale-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-[#2012ad]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Add New Textile Product</h3>
              <p className="text-xs text-slate-500">Step {step} of 2 — {step === 1 ? 'Product Details & Matrix Selector' : 'Review Generated SKU Variants'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {step === 1 ? (
            <form onSubmit={handleGenerateMatrix} className="space-y-5">
              {/* Product Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Men's Cotton Formal Shirt"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Brand</label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                  >
                    <option value={0}>None / Generic</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Fabric Material</label>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                  >
                    {MATERIALS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                  />
                </div>
              </div>

              {/* Pricing & Stock defaults */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Default Variant Pricing & Stock</h4>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Purchase Price (₹)</label>
                    <input
                      type="number"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Selling Price (₹)</label>
                    <input
                      type="number"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Min Stock Threshold</label>
                    <input
                      type="number"
                      value={minimumStock}
                      onChange={(e) => setMinimumStock(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Initial Stock</label>
                    <input
                      type="number"
                      value={initialStock}
                      onChange={(e) => setInitialStock(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Matrix Colors Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Select Colors for Variants</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => {
                    const active = selectedColors.includes(c);
                    return (
                      <button
                        type="button"
                        key={c}
                        onClick={() => toggleColor(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          active
                            ? 'bg-[#2012ad] text-white border-[#2012ad]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Matrix Sizes Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Select Sizes for Variants</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_SIZES.map((s) => {
                    const active = selectedSizes.includes(s);
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => toggleSize(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          active
                            ? 'bg-[#2012ad] text-white border-[#2012ad]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#2012ad] hover:bg-[#1a0e91] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#2012ad]/20 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate {selectedColors.length * selectedSizes.length} Variants →</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 mb-2">
                <span className="text-xs font-semibold text-[#2012ad]">
                  Generated {generatedVariants.length} independent variants for {name}
                </span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
                >
                  Back to Adjust Matrix
                </button>
              </div>

              {/* Variant Review Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="p-2.5">SKU</th>
                      <th className="p-2.5">Color / Size</th>
                      <th className="p-2.5">Cost</th>
                      <th className="p-2.5">Price</th>
                      <th className="p-2.5">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {generatedVariants.map((v, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-mono font-semibold text-slate-800">{v.sku}</td>
                        <td className="p-2.5 font-medium text-slate-700">{v.color} / {v.size}</td>
                        <td className="p-2.5 font-medium">₹{v.purchase_price}</td>
                        <td className="p-2.5 font-bold text-slate-900">₹{v.selling_price}</td>
                        <td className="p-2.5 font-semibold text-emerald-600">{v.initial_stock} units</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-3 bg-[#2012ad] hover:bg-[#1a0e91] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#2012ad]/20 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Master Product & Variants</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
