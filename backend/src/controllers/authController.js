import User from "../models/User.js";
import { createCookie } from "../utils/token.js";
import Athlete from "../models/Athlete.js";
import Coach from "../models/Coach.js";
import Club from "../models/Club.js";

export const getCurrentUser = (req, res) => {
    if (!req.user)
        return res.status(401).json({ message: "Not logged in" });
    const { password, ...safeUser } = req.user.toObject();
    res.status(200).json({ user: safeUser });
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select("+password");
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        createCookie(res, user.id, user.role);

        res.json({ message: "Login successful" });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const signupUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: "User already exists" });

        const user = await User.create({
            name,
            email,
            password,
            role,
        });

        if (role === "athlete") {
            await Athlete.create({ user: user.id });
        }
        if (role === "coach") {
            await Coach.create({ user: user.id });
        }
        if (role === "club") {
            await Club.create({ admin: user.id });
        }

        createCookie(res, user.id, user.role);

        res.status(201).json({ message: "Signup successful" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const logoutUser = async (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: "strict",
        secure: false //true in production
    })
    res.json({ message: "Logout successful" });
}
//Changes the cookie time to zero and sets httpOnly to true so no frontend can access it,
// "strict" → Cookie sent only if request comes from same site
//  Best security
//  Prevents CSRF

// "lax" → Cookie sent on normal navigation (like clicking links)
//  Default in many cases

// "none" → Cookie sent on all cross-site requests
//  Must use secure: true