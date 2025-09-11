import { Types } from "mongoose";

export interface IModule {
  title: string;
  moduleNumber: number;
  courseId: Types.ObjectId; // reference to Course
}