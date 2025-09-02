/* eslint-disable indent */
/* eslint-disable camelcase */
import {
  differenceInHours,
  endOfDay,
  endOfMonth,
  format,
  isBefore,
  parse,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import httpStatus from 'http-status';
import FacetQueryBuilder from '../../builder/FacetQueryBuilder';
import SearchQueryBuilder from '../../builder/SearchQueryBuilder';
import AppError from '../../errors/AppError';
import { PaidUpCapitalRange } from '../../interface/searchQuery';
import { formatCurrencyINR } from '../../utils/dataFormatter';
import { JobModel, UnlockedCompanyModel } from '../unlockCompany/unlockCompany.model';
import { UserModel } from '../user/user.model';
import { ILlpFinancialData } from '../vpdAnalysis/vpdAnalysis.interface';
import {
  LlpVpdDocument,
  VpdDocumentV2,
  VpdV2PaidDocumentModel,
  VpdV3DocumentModel,
} from '../vpdAnalysis/vpdAnalysis.model';
import {
  companySearchSuggestionProjectStage,
  dashboardCompanySearchSuggestionProjectStage,
} from './company.constant';
import {
  IPublicDocumentAttachment,
  IPublicDocumentResponse,
  TCompany,
  TLlpData,
  TPanDetails,
  TUpdateLog,
} from './company.interface';
import { CompanyModel, PanDetailsModel, SrnDocumentModel, UpdateLogModel } from './company.model';
import { calculateADT1DueDateAndFee } from './utils/calculateADT1DueDate';
import { calculateAOC4DueDate } from './utils/calculateAOC4DueDate';
import { processGSTR1Filing, processGstr3bFiling } from './utils/calculateGstDueDate';
import { calculateINC20DueDateAndFee } from './utils/calculateINC20DueDate';
import { calculateLlpForm11DueDateAndFee } from './utils/calculateLlpForm11DueDate';
import { calculateLlpForm8DueDateAndFee } from './utils/calculateLlpForm8DueDate';
import { calculateMGT7DueDate } from './utils/calculateMGT7DueDate';
import { chargeDetailsAggregation } from './utils/companyAggregation';
import { extractZipFileName } from './utils/extractZipFIleName';
import {
  filterCurrentDirectors,
  filterExecutiveTeam,
  filterPastDirectors,
  formatDirector,
  getRegExDesignation,
} from './utils/getDirectorsInfo';
import {
  calculateChargeData,
  combineGstinData,
  fetchAssociatedCompanies,
  formatDateString,
  getPromoterNames,
  getRegisteredCompanyAddress,
  getStateNameFromGSTIN,
  getWebsiteFromEmail,
} from './utils/helperFunctions';
import triggerLambdaScrapper from './utils/triggerLamdaScrapper';

//this function will be used to get company suggestions from database based on cin or company name
const getCompanySuggestionsFromDB = async (query: Record<string, unknown>) => {
  //regex pattern to check if the search term is a valid CIN
  const cinPattern = /^(?:[A-Z]{1}[0-9A-Z]{20}|[A-Z]{3}-\d{1,4})$/;
  const searchTerm = query.searchTerm as string;
  const isCINSearch = cinPattern.test(searchTerm?.toLocaleUpperCase());
  // const isCINSearch = cinPattern.test(searchTerm);
  let companySuggestionsPipeline;

  //giving exact match for the search term if it is CIN
  if (isCINSearch) {
    companySuggestionsPipeline = [
      {
        $match: { cin: searchTerm?.toLocaleUpperCase() },
      },
      companySearchSuggestionProjectStage,
    ];
  } else {
    // Fuzzy search for company name
    companySuggestionsPipeline = [
      {
        $search: {
          index: 'companySearchAutocomplete',

          compound: {
            should: [
              {
                autocomplete: {
                  query: query.searchTerm,
                  path: 'company',
                  tokenOrder: 'sequential',
                },
              },
              {
                text: {
                  query: query.searchTerm,
                  path: 'company',
                  fuzzy: {
                    maxEdits: 2,
                    prefixLength: 0,
                  },
                },
              },
            ],
          },

          // autocomplete: {
          //   query: query.searchTerm,
          //   path: 'company',
          //   fuzzy: { maxEdits: 1, prefixLength: 3 },
          //   tokenOrder: 'sequential',
          // },
          // highlight: { path: 'company' },
        },
      },
      { $limit: 5 },
      companySearchSuggestionProjectStage,
    ];
  }

  const result = await CompanyModel.aggregate(companySuggestionsPipeline);
  return result;
};

const getDashboardCompanySuggestionsFromDB = async (query: Record<string, unknown>) => {
  //regex pattern to check if the search term is a valid CIN
  const cinPattern = /^(?:[A-Z]{1}[0-9A-Z]{20}|[A-Z]{3}-\d{1,4})$/;
  const searchTerm = query.searchTerm as string;
  const isCINSearch = cinPattern.test(searchTerm?.toLocaleUpperCase());
  // const isCINSearch = cinPattern.test(searchTerm);
  let companySuggestionsPipeline;

  //giving exact match for the search term if it is CIN
  if (isCINSearch) {
    companySuggestionsPipeline = [
      {
        $match: { cin: searchTerm?.toLocaleUpperCase() },
      },
      dashboardCompanySearchSuggestionProjectStage,
    ];
  } else {
    // Fuzzy search for company name
    companySuggestionsPipeline = [
      {
        $search: {
          index: 'companySearchAutocomplete',

          compound: {
            should: [
              {
                autocomplete: {
                  query: query.searchTerm,
                  path: 'company',
                  tokenOrder: 'sequential',
                },
              },
              {
                text: {
                  query: query.searchTerm,
                  path: 'company',
                  fuzzy: {
                    maxEdits: 2,
                    prefixLength: 0,
                  },
                },
              },
            ],
          },
        },
      },
      { $limit: 5 },
      dashboardCompanySearchSuggestionProjectStage,
    ];
  }

  const result = await CompanyModel.aggregate(companySuggestionsPipeline);
  // Process director data in application code
  const processedResult = await Promise.all(
    result.map(async ({ directorData, ...companyWithoutDirectorData }) => {
      // Ensure directorData is valid

      if (!Array.isArray(directorData)) {
        return companyWithoutDirectorData; // Skip this company if directorData is invalid
      }
      const regExDesignation = getRegExDesignation(
        companyWithoutDirectorData.companyType,
        companyWithoutDirectorData.companyOrigin
      );
      const currentDirectors = filterCurrentDirectors(
        directorData,
        companyWithoutDirectorData.cin,
        regExDesignation
      )?.map(director =>
        formatDirector(director, companyWithoutDirectorData.cin, regExDesignation)
      );

      const pastDirectors = await filterPastDirectors(
        directorData,
        companyWithoutDirectorData.cin,
        regExDesignation
      );

      return {
        ...companyWithoutDirectorData,
        currentDirectors,
        pastDirectors,
      };
    })
  );
  return processedResult;
};

const getCompanyAdvanceSearchFromDB = async (query: Record<string, unknown>) => {
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
  const cinPattern = /^(?:[A-Z]{1}[0-9A-Z]{20}|[A-Z]{3}-\d{1,4})$/;
  const searchTerm = query.searchTerm as string;
  // const isCINSearch = cinPattern.test(searchTerm.toLocaleUpperCase());
  const isCINSearch = cinPattern.test(searchTerm);

  let companySuggestionsPipeline;

  const queryBuilder = new SearchQueryBuilder('CompanyFulltextSearch');

  // Mandatory search criteria: fuzzy search on the company name
  if (query.searchTerm) {
    queryBuilder.addMustFilter({
      text: {
        query: query.searchTerm as string,
        path: 'company',
        fuzzy: {
          maxEdits: 1,
          prefixLength: 3,
        },
      },
    });
  }
  // Mandatory search criteria: fuzzy search on the company name
  // if (query.searchTerm) {
  //   queryBuilder.addShouldFilter([
  //     {
  //       autocomplete: {
  //         query: query.searchTerm as string,
  //         path: 'company',
  //         tokenOrder: 'sequential',
  //       },
  //     },
  //     {
  //       text: {
  //         query: query.searchTerm as string,
  //         path: 'company',
  //         fuzzy: {
  //           maxEdits: 1,
  //           prefixLength: 3,
  //         },
  //       },
  //     },
  //   ]);
  // }

  // Optional filter: LLP status
  if (query.llpStatus) {
    queryBuilder.addFilter({
      text: {
        query: query.llpStatus as string,
        path: 'masterData.companyData.llpStatus',
      },
    });
  }

  // Optional filter: companyType
  if (query.companyType) {
    queryBuilder.addFilter({
      text: {
        query: query.companyType as string,
        path: 'masterData.companyData.companyType',
      },
    });
  }

  // Optional filter: mainDivisionDescription
  if (query.mainDivisionDescription) {
    queryBuilder.addFilter({
      text: {
        query: query.mainDivisionDescription as string,
        path: 'masterData.companyData.mainDivisionDescription',
      },
    });
  }

  // Optional filter: whetherListedOrNot
  if (query.whetherListedOrNot) {
    queryBuilder.addFilter({
      text: {
        query: query.whetherListedOrNot as string,
        path: 'masterData.companyData.whetherListedOrNot',
      },
    });
  }

  // Optional filter: companyCategory
  if (query.state) {
    queryBuilder.addFilter({
      text: {
        query: query.state as string,
        path: 'masterData.companyData.MCAMDSCompanyAddress.state',
      },
    });
  }
  // Optional filter: companyCategory
  if (query.city) {
    queryBuilder.addFilter({
      text: {
        query: query.city as string,
        path: 'masterData.companyData.MCAMDSCompanyAddress.city',
      },
    });
  }
  // Optional filter: companyCategory
  if (query.postalCode) {
    queryBuilder.addFilter({
      text: {
        query: query.postalCode as string,
        path: 'masterData.companyData.MCAMDSCompanyAddress.postalCode',
      },
    });
  }
  // Optional filter: paidUpCapital
  if (query.paidUpCapital) {
    // const paidUpCapitalRanges: Record<string, PaidUpCapitalRange> = {
    //   '0-1l': { lower: 0, upper: 1e5 },
    //   '1-5l': { lower: 1e5, upper: 5e5 },
    //   '5-25l': { lower: 5e5, upper: 25e5 },
    //   '25l-1c': { lower: 25e5, upper: 1e7 },
    //   '1c-5c': { lower: 1e7, upper: 5e7 },
    //   '5c-25c': { lower: 5e7, upper: 25e7 },
    //   '25c-1m': { lower: 25e7, upper: 1e9 },
    //   '1m-5m': { lower: 1e9, upper: 5e9 },
    //   '5m-25m': { lower: 5e9, upper: 25e9 },
    //   '25m-1b': { lower: 25e9, upper: 25e15 },
    // };
    const paidUpCapitalRanges: Record<string, PaidUpCapitalRange> = {
      '0-1l': { lower: 0, upper: 1e5 },
      '1-5l': { lower: 1.00001e5, upper: 5e5 },
      '5-25l': { lower: 5.00001e5, upper: 2.5e6 },
      '25l-1c': { lower: 2.500001e6, upper: 1e7 },
      '1c-5c': { lower: 1.0000001e7, upper: 5e7 },
      '5c-25c': { lower: 5.0000001e7, upper: 2.5e8 },
      '25c-100c': { lower: 2.50000001e8, upper: 1e9 },
      '100c-1kc': { lower: 1.000000001e9, upper: 1e10 },
      '1kc-5kc': { lower: 1.0000000001e10, upper: 5e10 },
      '5kc-10kc': { lower: 5.0000000001e10, upper: 1e11 },
      '10kc-100kc': { lower: 1.00000000001e11, upper: 1e12 },
      '100kc-1000kc': { lower: 1.000000000001e12, upper: 1e13 },
    };

    const range = paidUpCapitalRanges[query.paidUpCapital as string];

    if (!range) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid paid up capital range.');
    }

    queryBuilder.addRangeFilter({
      range: {
        path: 'masterData.companyData.paidUpCapital',
        gte: range.lower,
        lte: range.upper,
      },
    });
  }

  // Build the final search query
  const searchQuery = queryBuilder.build();
  // console.dir(searchQuery, { depth: null });

  if (isCINSearch) {
    companySuggestionsPipeline = [
      {
        $match: { cin: searchTerm.toLocaleUpperCase() },
      },
      // {
      //   $facet: {
      //     metadata: [{ $count: 'total' }],
      //     data: [{ $skip: skip }, { $limit: limit }, companySearchSuggestionProjectStage],
      //   },
      // },
      companySearchSuggestionProjectStage,
    ];
  } else {
    // Fuzzy search for company name
    companySuggestionsPipeline = [
      {
        $search: searchQuery,
      },

      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      companySearchSuggestionProjectStage,
      // {
      //   $facet: {
      //     metadata: [{ $count: 'total' }],
      //     data: [{ $skip: skip }, { $limit: limit }, companySearchSuggestionProjectStage],
      //   },
      // },
    ];
  }

  const result = await CompanyModel.aggregate(companySuggestionsPipeline);
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
  //     companies: facets.data,
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
  const queryBuilder = new FacetQueryBuilder('keywordFacetIndex');

  if (query.searchTerm) {
    queryBuilder.addMustFilter({
      text: {
        query: query.searchTerm as string,
        path: 'company',
        fuzzy: {
          maxEdits: 1,
          prefixLength: 3,
        },
      },
    });
  }

  // Mandatory search criteria: fuzzy search on the company name
  // if (query.searchTerm) {
  //   queryBuilder.addShouldFilter([
  //     {
  //       autocomplete: {
  //         query: query.searchTerm as string,
  //         path: 'company',
  //         tokenOrder: 'sequential',
  //       },
  //     },
  //     {
  //       text: {
  //         query: query.searchTerm as string,
  //         path: 'company',
  //         fuzzy: {
  //           maxEdits: 1,
  //           prefixLength: 3,
  //         },
  //       },
  //     },
  //   ]);
  // }

  if (query.companyType) {
    queryBuilder.addFilter({
      text: {
        query: query.companyType as string,
        path: 'masterData.companyData.companyType',
      },
    });
  }

  if (query.whetherListedOrNot) {
    queryBuilder.addFilter({
      text: {
        query: query.whetherListedOrNot as string,
        path: 'masterData.companyData.whetherListedOrNot',
      },
    });
  }

  if (query.llpStatus) {
    queryBuilder.addFilter({
      text: {
        query: query.llpStatus as string,
        path: 'masterData.companyData.llpStatus',
      },
    });
  }
  if (query.mainDivisionDescription) {
    queryBuilder.addFilter({
      text: {
        query: query.mainDivisionDescription as string,
        path: 'masterData.companyData.mainDivisionDescription',
      },
    });
  }
  if (query.state) {
    queryBuilder.addFilter({
      text: {
        query: query.state as string,
        path: 'masterData.companyData.MCAMDSCompanyAddress.state',
      },
    });
  }
  if (query.city) {
    queryBuilder.addFilter({
      text: {
        query: query.city as string,
        path: 'masterData.companyData.MCAMDSCompanyAddress.city',
      },
    });
  }
  if (query.postalCode) {
    queryBuilder.addFilter({
      text: {
        query: query.postalCode as string,
        path: 'masterData.companyData.MCAMDSCompanyAddress.postalCode',
      },
    });
  }

  queryBuilder.addFacet('companyTypeFacet', 'masterData.companyData.companyType', 'string', 100);
  queryBuilder.addFacet(
    'whetherListedOrNotFacet',
    'masterData.companyData.whetherListedOrNot',
    'string',
    2
  );
  queryBuilder.addFacet('llpStatusFacet', 'masterData.companyData.llpStatus', 'string', 2);
  queryBuilder.addFacet(
    'mainDivisionDescriptionFacet',
    'masterData.companyData.mainDivisionDescription',
    'string'
  );
  queryBuilder.addFacet(
    'stateFacet',
    'masterData.companyData.MCAMDSCompanyAddress.state',
    'string'
  );
  queryBuilder.addFacet('cityFacet', 'masterData.companyData.MCAMDSCompanyAddress.city', 'string');
  queryBuilder.addFacet(
    'postalCodeFacet',
    'masterData.companyData.MCAMDSCompanyAddress.postalCode',
    'string'
  );

  // // Build the final facet query
  const facetQuery = queryBuilder.build();
  // console.dir(facetQuery, { depth: null });

  const result = await CompanyModel.aggregate([
    {
      $searchMeta: facetQuery,
    },
  ]);

  return result;
};

