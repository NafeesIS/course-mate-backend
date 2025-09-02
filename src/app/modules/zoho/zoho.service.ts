/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { format, parse } from 'date-fns';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { TOneTimeComplianceResponse } from '../company/company.interface';
import { CompanyModel } from '../company/company.model';
import triggerLambdaScrapper from '../company/utils/triggerLamdaScrapper';
import {
  checkOnetimeComplianceStatus,
  checkUpdateCompletionStatus,
  createZohoLeadIntoCRM,
  getEligibleDirectors,
  getZohoAuthToken,
  makeZohoApiRequest,
  scheduleCall,
  updateINC20StatusInZohoLead,
} from './zoho.helper';

const scheduleCallIntoZohoCRM = async (mobile: string, Call_Start_Time: string) => {
  const zohoApiUrl = 'https://www.zohoapis.in/crm/v6/Leads';
  const zohoAuthToken = await getZohoAuthToken();

  // Step 1: Search for the lead by mobile number
  const searchConfig = {
    method: 'get',
    url: `${zohoApiUrl}/search?criteria=(Mobile:equals:${mobile})`,
    headers: {
      Authorization: `Zoho-oauthtoken ${zohoAuthToken}`,
      'Content-Type': 'application/json',
    },
  };
  const searchResponse = await makeZohoApiRequest(searchConfig);

  if (searchResponse?.data && searchResponse?.data.length > 0) {
    const { id, Full_Name, Owner } = searchResponse.data[0];

    //TODO: Step 2: If required Update the lead status
    // const updateConfig = {
    //   method: 'put',
    //   url: `${zohoApiUrl}/${leadId}`,
    //   headers: {
    //     Authorization: `Zoho-oauthtoken ${zohoAuthToken}`, // Use the dynamically refreshed token
    //     'Content-Type': 'application/json',
    //   },
    //   data: {
    //     data: [
    //       {
    //         id: leadId,
    //         Lead_Status: newLeadStatus,
    //       },
    //     ],
    //   },
    // };
    // await makeZohoApiRequest(updateConfig);

    //step 3: Create a call task
    // Step 3: If it's a "Request a Call Back", schedule a call
    const scheduleCallData = {
      leadId: id,
      Full_Name,
      Call_Start_Time,
      Owner,
    };
    await scheduleCall(scheduleCallData, zohoAuthToken as string);

    return `Lead status updated for mobile: ${mobile} & name: ${Full_Name} and call scheduled `;
  }

  return 'Lead not found';
};

const createZohoLead = async (query: Record<string, unknown>) => {
  const cin = query.cin as string;
  //check comapany type is company since inc20 is applicable for company only
  if (query.companyType !== 'Company') {
    return {
      message: `INC-20A is not applicable for LLP. Skipping campaign for CIN: ${cin}`,
      data: null,
    };
  }
  // first update data for company and vpdv3 to
  await triggerLambdaScrapper(cin, query.incorporationDate as string, query.companyType as string);

  const isUpdateCompleted = await checkUpdateCompletionStatus(query.cin as string);
  if (!isUpdateCompleted) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to check update status');
  }

  const companyData = await CompanyModel.findOne({ cin: query.cin });
  if (!companyData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Company not found');
  }

  const { dateOfIncorporation, authorisedCapital, companyType } =
    companyData.masterData.companyData;

  //convert the date to proper format
  // Parse the date string to a Date object
  const parsedDate = parse(dateOfIncorporation, 'MM/dd/yyyy', new Date());

  // Format the Date object to the desired format
  const formattedDateOfIncorporation = format(parsedDate, 'dd-MMM-yyyy');
  const oneTimeComplianceQuery = {
    cin: query.cin,
    incorporationDate: formattedDateOfIncorporation,
    authorisedCapital,
    companyType,
  };
  const oneTimeComplianceData = await checkOnetimeComplianceStatus(oneTimeComplianceQuery);
  if (!oneTimeComplianceData) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to get one time compliance status'
    );
  }
  const isINC20ANotFiled = oneTimeComplianceData.some(
    (form): form is TOneTimeComplianceResponse =>
      'formCode' in form && form.formCode === 'INC-20A' && form.filingDate === 'Not filed'
  );

  const inc20AStatus = oneTimeComplianceData.find(
    (form): form is TOneTimeComplianceResponse => 'formCode' in form && form.formCode === 'INC-20A'
  );

  if (isINC20ANotFiled && inc20AStatus) {
    const directorData = companyData.masterData.directorData;
    const directors = await getEligibleDirectors(directorData, cin);

    const lead = [];
    if (directors.length > 0) {
      for (const director of directors) {
        const response = await createZohoLeadIntoCRM(
          cin,
          director,
          formattedDateOfIncorporation,
          companyData.masterData,
          inc20AStatus
        );

        lead.push(response);
      }
    }

    return {
      message: `INC-20A has not filed for CIN: ${cin} and ${lead.length} leads created`,
      data: lead,
    };
  } else {
    return {
      message: `INC-20A filed for CIN: ${cin} and Company Name: ${companyData.company}`,
      data: null,
    };
  }
};

