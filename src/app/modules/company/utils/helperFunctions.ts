/* eslint-disable camelcase */
import {
  differenceInCalendarDays,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isValid,
  parse,
} from 'date-fns';
import { TCompanyData } from '../../director/director.interface';
import { DirectorServices } from '../../director/director.service';
import { formCodes } from '../company.constant';
import {
  AssociatedCompany,
  DirectorResponse,
  TCompanyAddress,
  TDirectorData,
  TDirectorRole,
  TGSTComplianceResponse,
  TGstinList,
  TIndexChargeData,
} from '../company.interface';

// Calculate charges for company details
export function calculateChargeData(indexChargesData?: TIndexChargeData[]) {
  // Initialize with default values
  let totalOpenChargeAmount = 0;
  let totalSatisfiedChargeAmount = 0;
  const lenders = new Set<string>();
  let lastChargeDate = '';
  let lastChargeAmount = 0;
  let messageForNoCharge = ''; // Initialize an empty message string

  if (indexChargesData && indexChargesData.length > 0) {
    for (const charge of indexChargesData) {
      const chargeAmount = parseInt(charge.amount, 10) || 0; // Fallback to 0 if parsing fails

      if (charge.chargeStatus === 'Open') {
        totalOpenChargeAmount += chargeAmount;
      } else if (charge.chargeStatus === 'Closed') {
        totalSatisfiedChargeAmount += chargeAmount;
      }

      if (charge.chargeHolderName) {
        lenders.add(charge.chargeHolderName);
      }

      if (charge.dateOfCreation && (!lastChargeDate || charge.dateOfCreation > lastChargeDate)) {
        lastChargeDate = charge.dateOfCreation;
        lastChargeAmount = chargeAmount;
      }
    }
    // Return the calculated charge data along with the message for no data, if applicable
    return {
      totalOpenCharges: totalOpenChargeAmount,
      totalSatisfiedCharges: totalSatisfiedChargeAmount,
      totalLenders: lenders.size,
      lastChargeDate: lastChargeDate || 'No Data',
      lastChargeAmount: lastChargeAmount,
    };
  } else {
    // Set a message indicating no charge data available
    messageForNoCharge = 'There are no Charges registered against the CIN/LLP as per our records.';
    // Return the calculated charge data along with the message for no data, if applicable
    return {
      messageForNoCharge, // Include the message in the returned object
    };
  }
}

// Function to filter and transform director data
export const getCurrentDirectors = (
  directorData: TDirectorData[],
  companyCIN: string
  // eligibleDesignations: string[]
) => {
  interface Director {
    din: string;
    fullName: string;
    dateOfAppointment: string;
    designation: string;
  }

  const directors = directorData.reduce<Director[]>((acc, director) => {
    // Check if any of the roles of the director matches the eligible designations and UCIN matches the company CIN
    const eligibleRoles = (director.MCAUserRole as TDirectorRole[])?.filter(
      role => role.ucin === companyCIN
    );

    // If there are eligible roles, transform and add the director to the accumulator
    if (eligibleRoles?.length > 0) {
      acc.push({
        din: director.DIN,
        fullName: [director.FirstName, director.MiddleName, director.LastName]
          .filter(Boolean)
          .join(' '),
        dateOfAppointment: director.dateOfAppointment,
        // Email: eligibleRoles[0].emailAddress || 'Not Provided',
        designation: eligibleRoles.map(role => role.designation).join(', '), // Assuming a director can have multiple eligible roles
      });
    }

    return acc;
  }, []);

  return directors;
};

export const getRegisteredCompanyAddress = (companyAddresses: TCompanyAddress[]) => {
  const registeredAddress = companyAddresses
    .filter(address => address.addressType === 'Registered Address')
    .map(address => {
      return {
        formattedAddress: `${address.streetAddress} ${address.streetAddress2}, ${address.locality}, ${address.district}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`,
        city: address.city,
        pinCode: address.postalCode,
        addressType: address.addressType,
      };
    });

  if (registeredAddress.length > 0) {
    return {
      registeredAddress: registeredAddress[0].formattedAddress,
      city: registeredAddress[0].city,
      pinCode: registeredAddress[0].pinCode,
      addressType: registeredAddress[0].addressType,
    };
  }

  // If no registered address, check for correspondence address
  const correspondenceAddress = companyAddresses
    .filter(address => address.addressType === 'Correspondance Address')
    .map(address => ({
      formattedAddress: `${address.streetAddress} ${address.streetAddress2}, ${address.locality}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`,
      city: address.city,
      pinCode: address.postalCode,
      addressType: address.addressType,
    }));

  if (correspondenceAddress.length > 0) {
    return {
      registeredAddress: correspondenceAddress[0].formattedAddress,
      city: correspondenceAddress[0].city,
      pinCode: correspondenceAddress[0].pinCode,
      addressType: correspondenceAddress[0].addressType,
    };
  }

  // If no address found at all, return empty values
  return {
    registeredAddress: '',
    city: '',
    pinCode: '',
    companyType: '',
  };
};

