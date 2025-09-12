import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import { UserModel } from "../user/user.model";
import { CourseModel, UserProgressModel } from "./course.model";
import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import { ICourse, ICourseWithProgress } from "./course.interface";
import { ModuleModel } from "../module/module.model";
import { LectureModel } from "../lecture/lecture.model";

const createCourseIntoDB = async (payload: Partial<ICourse>, userId: string) => {
  // Verify user exists and has admin role
  const user = await UserModel.findOne({ uId: userId });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
  }
  
  if (!user.roles.includes('admin')) {
    throw new AppError(httpStatus.FORBIDDEN, 'Only admins can create courses');
  }

  // Set the creator
  payload.createdBy = userId;

  const result = await CourseModel.create(payload);
  return result;
};

const getAllCoursesFromDB = async (query: Record<string, unknown>, userId?: string) => {
  const courseQuery = new QueryBuilder(
    CourseModel.find({ isActive: true }),
    query
  )
    .search(['title', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const courses = await courseQuery.modelQuery;
  const meta = await courseQuery.countTotal();

  // If user is provided, get their progress for each course
  let coursesWithProgress :any = courses;
  if (userId) {
    const user = await UserModel.findOne({ uId: userId });
    if (user) {
      const progressData = await UserProgressModel.find({
        userId: userId,
        courseId: { $in: courses.map(course => course._id) }
      });

      coursesWithProgress = courses.map(course => {
        const progress = progressData.find(p => p.courseId.toString() === course._id.toString());
        return {
          ...course.toObject(),
          userProgress: progress || null,
          isEnrolled: !!progress
        };
      });
    }
  }

  return {
    result: coursesWithProgress,
    meta,
  };
};

const getSingleCourseFromDB = async (id: string, userId?: string) => {
  const course = await CourseModel.findById(id).lean();
    
  if (!course || !course.isActive) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
  }

  // Get course modules with lectures
  const modules = await ModuleModel.find({ courseId: id })
    .sort({ moduleNumber: 1 })
    .lean();

  const moduleIds = modules.map(module => module._id);
  const lectures = await LectureModel.find({ 
    moduleId: { $in: moduleIds }, 
    isActive: true 
  })
    .sort({ lectureNumber: 1 })
    .lean();

  // Get user progress if userId provided
  let userProgress = null;
  let modulesWithLectures = modules.map(module => ({
    ...module,
    lectures: lectures
      .filter(lecture => lecture.moduleId.toString() === module._id.toString())
      .map((lecture, index) => ({
        ...lecture,
        isUnlocked: false, // Default to locked
        isCompleted: false
      }))
  }));

  if (userId) {
    const user = await UserModel.findOne({ uId: userId });
    if (user) {
      userProgress = await UserProgressModel.findOne({
        userId: userId,
        courseId: id
      });

      if (userProgress) {
        // Determine which lectures are unlocked (sequential unlocking)
        modulesWithLectures = modules.map(module => {
          const moduleLectures = lectures
            .filter(lecture => lecture.moduleId.toString() === module._id.toString())
            .sort((a, b) => a.lectureNumber - b.lectureNumber);

          let hasUnlockedLecture = false;
          const lecturesWithAccess = moduleLectures.map((lecture, index) => {
            const isCompleted = userProgress!.completedLectures.some(
              completed => completed.toString() === lecture._id.toString()
            );

            // First lecture is always unlocked, subsequent lectures unlock after previous is completed
            let isUnlocked = false;
            if (index === 0) {
              isUnlocked = true;
              hasUnlockedLecture = true;
            } else if (hasUnlockedLecture) {
              const previousLecture = moduleLectures[index - 1];
              const isPreviousCompleted = userProgress!.completedLectures.some(
                completed => completed.toString() === previousLecture._id.toString()
              );
              isUnlocked = isPreviousCompleted;
              if (isUnlocked) hasUnlockedLecture = true;
            }

            return {
              ...lecture,
              isUnlocked,
              isCompleted
            };
          });

          return {
            ...module,
            lectures: lecturesWithAccess
          };
        });
      } else {
        // User not enrolled, only first lecture of first module is unlocked for preview
        if (modulesWithLectures.length > 0 && modulesWithLectures[0].lectures.length > 0) {
          modulesWithLectures[0].lectures[0].isUnlocked = true;
        }
      }
    }
  }

  const totalLectures = lectures.length;
  const completedLectures = userProgress?.completedLectures.length || 0;

  const result: ICourseWithProgress = {
    ...course,
    modules: modulesWithLectures,
    userProgress,
    totalLectures,
    completedLectures
  };

  return result;
};

const updateCourseIntoDB = async (id: string, payload: Partial<ICourse>, userId: string) => {
  // Verify course exists and user has permission
  const course = await CourseModel.findById(id);
  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
  }

  const user = await UserModel.findOne({ uId: userId });
  if (!user || (!user.roles.includes('admin') && course.createdBy !== userId)) {
    throw new AppError(httpStatus.FORBIDDEN, 'Access denied');
  }

  const result = await CourseModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

const deleteCourseFromDB = async (id: string, userId: string) => {
  const course = await CourseModel.findById(id);
  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
  }

  const user = await UserModel.findOne({ uId: userId });
  if (!user || (!user.roles.includes('admin') && course.createdBy !== userId)) {
    throw new AppError(httpStatus.FORBIDDEN, 'Access denied');
  }

  // Soft delete by setting isActive to false
  const result = await CourseModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
  
  // Also soft delete related modules and lectures
  const modules = await ModuleModel.find({ courseId: id });
  const moduleIds = modules.map(m => m._id);
  
  await LectureModel.updateMany({ moduleId: { $in: moduleIds } }, { isActive: false });
  await ModuleModel.updateMany({ courseId: id }, { isActive: false });

  return result;
};

