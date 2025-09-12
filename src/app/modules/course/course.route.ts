import { Router } from "express";
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import {
  createCourse,
  getAllCourses,
  getSingleCourse,
  updateCourse,
  deleteCourse,
  getEnrolledCourses,
  enrollCourse,
  getMyCourses,
} from "./course.controller";
import validateRequest from "../../middlewares/validateRequest";
import { CourseValidation } from "./course.validation";
import { upload } from "../../utils/googleDriveUpload";

const router = Router();

// Public Course Routes (no authentication required)
router.get("/", getAllCourses); // Get all courses (with optional user context)
router.get("/:id", getSingleCourse); // Get single course (with optional user context)

// Protected Course Routes (authentication required)
router.post(
  "/",
  verifySession(),
  upload.single('thumbnail'),
  validateRequest(CourseValidation.createCourseValidationSchema),
  createCourse
);

router.patch(
  "/:id",
  verifySession(),
  upload.single('thumbnail'),
  validateRequest(CourseValidation.updateCourseValidationSchema),
  updateCourse
);

router.delete("/:id", verifySession(), deleteCourse);

// User Enrollment Routes
router.get("/user/enrolled", verifySession(), getEnrolledCourses);
router.post("/:courseId/enroll", verifySession(), enrollCourse);

// Admin Routes
router.get("/admin/my-courses", verifySession(), getMyCourses);

export const CourseRoutes = router;