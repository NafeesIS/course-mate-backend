import { Types } from "mongoose";



export interface ILecture {
  title: string;
  lectureNumber: number;
  content: string;
  videoUrl?: string;
  moduleId: Types.ObjectId; // reference to Module
  courseId: Types.ObjectId;
}