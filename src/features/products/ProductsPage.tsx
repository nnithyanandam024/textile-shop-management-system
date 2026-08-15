import React from 'react';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Shirt, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const ProductsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Product & Variant Management</h2>
          <p className="text-xs text-slate-400">Manage textile catalog, brands, sizes, colors & SKUs</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
          Add Product
        </Button>
      </div>

      <Card>
        <EmptyState
          icon={<Shirt className="w-8 h-8" />}
          title="Product Module Architecture Ready"
          description="Product CRUD, variant matrix (Size/Color), SKU creation, and GST tax management will be enabled in future phases."
        />
      </Card>
    </div>
  );
};
