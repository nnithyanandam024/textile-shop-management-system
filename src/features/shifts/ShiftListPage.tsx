import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ShiftTemplateModal } from './modals/ShiftTemplateModal';
import { AssignShiftModal } from './modals/AssignShiftModal';
import { ShiftOverrideModal } from './modals/ShiftOverrideModal';
import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Users2,
  Layers,
  Search,
  Moon,
  Sun,
  UserCheck,
} from 'lucide-react';

export const ShiftListPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'grid' | 'assignments' | 'overrides'>('templates');

  // Data states
  const [templates, setTemplates] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');

  // Modals
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplateForEdit, setSelectedTemplateForEdit] = useState<any | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (window.api?.shifts) {
        const tmps = await window.api.shifts.getTemplates(true);
        setTemplates(tmps || []);

        const today = new Date().toISOString().split('T')[0];
        const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
        const ovs = await window.api.shifts.getOverrides(today, nextMonth);
        setOverrides(ovs || []);
      }
      if (window.api?.staff) {
        const s = await window.api.staff.getAll({ limit: 500 });
        setStaffList(s.staff || []);
      }
    } catch (err) {
      console.error('Failed to load shift data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeactivateTemplate = async (id: number) => {
    if (!window.confirm('Are you sure you want to deactivate this shift template? Historical records will be preserved.')) return;
    if (window.api?.shifts) {
      const res = await window.api.shifts.deactivateTemplate(id);
      if (res.success) {
        fetchData();
      } else {
        alert(res.error || 'Deactivation failed.');
      }
    }
  };

  const handleDeleteOverride = async (id: number) => {
    if (window.api?.shifts) {
      const res = await window.api.shifts.deleteOverride(id);
      if (res.success) {
        fetchData();
      } else {
        alert(res.error || 'Delete failed.');
      }
    }
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.shift_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2818cf] shadow-sm">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Shift & Work Schedule Management</h1>
            <p className="text-xs font-semibold text-slate-500">Configure shift timings, weekly staff rosters and temporary shift overrides</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" icon={<UserCheck className="w-4 h-4" />} onClick={() => setIsAssignModalOpen(true)}>
            Assign Shift
          </Button>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => { setSelectedTemplateForEdit(null); setIsTemplateModalOpen(true); }}>
            Add Shift Template
          </Button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'templates'
              ? 'bg-indigo-50 text-[#2818cf] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          Shift Templates ({templates.length})
        </button>

        <button
          onClick={() => setActiveTab('grid')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'grid'
              ? 'bg-indigo-50 text-[#2818cf] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users2 className="w-4 h-4" />
          Staff Roster & Schedule
        </button>

        <button
          onClick={() => setActiveTab('overrides')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 relative ${
            activeTab === 'overrides'
              ? 'bg-indigo-50 text-[#2818cf] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Temporary Overrides
          {overrides.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
              {overrides.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: SHIFT TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search shift name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((tmp) => (
              <Card key={tmp.id} className="p-5 border border-slate-200/80 space-y-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-[#2818cf] bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                        {tmp.shift_code}
                      </span>
                      {tmp.is_overnight ? (
                        <span className="px-2 py-0.5 bg-slate-800 text-amber-300 text-[10px] font-bold rounded-md flex items-center gap-1">
                          <Moon className="w-3 h-3" /> Overnight
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-md flex items-center gap-1">
                          <Sun className="w-3 h-3 text-amber-500" /> Day Shift
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900">{tmp.name}</h3>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      tmp.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tmp.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-700 font-bold">
                    <span>Timing:</span>
                    <span className="font-mono text-slate-900">
                      {tmp.start_time} — {tmp.end_time}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 text-[11px]">
                    <span>Grace Period:</span>
                    <span className="font-semibold text-slate-800">{tmp.grace_minutes} Minutes</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 text-[11px]">
                    <span>Break Duration:</span>
                    <span className="font-semibold text-slate-800">{tmp.break_minutes} Minutes</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 text-[11px]">
                    <span>Full Work Duration:</span>
                    <span className="font-semibold text-slate-800">{tmp.minimum_work_minutes} Mins (8h)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold">
                    <strong className="text-slate-900">{tmp.assigned_staff_count || 0}</strong> Staff Assigned
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedTemplateForEdit(tmp);
                        setIsTemplateModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#2818cf] hover:bg-indigo-50 transition-all"
                      title="Edit Shift"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {tmp.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleDeactivateTemplate(tmp.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        title="Deactivate Shift"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: STAFF ROSTER & SCHEDULE GRID */}
      {activeTab === 'grid' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Staff Weekly Roster Matrix</h3>
              <p className="text-xs text-slate-500">Overview of assigned working shifts and week-offs across employee roster</p>
            </div>

            <Button variant="outline" icon={<UserCheck className="w-4 h-4" />} onClick={() => setIsAssignModalOpen(true)}>
              Change Shift Assignment
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Staff Code</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Mon</th>
                  <th className="py-3 px-4 text-center">Tue</th>
                  <th className="py-3 px-4 text-center">Wed</th>
                  <th className="py-3 px-4 text-center">Thu</th>
                  <th className="py-3 px-4 text-center">Fri</th>
                  <th className="py-3 px-4 text-center">Sat</th>
                  <th className="py-3 px-4 text-center">Sun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {staffList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-3 px-4 font-mono font-bold text-[#2818cf]">{s.staff_code}</td>
                    <td className="py-3 px-4 text-slate-900 font-bold">
                      {s.first_name} {s.last_name || ''}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{s.department_name || 'Unassigned'}</td>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <td key={day} className="py-3 px-4 text-center">
                        <span className="px-2 py-1 bg-indigo-50 text-[#2818cf] text-[10px] font-extrabold rounded-lg border border-indigo-100">
                          GEN (09-18)
                        </span>
                      </td>
                    ))}
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-extrabold rounded-lg">
                        WEEK OFF
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: OVERRIDES */}
      {activeTab === 'overrides' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Temporary Shift Overrides ({overrides.length})</h3>
              <p className="text-xs text-slate-500">Single-day shift swaps and special week-off overrides</p>
            </div>

            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsOverrideModalOpen(true)}>
              Create Shift Override
            </Button>
          </div>

          {overrides.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No temporary shift overrides configured for the upcoming period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Override Date</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Assigned Shift Override</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                  {overrides.map((ov) => (
                    <tr key={ov.id} className="hover:bg-slate-50/60 transition-all">
                      <td className="py-3 px-4 font-mono font-bold text-[#2818cf]">{ov.override_date}</td>
                      <td className="py-3 px-4 text-slate-900 font-bold">
                        {ov.staff_code} — {ov.first_name} {ov.last_name || ''}
                      </td>
                      <td className="py-3 px-4">
                        {ov.is_week_off ? (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">
                            Special Week Off
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-indigo-50 text-[#2818cf] text-[10px] font-bold rounded-md">
                            {ov.shift_name} ({ov.start_time} - {ov.end_time})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{ov.reason}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteOverride(ov.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Modals */}
      <ShiftTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSuccess={fetchData}
        templateToEdit={selectedTemplateForEdit}
      />

      <AssignShiftModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={fetchData}
        staffList={staffList}
        shiftTemplates={templates}
      />

      <ShiftOverrideModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        onSuccess={fetchData}
        staffList={staffList}
        shiftTemplates={templates}
      />
    </div>
  );
};
