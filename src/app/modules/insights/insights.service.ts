import { CompanyModel } from '../company/company.model';
import { RecentSearchDTO, recentSearchZodSchema } from './insights.interface';
import RecentSearches, { IRecentSearches } from './insights.model';

const createRecentSearchesIntoDB = async (
  searchData: RecentSearchDTO
): Promise<IRecentSearches> => {
  // Validate incoming data using Zod schema
  const validatedData = recentSearchZodSchema.parse(searchData);

  // Check if recent search already exists by path and idNo
  const existingSearch = await RecentSearches.findOne({
    idNo: validatedData.idNo,
  });

  if (existingSearch) {
    // If it exists, increment the count
    existingSearch.count = (existingSearch.count ?? 0) + 1;
    await existingSearch.save();
    return existingSearch;
  } else {
    // If it doesn't exist, create a new record
    const newSearch = await RecentSearches.create(validatedData);
    return newSearch;
  }
};

const getRecentSearchesFromDB = async (): Promise<{
  recentCompanies: IRecentSearches[];
  recentDirectors: IRecentSearches[];
}> => {
  const recentCompanies = await RecentSearches.aggregate([
    { $match: { type: 'company' } },
    { $sort: { updatedAt: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'company_data',
        localField: 'idNo',
        foreignField: 'cin',
        as: 'companyDetails',
      },
    },
    { $unwind: { path: '$companyDetails', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        idNo: 1,
        name: 1,
        type: 1,
        updatedAt: 1,
        count: 1,
        state: {
          $ifNull: [
            {
              $arrayElemAt: [
                '$companyDetails.masterData.companyData.MCAMDSCompanyAddress.state',
                0,
              ],
            },
            null,
          ],
        },
        status: { $ifNull: ['$companyDetails.masterData.companyData.llpStatus', null] },
        companyType: { $ifNull: ['$companyDetails.masterData.companyData.companyType', null] },
        dateOfIncorporation: {
          $ifNull: ['$companyDetails.masterData.companyData.dateOfIncorporation', null],
        },
        category: '$companyDetails.masterData.companyData.companyCategory',
        classOfCompany: '$companyDetails.masterData.companyData.classOfCompany',
      },
    },
  ]);

  const recentDirectors = await RecentSearches.aggregate([
    { $match: { type: 'director' } },
    { $sort: { updatedAt: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'director_data',
        localField: 'idNo',
        foreignField: 'din',
        as: 'directorDetails',
      },
    },
    { $unwind: { path: '$directorDetails', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        idNo: 1,
        name: 1,
        type: 1,
        updatedAt: 1,
        count: 1,
        status: { $ifNull: ['$directorDetails.status', null] },
        personType: { $ifNull: ['$directorDetails.personType', null] },
        nationality: { $ifNull: ['$directorDetails.nationality', null] },
      },
    },
  ]);

  return { recentCompanies, recentDirectors };
};

const getPopularSearchesFromDB = async (): Promise<{
  popularCompanies: IRecentSearches[];
  popularDirectors: IRecentSearches[];
}> => {
  const popularCompanies = await RecentSearches.aggregate([
    { $match: { type: 'company' } },
    { $sort: { count: -1, updatedAt: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'company_data',
        localField: 'idNo',
        foreignField: 'cin',
        as: 'companyDetails',
      },
    },
    { $unwind: { path: '$companyDetails', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        idNo: 1,
        name: 1,
        type: 1,
        updatedAt: 1,
        count: 1,
        state: {
          $ifNull: [
            {
              $arrayElemAt: [
                '$companyDetails.masterData.companyData.MCAMDSCompanyAddress.state',
                0,
              ],
            },
            null,
          ],
        },
        status: { $ifNull: ['$companyDetails.masterData.companyData.llpStatus', null] },
        companyType: { $ifNull: ['$companyDetails.masterData.companyData.companyType', null] },
        dateOfIncorporation: {
          $ifNull: ['$companyDetails.masterData.companyData.dateOfIncorporation', null],
        },
        category: '$companyDetails.masterData.companyData.companyCategory',
        classOfCompany: '$companyDetails.masterData.companyData.classOfCompany',
      },
    },
  ]);

  const popularDirectors = await RecentSearches.aggregate([
    { $match: { type: 'director' } },
    { $sort: { count: -1, updatedAt: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'director_data',
        localField: 'idNo',
        foreignField: 'din',
        as: 'directorDetails',
      },
    },
    { $unwind: { path: '$directorDetails', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        idNo: 1,
        name: 1,
        type: 1,
        updatedAt: 1,
        count: 1,
        status: { $ifNull: ['$directorDetails.status', null] },
        personType: { $ifNull: ['$directorDetails.personType', null] },
        nationality: { $ifNull: ['$directorDetails.nationality', null] },
      },
    },
  ]);

  return { popularCompanies, popularDirectors };
};