const getSingleCompanyDetailsFromDB = async (query: Record<string, unknown>) => {
  const company: TCompany | null = await CompanyModel.findOne(
    { cin: query.cin },
    {
      cin: '$cin',
      company: '$company',
      companyType: '$masterData.companyData.companyType',
      companyOrigin: '$masterData.companyData.companyOrigin',
      category: '$masterData.companyData.companyCategory',
      registrationNumber: '$masterData.companyData.registrationNumber',
      classOfCompany: '$masterData.companyData.classOfCompany',
      status: '$masterData.companyData.llpStatus',
      state: { $arrayElemAt: ['$masterData.companyData.MCAMDSCompanyAddress.state', 0] },
      incorporationAge: {
        $dateDiff: {
          startDate: {
            $dateFromString: {
              dateString: '$masterData.companyData.dateOfIncorporation',
              format: '%m/%d/%Y',
            },
          },
          endDate: '$$NOW',
          unit: 'month',
        },
      },
      rocCode: '$masterData.companyData.rocName',
      dateOfIncorporation: '$masterData.companyData.dateOfIncorporation',
      companySubcategory: '$masterData.companyData.companySubcategory',
      listingStatus: '$masterData.companyData.whetherListedOrNot',
      industry: '$masterData.companyData.mainDivisionDescription',
      authorizedCapital: '$masterData.companyData.authorisedCapital',
      paidUpCapital: '$masterData.companyData.paidUpCapital',
      totalObligationOfContribution: '$masterData.companyData.totalObligationOfContribution',
      indexChargesData: '$masterData.indexChargesData',
      companyAddresses: '$masterData.companyData.MCAMDSCompanyAddress',
      email: '$masterData.companyData.emailAddress',
      directorData: '$masterData.directorData',
    }
  ).lean();

  if (!company) {
    return null;
  }

  // let about = '';
  if (company && company.dateOfIncorporation) {
    // adding formatted incorporation date from MM/DD/YYYY to DD/MMM/YYYY

    const parsedDate = parse(company.dateOfIncorporation, 'MM/dd/yyyy', new Date());
    company.dateOfIncorporation = format(parsedDate, 'dd-MMM-yyyy');
    // Adding formatted capital information
    if (company.authorizedCapital) {
      company.formattedAuthorizedCapital = formatCurrencyINR(company?.authorizedCapital);
    }
    if (company.paidUpCapital) {
      company.formattedPaidUpCapital = formatCurrencyINR(company.paidUpCapital);
    }

    // const about = await generateAboutContent(company);

    // company.about = about;
    if (company.email) {
      company.website = getWebsiteFromEmail(company.email);
    }

    const chargeData = calculateChargeData(company.indexChargesData);
    // Incorporate chargeData directly, including any message for no data
    company.chargeData = chargeData;
    if (company.companyAddresses) {
      company.address = getRegisteredCompanyAddress(company.companyAddresses);
      // console.dir(getRegisteredCompanyAddress(company.companyAddresses), { depth: null });
    }

    // Add directors
    // if (company.directorData) {
    //   company.currentDirectors = getCurrentDirectors(company.directorData, company.cin);
    // }

    if (company.directorData && company.companyType && company.companyOrigin) {
      const regExDesignation = getRegExDesignation(company.companyType, company.companyOrigin);
      const currentDirectors = filterCurrentDirectors(
        company.directorData,
        company.cin,
        regExDesignation
        // true
      );
      const pastDirectors = await filterPastDirectors(
        company.directorData,
        // currentDirectors,
        company.cin,
        regExDesignation
      );

      const executiveTeamsRegEx =
        /^(CEO|CFO|Manager|Company Secretary|Individual Subscriber|Individual Promoter|Deputy Nodal Officer)$/;
      const executiveTeams = filterExecutiveTeam(
        company.directorData,
        company.cin,
        executiveTeamsRegEx
      );

      company.currentDirectors = currentDirectors.map(director =>
        formatDirector(director, company.cin, regExDesignation)
      );

      // company.pastDirectors = pastDirectors.map(director =>
      //   formatDirector(director, company.cin, regExDesignation)
      // );
      company.pastDirectors = pastDirectors;
      company.executiveTeam = executiveTeams.map(director =>
        formatDirector(director, company.cin, executiveTeamsRegEx)
      );

      // pastDirectors: pastDirectors.map(director => formatDirector(director, companyDetails, regExDesignation)),
    }

    company.about =
      company.companyType === 'Company'
        ? `${company.company} is an  Indian Private Limited Company incorporated on ${company.dateOfIncorporation}. It operates in the ${company.industry || 'various sectors'} based in ${company.address?.city}, India. With an authorized capital of ${company.formattedAuthorizedCapital}${company.formattedPaidUpCapital ? ` and a paid-up capital of ${company.formattedPaidUpCapital}` : ', with financial details maintained as per regulatory requirements'} the company is classified as a ${company.classOfCompany}. The company currently has ${company.currentDirectors ? company.currentDirectors.length : 0} directors. ${company.currentDirectors ? `${getPromoterNames(company.currentDirectors)} all of whom were appointed as promoters` : ''} The registered office is in ${company.address?.registeredAddress}.`
        : `${company.company}, an Indian LLP (Limited Liability Partnership), was incorporated on ${company.dateOfIncorporation}, and is currently ${company.status}. It is based in ${company.address?.city}, operating under the jurisdiction of ${company.rocCode}. The LLP is involved in the business of ${company.industry}, with its registered office at ${company.address?.registeredAddress}. The LLP has a total of ${company.currentDirectors ? company.currentDirectors.length : 0} designated partners, ${company.currentDirectors ? `${getPromoterNames(company.currentDirectors)} who were appointed at the time of incorporation and are also promoters` : ''}.`;

    // Fetch associated companies
    const associatedCompanies = await fetchAssociatedCompanies(
      company.currentDirectors || [],
      company.cin
    );
    company.associatedCompanies = associatedCompanies;

    // Optionally, remove the raw indexChargesData if not needed for the response
    delete company.indexChargesData;
    delete company.directorData;
    delete company.companyAddresses;
  }

  return company;
  // return {
  //   basicInfo: {
  //     cin: company.cin,
  //     company: company.company,
  //     companyType: company.companyType,
  //     companyOrigin: company.companyOrigin,
  //     category: company.category,
  //     registrationNumber: company.registrationNumber,
  //     classOfCompany: company.classOfCompany,
  //     status: company.status,
  //     state: company.state,
  //     incorporationAge: company.incorporationAge,
  //     rocCode: company.rocCode,
  //     dateOfIncorporation: company.dateOfIncorporation,
  //     companySubcategory: company.companySubcategory,
  //     listingStatus: company.listingStatus,
  //     industry: company.industry,
  //     authorizedCapital: company.authorizedCapital,
  //     paidUpCapital: company.paidUpCapital,
  //     totalObligationOfContribution: company.totalObligationOfContribution,
  //     formattedAuthorizedCapital: company.formattedAuthorizedCapital,
  //     formattedPaidUpCapital: company.formattedPaidUpCapital,
  //     chargeData: company.chargeData,
  //     address: company.address,
  //     currentDirectors: company.currentDirectors?.map(director => ({
  //       din: director.din,
  //       fullName: director.fullName,
  //       dateOfAppointment: '****',
  //       designation: '****',
  //       totalDirectorship: '****',
  //       isPromoter: '****',
  //     })),
  //   },
  //   subscribedInfo: {
  //     email: company.email,
  //   },
  // };
};

