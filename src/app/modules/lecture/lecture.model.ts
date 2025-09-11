// Lecture Schema
import { Schema, model } from "mongoose";
import { ILecture } from "./lecture.interface";

const lectureSchema = new Schema<ILecture>(
  {
    title: { type: String, required: true },
    lectureNumber: { type: Number, required: true },
    content: { type: String, required: true },
    videoUrl: { type: String },
    moduleId: { type: Schema.Types.ObjectId, ref: "Module", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  },
  { timestamps: true }
);

export const LectureModel = model<ILecture>("Lecture", lectureSchema);