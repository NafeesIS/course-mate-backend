/* eslint-disable indent */
import { addYears, differenceInCalendarDays, format, parse } from 'date-fns';
import { TAnnualEFilingFormResponse, TLlpData } from '../company.interface';

const formDetails = {
  formCode: 'LLP Form 11',
  formName: 'Annual Return of Limited Liability Partnership',
  formDescription:
    // eslint-disable-next-line quotes
    "The Annual Return of an LLP is a yearly report that outlines basic information about the LLP's status and activities in a simple and concise manner.",
};

export const calculateLlpForm11DueDateAndFee = (
  LlpData: TLlpData, // Assuming LlpData contains both vpdDocs and annual_e_filing_forms
  incorporationDate: string,
  totalObligationOfContribution: number
): TAnnualEFilingFormResponse[] => {
  const { vpdDocs, annualEfilingForms } = LlpData;
  const allForm11Documents = [...(vpdDocs || []), ...(annualEfilingForms || [])];

  // Regular expressions to identify LLP Form 11 in vpdDocs and annualEForms
  const VPDDOCS_REGEX = /LLP Form 11/i;
  const ANNUAL_E_FORM_REGEX = /Form11/i;

  // Filter documents related to LLP Form 11 from vpdDocs
  const filteredForm11Docs =
    allForm11Documents.filter(
      doc =>
        (VPDDOCS_REGEX.test(doc.formId) && doc.eventDate && doc.s3Url) ||
        (ANNUAL_E_FORM_REGEX.test(doc.formId) && doc.eventDate && doc.status === 'PAID')
    ) || [];

  // console.log('filteredForm11Docs', filteredForm11Docs);

  const result: TAnnualEFilingFormResponse[] = [];

  const incorpDate = parse(incorporationDate, 'dd-MMM-yyyy', new Date());
  const startYear = incorpDate.getFullYear() < 2015 ? 2015 : incorpDate.getFullYear();
  const adjustedIncorpDate = new Date(startYear, incorpDate.getMonth(), incorpDate.getDate());
  const isSmallLiabilityPartnership = totalObligationOfContribution <= 2500000; // contribution is upto ₹25 lakh and has a previous year turnover of up to ₹40 lakh
  const currentDate = new Date();
  const calculatedNormalFee = calculateLlpForm11NormalFee(totalObligationOfContribution);

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
    const eventDate = financialYearEndDate; // Financial year end date (31st March)
    // const dueDate = new Date(financialYearEndDate.getFullYear(), 4, 30); // 30th May

    let dueDate;

    // Check for COVID-19 period extensions
    if (financialYearEndDate.getFullYear() === 2020) {
      dueDate = new Date(financialYearEndDate.getFullYear(), 11, 31); // 31st December 2020 (extended due date under LLP Settlement Scheme)
    } else {
      dueDate = new Date(financialYearEndDate.getFullYear(), 4, 30); // 30th May (default due date)
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
    const matchedDocument = filteredForm11Docs.find(doc => {
      return doc.eventDate === format(fy.eventDate, 'dd/MM/yyyy');
    });

    const isFinancialYear22 =
      format(fy.start, 'yyyy') === '2021' && format(fy.end, 'yyyy') === '2022';

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
        additionalFee = calculateLlpForm11AdditionalFee(
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
      const filingDate = matchedDocument.dateOfFiling
        ? parse(matchedDocument.dateOfFiling, 'dd/MM/yyyy', new Date())
        : parse(matchedDocument.paymentDate, 'dd/MM/yyyy', new Date());

      const daysDelayed = differenceInCalendarDays(filingDate, fy.dueDate);
      let filingStatus = '';
      let additionalFee = 0;
      let isAdditionalFeeManuallyAdded = false;

      const normalFee =
        matchedDocument.normalFees && matchedDocument.normalFees >= 0
          ? matchedDocument.normalFees
          : calculatedNormalFee;

      if (daysDelayed > 0) {
        filingStatus = `${daysDelayed} ${daysDelayed > 1 ? 'days' : 'day'} delay in filing`;
        if (matchedDocument.additionalFees !== undefined && matchedDocument.additionalFees >= 0) {
          additionalFee = matchedDocument.additionalFees;
        } else {
          additionalFee = calculateLlpForm11AdditionalFee(
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

// Function to calculate Normal Fee based on the total obligation of contribution
const calculateLlpForm11NormalFee = (totalObligationOfContribution: number): number => {
  if (totalObligationOfContribution <= 100000) {
    return 50;
  } else if (totalObligationOfContribution <= 500000) {
    return 100;
  } else if (totalObligationOfContribution <= 1000000) {
    return 150;
  } else if (totalObligationOfContribution <= 2500000) {
    return 200;
  } else if (totalObligationOfContribution <= 10000000) {
    return 400;
  } else {
    return 600;
  }
};

// Function to calculate Additional Fee based on the delay period and LLP type
const calculateLlpForm11AdditionalFee = (
  daysDelayed: number,
  isSmallLiabilityPartnership: boolean,
  normalFee: number,
  financialYearStartDate: Date
): number => {
  const isPost2022 = financialYearStartDate.getFullYear() >= 2022;

  if (isPost2022) {
    if (daysDelayed <= 15) {
      return isSmallLiabilityPartnership ? normalFee : normalFee;
    } else if (daysDelayed > 15 && daysDelayed <= 30) {
      return isSmallLiabilityPartnership ? normalFee * 2 : normalFee * 4;
    } else if (daysDelayed > 30 && daysDelayed <= 60) {
      return isSmallLiabilityPartnership ? normalFee * 4 : normalFee * 8;
    } else if (daysDelayed > 60 && daysDelayed <= 90) {
      return isSmallLiabilityPartnership ? normalFee * 6 : normalFee * 12;
    } else if (daysDelayed > 90 && daysDelayed <= 180) {
      return isSmallLiabilityPartnership ? normalFee * 10 : normalFee * 20;
    } else if (daysDelayed > 180 && daysDelayed <= 360) {
      return isSmallLiabilityPartnership ? normalFee * 15 : normalFee * 30;
    } else {
      // Beyond 360 days
      return isSmallLiabilityPartnership
        ? normalFee * 15 + 10 * daysDelayed
        : normalFee * 30 + 20 * daysDelayed;
    }
  } else {
    // Pre-2022 rules
    return daysDelayed * 100;
  }
};
