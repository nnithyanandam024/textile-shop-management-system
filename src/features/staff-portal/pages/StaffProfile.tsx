import React, { useState } from 'react';
import { StaffSidebar } from '../components/StaffSidebar';
import { StaffHeader } from '../components/StaffHeader';
import { useStaffProfile } from '../hooks/useStaffProfile';
import { ProfileSkeleton } from '../components/profile/ProfileSkeleton';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { PersonalInformation } from '../components/profile/PersonalInformation';
import { ContactInformation } from '../components/profile/ContactInformation';
import { EmploymentInformation } from '../components/profile/EmploymentInformation';
import { EmergencyContact } from '../components/profile/EmergencyContact';
import { ProfileActivity } from '../components/profile/ProfileActivity';
import { ProfilePhotoModal } from '../components/profile/ProfilePhotoModal';
import { ChangePasswordModal } from '../components/profile/ChangePasswordModal';
import { ProfileChangeRequestModal } from '../components/profile/ProfileChangeRequestModal';
import { AlertCircle, CheckCircle2, RotateCw } from 'lucide-react';

export const StaffProfile: React.FC = () => {
  const {
    profile,
    emergencyContacts,
    activities,
    changeRequests,
    loading,
    saving,
    error,
    successMessage,
    updateProfile,
    saveEmergencyContact,
    deleteEmergencyContact,
    uploadPhoto,
    removePhoto,
    changePassword,
    requestChange,
    refresh,
    clearError,
    clearSuccess,
  } = useStaffProfile();

  // Modals state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangeRequestModalOpen, setIsChangeRequestModalOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans text-slate-900">
      {/* Sidebar */}
      <StaffSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <StaffHeader />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Top Notifications */}
            {successMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-bold animate-in fade-in duration-200 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={clearSuccess}
                  className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-800 text-xs font-bold animate-in fade-in duration-200 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={refresh}
                    className="px-2.5 py-1 bg-red-100 hover:bg-red-200 rounded-lg text-[11px] font-bold text-red-900 transition-colors flex items-center gap-1"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                  <button
                    type="button"
                    onClick={clearError}
                    className="text-red-700 hover:text-red-900"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {loading || !profile ? (
              <ProfileSkeleton />
            ) : (
              <>
                {/* 1. Profile Header Banner */}
                <ProfileHeader
                  profile={profile}
                  onChangePhotoClick={() => setIsPhotoModalOpen(true)}
                  onChangePasswordClick={() => setIsPasswordModalOpen(true)}
                  onRequestChangeClick={() => setIsChangeRequestModalOpen(true)}
                />

                {/* 2. Personal & Contact Information (Two Columns) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PersonalInformation
                    profile={profile}
                    onSave={async (fields) => updateProfile(fields)}
                    isSaving={saving}
                  />

                  <ContactInformation
                    profile={profile}
                    onSave={async (fields) => updateProfile(fields)}
                    isSaving={saving}
                  />
                </div>

                {/* 3. Employment Information (Read-only) */}
                <EmploymentInformation
                  profile={profile}
                  onRequestChangeClick={() => setIsChangeRequestModalOpen(true)}
                />

                {/* 4. Emergency Contacts & Activity Trail (Two Columns) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <EmergencyContact
                    contacts={emergencyContacts}
                    onSaveContact={saveEmergencyContact}
                    onDeleteContact={deleteEmergencyContact}
                    isSaving={saving}
                  />

                  <ProfileActivity activities={activities} />
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {profile && (
        <>
          <ProfilePhotoModal
            currentPhotoPath={profile.photoPath}
            isOpen={isPhotoModalOpen}
            onClose={() => setIsPhotoModalOpen(false)}
            onSavePhoto={uploadPhoto}
            onRemovePhoto={removePhoto}
            isSaving={saving}
          />

          <ChangePasswordModal
            isOpen={isPasswordModalOpen}
            onClose={() => setIsPasswordModalOpen(false)}
            onSubmit={changePassword}
            isSubmitting={saving}
          />

          <ProfileChangeRequestModal
            isOpen={isChangeRequestModalOpen}
            onClose={() => setIsChangeRequestModalOpen(false)}
            onSubmitRequest={requestChange}
            pastRequests={changeRequests}
            isSubmitting={saving}
          />
        </>
      )}
    </div>
  );
};
