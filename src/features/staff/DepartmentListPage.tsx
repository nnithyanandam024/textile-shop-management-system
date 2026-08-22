import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DepartmentModal } from './DepartmentModal';
import { Briefcase, Plus, Edit2, Power, AlertTriangle, Users } from 'lucide-react';

export const DepartmentListPage: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<any | undefined>(undefined);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const fetchDepartments = async () => {
    setLoading(true);
    setDeactivateError(null);
    try {
      if (window.api?.department) {
        const data = await window.api.department.getAll(true); // include inactive
        setDepartments(data);
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenAdd = () => {
    setSelectedDept(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: any) => {
    setSelectedDept(dept);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (dept: any) => {
    setDeactivateError(null);
    try {
      if (window.api?.department) {
        const newStatus = dept.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        if (newStatus === 'INACTIVE') {
          const res = await window.api.department.deactivate('', dept.id);
          if (!res.success) {
            setDeactivateError(res.error || 'Cannot deactivate department.');
            return;
          }
        } else {
          await window.api.department.update('', dept.id, { name: dept.name });
        }
        fetchDepartments();
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
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Departments Directory</h2>
          <p className="text-xs text-slate-500 mt-1">Manage store organizational units and department structures</p>
        </div>

        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>
          Add Department
        </Button>
      </div>

      {deactivateError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{deactivateError}</span>
        </div>
      )}

      {/* Grid of Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs font-medium">
            Loading departments from database...
          </div>
        ) : departments.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs font-medium">
            No departments found. Click "Add Department" to create your first unit.
          </div>
        ) : (
          departments.map((dept) => (
            <Card key={dept.id} className="relative transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad]">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{dept.name}</h3>
                    <p className="text-[10px] font-mono font-semibold text-slate-400">{dept.department_code}</p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    dept.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {dept.status}
                </span>
              </div>

              <p className="text-xs text-slate-500 my-4 line-clamp-2 min-h-[32px]">
                {dept.description || 'No description provided for this department.'}
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{dept.staff_count || 0} Staff</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(dept)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                    title="Edit Department"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(dept)}
                    className={`p-1.5 rounded-lg transition-all ${
                      dept.status === 'ACTIVE'
                        ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={dept.status === 'ACTIVE' ? 'Deactivate Department' : 'Reactivate Department'}
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
      <DepartmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDepartments}
        department={selectedDept}
      />
    </div>
  );
};
