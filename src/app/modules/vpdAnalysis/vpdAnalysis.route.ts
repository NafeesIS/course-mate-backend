import express from 'express';
import { solveMCACaptcha } from './utils/getMasterData';
import { vpdAnalysisControllers } from './vpdAnalysis.controller';

const router = express.Router();

router.get(
  '/generate-download-link-for-single-vpd',
  vpdAnalysisControllers.createDownloadLinkForSingleVpd
);

router.get(
  '/generateDownloadLinkForSingleLLP',
  vpdAnalysisControllers.createDownloadLinkForSingleLLP
);

router.get('/generateAuthToken', vpdAnalysisControllers.generateAuthTokenMCA);
router.get('/generateGSTAuthToken', vpdAnalysisControllers.generateAuthTokenGST);

router.get('/encryptVpdReqUrl', vpdAnalysisControllers.getEncryptedVpdDataReqUrl);
router.get('/decryptData', vpdAnalysisControllers.getDecryptedData);

router.get('/solveMCACaptcha', solveMCACaptcha);
export const VpdAnalysisRoutes = router;
