import { format, fromUnixTime } from 'date-fns';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { generateGSTAuthToken } from './utils/generateAuthTokenGST';
import { generateAuthTokenMCA } from './utils/generateAuthTokenMCA';
import { generateDownloadLink } from './utils/generateDownloadLink';
import { GSTAuthToken, LlpVpdDocument, McaAuthToken } from './vpdAnalysis.model';

/* eslint-disable camelcase */

const createDownloadLinkForSingleLLPIntoDB = async (query: Record<string, unknown>) => {
  const document = await LlpVpdDocument.findOne({ cin: query.cin });

  if (!document) {
    throw new AppError(httpStatus.NOT_FOUND, 'No Company found for the query');
  }

  if (!document.vpd_data_fetch) {
    throw new AppError(httpStatus.BAD_REQUEST, 'VPD data not fetched');
  }

  if (document.allLinksGenerated) {
    throw new AppError(httpStatus.BAD_REQUEST, 'All links already generated');
  }

  let changesMade = false;

  document.vpdDocs.forEach(docItem => {
    if (!docItem.fileSize) {
      docItem.fileSize = 0; // or 0, depending on what makes sense for your application
    }
    if (!docItem.downloadLink) {
      docItem.downloadLink = generateDownloadLink({
        documentCode: docItem.documentCode,
        formId: docItem.formId,
        fileName: docItem.fileName,
        dateOfFiling: docItem.dateOfFiling,
      });
      changesMade = true;
    }
  });

  if (changesMade) {
    if (document.vpdDocs.every(item => item.downloadLink)) {
      document.allLinksGenerated = true;
    }
    await document.save();
    return {
      message: `Successfully generated download links for the company with CIN: ${query.cin}.`,
    };
  } else {
    if (document.vpdDocs.every(item => item.downloadLink)) {
      document.allLinksGenerated = true;
    }
    await document.save();
    return {
      message: `All links already generated. No need to generate download links for the company with CIN: ${query.cin}.`,
    };
  }
};

const generateAuthTokenIntoDB = async () => {
  const cookies = (await generateAuthTokenMCA()) as {
    name: string;
    value: string;
    expires: number;
  }[];

  // Find the session-token cookie
  // const sessionToken = cookies.find(cookie => cookie.name === 'session-token');
  const sessionTokenMD5 = cookies.find(cookie => cookie.name === 'session-token-md5');
  const csrfToken = cookies.find(cookie => cookie.name === '_csrf');
  const sessionID = cookies.find(cookie => cookie.name === 'sessionID');

  // if (!sessionToken) {
  //   throw new AppError(httpStatus.NOT_FOUND, 'Session token not found');
  // }
  if (!sessionTokenMD5) {
    throw new AppError(httpStatus.NOT_FOUND, 'Session token MD5 not found');
  }
  if (!csrfToken) {
    throw new AppError(httpStatus.NOT_FOUND, 'CSRF token not found');
  }
  if (!sessionID) {
    throw new AppError(httpStatus.NOT_FOUND, 'Session ID not found');
  }

  // Convert the timestamp to a Date object
  const date = fromUnixTime(Math.floor(sessionTokenMD5.expires));
  const expirySessionId = fromUnixTime(Math.floor(sessionID.expires));

  // const expirySessionToken = getExpirationDate(sessionToken.value);
  const expirySessionMD5 = format(date, 'MMMM d, yyyy h:mm:ss a');

  const expirySessionID = format(expirySessionId, 'MMMM d, yyyy h:mm:ss a');

  // update the token document in MongoDB and return it
  try {
    const updatedToken = await McaAuthToken.findByIdAndUpdate(
      '661fa25094fd1a7946a6b869',
      {
        // token: sessionToken.value,
        // expirySessionToken,
        tokenMD5: sessionTokenMD5.value,
        csrfToken: csrfToken.value,
        sessionID: sessionID.value,
        expirySessionMD5,
        expirySessionID,
      },
      { new: true }
    );

    return updatedToken;
  } catch (error) {
    throw new Error('Failed to save the token');
  }
};

const generateGSTAuthTokenIntoDB = async () => {
  const cookies = await generateGSTAuthToken();
  if (!cookies) {
    throw new AppError(httpStatus.NOT_FOUND, 'GST Session token not found');
  }
  // update the token document in MongoDB and return it
  try {
    const updatedToken = await GSTAuthToken.findByIdAndUpdate(
      '6642050d0cbd7364193827e9',
      {
        token: cookies,
        updatedAt: new Date(),
      },
      { new: true }
    );

    return updatedToken;
  } catch (error) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to save GST the token');
  }
};

const generateDownloadLinkForSingleVpd = async (payload: {
  documentCode: number;
  formId: string;
  fileName: string;
  dateOfFiling: string;
}) => {
  const downloadLink = generateDownloadLink({
    documentCode: payload.documentCode,
    formId: payload.formId,
    fileName: payload.fileName,
    dateOfFiling: payload.dateOfFiling,
  });
  return downloadLink;
};

export const VpdAnalysisServices = {
  createDownloadLinkForSingleLLPIntoDB,
  generateAuthTokenIntoDB,
  generateGSTAuthTokenIntoDB,
  generateDownloadLinkForSingleVpd,
};
