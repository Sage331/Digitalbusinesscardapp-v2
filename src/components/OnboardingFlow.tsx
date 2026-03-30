import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { UserProfile, SUPPORTED_LANGUAGES } from '../types';

export function OnboardingFlow({ onComplete, onSignOut }: { onComplete: (profile: UserProfile, password?: string) => void, onSignOut: () => void }) {
  const { t, i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    language: i18n.language as any,
  });

  const steps = [
    { key: 'language', title: t('onboarding.steps.language.title'), description: t('onboarding.steps.language.description') },
    { key: 'account', title: t('onboarding.steps.account.title'), description: t('onboarding.steps.account.description') },
    { key: 'personal', title: t('onboarding.steps.personal.title'), description: t('onboarding.steps.personal.description') },
    { key: 'professional', title: t('onboarding.steps.professional.title'), description: t('onboarding.steps.professional.description') },
    { key: 'contact', title: t('onboarding.steps.contact.title'), description: t('onboarding.steps.contact.description') },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(profile as UserProfile, password);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setProfile({ ...profile, language: lang as any });
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-amber-50">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <h1 className="text-blue-600">ConnectMe</h1>
        <button
          onClick={onSignOut}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          {t('onboarding.signOut')}
        </button>
      </header>

      {/* Progress Bar */}
      <div className="max-w-3xl mx-auto px-6 mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${index < currentStep
                    ? 'bg-blue-600 text-white'
                    : index === currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                    }`}
                >
                  {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                <span className="text-xs text-gray-600 mt-2 hidden md:block">
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <div className="max-w-2xl mx-auto px-6 pb-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-blue-600 mb-2">{steps[currentStep].title}</h2>
            <p className="text-gray-600">{steps[currentStep].description}</p>
          </div>

          {/* Step Content */}
          <div className="space-y-6">
            {currentStep === 0 && (
              <LanguageStep
                selectedLanguage={profile.language || 'en'}
                onLanguageChange={handleLanguageChange}
              />
            )}
            {currentStep === 1 && <AccountStep profile={profile} setProfile={setProfile} password={password} setPassword={setPassword} />}
            {currentStep === 2 && <PersonalStep profile={profile} setProfile={setProfile} />}
            {currentStep === 3 && <ProfessionalStep profile={profile} setProfile={setProfile} />}
            {currentStep === 4 && <ContactStep profile={profile} setProfile={setProfile} />}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                {t('onboarding.buttons.back')}
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {currentStep === steps.length - 1 ? t('onboarding.buttons.finish') : t('onboarding.buttons.next')}
              {currentStep < steps.length - 1 && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Language Step Component
function LanguageStep({
  selectedLanguage,
  onLanguageChange,
}: {
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div>
      <label className="block text-gray-700 mb-4">{t('onboarding.fields.selectLanguage')}</label>
      <div className="grid grid-cols-2 gap-4">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${selectedLanguage === lang.code
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-300 hover:border-blue-300'
              }`}
          >
            <div className="text-2xl mb-2">{lang.flag}</div>
            <div className="font-medium text-gray-900">{lang.name}</div>
            <div className="text-sm text-gray-600">{lang.nativeName}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// AccountStep Component
function AccountStep({
  profile,
  setProfile,
  password,
  setPassword,
}: {
  profile: Partial<UserProfile>;
  setProfile: (profile: Partial<UserProfile>) => void;
  password?: string;
  setPassword?: (password: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <label className="block text-gray-700 mb-2">{t('onboarding.fields.email')}</label>
        <input
          type="email"
          value={profile.email || ''}
          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          placeholder={t('onboarding.placeholders.email')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-2">{t('onboarding.fields.password')}</label>
        <input
          type="password"
          value={password || ''}
          onChange={(e) => setPassword?.(e.target.value)}
          placeholder={t('onboarding.placeholders.password')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </>
  );
}

// Personal Step Component
function PersonalStep({
  profile,
  setProfile,
}: {
  profile: Partial<UserProfile>;
  setProfile: (profile: Partial<UserProfile>) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <label className="block text-gray-700 mb-2">{t('onboarding.fields.firstName')}</label>
        <input
          type="text"
          value={profile.firstName || ''}
          onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
          placeholder={t('onboarding.placeholders.firstName')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-2">{t('onboarding.fields.lastName')}</label>
        <input
          type="text"
          value={profile.lastName || ''}
          onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
          placeholder={t('onboarding.placeholders.lastName')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </>
  );
}

// Professional Step Component
function ProfessionalStep({
  profile,
  setProfile,
}: {
  profile: Partial<UserProfile>;
  setProfile: (profile: Partial<UserProfile>) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <label className="block text-gray-700 mb-2">{t('onboarding.fields.title')}</label>
        <input
          type="text"
          value={profile.title || ''}
          onChange={(e) => setProfile({ ...profile, title: e.target.value })}
          placeholder={t('onboarding.placeholders.title')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-2">{t('onboarding.fields.company')}</label>
        <input
          type="text"
          value={profile.company || ''}
          onChange={(e) => setProfile({ ...profile, company: e.target.value })}
          placeholder={t('onboarding.placeholders.company')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </>
  );
}

// Contact Step Component
function ContactStep({
  profile,
  setProfile,
}: {
  profile: Partial<UserProfile>;
  setProfile: (profile: Partial<UserProfile>) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <label className="block text-gray-700 mb-2">{t('onboarding.fields.phone')}</label>
        <input
          type="tel"
          value={profile.phone || ''}
          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
          placeholder={t('onboarding.placeholders.phone')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-2">{t('onboarding.fields.linkedinUrl')}</label>
        <input
          type="url"
          value={profile.linkedinUrl || ''}
          onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
          placeholder={t('onboarding.placeholders.linkedinUrl')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </>
  );
}