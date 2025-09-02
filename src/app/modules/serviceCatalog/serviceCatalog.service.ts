import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { TServiceCatalog } from './serviceCatalog.interface';
import { ServiceCatalogModel } from './serviceCatalog.model';

const createServiceIntoDB = async (payload: TServiceCatalog) => {
  const {
    name,
    description,
    serviceType,
    pricingPlan,
    statePricing,
    zonalPricing,
    oneTimePricing,
    directorUnlockPricing,
    companyUnlockPricing,
    features,
    excludes,
    packages,
  } = payload;
  const service = new ServiceCatalogModel({
    name,
    description,
    serviceType,
    pricingPlan,
    statePricing,
    zonalPricing,
    oneTimePricing,
    directorUnlockPricing,
    companyUnlockPricing,
    features,
    excludes,
    packages,
  });

  await service.save();
  return service;
};

const getServiceByNameFilterFromDB = async (query: string[]) => {
  const service = await ServiceCatalogModel.find({ name: { $in: query } });
  if (service.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No services found with the specified names');
  }

  return service;
};

const getAllServiceCatalogFromDB = async () => {
  const service = await ServiceCatalogModel.find();
  return service;
};

export const ServiceCatalogServices = {
  createServiceIntoDB,
  getServiceByNameFilterFromDB,
  getAllServiceCatalogFromDB,
};
