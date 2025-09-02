import { DirectorModel } from '../../director/director.model';
import { TDirectorData, TDirectorRole } from '../company.interface';

interface DirectorResponse {
  din: string;
  fullName: string;
  dateOfAppointment: string;
  designation: string;
  totalDirectorship: number;
  isPromoter: boolean;
}

interface PastDirectorResponse {
  din: string;
  fullName: string;
  designation: string;
  appointmentDate: string;
  cessationDate: string;
}

export const getRegExDesignation = (companyType: string, companyOrigin: string): RegExp | null => {
  if (companyType.toLowerCase() === 'company' && companyOrigin?.toLowerCase() === 'indian') {
    return /^(Nominee Director|Managing Director|Additional Director|Whole-time director|Alternate Director|Director appointed in casual vacancy|Director)$/;
  } else if (companyType?.toLowerCase() === 'llp') {
    return /^(Designated Partner|Nominee for Body corporate designated partner)$/;
  } else if (
    companyType?.toLowerCase() === 'company' &&
    companyOrigin?.toLowerCase() === 'foreign'
  ) {
    return /^(Authorised Representative)$/;
  }
  return null;
};

export const filterCurrentDirectors = (
  directorsData: TDirectorData[],
  cin: string,
  regExDesignation: RegExp | null
  // isCurrent: boolean
): TDirectorData[] => {
  if (!regExDesignation) return [];

  return directorsData?.filter(director => {
    // Find the role that matches the CIN
    const matchingRoles = (director.MCAUserRole as TDirectorRole[])?.filter(
      role => role.cin === cin
    );
    if (!matchingRoles || matchingRoles.length === 0) return false;

    // Check if any of the matching roles have a valid designation
    const hasValidDesignation = matchingRoles.some(role => {
      // console.log(director.FirstName, 'designation', role.designation);
      return regExDesignation.test(role.designation);
    });
    if (!hasValidDesignation) return false;

    // Check if any of the matching roles have 'Signatory' as personType
    return matchingRoles.some(role => role.personType === 'Signatory');
  });
};

// export const filterPastDirectors = (
//   directorsData: TDirectorData[],
//   currentDirectors: TDirectorData[],
//   cin: string,
//   regExDesignation: RegExp | null
// ): TDirectorData[] => {
//   return directorsData?.filter(director => {
//     if (!director || !director.DIN || (!director.DIN && (!director.PAN || director.PAN === '')))
//       return false;

//     // Check if director is in currentDirectors list
//     const isInCurrentDirectors = currentDirectors.some(
//       currentDirector => currentDirector.DIN === director.DIN
//     );

//     if (isInCurrentDirectors) {
//       return false; // if they are a current director, they can't be a past director
//     }

//     // Check if director had some association with the company
//     return director.MCAUserRole?.some(
//       role => role.cin === cin && regExDesignation?.test(role.designation)
//     );
//   });
// };

export const filterPastDirectors = async (
  directorsData: TDirectorData[],
  cin: string,
  regExDesignation: RegExp | null
): Promise<PastDirectorResponse[]> => {
  // console.log('inside past director filter', directorsData);
  if (!regExDesignation) return [];

  const pastDirectorsInfo: PastDirectorResponse[] = [];
  const processedDins = new Set<string>();

  for (const director of directorsData) {
    // console.log(director);
    if (processedDins.has(director.DIN)) {
      continue; // Skip if this DIN has already been processed
    }

    processedDins.add(director.DIN);
    // Fetch cessation history from the database
    // console.log(director.DIN);
    const directorDoc = await DirectorModel.findOne({
      din: director.DIN,
    })
      .select('mcaSignatoryCessationMasterHistory fullName')
      .lean();

    if (directorDoc && directorDoc.mcaSignatoryCessationMasterHistory) {
      // console.log(`Processing director: ${directorDoc.fullName}`);

      // Filter cessation history for matching CIN and valid designation
      directorDoc.mcaSignatoryCessationMasterHistory.forEach(history => {
        if (history.cin === cin && regExDesignation.test(history.designation)) {
          pastDirectorsInfo.push({
            din: history.din,
            fullName: directorDoc.fullName,
            designation: history.designation,
            appointmentDate: history.appointmentDate,
            cessationDate: history.cessationDate,
          });
        }
      });
    }
  }
  // console.log(pastDirectorsInfo);
  return pastDirectorsInfo;
};

export const filterExecutiveTeam = (
  directorsData: TDirectorData[],
  cin: string,
  regExDesignation: RegExp | null
  // isCurrent: boolean
): TDirectorData[] => {
  if (!regExDesignation) return [];
  // const executiveDesignations = [
  //   'Managing Director',
  //   'CEO',
  //   'CFO',
  //   'Manager',
  //   'Company Secretary',
  //   'Individual Subscriber',
  // ];

  return directorsData.filter(director => {
    return (director.MCAUserRole as TDirectorRole[])?.some(role => {
      return role.cin === cin && regExDesignation.test(role.designation);
    });
  });
};

export const formatDirector = (
  director: TDirectorData,
  cin: string,
  regExDesignation: RegExp | null
): DirectorResponse => {
  // Format name
  const nameParts = [director.FirstName, director.MiddleName, director.LastName].filter(Boolean);
  const fullName = nameParts.join(' ').replace(/\./g, '');

  // Find the matching role for designation
  const matchingRole = (director.MCAUserRole as TDirectorRole[])?.find(role => {
    // role.ucin === cin && regExDesignation?.test(role.designation);
    const associatedCompany = role.cin === cin;
    if (!associatedCompany) return false;

    return regExDesignation?.test(role.designation);
  });

  const designation = matchingRole ? matchingRole.designation : '-';

  // const hasValidDesignation = director.MCAUserRole?.some(role =>
  //   regExDesignation?.test(role.designation)
  // );

  // find total directorship
  const totalDirectorship = (director.MCAUserRole as TDirectorRole[])?.filter(
    role => role.designation === designation
  ).length;

  // isDisqualified = director.MCAUserRole?.some(role => role.isDisqualified === 'Y');
  const isPromoter = (director.MCAUserRole as TDirectorRole[])?.some(role =>
    role.cin === cin &&
    (role.designation?.includes('Individual Promoter') ||
      role.roleLICValue?.includes('Individual Promoter'))
      ? 'Yes'
      : 'No'
  );

  const selectedCompanyAppointmentDate = (director.MCAUserRole as TDirectorRole[])?.find(role => {
    const isAssociatedCompany = role.cin === cin;
    if (!isAssociatedCompany) return false;
    return role.currentDesignationDate;
  });

  // You can expand this object to include more formatted information as needed
  return {
    din: director.DIN,
    fullName,
    dateOfAppointment: selectedCompanyAppointmentDate
      ? selectedCompanyAppointmentDate.currentDesignationDate
      : 'N/A',
    designation,
    totalDirectorship,
    isPromoter,
    // Add other fields here as necessary, following the same pattern.
  };
};
