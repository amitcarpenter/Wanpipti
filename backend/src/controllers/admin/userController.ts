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


// Get User List
export const getUserList = async (req: Request, res: Response) => {
  try {
    const userRepository = getRepository(User);
    const userList = await userRepository.find({
      where: { role: 'user' },
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
      return handleError(res, 404, 'User not found');
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
      return handleError(res, 404, 'User not found');
    }
    const file_name = "profile.profileImage";

    await userRepository.delete(userId);
    return handleSuccess(res, 200, 'User deleted successfully');
  } catch (error: any) {
    return handleError(res, 500, error.message);
  }
};