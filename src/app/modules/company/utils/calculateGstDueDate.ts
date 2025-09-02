import { differenceInDays, format, parse } from 'date-fns';
import { TFilingFrequency, TFilingInfo } from '../company.interface';

// const sampleData = {
//   // your sample data
// };

// const filings = sampleData.filings[0].filingInfo;
// const filingFrequency = sampleData.filings[0].filingFrequency;
// const turnoverDetails = sampleData.filings[0].turnoverDetails;

//filling frequency from filling frequency field
export function getFilingFrequency(
  filingFrequency: TFilingFrequency[],
  fy: string,
  taxPeriod: string
): 'Monthly' | 'Quarterly' | null {
  // type Month =
  //   | 'January'
  //   | 'February'
  //   | 'March'
  //   | 'April'
  //   | 'May'
  //   | 'June'
  //   | 'July'
  //   | 'August'
  //   | 'September'
  //   | 'October'
  //   | 'November'
  //   | 'December';

  const quarters: { [key: string]: string } = {
    January: 'Q4',
    February: 'Q4',
    March: 'Q4',
    April: 'Q1',
    May: 'Q1',
    June: 'Q1',
    July: 'Q2',
    August: 'Q2',
    September: 'Q2',
    October: 'Q3',
    November: 'Q3',
    December: 'Q3',
  };
  const quarter = quarters[taxPeriod];
  // console.log('filingFrequency', filingFrequency);
  // console.log('tax Period:', taxPeriod, 'quarter:', quarter);
  for (const frequency of filingFrequency) {
    if (frequency.fy === fy && frequency.quarter === quarter) {
      return frequency.preference === 'M' ? 'Monthly' : 'Quarterly';
    }
  }
  return null;
}

//get filling frequncy based on period on filling info
// function determineFilingFrequency(
//   filingFrequency: TFilingFrequency[],
//   fy: string,
//   taxPeriod: string
// ): 'Monthly' | 'Quarterly' | null {
//   const periods = filingFrequency.map(freq => freq.quarter);
//   const uniquePeriods = Array.from(new Set(periods));

//   if (
//     uniquePeriods.length >= 3 &&
//     uniquePeriods.every((period, index, arr) => {
//       return (
//         index === 0 ||
//         new Date(`${taxPeriod} ${fy.split('-')[1]}`).getMonth() -
//           new Date(`${arr[index - 1]} ${fy.split('-')[1]}`).getMonth() ===
//           1
//       );
//     })
//   ) {
//     return 'Monthly';
//   }

//   if (
//     uniquePeriods.length >= 1 &&
//     uniquePeriods.every((period, index, arr) => {
//       return (
//         index === 0 ||
//         new Date(`${taxPeriod} ${fy.split('-')[1]}`).getMonth() -
//           new Date(`${arr[index - 1]} ${fy.split('-')[1]}`).getMonth() ===
//           3
//       );
//     })
//   ) {
//     return 'Quarterly';
//   }

//   return null;
// }

function getGSTR1DueDate(taxPeriod: string, frequency: 'Monthly' | 'Quarterly' | null): string {
  const [month, year] = taxPeriod.split('-');
  const dueDay = frequency === 'Monthly' ? 11 : 13;
  const monthIndex = new Date(`${month} ${year}`).getMonth();
  const dueDateYear = monthIndex >= 0 && monthIndex <= 2 ? year : String(Number(year) - 1); // Adjust the year based on the financial year
  const dueDate = format(new Date(Number(dueDateYear), monthIndex + 1, dueDay), 'dd-MMM-yyyy');

  return dueDate;
}

