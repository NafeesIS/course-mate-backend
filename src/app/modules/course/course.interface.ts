import { Types } from "mongoose";

export interface ICourse {
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  createdBy: string; // SuperTokens user ID
  isActive: boolean;
}

export interface IUserProgress {
  userId: string; // SuperTokens user ID
  courseId: Types.ObjectId; // reference to Course
  currentLecture?: Types.ObjectId; // reference to Lecture
  progressPercentage: number;
  completedLectures: Types.ObjectId[]; // array of Lecture references
  enrolledAt: Date;
  lastAccessed?: Date;
  isCompleted: boolean;
}

export interface ICourseWithProgress extends ICourse {
  modules?: any[];
  userProgress?: IUserProgress;
  totalLectures?: number;
  completedLectures?: number;
}

export type CourseWithProgress = ICourse & {
  userProgress?: IUserProgress | null;
  isEnrolled: boolean;
};