const getChargeDetailsFromDB = async (query: Record<string, unknown>) => {
  // Check if company exists with indexChargesData
  const isChargeExist = await CompanyModel.findOne(
    { cin: query.cin },
    { 'masterData.indexChargesData': 1, _id: 0 }
  );

  // Check if masterData and indexChargesData exist
  if (
    !isChargeExist ||
    !isChargeExist.masterData ||
    isChargeExist.masterData.indexChargesData.length === 0
  ) {
    return [];
  }
  const chargeData = await CompanyModel.aggregate(chargeDetailsAggregation(query.cin as string));

  return chargeData;
};

const getOneTimeComplianceDetailsFromDB = async (query: Record<string, unknown>) => {
  // FOR COMPANY TYPE: LLP
  if (query.companyType === 'LLP') {
    // const llpData = await LlpVpdDocument.find({ cin: query.cin }).lean();
    // const llpForm3DueDateAndLateFee = calculateLlpForm3DueDateAndFee(
    //   llpData[0].vpdDocs,
    //   query.incorporationDate as string,
    //   Number(query.totalObligationOfContribution)
    // );

    // return [...llpForm3DueDateAndLateFee];

    return null;
  }

  // FOR COMPANY TYPE: COMPANY
  const vpdDataV3 = await VpdV3DocumentModel.find({ cin: query.cin });
  const vpdDataV2 = await VpdDocumentV2.find({ company_id: query.cin }).lean();
  const srnDoc = await SrnDocumentModel.find({ cin: query.cin }).lean();

  // check if company data fetched once
  if (!srnDoc[0]?.isFirstTimeFetch) {
    if (srnDoc[0]?.is_being_processed) {
      return [
        {
          isFirstTimeUpdate: true,
          message: `Update is in progress for CIN: ${query.cin}. Please try after some time.`,
        },
      ];
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lambdaScrapperResponse: any = await triggerLambdaScrapper(
        query.cin as string,
        query.incorporationDate as string,
        query.companyType as string
      );
      // console.log(
      //   'onetime compliance auto trigger for cin: ',
      //   query.cin,
      //   'time:' + formatDate(new Date(), 'dd-MM-yyyy hh:mm:ss'),
      //   lamdaScrapperResponse
      // );
      if (!lambdaScrapperResponse.sqsScrapperResponse) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Failed to update company data');
      }
      if (lambdaScrapperResponse.sqsScrapperResponse) {
        return [
          {
            isFirstTimeUpdate: true,
            message: `SRN Update for first time initiated for CIN: ${query.cin}. Please try after some time.`,
          },
        ];
      }
    }
  }

  const inc20ADueDateAndLateFee = calculateINC20DueDateAndFee(
    query.incorporationDate as string,
    Number(query.authorizedCapital),
    vpdDataV3,
    vpdDataV2[0]?.documents
  );
  const adt1DueDateAndLateFee = calculateADT1DueDateAndFee(
    query.incorporationDate as string,
    Number(query.authorizedCapital),
    srnDoc[0].annual_e_filing_forms
  );

  return [...inc20ADueDateAndLateFee, ...adt1DueDateAndLateFee];
};

