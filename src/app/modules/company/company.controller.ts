import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import { SessionRequest } from 'supertokens-node/framework/express';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CompanyServices } from './company.service';

const getCompanySuggestions: RequestHandler = catchAsync(async (req, res) => {
  let searchTerm = req.query.searchTerm;

  // Validate the search term is a string and not empty
  if (typeof searchTerm !== 'string' || !searchTerm.trim()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Valid search term is required.');
  }

  //standardize the search term
  searchTerm = searchTerm.trim().toUpperCase();

  const result = await CompanyServices.getCompanySuggestionsFromDB(req.query);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Company suggestions fetched successfully.',
    data: result,
  });
});
const getDashboardCompanySuggestions: RequestHandler = catchAsync(async (req, res) => {
  let searchTerm = req.query.searchTerm;

  // Validate the search term is a string and not empty
  if (typeof searchTerm !== 'string' || !searchTerm.trim()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Valid search term is required.');
  }

  //standardize the search term
  searchTerm = searchTerm.trim().toUpperCase();

  const result = await CompanyServices.getDashboardCompanySuggestionsFromDB(req.query);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Dashboard company suggestions fetched successfully.',
    data: result,
  });
});

const getCompanyAdvanceSearch: RequestHandler = catchAsync(async (req, res) => {
  const formattedQuery: Record<string, unknown> = Object.keys(req.query).reduce<
    Record<string, unknown>
  >((acc, key) => {
    let value = req.query[key];
    // If the value is a string containing commas, split it into an array
    if (typeof value === 'string' && key !== 'mainDivisionDescription') {
      // If value contains commas, split it into an array, otherwise keep it as is
      value = value.includes(',') ? value.split(',') : value;
    }
    // Store the formatted data
    acc[key] = value;

    return acc;
  }, {});

  const result = await CompanyServices.getCompanyAdvanceSearchFromDB(formattedQuery);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Company suggestions fetched successfully.',
    data: result,
  });
});
const getCompanyAdvanceSearchFacets: RequestHandler = catchAsync(async (req, res) => {
  const result = await CompanyServices.getCompanyAdvanceSearchFacetsFromDB(req.query);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Company search facet fetched successfully.',
    data: result,
  });
});

const getSingleCompanyDetails: RequestHandler = catchAsync(async (req, res) => {
  const result = await CompanyServices.getSingleCompanyDetailsFromDB(req.query);
  // if (!result) {
  //   return sendResponse(res, {
  //     statusCode: httpStatus.OK,
  //     success: true,
  //     message: 'No company found.',
  //     data: {},
  //   });
  // }
  // Separate the data into basic and subscribedInfo based on login status
  // const basicInfo: TCompanyBasicInfo = {
  //   cin: companyData.cin,
  //   company: companyData.company,
  //   companyType: companyData.companyType,
  //   companyOrigin: companyData.companyOrigin,
  //   category: companyData.category,
  //   registrationNumber: companyData.registrationNumber,
  //   classOfCompany: companyData.classOfCompany,
  //   status: companyData.status,
  //   state: companyData.state,
  //   incorporationAge: companyData.incorporationAge,
  //   rocCode: companyData.rocCode,
  //   dateOfIncorporation: companyData.dateOfIncorporation,
  //   companySubcategory: companyData.companySubcategory,
  //   listingStatus: companyData.listingStatus,
  //   industry: companyData.industry,
  //   authorizedCapital: companyData.formattedAuthorizedCapital,
  //   paidUpCapital: companyData.formattedPaidUpCapital,
  //   address: companyData.address,
  //   currentDirectors: companyData.currentDirectors,
  //   about: companyData.about,
  // };

  // const subscribedInfo = {
  //   email: companyData.email,
  //   chargeData: companyData.chargeData,
  //   pastDirectors: companyData.pastDirectors,
  //   executiveTeam: companyData.executiveTeam,
  //   associatedCompanies: companyData.associatedCompanies,
  // };
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Company details fetched successfully.',
    data: result,
  });
});

const getChargeDetails: RequestHandler = catchAsync(async (req, res) => {
  const result = await CompanyServices.getChargeDetailsFromDB(req.query);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Charge details fetched successfully.',
    data: result,
  });
});

const getOneTimeComplianceDetails: RequestHandler = catchAsync(async (req, res) => {
  if (
    (!req.query?.cin || !req.query?.incorporationDate || !req.query?.companyType) &&
    (!req.query?.authorizedCapital || !req.query?.totalObligationOfContribution)
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }

  const result = await CompanyServices.getOneTimeComplianceDetailsFromDB(req.query);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'One Time Compliance details fetched successfully.',
    data: result,
  });
});

const getAnnualComplianceDetails: RequestHandler = catchAsync(async (req, res) => {
  if (
    (!req.query?.cin || !req.query?.incorporationDate || !req.query?.companyType) &&
    (!req.query?.authorizedCapital || !req.query?.totalObligationOfContribution)
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }

  const result = await CompanyServices.getAnnualComplianceDetailsFromDB(req.query);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    // message: result[0].message || 'Annual Compliance details fetched successfully.',
    message: 'Annual Compliance details fetched successfully.',
    data: result,
  });
});

const getGstComplianceDetails: RequestHandler = catchAsync(async (req, res) => {
  if (!req.query?.cin || !req.query?.incDate) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }

  const result = await CompanyServices.getGstComplianceDetailsFromDB(req.query);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'GST Compliance details fetched successfully.',
    data: result,
  });
});

