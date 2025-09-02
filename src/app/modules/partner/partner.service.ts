import { PartnerModel } from './partner.model';

const getAllPartnerFromDB = async () => {
  const result = await PartnerModel.aggregate([
    {
      $project: {
        partnerId: 1,
        name: '$copDetails.name',
        designation: '$copDetails.designation',
        profileImg: '$copDetails.profileImg',
        firmName: '$firmDetails.firmName',
        firmType: '$firmDetails.firmType',
        firmAddress: '$firmDetails.firmAddress',
        areaOfSpecialization: '$practiceDetails.areaOfSpecialization',
      },
    },
  ]);
  return result;
};
const getSinglePartnerFromDB = async (query: Record<string, unknown>) => {
  const result = await PartnerModel.findOne({ partnerId: query.partnerId });
  return result;
};

export const PartnerServices = {
  getSinglePartnerFromDB,
  getAllPartnerFromDB,
};
