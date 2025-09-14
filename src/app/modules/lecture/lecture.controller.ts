import { LectureServices } from "./lecture.service";
import { SessionRequest } from "supertokens-node/framework/express";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { getFileUrl } from "../../utils/fileUpload";
import { uploadToGoogleDrive } from "../../utils/googleDriveUpload";

// Create Lecture
export const createLecture = catchAsync(
  async (req: SessionRequest, res: Response) => {
    const userId = req.session!.getUserId();
    let lectureData = { ...req.body };
    const moduleId = req.params.moduleId;
    lectureData.moduleId = moduleId;

    // Handle PDF file uploads
    if (req.files && Array.isArray(req.files)) {
      const pdfFiles = req.files.filter(
        (file) => file.fieldname === "pdfNotes"
      );

      if (pdfFiles.length > 0) {
        try {
          // Wait for all file uploads to complete
          const uploadPromises = pdfFiles.map(
            (file) => uploadToGoogleDrive(file, "course-pdfs") // Use 'file' not 'req.file'
          );

          // Wait for all uploads to complete
          const uploadedUrls = await Promise.all(uploadPromises);
          lectureData.pdfNotes = uploadedUrls;
        } catch (uploadError) {
          console.error("File upload error:", uploadError);
          return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Failed to upload PDF files. Please try again.",
            data: null,
          });
        }
      }
    }

    // Create the lecture in the database
    const result = await LectureServices.createLectureIntoDB(
      lectureData,
      userId
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Lecture created successfully",
      data: result,
    });
  }
);

// Get Lectures by Module (with optional user context)
export const getLecturesByModule = catchAsync(
  async (req: SessionRequest | Request, res: Response) => {
    const { moduleId } = req.params;

    // Check if request has session (optional authentication)
    let userId = undefined;
    try {
      if ("session" in req && req.session) {
        userId = req.session.getUserId();
      }
    } catch (error) {
      // Session not available, continue without user context
    }

    const result = await LectureServices.getLecturesByModuleFromDB(
      moduleId,
      userId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Lectures retrieved successfully",
      data: result,
    });
  }
);

// Get Single Lecture (with optional user context)
export const getSingleLecture = catchAsync(
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

    const result = await LectureServices.getSingleLectureFromDB(id, userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Lecture retrieved successfully",
      data: result,
    });
  }
);

// Get All Lectures with Filters
export const getAllLectures = catchAsync(
  async (req: Request, res: Response) => {
    const result = await LectureServices.getAllLecturesFromDB(req.query);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Lectures retrieved successfully",
      data: result,
    });
  }
);

// Update Lecture
export const updateLecture = catchAsync(
  async (req: SessionRequest, res: Response) => {
    const userId = req.session!.getUserId();
    const lectureId = req.params.id;
    let updateData = { ...req.body };

    // Handle PDF file uploads for update
    if (req.files && Array.isArray(req.files)) {
      const pdfFiles = req.files.filter(
        (file) => file.fieldname === "pdfNotes"
      );

      if (pdfFiles.length > 0) {
        try {
          // Wait for all file uploads to complete
          const uploadPromises = pdfFiles.map((file) =>
            uploadToGoogleDrive(file, "course-pdfs")
          );

          // Wait for all uploads to complete
          const uploadedUrls = await Promise.all(uploadPromises);
          updateData.pdfNotes = uploadedUrls;
        } catch (uploadError) {
          console.error("File upload error:", uploadError);
          return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Failed to upload PDF files. Please try again.",
            data: null,
          });
        }
      }
    }

    // Update the lecture in the database
    const result = await LectureServices.updateLectureIntoDB(
      lectureId,
      updateData,
      userId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Lecture updated successfully",
      data: result,
    });
  }
);

// Delete Lecture
export const deleteLecture = catchAsync(
  async (req: SessionRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.session!.getUserId();
    const result = await LectureServices.deleteLectureFromDB(id, userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Lecture deleted successfully",
      data: result,
    });
  }
);

// Mark Lecture as Complete
export const markLectureComplete = catchAsync(
  async (req: SessionRequest, res: Response) => {
    const { lectureId } = req.params;
    const userId = req.session!.getUserId();
    const result = await LectureServices.markLectureCompleteInDB(
      lectureId,
      userId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Lecture marked as complete",
      data: result,
    });
  }
);

// Get User Progress for a Course
export const getUserProgress = catchAsync(
  async (req: SessionRequest, res: Response) => {
    const { courseId } = req.params;
    const userId = req.session!.getUserId();
    const result = await LectureServices.getUserProgressFromDB(
      courseId,
      userId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User progress retrieved successfully",
      data: result,
    });
  }
);
