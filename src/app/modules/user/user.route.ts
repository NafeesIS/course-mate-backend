import { Router } from "express";
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import { getUsers, getUser, updateUser, deleteUser } from "./user.controller";

const router = Router();

// Protected user routes
router.get("/", verifySession(), getUsers);     // Get all users
router.get("/:id", verifySession(), getUser);   // Get user by ID
router.put("/:id", verifySession(), updateUser); // Update user
router.delete("/:id", verifySession(), deleteUser); // Delete user

export const UserRoutes = router;
