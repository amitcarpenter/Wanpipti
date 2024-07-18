import Joi from "joi";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { IUser } from "../../models/User";
import { User } from "../../entities/User";
import { Request, Response } from "express";
import { getRepository, MoreThan } from "typeorm";
import { sendEmail } from "../../services/otpService";
import { handleError, handleSuccess } from "../../utils/responseHandler";
dotenv.config();




const APP_URL = process.env.APP_URL as string;

// Function to generate JWT token
const generateAccessToken = (payload: {
    userId: number | any;
    email: string;
}) => {
    const JWT_SECRET = process.env.JWT_SECRET as string;
    const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "30d";

    console.log(JWT_SECRET, JWT_EXPIRATION);

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

// Generate UserName
const generateUsername = async (fullName: string): Promise<string> => {
    const userRepository = getRepository(User);
    const baseUsername = fullName.toLowerCase().replace(/\s+/g, '_');
    let username = baseUsername;
    let count = 1;

    while (await userRepository.findOne({ where: { username } })) {
        username = `${baseUsername}${count}`;
        count++;
    }

    return username;
};

// Register User
export const register = async (req: Request, res: Response) => {
    try {
        const registerSchema = Joi.object({
            full_name: Joi.string().min(3).max(30).required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required(),
        });
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return handleError(res, 400, error.details[0].message);
        }
        const { full_name, email, password } = value;
        const userRepository = getRepository(User);
        const existEmail = await userRepository.findOne({ where: { email } });
        if (existEmail) {
            return handleError(res, 400, "Email already exists.");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const username = await generateUsername(full_name)

        const newUser = userRepository.create({
            full_name,
            email,
            password: hashedPassword,
            username
        });

        const user_data = await userRepository.save(newUser);

        console.log("user_data", user_data);
        return handleSuccess(res, 201, "User registered successfully.", user_data)
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};

// Login
export const login = async (req: Request, res: Response) => {
    try {
        const loginSchema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required(),
        });
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return handleError(res, 400, error.details[0].message);
        }
        const { email, password } = value;
        const userRepository = getRepository(User);
        const user = await userRepository.findOneBy({ email });
        if (!user) {
            return handleError(res, 404, "User not found.");
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {

            return handleError(res, 400, "Invalid credentials")
        }
        const payload = { userId: user.id, email: user.email };
        const token = generateAccessToken(payload);
        user.jwt_token = token;
        await userRepository.save(user);
        return handleSuccess(res, 200, "Login Successful.", token)

    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};

// Show forgot password page
export const render_forgot_password_page = (req: Request, res: Response) => {
    try {
        return res.render("resetPassword.ejs");
    } catch (error: any) {
        console.error("Error rendering forgot password page:", error);
        return handleError(res, 500, "An error occurred while rendering the page")
    }
};

// forgot_password_for_admin
export const forgot_password = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const forgotPasswordSchema = Joi.object({
            email: Joi.string().email().required(),
        });
        const { error, value } = forgotPasswordSchema.validate(req.body);
        if (error) {
            return handleError(res, 400, error.details[0].message);
        }
        const userRepository = getRepository(User);
        const user = await userRepository.findOneBy({ email });
        if (!user) {
            return handleError(res, 404, "user not found")
        }
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpiry = new Date(Date.now() + 3600000);
        user.reset_password_token = resetToken;
        user.reset_password_token_expiry = resetTokenExpiry;
        const user_data = await userRepository.save(user);
        const logoPath = path.resolve(__dirname, "../../assets/logo.png");
        console.log(logoPath);
        const resetLink = `${req.protocol}://${req.get(
            "host"
        )}/api/reset-password?token=${resetToken}`;
        const emailOptions = {
            to: email,
            subject: "Password Reset Request",
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>Password Reset Request</h2>
                    <p>Click the link below to reset your password:</p>
                    <a href="${resetLink}" style="color: #1a73e8;">Reset Password</a>
                    <p>This link will expire in 1 hour.</p>
                </div>
            `,
            attachments: [
                {
                    filename: "logo.png",
                    path: logoPath,
                    cid: "unique@cid",
                },
            ],
        };
        await sendEmail(emailOptions);
        return handleSuccess(res, 200, "Password reset link sent to your email.",)
    } catch (error: any) {
        console.error("Error in forgot password controller:", error);
        return handleError(res, 500, error.message);
    }
};

// Reset Password
export const reset_password = async (req: Request, res: Response) => {
    try {
        const resetPasswordSchema = Joi.object({
            token: Joi.string().required(),
            newPassword: Joi.string().min(8).required().messages({
                "string.min": "Password must be at least 8 characters long",
                "any.required": "New password is required",
            }),
        });
        const { error, value } = resetPasswordSchema.validate(req.body);
        if (error) {
            return handleError(res, 400, error.details[0].message);
        }
        const { token, newPassword } = value;
        const userRepository = getRepository(User);
        const user = await userRepository.findOne({
            where: {
                reset_password_token: token,
                reset_password_token_expiry: MoreThan(new Date()),
            },
        });
        if (!user) {
            return handleError(res, 400, "Invalid or expired token")
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;
        user.reset_password_token = null;
        user.reset_password_token_expiry = null;
        await userRepository.save(user);
        return handleSuccess(res, 200, "Password reset successfully.",)

    } catch (error: any) {
        console.error("Error in reset password controller:", error);
        return handleError(res, 500, error.message);
    }
};

// Google OAuth route
export const signup_google = async (req: Request, res: Response) => {
    const signupGoogleSchema = Joi.object({
        email: Joi.string().email().required(),
        google_signup_token: Joi.string().required(),
        full_name: Joi.string().required(),
        profile_image: Joi.string().required(),
    });

    const { error } = signupGoogleSchema.validate(req.body);
    if (error) {
        return handleError(res, 400, error.details[0].message);

    }
    const { email, google_signup_token, full_name, profile_image } = req.body;

    try {
        const userRepository = getRepository(User);
        let user = await userRepository.findOne({ where: { email } });

        if (user) {
            user.full_name = full_name || user.full_name;
            user.google_signup_token = google_signup_token;
            if (user.signup_method !== "traditional") {
                user.signup_method = "google";
            }
        } else {
            const username = await generateUsername(full_name)
            user = userRepository.create({
                email,
                google_signup_token,
                full_name,
                signup_method: "google",
                profile_image,
                username
            });
        }
        const payload = {
            userId: user.id,
            email: user.email,
        };
        const token = generateAccessToken(payload);
        user.jwt_token = token;
        await userRepository.save(user);
        return handleSuccess(res, 201, "User registered successfully via Google.", token)
    } catch (error: any) {
        console.error("Error during Google signup:", error);
        return handleError(res, 500, error.message);
    }
};

// Get Profile
export const getProfile = async (req: Request, res: Response) => {
    try {
        const user_req = req.user as IUser;
        const userRepository = getRepository(User);
        const user = await userRepository.findOneBy({ id: user_req.id });

        if (!user) {
            return handleError(res, 404, "user not found")
        }

        if (user.profile_image && !user.profile_image.startsWith("http")) {
            user.profile_image = `${APP_URL}${user.profile_image}`;
        }
        return handleSuccess(res, 200, "User profile fetched successfully", user);

    } catch (error: any) {
        return handleError(res, 500, error.message)
    }
};

// Update Profile Details
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const updateProfileSchema = Joi.object({
            username: Joi.string().min(3).max(30).required(),
            full_name: Joi.string().min(3).max(30).required(),
        });

        const { error } = updateProfileSchema.validate(req.body);
        if (error) {
            return handleError(res, 400, error.details[0].message);

        }
        const { full_name, username } = req.body;

        const user_req = req.user as IUser;
        const userRepository = getRepository(User);
        const user = await userRepository.findOne({ where: { id: user_req.id } });

        if (!user) {
            return handleError(res, 404, "user not found")
        }

        if (full_name) user.full_name = full_name;
        if (username) user.username = username;
        if (req.file) {
            let profile_image = "";
            profile_image = req.file.filename;
            user.profile_image = profile_image;
            const file_name = "profile_image";
            // await deleteImageFile(user.id, file_name);
        }
        const user_data = await userRepository.save(user);
        return handleSuccess(res, 200, "Profile updated successfully", user_data);

    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};

