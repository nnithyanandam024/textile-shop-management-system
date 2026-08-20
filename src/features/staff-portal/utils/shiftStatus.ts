export type ShiftStatusCode =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'WEEK_OFF'
  | 'HOLIDAY'
  | 'LEAVE'
  | 'CHANGED'
  | 'NO_SHIFT';

export interface ShiftStatusConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
  bgLight: string;
  textColor: string;
  borderColor: string;
}

export const SHIFT_STATUS_MAP: Record<ShiftStatusCode, ShiftStatusConfig> = {
  SCHEDULED: {
    label: 'Scheduled',
    badgeClass: 'bg-indigo-50 text-[#2818cf] border-indigo-200',
    dotClass: 'bg-[#2818cf]',
    bgLight: 'bg-indigo-50/50',
    textColor: 'text-[#2818cf]',
    borderColor: 'border-indigo-200',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse',
    dotClass: 'bg-emerald-500',
    bgLight: 'bg-emerald-50/50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
  },
  COMPLETED: {
    label: 'Completed',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-500',
    bgLight: 'bg-slate-50',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
  },
  WEEK_OFF: {
    label: 'Weekly Off',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    dotClass: 'bg-slate-400',
    bgLight: 'bg-slate-100/70',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-200',
  },
  HOLIDAY: {
    label: 'Store Holiday',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    dotClass: 'bg-sky-500',
    bgLight: 'bg-sky-50/60',
    textColor: 'text-sky-700',
    borderColor: 'border-sky-200',
  },
  LEAVE: {
    label: 'Approved Leave',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    dotClass: 'bg-purple-500',
    bgLight: 'bg-purple-50/60',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
  },
  CHANGED: {
    label: 'Shift Updated',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
    bgLight: 'bg-amber-50/60',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  NO_SHIFT: {
    label: 'No Shift Assigned',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500',
    bgLight: 'bg-rose-50/60',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
  },
};

export function getShiftStatusConfig(status?: string | null): ShiftStatusConfig {
  if (!status) return SHIFT_STATUS_MAP.SCHEDULED;
  const key = status.toUpperCase() as ShiftStatusCode;
  return SHIFT_STATUS_MAP[key] || SHIFT_STATUS_MAP.SCHEDULED;
}
