/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { format } from 'date-fns-tz';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { toTitleCase } from '../../utils/dataFormatter';
import {
  TDirectorData,
  TDirectorRole,
  TMasterData,
  TOneTimeComplianceResponse,
} from '../company/company.interface';
import { CompanyServices } from '../company/company.service';
import { DirectorModel } from '../director/director.model';
import formatCompanyName from './utils/formatCompanyName';
import getNextOwner from './utils/getNextLeadOwner';
import { sendComplianceEmail } from './utils/sendComplianceEmail';
import { sendComplianceSMS } from './utils/sendComplianceSMS';
import { ZohoAuthToken } from './zoho.model';

/* eslint-disable camelcase */
type TScheduleCallData = {
  leadId: string;
  Full_Name: string;
  Call_Start_Time: string;
  Owner: {
    id: string;
    name: string;
    email: string;
  };
};

export const scheduleCall = async (scheduleCallData: TScheduleCallData, zohoAuthToken: string) => {
  const zohoCallApiUrl = 'https://www.zohoapis.in/crm/v6/Calls';

  // Prepare the call data
  const callData = {
    data: [
      {
        What_Id: scheduleCallData.leadId, // Associate with the lead
        Call_Type: 'Outbound',
        Call_Start_Time: scheduleCallData.Call_Start_Time,
        Owner: scheduleCallData.Owner.id,
        Subject: 'Respond to call back request by ' + scheduleCallData.Full_Name,
        Outgoing_Call_Status: 'Scheduled',
        which_call: 'ScheduleCall',
        se_module: 'Leads',
        // Call_Purpose: 'Prospecting',
        // Call_Agenda: 'Respond to call back request by ' + scheduleCallData.Full_Name,
        // Reminder: '5 minutes before',
      },
    ],
  };

  try {
    // schedule call config
    const scheduleCallConfig = {
      method: 'POST',
      url: `${zohoCallApiUrl}`,
      headers: {
        Authorization: `Zoho-oauthtoken ${zohoAuthToken}`, // Use the dynamically refreshed token
        'Content-Type': 'application/json',
      },
      data: callData,
    };
    const response = await makeZohoApiRequest(scheduleCallConfig);

    return response.data;
  } catch (err: any) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to schedule a call, error: ' + err.message
    );
  }
};

export const refreshAccessToken = async () => {
  try {
    const client_id = '1000.K90GN5SW9R3ABXNJH7LVWPBWJB6OZJ';
    const client_secret = '28e357b9c934c89d147e0797e8706ad3162bc7c146';
    const refresh_token = '1000.5c1c2e2f03e756e6177eacef607465fd.10a8822fad44cebc8ab0480f96a35c49';
    const url = `https://accounts.zoho.in/oauth/v2/token?client_id=${client_id}&client_secret=${client_secret}&grant_type=refresh_token&refresh_token=${refresh_token}`;

    const response = await axios.post(url);
    const { access_token, scope, api_domain, token_type, expires_in } = response.data;

    await saveAccessToken(access_token, scope, api_domain, token_type, expires_in);

    console.log('Access token refreshed:', response.data.access_token);
  } catch (error: any) {
    console.error('Error refreshing access token:', error.message);
  }
};

export const makeZohoApiRequest = async (config: any) => {
  try {
    const response = await axios(config);
    return response.data; // Return the response if successful
  } catch (error: any) {
    if (
      (error.response &&
        error.response.status === 401 &&
        error.response.data.code === 'INVALID_TOKEN') ||
      error.response.data.code === 'AUTHENTICATION_FAILURE'
    ) {
      console.log('Invalid token, refreshing...');
      await refreshAccessToken(); // Refresh the token
      const zohoAuthToken = await getZohoAuthToken();
      // Retry the original request with the new token
      config.headers.Authorization = `Zoho-oauthtoken ${zohoAuthToken}`;
      const retryResponse = await axios(config);
      return retryResponse.data; // Return the response from the retry
    } else {
      // console.log('Error making Zoho API request:', error.response.data.code);
      console.log('Error making Zoho API request:', error.response.data[0].details);
      throw error; // If it's not an INVALID_TOKEN error, rethrow the error
    }
  }
};

