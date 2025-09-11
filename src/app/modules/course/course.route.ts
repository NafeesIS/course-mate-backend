// src/app/modules/course/course.route.ts
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
} from "./course.controller";
import validateRequest from "../../middlewares/validateRequest";
import { CourseValidation } from "./course.validation";

const router = Router();

// Course Routes
router.post(
  "/",
  verifySession(),
  validateRequest(CourseValidation.createCourseValidationSchema),
  createCourse
);
router.get("/", getAllCourses);
router.get("/enrolled", verifySession(), getEnrolledCourses);
router.get("/:id", getSingleCourse);
router.patch(
  "/:id",
  verifySession(),
  validateRequest(CourseValidation.updateCourseValidationSchema),
  updateCourse
);
router.delete("/:id", verifySession(), deleteCourse);
router.post("/:courseId/enroll", verifySession(), enrollCourse);

export const CourseRoutes = router;