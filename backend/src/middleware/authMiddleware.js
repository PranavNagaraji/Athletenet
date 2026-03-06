import { checkCookie } from "../utils/token.js";
// export const protect = (req, res, next) => {
//     checkCookie(req, res, next);
// };

export const protect = checkCookie;

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden Access denied" });
        }
        next();
    }
}