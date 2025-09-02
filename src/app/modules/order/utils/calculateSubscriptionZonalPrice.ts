import httpStatus from 'http-status';
import AppError from '../../../errors/AppError';
import { IZonalPricing } from '../../serviceCatalog/serviceCatalog.interface';

/**
 * Calculate the price for a subscription service using zonalPricing.
 * @param zonalPricing - The zonalPricing array from the service document.
 * @param plan - 'monthly' | 'quarterly' | 'annually'
 * @param zone - The selected zone (e.g., 'East', 'West', etc.)
 * @returns The price for the selected plan and zone.
 */
export function calculateSubscriptionZonalPrice(
  zonalPricing: IZonalPricing[],
  plan: 'monthly' | 'quarterly' | 'annually' | 'trial',
  zone: string[]
): number {
  if (!plan || !zone) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Plan and zone are required for zonal subscription');
  }
  if (!['monthly', 'quarterly', 'annually', 'trial'].includes(plan)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid plan type');
  }
  if (!zonalPricing || !Array.isArray(zonalPricing)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No zonal pricing defined');
  }

  const selectedZones = zonalPricing.filter(z => zone.includes(z.zone));
  if (!selectedZones.length) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid zone(s) selected');
  }

  let totalPrice = 0;
  const now = new Date();

  for (const zoneObj of selectedZones) {
    let price = zoneObj[plan];
    if (typeof price !== 'number') {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid price for selected plan/zone');
    }
    // Apply global discount if present and valid, and not for trial
    if (
      plan !== 'trial' &&
      zoneObj.globalDiscount &&
      zoneObj.globalDiscount > 0 &&
      zoneObj.globalDiscountStartDate &&
      zoneObj.globalDiscountEndDate
    ) {
      const start = new Date(zoneObj.globalDiscountStartDate);
      const end = new Date(zoneObj.globalDiscountEndDate);
      if (now >= start && now <= end) {
        price = price * (1 - zoneObj.globalDiscount / 100);
      }
    }
    totalPrice += price;
  }
  return totalPrice;
}
