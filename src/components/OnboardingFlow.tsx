import React, { useState, useCallback } from 'react';
import { Map, Shield, AlertTriangle, Phone, MapPin, Bell, ChevronRight, ChevronLeft } from 'lucide-react';
import { SystemLogo } from './SystemLogo';

const ONBOARDING_KEY = 'flood_onboarding_completed';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: Map,
    iconColor: 'text-info',
    iconBg: 'bg-blue-100',
    title: 'Welcome to Flood Resilience',
    text: 'Get real-time flood alerts, safe routes, and emergency support — all in one app.',
  },
  {
    icon: Shield,
    iconColor: 'text-safe',
    iconBg: 'bg-green-100',
    title: 'Find Safe Areas',
    text: 'Locate nearby shelters and safe zones during floods. Stay informed and stay safe.',
  },
  {
    icon: AlertTriangle,
    iconColor: 'text-warning',
    iconBg: 'bg-amber-100',
    title: 'Report Flooding',
    text: 'Help your community by reporting flooded roads and rising water levels in real time.',
  },
  {
    icon: Phone,
    iconColor: 'text-critical',
    iconBg: 'bg-red-100',
    title: 'Emergency Help',
    text: 'Call emergency services or chat with the flood AI assistant anytime you need help.',
  },
];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [permissionsStep, setPermissionsStep] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);

  const totalSlides = slides.length;

  const handleFinish = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete();
  }, [onComplete]);

  const handleNext = () => {
    if (step < totalSlides - 1) {
      setStep(step + 1);
    } else {
      setPermissionsStep(true);
    }
  };

  const handlePrev = () => {
    if (permissionsStep) {
      setPermissionsStep(false);
    } else if (step > 0) {
      setStep(step - 1);
    }
  };

  const requestLocation = async () => {
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => setLocationGranted(true),
          () => setLocationGranted(false)
        );
        setLocationGranted(true);
      }
    } catch {
      // Permission denied — proceed gracefully
    }
  };

  const requestNotifications = async () => {
    try {
      if ('Notification' in window) {
        const result = await Notification.requestPermission();
        setNotifGranted(result === 'granted');
      }
    } catch {
      // Not supported — proceed gracefully
    }
  };

  // Permissions screen
  if (permissionsStep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md mx-auto text-center">
          <SystemLogo size="md" className="justify-center mb-8" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Quick Setup
          </h2>
          <p className="text-sm text-text-secondary mb-8">
            Allow these permissions to get the best experience during emergencies.
          </p>

          <div className="space-y-4 mb-8">
            {/* Location */}
            <button
              onClick={requestLocation}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all min-h-[48px] ${
                locationGranted
                  ? 'border-safe bg-green-50 text-safe'
                  : 'border-gray-200 bg-white text-text-primary hover:border-info'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                locationGranted ? 'bg-safe/20' : 'bg-gray-100'
              }`}>
                <MapPin size={20} />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-sm">Location Access</div>
                <div className="text-xs text-text-secondary">
                  For safe zones and evacuation routes near you
                </div>
              </div>
              {locationGranted && (
                <span className="text-xs font-bold uppercase text-safe">Allowed</span>
              )}
            </button>

            {/* Notifications */}
            <button
              onClick={requestNotifications}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all min-h-[48px] ${
                notifGranted
                  ? 'border-safe bg-green-50 text-safe'
                  : 'border-gray-200 bg-white text-text-primary hover:border-info'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                notifGranted ? 'bg-safe/20' : 'bg-gray-100'
              }`}>
                <Bell size={20} />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-sm">Notifications</div>
                <div className="text-xs text-text-secondary">
                  Get instant flood alerts and safety warnings
                </div>
              </div>
              {notifGranted && (
                <span className="text-xs font-bold uppercase text-safe">Allowed</span>
              )}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePrev}
              className="flex-1 py-3 font-semibold text-sm text-text-secondary border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors min-h-[48px]"
            >
              Back
            </button>
            <button
              onClick={handleFinish}
              className="flex-1 py-3 font-bold text-sm text-white bg-info hover:bg-blue-700 rounded-xl transition-colors min-h-[48px]"
            >
              Get Started
            </button>
          </div>

          <button
            onClick={handleFinish}
            className="mt-4 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  // Slide screens
  const slide = slides[step];
  const SlideIcon = slide.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md mx-auto text-center">
        {/* Logo at top */}
        <SystemLogo size="sm" className="justify-center mb-10 opacity-60" />

        {/* Illustration */}
        <div className={`w-24 h-24 mx-auto rounded-2xl ${slide.iconBg} flex items-center justify-center mb-8`}>
          <SlideIcon size={48} className={slide.iconColor} strokeWidth={1.5} />
        </div>

        {/* Text */}
        <h2 className="text-2xl font-bold text-text-primary mb-3">
          {slide.title}
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-10 max-w-xs mx-auto">
          {slide.text}
        </p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-info' : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={handlePrev}
              className="flex items-center justify-center w-12 h-12 rounded-xl border border-gray-200 text-text-secondary hover:bg-gray-50 transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 py-3 font-bold text-sm text-white bg-info hover:bg-blue-700 rounded-xl transition-colors min-h-[48px]"
          >
            {step === totalSlides - 1 ? 'Set Up Permissions' : 'Next'}
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Skip */}
        <button
          onClick={handleFinish}
          className="mt-4 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          Skip onboarding
        </button>
      </div>
    </div>
  );
}
