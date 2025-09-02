/* eslint-disable indent */
import { addDays, addYears, differenceInCalendarDays, format, parse } from 'date-fns';
import { TAnnualEFilingFormResponse } from '../company.interface';

type TLlpVpdDocsForm8 = {
  documentCode?: number;
  formId: string;
  fileName?: string;
  year?: number;
  dateOfFiling: string;
  documentCategory?: string;
  description?: string;
  dscUploadDate?: string;
  paymentDate?: string;
  additionalFees?: number;
  eventDate?: string;
  normalFees?: number;
};

const formDetails = {
  formCode: 'LLP Form 8',
  formName: 'Statement of Account & Solvency',
  formDescription:
    'A Statement of Account & Solvency is a financial document that summarizes income, expenses, and financial health in straightforward terms.',
};

export const calculateLlpForm8DueDateAndFee = (
  LlpVpdDocs: TLlpVpdDocsForm8[],
  incorporationDate: string,
  totalObligationOfContribution: number
): TAnnualEFilingFormResponse[] => {
  // Regex for LLP Form 8
  const LLPFORM8_REGEX = /LLP Form 8/i;

  // filter llp form 8 data
  const filteredForm8Docs =
    LlpVpdDocs?.filter(doc => doc.formId && LLPFORM8_REGEX.test(doc.formId) && doc.eventDate) || [];

  // console.log('llpForm8Data', filteredForm8Docs);

  const result: TAnnualEFilingFormResponse[] = [];

  const incorpDate = parse(incorporationDate, 'dd-MMM-yyyy', new Date());
  const startYear = incorpDate.getFullYear() < 2015 ? 2015 : incorpDate.getFullYear();
  const adjustedIncorpDate = new Date(startYear, incorpDate.getMonth(), incorpDate.getDate());
  const isSmallLiabilityPartnership = totalObligationOfContribution <= 2500000; // contribution is upto ₹25 lakh and has a previous year turnover of up to ₹40 lakh
  const currentDate = new Date();
  const calculatedNormalFee = calculateLlpForm8NormalFee(totalObligationOfContribution);

  // Calculate financial years and due dates
  let financialYearStartDate = new Date(
    incorpDate.getFullYear(),
    incorpDate.getMonth(),
    incorpDate.getDate()
  );
  if (adjustedIncorpDate < new Date(adjustedIncorpDate.getFullYear(), 3, 1)) {
    financialYearStartDate = new Date(adjustedIncorpDate.getFullYear() - 1, 3, 1);
  } else {
    financialYearStartDate = new Date(adjustedIncorpDate.getFullYear(), 3, 1);
  }
  const financialYears = [];
  while (financialYearStartDate <= addYears(currentDate, 1)) {
    const financialYearEndDate = new Date(financialYearStartDate.getFullYear() + 1, 2, 31); // End of the financial year (31st March)
    const eventDate = addDays(financialYearEndDate, 183); // 31st March + 6 months (30th September)
    // const dueDate = addDays(eventDate, 30); // Event date + 30 days (30th October)

    let dueDate;

    // Check for COVID-19 period extensions
    if (financialYearEndDate.getFullYear() === 2021) {
      dueDate = new Date(financialYearEndDate.getFullYear(), 11, 30); // 30th December 2021 (e-File No: Policy-01/2/2021-CL-V-MCA)
    } else {
      dueDate = addDays(eventDate, 30); // Event date + 30 days (30th October)
    }

    financialYears.push({
      start: financialYearStartDate,
      end: financialYearEndDate,
      eventDate,
      dueDate,
    });
    financialYearStartDate = addYears(financialYearStartDate, 1);
  }

  financialYears.forEach(fy => {
    const matchedDocument = filteredForm8Docs.find(doc => {
      const formDate = doc.eventDate ? parse(doc?.eventDate, 'dd/MM/yyyy', new Date()) : null;
      return formDate ? formDate >= fy.start && formDate <= fy.end : false;
    });

    const isFinancialYear22 =
      format(fy.start, 'yyyy') === '2021' && format(fy.end, 'yyyy') === '2022';

    // if in this year the form has not been filed
    if (isFinancialYear22 && !matchedDocument) {
      result.push({
        formCode: formDetails?.formCode,
        formName: formDetails?.formName,
        formDescription: formDetails?.formDescription,
        isSmallLiabilityPartnership: isSmallLiabilityPartnership,
        incorpDate: format(incorpDate, 'dd-MMM-yyyy'),
        financialYear: `${format(fy.start, 'yyyy')}-${format(fy.end, 'yyyy')}`,
        dueDate: format(fy.dueDate, 'dd-MMM-yyyy'),
        filingStatus:
          'MCA is upgrading from v2 to v3, and data for the financial year 2021-22 is temporarily unavailable.',
        filingDate: '-',
        normalFee: calculatedNormalFee,
        additionalFee: 0,
        isAdditionalFeeManuallyAdded: false,
      });
    } else if (!matchedDocument || matchedDocument === undefined) {
      const daysDelayed = differenceInCalendarDays(currentDate, fy.dueDate);
      let filingStatus = '';
      let additionalFee = 0;

      if (daysDelayed > 0) {
        filingStatus = `${daysDelayed} ${daysDelayed > 1 ? 'days' : 'day'} overdue`;
        additionalFee = calculateLlpForm8AdditionalFee(
          daysDelayed,
          isSmallLiabilityPartnership,
          calculatedNormalFee,
          fy.start
        );
      } else {
        const daysLeft = differenceInCalendarDays(fy.dueDate, currentDate);
        filingStatus = `${daysLeft} ${daysLeft > 1 ? 'days' : 'day'} left to file`;
        additionalFee = 0;
      }

      result.push({
        formCode: formDetails?.formCode,
        formName: formDetails?.formName,
        formDescription: formDetails?.formDescription,
        isSmallLiabilityPartnership: isSmallLiabilityPartnership,
        incorpDate: format(incorpDate, 'dd-MMM-yyyy'),
        financialYear: `${format(fy.start, 'yyyy')}-${format(fy.end, 'yyyy')}`,
        // agmDate: format(fy.eventDate, 'dd-MMM-yyyy'),
        dueDate: format(fy.dueDate, 'dd-MMM-yyyy'),
        filingStatus: filingStatus,
        filingDate: 'Not Filed',
        normalFee: calculatedNormalFee,
        additionalFee: additionalFee,
        isAdditionalFeeManuallyAdded:
          additionalFee > 0 && fy.end.getFullYear() < currentDate.getFullYear() ? true : false,
      });
    } else {
      // if in this year the form has been filed
      const filingDate = parse(matchedDocument.dateOfFiling, 'dd/MM/yyyy', new Date());

      const daysDelayed = differenceInCalendarDays(filingDate, fy.dueDate);
      let filingStatus = '';
      let additionalFee = 0;
      let isAdditionalFeeManuallyAdded = false;

      const normalFee = matchedDocument.normalFees || calculatedNormalFee;

      if (daysDelayed > 0) {
        filingStatus = `${daysDelayed} ${daysDelayed > 1 ? 'days' : 'day'} delay in filing`;
        if (matchedDocument.additionalFees && matchedDocument.additionalFees >= 0) {
          additionalFee = matchedDocument.additionalFees;
        } else {
          additionalFee = calculateLlpForm8AdditionalFee(
            daysDelayed,
            isSmallLiabilityPartnership,
            normalFee,
            fy.start
          );
          isAdditionalFeeManuallyAdded =
            additionalFee > 0 && fy.end.getFullYear() < currentDate.getFullYear() ? true : false;
        }
      } else {
        filingStatus = 'Filed on time';
        additionalFee = 0;
      }

      result.push({
        formCode: formDetails?.formCode,
        formName: formDetails?.formName,
        formDescription: formDetails?.formDescription,
        isSmallLiabilityPartnership: isSmallLiabilityPartnership,
        incorpDate: format(incorpDate, 'dd-MMM-yyyy'),
        financialYear: `${format(fy.start, 'yyyy')}-${format(fy.end, 'yyyy')}`,
        // agmDate: format(fy.eventDate, 'dd-MMM-yyyy'),
        dueDate: format(fy.dueDate, 'dd-MMM-yyyy'),
        filingStatus: filingStatus,
        filingDate: format(filingDate, 'dd-MMM-yyyy'),
        normalFee: normalFee,
        additionalFee: additionalFee,
        isAdditionalFeeManuallyAdded: isAdditionalFeeManuallyAdded,
      });
    }
  });

  return result;
};

