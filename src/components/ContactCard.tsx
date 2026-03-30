import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check, MapPin, Calendar, Linkedin } from 'lucide-react';
import { Contact } from '../types';

interface ContactCardProps {
  contact: Partial<Contact>;
  onSave: (contact: Partial<Contact>) => void;
  onCancel: () => void;
}

export function ContactCard({ contact, onSave, onCancel }: ContactCardProps) {
  const { t } = useTranslation();

  const initials = `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toUpperCase();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-blue-50 via-blue-100 to-amber-50 p-6 border-b border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-blue-600">{t('contactCard.title')}</h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Profile Section */}
        <div className="p-6">
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
            <div className="flex-1">
              <h3 className="text-gray-900 mb-1">
                {contact.firstName} {contact.lastName}
              </h3>
              <p className="text-gray-600 mb-1">{contact.title}</p>
              <p className="text-gray-600">{contact.company}</p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <div className="text-gray-700 mb-1">{t('contactCard.saveDetails.dateMet')}</div>
                <div className="text-gray-900">{contact.dateMet && formatDate(contact.dateMet)}</div>
              </div>
            </div>

            {contact.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="text-gray-700 mb-1">Location:</div>
                  <div className="text-gray-900">{contact.location.address}</div>
                </div>
              </div>
            )}

            {contact.email && (
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-blue-600 mt-0.5">📧</div>
                <div>
                  <div className="text-gray-700 mb-1">Email:</div>
                  <div className="text-gray-900">{contact.email}</div>
                </div>
              </div>
            )}

            {contact.phone && (
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-blue-600 mt-0.5">📱</div>
                <div>
                  <div className="text-gray-700 mb-1">Phone:</div>
                  <div className="text-gray-900">{contact.phone}</div>
                </div>
              </div>
            )}

            {contact.linkedinUrl && (
              <div className="flex items-start gap-3">
                <Linkedin className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="text-gray-700 mb-1">LinkedIn:</div>
                  <a
                    href={contact.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    View Profile
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-gray-700 mb-3">{t('contactCard.saveInfo')}</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>{t('contactCard.saveDetails.dateMet')} {contact.dateMet && formatDate(contact.dateMet)}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>{t('contactCard.saveDetails.linkedin')}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>{t('contactCard.saveDetails.notes')}</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('contactCard.cancelButton')}
            </button>
            <button
              onClick={() => onSave(contact)}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              {t('contactCard.saveButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
