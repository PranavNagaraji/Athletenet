import jwt from "jsonwebtoken";
import User from "../models/User.js";

export function createCookie(res, userId, userRole) {
    const token = jwt.sign(
        { id: userId, role: userRole },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
    );

    console.log("Generated Token: ", token); // Print token

    res.cookie("token", token, {
        httpOnly: true,
        secure: false, // true in production for HTTPS
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days
    });
}

export async function checkCookie(req, res, next) {
    const token = req.cookies.token;
    if (!token) return next(); //allow login if no cookie
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return res.status(200).json({ message: "Already logged in" });
    } catch {
        return next();
    }
}