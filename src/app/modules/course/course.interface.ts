// src/app/modules/course/course.interface.ts
import { Types } from "mongoose";

export interface ICourse {
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  createdBy: Types.ObjectId; // reference to User
}


export interface IUserProgress {
  userId: Types.ObjectId; // reference to User
  courseId: Types.ObjectId; // reference to Course
  currentLecture?: Types.ObjectId; // reference to Lecture
  progressPercentage: number;
  completedLectures: Types.ObjectId[]; // array of Lecture references
  enrolledAt: Date;
  lastAccessed?: Date;
}
