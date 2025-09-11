import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { UserRoutes } from "../modules/user/user.route";
import { CourseRoutes } from "../modules/course/course.route";
import { LectureRoutes } from "../modules/lecture/lecture.route";
import { ModuleRoutes } from "../modules/module/module.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/courses",
    route: CourseRoutes,
  },
  {
    path: "/lectures",
    route: LectureRoutes,
  },
  {
    path: "/modules",
    route: ModuleRoutes,
  },
];

moduleRoutes.forEach((r) => {
  router.use(r.path, r.route);
});

export default router;
