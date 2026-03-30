import React from 'react';
import { UserProfile } from '../types';
import { QrCode, Users, Edit, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface QuickShareProps {
    profile: UserProfile;
    onScanQR: () => void;
    onViewContacts: () => void;
    onEditProfile: () => void;
    onSignOut: () => void;
}

export function QuickShare({
    profile,
    onScanQR,
    onViewContacts,
    onEditProfile,
    onSignOut
}: QuickShareProps) {
    const { t } = useTranslation();

    return (
        <div className="p-6">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">{t('common.appName', 'ConnectMe')}</h1>
                <button onClick={onSignOut} className="p-2 text-gray-500 hover:text-gray-700">
                    <LogOut size={20} />
                </button>
            </header>

            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 text-center">
                {profile.profileImage ? (
                    <img src={profile.profileImage} alt="Profile" className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 text-blue-600 text-2xl font-bold">
                        {profile.firstName[0]}{profile.lastName[0]}
                    </div>
                )}
                <h2 className="text-xl font-bold text-gray-900">{profile.firstName} {profile.lastName}</h2>
                <p className="text-gray-600">{profile.title} at {profile.company}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button onClick={onScanQR} className="bg-blue-600 text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
                    <QrCode size={24} />
                    <span className="font-medium">{t('quickShare.scan', 'Scan QR')}</span>
                </button>
                <button onClick={onViewContacts} className="bg-white text-gray-900 p-4 rounded-xl shadow flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                    <Users size={24} />
                    <span className="font-medium">{t('quickShare.contacts', 'Contacts')}</span>
                </button>
                <button onClick={onEditProfile} className="bg-white text-gray-900 p-4 rounded-xl shadow flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                    <Edit size={24} />
                    <span className="font-medium">{t('quickShare.edit', 'Edit Profile')}</span>
                </button>
            </div>
        </div>
    );
}
