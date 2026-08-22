import React, { useState, useRef } from 'react';
import { Camera, Trash2, X, UploadCloud, AlertCircle, Check } from 'lucide-react';

interface ProfilePhotoModalProps {
  currentPhotoPath: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSavePhoto: (dataUrl: string) => Promise<boolean>;
  onRemovePhoto: () => Promise<boolean>;
  isSaving: boolean;
}

export const ProfilePhotoModal: React.FC<ProfilePhotoModalProps> = ({
  currentPhotoPath,
  isOpen,
  onClose,
  onSavePhoto,
  onRemovePhoto,
  isSaving,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image format (JPEG, PNG, or WEBP).');
      return;
    }

    // Validate size (max 2 MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image file size exceeds 2 MB limit. Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!previewUrl) return;
    const ok = await onSavePhoto(previewUrl);
    if (ok) {
      setPreviewUrl(null);
      onClose();
    }
  };

  const handleRemove = async () => {
    const ok = await onRemovePhoto();
    if (ok) {
      setPreviewUrl(null);
      onClose();
    }
  };

  const activePhoto = previewUrl || currentPhotoPath;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 relative select-none">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#2012ad] flex items-center justify-center mx-auto mb-3">
            <Camera className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Profile Photo</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Upload, update, or remove your employee avatar
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Photo Preview Container */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-36 h-36 rounded-3xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center p-1 relative shadow-inner">
            {activePhoto ? (
              <img
                src={activePhoto}
                alt="Profile Preview"
                className="w-full h-full object-cover rounded-[20px]"
              />
            ) : (
              <div className="text-center p-4 text-slate-400">
                <UploadCloud className="w-8 h-8 mx-auto mb-1 opacity-60" />
                <span className="text-[11px] font-bold">No photo set</span>
              </div>
            )}
          </div>

          {previewUrl && (
            <span className="mt-2 text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Preview (Click Save to apply)
            </span>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
        />

        {/* Actions */}
        <div className="space-y-2">
          {previewUrl ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                disabled={isSaving}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancel Preview
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 px-4 bg-[#2012ad] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Photo</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
                className="flex-1 py-3 px-4 bg-[#2012ad] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload New Photo</span>
              </button>

              {currentPhotoPath && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isSaving}
                  className="py-3 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                  title="Remove Photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <p className="text-[10px] text-center font-semibold text-slate-400">
            Recommended: Square image • Max size 2 MB • JPEG, PNG, WEBP
          </p>
        </div>
      </div>
    </div>
  );
};
