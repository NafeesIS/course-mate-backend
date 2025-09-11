// src/app/modules/course/course.controller.ts
import { Request, Response } from "express";
import httpStatus from "http-status";
import { SessionRequest } from "supertokens-node/framework/express";
import { CourseServices } from "./course.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import AppError from "../../errors/AppError";

// Create a new course
export const createCourse = catchAsync(async (req: SessionRequest, res: Response) => {
  const userId = req.session!.getUserId();
  const courseData = { ...req.body, createdBy: userId };
  
  const result = await CourseServices.createCourseIntoDB(courseData);
  
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Course created successfully',
    data: result,
  });
});

// Get all courses
export const getAllCourses = catchAsync(async (req: Request, res: Response) => {
  const result = await CourseServices.getAllCoursesFromDB(req.query);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Courses retrieved successfully',
    data: result,
  });
});

// Get single course
export const getSingleCourse = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CourseServices.getSingleCourseFromDB(id);
  
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
  }
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course retrieved successfully',
    data: result,
  });
});

// Update course
export const updateCourse = catchAsync(async (req: SessionRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.session!.getUserId();
  
  const result = await CourseServices.updateCourseIntoDB(id, req.body, userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course updated successfully',
    data: result,
  });
});

// Delete course
export const deleteCourse = catchAsync(async (req: SessionRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.session!.getUserId();
  
  const result = await CourseServices.deleteCourseFromDB(id, userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course deleted successfully',
    data: result,
  });
});

// Get user's enrolled courses
export const getEnrolledCourses = catchAsync(async (req: SessionRequest, res: Response) => {
  const userId = req.session!.getUserId();
  const result = await CourseServices.getEnrolledCoursesFromDB(userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Enrolled courses retrieved successfully',
    data: result,
  });
});

// Enroll in a course
export const enrollCourse = catchAsync(async (req: SessionRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.session!.getUserId();
  
  const result = await CourseServices.enrollUserIntoCourse(userId, courseId);
  
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Successfully enrolled in course',
    data: result,
  });
});