function getGstr3bDueDate(
  taxPeriod: string,
  filingFreq: 'Monthly' | 'Quarterly' | null,
  turnover: number | null,
  state: string
): string {
  // const taxPeriod = `${filing.taxp}-${filing.fy.split('-')[1]}`;
  const stateGroup1 = [
    'Chhattisgarh',
    'Madhya Pradesh',
    'Gujarat',
    'Maharashtra',
    'Karnataka',
    'Goa',
    'Kerala',
    'Tamil Nadu',
    'Telangana',
    'Andhra Pradesh',
    'Daman & Diu',
    'Dadra & Nagar Haveli',
    'Puducherry',
    'Andaman and Nicobar Islands',
    'Lakshadweep',
  ];

  // const stateGroup2 = [
  //   'Himachal Pradesh',
  //   'Punjab',
  //   'Uttarakhand',
  //   'Haryana',
  //   'Rajasthan',
  //   'Uttar Pradesh',
  //   'Bihar',
  //   'Sikkim',
  //   'Arunachal Pradesh',
  //   'Nagaland',
  //   'Manipur',
  //   'Mizoram',
  //   'Tripura',
  //   'Meghalaya',
  //   'Assam',
  //   'West Bengal',
  //   'Jharkhand',
  //   'Odisha',
  //   'Jammu and Kashmir',
  //   'Ladakh',
  //   'Chandigarh',
  //   'Delhi',
  // ];
  const [month, year] = taxPeriod.split('-');
  const monthIndex = new Date(`${month} ${year}`).getMonth();
  const dueDateYear = monthIndex >= 0 && monthIndex <= 2 ? year : String(Number(year) - 1); // Adjust the year based on the financial year
  const dueDay = 20;
  let dueDate;

  if (turnover !== null && turnover > 50000000) {
    dueDate = format(new Date(Number(dueDateYear), monthIndex + 1, dueDay), 'dd-MMM-yyyy');
  } else {
    // const filingFreq = determineFilingFrequency(
    //   gstFiling.filingFrequency,
    //   filing.fy,
    //   filing.taxp as Month
    // );
    if (filingFreq === 'Monthly') {
      dueDate = format(new Date(Number(dueDateYear), monthIndex + 1, dueDay), 'dd-MMM-yyyy');
    } else {
      const group1 = stateGroup1.includes(state);
      dueDate = format(
        new Date(Number(dueDateYear), monthIndex + 1, group1 ? 22 : 24),
        'dd-MMM-yyyy'
      );
    }
  }

  return dueDate;
}

function extractStateFromStj(stj: string): string {
  const stateRegex = /State - ([^,]+)/;
  const match = stj.match(stateRegex);
  return match ? match[1] : '';
}

// function normalizeFiscalYear(fy: string): string {
//   const parts = fy.split('-');
//   if (parts.length === 2 && parts[1].length === 2) {
//     const startYear = parts[0];
//     const endYear = (parseInt(parts[0]) + 1).toString();
//     return `${startYear}-${endYear}`;
//   }
//   return fy;
// }

// function parseTurnover(turnoverSlab: string): number {
//   const turnoverRegex = /Slab:\s*Rs\.\s*([\d.]+)\s*Cr\.\s*to\s*([\d.]+)\s*Cr\./;
//   const match = turnoverRegex.exec(turnoverSlab);
//   console.log(match, 'match');

//   if (match) {
//     const lowerLimit = parseFloat(match[1]) * 10000000; // Convert crores to rupees
//     const upperLimit = parseFloat(match[2]) * 10000000; // Convert crores to rupees
//     // You can choose to return either limit based on your needs, here we assume the upper limit for calculation

//     return upperLimit;
//   }
//   throw new Error('Invalid turnover string format');
// }

function parseTurnover(turnover: string): number | null {
  const crRegex = /Rs\. (\d+(\.\d+)?) (crore|cr)/i;
  const lakhRegex = /Rs\. (\d+(\.\d+)?) (lakh|l)/i;
  const slabRegex = /Slab: Rs\. (\d+) to (\d+) (lakhs|crore)/i;

  let match = turnover.match(crRegex);
  if (match) {
    return parseFloat(match[1]) * 10000000; // 1 crore = 10,000,000
  }

  match = turnover.match(lakhRegex);
  if (match) {
    return parseFloat(match[1]) * 100000; // 1 lakh = 100,000
  }

  match = turnover.match(slabRegex);
  if (match) {
    const lowerBound = parseFloat(match[1]);
    const upperBound = parseFloat(match[2]);
    const unit = match[3].toLowerCase();

    let factor = 1;
    if (unit === 'lakhs' || unit === 'lakh') {
      factor = 100000; // 1 lakh = 100,000
    } else if (unit === 'crore' || unit === 'cr') {
      factor = 10000000; // 1 crore = 10,000,000
    }

    // Return the average of the lower and upper bounds
    return ((lowerBound + upperBound) / 2) * factor;
  }

  return null;
}

