import React from 'react';
import { StaffPOSProductItem } from '../../services/staffPOSService';
import { POSProductCard } from './POSProductCard';
import { Package } from 'lucide-react';

interface POSProductGridProps {
  products: StaffPOSProductItem[];
  onAddToCart: (product: StaffPOSProductItem) => void;
  loading?: boolean;
}

export const POSProductGrid: React.FC<POSProductGridProps> = ({
  products,
  onAddToCart,
  loading,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="h-36 bg-slate-200 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs space-y-2">
        <Package className="w-8 h-8 text-slate-300 mx-auto" />
        <h4 className="text-xs font-extrabold text-slate-700">No products matching search query</h4>
        <p className="text-[11px] text-slate-400 font-semibold">
          Check the SKU or barcode, or clear the search field to view all store inventory.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
      {products.map((p) => (
        <POSProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
};