const createCompanyDataUpdateRequest = catchAsync(async (req, res) => {
  if (!req.query?.cin || !req.query?.dateOfIncorporation || !req.query?.companyType) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }

  const result = await CompanyServices.createCompanyDataUpdateRequestIntoDB(req.query);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Company Data Update Request created successfully.',
    data: result,
  });
});
const getCompanyDataUpdateStatus = catchAsync(async (req, res) => {
  if (!req.query?.cin) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }
  const result = await CompanyServices.getCompanyDataUpdateStatusFromDB(req.query);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Company Data Update Status fetched  successfully.',
    data: result,
  });
});

const getSimilarCompanies: RequestHandler = catchAsync(async (req, res) => {
  if (!req.query?.mainDivisionDescription) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }

  const result = await CompanyServices.getSimilarCompaniesFromDB(req.query);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Similar companies fetched successfully.',
    data: result,
  });
});

const getLLP_PublicDocuments: RequestHandler = catchAsync(async (req, res) => {
  const { cin } = req.query;
  if (!cin) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }
  const result = await CompanyServices.getLLP_PublicDocumentsFromDB(cin as string);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'LLP Public Documents fetched successfully.',
    data: result,
  });
});

const getPaidLLP_PublicDocuments: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const { _userId, cin } = req.body;
  if (!cin || !_userId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }
  const sessionUser = req.session!.getUserId();
  const result = await CompanyServices.getPaidLLP_PublicDocumentsFromDB(
    _userId,
    cin as string,
    sessionUser
  );
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'LLP Public Documents fetched successfully.',
    data: result,
  });
});

const getPaidLlpFinancialData: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const { _userId, cin } = req.body;

  if (!cin || !_userId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameter: cin');
  }

  const sessionUser = req.session!.getUserId();

  const result = await CompanyServices.getPaidLlpFinancialDataFromDB(
    _userId,
    cin as string,
    sessionUser
  );

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Financial data fetched successfully',
    data: result,
  });
});

const getCompanyPublicDocuments: RequestHandler = catchAsync(async (req, res) => {
  const { cin, version } = req.query;
  if (!cin || !version) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }
  const result =
    version === 'v3'
      ? await CompanyServices.getCompanyPublicDocumentsV3FromDB(cin as string)
      : await CompanyServices.getCompanyPublicDocumentsV2FromDB(cin as string);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Company Public Documents fetched successfully.',
    data: result,
  });
});

const getPaidCompanyPublicDocuments: RequestHandler = catchAsync(
  async (req: SessionRequest, res) => {
    const { _userId, cin, version } = req.body;
    if (!cin || !_userId || !version) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
    }
    const sessionUser = req.session!.getUserId();
    // const sessionUser = '8bdf3655-a6f0-41c5-9ea6-0f61d29bc07b'; // :TODO: for local testing
    const result =
      version === 'v3'
        ? await CompanyServices.getPaid_CompanyPublicDocumentsV3FromDB(
            _userId,
            cin as string,
            sessionUser
          )
        : await CompanyServices.getPaid_CompanyPublicDocumentsV2FromDB(
            _userId,
            cin as string,
            sessionUser
          );
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Company Public Documents fetched successfully.',
      data: result,
    });
  }
);

const getAdminPaidLLP_PublicDocuments: RequestHandler = catchAsync(async (req, res) => {
  const { cin } = req.body;
  if (!cin) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }
  const result = await CompanyServices.getAdminPaidLLP_PublicDocumentsFromDB(cin as string);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'LLP Public Documents fetched successfully.',
    data: result,
  });
});

const getAdminPaidLlpFinancialData: RequestHandler = catchAsync(async (req, res) => {
  const { cin } = req.body;

  if (!cin) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameter: cin');
  }

  const result = await CompanyServices.getAdminPaidLlpFinancialDataFromDB(cin as string);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Financial data fetched successfully',
    data: result,
  });
});

const getAdminPaidCompanyPublicDocuments: RequestHandler = catchAsync(async (req, res) => {
  const { _userId, cin, version } = req.body;
  if (!cin || !_userId || !version) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }

  const result =
    version === 'v3'
      ? await CompanyServices.get_Admin_Paid_CompanyPublicDocumentsV3FromDB(_userId, cin as string)
      : await CompanyServices.get_Admin_Paid_CompanyPublicDocumentsV2FromDB(_userId, cin as string);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Company Public Documents fetched successfully.',
    data: result,
  });
});

const getCompanyAndLLPCounts: RequestHandler = catchAsync(async (req, res) => {
  const result = await CompanyServices.getCompanyAndLLPCounts();

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Company and LLP counts fetched successfully.',
    data: result,
  });
});

export const CompanyControllers = {
  getCompanySuggestions,
  getDashboardCompanySuggestions,
  getCompanyAdvanceSearch,
  getCompanyAdvanceSearchFacets,
  getSingleCompanyDetails,
  getChargeDetails,
  getAnnualComplianceDetails,
  getGstComplianceDetails,
  getOneTimeComplianceDetails,
  createCompanyDataUpdateRequest,
  getCompanyDataUpdateStatus,
  getSimilarCompanies,
  getLLP_PublicDocuments,
  getPaidLLP_PublicDocuments,
  getPaidLlpFinancialData,
  getCompanyPublicDocuments,
  getPaidCompanyPublicDocuments,
  getAdminPaidLlpFinancialData,
  getAdminPaidLLP_PublicDocuments,
  getAdminPaidCompanyPublicDocuments,
  getCompanyAndLLPCounts,
};
