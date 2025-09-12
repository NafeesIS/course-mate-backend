import { Schema, model } from "mongoose";
import { ILecture } from "./lecture.interface";

const lectureSchema = new Schema<ILecture>(
  {
    title: { type: String, required: true, trim: true },
    lectureNumber: { type: Number, required: true },
    videoUrl: { type: String, required: true },
    pdfNotes: [{ type: String }], // Array of PDF URLs
    moduleId: { type: Schema.Types.ObjectId, ref: "Module", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    isActive: { type: Boolean, default: true },
    duration: { type: Number }, // Duration in minutes
  },
  { timestamps: true }
);

// Create indexes for better performance
lectureSchema.index({ moduleId: 1, lectureNumber: 1 });
lectureSchema.index({ courseId: 1 });
lectureSchema.index({ isActive: 1 });

export const LectureModel = model<ILecture>("Lecture", lectureSchema);