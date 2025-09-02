/* eslint-disable camelcase */
import { differenceInDays, differenceInHours } from 'date-fns';
import httpStatus from 'http-status';
import FacetQueryBuilder from '../../builder/FacetQueryBuilder';
import SearchQueryBuilder from '../../builder/SearchQueryBuilder';
import AppError from '../../errors/AppError';
import { toTitleCase } from '../../utils/dataFormatter';
import {
  sendEmailWithAzure,
  sendUnlockContactDetailsToWhatsapp,
} from '../../utils/notification/notification';
import directorContactDetailsEmail from '../../utils/notification/templates/directorContactDetailsEmail';
import { TDirectorRole } from '../company/company.interface';
import { CompanyModel } from '../company/company.model';
import { directorSearchSuggestionProjectStage } from './director.constant';
import { DirectorModel } from './director.model';
import triggerDirectorContactUpdater from './utils/triggerDirectorContactUpdater';
import triggerDirectorMDUpdater from './utils/triggerDirectorMDUpdater';

const getDirectorSuggestionsFromDB = async (query: Record<string, unknown>) => {
  // Define a regex pattern to check if the search term is a valid CIN
  const dinPattern = /^\d{8}$/;
  const isDINSearch = dinPattern.test(query.searchTerm as string);

  let directorSuggestionsPipeline;

  //giving exact match for the search term if it is CIN
  if (isDINSearch) {
    directorSuggestionsPipeline = [
      {
        $match: { din: query.searchTerm },
      },
      {
        $addFields: {
          filteredCompanyData: {
            $filter: {
              input: '$companyData',
              as: 'company',
              cond: {
                $in: [
                  '$$company.designation',
                  [
                    'Nominee Director',
                    'Managing Director',
                    'Additional Director',
                    'Whole-time director',
                    'Alternate Director',
                    'Director appointed in casual vacancy',
                    'Director',
                    'Designated Partner',
                    'Nominee for Body corporate designated partner',
                    'Authorised Representative',
                  ],
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          totalDirectorshipCount: { $size: '$filteredCompanyData' },
        },
      },
      directorSearchSuggestionProjectStage,
    ];
  } else {
    // Fuzzy search for director name
    directorSuggestionsPipeline = [
      {
        $search: {
          index: 'directorAutocomplete', // name for search index
          compound: {
            should: [
              {
                autocomplete: {
                  query: query.searchTerm,
                  path: 'fullName',
                  // fuzzy: { maxEdits: 1 },
                  tokenOrder: 'any',
                },
              },
              {
                text: {
                  query: query.searchTerm,
                  path: 'fullName',
                  fuzzy: {
                    maxEdits: 1,
                    prefixLength: 0,
                  },
                },
              },
            ],
          },

          // autocomplete: {
          //   query: query.searchTerm,
          //   // path: ['firstName', 'middleName', 'lastName'],
          //   path: 'fullName',
          //   fuzzy: { maxEdits: 1 },
          //   tokenOrder: 'sequential',
          // },
          // highlight: { path: 'company' },
        },
      },
      {
        $addFields: {
          filteredCompanyData: {
            $filter: {
              input: '$companyData',
              as: 'company',
              cond: {
                $in: [
                  '$$company.designation',
                  [
                    'Nominee Director',
                    'Managing Director',
                    'Additional Director',
                    'Whole-time director',
                    'Alternate Director',
                    'Director appointed in casual vacancy',
                    'Director',
                    'Designated Partner',
                    'Nominee for Body corporate designated partner',
                    'Authorised Representative',
                  ],
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          totalDirectorshipCount: { $size: '$filteredCompanyData' },
        },
      },
      { $limit: 20 },
      directorSearchSuggestionProjectStage,
    ];
  }

  const result = await DirectorModel.aggregate(directorSuggestionsPipeline);
  return result;
};

const getDirectorAdvanceSearchFromDB = async (query: Record<string, unknown>) => {
  let page = 1;
  let limit = 1000;
  let skip = 0;
  if (query.limit) {
    limit = Number(query.limit);
  }
  if (query.page) {
    page = Number(query.page);
    skip = (page - 1) * limit;
  }

  // Define a regex pattern to check if the search term is a valid CIN
  const dinPattern = /^\d{8}$/;
  const searchTerm = query.searchTerm as string;
  const isDINSearch = dinPattern.test(searchTerm);

  let directorSuggestionsPipeline;

  const queryBuilder = new SearchQueryBuilder('directorFullTextSearch');

  // Mandatory search criteria: fuzzy search on the company name
  if (query.searchTerm) {
    queryBuilder.addMustFilter({
      text: {
        query: query.searchTerm as string,
        path: 'fullName',
        fuzzy: { maxEdits: 1 },
      },
    });
  }

  if (query.status) {
    queryBuilder.addFilter({
      text: {
        query: query.status as string,
        path: 'status',
      },
    });
  }

  // Build the final search query
  const searchQuery = queryBuilder.build();

  if (isDINSearch) {
    directorSuggestionsPipeline = [
      {
        $match: { din: searchTerm.toLocaleUpperCase() },
      },
      {
        $addFields: {
          filteredCompanyData: {
            $filter: {
              input: '$companyData',
              as: 'company',
              cond: {
                $in: [
                  '$$company.designation',
                  [
                    'Nominee Director',
                    'Managing Director',
                    'Additional Director',
                    'Whole-time director',
                    'Alternate Director',
                    'Director appointed in casual vacancy',
                    'Director',
                    'Designated Partner',
                    'Nominee for Body corporate designated partner',
                    'Authorised Representative',
                  ],
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          totalDirectorshipCount: { $size: '$filteredCompanyData' },
        },
      },
      directorSearchSuggestionProjectStage,
      // {
      //   $facet: {
      //     metadata: [{ $count: 'total' }],
      //     data: [{ $skip: skip }, { $limit: limit }, directorSearchSuggestionProjectStage],
      //   },
      // },
      // searchSuggestionProjectStage,
    ];
  } else {
    // Fuzzy search for company name
    directorSuggestionsPipeline = [
      {
        $search: searchQuery,
      },

      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $addFields: {
          filteredCompanyData: {
            $filter: {
              input: '$companyData',
              as: 'company',
              cond: {
                $in: [
                  '$$company.designation',
                  [
                    'Nominee Director',
                    'Managing Director',
                    'Additional Director',
                    'Whole-time director',
                    'Alternate Director',
                    'Director appointed in casual vacancy',
                    'Director',
                    'Designated Partner',
                    'Nominee for Body corporate designated partner',
                    'Authorised Representative',
                  ],
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          totalDirectorshipCount: { $size: '$filteredCompanyData' },
        },
      },
      directorSearchSuggestionProjectStage,

      // {
      //   $facet: {
      //     metadata: [{ $count: 'total' }],
      //     data: [
      //       {
      //         $addFields: {
      //           filteredCompanyData: {
      //             $filter: {
      //               input: '$companyData',
      //               as: 'company',
      //               cond: {
      //                 $in: [
      //                   '$$company.designation',
      //                   [
      //                     'Nominee Director',
      //                     'Managing Director',
      //                     'Additional Director',
      //                     'Whole-time director',
      //                     'Alternate Director',
      //                     'Director appointed in casual vacancy',
      //                     'Director',
      //                     'Designated Partner',
      //                     'Nominee for Body corporate designated partner',
      //                     'Authorised Representative',
      //                   ],
      //                 ],
      //               },
      //             },
      //           },
      //         },
      //       },
      //       {
      //         $addFields: {
      //           totalDirectorshipCount: { $size: '$filteredCompanyData' },
      //         },
      //       },
      //       { $skip: skip },
      //       { $limit: limit },
      //       directorSearchSuggestionProjectStage,
      //     ],
      //   },
      // },
    ];
  }

  const result = await DirectorModel.aggregate(directorSuggestionsPipeline);
  return result;

  // if (result.length > 0 && result[0]?.metadata?.length > 0) {
  //   const facets = result[0];
  //   const totalResults = facets.metadata[0].total;
  //   const totalPages = Math.ceil(totalResults / limit);
  //   if (page > totalPages) {
  //     throw new AppError(
  //       httpStatus.NOT_FOUND,
  //       `Requested page number: ${page} exceeds total available pages: ${totalPages}.`
  //     );
  //   }

  //   return {
  //     totalResults: totalResults,
  //     currentPage: page,
  //     limit: limit,
  //     totalPages: Math.ceil(facets.metadata[0].total / limit),
  //     directors: facets.data,
  //   };
  // } else {
  //   if (page > 1) {
  //     throw new AppError(
  //       httpStatus.NOT_FOUND,
  //       `Requested page number: ${page} exceeds total available pages. Ass there are no results.`
  //     );
  //   }
  //   return {
  //     total: 0,
  //     currentPage: page,
  //     pageSize: limit,
  //     totalPages: 0,
  //     companies: [],
  //   };
  // }
};

const getCompanyAdvanceSearchFacetsFromDB = async (query: Record<string, unknown>) => {
  const queryBuilder = new FacetQueryBuilder('directorFullTextSearch');
  // Mandatory search criteria: fuzzy search on the company name
  if (query.searchTerm) {
    queryBuilder.addMustFilter({
      text: {
        query: query.searchTerm as string,
        path: 'fullName',
        fuzzy: { maxEdits: 1 },
      },
    });
  }
  if (query.status) {
    queryBuilder.addFilter({
      text: {
        query: query.status as string,
        path: 'status',
      },
    });
  }

  queryBuilder.addFacet('statusFacet', 'status', 'string', 100);
  // // Build the final facet query
  const facetQuery = queryBuilder.build();

  const result = await DirectorModel.aggregate([
    {
      $searchMeta: facetQuery,
    },
  ]);

  return result;
};

const getSingleDirectorDetailsFromDB = async (query: Record<string, unknown>) => {
  const director = await DirectorModel.findOne(
    { din: query.din },
    {
      din: '$din',
      fullName: '$fullName',
      dob: '$dob',
      gender: '$gender',
      nationality: '$nationality',
      personType: '$personType',
      status: '$status',
      // companyData: '$companyData',
      companyData: {
        $map: {
          input: '$companyData',
          as: 'company',
          in: {
            ucin: '$$company.ucin',
            din: '$$company.din',
            cin_LLPIN: '$$company.cin_LLPIN',
            nameOfTheCompany: '$$company.nameOfTheCompany',
            role: '$$company.role',
            roleEffectiveDate: '$$company.roleEffectiveDate',
            cessationDate: '$$company.cessationDate',
            directorFlag: '$$company.directorFlag',
            designation: '$$company.designation',
            accountType: '$$company.accountType',
            dinAllocationDate: '$$company.dinAllocationDate',
            companyStatus: '$$company.companyStatus',
            companyType: '$$company.companyType',
            roleLICValue: '$$company.roleLICValue',
            companyClass: '$$company.companyClass',
            companyOrigin: '$$company.companyOrigin',
            personType: '$$company.personType',
            directorCategory: '$$company.directorCategory',
            signatoryAssociationStatus: '$$company.signatoryAssociationStatus',
            isDisqualified: '$$company.isDisqualified',
            currentDesignationDate: '$$company.currentDesignationDate',
          },
        },
      },
      // companySignatory: '$companySignatory',
      mcaSignatoryCessationMasterHistory: '$mcaSignatoryCessationMasterHistory',
      updatedAt: '$updatedAt',
    }
  ).lean();

  if (!director) {
    return null;
  }

  return director;
};

export const getAssociatedDirectorsFromDB = async (query: Record<string, unknown>) => {
  try {
    const { din } = query;

    // get cin_LLPINs of companies associated with the director
    const aggregationPipeline = [
      { $match: { din: din } },
      { $unwind: '$companyData' },
      {
        $group: {
          _id: '$companyData.cin_LLPIN',
        },
      },
      {
        $project: {
          _id: 0,
          cin_LLPIN: '$_id',
        },
      },
      { $limit: 8 },
    ];
    const directorResults = await DirectorModel.aggregate(aggregationPipeline);
    // Extract only cin_LLPINs in an array
    const cin_LLPINs = directorResults.map(result => result.cin_LLPIN);

    if (cin_LLPINs.length === 0) {
      return [];
    }

    // get all companies details associated with the director
    const companyResults = await CompanyModel.find(
      {
        cin: { $in: cin_LLPINs },
      },
      {
        _id: 0,
        'masterData.directorData.DIN': 1,
        'masterData.directorData.FirstName': 1,
        'masterData.directorData.MiddleName': 1,
        'masterData.directorData.LastName': 1,
        'masterData.directorData.MCAUserRole': 1,
      },
      { $limit: 8 }
    );

    // extract only relevant data and ensure that there are no duplicates
    const extractedData: {
      DIN: string;
      fullName: string;
      company: { companyName: string; designation: string }[];
    }[] = [];

    companyResults.forEach(company => {
      company.masterData.directorData.forEach(director => {
        if (
          director.DIN.length > 0 &&
          (director.MCAUserRole as TDirectorRole[]).length > 0 &&
          director.DIN !== din
        ) {
          // ensure that there are no duplicate entries based on DIN
          let existingEntry = extractedData.find(entry => entry.DIN === director.DIN);
          if (!existingEntry) {
            existingEntry = {
              DIN: director.DIN,
              fullName: `${director.FirstName} ${director.MiddleName} ${director.LastName}`,
              company: [],
            };
            extractedData.push(existingEntry);
          }

          // ensure that there are no duplicate entries based on company name
          const finalEntry = existingEntry;
          (director.MCAUserRole as TDirectorRole[]).forEach(role => {
            const existingCompany = finalEntry.company.find(
              c => c.companyName === role.companyName
            );

            if (!existingCompany) {
              finalEntry.company.push({
                companyName: role.companyName,
                designation: role.designation,
              });
            }
          });
        }
      });
    });

    return extractedData.slice(0, 8);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in getAssociatedDirectorsFromDB:', error);
    return [];
  }
};

const checkContactStatusFromDB = async (query: Record<string, unknown>) => {
  const din = query.din as string;
  let director = await DirectorModel.findOne(
    { din: din },
    { _id: 0, mobileNumber: 1, emailAddress: 1, contactUpdated: 1, hideContactInfo: 1 }
  ).lean();

  // Check if update is needed
  const updateThresholdDays = 30; // Update if older than 7 days
  const needsUpdate =
    !director?.contactUpdated ||
    differenceInDays(new Date(), director.contactUpdated) > updateThresholdDays;

  let updateStatus = 'not_needed';

  if (needsUpdate) {
    try {
      await triggerDirectorContactUpdater(din);

      updateStatus = 'triggered';

      // Polling for update
      const maxAttempts = 10;
      const delayBetweenAttempts = 1000; // 1000ms

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts));

        const updatedDirector = await DirectorModel.findOne(
          { din },
          {
            _id: 0,
            mobileNumber: 1,
            emailAddress: 1,
            contactUpdated: 1,
            hideContactInfo: 1,
          }
        ).lean();

        if (updatedDirector?.contactUpdated !== director?.contactUpdated) {
          director = updatedDirector;
          updateStatus = 'completed';
          break;
        }

        if (updateStatus !== 'completed') {
          updateStatus = 'in_progress';
        }
      }

      // Return null if update wasn't completed after max attempts
      if (updateStatus !== 'completed') {
        return null;
      }
    } catch (error) {
      console.error('Error in checkContactStatusFromDB:', error);
      updateStatus = 'failed';
      return null;
    }
  }

  if (!director) {
    return null;
  }

  const { mobileNumber, emailAddress, contactUpdated, hideContactInfo } = director;

  // If hideContactInfo is true, return null for both email and mobile
  if (hideContactInfo) {
    return {
      emailAddress: null,
      mobileNumber: null,
      contactUpdated,
      updateStatus,
    };
  }

  // Mask email to show the last two characters before '@' and keep the '@'
  const atIndex = emailAddress?.indexOf('@');
  const maskedEmail = emailAddress
    ? '*****' + emailAddress.slice(atIndex - 2, atIndex + 1) + emailAddress.split('@')[1]
    : null;

  // Mask mobile number to show only the last four digits
  const maskedMobile = mobileNumber ? '*****' + mobileNumber.slice(-4) : null;

  // const isEmailValid = !director.emailAddress.includes('*****');
  // const isMobileValid = !director.mobileNumber.includes('*****');

  return {
    emailAddress: maskedEmail,
    mobileNumber: maskedMobile,
    contactUpdated,
    updateStatus,
  };
};

const getPaidContactDetailsFromDB = async (
  din: string,
  isPaymentVerified: boolean,
  verifiedServiceId: string,
  remainingRedemptions: number,
  maxRedemptions: number,
  customerEmail: string | null,
  customerPhone: string | null,
  amount: number,
  currency: string,
  orderId: string
) => {
  if (!isPaymentVerified || din !== verifiedServiceId) {
    return {
      message: 'Payment is not verified for this DIN',
      data: null,
    };
  }

  const director = (await DirectorModel.findOne(
    { din: din },
    { _id: 0, mobileNumber: 1, emailAddress: 1, fullName: 1, din: 1 }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ).lean()) as any;

  // const director = (await OldDirectorWithContactModel.findOne(
  //   { ID: din },
  //   { _id: 0, 'directorData.mobileNumber': 1, 'directorData.emailAddress': 1 }
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // ).lean()) as any;

  if (!director) {
    return {
      message: 'Director data not available',
      data: null,
    };
  }

  //send email and sms to the customer with the contact details
  if (customerPhone) {
    await sendUnlockContactDetailsToWhatsapp({
      phoneNumbers: [customerPhone],
      components: {
        body_1: director.din,
        body_2: toTitleCase(director.fullName),
        body_3: director.mobileNumber,
        body_4: director.emailAddress,
      },
    });
  }

  if (customerEmail && customerEmail !== 'void@razorpay.com') {
    const emailContent = directorContactDetailsEmail({
      directorName: director.fullName,
      directorMobile: director.mobileNumber,
      directorEmail: director.emailAddress,
      din: director.din,
      orderId,
      amount,
      currency,
    });
    // const ccEmail = ['nazrul@filesure.in', 'tushar@filesure.in'];
    await sendEmailWithAzure(
      customerEmail,
      'Director Contact Details - Filesure',
      emailContent
      // ccEmail
    );
  }
  // const isEmailValid = !director.emailAddress.includes('*****');
  // const isMobileValid = !director.mobileNumber.includes('*****');

  director.remainingRedemptions = remainingRedemptions;
  director.maxRedemptions = maxRedemptions;
  return {
    message: 'Director data fetched successfully',
    data: director,
  };
};

const createDirectorMasterDataUpdateRequest = async (din: string) => {
  const director = await DirectorModel.findOne({ din });
  if (!director) {
    throw new AppError(httpStatus.NOT_FOUND, 'Director not found');
  }
  const hoursDiff = differenceInHours(new Date(), new Date(director.updatedAt));
  // if the director has not been updated in the last 7 days, trigger the director master data updater
  if (hoursDiff >= 168) {
    const sqsResponse = await triggerDirectorMDUpdater(din);
    if (sqsResponse instanceof Error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Update failed for DIN: ${din}. Try again later.`
      );
    }
    return 'Update request submitted. Refresh in a few minutes for latest updates.';
  }
  return `Director updated recently. Please try again in about ${Math.ceil((168 - hoursDiff) / 24)} day(s).`;
};

const hideContactInfoByDIN = async (din: string) => {
  // Validate DIN format (8 digits)
  const DIN_PATTERN = /^\d{8}$/;
  if (!DIN_PATTERN.test(din)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid DIN format. DIN must be 8 digits.');
  }

  // Use findOneAndUpdate directly to avoid multiple database calls
  // This combines the find and update operations into a single atomic operation
  const updatedDirector = await DirectorModel.findOneAndUpdate(
    { din },
    { hideContactInfo: true },
    {
      new: true,
      runValidators: true,
      // Only return the fields we need to reduce data transfer
      projection: {
        din: 1,
        fullName: 1,
        hideContactInfo: 1,
        _id: 0,
      },
    }
  );

  if (!updatedDirector) {
    throw new AppError(httpStatus.NOT_FOUND, 'Director not found with the provided DIN');
  }

  return {
    message: 'Contact information hidden successfully',
    data: {
      din: updatedDirector.din,
      fullName: updatedDirector.fullName,
      hideContactInfo: updatedDirector.hideContactInfo,
    },
  };
};

const showContactInfoByDIN = async (din: string) => {
  // Validate DIN format (8 digits)
  const DIN_PATTERN = /^\d{8}$/;
  if (!DIN_PATTERN.test(din)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid DIN format. DIN must be 8 digits.');
  }

  const updatedDirector = await DirectorModel.findOneAndUpdate(
    { din },
    { hideContactInfo: false },
    {
      new: true,
      runValidators: true,
      // Only return the fields we need to reduce data transfer
      projection: {
        din: 1,
        fullName: 1,
        hideContactInfo: 1,
        _id: 0,
      },
    }
  );

  if (!updatedDirector) {
    throw new AppError(httpStatus.NOT_FOUND, 'Director not found with the provided DIN');
  }

  return {
    message: 'Contact information shown successfully',
    data: {
      din: updatedDirector.din,
      fullName: updatedDirector.fullName,
      hideContactInfo: updatedDirector.hideContactInfo,
    },
  };
};

const getDirectorContactInfoStatusByDIN = async (din: string) => {
  // Validate DIN format (8 digits)
  const DIN_PATTERN = /^\d{8}$/;
  if (!DIN_PATTERN.test(din)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid DIN format. DIN must be 8 digits.');
  }

  const directorPipeline = [
    {
      $match: { din: din },
    },
    {
      $addFields: {
        filteredCompanyData: {
          $filter: {
            input: '$companyData',
            as: 'company',
            cond: {
              $in: [
                '$$company.designation',
                [
                  'Nominee Director',
                  'Managing Director',
                  'Additional Director',
                  'Whole-time director',
                  'Alternate Director',
                  'Director appointed in casual vacancy',
                  'Director',
                  'Designated Partner',
                  'Nominee for Body corporate designated partner',
                  'Authorised Representative',
                ],
              ],
            },
          },
        },
      },
    },
    {
      $addFields: {
        totalDirectorshipCount: { $size: '$filteredCompanyData' },
      },
    },
    {
      $project: {
        din: 1,
        fullName: 1,
        status: 1,
        personType: 1,
        totalDirectorshipCount: 1,
        companies: '$filteredCompanyData.nameOfTheCompany',
        hideContactInfo: 1,
        _id: 0,
      },
    },
  ];

  const result = await DirectorModel.aggregate(directorPipeline);

  if (!result || result.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'Director not found with the provided DIN');
  }

  const director = result[0];

  return {
    message: 'Director contact info status fetched successfully',
    data: {
      din: director.din,
      fullName: director.fullName,
      status: director.status,
      personType: director.personType,
      totalDirectorshipCount: director.totalDirectorshipCount,
      companies: director.companies,
      hideContactInfo: director.hideContactInfo || false, // Default to false if field doesn't exist
    },
  };
};

const getDirectorContactDetailsFromDB = async (din: string) => {
  const director = (await DirectorModel.findOne(
    { din: din },
    { _id: 0, mobileNumber: 1, emailAddress: 1, fullName: 1, din: 1 }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ).lean()) as any;

  if (!director) {
    return {
      message: 'Director contact details not available',
      data: null,
    };
  }

  return {
    message: 'Director contact details fetched successfully',
    data: director,
  };
};

export const DirectorServices = {
  getDirectorSuggestionsFromDB,
  getDirectorAdvanceSearchFromDB,
  getCompanyAdvanceSearchFacetsFromDB,
  getSingleDirectorDetailsFromDB,
  getAssociatedDirectorsFromDB,
  checkContactStatusFromDB,
  getPaidContactDetailsFromDB,
  createDirectorMasterDataUpdateRequest,
  hideContactInfoByDIN,
  showContactInfoByDIN,
  getDirectorContactInfoStatusByDIN,
  getDirectorContactDetailsFromDB,
};
