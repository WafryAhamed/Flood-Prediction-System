import React from 'react';
import { SafetyProfileWizard } from '../components/SafetyProfileWizard';
export function SafetyProfile() {
  return <div className="min-h-screen pt-24 px-4 md:pl-72 pb-20">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl md:text-6xl font-black uppercase leading-none mb-4">
            My Safety
            <br />
            Profile
          </h1>
          <p className="text-xl font-bold text-gray-600 max-w-2xl">
            Customize your alerts and recommendations. This data is stored
            locally on your device.
          </p>
        </header>

        <SafetyProfileWizard />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-4 border-black p-6 bg-gray-50">
            <h3 className="font-black uppercase text-xl mb-2">
              Why create a profile?
            </h3>
            <ul className="list-disc list-inside space-y-2 font-medium">
              <li>Get personalized evacuation routes</li>
              <li>Receive specific tips for your home type</li>
              <li>Protect your livelihood (crops/business)</li>
              <li>Faster emergency response</li>
            </ul>
          </div>

          <div className="border-4 border-black p-6 bg-[#E0F7FA]">
            <h3 className="font-black uppercase text-xl mb-2">Privacy Note</h3>
            <p className="font-medium">
              Your data never leaves your phone until you choose to share it
              during an emergency. We value your privacy and safety above all.
            </p>
          </div>
        </div>
      </div>
    </div>;
}