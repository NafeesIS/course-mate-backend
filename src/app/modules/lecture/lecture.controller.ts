// src/app/modules/course/lecture.controller.ts
import { LectureServices } from "./lecture.service";
import { SessionRequest } from "supertokens-node/framework/express";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";

// Create Lecture
export const createLecture = catchAsync(async (req: SessionRequest, res: Response) => {
  const userId = req.session!.getUserId();
  const result = await LectureServices.createLectureIntoDB(req.body, userId);
  
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Lecture created successfully',
    data: result,
  });
});

// Get Lectures by Module
export const getLecturesByModule = catchAsync(async (req: Request, res: Response) => {
  const { moduleId } = req.params;
  const result = await LectureServices.getLecturesByModuleFromDB(moduleId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Lectures retrieved successfully',
    data: result,
  });
});

// Get All Lectures with Filters
export const getAllLectures = catchAsync(async (req: Request, res: Response) => {
  const result = await LectureServices.getAllLecturesFromDB(req.query);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Lectures retrieved successfully',
    data: result,
  });
});

// Update Lecture
export const updateLecture = catchAsync(async (req: SessionRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.session!.getUserId();
  const result = await LectureServices.updateLectureIntoDB(id, req.body, userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Lecture updated successfully',
    data: result,
  });
});

// Delete Lecture
export const deleteLecture = catchAsync(async (req: SessionRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.session!.getUserId();
  const result = await LectureServices.deleteLectureFromDB(id, userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Lecture deleted successfully',
    data: result,
  });
});

// Mark Lecture as Complete
export const markLectureComplete = catchAsync(async (req: SessionRequest, res: Response) => {
  const { lectureId } = req.params;
  const userId = req.session!.getUserId();
  const result = await LectureServices.markLectureCompleteInDB(lectureId, userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Lecture marked as complete',
    data: result,
  });
});

// Get User Progress
export const getUserProgress = catchAsync(async (req: SessionRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.session!.getUserId();
  const result = await LectureServices.getUserProgressFromDB(courseId, userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User progress retrieved successfully',
    data: result,
  });
});