export interface StaffDashboardData {
  staff: {
    id: number;
    employeeCode: string;
    firstName: string;
    lastName?: string;
    fullName: string;
    departmentName: string;
    designationName: string;
    workLocation: string;
  };
  attendance: {
    status: 'NOT_CHECKED_IN' | 'PRESENT' | 'COMPLETED' | 'HALF_DAY' | 'LATE' | 'ABSENT' | 'ON_LEAVE';
    checkIn?: string;
    checkOut?: string;
    workedMinutes: number;
    workedFormatted: string;
    shiftStart?: string;
  };
  todayShift: {
    hasShift: boolean;
    isDayOff: boolean;
    name?: string;
    startTime?: string;
    endTime?: string;
    timeRange?: string;
    location?: string;
    breakTime?: string;
  };
  leaveBalances: Array<{
    code: string;
    name: string;
    allocated: number;
    used: number;
    available: number;
    percentage: number;
  }>;
  documents: {
    totalRequired: number;
    verifiedCount: number;
    completionPercentage: number;
    items: Array<{
      name: string;
      verified: boolean;
      status: string;
    }>;
    expiringAlert?: {
      documentName: string;
      daysRemaining: number;
      expiryDate: string;
    };
  };
  upcomingShifts: Array<{
    dayLabel: string;
    dateStr: string;
    name: string;
    startTime: string;
    endTime: string;
    timeRange: string;
  }>;
  recentActivity: Array<{
    id: number;
    iconType: 'ATTENDANCE' | 'SHIFT' | 'LEAVE' | 'DOCUMENT' | 'PROFILE' | 'DEFAULT';
    title: string;
    timestampFormatted: string;
    description?: string;
  }>;
}

export const staffDashboardService = {
  async getDashboardSummary(): Promise<{ success: boolean; data?: StaffDashboardData; error?: string }> {
    if (!window.api?.staffDashboard) {
      // Browser Demo Mock Fallback
      const mockData: StaffDashboardData = {
        staff: {
          id: 1,
          employeeCode: 'STF-0001',
          firstName: 'Arun',
          lastName: 'Kumar',
          fullName: 'Arun Kumar',
          departmentName: 'Storefront Sales',
          designationName: 'Senior Sales Associate',
          workLocation: 'Main Textile Shop',
        },
        attendance: {
          status: 'PRESENT',
          checkIn: '09:02 AM',
          workedMinutes: 324,
          workedFormatted: '5h 24m',
          shiftStart: '09:00 AM',
        },
        todayShift: {
          hasShift: true,
          isDayOff: false,
          name: 'Morning Shift',
          startTime: '09:00 AM',
          endTime: '06:00 PM',
          timeRange: '09:00 AM – 06:00 PM',
          location: 'Main Textile Shop',
          breakTime: '01:00 PM – 02:00 PM',
        },
        leaveBalances: [
          { code: 'CL', name: 'Casual Leave', allocated: 6, used: 2, available: 4, percentage: 67 },
          { code: 'AL', name: 'Annual Leave', allocated: 12, used: 4, available: 8, percentage: 67 },
        ],
        documents: {
          totalRequired: 5,
          verifiedCount: 5,
          completionPercentage: 100,
          items: [
            { name: 'ID Proof', verified: true, status: 'Verified' },
            { name: 'Address Proof', verified: true, status: 'Verified' },
            { name: 'Bank Document', verified: true, status: 'Verified' },
            { name: 'Employment Contract', verified: true, status: 'Verified' },
            { name: 'Certificate', verified: true, status: 'Verified' },
          ],
        },
        upcomingShifts: [
          { dayLabel: 'TODAY', dateStr: '2026-08-19', name: 'Morning Shift', startTime: '09:00 AM', endTime: '06:00 PM', timeRange: '09:00 AM – 06:00 PM' },
          { dayLabel: 'TOMORROW', dateStr: '2026-08-20', name: 'Evening Shift', startTime: '10:00 AM', endTime: '07:00 PM', timeRange: '10:00 AM – 07:00 PM' },
          { dayLabel: 'FRIDAY, 21 AUG', dateStr: '2026-08-21', name: 'Morning Shift', startTime: '09:00 AM', endTime: '06:00 PM', timeRange: '09:00 AM – 06:00 PM' },
        ],
        recentActivity: [
          { id: 1, iconType: 'ATTENDANCE', title: 'Attendance recorded', timestampFormatted: 'Today, 09:02 AM', description: 'Checked in for Morning Shift' },
          { id: 2, iconType: 'SHIFT', title: 'Shift assigned', timestampFormatted: 'Yesterday, 05:20 PM', description: 'Assigned to Morning Shift roster' },
          { id: 3, iconType: 'LEAVE', title: 'Leave approved', timestampFormatted: 'Yesterday, 10:15 AM', description: 'Casual Leave request approved' },
          { id: 4, iconType: 'DOCUMENT', title: 'Document verified', timestampFormatted: '17-Aug-2026', description: 'Address proof accepted' },
        ],
      };
      return { success: true, data: mockData };
    }

    return await window.api.staffDashboard.getDashboardSummary();
  },
};
