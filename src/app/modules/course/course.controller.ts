import { Request, Response } from "express";
import httpStatus from "http-status";
import { SessionRequest } from "supertokens-node/framework/express";
import { CourseServices } from "./course.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import AppError from "../../errors/AppError";
import { uploadToGoogleDrive } from "../../utils/googleDriveUpload";
import { getFileUrl } from "../../utils/fileUpload";
// import { getFileUrl } from "../../utils/fileUpload";

// Create a new course
export const createCourse = catchAsync(async (req: SessionRequest, res: Response) => {
  const userId = req.session!.getUserId();
  let courseData = { ...req.body };
  
  // Handle thumbnail file upload
if (req.file) {
  courseData.thumbnail = await uploadToGoogleDrive(req.file, 'course-thumbnails');
}

// Option 2: Local storage with proper URL construction
if (req.file) {
  courseData.thumbnail = getFileUrl(req, req.file.path);
}

  const result = await CourseServices.createCourseIntoDB(courseData, userId);
  
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Course created successfully',
    data: result,
  });
});

// Get all courses (public route with optional user context)
export const getAllCourses = catchAsync(async (req: SessionRequest | Request, res: Response) => {
  // Check if request has session (optional authentication)
  let userId = undefined;
  try {
    if ('session' in req && req.session) {
      userId = req.session.getUserId();
    }
  } catch (error) {
    // Session not available, continue without user context
  }
  
  const result = await CourseServices.getAllCoursesFromDB(req.query, userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Courses retrieved successfully',
    data: result,
  });
});

// Get single course (public route with optional user context)
export const getSingleCourse = catchAsync(async (req: SessionRequest | Request, res: Response) => {
  const { id } = req.params;
  
  // Check if request has session (optional authentication)
  let userId = undefined;
  try {
    if ('session' in req && req.session) {
      userId = req.session.getUserId();
    }
  } catch (error) {
    // Session not available, continue without user context
  }
  
  const result = await CourseServices.getSingleCourseFromDB(id, userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course retrieved successfully',
    data: result,
  });
});

// Update course (protected)
export const updateCourse = catchAsync(async (req: SessionRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.session!.getUserId();
  let updateData = { ...req.body };
  
  // Handle thumbnail file upload to Google Drive
  if (req.file && req.file.fieldname === 'thumbnail') {
    updateData.thumbnail = await uploadToGoogleDrive(req.file, 'course-thumbnails');
  }
  
  const result = await CourseServices.updateCourseIntoDB(id, updateData, userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course updated successfully',
    data: result,
  });
});

// Delete course (protected)
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

// Get user's enrolled courses (protected)
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

// Enroll in a course (protected)
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

// Get courses created by user (admin only)
export const getMyCourses = catchAsync(async (req: SessionRequest, res: Response) => {
  const userId = req.session!.getUserId();
  const result = await CourseServices.getCoursesCreatedByUser(userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Created courses retrieved successfully',
    data: result,
  });
});