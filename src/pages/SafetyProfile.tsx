import React from 'react';
import { SafetyProfileWizard } from '../components/SafetyProfileWizard';
import { UnifiedCard } from '../components/ui/UnifiedCard';

export function SafetyProfile() {
  return (
    <div className="min-h-screen px-lg px-lg md:px-xl pb-xl bg-bg-primary">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-xl">
          <h1 className="text-3xl md:text-4xl font-bold uppercase leading-tight text-text-primary mb-md">
            My Safety Profile
          </h1>
          <p className="text-sm font-semibold text-text-secondary max-w-2xl leading-relaxed">
            Customize your alerts and recommendations. This data is stored locally on your device and helps us provide personalized emergency support.
          </p>
        </header>

        {/* Wizard Component */}
        <div className="mb-xl">
          <SafetyProfileWizard />
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {/* Benefits Card */}
          <UnifiedCard title="Why create a profile?" accentColor="safe">
            <ul className="space-y-md">
              {[
                'Get personalized evacuation routes',
                'Receive specific tips for your home type',
                'Protect your livelihood (crops/business)',
                'Faster emergency response'
              ].map((benefit, i) => (
                <li key={i} className="flex items-start gap-md">
                  <span className="text-safe font-bold text-lg leading-none mt-0.5">✓</span>
                  <span className="font-semibold text-sm text-text-primary">{benefit}</span>
                </li>
              ))}
            </ul>
          </UnifiedCard>

          {/* Privacy Card */}
          <UnifiedCard title="Privacy & Security" accentColor="info">
            <p className="font-semibold text-sm text-text-primary leading-relaxed mb-lg">
              Your data never leaves your phone until you choose to share it during an emergency. We prioritize your privacy and security above all else.
            </p>
            <div className="bg-info/5 p-md rounded-card border border-info/30">
              <p className="text-xs font-bold text-info uppercase mb-xs">Encryption Status</p>
              <p className="text-xs text-text-secondary">End-to-end encrypted • Local storage only</p>
            </div>
          </UnifiedCard>
        </div>

        {/* Additional Information */}
        <UnifiedCard title="Important Notes" className="mt-xl">
          <ul className="space-y-md text-sm">
            <li className="flex items-start gap-md">
              <span className="font-bold text-info">•</span>
              <span className="text-text-secondary">Update your profile regularly, especially when your household composition or living situation changes</span>
            </li>
            <li className="flex items-start gap-md">
              <span className="font-bold text-info">•</span>
              <span className="text-text-secondary">During emergencies, your profile helps responders provide targeted assistance and personalized guidance</span>
            </li>
            <li className="flex items-start gap-md">
              <span className="font-bold text-info">•</span>
              <span className="text-text-secondary">You can change your preferences at any time without losing your saved data</span>
            </li>
          </ul>
        </UnifiedCard>
      </div>
    </div>
  );
}