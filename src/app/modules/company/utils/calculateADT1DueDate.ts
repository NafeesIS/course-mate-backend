/* eslint-disable quotes */
import {
  addDays,
  compareAsc,
  differenceInCalendarDays,
  format,
  isAfter,
  isBefore,
  parse,
} from 'date-fns';
import { TAnnualEFilingForm, TOneTimeComplianceResponse } from '../company.interface';
import { tryParseDate } from './helperFunctions';

const formDetails = {
  formCode: 'ADT-1',
  formName: 'Information to the Registrar by Company for appointment of Auditor',
  formDescription: "Company's notification to the registrar about appointing an auditor.",
};
export const calculateADT1DueDateAndFee = (
  incorporationDate: string,
  authorizedShareCapital: number,
  documents: TAnnualEFilingForm[]
): TOneTimeComplianceResponse[] => {
  // const formDetails = getFormDetailsByEFormName('Form ADT-1'); //getting form details based on E-form name
  const currentDate = new Date();
  const result = [];
  const incorpDate = parse(incorporationDate, 'dd-MMM-yyyy', new Date());
  // const isApplicable = isAfter(incorpDate, new Date(2015, 2, 31));
  const isApplicable = isAfter(incorpDate, new Date(2014, 2, 31));

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

  const adt1Documents = documents?.filter(
    doc =>
      doc.eformName === 'Form ADT-1' &&
      doc.paymentStatus?.status === 'PAID' &&
      doc.eventDate !== '-'
  );

  // Convert event dates to Date objects and sort to find the earliest.
  const sortedAdt1Documents =
    adt1Documents &&
    adt1Documents
      .map(doc => ({
        ...doc,
        eventDateObj: parse(doc.eventDate, 'dd/MM/yyyy', new Date()),
      }))
      .sort((a, b) => compareAsc(a.eventDateObj, b.eventDateObj));

  const adt1Doc = sortedAdt1Documents?.length > 0 ? sortedAdt1Documents[0] : null;

  let dueDate = addDays(incorpDate, 45);
  let filingDate: Date | string = 'Not filed';

  let filingStatus = 'Not Filed'; // Default status
  let normalFee;
  let additionalFee = 0;

  // Check if ADT-1 has been filed and assign the filing date
  if (adt1Doc && adt1Doc.paymentStatus && adt1Doc.paymentStatus.paidOn) {
    // Assuming there is at least one ADT-1 document
    const filingDateObj = tryParseDate(adt1Doc.paymentStatus.paidOn);
    filingDate = filingDateObj ? filingDateObj : 'Not filed';

    normalFee = adt1Doc.paymentStatus.normalFee; // Use the provided fee
    additionalFee = adt1Doc.paymentStatus.additionalFee ? adt1Doc.paymentStatus.additionalFee : 0; // Use the provided additional fee

    //calculating due date
    dueDate = addDays(adt1Doc.eventDateObj, 15);

    //Old logic to calculate due date for reference
    // // first check if company is before financial year  2014-2015
    // if (isBefore(incorpDate, new Date(2014, 2, 31))) {
    //   // If company is before financial year 2014-2015 due date will be event date + 15
    //   dueDate = addDays(adt1Doc.eventDateObj, 15);
    // } else {
    //   if (isBefore(currentDate, addDays(incorporationDate, 45))) {
    //     // If today is less than 45 days from the date of incorporation
    //     dueDate = addDays(incorporationDate, 45);
    //     // console.log({ dueDate });
    //   } else {
    //     // If 45 days have been passed since the date of incorporation
    //     const assumedDateOfMeeting = addDays(incorporationDate, 90);
    //     dueDate = addDays(assumedDateOfMeeting, 15); // Due date is 15 days after the assumed date of meeting
    //   }
    // }

    const daysDelayed = differenceInCalendarDays(filingDate, dueDate);
    //if normal fee is not there then calculate it manually
    if (!normalFee) {
      normalFee = calculateADT1NormalFee(authorizedShareCapital);

      additionalFee = daysDelayed > 0 ? calculateADT1AdditionalFee(normalFee, daysDelayed) : 0; // Calculate additional fee if the due date has passed
    }

    if (daysDelayed > 0) {
      filingStatus = `${daysDelayed} days delay in filing`;
    } else {
      filingStatus = 'On Time Filing';
    }
  } else {
    if (isBefore(currentDate, addDays(incorporationDate, 45))) {
      // if No Srn Data present then Calculate due date based on the scenarios manually
      // If today is less than 45 days from the date of incorporation
      dueDate = addDays(incorporationDate, 45);
      // console.log({ dueDate });
    } else {
      // If 45 days have been passed since the date of incorporation
      const assumedDateOfMeeting = addDays(incorporationDate, 90);
      dueDate = addDays(assumedDateOfMeeting, 15); // Due date is 15 days after the assumed date of meeting
    }
    const daysDelayed = differenceInCalendarDays(currentDate, dueDate);

    // Manually calculate the fees if they are not provided
    if (!normalFee) {
      normalFee = calculateADT1NormalFee(authorizedShareCapital);

      additionalFee = daysDelayed > 0 ? calculateADT1AdditionalFee(normalFee, daysDelayed) : 0; // Calculate additional fee if the due date has passed
    }

    // if due date is still before the current date
    if (daysDelayed > 0) {
      filingStatus = `${daysDelayed} days delay in filing`;
    } else if (isBefore(currentDate, dueDate)) {
      const daysRemaining = differenceInCalendarDays(dueDate, currentDate);
      filingStatus = `${daysRemaining} days left to file`;
    } else {
      filingStatus = `${daysDelayed} days overdue`;
    }
  }

  result.push({
    formCode: formDetails.formCode,
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

function calculateADT1NormalFee(authorizedShareCapital: number) {
  if (authorizedShareCapital < 100000) return 200;
  if (authorizedShareCapital < 500000) return 300;
  if (authorizedShareCapital < 2500000) return 400;
  if (authorizedShareCapital < 10000000) return 500;
  return 600; // For 10,000,000 or more
}

function calculateADT1AdditionalFee(normalFee: number, delayDays: number) {
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
