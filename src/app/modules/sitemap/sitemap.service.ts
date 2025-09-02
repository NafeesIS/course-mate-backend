import { CompanyModel } from '../company/company.model';

const getAllCompanyCINFromDB = async (query: Record<string, unknown>) => {
  const results = await CompanyModel.find({
    companyId: { $gt: Number(query.start), $lte: Number(query.end) },
  })
    .sort({ _id: 1 })
    .select('cin company'); // Select only 'cin' and 'company' fields

  return results;
};

const getTotalCompanyCountFromDB = async () => {
  const count = await CompanyModel.estimatedDocumentCount();
  return count;
};

export const SitemapServices = {
  getAllCompanyCINFromDB,
  getTotalCompanyCountFromDB,
};
