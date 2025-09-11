// src/app/modules/course/module.service.ts
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import { UserModel } from "../user/user.model";
import httpStatus from "http-status";
import { IModule } from "../module/module.interface";
import { CourseModel } from "../course/course.model";
import {  ModuleModel } from "../module/module.model";
import { LectureModel } from "../lecture/lecture.model";

const createModuleIntoDB = async (payload: Partial<IModule>, userId: string) => {
  // Verify user and course permissions
  const user = await UserModel.findOne({ supertokensId: userId });
  if (!user || user.role !== 'admin') {
    throw new AppError(httpStatus.FORBIDDEN, 'Only admins can create modules');
  }

  const course = await CourseModel.findById(payload.courseId);
  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
  }

  const result = await ModuleModel.create(payload);
  return result;
};

const getModulesByCourseFromDB = async (courseId: string) => {
  const result = await ModuleModel.find({ courseId })
    .populate('courseId', 'title')
    .sort({ moduleNumber: 1 });
  return result;
};

const updateModuleIntoDB = async (id: string, payload: Partial<IModule>, userId: string) => {
  const user = await UserModel.findOne({ supertokensId: userId });
  if (!user || user.role !== 'admin') {
    throw new AppError(httpStatus.FORBIDDEN, 'Access denied');
  }

  const result = await ModuleModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Module not found');
  }

  return result;
};

const deleteModuleFromDB = async (id: string, userId: string) => {
  const user = await UserModel.findOne({ supertokensId: userId });
  if (!user || user.role !== 'admin') {
    throw new AppError(httpStatus.FORBIDDEN, 'Access denied');
  }

  // Delete all lectures in this module
  await LectureModel.deleteMany({ moduleId: id });
  
  const result = await ModuleModel.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Module not found');
  }

  return result;
};

export const ModuleServices = {
  createModuleIntoDB,
  getModulesByCourseFromDB,
  updateModuleIntoDB,
  deleteModuleFromDB,
};