// Helper function to extract website from email
export function getWebsiteFromEmail(email: string): string {
  const commonEmailProviders: string[] = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'aol.com',
    'live.com',
    'icloud.com',
    'mail.com',
    'zoho.com',
  ];
  try {
    // Extract the domain part of the email
    const domainMatch = email.match(/@([\w.]+)/);
    if (domainMatch) {
      const domain = domainMatch[1];
      // Check if the domain is not in the list of common email providers
      if (!commonEmailProviders.includes(domain)) {
        // Construct the website URL
        const website = `https://${domain}`;
        return website;
      }
    }
    return '-';
  } catch (error) {
    console.error(`Error extracting website from email: ${error}`);
    return '-';
  }
}

export function getPromoterNames(directors: DirectorResponse[]) {
  // Filter the directors array to include only those where isPromoter is true
  const promoters = directors.filter(director => director.isPromoter);

  // Map over the filtered array to extract the fullName of each promoter
  const promoterNames = promoters.map(promoter => promoter.fullName);

  return promoterNames;
}

// Helper function to find form code based on document's eformName
export const getFormDetailsByEFormName = (formName: string) => {
  // Assuming eformName contains the form code
  const formCode = Object.keys(formCodes).find(code => formName.includes(code));

  return formCode ? { formCode, ...formCodes[formCode] } : null;
};

// Function to determine AOC-4 normal fee based on Authorized Share Capital
export const calculate_AOC4_Mgt7_NormalFee = (authorizedShareCapital: number): number => {
  if (authorizedShareCapital < 100000) return 200;
  if (authorizedShareCapital >= 100000 && authorizedShareCapital <= 499999) return 300;
  if (authorizedShareCapital >= 500000 && authorizedShareCapital <= 2499999) return 400;
  if (authorizedShareCapital >= 2500000 && authorizedShareCapital <= 9999999) return 500;
  return 600; // For 1,00,00,000 or more
};

// Function to calculate additional (late) fee
export const calculate_AOC4_Mgt7_AdditionalFee = (filingDateStr: string, dueDate: Date): number => {
  // console.log(filingDateStr);
  // const filingDateParts = filingDateStr.match(/Filed on (.+)/);
  // console.log(filingDateParts);
  // if (filingDateParts && filingDateParts[1]) {

  const filingDate = parse(filingDateStr, 'EEE MMM dd yyyy', new Date());
  if (isValid(filingDate) && isBefore(dueDate, filingDate)) {
    //check if due date is before filing date
    return differenceInCalendarDays(filingDate, dueDate) * 100; // 100 per day of delay
  } else if (filingDateStr === 'Not filed') {
    const today = new Date();
    if (isBefore(dueDate, today)) {
      return differenceInCalendarDays(today, dueDate) * 100; // Calculate based on current date if not filed yet
    }
  }
  return 0; // No additional fee if not delayed or if "Not yet due"
};

// export const getComplianceFilingStatus = (filingDateStr: string, dueDate: Date): string => {
//   const currentDate = new Date();

//   const daysDelayed = differenceInCalendarDays(currentDate, dueDate);
//   const daysRemaining = differenceInCalendarDays(dueDate, currentDate);

//   const filingDate = parse(filingDateStr, 'EEE MMM dd yyyy', new Date());
//   if (isBefore(currentDate, dueDate)) {
//     return `${daysRemaining} days left to file`;
//   } else if (isValid(filingDate)) {
//     if (isBefore(filingDate, dueDate) || isSameDay(filingDate, dueDate)) {
//       return 'On Time Payment';
//     } else {
//       return `${differenceInCalendarDays(filingDate, dueDate)} days delay in payment`;
//     }
//   } else if (filingDateStr === 'Not filed') {
//     // If the current date is past the due date, and the status is 'Not filed'
//     return `${daysDelayed} days overdue`;
//   } else {
//     // Extract filing date from the string
//     // const filingDateParts = filingDateStr.match(/Filed on (.+)/);
//     // if (filingDateParts && filingDateParts[1]) {
//     // const filingDate = parse(filingDateStr, 'EEE MMM dd yyyy', new Date());
//     // if (isValid(filingDate)) {
//     //   if (isBefore(filingDate, dueDate) || isSameDay(filingDate, dueDate)) {
//     //     return 'On Time Payment';
//     //   } else {
//     //     return `${differenceInCalendarDays(filingDate, dueDate)} days delay in payment`;
//     //   }
//     // }
//   }
//   return 'Invalid filing date'; // In case filing date is invalid or cannot be parsed
// };

