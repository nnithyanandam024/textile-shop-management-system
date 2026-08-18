import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CreatePayrollPeriodModal } from './modals/CreatePayrollPeriodModal';
import { AssignSalaryModal } from './modals/AssignSalaryModal';
import { IssueAdvanceModal } from './modals/IssueAdvanceModal';
import { PayslipModal } from './modals/PayslipModal';
import {
  DollarSign,
  Plus,
  Calendar,
  Lock,
  HandCoins,
  Receipt,
  Play,
  Check,
} from 'lucide-react';

export const PayrollPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'periods' | 'structures' | 'advances' | 'calculation' | 'payslips'>('periods');

  // Data states
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<any | null>(null);
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);

  // Modals
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [selectedRecordForPayslip, setSelectedRecordForPayslip] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (window.api?.payroll) {
        const pers = await window.api.payroll.getPeriods();
        setPeriods(pers || []);
        if (pers && pers.length > 0 && !selectedPeriod) {
          setSelectedPeriod(pers[0]);
        }
      }
      if (window.api?.staff) {
        const s = await window.api.staff.getAll({ limit: 500 });
        setStaffList(s.staff || []);
      }
      if (window.api?.advance) {
        const advs = await window.api.advance.getAll();
        setAdvances(advs || []);
      }
    } catch (err) {
      console.error('Failed to load payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchPeriodRecords = async (periodId: number) => {
    if (window.api?.payroll) {
      const recs = await window.api.payroll.getRecords(periodId);
      setPayrollRecords(recs || []);
    }
  };

  useEffect(() => {
    if (selectedPeriod) {
      fetchPeriodRecords(selectedPeriod.id);
    }
  }, [selectedPeriod]);

  const handleCalculatePayroll = async (periodId: number) => {
    if (window.api?.payroll) {
      const res = await window.api.payroll.calculatePeriod(periodId);
      if (res.success) {
        fetchData();
        fetchPeriodRecords(periodId);
      } else {
        alert(res.error || 'Calculation failed.');
      }
    }
  };

  const handleApprovePayroll = async (periodId: number) => {
    if (window.api?.payroll) {
      const res = await window.api.payroll.approvePeriod(periodId);
      if (res.success) {
        fetchData();
        fetchPeriodRecords(periodId);
      } else {
        alert(res.error || 'Approval failed.');
      }
    }
  };

  const handleLockPayroll = async (periodId: number) => {
    if (!window.confirm('Are you sure you want to lock this payroll period? This will finalize all salary records and process advance deductions.')) return;
    if (window.api?.payroll) {
      const res = await window.api.payroll.lockPeriod(periodId);
      if (res.success) {
        fetchData();
        fetchPeriodRecords(periodId);
      } else {
        alert(res.error || 'Lock failed.');
      }
    }
  };

  const totalGross = payrollRecords.reduce((sum, r) => sum + r.gross_earnings, 0);
  const totalDeductions = payrollRecords.reduce((sum, r) => sum + r.total_deductions, 0);
  const totalNet = payrollRecords.reduce((sum, r) => sum + r.net_salary, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2818cf] shadow-sm">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payroll & Salary Engine</h1>
            <p className="text-xs font-semibold text-slate-500">Calculate employee salaries, overtime pay, unpaid leave deductions & issue payslips</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" icon={<HandCoins className="w-4 h-4" />} onClick={() => setIsAdvanceModalOpen(true)}>
            Issue Advance
          </Button>
          <Button variant="outline" icon={<DollarSign className="w-4 h-4" />} onClick={() => setIsSalaryModalOpen(true)}>
            Assign Salary
          </Button>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsPeriodModalOpen(true)}>
            Create Period
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200/80">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Employees Included</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{payrollRecords.length}</p>
        </Card>

        <Card className="p-4 bg-emerald-50/50 border border-emerald-100">
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Total Gross Payroll</span>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">₹{totalGross.toLocaleString()}</p>
        </Card>

        <Card className="p-4 bg-rose-50/50 border border-rose-100">
          <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider">Total Deductions</span>
          <p className="text-xl font-extrabold text-rose-700 mt-1">₹{totalDeductions.toLocaleString()}</p>
        </Card>

        <Card className="p-4 bg-indigo-50/50 border border-indigo-100">
          <span className="text-[10px] font-extrabold text-[#2818cf] uppercase tracking-wider">Total Net Payable</span>
          <p className="text-xl font-extrabold text-[#2818cf] mt-1">₹{totalNet.toLocaleString()}</p>
        </Card>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setActiveTab('periods')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'periods'
              ? 'bg-indigo-50 text-[#2818cf] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Payroll Periods ({periods.length})
        </button>

        <button
          onClick={() => setActiveTab('calculation')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'calculation'
              ? 'bg-indigo-50 text-[#2818cf] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Play className="w-4 h-4" />
          Calculation & Review
        </button>

        <button
          onClick={() => setActiveTab('advances')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'advances'
              ? 'bg-indigo-50 text-[#2818cf] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HandCoins className="w-4 h-4" />
          Salary Advances ({advances.length})
        </button>
      </div>

      {/* TAB 1: PAYROLL PERIODS */}
      {activeTab === 'periods' && (
        <Card className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Period Name</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Working Days</th>
                  <th className="py-3 px-4">Staff Count</th>
                  <th className="py-3 px-4">Net Payable</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {periods.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4">{p.start_date} to {p.end_date}</td>
                    <td className="py-3 px-4 font-bold">{p.total_working_days} Days</td>
                    <td className="py-3 px-4">{p.total_staff_count || 0} Employees</td>
                    <td className="py-3 px-4 font-extrabold text-[#2818cf]">₹{(p.total_net || 0).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          p.status === 'LOCKED'
                            ? 'bg-slate-800 text-white'
                            : p.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'CALCULATED'
                            ? 'bg-indigo-50 text-[#2818cf] border border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedPeriod(p);
                            setActiveTab('calculation');
                          }}
                          className="text-[11px] font-bold text-[#2818cf] hover:underline"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: CALCULATION & REVIEW */}
      {activeTab === 'calculation' && (
        <Card className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Payroll Period: <span className="text-[#2818cf]">{selectedPeriod?.name || 'Select Period'}</span>
              </h3>
              <p className="text-xs text-slate-500">
                Status: <span className="font-bold">{selectedPeriod?.status || 'DRAFT'}</span> | Total Net: ₹{totalNet.toLocaleString()}
              </p>
            </div>

            {selectedPeriod && selectedPeriod.status !== 'LOCKED' && (
              <div className="flex items-center gap-2">
                <Button variant="outline" icon={<Play className="w-4 h-4" />} onClick={() => handleCalculatePayroll(selectedPeriod.id)}>
                  Run Calculation
                </Button>
                {selectedPeriod.status === 'CALCULATED' && (
                  <Button variant="primary" icon={<Check className="w-4 h-4" />} onClick={() => handleApprovePayroll(selectedPeriod.id)}>
                    Approve Payroll
                  </Button>
                )}
                {selectedPeriod.status === 'APPROVED' && (
                  <Button variant="danger" icon={<Lock className="w-4 h-4" />} onClick={() => handleLockPayroll(selectedPeriod.id)}>
                    Lock Payroll
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Staff ID</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Basic Pay</th>
                  <th className="py-3 px-4">Gross Earnings</th>
                  <th className="py-3 px-4">Unpaid Leave</th>
                  <th className="py-3 px-4">Advance Recovery</th>
                  <th className="py-3 px-4">Total Deductions</th>
                  <th className="py-3 px-4">Net Salary</th>
                  <th className="py-3 px-4 text-right">Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {payrollRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-3 px-4 font-mono font-bold text-[#2818cf]">{r.staff_code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.first_name} {r.last_name || ''}</td>
                    <td className="py-3 px-4">₹{r.basic_salary.toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">₹{r.gross_earnings.toLocaleString()}</td>
                    <td className="py-3 px-4 text-rose-600">-₹{r.unpaid_leave_deduction.toLocaleString()} ({r.unpaid_leave_days}d)</td>
                    <td className="py-3 px-4 text-rose-600">-₹{r.advance_deduction.toLocaleString()}</td>
                    <td className="py-3 px-4 text-rose-700 font-bold">-₹{r.total_deductions.toLocaleString()}</td>
                    <td className="py-3 px-4 font-extrabold text-base text-[#2818cf]">₹{r.net_salary.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Receipt className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setSelectedRecordForPayslip(r);
                          setIsPayslipModalOpen(true);
                        }}
                      >
                        Payslip
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: SALARY ADVANCES */}
      {activeTab === 'advances' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Salary Advances & Loan Recoveries ({advances.length})</h3>
              <p className="text-xs text-slate-500">Track active staff advances and monthly payroll installment deductions</p>
            </div>
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsAdvanceModalOpen(true)}>
              Issue Salary Advance
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Staff ID</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Loan Amount</th>
                  <th className="py-3 px-4">Monthly Installment</th>
                  <th className="py-3 px-4">Remaining Balance</th>
                  <th className="py-3 px-4">Advance Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {advances.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-3 px-4 font-mono font-bold text-[#2818cf]">{a.staff_code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{a.first_name} {a.last_name || ''}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{a.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 font-semibold text-indigo-600">₹{a.monthly_installment.toLocaleString()} / mo</td>
                    <td className="py-3 px-4 font-extrabold text-amber-700">₹{a.remaining_amount.toLocaleString()}</td>
                    <td className="py-3 px-4">{a.advance_date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${a.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modals */}
      <CreatePayrollPeriodModal
        isOpen={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
        onSuccess={fetchData}
      />

      <AssignSalaryModal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        onSuccess={fetchData}
        staffList={staffList}
      />

      <IssueAdvanceModal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        onSuccess={fetchData}
        staffList={staffList}
      />

      <PayslipModal
        isOpen={isPayslipModalOpen}
        onClose={() => setIsPayslipModalOpen(false)}
        record={selectedRecordForPayslip}
        periodName={selectedPeriod?.name}
      />
    </div>
  );
};
