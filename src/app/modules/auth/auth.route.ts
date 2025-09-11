import { Router } from "express";
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import { createUser, getMe } from "./auth.controller";

const router = Router();

// Supertokens auto handles: /auth/signup, /auth/signin, /auth/signout

// Custom protected route
router.get("/me", verifySession(), getMe);
router.post("/", verifySession(), createUser);

export const AuthRoutes = router;
