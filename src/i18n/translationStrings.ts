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
    nav: { emergency: 'ඉතා අවදානම්', riskMap: 'අධි අවදානම් සිතුම', evacuation: 'ඉවත් ගිම්හවිටුම', community: 'ප්‍රජාව', learn: 'ශිෂ්‍ය ගන්න', recovery: 'ප්‍රතිසාධනය', agriculture: 'කෘෂිකර්ම', timeline: 'කාලරේඛාව', whatNext: 'දැන් අපි කුමක් කළ යුතුද?', admin: 'පරිපාලනය' },
    dashboard: { title: 'ඉතා අවදානම් ඩ්‍රයිවර්', riskLevel: 'අවදානම් මට්ටම', evacuationRoutes: 'ඉවත් ගිම්හවිටුම් මාර්ගයන්', nearbyFacilities: 'ආසන්න පහසුකම්', communityReports: 'ප්‍රජා වාර්තා', familyStatus: 'පවුල් තත්ත්වය', whatShouldIDo: 'දැන් අපි කුමක් කළ යුතුද?', myProfile: 'මගේ ආරක්ෂා පැතිකඩ' },
    risk: { critical: 'සතුටුයි', high: 'ඉතා', medium: 'මධ්‍යම', low: 'අඩු', safe: 'ආපදා අපිටයි' },
    alert: { title: 'අනතුරු ඇඟවීම', warning: 'අනතුරු ඇඟවීම', information: 'තොරතුරු', allClear: 'සියල්ල පැහැදිලි', acknowledge: 'පිළිගන්න', share: 'අනතුරු ඇඟවීම බෙදා ගන්න', dismiss: 'ඉවත් කරන්න' },
    action: { save: 'සුරකින්න', cancel: 'අවලංඝනය', next: 'ඊළඟ', previous: 'කලින්', complete: 'අවසන්', back: 'ඇයිතින්', submit: 'ඉදිරිපත් කරන්න', edit: 'සංස්කරණය', delete: 'මකා දමන්න', close: 'වසන්න', add: 'එකතු කරන්න', remove: 'ඉවත් කරන්න' },
    profile: { title: 'ආරක්ෂා පැතිකඩ', createNow: 'දැන් සාදන්න', homeType: 'නිවස වර්ගය', familySize: 'පවුල් ප්‍රමාණය', livelihood: 'ජීවනෝපාය', location: 'ස්‍ථානය', emergencyContacts: 'ඉතාවෙ සම්බන්ධතා', medicalNeeds: 'වෛද්‍ය අවශ්‍යතා', safePlace: 'ආපද අපිට ස්‍ථානය' },
    evacuation: { title: 'ඉවත් ගිම්හවිටුම් මාර්ගයන්', selectRoute: 'मार्ग තෝරන්න', estimatedTime: 'ඉតිරි කරන ලද කාලය', distance: 'දුර', safetyRating: 'ආරක්ෂා ශ්‍රේණිගත කරනවා', capacity: 'ඉඩ', available: 'ලබා ගත හැකි' },
    community: { reports: 'ප්‍රජා වාර්තා', postReport: 'වාර්තා පශ්චාත්‍ය කරන්න', flooding: 'නිකුත් කිරීම', roadClosed: 'පথ වසා ඇත', injuredPerson: 'තුවරා ගිය පුද්ගලයා', needHelp: 'උපකාරය අවශ්‍යතාවය' },
    learn: { title: 'ශිෂ්‍ය කේන්ද්‍රය', guardianContent: 'ගාර්ඩියන් ශිෂ්‍යත්වය', preparation: 'සූදානමි', response: 'ප්‍රතිඩිය', recovery: 'ප්‍රතිසාධනය' },
    message: { success: 'සාර්ථකයි!', error: 'දෝෂ', loading: 'පූරණය වෙමින් ඇත...', noData: 'තොරතුරු නොමැත', tryAgain: 'නැවත උත්සාහ කරන්න' },
  },
  ta: {
    nav: { emergency: 'அவசரம்', riskMap: 'ஆபத்து வரைபடம்', evacuation: 'வெளியேற்றம்', community: 'சமூகம்', learn: 'கற்றல்', recovery: 'மீட்டெடுப்பு', agriculture: 'விவசாயம்', timeline: 'காலவரிசை', whatNext: 'இப்போது நான் என்ன செய்ய வேண்டும்?', admin: 'நிர்வாகம்' },
    dashboard: { title: 'அவசர ড్ಸ್‍ྭಮೃೆಿೂಾಯೋಯಾ', riskLevel: 'ஆபத்து மட்டம்', evacuationRoutes: 'வெளியேற்ற வழிகள்', nearbyFacilities: 'அருகிலுள்ள வசதிகள்', communityReports: 'சமூக அறிக்கைகள்', familyStatus: 'குடும்ப நிலை', whatShouldIDo: 'நான் இப்போது என்ன செய்ய வேண்டும்?', myProfile: 'என் பாதுகாப்பு சுயவிவரம்' },
    risk: { critical: 'விமர்சனம்', high: 'உच்च', medium: 'நடுத்தர', low: 'குறைந்த', safe: 'பாதுகாப்பு' },
    alert: { title: 'எச்சரிக்கை', warning: 'எச்சரிக்கை', information: 'தகவல்', allClear: 'அனைத்தும் தெளிவு', acknowledge: 'அங்கீகாரம்', share: 'எச்சரிக்கை பகிர்', dismiss: 'நிராகரி' },
    action: { save: 'சேமிக்க', cancel: 'ரद்து', next: 'அடுத்து', previous: 'முந்தைய', complete: 'முடிக்க', back: 'பின்னுக்கு', submit: 'சமர்ப்பி', edit: 'திருத்தியமைத்தல்', delete: 'நீக்கு', close: 'மூடு', add: 'சேர்க்க', remove: 'அகற்று' },
    profile: { title: 'பாதுகாப்பு சுயவிவரம்', createNow: 'இப்போது உருவாக்கு', homeType: 'வீட்டு வகை', familySize: 'குடும்ப அளவு', livelihood: 'வாழ்வாதாரம்', location: 'இடம்', emergencyContacts: 'அவசர যোগাযோகங்கள்', medicalNeeds: 'மருத்துவ தேவைகள்', safePlace: 'பாதுகாப்பு கொலை இடம்' },
    evacuation: { title: 'வெளியேற்ற வழிகள்', selectRoute: 'வழி தேர்ந்தெடுக்கவும்', estimatedTime: 'மதிப்பிட்ட நேரம்', distance: 'தூரம்', safetyRating: 'பாதுகாப்பு மதிப்பீடு', capacity: 'திறன்', available: 'கிடைக்கும்' },
    community: { reports: 'சமூக அறிக்கைகள்', postReport: 'விளம்பரம் செய்ய', flooding: 'வெள்ளம்', roadClosed: 'வழி மூடப்பட்டுள்ளது', injuredPerson: 'கயமான நபர்', needHelp: 'உதவி தேவை' },
    learn: { title: 'கற்றல் மையம்', guardianContent: 'பெற்றோர் கற்றல்', preparation: 'தயாரிப்பு', response: 'பதிலளி', recovery: 'மீட்டெடுப்பு' },
    message: { success: 'வெற்றி!', error: 'பிழை', loading: 'ஏற்றுதல்...', noData: 'தரவு இல்லை', tryAgain: 'மீண்டும் முயல்க' },
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
