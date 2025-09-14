import { Request, Response } from "express";
import httpStatus from "http-status";
import { SessionRequest } from "supertokens-node/framework/express";
import { ModuleServices } from "./module.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

// Create Module
export const createModule = catchAsync(
  async (req: SessionRequest, res: Response) => {
    const userId = req.session!.getUserId();
    const { courseId } = req.params;

    const moduleData = {
      ...req.body,
      courseId,
    };

    const result = await ModuleServices.createModuleIntoDB(moduleData, userId);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Module created successfully",
      data: result,
    });
  }
);

// Get Modules by Course (public with optional user context)
export const getModulesByCourse = catchAsync(
  async (req: SessionRequest | Request, res: Response) => {
    const { courseId } = req.params;

    // Check if request has session (optional authentication)
    let userId = undefined;

    if ("session" in req && req.session) {
      userId = req.session.getUserId();
    }

    const result = await ModuleServices.getModulesByCourseFromDB(
      courseId,
      userId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Modules retrieved successfully",
      data: result,
    });
  }
);

// Get Single Module (public with optional user context)
export const getSingleModule = catchAsync(
  async (req: SessionRequest | Request, res: Response) => {
    const { id } = req.params;

    // Check if request has session (optional authentication)
    let userId = undefined;
    try {
      if ("session" in req && req.session) {
        userId = req.session.getUserId();
      }
    } catch (error) {
      // Session not available, continue without user context
    }

    const result = await ModuleServices.getSingleModuleFromDB(id, userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Module retrieved successfully",
      data: result,
    });
  }
);

// Update Module
export const updateModule = catchAsync(
  async (req: SessionRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.session!.getUserId();
    const result = await ModuleServices.updateModuleIntoDB(
      id,
      req.body,
      userId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Module updated successfully",
      data: result,
    });
  }
);

// Delete Module
export const deleteModule = catchAsync(
  async (req: SessionRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.session!.getUserId();
    const result = await ModuleServices.deleteModuleFromDB(id, userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Module deleted successfully",
      data: result,
    });
  }
);

// Reorder Modules
export const reorderModules = catchAsync(
  async (req: SessionRequest, res: Response) => {
    const { courseId } = req.params;
    const { moduleOrders } = req.body; // Array of {moduleId, moduleNumber}
    const userId = req.session!.getUserId();

    const result = await ModuleServices.reorderModulesInDB(
      courseId,
      moduleOrders,
      userId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Modules reordered successfully",
      data: result,
    });
  }
);
