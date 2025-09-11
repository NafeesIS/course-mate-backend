import { Router } from "express";
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import { getMe } from "./auth.controller";

const router = Router();

// Supertokens auto handles: /auth/signup, /auth/signin, /auth/signout

// Custom protected route
router.get("/me", verifySession(), getMe);

export const AuthRoutes = router;
