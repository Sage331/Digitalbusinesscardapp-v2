export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  profileImage: string | null;
  photo?: string; // photo property is used in components
  language?: string; // User's preferred language (e.g., 'en', 'es', 'fr')
}

export interface Contact {
  id: string;
  profile: UserProfile;
  notes: string;
  placeMet: string;
  placeMetAuto: string; // Automatically captured location
  dateMet: string;
  location?: { address: string }; // Used in ContactDetailPage
  tags: string[];
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'zh', name: '中文', flag: '🇨🇳', nativeName: '中文' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', nativeName: 'हिन्दी' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', nativeName: '日本語' },
];