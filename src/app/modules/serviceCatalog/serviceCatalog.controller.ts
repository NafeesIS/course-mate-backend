import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ServiceCatalogServices } from './serviceCatalog.service';

const createService: RequestHandler = catchAsync(async (req, res) => {
  const result = await ServiceCatalogServices.createServiceIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Service created successfully.',
    data: result,
  });
});

const getServiceByNameFilter: RequestHandler = catchAsync(async (req, res) => {
  let serviceNames: string[] = [];

  // Handle different types for req.query.serviceNames
  if (typeof req.query.serviceNames === 'string') {
    // If it's a string, split it into an array and remove spaces
    serviceNames = req.query.serviceNames.split(',').map(name => name.trim());
  } else if (Array.isArray(req.query.serviceNames)) {
    // If it's an array of strings, concatenate the array
    serviceNames = req.query.serviceNames.flatMap(name =>
      typeof name === 'string' ? name.split(',').map(n => n.trim()) : []
    );
  } else {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid serviceNames format',
      data: null,
    });
  }

  // Check if names are provided
  if (serviceNames.length === 0) {
    return res.status(400).json({ message: 'Please provide service names to filter' });
  }

  const result = await ServiceCatalogServices.getServiceByNameFilterFromDB(serviceNames);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Service created successfully.',
    data: result,
  });
});

const getAllServiceCatalog: RequestHandler = catchAsync(async (req, res) => {
  const result = await ServiceCatalogServices.getAllServiceCatalogFromDB();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Service catalog fetched successfully.',
    data: result,
  });
});

export const ServiceCatalogControllers = {
  createService,
  getServiceByNameFilter,
  getAllServiceCatalog,
};
