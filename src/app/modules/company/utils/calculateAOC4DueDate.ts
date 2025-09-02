/* eslint-disable camelcase */
/* eslint-disable indent */
import {
  addDays,
  differenceInCalendarDays,
  format,
  getYear,
  isAfter,
  isBefore,
  parse,
} from 'date-fns';
import { TAnnualEFilingForm, TAnnualEFilingFormResponse } from '../company.interface';
import {
  calculate_AOC4_Mgt7_AdditionalFee,
  calculate_AOC4_Mgt7_NormalFee,
  getComplianceFilingStatus,
  getFormDetailsByEFormName,
  parseDateWithMultipleFormats,
} from './helperFunctions';

// getting earliest paid AOC-4 document from SRN annual fillings doc
const findEarliestPaidAOC4Document = (documents: TAnnualEFilingForm[]) => {
  const paidAOC4Documents =
    documents &&
    documents
      .filter(
        doc =>
          // doc.eformName === 'Form AOC-4' && doc.paymentStatus && doc.paymentStatus.status === 'PAID'
          (doc?.eformName === 'Form AOC-4' || doc?.eformName === 'Form AOC-4(XBRL)') &&
          doc?.paymentStatus?.status === 'PAID' &&
          (doc?.eventDate !== '-' || doc?.paymentStatus?.financialYearEnding)
      )
      .sort(
        (a, b) =>
          parse(a.eventDate, 'dd/MM/yyyy', new Date()).getTime() -
          parse(b.eventDate, 'dd/MM/yyyy', new Date()).getTime()
      );
  return paidAOC4Documents.length > 0 ? paidAOC4Documents[0] : null;
};

