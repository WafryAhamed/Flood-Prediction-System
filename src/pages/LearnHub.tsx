import React from 'react';
import { BookOpen, Shield, Zap, Droplets, ArrowRight, type LucideIcon } from 'lucide-react';
import { UnifiedCard } from '../components/ui/UnifiedCard';
import { useAdminControlStore } from '../stores/adminControlStore';

const GUIDE_ICON_MAP: Record<string, LucideIcon> = { BookOpen, Shield, Zap, Droplets };
const TIP_BULLET: Record<string, string> = {
  'Before Monsoon Season': 'text-info',
  'During Heavy Rain': 'text-warning',
  'After Flooding': 'text-safe',
};

export function LearnHub() {
  const learnGuides = useAdminControlStore((s) => s.learnGuides);
  const featuredWisdom = useAdminControlStore((s) => s.featuredWisdom);
  const learnTips = useAdminControlStore((s) => s.learnTips);

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
          {learnGuides.filter(g => g.visible).map((guide) => {
            const Icon = GUIDE_ICON_MAP[guide.iconName] || BookOpen;
            const accent = `text-${guide.accentColor} border-${guide.accentColor}`;
            const color = `from-${guide.accentColor}/10 to-${guide.accentColor}/5`;
            return (
              <UnifiedCard
                key={guide.id}
                interactive
                className={`text-left bg-gradient-to-br ${color}`}
              >
                <div className={`w-12 h-12 rounded-card mb-lg flex items-center justify-center ${accent} bg-opacity-10`}>
                  <Icon size={28} className={accent} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold uppercase mb-md text-text-primary">
                  {guide.title}
                </h3>
                <p className="font-semibold text-sm text-text-secondary mb-lg leading-snug">
                  {guide.description}
                </p>
                <div className={`flex items-center gap-md text-xs font-bold uppercase text-${guide.accentColor}`}>
                  Learn More <ArrowRight size={14} strokeWidth={2} />
                </div>
              </UnifiedCard>
            );
          })}
        </div>

        {/* Featured Wisdom Card */}
        {featuredWisdom.visible && (
        <UnifiedCard noPadding className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-xl">
          <div className="flex items-start gap-lg">
            <BookOpen size={32} strokeWidth={1.5} className="shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-bold uppercase mb-lg">Traditional Wisdom</h3>
              <p className="text-base font-semibold leading-relaxed mb-lg max-w-3xl">
                {featuredWisdom.quote}
              </p>
              <p className="font-mono text-xs uppercase opacity-75">
                {featuredWisdom.source}
              </p>
            </div>
          </div>
        </UnifiedCard>
        )}

        {/* Quick Tips Section */}
        <div className="mt-xl">
          <h2 className="text-xl font-bold uppercase mb-lg text-text-primary">Quick Safety Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            {learnTips.map((section) => (
              <UnifiedCard key={section.id} title={section.title}>
                <ul className="space-y-md text-sm">
                  {section.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-md">
                      <span className={`font-bold ${TIP_BULLET[section.title] || 'text-info'}`}>•</span>
                      <span className="text-text-secondary">{tip}</span>
                    </li>
                  ))}
                </ul>
              </UnifiedCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}