const getAnnualComplianceDetailsFromDB = async (query: Record<string, unknown>) => {
  // FOR COMPANY TYPE: LLP
  if (query.companyType === 'LLP') {
    const llpData: TLlpData[] = await LlpVpdDocument.find({ cin: query.cin }).lean();
    const llpForm8DueDateAndLateFee = calculateLlpForm8DueDateAndFee(
      llpData[0].vpdDocs,
      query.incorporationDate as string,
      Number(query.totalObligationOfContribution)
    );
    const llpForm11DueDateAndLateFee = calculateLlpForm11DueDateAndFee(
      llpData[0],
      query.incorporationDate as string,
      Number(query.totalObligationOfContribution)
    );

    return [...llpForm8DueDateAndLateFee, ...llpForm11DueDateAndLateFee];
  }

  // FOR COMPANY TYPE: COMPANY
  const srnDoc = await SrnDocumentModel.find({ cin: query.cin }).lean();

  if (!srnDoc[0]?.isFirstTimeFetch) {
    return [
      {
        isFirstTimeUpdate: true,
        message: `Update is in progress for CIN: ${query.cin}. Please try after some time.`,
      },
    ];
  }

  const aoc4DueDateAndLateFee = calculateAOC4DueDate(
    query.incorporationDate as string,
    Number(query.authorizedCapital),
    srnDoc[0]?.annual_e_filing_forms
  );
  const mgt7DueDateAndLateFee = calculateMGT7DueDate(
    query.incorporationDate as string,
    Number(query.authorizedCapital),
    srnDoc[0]?.annual_e_filing_forms
  );

  return [...aoc4DueDateAndLateFee, ...mgt7DueDateAndLateFee];
};

const getGstComplianceDetailsFromDB = async (query: Record<string, unknown>) => {
  const panDetails: TPanDetails[] = await PanDetailsModel.find({ cin: query.cin });
  // Check if the query result is empty
  if (panDetails.length === 0) {
    return [
      {
        message: 'No company found with the provided CIN.',
      },
    ];
  }

  if (!panDetails[0]?.pan) {
    return [
      {
        message: 'Missing Pan Number',
      },
    ];
  }

  // if gstin is not present then try to fetch gstin number

  // for now sending prompt to user
  // Check if gstin_list is not present or is null
  if (!panDetails[0]?.isFirstTimeFetch) {
    return [
      {
        isFirstTimeFetch: false,
        message: 'Update Required',
      },
    ];
  }
  const gstinList = panDetails[0]?.gstin_list;
  if (!gstinList || gstinList.length === 0) {
    return [
      {
        message: 'This Company Does Not Have GSTIN',
      },
    ];
  }

  const gstFillings = panDetails[0]?.filings;

  const result = gstFillings
    .map(gstFiling => {
      // const gstr1Filings = gstFiling.filingInfo.filter(filing => filing.rtntype === 'GSTR1');
      const stateName = getStateNameFromGSTIN(gstFiling.gstin);
      const filingFrequency = gstFiling.filingFrequency;
      const turnoverSlab = gstFiling.taxpayerInfo.aggreTurnOver;
      const taxPayerState = gstFiling.taxpayerInfo.stj;

      const gstr1Filings = gstFiling.filingInfo
        .filter(filing => filing.rtntype === 'GSTR1')
        .map(filing => {
          return processGSTR1Filing(filing, filingFrequency, turnoverSlab);
        });

      const gstr3bFillings = gstFiling.filingInfo
        .filter(filing => filing.rtntype === 'GSTR3B')
        .map(filing => {
          return processGstr3bFiling(filing, filingFrequency, turnoverSlab, taxPayerState);
        });
      return {
        gstin: gstFiling.gstin,
        stateGstin: `${stateName} - ${gstFiling.gstin}`,
        filings: [...gstr1Filings, ...gstr3bFillings],
      };
    })
    .flat();

  const combinedResult = combineGstinData(gstinList, result);
  return combinedResult;
};

const createCompanyDataUpdateRequestIntoDB = async (query: Record<string, unknown>) => {
  const { cin, dateOfIncorporation, companyType } = query;
  // Attempt to find the latest update log for the given CIN
  const updateLog: TUpdateLog | null = await UpdateLogModel.findOne({ cin }).sort({
    createdAt: -1,
  });

  // function to trigger updates and handle response
  const triggerUpdates = async () => {
    const lamdaScrapperResponse = await triggerLambdaScrapper(
      cin as string,
      dateOfIncorporation as string,
      companyType as string
    );
    // console.log('Manual update trigger for CIN:', cin, lamdaScrapperResponse);
    // Check if any response from lambda was successful
    const updateSuccess = Object.values(lamdaScrapperResponse).some(response => response);
    if (!updateSuccess) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Failed to update company data');
    }

    return {
      message: updateLog
        ? `Update request created for CIN: ${cin}`
        : `First time update request created for CIN: ${cin}`,
    };
  };

  // If there's no update log for the given CIN, call the triggerLambdaScrapper function
  if (!updateLog) {
    return await triggerUpdates();

    // Since this is a new CIN, no need to check for the 24-hour condition; proceed to update
  } else {
    // Use differenceInHours with parseISO if your date is in ISO string format
    const hoursDiff = differenceInHours(new Date(), new Date(updateLog.lastUpdatedOn));

    // interface TUpdateLog {
    //   isCompanyDataUpdated: string;
    //   isSrnDataUpdated: string;
    //   isVpdV3Updated: string;
    //   isGstUpdated: string;
    //   // Add other fields as necessary
    // }
    //check if any update has been done in last 24 hours or not
    const allCompletedForCompany = [
      'isCompanyDataUpdated',
      // 'isSrnDataUpdated',
      'isVpdV3Updated',
      'isGstUpdated',
    ].every(field => updateLog[field as keyof TUpdateLog] === 'completed');

    const allCompletedForLLP = ['isCompanyDataUpdated', 'isGstUpdated', 'isLLPVpdUpdated'].every(
      field => updateLog[field as keyof TUpdateLog] === 'completed'
    );

    if (companyType === 'Company') {
      if (hoursDiff < 24 && allCompletedForCompany) {
        return {
          message: 'Company Data is already updated. Please try after 24 hours.',
        };
      }
    } else if (companyType === 'LLP') {
      if (hoursDiff < 24 && allCompletedForLLP) {
        return {
          message: 'LLP Data is already updated. Please try after 24 hours.',
        };
      }
    }

    const anyInitiated = [
      'isCompanyDataUpdated',
      // 'isSrnDataUpdated',
      'isVpdV3Updated',
      'isGstUpdated',
      'isLLPVpdUpdated',
    ].some(field => updateLog[field as keyof TUpdateLog] === 'initiated');

    if (anyInitiated) {
      return {
        message: 'Company Data update is in progress. Please try after some time.',
      };
    }
  }

  return await triggerUpdates();
};

const getCompanyDataUpdateStatusFromDB = async (query: Record<string, unknown>) => {
  const updateLog = await UpdateLogModel.findOne({ cin: query.cin }).sort({ createdAt: -1 });
  return updateLog;
};

const getSimilarCompaniesFromDB = async (query: Record<string, unknown>): Promise<TCompany[]> => {
  const similarCompanies = await CompanyModel.find(
    {
      'masterData.companyData.mainDivisionDescription': query.mainDivisionDescription,
    },
    {
      cin: 1,
      company: 1,
      category: '$masterData.companyData.companyCategory',
      registrationNumber: '$masterData.companyData.registrationNumber',
      classOfCompany: '$masterData.companyData.classOfCompany',
      status: '$masterData.companyData.llpStatus',
      state: { $arrayElemAt: ['$masterData.companyData.MCAMDSCompanyAddress.state', 0] },
      rocCode: '$masterData.companyData.rocName',
      companySubcategory: '$masterData.companyData.companySubcategory',
      industry: '$masterData.companyData.mainDivisionDescription',
    }
  )
    .limit(8)
    .lean();

  return similarCompanies;
};

const getLLP_PublicDocumentsFromDB = async (cin: string) => {
  // Get documents from LlpVpdDocument collection
  const llpDocs = await LlpVpdDocument.findOne({ cin });

  if (!llpDocs) {
    throw new AppError(httpStatus.NOT_FOUND, 'No documents found for the given CIN');
  }

  // const formatDateString = (dateStr: string): string => {
  //   try {
  //     // Parse the date string in DD/MM/YYYY format
  //     const parsedDate = parse(dateStr, 'dd/MM/yyyy', new Date());
  //     // Format it to display as desired
  //     return format(parsedDate, 'dd-MMM-yyyy');
  //   } catch (error) {
  //     console.error('Error parsing date:', dateStr, error);
  //     return dateStr;
  //   }
  // };

  // Transform vpdDocs into IPublicDocumentResponse format
  const transformedDocs: IPublicDocumentResponse[] = llpDocs.vpdDocs
    .filter(doc => doc.formId && doc.fileName && doc.s3Url) // Filter out any invalid documents
    .map(doc => {
      // Create attachments array with cleaned names
      const attachments: IPublicDocumentAttachment[] = doc.attachments
        ? doc.attachments.map(att => ({
            name: att.name.replace(/^\d+_/, ''),
            // name: att.name,
            downloadUrl: null, // hiding download url for free documents
          }))
        : [];

      // Get financial year from eventDate or year
      const financialYear = doc.eventDate
        ? `${Number(doc.eventDate.split('/')[2]) - 1}-${doc.eventDate.split('/')[2]}`
        : `${doc.year - 1}-${doc.year}`;

      return {
        formId: doc.formId,
        fileName: doc.fileName,
        documentCategory: doc.documentCategory,
        filingDate: formatDateString(doc.dateOfFiling),
        financialYear,
        sizeKB: doc.fileSize ? Math.round(doc.fileSize / 1024) : 0, // Convert bytes to KB
        numberOfPages: doc.numberOfPages,
        downloadUrl: null, // hiding download url for free documents
        attachments,
        attachmentLabel: doc.attachmentLabel,
      };
    });

  return {
    last_updated: llpDocs.last_updated,
    v3_documents: transformedDocs,
  };
};

