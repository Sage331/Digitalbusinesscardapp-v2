import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Search, MapPin, Calendar } from 'lucide-react';
import { Contact } from '../types';

interface ContactsListPageProps {
  contacts: Contact[];
  onContactSelect: (contact: Contact) => void;
  onBack: () => void;
}

export function ContactsListPage({
  contacts,
  onContactSelect,
  onBack,
}: ContactsListPageProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter((contact) => {
    const query = searchQuery.toLowerCase();
    return (
      contact.firstName.toLowerCase().includes(query) ||
      contact.lastName.toLowerCase().includes(query) ||
      contact.company?.toLowerCase().includes(query) ||
      contact.title?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
          {t('contacts.backButton')}
        </button>
        <h1 className="text-blue-600 mb-4">{t('contacts.title')}</h1>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('contacts.search')}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </header>

      {/* Contacts List */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {filteredContacts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-gray-900 mb-2">{t('contacts.empty')}</h3>
            <p className="text-gray-600">{t('contacts.emptyDescription')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContacts.map((contact) => (
              <ContactListItem
                key={contact.id}
                contact={contact}
                onClick={() => onContactSelect(contact)}
                formatDate={formatDate}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ContactListItemProps {
  contact: Contact;
  onClick: () => void;
  formatDate: (date: string) => string;
  t: any;
}

function ContactListItem({ contact, onClick, formatDate, t }: ContactListItemProps) {
  const initials = `${contact.firstName[0]}${contact.lastName[0]}`.toUpperCase();

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 text-left"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {contact.photo ? (
          <img
            src={contact.photo}
            alt={`${contact.firstName} ${contact.lastName}`}
            className="w-16 h-16 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl flex-shrink-0">
            {initials}
          </div>
        )}

        {/* Contact Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-gray-900 mb-1">
            {contact.firstName} {contact.lastName}
          </h3>
          <p className="text-gray-600 mb-2">
            {contact.title}
            {contact.company && ` • ${contact.company}`}
          </p>

          {/* Met Info */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {t('contacts.dateMet')} {formatDate(contact.dateMet)}
              </span>
            </div>
            {contact.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{contact.location.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}