export const calculateAOC4DueDate = (
  incorporationDate: string,
  authorizedShareCapital: number,
  documents: TAnnualEFilingForm[]
): TAnnualEFilingFormResponse[] => {
  const formDetails = getFormDetailsByEFormName('Form AOC-4'); //getting form details based on E-form name
  const dateFormats = ['dd/MM/yyyy', 'dd-MM-yyyy', 'MM/dd/yyyy', 'MM-dd-yyyy']; // to convert paid on date
  const incorpDate = parse(incorporationDate, 'dd-MMM-yyyy', new Date());
  const result = [];
  let baseYear = getYear(incorpDate);

  // Filter and map only AOC-4 documents that are paid to their SRN, filing status, and filing date
  const aoc4FilingInfo =
    documents &&
    documents
      .filter(
        doc =>
          (doc?.eformName === 'Form AOC-4' || doc?.eformName === 'Form AOC-4(XBRL)') &&
          doc?.paymentStatus?.status === 'PAID' &&
          (doc?.eventDate !== '-' || doc?.paymentStatus?.financialYearEnding)
      )
      .map(doc => ({
        eventDate:
          doc.eventDate === '-'
            ? parse(doc.paymentStatus.financialYearEnding, 'dd/MM/yyyy', new Date())
            : parse(doc.eventDate, 'dd/MM/yyyy', new Date()),
        // eventDate:
        //   doc.eventDate === '-'
        //     ? parse(doc.paymentStatus.financialYearEnding, 'dd/MM/yyyy', new Date())
        //     : parse(doc.eventDate, 'dd/MM/yyyy', new Date()),
        filingStatus: doc.paymentStatus.status,
        filingDate: doc.paymentStatus.paidOn,
        normalFee: doc.paymentStatus.normalFee,
        additionalFee: doc.paymentStatus.additionalFee,
      }));

  let firstFinancialYear,
    firstDueDate,
    agmDate,
    isLateAgmHeld = false;

  // Find the earliest paid AOC-4 document if available to possibly adjust the base year
  const earliestPaidDocument =
    documents?.length > 0 ? findEarliestPaidAOC4Document(documents) : null;

  if (earliestPaidDocument) {
    const eventDate =
      earliestPaidDocument.eventDate === '-'
        ? parse(earliestPaidDocument.paymentStatus.financialYearEnding, 'dd/MM/yyyy', new Date())
        : parse(earliestPaidDocument.eventDate, 'dd/MM/yyyy', new Date());

    baseYear = getYear(eventDate);

    firstFinancialYear = `${baseYear - 1}-${baseYear}`; // Adjust financial year based on the earliest paid AOC-4 document
    agmDate = new Date(baseYear - 1 + 1, 11, 31);

    // Adjust AGM date if AGM  held after due date of default AGM
    if (earliestPaidDocument && isAfter(earliestPaidDocument.eventDate, agmDate)) {
      agmDate = earliestPaidDocument.eventDate; //change agm date original held agm date in form
      isLateAgmHeld = true;
    }

    if (earliestPaidDocument.eventDate === '-' && isBefore(incorpDate, new Date(2008, 3, 1))) {
      agmDate = new Date('09/30/2009');
      // Adjust AGM date if AGM  held after due date of default AGM
      if (earliestPaidDocument && isAfter(earliestPaidDocument.eventDate, agmDate)) {
        agmDate = earliestPaidDocument.eventDate; //change agm date original held agm date in form
        isLateAgmHeld = true;
      }
    }
    firstDueDate = addDays(agmDate, 29);
  }

  // If document is not available, Special handling for the first year based on incorporation date
  else if (isBefore(incorpDate, new Date(2008, 2, 31))) {
    baseYear = 2008;
    //
    firstFinancialYear = `${baseYear}-${baseYear + 1}`;
    // agmDate = new Date(getYear(incorpDate) + 1, 11, 31);
    agmDate = new Date('09/30/2009');
    firstDueDate = addDays(agmDate, 29);
  } else {
    firstFinancialYear = `${baseYear}-${baseYear + 1}`;
    agmDate = new Date(getYear(incorpDate) + 1, 11, 31);
    firstDueDate = addDays(agmDate, 29);
  }

  // Process the first financial year

  const firstYearInfo = aoc4FilingInfo?.find(info => getYear(info.eventDate) === baseYear);
  const firstYearFilingDate = firstYearInfo?.filingDate
    ? (() => {
        const parsedDate = parseDateWithMultipleFormats(firstYearInfo.filingDate, dateFormats);
        return parsedDate ? parsedDate.toDateString() : firstYearInfo.filingDate;
      })()
    : 'Not filed';

  const periodOfDelay = isLateAgmHeld
    ? differenceInCalendarDays(agmDate, new Date(baseYear - 1 + 1, 11, 31))
    : 0;

  result.push({
    formCode: formDetails?.formCode ? formDetails.formCode : 'Not found Needs to be fixed',
    formDescription: formDetails?.formDescription,
    formName: formDetails?.formName,
    financialYear: firstFinancialYear,
    // agmDate: agmDate.toLocaleDateString(),
    isLateAgmHeld,
    agmDate: format(agmDate, 'dd-MMM-yyyy'),
    periodOfDelay,
    // dueDate: firstDueDate.toLocaleDateString(),
    dueDate: format(firstDueDate, 'dd-MMM-yyyy'),
    filingStatus: getComplianceFilingStatus(firstYearFilingDate, firstDueDate, getYear(agmDate)),
    filingDate:
      firstYearFilingDate === 'Not filed'
        ? firstYearFilingDate
        : format(firstYearFilingDate, 'dd-MMM-yyyy'),

    normalFee: firstYearInfo?.normalFee || calculate_AOC4_Mgt7_NormalFee(authorizedShareCapital),
    additionalFee:
      firstYearInfo?.additionalFee !== undefined && firstYearInfo?.additionalFee !== null
        ? firstYearInfo.additionalFee
        : calculate_AOC4_Mgt7_AdditionalFee(firstYearFilingDate, firstDueDate),
  });

  // Calculate due dates for subsequent years
  const currentYear = new Date().getFullYear();
  for (let year = baseYear; year <= currentYear + 1; year++) {
    // Adjust loop to start from the next year after baseYear
    const financialYear = `${year}-${year + 1}`;

    if (financialYear !== firstFinancialYear) {
      let isLateAgmHeld = false;
      let agmDate = new Date(year + 1, 8, 30); // AGM on 30th September of the current year
      // Avoid duplicating the first year
      const filingInfo = aoc4FilingInfo?.find(info => getYear(info.eventDate) === getYear(agmDate));

      // Adjust AGM date if AGM  held after due date
      if (filingInfo && isAfter(filingInfo.eventDate, agmDate)) {
        agmDate = filingInfo.eventDate;
        isLateAgmHeld = true;
      }
      const dueDate = addDays(agmDate, 29);
      // const isDueDatePassed = isBefore(dueDate, new Date()); // Check if due date has passed
      const periodOfDelay = differenceInCalendarDays(agmDate, new Date(year + 1, 8, 30));

      const filingDate = filingInfo?.filingDate
        ? (() => {
            const parsedDate = parseDateWithMultipleFormats(filingInfo.filingDate, dateFormats);
            return parsedDate ? parsedDate.toDateString() : filingInfo.filingDate;
          })()
        : 'Not filed';
      // let filingDate =
      //   filingInfo?.filingDate &&
      //   (() => {
      //     const parsedDate = parseDateWithMultipleFormats(filingInfo?.filingDate, dateFormats);
      //     return parsedDate ? parsedDate.toDateString() : null;
      //   })();

      // if (!filingDate) {
      //   filingDate = 'Not filed';
      // }
      const normalFee =
        filingInfo?.normalFee || calculate_AOC4_Mgt7_NormalFee(authorizedShareCapital);
      const additionalFee =
        filingInfo?.additionalFee !== undefined && filingInfo?.additionalFee !== null
          ? filingInfo?.additionalFee
          : calculate_AOC4_Mgt7_AdditionalFee(filingDate, dueDate);

      const yearResult: TAnnualEFilingFormResponse = {
        formCode: formDetails?.formCode ? formDetails.formCode : 'Not found Needs to be fixed',
        formDescription: formDetails?.formDescription,
        formName: formDetails?.formName,
        financialYear,
        // agmDate: agmDate.toLocaleDateString(),
        isLateAgmHeld,
        agmDate: format(agmDate, 'dd-MMM-yyyy'),
        periodOfDelay,
        // dueDate: dueDate.toLocaleDateString(),
        dueDate: format(dueDate, 'dd-MMM-yyyy'),
        filingStatus: getComplianceFilingStatus(filingDate, dueDate, year),
        filingDate: filingDate === 'Not filed' ? filingDate : format(filingDate, 'dd-MMM-yyyy'),
        normalFee,
        additionalFee,
      };

      result.push(yearResult);
    }
  }

  return result;
};
