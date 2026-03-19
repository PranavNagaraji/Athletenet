import express from "express";
import { 
    getAllUsers,
    getUserById,
    updateUserNameById,
    updateUserPasswordById,
    deleteUserById,
    updateProfile
} from "../controllers/userController.js";
import { checkCookie } from "../utils/token.js";

// Completely Untested... Do i need to create an admin

const router = express.Router();

router.put("/profile", checkCookie, updateProfile);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/name/:id", updateUserNameById);
router.put("/password/:id", updateUserPasswordById);
router.delete("/:id", deleteUserById);

export default router;