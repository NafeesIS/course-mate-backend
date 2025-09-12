import { Types } from "mongoose";

export interface ILecture {
  title: string;
  lectureNumber: number;
  videoUrl: string; // YouTube URL or video file URL
  pdfNotes: string[]; // Array of PDF file URLs
  moduleId: Types.ObjectId; // reference to Module
  courseId: Types.ObjectId; // reference to Course
  isActive: boolean;
  duration?: number; // Video duration in minutes
}

export interface ILectureWithAccess extends ILecture {
  isUnlocked?: boolean;
  isCompleted?: boolean;
}