import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Phone, Mail, Linkedin, MapPin, Calendar, Mic, Save } from 'lucide-react';
import { Contact } from '../types';

interface ContactDetailPageProps {
  contact: Contact;
  onBack: () => void;
  onUpdateNotes: (contactId: string, notes: string) => void;
}

export function ContactDetailPage({ contact, onBack, onUpdateNotes }: ContactDetailPageProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'history'>('info');
  const [notes, setNotes] = useState(contact.notes || '');
  const [isListening, setIsListening] = useState(false);

  const initials = `${contact.firstName[0]}${contact.lastName[0]}`.toUpperCase();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSaveNotes = () => {
    onUpdateNotes(contact.id, notes);
  };

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setNotes(notes + ' ' + transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-amber-50">
      {/* Header */}
      <header className="p-6 bg-white shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('contactDetail.buttons.backButton')}
        </button>

        {/* Profile Section */}
        <div className="flex items-center gap-4 mb-6">
          {contact.photo ? (
            <img
              src={contact.photo}
              alt={`${contact.firstName} ${contact.lastName}`}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl">
              {initials}
            </div>
          )}
          <div>
            <h2 className="text-gray-900 mb-1">
              {contact.firstName} {contact.lastName}
            </h2>
            <p className="text-gray-600 mb-1">{contact.title}</p>
            <p className="text-gray-600">{contact.company}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <a
            href={`tel:${contact.phone}`}
            className="py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4" />
            <span className="text-sm">{t('contactDetail.buttons.call')}</span>
          </a>
          <a
            href={`mailto:${contact.email}`}
            className="py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            <span className="text-sm">{t('contactDetail.buttons.email')}</span>
          </a>
          {contact.linkedinUrl && (
            <a
              href={contact.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Linkedin className="w-4 h-4" />
              <span className="text-sm">LinkedIn</span>
            </a>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 border-b-2 transition-colors ${
                activeTab === 'info'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('contactDetail.tabs.info')}
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-4 border-b-2 transition-colors ${
                activeTab === 'notes'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('contactDetail.tabs.notes')}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('contactDetail.tabs.history')}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {activeTab === 'info' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <InfoRow icon={<Phone className="w-5 h-5 text-blue-600" />} label={t('contactDetail.info.phone')} value={contact.phone} />
            <InfoRow icon={<Mail className="w-5 h-5 text-blue-600" />} label={t('contactDetail.info.email')} value={contact.email} />
            {contact.linkedinUrl && (
              <InfoRow
                icon={<Linkedin className="w-5 h-5 text-blue-600" />}
                label={t('contactDetail.info.linkedin')}
                value={
                  <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                    {contact.linkedinUrl}
                  </a>
                }
              />
            )}
            <InfoRow icon={<div className="w-5 h-5 text-blue-600">🏢</div>} label={t('contactDetail.info.company')} value={contact.company} />
            <InfoRow icon={<div className="w-5 h-5 text-blue-600">💼</div>} label={t('contactDetail.info.title')} value={contact.title} />
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-gray-900 mb-4">{t('contactDetail.notes.title')}</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('contactDetail.notes.placeholder')}
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleVoiceInput}
                className={`px-6 py-3 border-2 rounded-lg transition-colors flex items-center gap-2 ${
                  isListening
                    ? 'border-red-600 bg-red-50 text-red-600'
                    : 'border-blue-600 text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Mic className="w-5 h-5" />
                {isListening ? t('contactDetail.notes.listening') : t('contactDetail.notes.voiceButton')}
              </button>
              <button
                onClick={handleSaveNotes}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {t('contactDetail.notes.saveButton')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-gray-900 mb-4">{t('contactDetail.history.title')}</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
                <Calendar className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <div className="text-gray-700 mb-1">{t('contactDetail.history.firstMet')}</div>
                  <div className="text-gray-900">{formatDate(contact.dateMet)}</div>
                  {contact.location && (
                    <div className="flex items-center gap-1 text-gray-600 mt-2">
                      <MapPin className="w-4 h-4" />
                      <span>{contact.location.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-gray-200 last:border-0">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1">
        <div className="text-gray-600 text-sm mb-1">{label}</div>
        <div className="text-gray-900">{value}</div>
      </div>
    </div>
  );
}