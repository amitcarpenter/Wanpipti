import Joi, { number } from "joi";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import moment from "moment-timezone";
import { Bet } from "../../entities/Bet";
import { IUser } from "../../models/User";
import { User } from "../../entities/User";
import { Wallet } from "../../entities/Wallet";
import { Game } from "../../entities/Game";
import { Request, Response } from "express";
import { sendEmail } from "../../services/otpService";
import { GameSetting } from "../../entities/GameSetting";
import { Transaction } from "../../entities/Transaction";
import { getRepository, MoreThan, Between } from "typeorm";
import { handleError, handleSuccess } from "../../utils/responseHandler";


// Get Wallet Details for a specific user
export const getUserWalletDetails = async (req: Request, res: Response) => {
    try {
        const user_req = req.user as IUser;
        const userRepository = getRepository(User);
        const user = await userRepository.findOneBy({ id: user_req.id });
        if (!user) {
            return handleError(res, 400, 'User not found.');
        }

        const walletRepository = getRepository(Wallet);
        const wallet = await walletRepository.findOne({
            where: { user: { id: user.id } }
        });

        if (!wallet) {
            return handleError(res, 400, 'Wallet not found for the user.');
        }

        return handleSuccess(res, 200, 'Wallet details fetched successfully', wallet);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};