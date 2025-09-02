export type TServiceType =
  | 'subscription'
  | 'oneTime'
  | 'directorUnlock'
  | 'complianceService'
  | 'companyUnlock'
  | 'vpdUnlock';

interface IPricingPlan {
  baseMonthly: number;
  baseQuarterly: number;
  baseAnnually: number;
}

interface IBulkPricing {
  quantity: number;
  price: number;
}
interface IStatePricing {
  state: string;
  multiplier: number;
  approxCompanies: number;
}

export interface IZonalPricing {
  zone: string;
  monthly: number;
  quarterly: number;
  annually: number;
  trial: number;
  approxCompanies: number;
  stateIncludes: string[];
  globalDiscount?: number; // percentage, e.g., 80 for 80%
  globalDiscountStartDate?: Date;
  globalDiscountEndDate?: Date;
}

export interface IPackage {
  packageName: string;
  description: string;
  currency: string;
  price: number;
  features: string[];
}

interface IBulkUnlockPricingOption {
  credits: number;
  price: number;
}

export interface IDirectorUnlockPricing {
  country: string;
  currency: string;
  singleUnlock: {
    price: number;
    credits: number;
  };
  bulkUnlock: IBulkUnlockPricingOption[];
}

export interface ICompanyUnlockPricing {
  country: string;
  currency: string;
  singleUnlock: {
    price: number;
    credits: number;
  };
  bulkUnlock: IBulkUnlockPricingOption[];
}

export interface IVpdUnlockPricing {
  country: string;
  currency: string;
  singleUnlock: {
    price: number;
    credits: number;
  };
}

export type TServiceCatalog = {
  name: string;
  description: string;
  serviceType: TServiceType;
  packages?: IPackage[];
  pricingPlan?: IPricingPlan; // For subscription services
  statePricing?: IStatePricing[]; // Array of state-specific pricing plans
  zonalPricing?: IZonalPricing[]; //Array of zonal pricing model
  oneTimePricing?: {
    singlePrice?: number;
    bulkPricing?: IBulkPricing[]; // For one-time purchase services
  };
  directorUnlockPricing?: IDirectorUnlockPricing[];
  companyUnlockPricing?: ICompanyUnlockPricing[];
  vpdUnlockPricing?: IVpdUnlockPricing[];
  features?: string[]; // Optional: for services like Company Data, where features are part of the service
  excludes?: string[]; // Optional: for services like Company Data, where excludes are part of the service
};
