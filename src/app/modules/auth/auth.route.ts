import { Router } from "express";
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import { createUser, getMe, updateProfile } from "./auth.controller";

const router = Router();

// Protected routes
router.get("/me", verifySession(), getMe);
router.patch("/me", verifySession(), updateProfile);

// Public routes (for fallback user creation)
router.post("/create-user", createUser);

export const AuthRoutes = router;