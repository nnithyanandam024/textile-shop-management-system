export interface NotificationTemplatePayload {
  event: 'SHIFT_CHANGED' | 'LEAVE_SUBMITTED' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'PAYROLL_FINALIZED' | 'PERFORMANCE_REVIEW_ASSIGNED' | 'DOCUMENT_EXPIRING';
  data: Record<string, any>;
}

export function formatNotificationTemplate(payload: NotificationTemplatePayload): {
  type: string;
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
} {
  switch (payload.event) {
    case 'SHIFT_CHANGED':
      return {
        type: 'SHIFT',
        title: 'Shift Updated',
        message: `Your shift for ${payload.data.date || 'tomorrow'} has been updated to ${payload.data.shiftName || 'Scheduled Hours'}.`,
        priority: 'HIGH',
      };
    case 'LEAVE_SUBMITTED':
      return {
        type: 'LEAVE',
        title: 'New Leave Request Received',
        message: `${payload.data.staffName || 'Employee'} submitted a ${payload.data.leaveType || 'Leave'} request for ${payload.data.startDate}.`,
        priority: 'NORMAL',
      };
    case 'LEAVE_APPROVED':
      return {
        type: 'LEAVE',
        title: 'Leave Approved',
        message: `Your leave request for ${payload.data.startDate} has been approved.`,
        priority: 'NORMAL',
      };
    case 'LEAVE_REJECTED':
      return {
        type: 'LEAVE',
        title: 'Leave Request Rejected',
        message: `Your leave request for ${payload.data.startDate} was rejected: ${payload.data.reason || 'Management decision'}.`,
        priority: 'HIGH',
      };
    case 'PAYROLL_FINALIZED':
      return {
        type: 'PAYROLL',
        title: 'Payroll Finalized',
        message: `Salary processing for ${payload.data.month || 'Current Month'} is finalized. Payslip is ready for review.`,
        priority: 'NORMAL',
      };
    case 'PERFORMANCE_REVIEW_ASSIGNED':
      return {
        type: 'PERFORMANCE',
        title: 'Performance Evaluation Due',
        message: `Your self-review evaluation for cycle '${payload.data.cycleName}' is ready for submission.`,
        priority: 'NORMAL',
      };
    case 'DOCUMENT_EXPIRING':
      return {
        type: 'DOCUMENT',
        title: 'Document Expiry Warning',
        message: `Your compliance document '${payload.data.documentName}' expires in ${payload.data.daysLeft || 30} days.`,
        priority: 'URGENT',
      };
    default:
      return {
        type: 'SYSTEM',
        title: 'System Notification',
        message: 'You have a new update in Texora Management System.',
        priority: 'LOW',
      };
  }
}
