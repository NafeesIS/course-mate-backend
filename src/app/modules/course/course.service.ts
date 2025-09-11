// src/app/modules/course/course.service.ts
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import { UserModel } from "../user/user.model";
import { CourseModel, UserProgressModel } from "./course.model";
import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import { ICourse } from "./course.interface";
import { ModuleModel } from "../module/module.model";
import { LectureModel } from "../lecture/lecture.model";

const createCourseIntoDB = async (payload: Partial<ICourse>) => {
  // Verify user exists and has admin role
  const user = await UserModel.findOne({ supertokensId: payload.createdBy });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
  }
  
  if (user.role !== 'admin') {
    throw new AppError(httpStatus.FORBIDDEN, 'Only admins can create courses');
  }

  const result = await CourseModel.create(payload);
  return result;
};

const getAllCoursesFromDB = async (query: Record<string, unknown>) => {
  const courseQuery = new QueryBuilder(
    CourseModel.find().populate('createdBy', 'email'),
    query
  )
    .search(['title', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await courseQuery.modelQuery;
  const meta = await courseQuery.countTotal();

  return {
    result,
    meta,
  };
};

const getSingleCourseFromDB = async (id: string) => {
  const result = await CourseModel.findById(id)
    .populate('createdBy', 'email')
    .lean();
    
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
  }

  // Get course modules and lectures
  const modules = await ModuleModel.find({ courseId: id })
    .sort({ moduleNumber: 1 })
    .lean();

  const moduleIds = modules.map(module => module._id);
  const lectures = await LectureModel.find({ moduleId: { $in: moduleIds } })
    .sort({ lectureNumber: 1 })
    .lean();

  // Group lectures by module
  const modulesWithLectures = modules.map(module => ({
    ...module,
    lectures: lectures.filter(lecture => 
      lecture.moduleId.toString() === module._id.toString()
    )
  }));

  return {
    ...result,
    modules: modulesWithLectures,
  };
};

const updateCourseIntoDB = async (id: string, payload: Partial<ICourse>, userId: string) => {
  // Verify course exists and user has permission
  const course = await CourseModel.findById(id);
  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
  }

  const user = await UserModel.findOne({ supertokensId: userId });
  if (!user || (user.role !== 'admin' && course.createdBy.toString() !== user._id.toString())) {
    throw new AppError(httpStatus.FORBIDDEN, 'Access denied');
  }

  const result = await CourseModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).populate('createdBy', 'email');

  return result;
};

const deleteCourseFromDB = async (id: string, userId: string) => {
  const course = await CourseModel.findById(id);
  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
  }

  const user = await UserModel.findOne({ supertokensId: userId });
  if (!user || (user.role !== 'admin' && course.createdBy.toString() !== user._id.toString())) {
    throw new AppError(httpStatus.FORBIDDEN, 'Access denied');
  }

  // Delete related data
  const modules = await ModuleModel.find({ courseId: id });
  const moduleIds = modules.map(m => m._id);
  
  await LectureModel.deleteMany({ moduleId: { $in: moduleIds } });
  await ModuleModel.deleteMany({ courseId: id });
  await UserProgressModel.deleteMany({ courseId: id });
  
  const result = await CourseModel.findByIdAndDelete(id);
  return result;
};

const getEnrolledCoursesFromDB = async (userId: string) => {
  const user = await UserModel.findOne({ supertokensId: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const enrollments = await UserProgressModel.find({ userId: user._id })
    .populate({
      path: 'courseId',
      populate: { path: 'createdBy', select: 'email' }
    })
    .populate('currentLecture')
    .sort({ enrolledAt: -1 });

  return enrollments;
};

const enrollUserIntoCourse = async (userId: string, courseId: string) => {
  const user = await UserModel.findOne({ supertokensId: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
  }

  // Check if already enrolled
  const existing = await UserProgressModel.findOne({ 
    userId: user._id, 
    courseId: courseId 
  });
  
  if (existing) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Already enrolled in this course');
  }

  // Get first lecture as current lecture
  const firstModule = await ModuleModel.findOne({ courseId })
    .sort({ moduleNumber: 1 });
    
  let currentLecture = null;
  if (firstModule) {
    const firstLecture = await LectureModel.findOne({ moduleId: firstModule._id })
      .sort({ lectureNumber: 1 });
    currentLecture = firstLecture?._id || null;
  }

  const enrollment = await UserProgressModel.create({
    userId: user._id,
    courseId,
    currentLecture,
    progressPercentage: 0,
    completedLectures: [],
  });

  return enrollment;
};

export const CourseServices = {
  createCourseIntoDB,
  getAllCoursesFromDB,
  getSingleCourseFromDB,
  updateCourseIntoDB,
  deleteCourseFromDB,
  getEnrolledCoursesFromDB,
  enrollUserIntoCourse,
};