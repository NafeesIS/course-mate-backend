import { TSubscriptionPlan, TSubscriptionStatus } from './subscription.interface';

export const subscriptionPlan: TSubscriptionPlan[] = ['monthly', 'quarterly', 'annually', 'trial'];

export const subscriptionStatus: TSubscriptionStatus[] = [
  'active',
  'inactive',
  'trial',
  'expired',
  'grace',
];
