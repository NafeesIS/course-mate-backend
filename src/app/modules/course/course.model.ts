import { Schema, model } from "mongoose";
import { ICourse, IUserProgress } from "./course.interface";

// Course Schema
const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    thumbnail: { type: String, required: true },
    createdBy: { type: String, required: true }, // SuperTokens user ID
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// User Progress Schema
const userProgressSchema = new Schema<IUserProgress>(
  {
    userId: { type: String, required: true }, // SuperTokens user ID
    courseId: { type: Schema.Types.ObjectId, ref: "courses", required: true },
    currentLecture: { type: Schema.Types.ObjectId, ref: "lectures" },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    completedLectures: [{ type: Schema.Types.ObjectId, ref: "lectures" }],
    enrolledAt: { type: Date, default: Date.now },
    lastAccessed: { type: Date, default: Date.now },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Create indexes for better performance
courseSchema.index({ createdBy: 1 });
courseSchema.index({ isActive: 1 });
courseSchema.index({ title: "text", description: "text" });

userProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
userProgressSchema.index({ userId: 1 });
userProgressSchema.index({ courseId: 1 });

export const CourseModel = model<ICourse>("courses", courseSchema, "courses");
export const UserProgressModel = model<IUserProgress>(
  "userprogress",
  userProgressSchema,
  "userprogress"
);
