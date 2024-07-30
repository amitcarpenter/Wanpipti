import Joi from "joi";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { IUser } from "../../models/User";
import { User } from "../../entities/User";
import { Role } from "../../entities/Role";
import { Wallet } from "../../entities/Wallet";
import { Request, Response } from "express";
import { getRepository, MoreThan } from "typeorm";
import { sendEmail } from "../../services/otpService";
import { handleError, handleSuccess } from "../../utils/responseHandler";
import { generateUsername } from "../api/userController"
dotenv.config();

const APP_URL = process.env.APP_URL as string;


// Get User List
export const getUserList = async (req: Request, res: Response) => {
  try {
    const userRepository = getRepository(User);
    const userList = await userRepository.find({
      // where: { role.: 'user' },
      order: { created_at: 'DESC' }
    });
    if (!userList || userList.length === 0) {
      return handleError(res, 404, 'User list not found');
    }

    userList.forEach((user) => {
      if (
        user?.profile_image &&
        !user.profile_image.startsWith('http')
      ) {
        user.profile_image = APP_URL + user.profile_image;
      }
    });

    return handleSuccess(res, 200, "User profile fetched successfully", userList)
  } catch (error: any) {
    return handleError(res, 500, error.message);
  }
};


// Get single user by id
export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userRepository = getRepository(User);
    const user = await userRepository.findOneBy({ id });
    if (!user) {
      return handleError(res, 404, 'User Not Found');
    }
    if (user.profile_image && !user.profile_image.startsWith('http')) {
      user.profile_image = APP_URL + user.profile_image;
    }
    return handleSuccess(res, 200, 'User profile fetched successfully', user);
  } catch (error: any) {
    return handleError(res, 500, error.message);
  }
};


// Update Profile Details
export const updateUser = async (req: Request, res: Response) => {
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

    const id = parseInt(req.params.id);
    const userRepository = getRepository(User);
    const user = await userRepository.findOneBy({ id });

    if (!user) {
      return handleError(res, 404, "User Not Found")
    }

    if (user.username == username) {
      return handleError(res, 400, "username already exist")
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


// delete user by id
export const delete_user_by_id = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return handleError(res, 400, 'Invalid user ID');
    }


    const userRepository = getRepository(User);
    const userToDelete = await userRepository.findOneBy({ id: userId });

    if (!userToDelete) {
      return handleError(res, 404, 'User Not Found');
    }
    const file_name = "profile.profileImage";

    await userRepository.delete(userId);
    return handleSuccess(res, 200, 'User deleted successfully');
  } catch (error: any) {
    return handleError(res, 500, error.message);
  }
};


// Add User
export const add_user = async (req: Request, res: Response) => {
  try {
    const addUserSchema = Joi.object({
      full_name: Joi.string().min(3).max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
    });
    const { error, value } = addUserSchema.validate(req.body);
    if (error) {
      return handleError(res, 400, error.details[0].message);
    }
    const { full_name, email, password } = value;

    const userRepository = getRepository(User);
    const roleRepository = getRepository(Role);
    const existEmail = await userRepository.findOne({ where: { email } });
    if (existEmail) {
      return handleError(res, 400, "Email already exists.");
    }
    const defaultRole = await roleRepository.findOne({ where: { role_value: 0 } });
    if (!defaultRole) {
      return handleError(res, 500, "Default role not found.");
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const username = await generateUsername(full_name);

    // Create new user
    const newUser = userRepository.create({
      full_name,
      email,
      password: hashedPassword,
      username,
      role: defaultRole,
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
    return handleSuccess(res, 201, "User Added Successfully.");
  } catch (error: any) {
    console.error('Error in add User:', error);
    return handleError(res, 500, error.message);
  }
};