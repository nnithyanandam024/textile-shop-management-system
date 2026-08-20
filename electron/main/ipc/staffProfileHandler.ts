import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { StaffProfileService, UpdateAllowedProfileFields } from '../services/staffProfileService';
import log from '../logger';

export function registerStaffProfileHandlers(db: Database.Database): void {
  const profileService = new StaffProfileService(db);

  // 1. Get My Profile
  ipcMain.handle('staff-profile:get-my-profile', async () => {
    try {
      const data = profileService.getMyProfile();
      return { success: true, data };
    } catch (error: any) {
      log.error(`[IPC staff-profile:get-my-profile] Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // 2. Update My Profile
  ipcMain.handle('staff-profile:update-my-profile', async (_, fields: UpdateAllowedProfileFields) => {
    try {
      const result = profileService.updateMyProfile(fields);
      return result;
    } catch (error: any) {
      log.error(`[IPC staff-profile:update-my-profile] Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // 3. Get Emergency Contacts
  ipcMain.handle('staff-profile:get-emergency-contacts', async () => {
    try {
      const data = profileService.getEmergencyContacts();
      return { success: true, data };
    } catch (error: any) {
      log.error(`[IPC staff-profile:get-emergency-contacts] Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // 4. Save Emergency Contact
  ipcMain.handle('staff-profile:save-emergency-contact', async (_, input: any) => {
    try {
      const result = profileService.saveEmergencyContact(input);
      return result;
    } catch (error: any) {
      log.error(`[IPC staff-profile:save-emergency-contact] Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // 5. Delete Emergency Contact
  ipcMain.handle('staff-profile:delete-emergency-contact', async (_, id: number) => {
    try {
      const result = profileService.deleteEmergencyContact(id);
      return result;
    } catch (error: any) {
      log.error(`[IPC staff-profile:delete-emergency-contact] Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // 6. Upload Profile Photo
  ipcMain.handle('staff-profile:upload-photo', async (_, dataUrl: string) => {
    try {
      const result = profileService.uploadProfilePhoto(dataUrl);
      return result;
    } catch (error: any) {
      log.error(`[IPC staff-profile:upload-photo] Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // 7. Remove Profile Photo
  ipcMain.handle('staff-profile:remove-photo', async () => {
    try {
      const result = profileService.removeProfilePhoto();
      return result;
    } catch (error: any) {
      log.error(`[IPC staff-profile:remove-photo] Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // 8. Change Password
  ipcMain.handle('staff-profile:change-password', async (_, { currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
    try {
      const result = await profileService.changePassword(currentPassword, newPassword);
      return result;
    } catch (error: any) {
      log.error(`[IPC staff-profile:change-password] Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // 9. Get Profile Activity
  ipcMain.handle('staff-profile:get-activity', async () => {
    try {
      const data = profileService.getProfileActivity();
      return { success: true, data };
    } catch (error: any) {
      log.error(`[IPC staff-profile:get-activity] Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // 10. Request Profile Change
  ipcMain.handle('staff-profile:request-change', async (_, input: any) => {
    try {
      const result = profileService.requestProfileChange(input);
      return result;
    } catch (error: any) {
      log.error(`[IPC staff-profile:request-change] Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // 11. Get Profile Change Requests
  ipcMain.handle('staff-profile:get-change-requests', async () => {
    try {
      const data = profileService.getProfileChangeRequests();
      return { success: true, data };
    } catch (error: any) {
      log.error(`[IPC staff-profile:get-change-requests] Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  log.info('Staff Profile IPC handlers registered successfully.');
}
