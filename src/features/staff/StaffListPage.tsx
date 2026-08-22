import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StaffFormModal } from './StaffFormModal';
import { StaffProfileModal } from './StaffProfileModal';
import {
  Users2,
  Plus,
  Search,
  Eye,
  Edit2,
  Power,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Briefcase,
  AlertCircle
} from 'lucide-react';

export const StaffListPage: React.FC = () => {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [totalStaff, setTotalStaff] = useState(0);
  const [loading, setLoading] = useState(true);

  // Stats
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);

  // Dropdown reference data
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [departmentFilter, setDepartmentFilter] = useState<number | 'ALL'>('ALL');
  const [designationFilter, setDesignationFilter] = useState<number | 'ALL'>('ALL');
  const [employmentFilter, setEmploymentFilter] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any | undefined>(undefined);

  // Deactivation confirmation modal state
  const [deactivatingStaff, setDeactivatingStaff] = useState<any | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const fetchReferenceData = async () => {
    try {
      if (window.api?.department) {
        const depts = await window.api.department.getAll(false);
        setDepartments(depts);
      }
      if (window.api?.designation) {
        const desigs = await window.api.designation.getAll(undefined, false);
        setDesignations(desigs);
      }
      if (window.api?.users) {
        const uList = await window.api.users.getAll();
        setUsers(uList || []);
      }
    } catch (err) {
      console.error('Failed to load staff reference data:', err);
    }
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      if (window.api?.staff) {
        const params: any = {
          search,
          status: statusFilter,
          department_id: departmentFilter === 'ALL' ? undefined : Number(departmentFilter),
          designation_id: designationFilter === 'ALL' ? undefined : Number(designationFilter),
          employment_type: employmentFilter,
          page,
          limit,
        };
        const res = await window.api.staff.getAll(params);
        setStaffList(res.staff || []);
        setTotalStaff(res.total || 0);

        // Fetch counts for overview
        const activeRes = await window.api.staff.getAll({ status: 'ACTIVE', limit: 1 });
        const inactiveRes = await window.api.staff.getAll({ status: 'INACTIVE', limit: 1 });
        setActiveCount(activeRes.total || 0);
        setInactiveCount(inactiveRes.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch staff list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferenceData();
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [search, statusFilter, departmentFilter, designationFilter, employmentFilter, page]);

  const handleOpenAdd = () => {
    setSelectedStaff(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (s: any) => {
    setSelectedStaff(s);
    setIsFormOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingStaff) return;
    setDeactivateError(null);
    try {
      if (window.api?.staff) {
        const res = await window.api.staff.deactivate('', deactivatingStaff.id);
        if (res.success) {
          setDeactivatingStaff(null);
          fetchStaff();
        } else {
          setDeactivateError(res.error || 'Failed to deactivate staff member.');
        }
      }
    } catch (err: any) {
      setDeactivateError(err.message || 'Action failed.');
    }
  };

  const totalPages = Math.ceil(totalStaff / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff Directory</h2>
          <p className="text-xs text-slate-500 mt-1">Manage employee master records, roles, profiles, and organizational assignments</p>
        </div>

        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>
          Add Staff Member
        </Button>
      </div>

      {/* KPI Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad]">
            <Users2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">TOTAL STAFF</p>
            <p className="text-xl font-extrabold text-slate-900">{activeCount + inactiveCount}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">ACTIVE</p>
            <p className="text-xl font-extrabold text-emerald-600">{activeCount}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">INACTIVE</p>
            <p className="text-xl font-extrabold text-slate-600">{inactiveCount}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">DEPARTMENTS</p>
            <p className="text-xl font-extrabold text-slate-900">{departments.length}</p>
          </div>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff by ID, Name, Phone, Email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] transition-all"
            />
          </div>

          {/* Filter Group */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ACTIVE">Active Staff</option>
              <option value="INACTIVE">Inactive Staff</option>
              <option value="ALL">All Statuses</option>
            </select>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Depts</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Designation Filter */}
            <select
              value={designationFilter}
              onChange={(e) => {
                setDesignationFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              {designations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Employment Type Filter */}
            <select
              value={employmentFilter}
              onChange={(e) => {
                setEmploymentFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="TEMPORARY">Temporary</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERN">Intern</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Staff Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Staff ID</th>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Department & Designation</th>
                <th className="py-3.5 px-4">Employment</th>
                <th className="py-3.5 px-4">Profile %</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs font-medium">
                    Loading staff records from database...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs font-medium">
                    No staff members match the selected search & filter criteria.
                  </td>
                </tr>
              ) : (
                staffList.map((s) => {
                  const fullName = `${s.first_name} ${s.last_name || ''}`.trim();
                  const comp = s.profile_completion || 0;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-all cursor-pointer" onClick={() => navigate(`/staff/profile/${s.id}`)}>
                      <td className="py-3 px-4 font-mono font-bold text-[#2012ad]">
                        {s.staff_code}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad] font-bold overflow-hidden shrink-0">
                            {s.photo_path ? (
                              <img src={`file://${s.photo_path}`} alt={fullName} className="w-full h-full object-cover" />
                            ) : (
                              s.first_name[0]
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 hover:text-[#2012ad]">{fullName}</p>
                            <p className="text-[10px] text-slate-400">Joined: {s.joining_date}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{s.phone}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{s.email || '—'}</p>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{s.designation_name}</p>
                        <p className="text-[10px] font-semibold text-[#2012ad]">{s.department_name}</p>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                          {s.employment_type?.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-[#2012ad] border border-indigo-100 font-mono">
                          {comp}%
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            s.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/staff/profile/${s.id}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#2012ad] hover:bg-indigo-50 transition-all"
                            title="View Full Staff Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                            title="Edit Staff Member"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {s.status === 'ACTIVE' && (
                            <button
                              onClick={() => {
                                setDeactivatingStaff(s);
                                setDeactivateError(null);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                              title="Deactivate Staff"
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-xs font-semibold text-slate-500">
            Showing {staffList.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, totalStaff)} of {totalStaff} Staff
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Form Modal */}
      <StaffFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchStaff}
        staff={selectedStaff}
        departments={departments}
        designations={designations}
        users={users}
      />

      {/* Profile Modal */}
      <StaffProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        staff={selectedStaff}
        onEdit={() => {
          setIsProfileOpen(false);
          setIsFormOpen(true);
        }}
        onDeactivate={() => {
          setIsProfileOpen(false);
          setDeactivatingStaff(selectedStaff);
        }}
      />

      {/* Deactivation Confirmation Modal */}
      {deactivatingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200/80 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Deactivate Staff Member?</h3>
                <p className="text-xs text-slate-500">{deactivatingStaff.staff_code} — {deactivatingStaff.first_name} {deactivatingStaff.last_name || ''}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
              The staff master record will be preserved in inactive status. Historical sales, attendance, and audit logs will continue to reference this employee properly.
            </p>

            {deactivateError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
                {deactivateError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDeactivatingStaff(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleConfirmDeactivate}>
                Deactivate Staff
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
