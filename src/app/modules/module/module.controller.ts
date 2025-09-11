// src/app/modules/course/module.controller.ts
import { Request, Response } from "express";
import httpStatus from "http-status";
import { SessionRequest } from "supertokens-node/framework/express";
import { ModuleServices } from "./module.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

// Create Module
export const createModule = catchAsync(async (req: SessionRequest, res: Response) => {
  const userId = req.session!.getUserId();
  const result = await ModuleServices.createModuleIntoDB(req.body, userId);
  
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Module created successfully',
    data: result,
  });
});

// Get Modules by Course
export const getModulesByCourse = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const result = await ModuleServices.getModulesByCourseFromDB(courseId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Modules retrieved successfully',
    data: result,
  });
});

// Update Module
export const updateModule = catchAsync(async (req: SessionRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.session!.getUserId();
  const result = await ModuleServices.updateModuleIntoDB(id, req.body, userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Module updated successfully',
    data: result,
  });
});

// Delete Module
export const deleteModule = catchAsync(async (req: SessionRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.session!.getUserId();
  const result = await ModuleServices.deleteModuleFromDB(id, userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Module deleted successfully',
    data: result,
  });
});

