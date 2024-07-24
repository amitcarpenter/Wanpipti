import Joi from "joi";
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


// Get All Wallet Transactions
export const getAllWalletTransactions = async (req: Request, res: Response) => {
    try {
        const transactionRepository = getRepository(Transaction);
        const transactions = await transactionRepository.find({ relations: ["user"] });

        if (transactions.length === 0) {
            return handleError(res, 404, 'No transactions found.');
        }

        return handleSuccess(res, 200, 'Transactions retrieved successfully', transactions);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};

