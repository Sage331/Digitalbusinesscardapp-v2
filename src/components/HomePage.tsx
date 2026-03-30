import React from 'react';
import { useTranslation } from 'react-i18next';
import { QrCode, Scan, User, Users, Edit } from 'lucide-react';
import { UserProfile, Contact } from '../types';
import QRCode from 'qrcode';

interface HomePageProps {
  profile: UserProfile;
  contacts: Contact[];
  onNavigate: (page: string) => void;
}

export function HomePage({ profile, contacts, onNavigate }: HomePageProps) {
  const { t } = useTranslation();
  const [qrCodeUrl, setQrCodeUrl] = React.useState('');

  React.useEffect(() => {
    const generateQR = async () => {
      const qrData = JSON.stringify({
        type: 'ConnectMe',
        firstName: profile.firstName,
        lastName: profile.lastName,
        title: profile.title,
        company: profile.company,
        email: profile.email,
        phone: profile.phone,
        linkedinUrl: profile.linkedinUrl,
        photo: profile.photo,
      });
      const url = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#2563eb',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(url);
    };
    generateQR();
  }, [profile]);

  const thisWeekContacts = contacts.filter((contact) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return new Date(contact.dateMet) > oneWeekAgo;
  }).length;

  const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-amber-50">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <h1 className="text-blue-600">{t('home.title')}</h1>
        <button
          onClick={() => onNavigate('profile')}
          className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          {profile.photo ? (
            <img
              src={profile.photo}
              alt={`${profile.firstName} ${profile.lastName}`}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <span className="text-sm">{initials}</span>
          )}
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-6 pb-12">
        {/* Greeting */}
        <div className="mb-8">
          <h2 className="text-gray-900">
            {t('home.greeting')}, {profile.firstName}!
          </h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl text-blue-600 mb-1">{contacts.length}</div>
            <div className="text-gray-600">{t('home.stats.contacts')}</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl text-blue-600 mb-1">{thisWeekContacts}</div>
            <div className="text-gray-600">{t('home.stats.thisWeek')}</div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h3 className="text-blue-600 mb-2">{t('home.qrTitle')}</h3>
          <p className="text-gray-600 mb-6">{t('home.qrDescription')}</p>
          <div className="flex justify-center mb-6">
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
            )}
          </div>
          <button
            onClick={() => onNavigate('qr-display')}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            {t('home.buttons.shareQR')}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate('qr-scanner')}
            className="py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
          >
            <Scan className="w-5 h-5" />
            {t('home.buttons.scanQR')}
          </button>
          <button
            onClick={() => onNavigate('contacts')}
            className="py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
          >
            <Users className="w-5 h-5" />
            {t('home.buttons.viewProfile')}
          </button>
          <button
            onClick={() => onNavigate('profile')}
            className="py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 md:col-span-2"
          >
            <Edit className="w-5 h-5" />
            {t('home.buttons.editProfile')}
          </button>
        </div>
      </div>
    </div>
  );
}