// const getRecentlyIncorporatedCompaniesFromDB = async () => {
//   const recentlyIncorporated = await CompanyModel.aggregate([
//     // Sort by createdAt in descending order
//     { $sort: { createdAt: -1 } },
//     // Limit to the top 10 results
//     { $limit: 10 },
//     // Project the fields you need
//     {
//       $project: {
//         cin: 1,
//         company: 1,
//         state: {
//           $ifNull: [
//             {
//               $arrayElemAt: ['$masterData.companyData.MCAMDSCompanyAddress.state', 0],
//             },
//             null,
//           ],
//         },
//         status: { $ifNull: ['$masterData.companyData.llpStatus', null] },
//         companyType: { $ifNull: ['$masterData.companyData.companyType', null] },
//         dateOfIncorporation: {
//           $ifNull: ['$masterData.companyData.dateOfIncorporation', null],
//         },
//         category: '$masterData.companyData.companyCategory',
//         classOfCompany: '$masterData.companyData.classOfCompany',
//       },
//     },
//   ]);

//   return recentlyIncorporated;
// };

const getRecentlyIncorporatedCompaniesFromDB = async () => {
  // Aggregate for companies with companyType 'Company'
  const companies = await CompanyModel.aggregate([
    // Match documents where companyType is 'Company'
    { $match: { 'masterData.companyData.companyType': 'Company' } },
    // Sort by createdAt in descending order
    { $sort: { createdAt: -1 } },
    // Limit to 5 results
    { $limit: 5 },
    // Project the fields you need
    {
      $project: {
        cin: 1,
        company: 1,
        state: {
          $ifNull: [
            {
              $arrayElemAt: ['$masterData.companyData.MCAMDSCompanyAddress.state', 0],
            },
            null,
          ],
        },
        status: { $ifNull: ['$masterData.companyData.llpStatus', null] },
        companyType: { $ifNull: ['$masterData.companyData.companyType', null] },
        dateOfIncorporation: {
          $ifNull: ['$masterData.companyData.dateOfIncorporation', null],
        },
        category: '$masterData.companyData.companyCategory',
        classOfCompany: '$masterData.companyData.classOfCompany',
      },
    },
  ]);

  // Aggregate for companies with companyType 'LLP'
  const llps = await CompanyModel.aggregate([
    // Match documents where companyType is 'LLP'
    { $match: { 'masterData.companyData.companyType': 'LLP' } },
    // Sort by createdAt in descending order
    { $sort: { createdAt: -1 } },
    // Limit to 5 results
    { $limit: 5 },
    // Project the fields you need
    {
      $project: {
        cin: 1,
        company: 1,
        state: {
          $ifNull: [
            {
              $arrayElemAt: ['$masterData.companyData.MCAMDSCompanyAddress.state', 0],
            },
            null,
          ],
        },
        status: { $ifNull: ['$masterData.companyData.llpStatus', null] },
        companyType: { $ifNull: ['$masterData.companyData.companyType', null] },
        dateOfIncorporation: {
          $ifNull: ['$masterData.companyData.dateOfIncorporation', null],
        },
        category: '$masterData.companyData.companyCategory',
        classOfCompany: '$masterData.companyData.classOfCompany',
      },
    },
  ]);

  // Combine results of both queries
  const recentlyIncorporated = { companies, llps };

  return recentlyIncorporated;
};

export const InsightsServices = {
  createRecentSearchesIntoDB,
  getRecentSearchesFromDB,
  getPopularSearchesFromDB,
  getRecentlyIncorporatedCompaniesFromDB,
};