const getPaidLLP_PublicDocumentsFromDB = async (
  userId: string,
  cin: string,
  sessionUser: string
) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  //check whether uId match with session user id
  if (user.uId !== sessionUser) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to access this resource');
  }

  const isCompanyUnlocked = await UnlockedCompanyModel.findOne(
    { userId: userId, companyId: cin },
    {
      _id: 0,
      companyId: 1,
      expiryDate: 1,
    }
  );

  let showDownloadUrl = true;

  if (!isCompanyUnlocked) {
    // throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to access this resource');
    showDownloadUrl = false;
  }

  if (isCompanyUnlocked && isBefore(isCompanyUnlocked.expiryDate, new Date())) {
    // throw new AppError(httpStatus.FORBIDDEN, 'Your company access has expired');
    showDownloadUrl = false;
  }

  // Get documents from LlpVpdDocument collection
  const llpDocs = await LlpVpdDocument.findOne({ cin });

  if (!llpDocs) {
    throw new AppError(httpStatus.NOT_FOUND, 'No documents found for the given CIN');
  }

  // Transform vpdDocs into IPublicDocumentResponse format
  const transformedDocs: IPublicDocumentResponse[] = llpDocs.vpdDocs
    .filter(doc => doc.formId && doc.fileName && doc.s3Url) // Filter out any invalid documents
    .map(doc => {
      // Create attachments array with cleaned names
      const attachments: IPublicDocumentAttachment[] = doc.attachments
        ? doc.attachments.map(att => ({
            name: att.name.replace(/^\d+_/, ''),
            // name: att.name,
            downloadUrl: showDownloadUrl
              ? att
                  .s3Url!.replace(
                    'https://llpvpdv3docs-new.s3.amazonaws.com',
                    'https://downloads.filesure.in/llp-vpd'
                  )
                  .replace(
                    'https://llpvpdv3docs.s3.amazonaws.com',
                    'https://downloads.filesure.in/llp-vpd'
                  )
              : null,
          }))
        : [];

      // Get financial year from eventDate or year
      const financialYear = doc.eventDate
        ? `${Number(doc.eventDate.split('/')[2]) - 1}-${doc.eventDate.split('/')[2]}`
        : `${doc.year - 1}-${doc.year}`;

      return {
        formId: doc.formId,
        fileName: doc.fileName,
        documentCategory: doc.documentCategory,
        filingDate: formatDateString(doc.dateOfFiling),
        financialYear,
        sizeKB: doc.fileSize ? Math.round(doc.fileSize / 1024) : 0, // Convert bytes to KB
        numberOfPages: doc.numberOfPages,
        downloadUrl: showDownloadUrl
          ? doc
              .s3Url!.replace(
                'https://llpvpdv3docs-new.s3.amazonaws.com',
                'https://downloads.filesure.in/llp-vpd'
              )
              .replace(
                'https://llpvpdv3docs.s3.amazonaws.com',
                'https://downloads.filesure.in/llp-vpd'
              )
          : null,
        attachments,
        attachmentLabel: doc.attachmentLabel,
      };
    });

  return {
    last_updated: llpDocs.last_updated,
    v3_paid_documents: transformedDocs,
  };
};

const getPaidLlpFinancialDataFromDB = async (
  userId: string,
  cin: string,
  sessionUser: string
): Promise<ILlpFinancialData> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  //check whether uId match with session user id
  if (user.uId !== sessionUser) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to access this resource');
  }

  const isCompanyUnlocked = await UnlockedCompanyModel.findOne(
    { userId: userId, companyId: cin },
    {
      _id: 0,
      companyId: 1,
      expiryDate: 1,
    }
  );

  if (!isCompanyUnlocked) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to access this resource');
  }

  if (isBefore(isCompanyUnlocked.expiryDate, new Date())) {
    throw new AppError(httpStatus.FORBIDDEN, 'Your company access has expired');
  }
  const llpDoc = await LlpVpdDocument.findOne({ cin }, { financial_data: 1 }).lean();

  if (!llpDoc) {
    throw new AppError(httpStatus.NOT_FOUND, 'No financial data found for the given CIN');
  }

  return llpDoc.financial_data || {};
};

const getCompanyPublicDocumentsV3FromDB = async (cin: string) => {
  // Get documents from LlpVpdDocument collection
  const companyDocs = await VpdV3DocumentModel.find({ cin }).sort({ updatedAt: -1 });

  if (!companyDocs) {
    throw new AppError(httpStatus.NOT_FOUND, 'No documents found for the given CIN');
  }

  // Transform vpdDocs into IPublicDocumentResponse format
  const transformedDocs: IPublicDocumentResponse[] = companyDocs
    .filter(doc => doc.formId && doc.fileName)
    .map(doc => {
      // Create attachments array with cleaned names
      const attachments: IPublicDocumentAttachment[] = doc.attachments
        ? doc.attachments.map(att => ({
            name: att.name.replace(/^\d+_/, ''),
            // name: att.name,
            downloadUrl: null, // hiding download url for free documents
          }))
        : [];

      // Get financial year from eventDate or year
      const financialYear = doc.year
        ? `${Number(doc.year) - 1}-${doc.year}`
        : `${doc.year - 1}-${doc.year}`;

      return {
        formId: doc.formId,
        fileName: doc.fileName,
        documentCategory: doc.documentCategory,
        filingDate: formatDateString(doc.dateOfFiling),
        financialYear,
        sizeKB: doc.fileSize ? Math.round(doc.fileSize / 1024) : 0, // Convert bytes to KB
        numberOfPages: doc.numberOfPages,
        downloadUrl: null, // hiding download url for free documents
        attachments,
        attachmentLabel: doc.attachmentLabel,
        fileType: doc.fileType,
      };
    });

  return {
    last_updated: companyDocs[0]?.updatedAt,
    v3_documents: transformedDocs,
  };
};

const getCompanyPublicDocumentsV2FromDB = async (companyId: string) => {
  // Get documents from the database using the company_id
  const companyDocs = await VpdDocumentV2.findOne({ company_id: companyId });

  if (!companyDocs) {
    throw new AppError(httpStatus.NOT_FOUND, 'No documents found for the given company ID');
  }

  // const formatDateString = (dateStr: string): string => {
  //   try {
  //     // Parse the date string in DD/MM/YYYY format
  //     const parsedDate = parse(dateStr, 'dd/MM/yyyy', new Date());
  //     // Format it to display as desired
  //     return format(parsedDate, 'dd-MMM-yyyy');
  //   } catch (error) {
  //     console.error('Error parsing date:', dateStr, error);
  //     return dateStr;
  //   }
  // };

  // Mapping of document categories to their full format
  const categoryMapping: Record<string, string> = {
    INCD: 'Incorporation Documents',
    CETF: 'Certificates',
    ARBE: 'Annual Returns and Balance Sheet eForms',
    // CHGD: 'Charge Documents',
    CRGD: 'Charge Documents',
    // CHDD: 'Change in Directors',
    CDRD: 'Change in Directors',
    LLPF: 'LLP Forms (Conversion of company to LLP)',
    OTRE: 'Other eForm Documents',
    OTRA: 'Other Attachments',
  };

  // Transform documents into a suitable response format
  const transformedDocs = companyDocs.documents.map(doc => {
    const startYear = parseInt(doc.year_of_filing, 10);
    const endYear = startYear + 1;
    const financialYear = `${startYear}-${endYear}`;

    // Extract formId if documentName contains "Form"
    const formIdMatch = doc.document_name.match(/Form\s+([A-Z0-9]+-[A-Z0-9]+)/i);
    const formId = formIdMatch ? `Form ${formIdMatch[1]}` : null;

    return {
      formId,
      fileName: doc.document_name,
      documentCategory: categoryMapping[doc.document_category] || 'Unknown Category',
      financialYear,
      filingDate: formatDateString(doc.date_of_filing),
    };
    // Add any additional fields or transformations as needed
  });

  // Include the last_updated field in the response
  return {
    lastUpdated: companyDocs.last_updated,
    v2_documents: transformedDocs,
  };
};

