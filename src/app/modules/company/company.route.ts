import express from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import { verifyAdmin } from '../../middlewares/verifyAdmin';
import { verifyApiKey } from '../../middlewares/verifyApiKey';
import { CompanyControllers } from './company.controller';

const router = express.Router();

// Guest accessible routes
router.get('/suggestions', CompanyControllers.getCompanySuggestions);
router.get('/dashboard-company-suggestions', CompanyControllers.getDashboardCompanySuggestions);
router.get('/advanceSearch', CompanyControllers.getCompanyAdvanceSearch);
router.get('/searchFacets', CompanyControllers.getCompanyAdvanceSearchFacets);

// 3rd Party API route with API key authentication
router.get('/public/suggestions', verifyApiKey, CompanyControllers.getCompanySuggestions);

router.get('/companyInfo', CompanyControllers.getSingleCompanyDetails);
router.get('/chargeDetails', CompanyControllers.getChargeDetails);
router.get('/oneTimeCompliance', CompanyControllers.getOneTimeComplianceDetails);
router.get('/annualCompliance', CompanyControllers.getAnnualComplianceDetails);
router.get('/gstCompliance', CompanyControllers.getGstComplianceDetails);

router.get('/createCompanyUpdateRequest', CompanyControllers.createCompanyDataUpdateRequest);
router.get('/getCompanyUpdateStatus', CompanyControllers.getCompanyDataUpdateStatus);

router.get('/getSimilarCompanies', CompanyControllers.getSimilarCompanies);

router.get('/llp-public-documents', CompanyControllers.getLLP_PublicDocuments);
router.post(
  '/paid-llp-public-documents',
  verifySession(),
  CompanyControllers.getPaidLLP_PublicDocuments
);
router.post(
  '/paid-llp-financial-data',
  verifySession(),
  CompanyControllers.getPaidLlpFinancialData
);

router.get('/company-public-documents', CompanyControllers.getCompanyPublicDocuments);

router.post('/paid-company-vpd', verifySession(), CompanyControllers.getPaidCompanyPublicDocuments);
// router.post('/paid-company-vpd', CompanyControllers.getPaidCompanyPublicDocuments); // :TODO: for local testing

//route for NCA Landing Page
router.get('/getCompanyAndLLPCounts', CompanyControllers.getCompanyAndLLPCounts);

// Admin only routes
router.post(
  '/admin/paid-llp-public-documents',
  verifySession(),
  verifyAdmin,
  CompanyControllers.getAdminPaidLLP_PublicDocuments
);
router.post(
  '/admin/paid-llp-financial-data',
  verifySession(),
  verifyAdmin,
  CompanyControllers.getAdminPaidLlpFinancialData
);

router.post(
  '/admin/paid-company-vpd',
  verifySession(),
  verifyAdmin,
  CompanyControllers.getAdminPaidCompanyPublicDocuments
);

export const CompanyRoutes = router;
