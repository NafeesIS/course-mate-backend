// src/app/modules/course/lecture.service.ts

import { Types } from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import {  UserProgressModel } from "../course/course.model";
import { UserModel } from "../user/user.model";
import httpStatus from "http-status";
import { ModuleModel } from "../module/module.model";
import { ILecture } from "./lecture.interface";
import { LectureModel } from "./lecture.model";

const createLectureIntoDB = async (payload: Partial<ILecture>, userId: string) => {
  // Verify user permissions
  const user = await UserModel.findOne({ supertokensId: userId });
  if (!user || user.role !== 'admin') {
    throw new AppError(httpStatus.FORBIDDEN, 'Only admins can create lectures');
  }

  // Verify module exists
  const module = await ModuleModel.findById(payload.moduleId);
  if (!module) {
    throw new AppError(httpStatus.NOT_FOUND, 'Module not found');
  }

  // Add courseId from module
  payload.courseId = module.courseId;

  const result = await LectureModel.create(payload);
  return result;
};

const getLecturesByModuleFromDB = async (moduleId: string) => {
  const result = await LectureModel.find({ moduleId })
    .populate('moduleId', 'title moduleNumber')
    .populate('courseId', 'title')
    .sort({ lectureNumber: 1 });
  return result;
};

const getAllLecturesFromDB = async (query: Record<string, unknown>) => {
  const lectureQuery = new QueryBuilder(
    LectureModel.find()
      .populate('moduleId', 'title moduleNumber')
      .populate('courseId', 'title'),
    query
  )
    .search(['title'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await lectureQuery.modelQuery;
  const meta = await lectureQuery.countTotal();

  return { result, meta };
};

const updateLectureIntoDB = async (id: string, payload: Partial<ILecture>, userId: string) => {
  const user = await UserModel.findOne({ supertokensId: userId });
  if (!user || user.role !== 'admin') {
    throw new AppError(httpStatus.FORBIDDEN, 'Access denied');
  }

  const result = await LectureModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Lecture not found');
  }

  return result;
};

const deleteLectureFromDB = async (id: string, userId: string) => {
  const user = await UserModel.findOne({ supertokensId: userId });
  if (!user || user.role !== 'admin') {
    throw new AppError(httpStatus.FORBIDDEN, 'Access denied');
  }

  const result = await LectureModel.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Lecture not found');
  }

  return result;
};

const markLectureCompleteInDB = async (lectureId: string, userId: string) => {
  const user = await UserModel.findOne({ supertokensId: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const lecture = await LectureModel.findById(lectureId);
  if (!lecture) {
    throw new AppError(httpStatus.NOT_FOUND, 'Lecture not found');
  }

  // Get user progress for this course
  let progress = await UserProgressModel.findOne({
    userId: user._id,
    courseId: lecture.courseId,
  });

  if (!progress) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not enrolled in this course');
  }

  // Add lecture to completed if not already completed
  if (!progress.completedLectures.includes(new Types.ObjectId(lectureId))) {
    progress.completedLectures.push(new Types.ObjectId(lectureId));
    
    // Calculate progress percentage
    const totalLectures = await LectureModel.countDocuments({ courseId: lecture.courseId });
    progress.progressPercentage = Math.round((progress.completedLectures.length / totalLectures) * 100);
    
    // Update current lecture to next incomplete lecture
    const allLectures = await LectureModel.find({ courseId: lecture.courseId })
      .populate('moduleId')
      .sort({ 'moduleId.moduleNumber': 1, lectureNumber: 1 });
    
    const nextLecture = allLectures.find(l => 
      !progress!.completedLectures.includes(l._id)
    );
    
    progress.currentLecture = nextLecture?._id || progress.currentLecture;
    progress.lastAccessed = new Date();
    
    await progress.save();
  }

  return progress;
};

const getUserProgressFromDB = async (courseId: string, userId: string) => {
  const user = await UserModel.findOne({ supertokensId: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const progress = await UserProgressModel.findOne({
    userId: user._id,
    courseId,
  }).populate('completedLectures').populate('currentLecture');

  if (!progress) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not enrolled in this course');
  }

  return progress;
};

export const LectureServices = {
  createLectureIntoDB,
  getLecturesByModuleFromDB,
  getAllLecturesFromDB,
  updateLectureIntoDB,
  deleteLectureFromDB,
  markLectureCompleteInDB,
  getUserProgressFromDB,
};