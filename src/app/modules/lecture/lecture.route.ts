import { verifySession } from "supertokens-node/recipe/session/framework/express";
import {
  createLecture,
  getLecturesByModule,
  getAllLectures,
  getSingleLecture,
  updateLecture,
  deleteLecture,
  markLectureComplete,
  getUserProgress,
} from "./lecture.controller";
import validateRequest from "../../middlewares/validateRequest";
import { Router } from "express";
import { CourseValidation } from "../course/course.validation";
import { upload } from "../../utils/googleDriveUpload";

const router = Router();

// Public Lecture Routes (no authentication required)
router.get("/modules/:moduleId", getLecturesByModule); // Get lectures by module (with optional user context)
router.get("/all", getAllLectures); // Get all lectures with filters
router.get("/:id", getSingleLecture); // Get single lecture (with optional user context)

// Protected Lecture Routes (authentication required)
router.post(
  "/modules/:moduleId",
  verifySession(),
  upload.array('pdfNotes', 10), // Allow up to 10 PDF files
  validateRequest(CourseValidation.createLectureValidationSchema),
  createLecture
);

router.patch(
  "/:id",
  verifySession(),
  upload.array('pdfNotes', 10),
  validateRequest(CourseValidation.updateLectureValidationSchema),
  updateLecture
);

router.delete("/:id", verifySession(), deleteLecture);

// Progress Routes (authentication required)
router.post("/:lectureId/complete", verifySession(), markLectureComplete);
router.get("/courses/:courseId/progress", verifySession(), getUserProgress);

export const LectureRoutes = router;