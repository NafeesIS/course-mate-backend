// src/app/modules/course/course.model.ts
import { Schema, model } from "mongoose";
import { ICourse, IUserProgress } from "./course.interface";

// Course Schema
const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    thumbnail: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// User Progress Schema
const userProgressSchema = new Schema<IUserProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    currentLecture: { type: Schema.Types.ObjectId, ref: "Lecture" },
    progressPercentage: { type: Number, default: 0 },
    completedLectures: [{ type: Schema.Types.ObjectId, ref: "Lecture" }],
    enrolledAt: { type: Date, default: Date.now },
    lastAccessed: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const CourseModel = model<ICourse>("Course", courseSchema);


export const UserProgressModel = model<IUserProgress>(
  "UserProgress",
  userProgressSchema
);
