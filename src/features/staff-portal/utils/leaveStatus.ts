export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveStatusConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
  bgLight: string;
  borderColor: string;
  textColor: string;
}

export function getLeaveStatusConfig(status: string): LeaveStatusConfig {
  switch (status.toUpperCase()) {
    case 'APPROVED':
      return {
        label: 'Approved',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
        bgLight: 'bg-emerald-50/50',
        borderColor: 'border-emerald-200',
        textColor: 'text-emerald-700',
      };
    case 'REJECTED':
      return {
        label: 'Rejected',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        dotClass: 'bg-rose-500',
        bgLight: 'bg-rose-50/50',
        borderColor: 'border-rose-200',
        textColor: 'text-rose-700',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        dotClass: 'bg-slate-400',
        bgLight: 'bg-slate-50',
        borderColor: 'border-slate-200',
        textColor: 'text-slate-600',
      };
    case 'PENDING':
    default:
      return {
        label: 'Pending Review',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
        bgLight: 'bg-amber-50/50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-700',
      };
  }
}

export function getLeaveCalendarSymbolConfig(symbol: 'L' | 'P' | 'H' | 'O' | 'W') {
  switch (symbol) {
    case 'L':
      return {
        label: 'Approved Leave',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
        bgLight: 'bg-purple-50/70',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-700',
      };
    case 'P':
      return {
        label: 'Pending Leave',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        bgLight: 'bg-amber-50/70',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-700',
      };
    case 'H':
      return {
        label: 'Store Holiday',
        badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
        bgLight: 'bg-sky-50/70',
        borderColor: 'border-sky-200',
        textColor: 'text-sky-700',
      };
    case 'O':
      return {
        label: 'Weekly Off',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        bgLight: 'bg-slate-50',
        borderColor: 'border-slate-200',
        textColor: 'text-slate-600',
      };
    case 'W':
    default:
      return {
        label: 'Working Day',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        bgLight: 'bg-white',
        borderColor: 'border-slate-200',
        textColor: 'text-slate-700',
      };
  }
}
