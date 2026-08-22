export type AttendanceStatusCode =
  | 'PRESENT'
  | 'WORKING'
  | 'ON_BREAK'
  | 'COMPLETED'
  | 'LATE'
  | 'HALF_DAY'
  | 'ABSENT'
  | 'LEAVE'
  | 'HOLIDAY'
  | 'WEEK_OFF'
  | 'NOT_CHECKED_IN';

export interface AttendanceStatusConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
  calendarSymbol: string;
  bgLight: string;
  textColor: string;
  borderColor: string;
}

export const ATTENDANCE_STATUS_MAP: Record<AttendanceStatusCode, AttendanceStatusConfig> = {
  PRESENT: {
    label: 'Present',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
    calendarSymbol: '●',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
  },
  WORKING: {
    label: 'In Progress (Working)',
    badgeClass: 'bg-indigo-50 text-[#2012ad] border-indigo-200 animate-pulse',
    dotClass: 'bg-[#2012ad]',
    calendarSymbol: '●',
    bgLight: 'bg-indigo-50',
    textColor: 'text-[#2012ad]',
    borderColor: 'border-indigo-200',
  },
  ON_BREAK: {
    label: 'On Break',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
    dotClass: 'bg-amber-500',
    calendarSymbol: '☕',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  COMPLETED: {
    label: 'Completed',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
    calendarSymbol: '●',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
  },
  LATE: {
    label: 'Late Arrival',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
    calendarSymbol: '⚠',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  HALF_DAY: {
    label: 'Half Day',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    dotClass: 'bg-orange-500',
    calendarSymbol: '◐',
    bgLight: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
  },
  ABSENT: {
    label: 'Absent',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500',
    calendarSymbol: '✕',
    bgLight: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
  },
  LEAVE: {
    label: 'Approved Leave',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    dotClass: 'bg-purple-500',
    calendarSymbol: 'L',
    bgLight: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
  },
  HOLIDAY: {
    label: 'Store Holiday',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    dotClass: 'bg-sky-500',
    calendarSymbol: 'H',
    bgLight: 'bg-sky-50',
    textColor: 'text-sky-700',
    borderColor: 'border-sky-200',
  },
  WEEK_OFF: {
    label: 'Weekly Off',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    dotClass: 'bg-slate-400',
    calendarSymbol: '○',
    bgLight: 'bg-slate-100',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-200',
  },
  NOT_CHECKED_IN: {
    label: 'Not Checked In',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    dotClass: 'bg-slate-400',
    calendarSymbol: '·',
    bgLight: 'bg-slate-50',
    textColor: 'text-slate-500',
    borderColor: 'border-slate-200',
  },
};

export function getStatusConfig(status?: string | null): AttendanceStatusConfig {
  if (!status) return ATTENDANCE_STATUS_MAP.NOT_CHECKED_IN;
  const key = status.toUpperCase() as AttendanceStatusCode;
  return ATTENDANCE_STATUS_MAP[key] || ATTENDANCE_STATUS_MAP.PRESENT;
}
