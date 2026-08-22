import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DesignationModal } from './DesignationModal';
import { BadgeCheck, Plus, Edit2, Power, AlertTriangle, Users, Filter } from 'lucide-react';

export const DesignationListPage: React.FC = () => {
  const [designations, setDesignations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<number | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDes, setSelectedDes] = useState<any | undefined>(undefined);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const fetchDepartments = async () => {
    try {
      if (window.api?.department) {
        const data = await window.api.department.getAll(false);
        setDepartments(data);
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const fetchDesignations = async () => {
    setLoading(true);
    setDeactivateError(null);
    try {
      if (window.api?.designation) {
        const deptId = selectedDeptFilter === 'ALL' ? undefined : Number(selectedDeptFilter);
        const data = await window.api.designation.getAll(deptId, true);
        setDesignations(data);
      }
    } catch (err) {
      console.error('Failed to fetch designations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchDesignations();
  }, [selectedDeptFilter]);

  const handleOpenAdd = () => {
    setSelectedDes(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (des: any) => {
    setSelectedDes(des);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (des: any) => {
    setDeactivateError(null);
    try {
      if (window.api?.designation) {
        const newStatus = des.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        if (newStatus === 'INACTIVE') {
          const res = await window.api.designation.deactivate('', des.id);
          if (!res.success) {
            setDeactivateError(res.error || 'Cannot deactivate designation.');
            return;
          }
        } else {
          await window.api.designation.update('', des.id, { name: des.name });
        }
        fetchDesignations();
      }
    } catch (err: any) {
      setDeactivateError(err.message || 'Action failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Designations Directory</h2>
          <p className="text-xs text-slate-500 mt-1">Configure staff position titles and department roles</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter by Department */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>
            Add Designation
          </Button>
        </div>
      </div>

      {deactivateError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{deactivateError}</span>
        </div>
      )}

      {/* Grid of Designation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs font-medium">
            Loading designations from database...
          </div>
        ) : designations.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs font-medium">
            No designations found. Click "Add Designation" to create a new role.
          </div>
        ) : (
          designations.map((des) => (
            <Card key={des.id} className="relative transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad]">
                    <BadgeCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{des.name}</h3>
                    <span className="inline-block px-2 py-0.5 mt-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-[#2012ad]">
                      {des.department_name}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    des.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {des.status}
                </span>
              </div>

              <p className="text-xs text-slate-500 my-4 line-clamp-2 min-h-[32px]">
                {des.description || 'No description provided for this role.'}
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{des.staff_count || 0} Assigned</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(des)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                    title="Edit Designation"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(des)}
                    className={`p-1.5 rounded-lg transition-all ${
                      des.status === 'ACTIVE'
                        ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={des.status === 'ACTIVE' ? 'Deactivate Designation' : 'Reactivate Designation'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      <DesignationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDesignations}
        designation={selectedDes}
        departments={departments}
      />
    </div>
  );
};
