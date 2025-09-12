import { Router } from "express";
import {
  createModule,
  getModulesByCourse,
  getSingleModule,
  updateModule,
  deleteModule,
  reorderModules,
} from "./module.controller";
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import validateRequest from "../../middlewares/validateRequest";
import { CourseValidation } from "../course/course.validation";

const router = Router();

// Public Module Routes (no authentication required)
router.get("/courses/:courseId", getModulesByCourse); // Get modules by course (with optional user context)
router.get("/:id", getSingleModule); // Get single module (with optional user context)

// Protected Module Routes (authentication required)
router.post(
  "/courses/:courseId",
  verifySession(),
  validateRequest(CourseValidation.createModuleValidationSchema),
  createModule
);

router.patch(
  "/:id",
  verifySession(),
  validateRequest(CourseValidation.updateModuleValidationSchema),
  updateModule
);

router.delete("/:id", verifySession(), deleteModule);

// Module Reordering (authentication required)
router.patch("/courses/:courseId/reorder", verifySession(), reorderModules);

export const ModuleRoutes = router;