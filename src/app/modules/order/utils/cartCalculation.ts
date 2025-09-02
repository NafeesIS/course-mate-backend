import httpStatus from 'http-status';
import AppError from '../../../errors/AppError';
import { CouponServices } from '../../coupon/coupon.service';
import { ServiceCatalogModel } from '../../serviceCatalog/serviceCatalog.model';
import { TCoupon, TOrderItem } from '../order.interface';
import { calculateSubscriptionZonalPrice } from './calculateSubscriptionZonalPrice';

const GST_RATE = 0.18;

export async function calculateCartTotalsBackend({
  items,
  currency,
  userId,
  coupon,
}: {
  items: TOrderItem[];
  currency: string;
  userId: string;
  coupon?: TCoupon | null;
}) {
  const verifiedItems = [];
  let baseTotal = 0;

  for (const item of items) {
    const service = await ServiceCatalogModel.findById(item.serviceId);
    if (!service)
      throw new AppError(httpStatus.BAD_REQUEST, `Service not found: ${item.serviceId}`);

    let calculatedPrice = 0;
    let validatedQuantity = item.quantity; //user requested qty
    const backendCustomAttributes = item.customAttributes || {};

    switch (service.serviceType) {
      case 'subscription': {
        const plan = backendCustomAttributes.plan;
        const zone = item.customAttributes?.options;
        if (!service.zonalPricing || !plan || !zone) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            'No zonal pricing defined for this subscription'
          );
        }

        calculatedPrice = calculateSubscriptionZonalPrice(service.zonalPricing, plan, zone);
        validatedQuantity = 1; //
        break;
      }

      case 'directorUnlock': {
        const pricing = service.directorUnlockPricing?.find(p => p.currency === currency);
        if (!pricing) throw new AppError(httpStatus.BAD_REQUEST, 'No pricing for this currency');
        if (backendCustomAttributes.bulkUnlockCredits) {
          const bulkPricing = pricing.bulkUnlock.find(
            b => b.credits === backendCustomAttributes.bulkUnlockCredits
          );
          if (!bulkPricing)
            throw new AppError(httpStatus.BAD_REQUEST, 'Invalid bulk unlock credits');
          calculatedPrice = backendCustomAttributes.bulkUnlockCredits * bulkPricing.price; //bulk unlock price multiply by user requested qty
          validatedQuantity = item.quantity;
        } else {
          calculatedPrice = pricing.singleUnlock.price;
          validatedQuantity = pricing.singleUnlock.credits;
        }
        break;
      }
      case 'companyUnlock': {
        const pricing = service.companyUnlockPricing?.find(p => p.currency === currency);
        if (!pricing) throw new AppError(httpStatus.BAD_REQUEST, 'No pricing for this currency');
        if (
          backendCustomAttributes.companyUnlockCredits &&
          backendCustomAttributes.companyUnlockCredits > 1
        ) {
          const bulkPricing = pricing.bulkUnlock.find(
            b => b.credits === backendCustomAttributes.companyUnlockCredits
          );
          if (!bulkPricing)
            throw new AppError(httpStatus.BAD_REQUEST, 'Invalid company unlock credits');
          calculatedPrice = backendCustomAttributes.companyUnlockCredits * bulkPricing.price;
          validatedQuantity = item.quantity;
        } else {
          calculatedPrice = pricing.singleUnlock.price;
          validatedQuantity = pricing.singleUnlock.credits;
        }
        break;
      }
      case 'vpdUnlock': {
        const pricing = service.vpdUnlockPricing?.find(p => p.currency === currency);
        if (!pricing) throw new AppError(httpStatus.BAD_REQUEST, 'No pricing for this currency');
        calculatedPrice = pricing.singleUnlock.price;
        validatedQuantity = pricing.singleUnlock.credits;
        break;
      }
      case 'complianceService': {
        throw new AppError(httpStatus.BAD_REQUEST, 'Compliance service pricing not implemented');
      }
      default:
        throw new AppError(httpStatus.BAD_REQUEST, 'Unknown service type');
    }

    if (typeof calculatedPrice !== 'number' || validatedQuantity < 1)
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid price or quantity');
    const itemTotal = calculatedPrice * validatedQuantity;
    baseTotal += itemTotal;
    verifiedItems.push({
      serviceId: item.serviceId,
      serviceName: service.name,
      serviceType: service.serviceType,
      quantity: validatedQuantity,
      price: calculatedPrice,
      currency,
      customAttributes: backendCustomAttributes,
    });
  }

  // Coupon/discount validation
  const roundedBaseTotal = Math.round(baseTotal);

  let discount = 0;
  let backendVerifiedCoupon = null;
  if (coupon && coupon.code) {
    const verifiedCoupon = await CouponServices.verifyCouponFromDB({
      code: coupon.code,
      orderValue: roundedBaseTotal,
      userId: userId.toString(),
      serviceIds: verifiedItems.map(item => item.serviceId.toString()),
    });
    discount = verifiedCoupon.discount;
    backendVerifiedCoupon = verifiedCoupon;
  }

  // Calculate GST (only for INR)
  const totalAfterDiscount = roundedBaseTotal - discount;
  const gst = currency === 'INR' ? parseFloat((totalAfterDiscount * GST_RATE).toFixed(2)) : 0;
  const value = parseFloat(totalAfterDiscount.toFixed(2));
  const totalPrice = parseFloat((value + gst).toFixed(2));

  return {
    verifiedItems,
    value,
    gst,
    totalPrice,
    discount,
    backendVerifiedCoupon,
    roundedBaseTotal,
  };
}
