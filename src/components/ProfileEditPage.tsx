import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Upload, X, Camera } from 'lucide-react';
import { UserProfile, SUPPORTED_LANGUAGES } from '../types';

interface ProfileEditPageProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onBack: () => void;
}

export function ProfileEditPage({ profile, onSave, onBack }: ProfileEditPageProps) {
  const { t, i18n } = useTranslation();
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [photoPreview, setPhotoPreview] = useState<string | null>(profile.photo || null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        setEditedProfile({ ...editedProfile, photo: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setEditedProfile({ ...editedProfile, photo: undefined });
  };

  const handleLanguageChange = (lang: string) => {
    setEditedProfile({ ...editedProfile, language: lang as any });
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const handleSave = () => {
    onSave(editedProfile);
  };

  const initials = `${editedProfile.firstName[0]}${editedProfile.lastName[0]}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-amber-50">
      {/* Header */}
      <header className="p-6 bg-white shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('profile.edit.buttons.cancel')}
        </button>
        <h1 className="text-blue-600">{t('profile.edit.title')}</h1>
      </header>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          {/* Photo Section */}
          <div>
            <h3 className="text-gray-900 mb-4">{t('profile.edit.photo.title')}</h3>
            <p className="text-gray-600 text-sm mb-4">{t('profile.edit.photo.description')}</p>
            
            <div className="flex items-center gap-6">
              {/* Avatar Preview */}
              <div className="relative">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl">
                    {initials}
                  </div>
                )}
                {photoPreview && (
                  <button
                    onClick={handleRemovePhoto}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Upload Button */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Upload className="w-5 h-5" />
                  {photoPreview ? t('profile.edit.photo.change') : t('profile.edit.photo.upload')}
                </label>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2">{t('profile.edit.fields.firstName')}</label>
              <input
                type="text"
                value={editedProfile.firstName}
                onChange={(e) => setEditedProfile({ ...editedProfile, firstName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">{t('profile.edit.fields.lastName')}</label>
              <input
                type="text"
                value={editedProfile.lastName}
                onChange={(e) => setEditedProfile({ ...editedProfile, lastName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Professional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2">{t('profile.edit.fields.title')}</label>
              <input
                type="text"
                value={editedProfile.title}
                onChange={(e) => setEditedProfile({ ...editedProfile, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">{t('profile.edit.fields.company')}</label>
              <input
                type="text"
                value={editedProfile.company}
                onChange={(e) => setEditedProfile({ ...editedProfile, company: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <label className="block text-gray-700 mb-2">{t('profile.edit.fields.email')}</label>
            <input
              type="email"
              value={editedProfile.email}
              onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">{t('profile.edit.fields.phone')}</label>
            <input
              type="tel"
              value={editedProfile.phone}
              onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">{t('profile.edit.fields.linkedinUrl')}</label>
            <input
              type="url"
              value={editedProfile.linkedinUrl || ''}
              onChange={(e) => setEditedProfile({ ...editedProfile, linkedinUrl: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Language Selection */}
          <div>
            <h3 className="text-gray-900 mb-4">{t('profile.edit.language.title')}</h3>
            <label className="block text-gray-700 mb-2">{t('profile.edit.language.label')}</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`p-3 border-2 rounded-lg text-left transition-colors ${
                    editedProfile.language === lang.code
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <div className="text-xl mb-1">{lang.flag}</div>
                  <div className="text-sm text-gray-900">{lang.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              onClick={onBack}
              className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('profile.edit.buttons.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('profile.edit.buttons.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}