const getPaid_CompanyPublicDocumentsV2FromDB = async (
  userId: string,
  cin: string,
  sessionUser: string
) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check whether uId matches with session user id
  if (user.uId !== sessionUser) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to access this resource');
  }

  const isCompanyUnlocked = await UnlockedCompanyModel.findOne(
    { userId: userId, companyId: cin },
    {
      _id: 0,
      companyId: 1,
      expiryDate: 1,
    }
  );

  if (!isCompanyUnlocked) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to access this resource');
  }

  if (isCompanyUnlocked && isBefore(isCompanyUnlocked.expiryDate, new Date())) {
    throw new AppError(httpStatus.FORBIDDEN, 'Your company access has expired');
  }

  // Check the job status for the given CIN and userId
  const job = await JobModel.findOne({ cin, userId });

  if (!job) {
    throw new AppError(httpStatus.NOT_FOUND, 'No job found for the given company ID');
  }

  // Extract challanDownloadUrl if available
  const successfulAttempt = job.processingStages.challanPayment.attempts.find(
    attempt => attempt.attemptStatus === 'completed'
  );
  const challanDownloadUrl = successfulAttempt ? successfulAttempt.filename : null;
  const challanPaidAt = successfulAttempt ? successfulAttempt.attemptedAt : null;

  // Fetch documents regardless of job status
  const companyDocs = await VpdV2PaidDocumentModel.find({ cin });

  // if (!companyDocs.length) {
  //   throw new AppError(httpStatus.NOT_FOUND, 'No documents found for the given company ID');
  // }

  const categoryMapping: Record<string, string> = {
    INCD: 'Incorporation Documents',
    CETF: 'Certificates',
    ARBE: 'Annual Returns and Balance Sheet eForms',
    CRGD: 'Charge Documents',
    CDRD: 'Change in Directors',
    LLPF: 'LLP Forms (Conversion of company to LLP)',
    OTRE: 'Other eForm Documents',
    OTRA: 'Other Attachments',
  };

  const v2_paid_documents = companyDocs.map(doc => {
    const startYear = new Date(doc.filingDate).getFullYear();
    const financialYear = `${startYear - 1}-${startYear}`;

    // Extract formId if documentName contains "Form"
    const formIdMatch = doc.originalDocName.match(/Form\s+([A-Z0-9]+-[A-Z0-9]+)/i);
    const formId = formIdMatch ? `Form ${formIdMatch[1]}` : null;

    return {
      formId,
      fileName: doc.originalDocName,
      documentCategory: categoryMapping[doc.categoryCode] || 'Unknown Category',
      financialYear,
      filingDate: format(doc.filingDate, 'dd-MMM-yyyy'),
      downloadUrl: doc.downloaded
        ? `https://${doc.storage_account}.blob.core.windows.net/${doc.container}/${doc.uniqueDocName}`
        : null,
    };
  });

  // Handle different job statuses
  switch (job.jobStatus) {
    case 'pending': {
      return {
        message: 'The payment for the challan is under process...',
        v2_paid_documents,
        downloadStatus: {
          jobStatus: job.jobStatus,
          documentDownloadStatus: job.processingStages.documentDownload.status,
          totalDocuments: job.processingStages.documentDownload.totalDocuments,
          pendingDocuments: job.processingStages.documentDownload.pendingDocuments,
          downloadedDocuments: job.processingStages.documentDownload.downloadedDocuments,
        },
      };
    }

    case 'challan_paid': {
      return {
        message: 'Challan has been paid successfully.',
        v2_paid_documents,
        downloadStatus: {
          jobStatus: job.jobStatus,
          documentDownloadStatus: job.processingStages.documentDownload.status,
          totalDocuments: job.processingStages.documentDownload.totalDocuments,
          pendingDocuments: job.processingStages.documentDownload.pendingDocuments,
          downloadedDocuments: job.processingStages.documentDownload.downloadedDocuments,
          challanDownloadUrl,
          challanPaidAt,
        },
      };
    }

    case 'downloading_docs': {
      return {
        jobStatus: job.jobStatus,
        message: 'Documents are being downloaded.',
        v2_paid_documents,
        downloadStatus: {
          jobStatus: job.jobStatus,
          documentDownloadStatus: job.processingStages.documentDownload.status,
          totalDocuments: job.processingStages.documentDownload.totalDocuments,
          pendingDocuments: job.processingStages.documentDownload.pendingDocuments,
          challanDownloadUrl,
          challanPaidAt,
          downloadCompletedAt:
            job.processingStages.documentDownload.status === 'success'
              ? job.processingStages.documentDownload.lastUpdated
              : null, //lastUpdated is the date when the download status was last updated
          zipCompletedAt: job.processingStages.documentDownload.completedAt, //completedAt is the date when the zip file was created
          downloadedDocuments: job.processingStages.documentDownload.downloadedDocuments,
          totalZipFiles: job.processingStages.documentDownload.totalZipFiles,
        },
      };
    }

    case 'no_docs_found': {
      return {
        message: 'No filling found in MCA for the given company ID',
        v2_paid_documents,
        downloadStatus: {
          jobStatus: job.jobStatus,
        },
      };
    }

    case 'documents_downloaded': {
      return {
        message: 'All documents have been downloaded successfully.',
        v2_paid_documents,
        downloadStatus: {
          jobStatus: job.jobStatus,
          documentDownloadStatus: job.processingStages.documentDownload.status,
          totalDocuments: job.processingStages.documentDownload.totalDocuments,
          pendingDocuments: job.processingStages.documentDownload.pendingDocuments,
          challanDownloadUrl,
          challanPaidAt,
          downloadCompletedAt:
            job.processingStages.documentDownload.status === 'success'
              ? job.processingStages.documentDownload.lastUpdated
              : null, //lastUpdated is the date when the download status was last updated
          zipCompletedAt: job.processingStages.documentDownload.completedAt, //completedAt is the date when the zip file was created
          downloadedDocuments: job.processingStages.documentDownload.downloadedDocuments,
          totalZipFiles: job.processingStages.documentDownload.totalZipFiles,
          zipFiles: job.processingStages.documentDownload.zipFiles.map(zipFile => ({
            filename: extractZipFileName(zipFile.filename),
            blob_url: zipFile.blob_url,
            createdAt: zipFile.createdAt,
            total_size_bytes: zipFile.total_size_bytes,
            successful_files: zipFile.successful_files,
          })),
        },
      };
    }

    default:
      return {
        message: 'Job status is unknown or not handled.',
        v2_paid_documents,
        downloadStatus: {
          jobStatus: job.jobStatus,
          documentDownloadStatus: job.processingStages.documentDownload.status,
        },
      };
  }
};

const getPaid_CompanyPublicDocumentsV3FromDB = async (
  userId: string,
  cin: string,
  sessionUser: string
) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check whether uId matches with session user id
  if (user.uId !== sessionUser) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to access this resource');
  }

  const isCompanyUnlocked = await UnlockedCompanyModel.findOne(
    { userId: userId, companyId: cin },
    {
      _id: 0,
      companyId: 1,
      expiryDate: 1,
    }
  );

  if (!isCompanyUnlocked) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to access this resource');
  }

  if (isCompanyUnlocked && isBefore(isCompanyUnlocked.expiryDate, new Date())) {
    throw new AppError(httpStatus.FORBIDDEN, 'Your company access has expired');
  }

  // Get job status for download progress
  const job = await JobModel.findOne({ cin, userId });
  if (!job) {
    throw new AppError(httpStatus.NOT_FOUND, 'No job found for the given company ID');
  }

  // Calculate fake challanPaidAt time (2 minutes after job creation)
  const challanPaidAt = new Date(job.createdAt.getTime() + 2 * 60 * 1000);

  // Get documents from vpd_v3_2024 collection
  const companyDocs = await VpdV3DocumentModel.find({ cin }).sort({ updatedAt: -1 });

  if (!companyDocs) {
    throw new AppError(httpStatus.NOT_FOUND, 'No documents found for the given CIN');
  }

  // Transform vpdDocs into IPublicDocumentResponse format
  const transformedDocs: IPublicDocumentResponse[] = companyDocs
    .filter(doc => doc.formId && doc.fileName) //TODO: need to add s3Url
    // .filter(doc => doc.formId && doc.fileName && doc.s3Url) // Filter out any invalid documents
    .map(doc => {
      // Create attachments array with cleaned names
      const attachments: IPublicDocumentAttachment[] = doc.attachments
        ? doc.attachments.map(att => ({
            name: att.name.replace(/^\d+_/, ''),
            // name: att.name,
            downloadUrl: `https://${att.storage_account}.blob.core.windows.net/${att.container}/${att.azureAttachmentFilename}`, // hiding download url for free documents
          }))
        : [];

      // Get financial year from eventDate or year
      const financialYear = doc.year
        ? `${Number(doc.year) - 1}-${doc.year}`
        : `${doc.year - 1}-${doc.year}`;

      return {
        formId: doc.formId,
        fileName: doc.fileName,
        documentCategory: doc.documentCategory,
        filingDate: formatDateString(doc.dateOfFiling),
        financialYear,
        sizeKB: doc.fileSize ? Math.round(doc.fileSize / 1024) : 0, // Convert bytes to KB
        numberOfPages: doc.numberOfPages,
        downloadUrl: doc.fileDownloaded
          ? `https://${doc.storage_account}.blob.core.windows.net/${doc.container}/${doc.azureFileName}`
          : null,
        attachments,
        attachmentLabel: doc.attachmentLabel,
        fileType: doc.fileType,
      };
    });

  return {
    last_updated: companyDocs[0]?.updatedAt,
    v3_paid_documents: transformedDocs,
    downloadStatus: {
      documentDownloadStatus: job.processingStages.documentDownloadV3.status,
      totalDocuments: job.processingStages.documentDownloadV3.totalDocuments,
      downloadedDocuments: job.processingStages.documentDownloadV3.downloadedDocuments,
      pendingDocuments: job.processingStages.documentDownloadV3.pendingDocuments,
      downloadCompletedAt:
        job.processingStages.documentDownloadV3.status === 'success'
          ? job.processingStages.documentDownloadV3.lastUpdated
          : null, //lastUpdated is the date when the download status was last updated
      completionPercentage: job.processingStages.documentDownloadV3.completionPercentage,
      zipCompletedAt: job.processingStages.documentDownloadV3.completedAt, //completedAt is the date when the zip file was created
      challanPaidAt,
      totalZipFiles: job.processingStages.documentDownloadV3.totalZipFiles,
      zipFiles: job.processingStages.documentDownloadV3.zipFiles.map(zipFile => ({
        filename: extractZipFileName(zipFile.filename),
        blob_url: zipFile.blob_url,
        createdAt: zipFile.createdAt,
        total_size_bytes: zipFile.total_size_bytes,
        successful_files: zipFile.successful_files,
      })),
    },
  };
};