const calculateFilingStartDate = (year: number, dueDate: Date) => {
  const startDate = new Date(year + 1, 3, 1); // April 1st of the year after the AGM
  ///check if due date is before assumed start date
  if (isBefore(dueDate, startDate)) {
    return new Date(year, 3, 1);
  }
  // Assuming financial year starts on April 1st
  return new Date(year + 1, 3, 1); // April 1st of the year after the AGM
};

export const getComplianceFilingStatus = (
  filingDateStr: string,
  dueDate: Date,
  currentFinancialYear: number
): string => {
  const currentDate = new Date();
  const startDate = calculateFilingStartDate(currentFinancialYear, dueDate);

  // Parse the filing date from the string, if provided
  const filingDate =
    filingDateStr && filingDateStr !== 'Not filed'
      ? parse(filingDateStr, 'EEE MMM dd yyyy', new Date())
      : null;

  // If filing date is valid and on or before due date, it's an on-time filing
  if (filingDate && (isBefore(filingDate, dueDate) || isSameDay(filingDate, dueDate))) {
    return 'On Time Filing';
  }

  // If current date is before the start date, show "Open for Filing"
  if (isBefore(currentDate, startDate)) {
    return `Open for Filing: ${format(startDate, 'dd-MMM-yyyy')}`;
  }

  // If current date is before due date, show days left to file
  if (isBefore(currentDate, dueDate)) {
    const daysRemaining = differenceInCalendarDays(dueDate, currentDate);
    return `${daysRemaining} Days Left to File`;
  }

  // If filing date is valid but after due date, show delay in filing
  if (filingDate && isAfter(filingDate, dueDate)) {
    const daysDelayed = differenceInCalendarDays(filingDate, dueDate);
    return `${daysDelayed} Days Delay in Filing`;
  }

  // If the filing status is 'Not filed' and the due date is past
  if (filingDateStr === 'Not filed' && isAfter(currentDate, dueDate)) {
    const daysOverdue = differenceInCalendarDays(currentDate, dueDate);
    return `${daysOverdue} Days Overdue`;
  }

  // Default message for unhandled cases
  return 'Status Unknown';
};

// Try to parse a date string into a Date object for both format dd/MMM/yyyy or dd-MM-yyyy
export const tryParseDate = (dateStr: string) => {
  let date = parse(dateStr, 'dd/MM/yyyy', new Date());
  if (isValid(date)) return date;

  date = parse(dateStr, 'dd-MM-yyyy', new Date());
  if (isValid(date)) return date;

  return null; // Return null if neither format results in a valid date
};

export const parseDateWithMultipleFormats = (dateString: string, formats: string[]) => {
  for (const formatString of formats) {
    const parsedDate = parse(dateString, formatString, new Date());
    if (isValid(parsedDate)) {
      return parsedDate;
    }
  }
  return null;
};

interface CurrentDirector {
  din: string;
  fullName: string;
  dateOfAppointment: string;
  designation: string;
  totalDirectorship: number;
  isPromoter: boolean;
}

export const fetchAssociatedCompanies = async (
  currentDirectors: CurrentDirector[],
  mainCompanyCIN: string
): Promise<AssociatedCompany[]> => {
  const associatedCompanies = [];

  for (const director of currentDirectors) {
    const directorDetails = await DirectorServices.getSingleDirectorDetailsFromDB({
      din: director.din,
    });

    if (directorDetails && directorDetails.companyData) {
      associatedCompanies.push(
        ...directorDetails.companyData.map((company: TCompanyData) => ({
          cin_LLPIN: company.cin_LLPIN || '-',
          nameOfTheCompany: company.nameOfTheCompany || '-',
          companyStatus: company.companyStatus || '-',
        }))
      );
    }
  }

  // Filter out the main company's CIN and remove duplicate associated companies by CIN
  const uniqueAssociatedCompanies = Array.from(
    new Map(
      associatedCompanies
        .filter(ac => ac.cin_LLPIN !== mainCompanyCIN)
        .map(item => [item.cin_LLPIN, item])
    ).values()
  );

  return uniqueAssociatedCompanies.slice(0, 8);
};