// Helper functions
const calculateLlpForm8NormalFee = (totalObligationOfContribution: number): number => {
  if (totalObligationOfContribution <= 100000) return 50;
  if (totalObligationOfContribution <= 500000) return 100;
  if (totalObligationOfContribution <= 1000000) return 150;
  if (totalObligationOfContribution <= 2500000) return 200;
  if (totalObligationOfContribution <= 10000000) return 400;
  return 600;
};

const calculateLlpForm8AdditionalFee = (
  daysDelayed: number,
  isSmallLlp: boolean,
  normalFee: number,
  financialYearStart: Date
): number => {
  const post2022 = financialYearStart.getFullYear() >= 2022;

  let additionalFee = 0;

  if (post2022) {
    if (daysDelayed <= 15) {
      additionalFee = normalFee;
    } else if (daysDelayed <= 30) {
      additionalFee = isSmallLlp ? normalFee * 2 : normalFee * 4;
    } else if (daysDelayed <= 60) {
      additionalFee = isSmallLlp ? normalFee * 4 : normalFee * 8;
    } else if (daysDelayed <= 90) {
      additionalFee = isSmallLlp ? normalFee * 6 : normalFee * 12;
    } else if (daysDelayed <= 180) {
      additionalFee = isSmallLlp ? normalFee * 10 : normalFee * 20;
    } else if (daysDelayed <= 360) {
      additionalFee = isSmallLlp ? normalFee * 15 : normalFee * 30;
    } else {
      if (isSmallLlp) {
        additionalFee = normalFee * 15 + (daysDelayed - 360) * 10;
      } else {
        additionalFee = normalFee * 30 + (daysDelayed - 360) * 20;
      }
    }
  } else {
    // Pre-2022 rules
    additionalFee = daysDelayed * 100;
  }

  return additionalFee;
};