const getAdminPaidLLP_PublicDocumentsFromDB = async (cin: string) => {
  // Get documents from LlpVpdDocument collection
  const llpDocs = await LlpVpdDocument.findOne({ cin });

  if (!llpDocs) {
    throw new AppError(httpStatus.NOT_FOUND, 'No documents found for the given CIN');
  }

  // Transform vpdDocs into IPublicDocumentResponse format
  const transformedDocs: IPublicDocumentResponse[] = llpDocs.vpdDocs
    .filter(doc => doc.formId && doc.fileName && doc.s3Url) // Filter out any invalid documents
    .map(doc => {
      // Create attachments array with cleaned names
      const attachments: IPublicDocumentAttachment[] = doc.attachments
        ? doc.attachments.map(att => ({
            name: att.name.replace(/^\d+_/, ''),
            // name: att.name,
            downloadUrl: att
              .s3Url!.replace(
                'https://llpvpdv3docs-new.s3.amazonaws.com',
                'https://downloads.filesure.in/llp-vpd'
              )
              .replace(
                'https://llpvpdv3docs.s3.amazonaws.com',
                'https://downloads.filesure.in/llp-vpd'
              ),
          }))
        : [];

      // Get financial year from eventDate or year
      const financialYear = doc.eventDate
        ? `${Number(doc.eventDate.split('/')[2]) - 1}-${doc.eventDate.split('/')[2]}`
        : `${doc.year - 1}-${doc.year}`;

      return {
        formId: doc.formId,
        fileName: doc.fileName,
        documentCategory: doc.documentCategory,
        filingDate: formatDateString(doc.dateOfFiling),
        financialYear,
        sizeKB: doc.fileSize ? Math.round(doc.fileSize / 1024) : 0, // Convert bytes to KB
        numberOfPages: doc.numberOfPages,
        downloadUrl: doc
          .s3Url!.replace(
            'https://llpvpdv3docs-new.s3.amazonaws.com',
            'https://downloads.filesure.in/llp-vpd'
          )
          .replace(
            'https://llpvpdv3docs.s3.amazonaws.com',
            'https://downloads.filesure.in/llp-vpd'
          ),
        attachments,
        attachmentLabel: doc.attachmentLabel,
      };
    });

  return {
    last_updated: llpDocs.last_updated,
    v3_paid_documents: transformedDocs,
  };
};

const getAdminPaidLlpFinancialDataFromDB = async (cin: string): Promise<ILlpFinancialData> => {
  const llpDoc = await LlpVpdDocument.findOne({ cin }, { financial_data: 1 }).lean();

  if (!llpDoc) {
    throw new AppError(httpStatus.NOT_FOUND, 'No financial data found for the given CIN');
  }

  return llpDoc.financial_data || {};
};

const get_Admin_Paid_CompanyPublicDocumentsV2FromDB = async (userId: string, cin: string) => {
  // Check the job status for the given CIN and userId
  const job = await JobModel.findOne({ cin, userId });

  if (!job) {
    throw new AppError(httpStatus.NOT_FOUND, 'No job found for the given company ID');
  }

  // const companyData = await CompanyModel.findOne(
  //   { cin },
  //   { _id: 0, 'masterData.companyData.incorporationDateObj': 1 }
  // ).lean();

  // // Safely extract incorporation date with optional chaining
  // const incorporationDate = companyData?.masterData?.companyData?.incorporationDateObj;
  // const isCompanyAfterJuly2016 =
  //   incorporationDate && isAfter(new Date(incorporationDate), V2_SKIP_CHALLAN_CUTOFF_DATE);

  // Extract challanDownloadUrl if available
  const successfulAttempt = job.processingStages.challanPayment.attempts.find(
    attempt => attempt.attemptStatus === 'completed' || attempt.attemptStatus === 'challan_pending'
  );
  const challanDownloadUrl = successfulAttempt ? successfulAttempt.filename : null;
  const challanPaidAt = successfulAttempt ? successfulAttempt.attemptedAt : null;

  // Fetch documents regardless of job status
  const companyDocs = await VpdV2PaidDocumentModel.find({ cin });

  const categoryMapping: Record<string, string> = {
    INCD: 'Incorporation Documents',
    CETF: 'Certificates',
    ARBE: 'Annual Returns and Balance Sheet eForms',
    CRGD: 'Charge Documents',
    CDRD: 'Change in Directors',
    LLPF: 'LLP Forms (Conversion of company to LLP)',
    OTRE: 'Other eForm Documents',
    OTRA: 'Other Attachments',
  };

  const v2_paid_documents = companyDocs.map(doc => {
    const startYear = new Date(doc.filingDate).getFullYear();
    const financialYear = `${startYear - 1}-${startYear}`;

    // Extract formId if documentName contains "Form"
    const formIdMatch = doc.originalDocName.match(/Form\s+([A-Z0-9]+-[A-Z0-9]+)/i);
    const formId = formIdMatch ? `Form ${formIdMatch[1]}` : null;

    return {
      formId,
      fileName: doc.originalDocName,
      documentCategory: categoryMapping[doc.categoryCode] || 'Unknown Category',
      financialYear,
      filingDate: format(doc.filingDate, 'dd-MMM-yyyy'),
      downloadUrl: doc.downloaded
        ? `https://${doc.storage_account}.blob.core.windows.net/${doc.container}/${doc.uniqueDocName}`
        : null,
    };
  });

  // Handle different job statuses
  switch (job.jobStatus) {
    case 'pending': {
      return {
        message: 'The payment for the challan is under process...',
        v2_paid_documents,
        downloadStatus: {
          jobStatus: job.jobStatus,
          documentDownloadStatus: job.processingStages.documentDownload.status,
          totalDocuments: job.processingStages.documentDownload.totalDocuments,
          pendingDocuments: job.processingStages.documentDownload.pendingDocuments,
          downloadedDocuments: job.processingStages.documentDownload.downloadedDocuments,
        },
      };
    }

    case 'challan_skipped': {
      return {
        message:
          'V2 challan payment has been skipped as the company was incorporated after July 2016. V2 fillings merged with V3 fillings.',
        v2_paid_documents,
        downloadStatus: {
          jobStatus: job.jobStatus,
        },
      };
    }

    case 'challan_paid': {
      return {
        message: 'Challan has been paid successfully.',
        v2_paid_documents,
        downloadStatus: {
          jobStatus: job.jobStatus,
          documentDownloadStatus: job.processingStages.documentDownload.status,
          totalDocuments: job.processingStages.documentDownload.totalDocuments,
          pendingDocuments: job.processingStages.documentDownload.pendingDocuments,
          downloadedDocuments: job.processingStages.documentDownload.downloadedDocuments,
          challanDownloadUrl,
          challanPaidAt,
        },
      };
    }

    case 'downloading_docs': {
      return {
        jobStatus: job.jobStatus,
        message: 'Documents are being downloaded.',
        v2_paid_documents,
        downloadStatus: {
          jobStatus: job.jobStatus,
          documentDownloadStatus: job.processingStages.documentDownload.status,
          totalDocuments: job.processingStages.documentDownload.totalDocuments,
          pendingDocuments: job.processingStages.documentDownload.pendingDocuments,
          challanDownloadUrl,
          challanPaidAt,
          downloadCompletedAt:
            job.processingStages.documentDownload.status === 'success'
              ? job.processingStages.documentDownload.lastUpdated
              : null, //lastUpdated is the date when the download status was last updated
          zipCompletedAt: job.processingStages.documentDownload.completedAt, //completedAt is the date when the zip file was created
          downloadedDocuments: job.processingStages.documentDownload.downloadedDocuments,
          totalZipFiles: job.processingStages.documentDownload.totalZipFiles,
        },
      };
    }

    case 'no_docs_found': {
      return {
        message: 'No filling found in MCA for the given company ID',
        v2_paid_documents,
        downloadStatus: {
          jobStatus: job.jobStatus,
        },
      };
    }

    case 'documents_downloaded': {
      return {
        message: 'All documents have been downloaded successfully.',
        v2_paid_documents,
        downloadStatus: {
          jobStatus: job.jobStatus,
          documentDownloadStatus: job.processingStages.documentDownload.status,
          totalDocuments: job.processingStages.documentDownload.totalDocuments,
          pendingDocuments: job.processingStages.documentDownload.pendingDocuments,
          challanDownloadUrl,
          challanPaidAt,
          downloadCompletedAt:
            job.processingStages.documentDownload.status === 'success'
              ? job.processingStages.documentDownload.lastUpdated
              : null, //lastUpdated is the date when the download status was last updated
          zipCompletedAt: job.processingStages.documentDownload.completedAt, //completedAt is the date when the zip file was created
          downloadedDocuments: job.processingStages.documentDownload.downloadedDocuments,
          totalZipFiles: job.processingStages.documentDownload.totalZipFiles,
          zipFiles: job.processingStages.documentDownload.zipFiles.map(zipFile => ({
            filename: extractZipFileName(zipFile.filename),
            blob_url: zipFile.blob_url,
            createdAt: zipFile.createdAt,
            total_size_bytes: zipFile.total_size_bytes,
            successful_files: zipFile.successful_files,
          })),
        },
      };
    }

    default:
      return {
        message: 'Job status is unknown or not handled.',
        v2_paid_documents,
        downloadStatus: {
          jobStatus: job.jobStatus,
          documentDownloadStatus: job.processingStages.documentDownload.status,
        },
      };
  }
};