export const getStateNameFromGSTIN = (gstin: string) => {
  const stateCode = gstin.substring(0, 2);
  const stateName = getStateNameFromGstin(stateCode);
  return stateName || '-';
};
export const getStateNameFromGstin = (stateCode: string) => {
  const stateCodes: { [key: string]: string } = {
    '01': 'Jammu & Kashmir',
    '02': 'Himachal Pradesh',
    '03': 'Punjab',
    '04': 'Chandigarh',
    '05': 'Uttarakhand',
    '06': 'Haryana',
    '07': 'Delhi',
    '08': 'Rajasthan',
    '09': 'Uttar Pradesh',
    '10': 'Bihar',
    '11': 'Sikkim',
    '12': 'Arunachal Pradesh',
    '13': 'Nagaland',
    '14': 'Manipur',
    '15': 'Mizoram',
    '16': 'Tripura',
    '17': 'Meghalaya',
    '18': 'Assam',
    '19': 'West Bengal',
    '20': 'Jharkhand',
    '21': 'Odisha',
    '22': 'Chhattisgarh',
    '23': 'Madhya Pradesh',
    '24': 'Gujarat',
    '26': 'Dadra & Nagar Haveli',
    '27': 'Maharashtra',
    '28': 'Andhra Pradesh',
    '29': 'Karnataka',
    '30': 'Goa',
    '31': 'Lakshadweep',
    '32': 'Kerala',
    '33': 'Tamil Nadu',
    '34': 'Puducherry',
    '35': 'Andaman & Nicobar',
    '36': 'Telangana',
    '37': 'Andhra Pradesh',
    '38': 'Ladakh',
    '97': 'Other Territory',
    '99': 'Centre Jurisdiction',
  };
  return stateCodes[stateCode] || '-';
};

interface StateGstinItem {
  stateGstin: string;
}
function createStateGstinArray(gstinList: TGstinList[]): StateGstinItem[] {
  return gstinList.map(item => {
    const stateCode = item.gstin.substring(0, 2);
    const stateName = getStateNameFromGstin(stateCode);
    return {
      stateGstin: `${stateName} - ${item.gstin}`,
    };
  });
}

export function combineGstinData(gstinList: TGstinList[], data: TGSTComplianceResponse[]) {
  const newGstinArray = createStateGstinArray(gstinList);
  const result = [{ gstinList: newGstinArray, gstinDetails: data }];

  return result;
}

export const formatDateString = (dateStr: string): string => {
  try {
    // Try parsing with DD/MM/YYYY format first
    let parsedDate = parse(dateStr, 'dd/MM/yyyy', new Date());

    // If first format fails, try DD-MMM-YY format
    if (!isValid(parsedDate)) {
      parsedDate = parse(dateStr, 'dd-MMM-yy', new Date());
    }

    // If both formats fail, return original string
    if (!isValid(parsedDate)) {
      return dateStr;
    }

    // Format it to display as desired
    return format(parsedDate, 'dd-MMM-yyyy');
  } catch (error) {
    console.log('Error parsing date:', dateStr, error);
    return dateStr;
  }
};

export const getZohoBookStateNameFromGstin = (stateCode: string) => {
  const stateCodes: { [key: string]: string } = {
    '01': 'JK',
    '02': 'HP',
    '03': 'PB',
    '04': 'CH',
    '05': 'UK',
    '06': 'HR',
    '07': 'DL',
    '08': 'RJ',
    '09': 'UP',
    '10': 'BR',
    '11': 'SK',
    '12': 'AR',
    '13': 'NL',
    '14': 'MN',
    '15': 'MZ',
    '16': 'TR',
    '17': 'ML',
    '18': 'AS',
    '19': 'WB',
    '20': 'JH',
    '21': 'OD',
    '22': 'CG',
    '23': 'MP',
    '24': 'GJ',
    '26': 'DN',
    '27': 'MH',
    '28': 'AP',
    '29': 'KA',
    '30': 'GA',
    '31': 'LD',
    '32': 'KL',
    '33': 'TN',
    '34': 'PY',
    '35': 'AN',
    '36': 'TS',
    '37': 'AD',
    '38': 'LA',
    '97': 'OT',
    '99': 'CJ',
  };

  return stateCodes[stateCode] || '-';
};
