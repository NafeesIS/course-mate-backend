// src/app/modules/course/course.model.ts
import { Schema, model, Document, Types } from "mongoose";

export interface ICourse extends Document {
  _id: Types.ObjectId;
  title: string;
  price: number;
  description: string;
  thumbnail: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>({
  title: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, required: true },
  thumbnail: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, {
  timestamps: true
});

export const CourseModel = model<ICourse>("Course", courseSchema);

// Module Model
export interface IModule extends Document {
  _id: Types.ObjectId;
  title: string;
  moduleNumber: number;
  courseId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const moduleSchema = new Schema<IModule>({
  title: { type: String, required: true, trim: true },
  moduleNumber: { type: Number, required: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
}, {
  timestamps: true
});

// Auto-increment moduleNumber per course
moduleSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastModule = await ModuleModel.findOne({ courseId: this.courseId })
      .sort({ moduleNumber: -1 });
    this.moduleNumber = lastModule ? lastModule.moduleNumber + 1 : 1;
  }
  next();
});

export const ModuleModel = model<IModule>("Module", moduleSchema);

// Lecture Model
export interface ILecture extends Document {
  _id: Types.ObjectId;
  title: string;
  videoUrl: string;
  pdfNotes: string[];
  moduleId: Types.ObjectId;
  courseId: Types.ObjectId;
  lectureNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

const lectureSchema = new Schema<ILecture>({
  title: { type: String, required: true, trim: true },
  videoUrl: { type: String, required: true },
  pdfNotes: [{ type: String }],
  moduleId: { type: Schema.Types.ObjectId, ref: "Module", required: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  lectureNumber: { type: Number, required: true },
}, {
  timestamps: true
});

// Auto-increment lectureNumber per module
lectureSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastLecture = await LectureModel.findOne({ moduleId: this.moduleId })
      .sort({ lectureNumber: -1 });
    this.lectureNumber = lastLecture ? lastLecture.lectureNumber + 1 : 1;
  }
  next();
});

export const LectureModel = model<ILecture>("Lecture", lectureSchema);

// User Progress Model
export interface IUserProgress extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  completedLectures: Types.ObjectId[];
  currentLecture: Types.ObjectId;
  progressPercentage: number;
  enrolledAt: Date;
  lastAccessed: Date;
}

const userProgressSchema = new Schema<IUserProgress>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  completedLectures: [{ type: Schema.Types.ObjectId, ref: "Lecture" }],
  currentLecture: { type: Schema.Types.ObjectId, ref: "Lecture" },
  progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
  enrolledAt: { type: Date, default: Date.now },
  lastAccessed: { type: Date, default: Date.now },
});

// Create compound index for user-course combination
userProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const UserProgressModel = model<IUserProgress>("UserProgress", userProgressSchema);