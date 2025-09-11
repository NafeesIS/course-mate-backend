import { verifySession } from "supertokens-node/recipe/session/framework/express";
import {
  createLecture,
  getLecturesByModule,
  getAllLectures,
  updateLecture,
  deleteLecture,
  markLectureComplete,
  getUserProgress,
} from "./lecture.controller";
import validateRequest from "../../middlewares/validateRequest";
import { Router } from "express";
import { CourseValidation } from "../course/course.validation";


const router = Router();
// Lecture Routes
router.post(
  "/modules/:moduleId/lectures",
  verifySession(),
  validateRequest(CourseValidation.createLectureValidationSchema),
  createLecture
);
router.get("/modules/:moduleId/lectures", getLecturesByModule);
router.get("/lectures/all", getAllLectures);
router.patch(
  "/lectures/:id",
  verifySession(),
  validateRequest(CourseValidation.updateLectureValidationSchema),
  updateLecture
);
router.delete("/lectures/:id", verifySession(), deleteLecture);

// Progress Routes
router.post("/lectures/:lectureId/complete", verifySession(), markLectureComplete);
router.get("/:courseId/progress", verifySession(), getUserProgress);

export const LectureRoutes = router;