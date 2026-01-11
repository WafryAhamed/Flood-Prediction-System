import React from 'react';
import { BookOpen, Shield, Zap, Droplets } from 'lucide-react';
export function LearnHub() {
  const guides = [{
    title: 'Flood Basics',
    icon: Droplets,
    color: 'bg-blue-100',
    desc: 'Understand how floods happen and identify warning signs.'
  }, {
    title: 'Home Safety',
    icon: Shield,
    color: 'bg-green-100',
    desc: 'Fortify your home against rising water levels.'
  }, {
    title: 'Electrical Safety',
    icon: Zap,
    color: 'bg-yellow-100',
    desc: 'Prevent electrocution and fire hazards during rain.'
  }, {
    title: 'School Prep',
    icon: BookOpen,
    color: 'bg-orange-100',
    desc: "What to pack in your child's emergency bag."
  }];
  return <div className="min-h-screen pt-24 px-4 md:pl-72 pb-20">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl md:text-6xl font-black uppercase leading-none mb-4">
            Knowledge
            <br />
            Base
          </h1>
          <p className="text-xl font-bold text-gray-600">
            Prepare yourself before the disaster strikes.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guides.map((guide, i) => <button key={i} className={`
                text-left border-4 border-black p-8 hover:translate-y-[-4px] transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                ${guide.color}
              `}>
              <guide.icon size={48} className="mb-6 text-black" strokeWidth={2} />
              <h3 className="text-2xl font-black uppercase mb-2">
                {guide.title}
              </h3>
              <p className="font-bold text-gray-800">{guide.desc}</p>
            </button>)}
        </div>

        <div className="mt-12 bg-black text-white p-8 border-4 border-black">
          <h3 className="text-3xl font-black uppercase mb-4">Monsoon Wisdom</h3>
          <p className="text-xl font-bold leading-relaxed max-w-3xl">
            "When the frogs croak louder than usual in the evening, expect heavy
            rain by morning. Move your firewood to the loft."
          </p>
          <p className="mt-4 font-mono text-sm uppercase text-gray-400">
            — Local Knowledge from Kalutara District
          </p>
        </div>
      </div>
    </div>;
}