export const getZohoAuthToken = async () => {
  const tokenData = await ZohoAuthToken.findOne().sort({ savedAt: -1 }); // Get the latest token
  if (tokenData) {
    return tokenData.access_token;
  } else {
    console.log('No token found, refresh token first...');
    return null;
  }
};

const saveAccessToken = async (
  accessToken: string,
  scope: string,
  api_domain: string,
  token_type: string,
  expires_in: number
) => {
  try {
    await ZohoAuthToken.findOneAndUpdate(
      {}, // Match any document (assuming you only store one token at a time)
      {
        access_token: accessToken,
        scope,
        api_domain,
        token_type,
        expires_in,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true } // Options: upsert, return new doc, set defaults if inserted
    );
  } catch (error) {
    console.log('Error saving access token:', error);
    throw error;
  }
};

export const checkUpdateCompletionStatus = async (cin: string, retries = 10, delay = 5000) => {
  // 10 retries, 5-second delay
  for (let i = 0; i < retries; i++) {
    const updateStatus = await CompanyServices.getCompanyDataUpdateStatusFromDB({ cin });

    if (!updateStatus) {
      return false;
    }

    // for both checking vpd and company update
    if (
      updateStatus.isVpdV3Updated === 'completed' &&
      updateStatus.isCompanyDataUpdated === 'completed'
    ) {
      return true; // Completed
    }

    if (
      updateStatus.isVpdV3Updated === 'failed' ||
      updateStatus.isCompanyDataUpdated === 'failed'
    ) {
      return false; // Failed
    }

    //TODO: for checking only vpd3
    // if (updateStatus.isVpdV3Updated === 'completed') {
    //   console.log(`Update completed for CIN: ${cin}`);
    //   return true; // Completed
    // }
    // if (updateStatus.isVpdV3Updated === 'failed') {
    //   console.log(`Update failed for CIN: ${cin}`);
    //   return false; // Failed
    // }

    console.log(`Waiting for update completion for CIN: ${cin}, attempt ${i + 1}/${retries}`);
    await new Promise(resolve => setTimeout(resolve, delay)); // Wait before next attempt
  }

  return false; // Retries exhausted after max try
};

