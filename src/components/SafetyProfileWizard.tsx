import React, { useState, Children } from 'react';
import { motion } from 'framer-motion';
import { Home, Users, Briefcase, Check, ChevronRight, MapPin } from 'lucide-react';
export function SafetyProfileWizard() {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    homeType: '',
    members: {
      adults: 0,
      children: 0,
      elderly: 0,
      disabled: 0
    },
    livelihood: '',
    location: ''
  });
  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);
  return <div className="w-full max-w-2xl mx-auto border-4 border-black bg-white p-0">
      <div className="bg-black text-white p-4 flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase">Safety Profile</h2>
        <span className="font-mono font-bold">STEP {step}/4</span>
      </div>

      <div className="p-6">
        {step === 1 && <motion.div initial={{
        opacity: 0,
        x: 20
      }} animate={{
        opacity: 1,
        x: 0
      }}>
            <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-3">
              <Home size={28} strokeWidth={3} />
              What type of home do you live in?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Single Story', 'Two Story', 'Apartment', 'Temporary Shelter'].map(type => <button key={type} onClick={() => {
            setProfile({
              ...profile,
              homeType: type
            });
            nextStep();
          }} className={`
                    p-6 border-4 border-black text-left hover:bg-[#FFCC00] transition-colors
                    ${profile.homeType === type ? 'bg-[#FFCC00]' : 'bg-white'}
                  `}>
                  <span className="font-bold uppercase text-lg">{type}</span>
                </button>)}
            </div>
          </motion.div>}

        {step === 2 && <motion.div initial={{
        opacity: 0,
        x: 20
      }} animate={{
        opacity: 1,
        x: 0
      }}>
            <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-3">
              <Users size={28} strokeWidth={3} />
              Who lives with you?
            </h3>
            <div className="space-y-4">
              {['Adults', 'Children', 'Elderly', 'Disabled'].map(key => <div key={key} className="flex items-center justify-between border-b-2 border-gray-200 pb-2">
                  <span className="font-bold uppercase">{key}</span>
                  <div className="flex items-center gap-4">
                    <button className="w-10 h-10 border-2 border-black flex items-center justify-center font-black hover:bg-gray-100" onClick={() => setProfile({
                ...profile,
                members: {
                  ...profile.members,
                  [key.toLowerCase()]: Math.max(0, (profile.members as any)[key.toLowerCase()] - 1)
                }
              })}>
                      -
                    </button>
                    <span className="font-mono text-xl font-bold w-8 text-center">
                      {(profile.members as any)[key.toLowerCase()]}
                    </span>
                    <button className="w-10 h-10 border-2 border-black bg-black text-white flex items-center justify-center font-black hover:bg-gray-800" onClick={() => setProfile({
                ...profile,
                members: {
                  ...profile.members,
                  [key.toLowerCase()]: (profile.members as any)[key.toLowerCase()] + 1
                }
              })}>
                      +
                    </button>
                  </div>
                </div>)}
            </div>
            <button onClick={nextStep} className="w-full mt-8 bg-black text-white p-4 font-black uppercase flex items-center justify-center gap-2 hover:bg-gray-800">
              Next Step <ChevronRight />
            </button>
          </motion.div>}

        {step === 3 && <motion.div initial={{
        opacity: 0,
        x: 20
      }} animate={{
        opacity: 1,
        x: 0
      }}>
            <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-3">
              <Briefcase size={28} strokeWidth={3} />
              Primary Livelihood?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Farmer', 'Fisherman', 'Business Owner', 'Office Worker', 'Student', 'Laborer'].map(job => <button key={job} onClick={() => {
            setProfile({
              ...profile,
              livelihood: job
            });
            nextStep();
          }} className={`
                    p-6 border-4 border-black text-left hover:bg-[#00CC00] hover:text-white transition-colors
                    ${profile.livelihood === job ? 'bg-[#00CC00] text-white' : 'bg-white'}
                  `}>
                  <span className="font-bold uppercase text-lg">{job}</span>
                </button>)}
            </div>
          </motion.div>}

        {step === 4 && <motion.div initial={{
        opacity: 0,
        x: 20
      }} animate={{
        opacity: 1,
        x: 0
      }}>
            <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-3">
              <Check size={28} strokeWidth={3} />
              Profile Complete
            </h3>
            <div className="bg-gray-100 p-6 border-4 border-black mb-6">
              <div className="space-y-2">
                <p className="font-bold">
                  <span className="text-gray-500 uppercase text-xs block">
                    Home
                  </span>{' '}
                  {profile.homeType}
                </p>
                <p className="font-bold">
                  <span className="text-gray-500 uppercase text-xs block">
                    Family
                  </span>{' '}
                  {Object.values(profile.members).reduce((a, b) => a + b, 0)}{' '}
                  Members
                </p>
                <p className="font-bold">
                  <span className="text-gray-500 uppercase text-xs block">
                    Livelihood
                  </span>{' '}
                  {profile.livelihood}
                </p>
              </div>
            </div>
            <button onClick={() => alert('Profile Saved!')} className="w-full bg-[#00CC00] text-white border-4 border-black p-4 font-black uppercase text-xl hover:bg-[#00AA00] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all">
              Save Profile
            </button>
          </motion.div>}
      </div>
    </div>;
}