const get_Admin_Paid_CompanyPublicDocumentsV3FromDB = async (userId: string, cin: string) => {
  // Get documents from vpd_data_flat_v3_2025 collection
  const companyDocs = await VpdV3DocumentModel.find({ cin });

  if (!companyDocs) {
    throw new AppError(httpStatus.NOT_FOUND, 'No documents found for the given CIN');
  }

  // Get job status for download progress
  const job = await JobModel.findOne({ cin, userId });
  if (!job) {
    throw new AppError(httpStatus.NOT_FOUND, 'No job found for the given company ID');
  }

  // Calculate fake challanPaidAt time (2 minutes after job creation)
  const challanPaidAt = new Date(job.createdAt.getTime() + 2 * 60 * 1000);

  // Transform vpdDocs into IPublicDocumentResponse format
  const transformedDocs: IPublicDocumentResponse[] = companyDocs
    .filter(doc => doc.formId && doc.fileName) //TODO: need to add s3Url
    // .filter(doc => doc.formId && doc.fileName && doc.s3Url) // Filter out any invalid documents
    .map(doc => {
      // Create attachments array with cleaned names
      const attachments: IPublicDocumentAttachment[] = doc.attachments
        ? doc.attachments.map(att => ({
            name: att.name.replace(/^\d+_/, ''),
            // name: att.name,
            downloadUrl: `https://${att.storage_account}.blob.core.windows.net/${att.container}/${att.azureAttachmentFilename}`,
          }))
        : [];

      // Get financial year from eventDate or year
      const financialYear = doc.year
        ? `${Number(doc.year) - 1}-${doc.year}`
        : `${doc.year - 1}-${doc.year}`;

      return {
        formId: doc.formId,
        fileName: doc.fileName,
        documentCategory: doc.documentCategory,
        filingDate: formatDateString(doc.dateOfFiling),
        financialYear,
        sizeKB: doc.fileSize ? Math.round(doc.fileSize / 1024) : 0, // Convert bytes to KB
        numberOfPages: doc.numberOfPages,
        downloadUrl: doc.fileDownloaded
          ? `https://${doc.storage_account}.blob.core.windows.net/${doc.container}/${doc.azureFileName}`
          : null,
        attachments,
        attachmentLabel: doc.attachmentLabel,
        fileType: doc.fileType,
      };
    });

  return {
    last_updated: companyDocs[0]?.updatedAt,
    v3_paid_documents: transformedDocs,
    downloadStatus: {
      documentDownloadStatus: job.processingStages.documentDownloadV3.status,
      totalDocuments: job.processingStages.documentDownloadV3.totalDocuments,
      downloadedDocuments: job.processingStages.documentDownloadV3.downloadedDocuments,
      pendingDocuments: job.processingStages.documentDownloadV3.pendingDocuments,
      downloadCompletedAt:
        job.processingStages.documentDownloadV3.status === 'success'
          ? job.processingStages.documentDownloadV3.lastUpdated
          : null, //lastUpdated is the date when the download status was last updated
      completionPercentage: job.processingStages.documentDownloadV3.completionPercentage,
      zipCompletedAt: job.processingStages.documentDownloadV3.completedAt, //completedAt is the date when the zip file was created
      challanPaidAt,
      totalZipFiles: job.processingStages.documentDownloadV3.totalZipFiles,
      zipFiles: job.processingStages.documentDownloadV3.zipFiles.map(zipFile => ({
        filename: extractZipFileName(zipFile.filename),
        blob_url: zipFile.blob_url,
        createdAt: zipFile.createdAt,
        total_size_bytes: zipFile.total_size_bytes,
        successful_files: zipFile.successful_files,
      })),
    },
  };
};

const getCompanyAndLLPCounts = async () => {
  const today = new Date();
  // Previous day calculation
  const previousDay = subDays(today, 1);
  const previousDayStart = startOfDay(previousDay);
  const previousDayEnd = endOfDay(previousDay);

  // eslint-disable-next-line quotes
  const previousDayStartString = format(previousDayStart, "yyyy-MM-dd'T'00:00:00.000'+00:00'");
  // eslint-disable-next-line quotes
  const previousDayEndString = format(previousDayEnd, "yyyy-MM-dd'T'23:59:59.999'+00:00'");

  const previousMonthStart = startOfMonth(subMonths(today, 1));
  const previousMonthEnd = endOfMonth(subMonths(today, 1));

  // eslint-disable-next-line quotes
  const previousMonthStartString = format(previousMonthStart, "yyyy-MM-dd'T'HH:mm:ss.SSS'+00:00'");
  // eslint-disable-next-line quotes
  const previousMonthEndString = format(previousMonthEnd, "yyyy-MM-dd'T'HH:mm:ss.SSS'+00:00'");

  const companyCount = await CompanyModel.countDocuments({
    'masterData.companyData.companyType': 'Company',
  });

  const llpCount = await CompanyModel.countDocuments({
    'masterData.companyData.companyType': 'LLP',
  });

  const directorCount = Math.round((companyCount + llpCount) * 2.58);

  const previousDayCompanies = await CompanyModel.countDocuments({
    'masterData.companyData.companyType': 'Company',
    'masterData.companyData.incorporationDateObj': {
      $gte: previousDayStartString,
      $lte: previousDayEndString,
    },
  });

  const previousDayLLPs = await CompanyModel.countDocuments({
    'masterData.companyData.companyType': 'LLP',
    'masterData.companyData.incorporationDateObj': {
      $gte: previousDayStartString,
      $lte: previousDayEndString,
    },
  });

  const previousDayDirectorCount = Math.round((previousDayCompanies + previousDayLLPs) * 2.58);

  const previousMonthCompanies = await CompanyModel.countDocuments({
    'masterData.companyData.companyType': 'Company',
    'masterData.companyData.incorporationDateObj': {
      $gte: previousMonthStartString,
      $lte: previousMonthEndString,
    },
  });

  const previousMonthLLPs = await CompanyModel.countDocuments({
    'masterData.companyData.companyType': 'LLP',
    'masterData.companyData.incorporationDateObj': {
      $gte: previousMonthStartString,
      $lte: previousMonthEndString,
    },
  });

  const previousMonthDirectorCount = Math.round(
    (previousMonthCompanies + previousMonthLLPs) * 2.58
  );

  return {
    companyCount,
    llpCount,
    directorCount,
    previousDayCompanies,
    previousDayLLPs,
    previousDayDirectorCount,
    previousMonthCompanies,
    previousMonthLLPs,
    previousMonthDirectorCount,
  };
};

export const CompanyServices = {
  getCompanySuggestionsFromDB,
  getDashboardCompanySuggestionsFromDB,
  getCompanyAdvanceSearchFromDB,
  getCompanyAdvanceSearchFacetsFromDB,
  getSingleCompanyDetailsFromDB,
  getChargeDetailsFromDB,
  getOneTimeComplianceDetailsFromDB,
  getAnnualComplianceDetailsFromDB,
  getGstComplianceDetailsFromDB,
  createCompanyDataUpdateRequestIntoDB,
  getCompanyDataUpdateStatusFromDB,
  getSimilarCompaniesFromDB,
  getLLP_PublicDocumentsFromDB,
  getPaidLLP_PublicDocumentsFromDB,
  getPaidLlpFinancialDataFromDB,
  getCompanyPublicDocumentsV3FromDB,
  getCompanyPublicDocumentsV2FromDB,
  getPaid_CompanyPublicDocumentsV2FromDB,
  getPaid_CompanyPublicDocumentsV3FromDB,
  getAdminPaidLlpFinancialDataFromDB,
  getAdminPaidLLP_PublicDocumentsFromDB,
  get_Admin_Paid_CompanyPublicDocumentsV2FromDB,
  get_Admin_Paid_CompanyPublicDocumentsV3FromDB,
  getCompanyAndLLPCounts,
};
