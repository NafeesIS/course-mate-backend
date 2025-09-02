import { model, Schema } from 'mongoose';
import {
  ICompanyUnlockPricing,
  IDirectorUnlockPricing,
  IPackage,
  IVpdUnlockPricing,
  IZonalPricing,
  TServiceCatalog,
} from './serviceCatalog.interface';

const PricingPlanSchema = new Schema(
  {
    baseMonthly: { type: Number, required: true }, //  1000
    baseQuarterly: { type: Number, required: true }, //  3000
    baseAnnually: { type: Number, required: true }, //  12000
  },
  { _id: false }
);

const StatePricingSchema = new Schema(
  {
    state: { type: String, required: true }, //delhi , mumbai
    multiplier: { type: Number, required: true, default: 1 },
    approxCompanies: { type: Number, required: true }, // Approximate number of companies in  the state
  },
  { _id: false }
);
const ZonalPricingSchema = new Schema<IZonalPricing>(
  {
    zone: { type: String, required: true },
    monthly: { type: Number, required: true },
    quarterly: { type: Number, required: true },
    annually: { type: Number, required: true },
    trial: { type: Number, required: true },
    approxCompanies: { type: Number, required: true }, // Approximate number of companies in  the zone monthly
    stateIncludes: { type: [String], required: true },
    globalDiscount: { type: Number, default: 0 },
    globalDiscountStartDate: { type: Date },
    globalDiscountEndDate: { type: Date },
  },
  { _id: false }
);
const OneTimePricingSchema = new Schema(
  {
    singlePrice: { type: Number, required: true },
    bulkPricing: [
      {
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
  },
  { _id: false }
);

const DirectorUnlockPricingSchema = new Schema<IDirectorUnlockPricing>(
  {
    country: { type: String, required: true },
    currency: { type: String, required: true },
    singleUnlock: {
      price: { type: Number, required: true },
      credits: { type: Number, required: true },
    },
    bulkUnlock: [
      {
        credits: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
  },
  { _id: false }
);

const CompanyUnlockPricingSchema = new Schema<ICompanyUnlockPricing>(
  {
    country: { type: String, required: true },
    currency: { type: String, required: true },
    singleUnlock: {
      price: { type: Number, required: true },
      credits: { type: Number, required: true },
    },
    bulkUnlock: [
      {
        credits: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
  },
  { _id: false }
);

const VpdUnlockPricingSchema = new Schema<IVpdUnlockPricing>(
  {
    country: { type: String, required: true },
    currency: { type: String, required: true },
    singleUnlock: {
      price: { type: Number, required: true },
      credits: { type: Number, required: true },
    },
  },
  { _id: false }
);

const PackageSchema = new Schema<IPackage>(
  {
    packageName: { type: String, required: true }, // Name of the plan (e.g., "Starter", "Standard", etc.)
    description: { type: String, required: true }, // Plan description
    currency: { type: String, required: true },
    price: { type: Number, required: true }, // One-time pricing for the plan
    features: { type: [String], required: true }, // List of features included in the plan
  },
  { _id: false } // Disable _id for sub-document
);

const ServiceCatalogSchema = new Schema<TServiceCatalog>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  serviceType: {
    type: String,
    enum: ['subscription', 'oneTime', 'directorUnlock', 'complianceService', 'companyUnlock'],
    required: true,
  },
  packages: { type: [PackageSchema] },
  pricingPlan: PricingPlanSchema, // Base pricing for subscription services
  statePricing: [StatePricingSchema], // State-specific adjustments
  zonalPricing: [ZonalPricingSchema],
  oneTimePricing: OneTimePricingSchema, // For one-time services
  directorUnlockPricing: [DirectorUnlockPricingSchema],
  companyUnlockPricing: [CompanyUnlockPricingSchema],
  vpdUnlockPricing: [VpdUnlockPricingSchema],
  features: { type: [String], default: [] }, // Optional: for additional features
  excludes: { type: [String], default: [] }, // Optional: for exclusions
});

export const ServiceCatalogModel = model<TServiceCatalog>('ServiceCatalog', ServiceCatalogSchema);
