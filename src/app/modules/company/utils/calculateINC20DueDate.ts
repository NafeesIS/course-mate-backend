import { addDays, differenceInCalendarDays, format, isAfter, isBefore, parse } from 'date-fns';

import { TVpdV2Form, TVpdV3Document } from '../../vpdAnalysis/vpdAnalysis.interface';
import { TOneTimeComplianceResponse } from '../company.interface';

const formDetails = {
  formCode: 'INC-20A',
  formName: 'Declaration for commencement of business',
  formDescription:
    'Shareholders must confirm their payment for shares and confirm their office address before starting business.',
};

export const calculateINC20DueDateAndFee = (
  incorporationDate: string,
  authorizedShareCapital: number,
  v3Documents: TVpdV3Document[],
  v2Documents: TVpdV2Form[]
): TOneTimeComplianceResponse[] => {
  const INC20A_REGEX = /INC-20A/i;

  const result = [];
  const incorpDate = parse(incorporationDate, 'dd-MMM-yyyy', new Date());
  const isApplicable = isAfter(incorpDate, new Date(2018, 11, 2)); //check if company is incorporated before 2nd Nov 2018 if so then it is not applicable

  if (!isApplicable) {
    result.push({
      formCode: formDetails?.formCode,
      formName: formDetails?.formName,
      formDescription: formDetails?.formDescription,
      dueDate: '-',
      filingStatus: 'Not applicable',
      filingDate: 'Not applicable',
      normalFee: '-',
      additionalFee: '-',
      isApplicable,
    });
    return result;
  }
  const dueDate = addDays(incorpDate, 180);
  const currentDate = new Date();

  const daysDelayed = differenceInCalendarDays(currentDate, dueDate);
  const incDocV2 = v2Documents?.find(doc => INC20A_REGEX.test(doc.document_name));
  const incDocV3 = v3Documents?.find(doc => INC20A_REGEX.test(doc.formId));

  // Initialize default fee values
  const normalFee = calculateInc20NormalFee(authorizedShareCapital); // Calculate normal fee based on authorized share capital

  let additionalFee = daysDelayed > 0 ? calculateAdditionalFee(normalFee, daysDelayed) : 0;
  let filingStatus = daysDelayed > 0 ? `${daysDelayed} days overdue` : 'Not Filed'; // Default status
  let filingDate = 'Not filed'; // Default filing date

  if (incDocV3 || incDocV2) {
    filingDate = incDocV3?.dateOfFiling // Check if incDocV3 exists and has dateOfFiling
      ? parse(incDocV3.dateOfFiling, 'dd/MM/yyyy', new Date()).toDateString()
      : incDocV2?.date_of_filing // If not, check if incDocV2 exists and has date_of_filing
        ? parse(incDocV2.date_of_filing, 'dd/MM/yyyy', new Date()).toDateString()
        : 'Not filed'; // Set filing date to 'Not filed' if neither incDocV3 nor incDocV2 has valid date information

    const daysDelayed = differenceInCalendarDays(filingDate, dueDate);

    // If the filing was delayed, calculate the additional fee
    if (daysDelayed > 0) {
      filingStatus = `${daysDelayed} days delay in filing`;
      additionalFee = calculateAdditionalFee(normalFee, daysDelayed);
    } else {
      filingStatus = 'On Time Filing';
      additionalFee = 0;
    }
  } else if (isBefore(currentDate, dueDate)) {
    const daysRemaining = differenceInCalendarDays(dueDate, currentDate);
    filingStatus = `${daysRemaining} days left to file`;
    filingDate = 'Not filed';
  }

  result.push({
    formCode: formDetails?.formCode,
    formName: formDetails?.formName,
    formDescription: formDetails?.formDescription,
    dueDate: format(dueDate, 'dd-MMM-yyyy'),
    filingStatus,
    filingDate: filingDate === 'Not filed' ? filingDate : format(filingDate, 'dd-MMM-yyyy'),
    normalFee: isApplicable ? normalFee.toString() : '-',
    additionalFee: isApplicable ? additionalFee.toString() : '-',
    isApplicable,
  });

  return result;
};

// Helper function for normal fee calculation
function calculateInc20NormalFee(authorizedShareCapital: number) {
  if (authorizedShareCapital < 100000) return 200;
  if (authorizedShareCapital < 500000) return 300;
  if (authorizedShareCapital < 2500000) return 400;
  if (authorizedShareCapital < 10000000) return 500;
  return 600; // For 10,000,000 or more
}

function calculateAdditionalFee(normalFee: number, delayDays: number) {
  if (delayDays <= 30) {
    return 2 * normalFee;
  } else if (delayDays <= 60) {
    return 4 * normalFee;
  } else if (delayDays <= 90) {
    return 6 * normalFee;
  } else if (delayDays <= 180) {
    return 10 * normalFee;
  } else {
    return 12 * normalFee;
  }
}
