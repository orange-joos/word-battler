export type AuthDestination = 'avatar' | 'game';

export function getAuthDestination(onboardingComplete?: boolean): AuthDestination {
  return onboardingComplete === false ? 'avatar' : 'game';
}
