import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    profilePic: {
        type: String,
        default: null,
    },
    role: {
        type: String,
        enum: ["athlete", "coach", "club"],
        default: "athlete",
    },
    location: {
        name: { type: String, trim: true, default: null },
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null }
    },
    bio: { type: String, trim: true, default: "" },
    phone: { type: String, default: null },
    sports: { type: [String], default: [] },
}, { timestamps: true });

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;