import React from 'react';
import { useTranslation } from 'react-i18next';
import { QrCode, Users, Lock, Linkedin } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-amber-50">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <h1 className="text-blue-600">{t('landing.title')}</h1>
        <button
          onClick={onSignIn}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('landing.signIn')}
        </button>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-blue-600 mb-4">{t('landing.subtitle')}</h2>
          <p className="text-gray-700 max-w-2xl mx-auto mb-8">
            {t('landing.description')}
          </p>
          <button
            onClick={onGetStarted}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg"
          >
            {t('landing.cta')}
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<QrCode className="w-8 h-8 text-blue-600" />}
            title={t('landing.features.qr.title')}
            description={t('landing.features.qr.description')}
          />
          <FeatureCard
            icon={<Users className="w-8 h-8 text-blue-600" />}
            title={t('landing.features.remember.title')}
            description={t('landing.features.remember.description')}
          />
          <FeatureCard
            icon={<Lock className="w-8 h-8 text-blue-600" />}
            title={t('landing.features.privacy.title')}
            description={t('landing.features.privacy.description')}
          />
          <FeatureCard
            icon={<Linkedin className="w-8 h-8 text-blue-600" />}
            title={t('landing.features.linkedin.title')}
            description={t('landing.features.linkedin.description')}
          />
        </div>
      </main>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}