import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Users, MapPin, Briefcase, Phone, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { useMode } from '../contexts/ModeContext';

interface ProfileData {
  homeType: 'house' | 'apartment' | 'rural' | 'houseboat' | '';
  familySize: number;
  members: Array<{
    name: string;
    age: number;
    role: 'primary' | 'dependent' | 'elder' | 'child';
    medicalNeeds: string;
  }>;
  livelihoods: string[];
  location: {
    area: string;
    district: string;
  };
  emergencyContacts: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
  safePlace: string;
}

export function SafetyProfileWizard() {
  const [step, setStep] = useState(1);
  const [showSummary, setShowSummary] = useState(false);
  
  const [profile, setProfile] = useState<ProfileData>({
    homeType: '',
    familySize: 1,
    members: [],
    livelihoods: [],
    location: { area: '', district: '' },
    emergencyContacts: [],
    safePlace: '',
  });

  const stepTitles = ['Home Type', 'Family Members', 'Livelihood', 'Location & Safety', 'Emergency Contacts'];
  const completionPercentage = useMemo(() => {
    const fields = [
      profile.homeType,
      profile.members.length > 0,
      profile.livelihoods.length > 0,
      profile.location.area && profile.location.district,
      profile.safePlace,
      profile.emergencyContacts.length > 0,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [profile]);

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
    else {
      setShowSummary(true);
    }
  };

  const prevStep = () => setStep(Math.max(1, step - 1));

  const homeTypeOptions = [
    { value: 'house', label: 'Single/Double Storey', icon: '🏠' },
    { value: 'apartment', label: 'Apartment', icon: '🏢' },
    { value: 'rural', label: 'Rural Structure', icon: '🏘' },
    { value: 'houseboat', label: 'Houseboat', icon: '⛵' },
  ];

  const livelihoodOptions = ['Agriculture', 'Fishing', 'Trade', 'Employment', 'Tourism', 'Other'];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-32px font-bold text-gray-900">
            Build Your Safety Profile
          </h2>
          <div className="text-right">
            <p className="text-12px text-gray-600 uppercase">Completion</p>
            <p className="text-24px font-bold text-blue-400">{completionPercentage}%</p>
          </div>
        </div>

        {/* Progress Bar Visual */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mt-8">
          {stepTitles.map((title, index) => (
            <motion.div
              key={index}
              className={`
                flex flex-col items-center cursor-pointer
                ${index + 1 === step ? 'opacity-100' : 'opacity-50'}
              `}
              onClick={() => index + 1 < step && setStep(index + 1)}
            >
              <motion.div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center font-bold mb-2
                  ${index + 1 < step
                    ? 'bg-green-600 text-white'
                    : index + 1 === step
                      ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                      : 'bg-gray-300 text-gray-700'
                  }
                `}
                animate={{
                  scale: index + 1 === step ? 1.15 : 1,
                }}
              >
                {index + 1 < step ? <Check size={20} /> : index + 1}
              </motion.div>
              <p className="text-11px text-center max-w-20">{title}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-32 shadow-sm"
        >
          {/* Step 1: Home Type */}
          {step === 1 && (
            <div>
              <h3 className="text-24px font-bold mb-16 flex items-center gap-2">
                <Home className="text-blue-500" size={28} />
                What type of home do you live in?
              </h3>
              <div className="grid grid-cols-2 gap-12">
                {homeTypeOptions.map(({ value, label, icon }) => (
                  <motion.button
                    key={value}
                    onClick={() => setProfile({ ...profile, homeType: value as any })}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      p-16 rounded-xl border-2 text-left transition-all
                      ${profile.homeType === value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                      }
                    `}
                  >
                    <p className="text-32px mb-4">{icon}</p>
                    <p className="font-bold text-14px text-gray-900">{label}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Family Members */}
          {step === 2 && (
            <div>
              <h3 className="text-24px font-bold mb-16 flex items-center gap-2">
                <Users className="text-orange-500" size={28} />
                Family Composition
              </h3>
              <div className="space-y-12">
                <div>
                  <label className="block text-12px font-bold text-gray-600 mb-4">Total Family Members</label>
                  <input
                    type="number"
                    min="1"
                    value={profile.familySize}
                    onChange={(e) => setProfile({ ...profile, familySize: parseInt(e.target.value) })}
                    className="w-full px-12 py-8 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Add member form */}
                {profile.members.length < profile.familySize && (
                  <motion.div className="bg-blue-50 p-12 rounded-lg">
                    <h4 className="font-bold mb-8">Add Member {profile.members.length + 1}</h4>
                    <input
                      type="text"
                      placeholder="Name"
                      className="w-full px-12 py-8 border-2 border-gray-300 rounded-lg mb-8"
                    />
                    <div className="grid grid-cols-2 gap-8">
                      <input type="number" placeholder="Age" className="px-12 py-8 border-2 border-gray-300 rounded-lg" />
                      <select className="px-12 py-8 border-2 border-gray-300 rounded-lg">
                        <option>Primary</option>
                        <option>Dependent</option>
                        <option>Elder</option>
                        <option>Child</option>
                      </select>
                    </div>
                  </motion.div>
                )}

                {profile.members.map((member, idx) => (
                  <div key={idx} className="bg-gray-50 p-12 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-bold">{member.name}, {member.age} years</p>
                      <p className="text-12px text-gray-600 capitalize">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Livelihood */}
          {step === 3 && (
            <div>
              <h3 className="text-24px font-bold mb-16 flex items-center gap-2">
                <Briefcase className="text-green-600" size={28} />
                What are your main livelihoods?
              </h3>
              <div className="grid grid-cols-2 gap-8">
                {livelihoodOptions.map((option) => (
                  <motion.button
                    key={option}
                    onClick={() => {
                      setProfile({
                        ...profile,
                        livelihoods: profile.livelihoods.includes(option)
                          ? profile.livelihoods.filter((l) => l !== option)
                          : [...profile.livelihoods, option],
                      });
                    }}
                    whileHover={{ scale: 1.05 }}
                    className={`
                      p-12 rounded-lg border-2 font-bold text-center transition-all
                      ${profile.livelihoods.includes(option)
                        ? 'border-green-600 bg-green-50 text-green-900'
                        : 'border-gray-300 bg-white text-gray-700'
                      }
                    `}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Location & Safe Place */}
          {step === 4 && (
            <div>
              <h3 className="text-24px font-bold mb-16 flex items-center gap-2">
                <MapPin className="text-red-600" size={28} />
                Location & Safety Place
              </h3>
              <div className="space-y-12">
                <input
                  type="text"
                  placeholder="Village / Area"
                  value={profile.location.area}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      location: { ...profile.location, area: e.target.value },
                    })
                  }
                  className="w-full px-12 py-8 border-2 border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="District"
                  value={profile.location.district}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      location: { ...profile.location, district: e.target.value },
                    })
                  }
                  className="w-full px-12 py-8 border-2 border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Safe Evacuation Place (e.g., High School Building)"
                  value={profile.safePlace}
                  onChange={(e) => setProfile({ ...profile, safePlace: e.target.value })}
                  className="w-full px-12 py-8 border-2 border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Step 5: Emergency Contacts */}
          {step === 5 && (
            <div>
              <h3 className="text-24px font-bold mb-16 flex items-center gap-2">
                <Phone className="text-purple-600" size={28} />
                Emergency Contacts
              </h3>
              <div className="space-y-12">
                {profile.emergencyContacts.map((contact, idx) => (
                  <div key={idx} className="bg-gray-50 p-12 rounded-lg">
                    <p className="font-bold">{contact.name}</p>
                    <p className="text-12px text-gray-600">{contact.phone} • {contact.relationship}</p>
                  </div>
                ))}
                
                {profile.emergencyContacts.length < 3 && (
                  <motion.div className="bg-purple-50 p-12 rounded-lg">
                    <input type="text" placeholder="Name" className="w-full px-12 py-8 border-2 border-gray-300 rounded-lg mb-8" />
                    <input type="tel" placeholder="Phone" className="w-full px-12 py-8 border-2 border-gray-300 rounded-lg mb-8" />
                    <input type="text" placeholder="Relationship" className="w-full px-12 py-8 border-2 border-gray-300 rounded-lg" />
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-24">
        <motion.button
          onClick={prevStep}
          disabled={step === 1}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            px-24 py-12 rounded-lg font-bold flex items-center gap-2 transition-all
            ${step === 1
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }
          `}
        >
          <ChevronLeft size={20} /> Previous
        </motion.button>

        <motion.button
          onClick={nextStep}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-24 py-12 rounded-lg font-bold flex items-center gap-2 text-white transition-all bg-blue-500 hover:bg-blue-600"
        >
          {step === 5 ? 'Complete' : 'Next'} <ChevronRight size={20} />
        </motion.button>
      </div>

      {/* Summary Modal */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-16"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-2xl w-full p-32 max-h-96 overflow-y-auto"
            >
              <h2 className="text-28px font-bold mb-16">Profile Summary</h2>
              
              <div className="grid grid-cols-2 gap-16 mb-20">
                <div>
                  <p className="text-12px text-gray-600 uppercase">Home Type</p>
                  <p className="font-bold text-16px capitalize">{profile.homeType}</p>
                </div>
                <div>
                  <p className="text-12px text-gray-600 uppercase">Family Size</p>
                  <p className="font-bold text-16px">{profile.familySize} members</p>
                </div>
                <div>
                  <p className="text-12px text-gray-600 uppercase">Livelihoods</p>
                  <p className="font-bold text-14px">{profile.livelihoods.join(', ')}</p>
                </div>
                <div>
                  <p className="text-12px text-gray-600 uppercase">Safe Place</p>
                  <p className="font-bold text-14px">{profile.safePlace}</p>
                </div>
              </div>

              <div className="flex gap-8">
                <button
                  onClick={() => setShowSummary(false)}
                  className="flex-1 px-16 py-12 border-2 border-gray-300 rounded-lg font-bold hover:bg-gray-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setShowSummary(false);
                    alert('Profile saved! Risk-aware recommendations will now be personalized.');
                  }}
                  className="flex-1 px-16 py-12 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
                >
                  Save Profile
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}