function calculateGSTR1LateFee(
  dueDate: string,
  filingDate: string,
  turnoverSlab: string,
  status: string
): { lateFee: number; daysLate: number } {
  let daysLate;
  const currentDate = new Date();
  if (status === 'Filed') {
    daysLate = differenceInDays(
      parse(filingDate, 'dd/MM/yyyy', new Date()),
      parse(dueDate, 'dd-MMM-yyyy', new Date())
    );
  } else {
    daysLate = differenceInDays(currentDate, parse(dueDate, 'dd-MMM-yyyy', new Date()));
  }

  if (daysLate <= 0) {
    return { lateFee: 0, daysLate: 0 }; // No late fee if there is no delay
  }

  let lateFeePerDay = 0;
  let maxLateFee = 0;

  let turnover = parseTurnover(turnoverSlab);
  if (!turnover) {
    turnover = 0;
  }
  if (turnover > 50000000) {
    lateFeePerDay = 50; // 25 (CGST) + 25 (SGST)
    maxLateFee = 10000; // 5000 (CGST) + 5000 (SGST)
  } else if (turnover > 15000000) {
    lateFeePerDay = 50;
    maxLateFee = 5000; // 2500 (CGST) + 2500 (SGST)
  } else {
    lateFeePerDay = 50;
    maxLateFee = 2000; // 1000 (CGST) + 1000 (SGST)
  }

  const totalLateFee = daysLate * lateFeePerDay;
  const lateFee = Math.min(totalLateFee, maxLateFee);
  return { lateFee, daysLate };
}

function calculateGstr3bLateFee(
  dueDate: string,
  filingDate: string,
  status: string
): { lateFee: number; daysLate: number } {
  let daysLate;
  const currentDate = new Date();
  if (status === 'Filed') {
    daysLate = differenceInDays(
      parse(filingDate, 'dd/MM/yyyy', new Date()),
      parse(dueDate, 'dd-MMM-yyyy', new Date())
    );
  } else {
    daysLate = differenceInDays(currentDate, parse(dueDate, 'dd-MMM-yyyy', new Date()));
  }
  if (daysLate <= 0) {
    return { lateFee: 0, daysLate: 0 }; // No late fee if there is no delay
  }

  const lateFeePerDay = 50; // CGST 25 + SGST 25
  const totalLateFee = daysLate * lateFeePerDay;
  return { lateFee: totalLateFee, daysLate };
}

export function processGSTR1Filing(
  filing: TFilingInfo,
  filingFrequency: TFilingFrequency[],
  turnoverSlab: string
) {
  const taxPeriod = `${filing.taxp}-${filing.fy.split('-')[1]}`;

  const fy = filing.fy;
  const filingFreq = getFilingFrequency(filingFrequency, fy, filing.taxp);
  const dueDate = getGSTR1DueDate(taxPeriod, filingFreq);

  const lateFee = calculateGSTR1LateFee(dueDate, filing.dof, turnoverSlab, filing.status);

  return {
    rtntype: filing.rtntype,
    fy: filing.fy,
    taxPeriod: filing.taxp,
    filingFreq: filingFreq,
    dueDate: dueDate,
    filingDate: format(parse(filing.dof, 'dd/MM/yyyy', new Date()), 'dd-MMM-yyyy'),
    status: filing.status,
    lateFee: lateFee.lateFee,
    periodOfDelay: lateFee.daysLate,
  };
}

export function processGstr3bFiling(
  filing: TFilingInfo,
  filingFrequency: TFilingFrequency[],
  turnoverSlab: string,
  taxPayerState: string
) {
  const taxPeriod = `${filing.taxp}-${filing.fy.split('-')[1]}`;
  const fy = filing.fy;
  const filingFreq = getFilingFrequency(filingFrequency, fy, filing.taxp);

  const turnover = parseTurnover(turnoverSlab);
  const state = extractStateFromStj(taxPayerState);

  const dueDate = getGstr3bDueDate(taxPeriod, filingFreq, turnover, state);

  const lateFee = calculateGstr3bLateFee(dueDate, filing.dof, filing.status);

  return {
    rtntype: filing.rtntype,
    fy: filing.fy,
    taxPeriod: filing.taxp,
    filingFreq: filingFreq,
    dueDate: dueDate,
    filingDate: format(parse(filing.dof, 'dd/MM/yyyy', new Date()), 'dd-MMM-yyyy'),
    status: filing.status,
    lateFee: lateFee.lateFee,
    periodOfDelay: lateFee.daysLate,
  };
}
