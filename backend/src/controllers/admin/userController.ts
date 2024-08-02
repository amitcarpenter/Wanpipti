import Joi from "joi";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Bet } from "../../entities/Bet";
import { IUser } from "../../models/User";
import { User } from "../../entities/User";
import { Role } from "../../entities/Role";
import { Request, Response } from "express";
import { Wallet } from "../../entities/Wallet";
import { Result } from "../../entities/Result";
import { sendEmail } from "../../services/otpService";
import { generateUsername } from "../api/userController"
import { ChatbotQuery } from "../../entities/ChatbotQuery";
import { getRepository, MoreThan, Transaction } from "typeorm";
import { handleError, handleSuccess } from "../../utils/responseHandler";
dotenv.config();

const APP_URL = process.env.APP_URL as string;


// Get User List
export const getUserList = async (req: Request, res: Response) => {
  try {
    const userRepository = getRepository(User);
    const roleRepository = getRepository(Role);
    const walletRepository = getRepository(Wallet);

    const role = await roleRepository.findOneBy({ role_name: 'User' });
    if (!role) {
      return handleError(res, 400, 'Role not found');
    }
    const userList = await userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.role', 'role')
      .where('role.role_name = :roleName', { roleName: 'User' })
      .orderBy('user.created_at', 'DESC')
      .getMany();

    if (!userList || userList.length === 0) {
      return handleError(res, 400, 'User list not found');
    }
    userList.forEach((user) => {
      if (user?.profile_image && !user.profile_image.startsWith('http')) {
        user.profile_image = APP_URL + user.profile_image;
      }
    });
    const wallets = await walletRepository
      .createQueryBuilder('wallet')
      .innerJoinAndSelect('wallet.user', 'user')
      .orderBy('user.created_at', 'DESC')
      .getMany();


    userList.forEach((user) => {
      const userWallet = wallets.find(wallet => wallet.user.id === user.id);
      if (userWallet) {
        (user as any).wallet = userWallet;
      }
    });

    return handleSuccess(res, 200, 'User profile fetched successfully', userList);
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
      return handleError(res, 400, 'User Not Found');
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
    const users = await userRepository.find();
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

// delete user by id
export const delete_user_by_id = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return handleError(res, 400, 'Invalid user ID');
    }

    const betRepository = getRepository(Bet);
    const userRepository = getRepository(User);
    const walletRepository = getRepository(Wallet);
    const resultRepository = getRepository(Result);
    const chatbotRepository = getRepository(ChatbotQuery);
    const transactionRepository = getRepository(Transaction);

    // Check if the user exists
    const userToDelete = await userRepository.findOneBy({ id: userId });
    if (!userToDelete) {
      return handleError(res, 400, 'User Not Found');
    }
    try {
      await betRepository.delete(userId);
    } catch (error: any) {
      console.error('Failed to delete user bets:', error.message);
    }
    try {
      await resultRepository.delete(userId);
    } catch (error: any) {
      console.error('Failed to delete user results:', error.message);
    }
    try {
      await chatbotRepository.delete(userId);
    } catch (error: any) {
      console.error('Failed to delete user chatbot queries:', error.message);
    }
    try {
      await transactionRepository.delete(userId);
    } catch (error: any) {
      console.error('Failed to delete user transactions:', error.message);
    }

    try {
      await walletRepository.delete(userId);
      await userRepository.delete(userId);
    } catch (error) {
      return handleError(res, 500, 'Failed to delete user or wallet');
    }

    return handleSuccess(res, 200, 'User data deleted successfully');
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
      is_verified: true
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