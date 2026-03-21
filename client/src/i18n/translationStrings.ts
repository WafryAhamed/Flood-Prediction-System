// Translation records for EN/SI/TA
// Structure: English keys with translations in each language

export type TranslationValue = string | { [key: string]: TranslationValue };

export type Language = 'en' | 'si' | 'ta';

export const translations: Record<Language, Record<string, TranslationValue>> = {
  en: {
    nav: { emergency: 'Emergency', riskMap: 'Risk Map', evacuation: 'Evacuation', community: 'Community', learn: 'Learn', recovery: 'Recovery', agriculture: 'Agriculture', timeline: 'Timeline', whatNext: 'What Next?', admin: 'Admin' },
    dashboard: { title: 'Emergency Dashboard', riskLevel: 'Risk Level', evacuationRoutes: 'Evacuation Routes', nearbyFacilities: 'Nearby Facilities', communityReports: 'Community Reports', familyStatus: 'Family Status', whatShouldIDo: 'What Should I Do Now?', myProfile: 'My Safety Profile' },
    risk: { critical: 'CRITICAL', high: 'HIGH', medium: 'MEDIUM', low: 'LOW', safe: 'SAFE' },
    alert: { title: 'Alert', warning: 'Warning', information: 'Information', allClear: 'All Clear', acknowledge: 'Acknowledge', share: 'Share Alert', dismiss: 'Dismiss' },
    action: { save: 'Save', cancel: 'Cancel', next: 'Next', previous: 'Previous', complete: 'Complete', back: 'Back', submit: 'Submit', edit: 'Edit', delete: 'Delete', close: 'Close', add: 'Add', remove: 'Remove' },
    profile: { title: 'Safety Profile', createNow: 'Create Now', homeType: 'Home Type', familySize: 'Family Size', livelihood: 'Livelihood', location: 'Location', emergencyContacts: 'Emergency Contacts', medicalNeeds: 'Medical Needs', safePlace: 'Safe Evacuation Place' },
    evacuation: { title: 'Evacuation Routes', selectRoute: 'Select Route', estimatedTime: 'Estimated Time', distance: 'Distance', safetyRating: 'Safety Rating', capacity: 'Capacity', available: 'Available' },
    community: { reports: 'Community Reports', postReport: 'Post Report', flooding: 'Flooding', roadClosed: 'Road Closed', injuredPerson: 'Injured Person', needHelp: 'Need Help' },
    learn: { title: 'Learn Hub', guardianContent: 'Guardian Learning', preparation: 'Preparation', response: 'Response', recovery: 'Recovery' },
    message: { success: 'Success!', error: 'Error', loading: 'Loading...', noData: 'No data available', tryAgain: 'Try Again' },
  },
  si: {
    nav: { emergency: 'හදිසි', riskMap: 'අවදානම් සිතියම', evacuation: 'ඉවත් කිරීම', community: 'ප්‍රජාව', learn: 'ඉගෙනීම', recovery: 'ප්‍රතිසාධනය', agriculture: 'කෘෂිකර්මය', timeline: 'කාලරේඛාව', whatNext: 'ඊළඟට කුමක්ද?', admin: 'පරිපාලක' },
    dashboard: { title: 'හදිසි පුවරුව', riskLevel: 'අවදානම් මට්ටම', evacuationRoutes: 'ඉවත් කිරීමේ මාර්ග', nearbyFacilities: 'ආසන්න පහසුකම්', communityReports: 'ප්‍රජා වාර්තා', familyStatus: 'පවුල් තත්ත්වය', whatShouldIDo: 'දැන් මම කුමක් කළ යුතුද?', myProfile: 'මගේ ආරක්ෂක පැතිකඩ' },
    risk: { critical: 'අතිශය අවදානම්', high: 'ඉහළ', medium: 'මධ්‍යම', low: 'අඩු', safe: 'ආරක්ෂිත' },
    alert: { title: 'අවවාදය', warning: 'අවදානම් අවවාදය', information: 'තොරතුරු', allClear: 'සියල්ල සුරක්ෂිතයි', acknowledge: 'පිළිගන්න', share: 'අවවාදය බෙදාගන්න', dismiss: 'වසන්න' },
    action: { save: 'සුරකින්න', cancel: 'අවලංගු කරන්න', next: 'ඊළඟ', previous: 'පෙර', complete: 'සම්පූර්ණයි', back: 'ආපසු', submit: 'ඉදිරිපත් කරන්න', edit: 'සංස්කරණය', delete: 'මකන්න', close: 'වසන්න', add: 'එකතු කරන්න', remove: 'ඉවත් කරන්න' },
    profile: { title: 'ආරක්ෂක පැතිකඩ', createNow: 'දැන් සාදන්න', homeType: 'නිවසේ වර්ගය', familySize: 'පවුල් ප්‍රමාණය', livelihood: 'ජීවනෝපාය', location: 'ස්ථානය', emergencyContacts: 'හදිසි සම්බන්ධතා', medicalNeeds: 'වෛද්‍ය අවශ්‍යතා', safePlace: 'ආරක්ෂිත ඉවත් වීමේ ස්ථානය' },
    evacuation: { title: 'ඉවත් කිරීමේ මාර්ග', selectRoute: 'මාර්ගය තෝරන්න', estimatedTime: 'ඇස්තමේන්තු කාලය', distance: 'දුර', safetyRating: 'ආරක්ෂක ශ්‍රේණිය', capacity: 'ධාරිතාව', available: 'ලබා ගත හැක' },
    community: { reports: 'ප්‍රජා වාර්තා', postReport: 'වාර්තාවක් යවන්න', flooding: 'ගංවතුර', roadClosed: 'මාර්ගය වසා ඇත', injuredPerson: 'තුවාල ලැබූ පුද්ගලයෙක්', needHelp: 'උදව් අවශ්‍යයි' },
    learn: { title: 'ඉගෙනුම් මධ්‍යස්ථානය', guardianContent: 'ආරක්ෂක ඉගෙනුම් අන්තර්ගතය', preparation: 'සූදානම', response: 'ප්‍රතිචාර', recovery: 'ප්‍රතිසාධනය' },
    message: { success: 'සාර්ථකයි!', error: 'දෝෂ', loading: 'පූරණය වෙමින් ඇත...', noData: 'තොරතුරු නොමැත', tryAgain: 'නැවත උත්සාහ කරන්න' },
  },
  ta: {
    nav: { emergency: 'அவசரம்', riskMap: 'ஆபத்து வரைபடம்', evacuation: 'வெளியேற்றம்', community: 'சமூகம்', learn: 'கற்றல்', recovery: 'மீட்பு', agriculture: 'விவசாயம்', timeline: 'காலவரிசை', whatNext: 'அடுத்து என்ன?', admin: 'நிர்வாகம்' },
    dashboard: { title: 'அவசர டாஷ்போர்டு', riskLevel: 'ஆபத்து நிலை', evacuationRoutes: 'வெளியேற்ற பாதைகள்', nearbyFacilities: 'அருகிலுள்ள வசதிகள்', communityReports: 'சமூக அறிக்கைகள்', familyStatus: 'குடும்ப நிலை', whatShouldIDo: 'இப்போது நான் என்ன செய்ய வேண்டும்?', myProfile: 'என் பாதுகாப்பு சுயவிவரம்' },
    risk: { critical: 'மிகவும் ஆபத்து', high: 'உயர்', medium: 'நடுத்தரம்', low: 'குறைவு', safe: 'பாதுகாப்பானது' },
    alert: { title: 'எச்சரிக்கை', warning: 'எச்சரிக்கை', information: 'தகவல்', allClear: 'அனைத்தும் பாதுகாப்பானது', acknowledge: 'ஒப்புதல்', share: 'எச்சரிக்கையை பகிர்', dismiss: 'மூடு' },
    action: { save: 'சேமி', cancel: 'ரத்து செய்', next: 'அடுத்து', previous: 'முந்தையது', complete: 'முடி', back: 'பின்', submit: 'சமர்ப்பி', edit: 'திருத்து', delete: 'நீக்கு', close: 'மூடு', add: 'சேர்', remove: 'அகற்று' },
    profile: { title: 'பாதுகாப்பு சுயவிவரம்', createNow: 'இப்போது உருவாக்கு', homeType: 'வீட்டு வகை', familySize: 'குடும்ப அளவு', livelihood: 'வாழ்வாதாரம்', location: 'இருப்பிடம்', emergencyContacts: 'அவசர தொடர்புகள்', medicalNeeds: 'மருத்துவ தேவைகள்', safePlace: 'பாதுகாப்பான வெளியேற்ற இடம்' },
    evacuation: { title: 'வெளியேற்ற பாதைகள்', selectRoute: 'பாதையைத் தேர்ந்தெடு', estimatedTime: 'மதிப்பிடப்பட்ட நேரம்', distance: 'தூரம்', safetyRating: 'பாதுகாப்பு மதிப்பீடு', capacity: 'திறன்', available: 'கிடைக்கும்' },
    community: { reports: 'சமூக அறிக்கைகள்', postReport: 'அறிக்கை சமர்ப்பிக்க', flooding: 'வெள்ளப்பெருக்கு', roadClosed: 'சாலை மூடப்பட்டுள்ளது', injuredPerson: 'காயமடைந்த நபர்', needHelp: 'உதவி தேவை' },
    learn: { title: 'கற்றல் மையம்', guardianContent: 'பாதுகாப்பு கற்றல் உள்ளடக்கம்', preparation: 'தயார்ப்பு', response: 'பதில் செயல்', recovery: 'மீட்பு' },
    message: { success: 'வெற்றி!', error: 'பிழை', loading: 'ஏற்றப்படுகிறது...', noData: 'தரவு இல்லை', tryAgain: 'மீண்டும் முயற்சிக்கவும்' },
  },
};

// Get translated text
export function getTranslation(language: Language, key: string): string {
  const keys = key.split('.');
  let value: TranslationValue | undefined = translations[language];
  for (const k of keys) {
    if (typeof value === 'object' && value !== null && !(value instanceof String)) {
      value = (value as Record<string, TranslationValue>)[k];
    }
  }
  return typeof value === 'string' ? value : key;
}