export const checkOnetimeComplianceStatus = async (
  query: Record<string, unknown>,
  retries = 10,
  delay = 10000
) => {
  for (let i = 0; i < retries; i++) {
    const complianceData = await CompanyServices.getOneTimeComplianceDetailsFromDB(query);

    if (complianceData) {
      const firstTimeUpdate = complianceData.some(item => item?.isFirstTimeUpdate);

      // if (firstTimeUpdate) {
      //   // Update is in progress, log the message and retry after delay
      //   console.log(complianceData.find(item => item.isFirstTimeUpdate).message);
      // } else {
      //   // Proper response received, return the data
      //   return complianceData;
      // }
      if (!firstTimeUpdate) {
        return complianceData;
      }
    } else {
      // If it's neither a proper response nor an update-in-progress, consider it a failure
      console.log(`Failed to fetch compliance data for CIN: ${query.cin}`);
      return null;
    }

    // Wait before the next attempt
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Retries exhausted, return null
  console.log(`Max retries reached for CIN: ${query.cin}. Could not fetch compliance data.`);
  return null;
};

export const getEligibleDirectors = async (directors: TDirectorData[], cin: string) => {
  // Use Promise.all to handle the async calls within the map
  const eligibleDirectors = await Promise.all(
    directors.map(async director => {
      if (!director.MCAUserRole) return null; // Skip if MCAUserRole is not defined

      // Find the role with the matching CIN
      const role = (director.MCAUserRole as TDirectorRole[]).find(role => role.cin === cin);
      if (!role) return null;

      const din = role.din;

      const directorContact = await DirectorModel.findOne(
        { din: din },
        { mobileNumber: 1, emailAddress: 1, DIR3KYCFiledFlag: 1, addresses: 1, _id: 0 }
      ).lean();

      if (!directorContact) return null;

      const fixedPhoneNumber = fixPhoneNumber(directorContact.mobileNumber);
      // console.log(`Original: ${directorContact?.mobileNumber}, Fixed: ${fixedPhoneNumber}`);

      if (fixedPhoneNumber) {
        // Convert the director to a plain object using `.toObject()`
        const directorPlain = JSON.parse(JSON.stringify(director));

        // Replace contactAddress with the addresses obtained from directorContact
        directorPlain.directorAddress = directorContact.addresses || []; // Use the addresses from directorContact

        role.mobileNumber = fixedPhoneNumber;
        role.emailAddress = directorContact.emailAddress;
        role.DIR3KYCFiledFlag = directorContact.DIR3KYCFiledFlag;
        return { ...directorPlain, MCAUserRole: role };
      }

      return null;
    })
  );

  // Filter out null values from the eligibleDirectors
  const filteredDirectors = eligibleDirectors.filter(director => director !== null);
  // Create a Set to keep track of unique DINs and filter out duplicates
  const uniqueDirectors = [];
  const seenDins = new Set();
  for (const director of filteredDirectors) {
    const din = director.DIN;

    if (din && !seenDins.has(din)) {
      seenDins.add(din); // Add the DIN to the set to avoid duplicates
      uniqueDirectors.push(director); // Add the director to the result list
    }
  }

  return uniqueDirectors;
};

function validatePhoneNumber(phoneNumber: string) {
  const indianPhoneNumberPattern = /^[6-9]\d{9}$/;
  // console.log(`Is valid phone number ${phoneNumber} ${indianPhoneNumberPattern.test(phoneNumber)}`);
  return indianPhoneNumberPattern.test(phoneNumber);
}

function fixPhoneNumber(phoneNumber: string) {
  const normalizedNumber = phoneNumber.replace(/\D/g, '');

  if (normalizedNumber.length === 10) {
    //case 1: 10-digit number (assumed to be indian number)
    //After trimming check if its start with 6,7,8,9
    if (validatePhoneNumber(normalizedNumber)) {
      return `${normalizedNumber}`;
    }
    return null;
  } else if (normalizedNumber.length === 11) {
    //case 2: 11-digit number start with 0 or 9
    const trimmedNumber =
      normalizedNumber.startsWith('0') || normalizedNumber.startsWith('9')
        ? normalizedNumber.slice(1)
        : normalizedNumber;

    //After trimming check if its start with 6,7,8,9
    if (validatePhoneNumber(trimmedNumber)) {
      return `${trimmedNumber}`;
    }
    // return `91${trimmedNumber}`;
  }
  // else if (normalizedNumber.length === 11 && normalizedNumber.startsWith('+')) {
  //   //case 3: 11-digit number start with +
  //   const trimmedNumber = normalizedNumber.slice(1);
  //   return `91${trimmedNumber}`;
  // }
  else if (normalizedNumber.length === 12 && normalizedNumber.startsWith('91')) {
    //case 4: 12-digit number starting with 91 (already in the correct format)
    const restOfNumber = normalizedNumber.slice(2);
    if (validatePhoneNumber(restOfNumber)) {
      return restOfNumber;
    }
    return null;
  } else if (normalizedNumber.length === 12 || normalizedNumber.length === 13) {
    // Case 5: 12 or 13-digit number, might be with a country code
    const countryCode =
      normalizedNumber.length === 13 ? normalizedNumber.slice(0, 3) : normalizedNumber.slice(0, 2);
    const restOfNumber =
      normalizedNumber.length === 13 ? normalizedNumber.slice(3) : normalizedNumber.slice(2);

    // Check if the country code is for India
    if (countryCode === '91' || countryCode === '091' || countryCode === '+91') {
      if (validatePhoneNumber(restOfNumber)) {
        return `${restOfNumber}`;
      }
    }
  }
  // if it dosne't match any case, return null
  return null;
}

export const createZohoLeadIntoCRM = async (
  cin: string,
  director: TDirectorData,
  incorporationDate: string,
  masterData: TMasterData,
  inc20AStatus: TOneTimeComplianceResponse
) => {
  const {
    classOfCompany,
    authorisedCapital,
    paidUpCapital,
    emailAddress,
    companyOrigin,
    MCAMDSCompanyAddress,
  } = masterData.companyData;

  const { NICCode1Desc, NICCode2Desc, NICCode3Desc } = masterData.commonData;
  const businessActivities = [NICCode1Desc, NICCode2Desc, NICCode3Desc]
    .filter(Boolean) // This removes any null, undefined, or empty string values
    .join(', ');

  const directorPresentAddress = director.directorAddress.find(
    address => address.addressType === 'Present Address'
  );

  const companyRegisteredAddress = MCAMDSCompanyAddress.find(
    address => address.addressType === 'Registered Address'
  );

  const { addressLine1, addressLine2, city, pincode, district, state, country } =
    directorPresentAddress || {};

  const {
    streetAddress,
    streetAddress2,
    postalCode,
    district: companyAddDistrict,
    state: companyAddState,
    country: companyAddCountry,
  } = companyRegisteredAddress || {};

  const zohoCreateLeadApiUrl = 'https://www.zohoapis.in/crm/v6/Leads/upsert';
  const directorFullName = `${director.FirstName} ${director.LastName}`;
  const company_name = (director.MCAUserRole as TDirectorRole).companyName;
  const directorEmail = (director.MCAUserRole as TDirectorRole).emailAddress;
  const directorMobile = (director.MCAUserRole as TDirectorRole).mobileNumber;

  const directorPrestFullAddr = [
    addressLine1,
    addressLine2,
    city,
    pincode,
    district,
    state,
    country,
  ]
    .filter(Boolean)
    .join(', ');

  const company_url = `${formatToUrl(
    (director.MCAUserRole as TDirectorRole).companyName
  )}/${cin}?tab=compliance&utm_source=whatsapp&utm_medium=social&utm_campaign=inc20a_outreach`;
  const requestCallbackURL = `${'www.filesure.in'}/r?q=${directorMobile}`;

  //  Send EMail template
  await sendComplianceEmail(
    directorEmail,
    `🚨 URGENT: ${toTitleCase(directorFullName)}, INC-20A Filing Pending for ${toTitleCase(formatCompanyName(company_name))}!`,
    cin,
    company_name,
    incorporationDate,
    inc20AStatus,
    company_url
  );

  await sendComplianceSMS(
    `91${directorMobile}`,
    directorFullName,
    formatCompanyName(company_name),
    Number(inc20AStatus.additionalFee),
    requestCallbackURL
  );
  //get current access token

  const zohoAuthToken = await getZohoAuthToken();

  const leadOwner = await getNextOwner(cin);

  const leadData = {
    data: [
      {
        // Owner: {
        //   name: 'Tushar Mohite',
        //   id: '740496000000326001',
        //   email: 'admin@filesure.in',
        // },
        Owner: leadOwner,
        Lead_Source: 'Campaign',
        Lead_Status: 'New Lead',
        duplicate_check_fields: ['Mobile'],
        First_Name: toTitleCase(director.FirstName),
        Last_Name: toTitleCase(director.LastName),
        Email: directorEmail,
        Mobile: `91${directorMobile}`,
        // Phone: `+${directorMobile}`,
        DIN: director.DIN,
        DIR3KYC: (director.MCAUserRole as TDirectorRole)?.DIR3KYCFiledFlag,
        Director_Present_Address: `${toTitleCase(directorPrestFullAddr)}`,
        Director_Present_City: city,
        Company: toTitleCase((director.MCAUserRole as TDirectorRole).companyName),
        CIN: cin,
        Company_Email: emailAddress,
        Date_of_Incorporation: incorporationDate,
        // Listing_Status: whetherListedOrNot,
        Paid_Up_Capital: paidUpCapital,
        Authorised_Capital: authorisedCapital,
        Class_of_Company: classOfCompany,
        // Registration_No: registrationNumber,
        Company_Origin: companyOrigin,
        inc20a_status: 'FALSE',
        inc20aStatus_lastUpdated: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
        // INC20_Filing_Status: 'FALSE',
        // INC20_Status_Updated: formattedIndianTime,
        Business_Activity: businessActivities,
        City: companyAddDistrict,
        State: companyAddState,
        Street: `${streetAddress} ${streetAddress2}`,
        Zip_Code: postalCode,
        Country: companyAddCountry,
      },
    ],
  };

  const createLeadConfig = {
    method: 'POST',
    url: `${zohoCreateLeadApiUrl}`,
    headers: {
      Authorization: `Zoho-oauthtoken ${zohoAuthToken}`, // Use the dynamically refreshed token
      'Content-Type': 'application/json',
    },
    data: leadData,
  };

  const createLeadResponse = await makeZohoApiRequest(createLeadConfig);

  return createLeadResponse;
};

export const updateINC20StatusInZohoLead = async (cin: string, inc20a_status: boolean) => {
  const zohoApiUrl = 'https://www.zohoapis.in/crm/v6/Leads';
  //get current access token
  const zohoAuthToken = await getZohoAuthToken();

  // Step 1: Search for the lead by mobile number
  const searchConfig = {
    method: 'get',
    url: `${zohoApiUrl}/search?criteria=(CIN:equals:${cin})`,
    headers: {
      Authorization: `Zoho-oauthtoken ${zohoAuthToken}`,
      'Content-Type': 'application/json',
    },
  };

  const searchResponse = await makeZohoApiRequest(searchConfig);

  if (searchResponse?.data && searchResponse?.data.length > 0) {
    // Collect all the update requests in an array
    const updatePromises = searchResponse.data.map(
      async (lead: { id: any; Full_Name: any; Lead_Status: any }) => {
        const leadId = lead.id;

        const Lead_Status = lead.Lead_Status;

        if (Lead_Status === 'Lost Lead') {
          return;
        }
        const updateConfig = {
          method: 'put',
          url: `${zohoApiUrl}/${leadId}`,
          headers: {
            Authorization: `Zoho-oauthtoken ${zohoAuthToken}`, // Use the dynamically refreshed token
            'Content-Type': 'application/json',
          },
          data: {
            data: [
              {
                id: leadId,
                Lead_Status: inc20a_status ? 'Lost Lead' : Lead_Status,
                inc20a_status: inc20a_status ? 'TRUE' : 'FALSE',
                inc20aStatus_lastUpdated: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
              },
            ],
          },
        };

        // Make the API request to update the lead
        const response = await makeZohoApiRequest(updateConfig);

        return response.data;
      }
    );

    // Wait for all updates to complete
    const updateResults = await Promise.all(updatePromises);

    return {
      message: `Updated ${updateResults.length} lead in zoho crm`,
      data: updateResults,
    }; // Return all update responses if needed
    // for (const lead of searchResponse.data) {
    //   const leadId = lead.id;
    //   const leadName = lead.Full_Name;
    //   console.log({ leadId, leadName });
    //   const updateConfig = {
    //     method: 'put',
    //     url: `${zohoApiUrl}/${leadId}`,
    //     headers: {
    //       Authorization: `Zoho-oauthtoken ${zohoAuthToken}`, // Use the dynamically refreshed token
    //       'Content-Type': 'application/json',
    //     },
    //     data: {
    //       data: [
    //         {
    //           id: leadId,
    //           inc20a_status,
    //           inc20aStatus_lastUpdated: format(new Date(), 'yyyy-MM-dd'),
    //         },
    //       ],
    //     },
    //   };
    //   const response = await makeZohoApiRequest(updateConfig);
    //   console.log('update response', response.data);
    //   return response.data;
    // }
  } else {
    return {
      message: 'No lead found to update',
      data: null,
    };
  }
};

function formatToUrl(text: string) {
  // Basic normalization and conversion to lowercase
  let formattedText = text.trim().toLowerCase();

  // Replace '&' with 'and'
  formattedText = formattedText.replace(/&/g, 'and');

  // Replace spaces with hyphens
  formattedText = formattedText.replace(/\s+/g, '-');

  // Replace all special characters with hyphens
  formattedText = formattedText.replace(/[^a-zA-Z0-9&\s-]/g, '-');

  // Replace multiple consecutive hyphens with a single hyphen
  formattedText = formattedText.replace(/-+/g, '-');

  // Remove leading and trailing hyphens
  formattedText = formattedText.replace(/^-+|-+$/g, '');

  return formattedText;
}

export const zohoBookRefreshAccessToken = async () => {
  try {
    const client_id = '1000.I51R04OFBE6M6OV2KMW7OF832Q86PX';
    const client_secret = 'ef5b8c957e31cccc10729378916f2029218cf95ae6';
    const refresh_token = '1000.e7d679a671191788c9a9f033810397f4.d62a65525499283f35aa19e4f0fc8786';
    const url = `https://accounts.zoho.in/oauth/v2/token?client_id=${client_id}&client_secret=${client_secret}&grant_type=refresh_token&refresh_token=${refresh_token}`;

    const response = await axios.post(url);
    const { access_token, scope, api_domain, token_type, expires_in } = response.data;

    await saveZohoBookAccessToken(access_token, scope, api_domain, token_type, expires_in);

    // console.log('Access token refreshed:', response.data.access_token);
  } catch (error: any) {
    console.error('Error refreshing access token:', error.message);
  }
};

const saveZohoBookAccessToken = async (
  accessToken: string,
  scope: string,
  api_domain: string,
  token_type: string,
  expires_in: number
) => {
  try {
    // Update the document with the specific scope
    await ZohoAuthToken.findOneAndUpdate(
      { scope }, // Match the document with the specified scope
      {
        access_token: accessToken,
        scope, // Ensure the scope is saved (redundant but keeps it explicit)
        api_domain,
        token_type,
        expires_in,
        savedAt: new Date(), // Update or add the savedAt timestamp
      },
      { upsert: true, new: true, setDefaultsOnInsert: true } // Options: upsert if not found, return the new doc
    );

    // console.log(`Access token for scope: ${scope} saved successfully.`);
  } catch (error) {
    console.error(`Error saving access token for scope: ${scope}`, error);
    throw error;
  }
};

export const makeZohoBookApiRequest = async (config: any) => {
  try {
    const response = await axios(config);
    // console.log('main response', response.data);
    return response.data; // Return the response if successful
  } catch (error: any) {
    // console.log('main error', error);
    if (error.response) {
      const { status, data } = error.response;
      // console.log('my status', status);
      // console.log('my data', data);
      // Handle code 57: "You are not authorized to perform this operation"
      if (status === 401 && data.code === 57) {
        // console.log('Authorization error (code 57): Attempting to fix and retry...');

        // Step 1: Refresh the access token (in case of token or scope issues)
        await zohoBookRefreshAccessToken();
        const newAuthToken = await getZohoBookAuthToken();
        config.headers.Authorization = `Zoho-oauthtoken ${newAuthToken?.access_token}`;
        const retryResponse = await axios(config);
        // console.log('retryResponse', retryResponse);
        return retryResponse.data; // Return the response from the retry
      } else {
        // console.log('Error making Zoho API request:', error.response.data.code);
        // console.log('Error making Zoho API request:', error.response.data[0].details);
        throw error; // If it's not an INVALID_TOKEN error, rethrow the error
      }
    }

    // Log and return null for other errors
    // console.error('Error making Zoho API request:', error.response?.data || error.message);
    return null; // Do not throw error, return null to continue the process
  }
};

export const getZohoBookAuthToken = async () => {
  try {
    // Fetch the latest token for ZohoBooks.fullaccess.all scope
    const tokenData = await ZohoAuthToken.findOne({ scope: 'ZohoBooks.fullaccess.all' }).sort({
      savedAt: -1,
    });
    if (tokenData) {
      return tokenData;
    } else {
      console.log('No token found for ZohoBooks.fullaccess.all scope. Please refresh the token.');
      return null;
    }
  } catch (error) {
    console.error('Error retrieving ZohoBooks Auth Token:', error);
    throw error;
  }
};
