import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Share2, Download } from 'lucide-react';
import { UserProfile } from '../types';
import QRCode from 'qrcode';

interface QRDisplayPageProps {
  profile: UserProfile;
  onBack: () => void;
}

export function QRDisplayPage({ profile, onBack }: QRDisplayPageProps) {
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
        width: 400,
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

  const handleShare = async () => {
    if (navigator.share && qrCodeUrl) {
      try {
        const blob = await fetch(qrCodeUrl).then((r) => r.blob());
        const file = new File([blob], 'qr-code.png', { type: 'image/png' });
        await navigator.share({
          title: 'My ConnectMe QR Code',
          text: 'Scan to get my contact details',
          files: [file],
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleDownload = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `connectme-qr-${profile.firstName}-${profile.lastName}.png`;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-amber-50">
      {/* Header */}
      <header className="p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('qr.display.backButton')}
        </button>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 pb-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-blue-600 mb-2">{t('qr.display.title')}</h2>
            <p className="text-gray-600">{t('qr.display.description')}</p>
          </div>

          {/* QR Code Display */}
          <div className="flex justify-center mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-inner">
              {qrCodeUrl && (
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-80 h-80"
                />
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="text-center mb-8 p-6 bg-blue-50 rounded-xl">
            <h3 className="text-gray-900 mb-1">
              {profile.firstName} {profile.lastName}
            </h3>
            <p className="text-gray-600 mb-1">{profile.title}</p>
            <p className="text-gray-600">{profile.company}</p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleShare}
              className="py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              {t('qr.display.shareButton')}
            </button>
            <button
              onClick={handleDownload}
              className="py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {t('qr.display.downloadButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}