const getEnrolledCoursesFromDB = async (userId: string) => {
  const user = await UserModel.findOne({ uId: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const enrollments = await UserProgressModel.find({ userId: userId })
    .populate({
      path: 'courseId',
      match: { isActive: true }
    })
    .populate('currentLecture')
    .sort({ enrolledAt: -1 });

  // Filter out enrollments where course was deleted
  const validEnrollments = enrollments.filter(enrollment => enrollment.courseId);

  return validEnrollments;
};

const enrollUserIntoCourse = async (userId: string, courseId: string) => {
  const user = await UserModel.findOne({ uId: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const course = await CourseModel.findOne({ _id: courseId, isActive: true });
  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
  }

  // Check if already enrolled
  const existing = await UserProgressModel.findOne({ 
    userId: userId, 
    courseId: courseId 
  });
  
  if (existing) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Already enrolled in this course');
  }

  // Get first lecture as current lecture
  const firstModule = await ModuleModel.findOne({ courseId, isActive: true })
    .sort({ moduleNumber: 1 });
    
  let currentLecture = null;
  if (firstModule) {
    const firstLecture = await LectureModel.findOne({ 
      moduleId: firstModule._id, 
      isActive: true 
    }).sort({ lectureNumber: 1 });
    currentLecture = firstLecture?._id || null;
  }

  const enrollment = await UserProgressModel.create({
    userId: userId,
    courseId,
    currentLecture,
    progressPercentage: 0,
    completedLectures: [],
    isCompleted: false,
  });

  return enrollment;
};

const getCoursesCreatedByUser = async (userId: string) => {
  const user = await UserModel.findOne({ uId: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!user.roles.includes('admin')) {
    throw new AppError(httpStatus.FORBIDDEN, 'Only admins can view created courses');
  }

  const courses = await CourseModel.find({ createdBy: userId, isActive: true })
    .sort({ createdAt: -1 });

  // Get enrollment count for each course
  const coursesWithStats = await Promise.all(
    courses.map(async (course) => {
      const enrollmentCount = await UserProgressModel.countDocuments({ 
        courseId: course._id 
      });
      
      const totalLectures = await LectureModel.countDocuments({ 
        courseId: course._id, 
        isActive: true 
      });

      return {
        ...course.toObject(),
        enrollmentCount,
        totalLectures
      };
    })
  );

  return coursesWithStats;
};

export const CourseServices = {
  createCourseIntoDB,
  getAllCoursesFromDB,
  getSingleCourseFromDB,
  updateCourseIntoDB,
  deleteCourseFromDB,
  getEnrolledCoursesFromDB,
  enrollUserIntoCourse,
  getCoursesCreatedByUser,
};