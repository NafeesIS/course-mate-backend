import { Types } from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { UserProgressModel } from "../course/course.model";
import { UserModel } from "../user/user.model";
import httpStatus from "http-status";
import { ModuleModel } from "../module/module.model";
import { ILecture } from "./lecture.interface";
import { LectureModel } from "./lecture.model";

const createLectureIntoDB = async (
  payload: Partial<ILecture>,
  userId: string
) => {
  // Verify user permissions
  const user = await UserModel.findOne({ uId: userId });
  if (!user || !user.roles.includes("admin")) {
    throw new AppError(httpStatus.FORBIDDEN, "Only admins can create lectures");
  }

  // Verify module exists
  const module = await ModuleModel.findOne({ _id: payload.moduleId });
  if (!module) {
    throw new AppError(httpStatus.NOT_FOUND, "Module not found");
  }

  // Add courseId from module
  payload.courseId = module.courseId;

  // Auto-increment lecture number within the module
  const lastLecture = await LectureModel.findOne({
    moduleId: payload.moduleId,
  }).sort({ lectureNumber: -1 });

  payload.lectureNumber = (lastLecture?.lectureNumber || 0) + 1;

  const result = await LectureModel.create(payload);
  return result;
};

const getLecturesByModuleFromDB = async (moduleId: string, userId?: string) => {
  const lectures = await LectureModel.find({ moduleId, isActive: true })
    .populate("moduleId", "title moduleNumber")
    .populate("courseId", "title")
    .sort({ lectureNumber: 1 });

  // If user provided, check access permissions
  if (userId) {
    const user = await UserModel.findOne({ uId: userId });
    if (user && lectures.length > 0) {
      const courseId = lectures[0].courseId;
      const userProgress = await UserProgressModel.findOne({
        userId: userId,
        courseId: courseId,
      });

      // Add access information to each lecture
      const lecturesWithAccess = lectures.map((lecture, index) => {
        const isCompleted =
          userProgress?.completedLectures.some(
            (completed) => completed.toString() === lecture._id.toString()
          ) || false;

        // Sequential unlocking logic
        let isUnlocked = false;
        if (!userProgress) {
          // Not enrolled, only first lecture is accessible for preview
          isUnlocked = index === 0;
        } else {
          // Enrolled users: first lecture always unlocked, others unlock after previous completion
          if (index === 0) {
            isUnlocked = true;
          } else {
            const previousLecture = lectures[index - 1];
            const isPreviousCompleted = userProgress.completedLectures.some(
              (completed) =>
                completed.toString() === previousLecture._id.toString()
            );
            isUnlocked = isPreviousCompleted;
          }
        }

        return {
          ...lecture.toObject(),
          isUnlocked,
          isCompleted,
        };
      });

      return lecturesWithAccess;
    }
  }

  return lectures;
};

const getAllLecturesFromDB = async (query: Record<string, unknown>) => {
  const lectureQuery = new QueryBuilder(
    LectureModel.find({ isActive: true })
      .populate("moduleId", "title moduleNumber")
      .populate("courseId", "title"),
    query
  )
    .search(["title"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await lectureQuery.modelQuery;
  const meta = await lectureQuery.countTotal();

  return { result, meta };
};

const getSingleLectureFromDB = async (id: string, userId?: string) => {
  const lecture = await LectureModel.findOne({ _id: id, isActive: true })
    .populate("moduleId", "title moduleNumber")
    .populate("courseId", "title");

  if (!lecture) {
    throw new AppError(httpStatus.NOT_FOUND, "Lecture not found");
  }

  // Check user access if userId provided
  if (userId) {
    const user = await UserModel.findOne({ uId: userId });
    if (user) {
      const userProgress = await UserProgressModel.findOne({
        userId: userId,
        courseId: lecture.courseId,
      });

      // Check if lecture is unlocked
      const moduleId = lecture.moduleId._id;
      const allModuleLectures = await LectureModel.find({
        moduleId,
        isActive: true,
      }).sort({ lectureNumber: 1 });

      const lectureIndex = allModuleLectures.findIndex(
        (l) => l._id.toString() === lecture._id.toString()
      );

      let isUnlocked = false;
      if (!userProgress) {
        // Not enrolled, only first lecture of first module is accessible
        const firstModule = await ModuleModel.findOne({
          courseId: lecture.courseId,
          isActive: true,
        }).sort({ moduleNumber: 1 });

        if (
          firstModule &&
          moduleId.toString() === firstModule._id.toString() &&
          lectureIndex === 0
        ) {
          isUnlocked = true;
        }
      } else {
        // Enrolled user: check sequential access
        if (lectureIndex === 0) {
          isUnlocked = true;
        } else {
          const previousLecture = allModuleLectures[lectureIndex - 1];
          const isPreviousCompleted = userProgress.completedLectures.some(
            (completed) =>
              completed.toString() === previousLecture._id.toString()
          );
          isUnlocked = isPreviousCompleted;
        }
      }

      const isCompleted =
        userProgress?.completedLectures.some(
          (completed) => completed.toString() === lecture._id.toString()
        ) || false;

      return {
        ...lecture.toObject(),
        isUnlocked,
        isCompleted,
        userProgress: userProgress
          ? {
              progressPercentage: userProgress.progressPercentage,
              completedLectures: userProgress.completedLectures.length,
              enrolledAt: userProgress.enrolledAt,
            }
          : null,
      };
    }
  }

  return lecture;
};

const updateLectureIntoDB = async (
  id: string,
  payload: Partial<ILecture>,
  userId: string
) => {
  const user = await UserModel.findOne({ uId: userId });
  if (!user || !user.roles.includes("admin")) {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied");
  }

  const result = await LectureModel.findOneAndUpdate(
    { _id: id, isActive: true },
    payload,
    { new: true, runValidators: true }
  );

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Lecture not found");
  }

  return result;
};

const deleteLectureFromDB = async (id: string, userId: string) => {
  const user = await UserModel.findOne({ uId: userId });
  if (!user || !user.roles.includes("admin")) {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied");
  }

  const result = await LectureModel.findOneAndDelete({ _id: id });
  await UserProgressModel.updateMany(
    { completedLectures: { $in: [id] } }, // Find UserProgress entries that have this lecture ID
    { $pull: { completedLectures: id } } // Remove the lecture ID from the completedLectures array
  );
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Lecture not found");
  }

  return result;
};

