import { UserModel, IUser } from "./user.model";

/**
 * Create a new user
 */
export const createUser = async (data: Partial<IUser>) => {
  const user = new UserModel(data);
  return await user.save();
};

/**
 * Find user by ID
 */
export const getUserById = async (id: string) => {
  return await UserModel.findById(id);
};

/**
 * Find user by email
 */
export const getUserByEmail = async (email: string) => {
  return await UserModel.findOne({ email });
};

/**
 * Get all users
 */
export const getAllUsers = async () => {
  return await UserModel.find().sort({ createdAt: -1 });
};

/**
 * Update a user by ID
 */
export const updateUser = async (id: string, data: Partial<IUser>) => {
  return await UserModel.findByIdAndUpdate(id, data, { new: true });
};

/**
 * Delete a user by ID
 */
export const deleteUser = async (id: string) => {
  return await UserModel.findByIdAndDelete(id);
};