const getZohoLeadDetailsFromCRM = async (mobile: string) => {
  const zohoApiUrl = 'https://www.zohoapis.in/crm/v6/Leads';
  //get current access token
  const zohoAuthToken = await getZohoAuthToken();

  // Step 1: Search for the lead by mobile number
  const searchConfig = {
    method: 'get',
    url: `${zohoApiUrl}/search?criteria=(Mobile:equals:${mobile})`,
    headers: {
      Authorization: `Zoho-oauthtoken ${zohoAuthToken}`,
      'Content-Type': 'application/json',
    },
  };
  const searchResponse = await makeZohoApiRequest(searchConfig);
  if (searchResponse?.data && searchResponse?.data?.length > 0) {
    // Step 2: Get the lead details
    const {
      Email,
      Full_Name,
      CIN,
      Company,
      Date_of_Incorporation,
      Mobile,
      inc20a_status,
      Authorised_Capital,
    } = searchResponse.data[0];
    const oneTimeComplianceQuery = {
      cin: CIN,
      incorporationDate: Date_of_Incorporation,
      authorisedCapital: Authorised_Capital,
      companyType: 'Company',
    };
    const oneTimeComplianceData = await checkOnetimeComplianceStatus(oneTimeComplianceQuery);
    if (!oneTimeComplianceData) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to get one time compliance status'
      );
    }

    const inc20AStatus = oneTimeComplianceData.find(
      (form): form is TOneTimeComplianceResponse =>
        'formCode' in form && form.formCode === 'INC-20A'
    );

    return {
      message: 'Lead found',
      data: {
        name: Full_Name,
        email: Email,
        mobile: Mobile,
        cin: CIN,
        company: Company,
        incorpDate: Date_of_Incorporation,
        filingDueDate: inc20AStatus?.dueDate,
        lateFee: inc20AStatus?.additionalFee,
        filingStatus: inc20AStatus?.filingStatus,
        inc20aStatus: inc20a_status,
      },
    };
  } else {
    return {
      message: 'Lead not found',
      data: null,
    };
  }
};

const updateLeadInc20StatusIntoZoho = async (query: Record<string, unknown>) => {
  const cin = query.cin as string;
  // first update data for company and vpdv3 to
  await triggerLambdaScrapper(cin, query.incorporationDate as string, query.companyType as string);
  const isUpdateCompleted = await checkUpdateCompletionStatus(query.cin as string);
  if (!isUpdateCompleted) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to check update status');
  }

  const companyData = await CompanyModel.findOne({ cin: query.cin });
  if (!companyData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Company not found');
  }

  const { dateOfIncorporation, authorisedCapital, companyType } =
    companyData.masterData.companyData;

  //convert the date to proper format
  // Parse the date string to a Date object
  const parsedDate = parse(dateOfIncorporation, 'MM/dd/yyyy', new Date());

  // Format the Date object to the desired format
  const formattedDateOfIncorporation = format(parsedDate, 'dd-MMM-yyyy');
  const oneTimeComplianceQuery = {
    cin: query.cin,
    incorporationDate: formattedDateOfIncorporation,
    authorisedCapital,
    companyType,
  };
  const oneTimeComplianceData = await checkOnetimeComplianceStatus(oneTimeComplianceQuery);
  if (!oneTimeComplianceData) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to get one time compliance status'
    );
  }
  const inc20a_status = oneTimeComplianceData.every(
    (form): form is TOneTimeComplianceResponse =>
      'formCode' in form && form.formCode === 'INC-20A' && form.filingDate === 'Not filed'
  );

  const inc20AFilingDetails = oneTimeComplianceData.find(
    (form): form is TOneTimeComplianceResponse => 'formCode' in form && form.formCode === 'INC-20A'
  );

  if (inc20a_status && inc20AFilingDetails) {
    const response = await updateINC20StatusInZohoLead(cin, inc20a_status);
    return response;
  } else {
    const response = await updateINC20StatusInZohoLead(cin, inc20a_status);
    return response;
  }
};

export const ZohoCrmServices = {
  scheduleCallIntoZohoCRM,
  createZohoLead,
  getZohoLeadDetailsFromCRM,
  updateLeadInc20StatusIntoZoho,
};