const markLectureCompleteInDB = async (lectureId: string, userId: string) => {
  const user = await UserModel.findOne({ uId: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const lecture = await LectureModel.findOne({
    _id: lectureId,
    isActive: true,
  });
  if (!lecture) {
    throw new AppError(httpStatus.NOT_FOUND, "Lecture not found");
  }

  // Get user progress for this course
  let progress = await UserProgressModel.findOne({
    userId: userId,
    courseId: lecture.courseId,
  });

  if (!progress) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "User not enrolled in this course"
    );
  }

  // Check if lecture is unlocked before allowing completion
  const moduleId = lecture.moduleId;
  const allModuleLectures = await LectureModel.find({
    moduleId,
    isActive: true,
  }).sort({ lectureNumber: 1 });

  const lectureIndex = allModuleLectures.findIndex(
    (l) => l._id.toString() === lectureId
  );

  if (lectureIndex > 0) {
    const previousLecture = allModuleLectures[lectureIndex - 1];
    const isPreviousCompleted = progress.completedLectures.some(
      (completed) => completed.toString() === previousLecture._id.toString()
    );

    if (!isPreviousCompleted) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Previous lecture must be completed first"
      );
    }
  }

  // Add lecture to completed if not already completed
  if (!progress.completedLectures.includes(new Types.ObjectId(lectureId))) {
    progress.completedLectures.push(new Types.ObjectId(lectureId));

    // Calculate progress percentage
    const totalLectures = await LectureModel.countDocuments({
      courseId: lecture.courseId,
      isActive: true,
    });
    progress.progressPercentage = Math.round(
      (progress.completedLectures.length / totalLectures) * 100
    );

    // Check if course is completed
    if (progress.progressPercentage === 100) {
      progress.isCompleted = true;
    }

    // Update current lecture to next incomplete lecture
    const allCourseLectures = await LectureModel.find({
      courseId: lecture.courseId,
      isActive: true,
    })
      .populate("moduleId")
      .sort({ "moduleId.moduleNumber": 1, lectureNumber: 1 });

    const nextLecture = allCourseLectures.find(
      (l) =>
        !progress!.completedLectures.some(
          (completed) => completed.toString() === l._id.toString()
        )
    );

    progress.currentLecture = nextLecture?._id || progress.currentLecture;
    progress.lastAccessed = new Date();

    await progress.save();
  }

  return progress;
};

const getUserProgressFromDB = async (courseId: string, userId: string) => {
  const user = await UserModel.findOne({ uId: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const progress = await UserProgressModel.findOne({
    userId: userId,
    courseId,
  })
    .populate("completedLectures")
    .populate("currentLecture")
    .populate("courseId", "title");

  if (!progress) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "User not enrolled in this course"
    );
  }

  // Get additional progress statistics
  const totalLectures = await LectureModel.countDocuments({
    courseId,
    isActive: true,
  });

  const completedCount = progress.completedLectures.length;
  const remainingLectures = totalLectures - completedCount;

  return {
    ...progress.toObject(),
    totalLectures,
    completedCount,
    remainingLectures,
    progressPercentage: Math.round((completedCount / totalLectures) * 100),
  };
};

export const LectureServices = {
  createLectureIntoDB,
  getLecturesByModuleFromDB,
  getAllLecturesFromDB,
  getSingleLectureFromDB,
  updateLectureIntoDB,
  deleteLectureFromDB,
  markLectureCompleteInDB,
  getUserProgressFromDB,
};
