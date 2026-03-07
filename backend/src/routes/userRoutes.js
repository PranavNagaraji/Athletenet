import express from "express";
import { 
    getAllUsers,
    getUserById,
    updateUserNameById,
    updateUserPasswordById,
    deleteUserById
} from "../controllers/userController.js";

const router = express.Router();

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/name/:id", updateUserNameById);
router.put("/password/:id", updateUserPasswordById);
router.delete("/:id", deleteUserById);

export default router;