import Joi from "joi";
import ejs from 'ejs';
import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Role } from '../../entities/Role';
import { IUser } from "../../models/User";
import { User } from "../../entities/User";
import { Wallet } from "../../entities/Wallet";
import { Request, Response } from "express";
import { getRepository, MoreThan } from "typeorm";
import { sendEmail } from "../../services/otpService";
import { handleError, handleSuccess } from "../../utils/responseHandler";
dotenv.config();

const APP_URL = process.env.APP_URL as string;

// Generate veification Link
const generateVerificationLink = (token: string, baseUrl: string) => {
    return `${baseUrl}/api/verify-email?token=${token}`;
};

// Function to generate JWT token
const generateAccessToken = (payload: {
    userId: number | any;
    email: string;
}) => {
    const JWT_SECRET = process.env.JWT_SECRET as string;
    const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "30d";
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

// Generate UserName
export const generateUsername = async (fullName: string): Promise<string> => {
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
        // Validate request body
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
        const roleRepository = getRepository(Role);

        // Check if email already exists
        const existEmail = await userRepository.findOne({ where: { email } });
        if (existEmail) {
            return handleError(res, 400, "Email already exists.");
        }

        // Fetch the default role (ID: 0)
        const defaultRole = await roleRepository.findOne({ where: { role_value: 0 } });
        if (!defaultRole) {
            return handleError(res, 500, "Default role not found.");
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const username = await generateUsername(full_name);
        const verifyToken = crypto.randomBytes(32).toString('hex');
        const verifyTokenExpiry = new Date(Date.now() + 3600000);

        // Create new user
        const newUser = userRepository.create({
            full_name,
            email,
            password: hashedPassword,
            username,
            role: defaultRole,
            verify_token: verifyToken,
            verify_token_expiry: verifyTokenExpiry
        });
        const savedUser = await userRepository.save(newUser);

        // Create wallet for the new user
        const walletRepository = getRepository(Wallet);
        const newWallet = walletRepository.create({
            user: savedUser,
            wallet_balance: 0,
            today_earning: 0,
            total_earning: 0,
        });
        await walletRepository.save(newWallet);

        const baseUrl = req.protocol + '://' + req.get('host');
        const verificationLink = generateVerificationLink(verifyToken, baseUrl);
        const logoPath = path.resolve(__dirname, "../../assets/logo.png");

        // Render the EJS template
        const emailTemplatePath = path.resolve(__dirname, '../../views/verifyAccount.ejs');
        const emailHtml = await ejs.renderFile(emailTemplatePath, { verificationLink });

        // Send verification email
        const emailOptions = {
            to: email,
            subject: "Verify Your Email Address",
            html: emailHtml,
            attachments: [
                {
                    filename: "logo.png",
                    path: logoPath,
                    cid: "unique@cid",
                },
            ],
        };

        await sendEmail(emailOptions);

        return handleSuccess(res, 201, "Verification Link sent successfully Please verify your account.");
    } catch (error: any) {
        console.error('Error in register:', error);
        return handleError(res, 500, error.message);
    }
};

// Verify Email
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token } = req.query;
        console.log(token)
        if (typeof token !== 'string') {
            return handleError(res, 400, "Invalid token.");
        }
        const userRepository = getRepository(User);
        // Find the user with the provided token
        const user = await userRepository.findOne({
            where: {
                verify_token: token,
                verify_token_expiry: MoreThan(new Date())
            }
        });

        if (!user) {
            return handleError(res, 400, "Invalid or expired token.");
        }

        // Update user verification status
        user.is_verified = true;
        user.verify_token = null;
        user.verify_token_expiry = null;
        await userRepository.save(user);
        // return handleSuccess(res, 200, "Email verified successfully.");
        return res.render("successRegister.ejs")

    } catch (error: any) {
        console.error('Error in verifyEmail:', error);
        return handleError(res, 500, error.message);
    }
};


export const render_success_register = (req: Request, res: Response) => {
    res.render("successRegister.ejs")
}

export const render_success_reset = (req: Request, res: Response) => {
    res.render("successReset.ejs")
}

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
            return handleError(res, 400, "User Not Found.");
        }
        if (user.is_verified == false) {
            return handleError(res, 400, "Please verify your account.");
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
            return handleError(res, 400, "User Not Found")
        }
        if (user.is_verified == false) {
            return handleError(res, 400, "Please Verify Your Account")
        }
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpiry = new Date(Date.now() + 3600000);
        user.reset_password_token = resetToken;
        user.reset_password_token_expiry = resetTokenExpiry;
        const user_data = await userRepository.save(user);
        const logoPath = path.resolve(__dirname, "../../assets/logo.png");
        console.log(logoPath);

        const resetLink = `${req.protocol}://${req.get("host")}/api/reset-password?token=${resetToken}`;
        const emailTemplatePath = path.resolve(__dirname, '../../views/forgotPassword.ejs');
        const emailHtml = await ejs.renderFile(emailTemplatePath, { resetLink });
        const emailOptions = {
            to: email,
            subject: "Password Reset Request",
            html: emailHtml,


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
        // return res.render("successReset.ejs")
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
            // If the user exists, update their information
            user.full_name = full_name || user.full_name;
            user.google_signup_token = google_signup_token;
            if (user.signup_method !== "traditional") {
                user.signup_method = "google";
                user.is_verified = true;
            }
        } else {
            // If the user does not exist, create a new user
            const roleRepository = getRepository(Role);
            const defaultRole = await roleRepository.findOneBy({ role_value: 0 });
            if (!defaultRole) {
                return handleError(res, 500, "Default role not found.");
            }

            const username = await generateUsername(full_name);

            user = userRepository.create({
                email,
                google_signup_token,
                full_name,
                signup_method: "google",
                profile_image,
                username,
                role: defaultRole,
                is_verified: true
            });

            const user_data = await userRepository.save(user);

            // Create a wallet for the new user
            const walletRepository = getRepository(Wallet);
            const newWallet = walletRepository.create({
                user: user_data,
                wallet_balance: 0,
                today_earning: 0,
                total_earning: 0,
            });
            await walletRepository.save(newWallet);
        }

        const payload = { userId: user.id, email: user.email };
        const token = generateAccessToken(payload);
        user.jwt_token = token;

        // Save the user again to ensure the token is stored
        const user_data = await userRepository.save(user);

        return handleSuccess(res, 201, "Login Successfully.", user_data.jwt_token);
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
            return handleError(res, 400, "User Not Found")
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
            return handleError(res, 400, "User Not Found")
        }

        const existingUser = await userRepository.findOneBy({ username });
        if (existingUser && existingUser.id !== user.id) {
            return handleError(res, 400, "Username already exists");
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
        return handleSuccess(res, 200, "Profile updated successfully");

    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};

// Change Password
export const changePassword = async (req: Request, res: Response) => {
    try {
        // Validation schema
        const changePasswordSchema = Joi.object({
            currentPassword: Joi.string().required(),
            newPassword: Joi.string().min(8).required(),
        });

        // Validate request body
        const { error } = changePasswordSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: error.details[0].message,
            });
        }
        const user_req = req.user as IUser;
        const { currentPassword, newPassword } = req.body;
        const userRepository = getRepository(User);

        // Find user
        const user = await userRepository.findOneBy({ id: user_req.id });
        if (!user) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "User not found",
            });
        }

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Current password is incorrect",
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user
        user.password = hashedPassword;

        // Save changes
        await userRepository.save(user);

        return res.status(200).json({
            success: true,
            status: 200,
            message: "Password changed successfully",
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            status: 500,
            error: error.message,
        });
    }
};

