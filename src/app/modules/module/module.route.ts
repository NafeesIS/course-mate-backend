import { Router } from "express";
import {
  createModule,
  getModulesByCourse,
  updateModule,
  deleteModule,
} from "./module.controller";
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import validateRequest from "../../middlewares/validateRequest";
import { CourseValidation } from "../course/course.validation";

const router = Router();

// Module Routes
router.post(
  "/:courseId/modules",
  verifySession(),
  validateRequest(CourseValidation.createModuleValidationSchema),
  createModule
);
router.get("/:courseId/modules", getModulesByCourse);
router.patch(
  "/modules/:id",
  verifySession(),
  validateRequest(CourseValidation.updateModuleValidationSchema),
  updateModule
);
router.delete("/modules/:id", verifySession(), deleteModule);

export const ModuleRoutes = router;