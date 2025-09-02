import { TPromoUser } from './academy.interface';
import { PromoUserModel } from './academy.model';

const getPromoUserIntoDB = async () => {
  const result = await PromoUserModel.find();
  return result;
};
const createPromoUserIntoDB = async (payload: TPromoUser) => {
  const result = await PromoUserModel.findOneAndUpdate({ email: payload.email }, payload, {
    upsert: true,
    new: true,
  });
  return result;
};

export const AcademyServices = {
  createPromoUserIntoDB,
  getPromoUserIntoDB,
};
