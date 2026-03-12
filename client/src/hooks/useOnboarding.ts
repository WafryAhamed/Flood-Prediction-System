const ONBOARDING_KEY = 'flood_onboarding_completed';

export function useOnboardingComplete() {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}
