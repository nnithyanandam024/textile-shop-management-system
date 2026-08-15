import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, RefreshCw, Eye, AlertCircle, Loader2 } from 'lucide-react';
import { SupplierProfileModal } from './SupplierProfileModal';

interface Supplier {
  id: number;
  supplier_code: string;
  company_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  gst_number?: string;
  is_active: number;
}

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);

  // Form Inputs
  const [companyName, setCompanyName] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [gstNumber, setGstNumber] = useState<string>('');

  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      if (window.api && window.api.suppliers) {
        const list = await window.api.suppliers.getAll();
        setSuppliers(list);
      }
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Company Name is required.');
      return;
    }

    setError('');
    setActionLoading(true);

    try {
      if (window.api && window.api.suppliers) {
        const res = await window.api.suppliers.create({
          company_name: companyName.trim(),
          contact_person: contactPerson.trim(),
          phone: phone.trim(),
          email: email.trim(),
          gst_number: gstNumber.trim(),
        });

        if (res.success) {
          setCompanyName('');
          setContactPerson('');
          setPhone('');
          setEmail('');
          setGstNumber('');
          setShowAddModal(false);
          fetchSuppliers();
        } else {
          setError(res.error || 'Failed to create supplier.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Supplier creation error.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.company_name.toLowerCase().includes(term) ||
      (s.contact_person && s.contact_person.toLowerCase().includes(term)) ||
      (s.phone && s.phone.includes(term)) ||
      s.supplier_code.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-[#2818cf]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Supplier Management Directory</h1>
            <p className="text-xs font-medium text-slate-500">Manage vendor profiles, purchase histories, and supplier payments</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSuppliers}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all"
            title="Refresh Suppliers"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#2818cf] hover:bg-[#2012ad] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#2818cf]/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Supplier</span>
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Company Name, Contact Person, Phone, or Code..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2818cf]"
          />
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-[#2818cf] mx-auto mb-2" />
            <span className="text-sm font-medium">Loading suppliers...</span>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            No suppliers found.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Supplier Code</th>
                <th className="px-6 py-4">Company Name</th>
                <th className="px-6 py-4">Contact Person / Phone</th>
                <th className="px-6 py-4">GSTIN</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">{s.supplier_code}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{s.company_name}</td>
                  <td className="px-6 py-4 text-xs text-slate-600">
                    <div>{s.contact_person || 'N/A'}</div>
                    <div className="text-[10px] text-slate-400">{s.phone || ''}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">{s.gst_number || 'N/A'}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedSupplierId(s.id)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#2818cf] border border-indigo-200 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Profile</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add New Supplier</h3>
            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleAddSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Company Name *</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Texora Mills Ltd"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Contact Person</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Suresh Kumar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">GST Number</label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="e.g. 33AAAAA0000A1Z5"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium font-mono"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="w-1/2 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" disabled={actionLoading} className="w-1/2 py-2.5 bg-[#2818cf] text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5">
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Supplier</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Profile Drawer */}
      <SupplierProfileModal
        isOpen={!!selectedSupplierId}
        supplierId={selectedSupplierId}
        onClose={() => setSelectedSupplierId(null)}
        onRefresh={() => fetchSuppliers()}
      />
    </div>
  );
};
