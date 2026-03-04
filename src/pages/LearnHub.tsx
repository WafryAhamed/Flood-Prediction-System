import React from 'react';
import { BookOpen, Shield, Zap, Droplets, ArrowRight } from 'lucide-react';
import { UnifiedCard } from '../components/ui/UnifiedCard';

export function LearnHub() {
  const guides = [
    {
      title: 'Flood Basics',
      icon: Droplets,
      color: 'from-info/10 to-info/5',
      desc: 'Understand how floods happen and identify warning signs.',
      accent: 'text-info border-info'
    },
    {
      title: 'Home Safety',
      icon: Shield,
      color: 'from-safe/10 to-safe/5',
      desc: 'Fortify your home against rising water levels.',
      accent: 'text-safe border-safe'
    },
    {
      title: 'Electrical Safety',
      icon: Zap,
      color: 'from-caution/10 to-caution/5',
      desc: 'Prevent electrocution and fire hazards during rain.',
      accent: 'text-caution border-caution'
    },
    {
      title: 'School Prep',
      icon: BookOpen,
      color: 'from-warning/10 to-warning/5',
      desc: "What to pack in your child's emergency bag.",
      accent: 'text-warning border-warning'
    }
  ];

  return (
    <div className="min-h-screen px-4 sm:px-6 md:px-8 pb-xl bg-bg-primary">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-xl">
          <h1 className="text-3xl md:text-4xl font-bold uppercase leading-tight text-text-primary mb-md">
            Knowledge Base
          </h1>
          <p className="text-sm font-semibold text-text-secondary">
            Learn essential disaster preparation and response techniques.
          </p>
        </header>

        {/* Guide Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mb-xl">
          {guides.map((guide, i) => {
            const Icon = guide.icon;
            return (
              <UnifiedCard
                key={i}
                interactive
                className={`text-left bg-gradient-to-br ${guide.color}`}
              >
                <div className={`w-12 h-12 rounded-card mb-lg flex items-center justify-center ${guide.accent} bg-opacity-10`}>
                  <Icon size={28} className={guide.accent} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold uppercase mb-md text-text-primary">
                  {guide.title}
                </h3>
                <p className="font-semibold text-sm text-text-secondary mb-lg leading-snug">
                  {guide.desc}
                </p>
                <div className={`flex items-center gap-md text-xs font-bold uppercase ${guide.accent.split(' ')[0]}`}>
                  Learn More <ArrowRight size={14} strokeWidth={2} />
                </div>
              </UnifiedCard>
            );
          })}
        </div>

        {/* Featured Wisdom Card */}
        <UnifiedCard noPadding className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-xl">
          <div className="flex items-start gap-lg">
            <BookOpen size={32} strokeWidth={1.5} className="shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-bold uppercase mb-lg">Traditional Wisdom</h3>
              <p className="text-base font-semibold leading-relaxed mb-lg max-w-3xl">
                "When the frogs croak louder than usual in the evening, expect heavy rain by morning. Move your firewood to the loft. The kingfisher's call changes pitch when water levels rise."
              </p>
              <p className="font-mono text-xs uppercase opacity-75">
                — Local Knowledge from Kalutara District, Sri Lanka
              </p>
            </div>
          </div>
        </UnifiedCard>

        {/* Quick Tips Section */}
        <div className="mt-xl">
          <h2 className="text-xl font-bold uppercase mb-lg text-text-primary">Quick Safety Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            <UnifiedCard title="Before Monsoon Season">
              <ul className="space-y-md text-sm">
                <li className="flex items-start gap-md">
                  <span className="font-bold text-info">•</span>
                  <span className="text-text-secondary">Clean gutters and drainage systems</span>
                </li>
                <li className="flex items-start gap-md">
                  <span className="font-bold text-info">•</span>
                  <span className="text-text-secondary">Check roof integrity and seal leaks</span>
                </li>
                <li className="flex items-start gap-md">
                  <span className="font-bold text-info">•</span>
                  <span className="text-text-secondary">Stock emergency supplies (3-day minimum)</span>
                </li>
              </ul>
            </UnifiedCard>

            <UnifiedCard title="During Heavy Rain">
              <ul className="space-y-md text-sm">
                <li className="flex items-start gap-md">
                  <span className="font-bold text-warning">•</span>
                  <span className="text-text-secondary">Avoid flooded roads and low-lying areas</span>
                </li>
                <li className="flex items-start gap-md">
                  <span className="font-bold text-warning">•</span>
                  <span className="text-text-secondary">Move to higher ground if instructed</span>
                </li>
                <li className="flex items-start gap-md">
                  <span className="font-bold text-warning">•</span>
                  <span className="text-text-secondary">Keep phone charged and stay alert</span>
                </li>
              </ul>
            </UnifiedCard>

            <UnifiedCard title="After Flooding">
              <ul className="space-y-md text-sm">
                <li className="flex items-start gap-md">
                  <span className="font-bold text-safe">•</span>
                  <span className="text-text-secondary">Wait for all-clear before returning</span>
                </li>
                <li className="flex items-start gap-md">
                  <span className="font-bold text-safe">•</span>
                  <span className="text-text-secondary">Document damage for insurance claims</span>
                </li>
                <li className="flex items-start gap-md">
                  <span className="font-bold text-safe">•</span>
                  <span className="text-text-secondary">Disinfect affected areas and boil water</span>
                </li>
              </ul>
            </UnifiedCard>
          </div>
        </div>
      </div>
    </div>
  );
}