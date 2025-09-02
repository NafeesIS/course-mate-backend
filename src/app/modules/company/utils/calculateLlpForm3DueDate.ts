import { addDays, differenceInCalendarDays, format, parse } from 'date-fns';
import { TVpdForm } from '../../vpdAnalysis/vpdAnalysis.interface';

const formDetails = {
  formCode: 'LLP Form 3',
  formName:
    'Information with regard to Limited Liability Partnership Agreement and changes, if any, made therein.',
  formDescription:
    // eslint-disable-next-line quotes
    "LLP Form 3 is a mandatory filing for documenting the LLP Agreement and any subsequent changes. It ensures that the MCA has up-to-date information about the internal governance and structure of the LLP, providing transparency and legal clarity regarding the partnership's functioning.",
};

export const calculateLlpForm3DueDateAndFee = (
  LlpVpdDocs: TVpdForm[],
  incorporationDate: string,
  totalObligationOfContribution: number
) => {
  const LLPFORM3_REGEX = /LLP Form 3/i;
  const incorpDate = parse(incorporationDate, 'dd-MMM-yyyy', new Date());
  const isSmallLiabilityPartnership = totalObligationOfContribution <= 2500000; // contribution is upto ₹25 lakh and has a previous year turnover of up to ₹40 lakh

  const result = [];
  const llpForm3Data = LlpVpdDocs?.find(doc => LLPFORM3_REGEX.test(doc.formId));
  const dueDate = addDays(incorpDate, 30);
  const currentDate = new Date();
  const normalFee = calculateLlpForm3NormalFee(totalObligationOfContribution);

  let filingStatus = '';
  let additionalFee = 0;

  if (!llpForm3Data) {
    const daysDelayed = differenceInCalendarDays(currentDate, dueDate);
    if (daysDelayed > 0) {
      filingStatus = `${daysDelayed} days overdue`;
      additionalFee = calculateLlpForm3AdditionalFee(
        daysDelayed,
        isSmallLiabilityPartnership,
        normalFee
      );
    } else {
      const daysLeft = differenceInCalendarDays(dueDate, currentDate);
      filingStatus = `${daysLeft} days left to file`;
      additionalFee = 0;
    }

    result.push({
      formCode: formDetails?.formCode,
      formName: formDetails?.formName,
      formDescription: formDetails?.formDescription,
      isSmallLiabilityPartnership: isSmallLiabilityPartnership,
      incorpDate: format(incorpDate, 'dd-MMM-yyyy'),
      dueDate: format(dueDate, 'dd-MMM-yyyy'),
      filingStatus: filingStatus,
      filingDate: 'Not filed',
      normalFee: normalFee,
      additionalFee: additionalFee,
    });

    return result;
  }

  // IF LLP Form 3 exists
  const filingDate = llpForm3Data?.dateOfFiling
    ? parse(llpForm3Data?.dateOfFiling, 'dd/MM/yyyy', new Date()).toDateString()
    : '-';

  if (filingDate) {
    const daysDelayed = differenceInCalendarDays(filingDate, dueDate);
    if (daysDelayed <= 0) {
      filingStatus = 'On Time Filing';
      additionalFee = 0;
    } else {
      filingStatus = `${daysDelayed} days delay in filing`;
      additionalFee = calculateLlpForm3AdditionalFee(
        daysDelayed,
        isSmallLiabilityPartnership,
        normalFee
      );
    }
  } else {
    const daysLeft = differenceInCalendarDays(dueDate, currentDate);
    filingStatus = `${daysLeft} days left to file`;
  }

  result.push({
    formCode: formDetails?.formCode,
    formName: formDetails?.formName,
    formDescription: formDetails?.formDescription,
    isSmallLiabilityPartnership: isSmallLiabilityPartnership,
    incorpDate: format(incorpDate, 'dd-MMM-yyyy'),
    dueDate: format(dueDate, 'dd-MMM-yyyy'),
    filingStatus: filingStatus,
    filingDate: format(filingDate, 'dd-MMM-yyyy'),
    normalFee: normalFee,
    additionalFee: additionalFee,
  });

  return result;
};

// Helper functions
const calculateLlpForm3NormalFee = (totalObligationOfContribution: number) => {
  if (totalObligationOfContribution <= 100000) return 50;
  if (totalObligationOfContribution <= 500000) return 100;
  if (totalObligationOfContribution <= 1000000) return 150;
  if (totalObligationOfContribution <= 2500000) return 200;
  if (totalObligationOfContribution <= 10000000) return 400;
  return 600;
};

const calculateLlpForm3AdditionalFee = (
  daysDelayed: number,
  isSmallLlp: boolean,
  normalFee: number
) => {
  let multiplier = 0;

  // Up to 15 days delay
  if (daysDelayed <= 15) {
    multiplier = 1; // 1 times the normal fee for both small and other LLPs
  }
  // More than 15 days and up to 30 days delay
  else if (daysDelayed <= 30) {
    multiplier = isSmallLlp ? 2 : 4; // 2 times the normal fee for small LLPs, 4 times for other LLPs
  }
  // More than 30 days and up to 60 days delay
  else if (daysDelayed <= 60) {
    multiplier = isSmallLlp ? 4 : 8; // 4 times the normal fee for small LLPs, 8 times for other LLPs
  }
  // More than 60 days and up to 90 days delay
  else if (daysDelayed <= 90) {
    multiplier = isSmallLlp ? 6 : 12; // 6 times the normal fee for small LLPs, 12 times for other LLPs
  }
  // More than 90 days and up to 180 days delay
  else if (daysDelayed <= 180) {
    multiplier = isSmallLlp ? 10 : 20; // 10 times the normal fee for small LLPs, 20 times for other LLPs
  }
  // More than 180 days and up to 360 days delay
  else if (daysDelayed <= 360) {
    multiplier = isSmallLlp ? 15 : 30; // 15 times the normal fee for small LLPs, 30 times for other LLPs
  }
  // Beyond 360 days delay
  else {
    multiplier = isSmallLlp ? 25 : 50; // 25 times the normal fee for small LLPs, 50 times for other LLPs
  }

  return normalFee * multiplier; // return the additional fee based on the multiplier
};
