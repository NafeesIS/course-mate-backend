import AppError from "../../errors/AppError";
import { UserModel } from "../user/user.model";
import httpStatus from "http-status";
import { IModule } from "./module.interface";
import { CourseModel } from "../course/course.model";
import { ModuleModel } from "./module.model";
import { LectureModel } from "../lecture/lecture.model";

const createModuleIntoDB = async (payload: Partial<IModule>, userId: string) => {
  // Verify user and course permissions
  const user = await UserModel.findOne({ uId: userId });
  if (!user || !user.roles.includes('admin')) {
    throw new AppError(httpStatus.FORBIDDEN, 'Only admins can create modules');
  }

  const course = await CourseModel.findOne({ _id: payload.courseId, isActive: true });
  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
  }

  // Check if user owns the course or is admin
  if (course.createdBy !== userId && !user.roles.includes('admin')) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only create modules for your own courses');
  }

  // Auto-increment module number within the course
  const lastModule = await ModuleModel.findOne({ courseId: payload.courseId })
    .sort({ moduleNumber: -1 });
  
  payload.moduleNumber = (lastModule?.moduleNumber || 0) + 1;

  const result = await ModuleModel.create(payload);
  return result;
};

const getModulesByCourseFromDB = async (courseId: string, userId?: string) => {
  // Verify course exists and is active
  const course = await CourseModel.findOne({ _id: courseId, isActive: true });
  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
  }

  const modules = await ModuleModel.find({ courseId, isActive: true })
    .populate('courseId', 'title')
    .sort({ moduleNumber: 1 });

  // Get lecture count for each module
  const modulesWithStats = await Promise.all(
    modules.map(async (module) => {
      const lectureCount = await LectureModel.countDocuments({ 
        moduleId: module._id, 
        isActive: true 
      });

      return {
        ...module.toObject(),
        lectureCount
      };
    })
  );

  return modulesWithStats;
};

const getSingleModuleFromDB = async (id: string, userId?: string) => {
  const module = await ModuleModel.findOne({ _id: id, isActive: true })
    .populate('courseId', 'title description');

  if (!module) {
    throw new AppError(httpStatus.NOT_FOUND, 'Module not found');
  }

  // Get lectures for this module
  const lectures = await LectureModel.find({ moduleId: id, isActive: true })
    .sort({ lectureNumber: 1 });

  const lectureCount = lectures.length;
  const totalDuration = lectures.reduce((sum, lecture) => sum + (lecture.duration || 0), 0);

  return {
    ...module.toObject(),
    lectures,
    lectureCount,
    totalDuration
  };
};

const updateModuleIntoDB = async (id: string, payload: Partial<IModule>, userId: string) => {
  const user = await UserModel.findOne({ uId: userId });
  if (!user || !user.roles.includes('admin')) {
    throw new AppError(httpStatus.FORBIDDEN, 'Access denied');
  }

  const module = await ModuleModel.findOne({ _id: id, isActive: true })
    .populate('courseId');

  if (!module) {
    throw new AppError(httpStatus.NOT_FOUND, 'Module not found');
  }

  // Check if user owns the course or is admin
  const course = module.courseId as any;
  if (course.createdBy !== userId && !user.roles.includes('admin')) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only update modules for your own courses');
  }

  const result = await ModuleModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

const deleteModuleFromDB = async (id: string, userId: string) => {
  const user = await UserModel.findOne({ uId: userId });
  if (!user || !user.roles.includes('admin')) {
    throw new AppError(httpStatus.FORBIDDEN, 'Access denied');
  }

  const module = await ModuleModel.findOne({ _id: id, isActive: true })
    .populate('courseId');

  if (!module) {
    throw new AppError(httpStatus.NOT_FOUND, 'Module not found');
  }

  // Check if user owns the course or is admin
  const course = module.courseId as any;
  if (course.createdBy !== userId && !user.roles.includes('admin')) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only delete modules for your own courses');
  }

  // Soft delete all lectures in this module first
  await LectureModel.updateMany({ moduleId: id }, { isActive: false });
  
  // Soft delete the module
  const result = await ModuleModel.findByIdAndUpdate(id, { isActive: false }, { new: true });

  return result;
};

const reorderModulesInDB = async (courseId: string, moduleOrders: { moduleId: string; moduleNumber: number }[], userId: string) => {
  const user = await UserModel.findOne({ uId: userId });
  if (!user || !user.roles.includes('admin')) {
    throw new AppError(httpStatus.FORBIDDEN, 'Access denied');
  }

  const course = await CourseModel.findOne({ _id: courseId, isActive: true });
  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
  }

  // Check if user owns the course or is admin
  if (course.createdBy !== userId && !user.roles.includes('admin')) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only reorder modules for your own courses');
  }

  // Update module orders
  const updatePromises = moduleOrders.map(({ moduleId, moduleNumber }) =>
    ModuleModel.findByIdAndUpdate(moduleId, { moduleNumber }, { new: true })
  );

  const results = await Promise.all(updatePromises);
  return results;
};

export const ModuleServices = {
  createModuleIntoDB,
  getModulesByCourseFromDB,
  getSingleModuleFromDB,
  updateModuleIntoDB,
  deleteModuleFromDB,
  reorderModulesInDB,
};