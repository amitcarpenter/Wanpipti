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



// Get Wallet Transactions by User
export const getWalletTransactionsByUser = async (req: Request, res: Response) => {
    try {
        const user_req = req.user as IUser;
        const transactionRepository = getRepository(Transaction);
        const transactions = await transactionRepository.find({
            where: { user: { id: user_req.id } },
            relations: ["user"]
        });
        if (transactions.length === 0) {
            return handleError(res, 404, 'No transactions found for this user.');
        }

        return handleSuccess(res, 200, 'Transactions retrieved successfully', transactions);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};

// Create Wallet Transaction
// export const createWalletTransaction = async (req: Request, res: Response) => {
//     try {
//         const transactionSchema = Joi.object({
//             transaction_type: Joi.string().valid('deposit', 'betPlace', 'betWin', 'withdraw').required(),
//             amount: Joi.number().greater(0).required(),
//         });

//         const { error, value } = transactionSchema.validate(req.body);

//         // Validate input
//         if (error) {
//             return handleError(res, 400, error.details[0].message);
//         }

//         const { transaction_type, amount } = value;
//         const status = "completed";
//         const user_req = req.user as IUser;
//         const userRepository = getRepository(User);
//         const user = await userRepository.findOneBy({ id: user_req.id });

//         if (!user) {
//             return handleError(res, 404, 'User not found.');
//         }

//         const transactionRepository = getRepository(Transaction);
//         const newTransaction = transactionRepository.create({
//             user,
//             transaction_type,
//             amount,
//             status,
//         });

//         // Save the new transaction
//         await transactionRepository.save(newTransaction);

//         // Update the wallet balance based on transaction type
//         const walletRepository = getRepository(Wallet);
//         let wallet = await walletRepository.findOneBy({ user: { id: user_req.id } });

//         if (!wallet) {
//             // Handle case where wallet does not exist
//             return handleError(res, 404, 'Wallet not found for the user.');
//         }

//         if (transaction_type === 'deposit' || transaction_type === 'betWin') {


//             let wallet_balance = parseFloat(wallet.wallet_balance.toString());
//             wallet_balance += amount;
//             wallet.wallet_balance = wallet_balance;
//             // Add amount to wallet balance
//             // parseFloat(wallet.wallet_balance) += amount;
//         } else if (transaction_type === 'withdraw' || transaction_type === 'betPlace') {
//             let wallet_balance = parseFloat(wallet.wallet_balance.toString());
//             wallet_balance -= amount;
//             wallet.wallet_balance = wallet_balance;

//         }

//         // Save updated wallet
//         await walletRepository.save(wallet);

//         return handleSuccess(res, 201, 'Transaction created successfully', newTransaction);
//     } catch (error: any) {
//         return handleError(res, 500, error.message);
//     }
// };


// Updated function to update wallet balance
export async function updateWalletBalance(userId: number, transactionType: string, amount: number): Promise<Wallet> {
    const walletRepository = getRepository(Wallet);
    const wallet = await walletRepository.findOne({
        where: { user: { id: userId } },
        relations: ['user']
    });
    
    if (!wallet) {
        throw new Error('Wallet not found for the user.');
    }

    let walletBalance = parseFloat(wallet.wallet_balance.toString());

    switch (transactionType) {
        case 'deposit':
        case 'betWin':
            walletBalance += amount;
            break;
        case 'withdraw':
        case 'betPlace':
            walletBalance -= amount;
            break;
        default:
            throw new Error('Invalid transaction type');
    }

    wallet.wallet_balance = walletBalance;
    return await walletRepository.save(wallet);
}

// Modified controller
export const createWalletTransaction = async (req: Request, res: Response) => {
    try {
        const transactionSchema = Joi.object({
            transaction_type: Joi.string().valid('deposit', 'betPlace', 'betWin', 'withdraw').required(),
            amount: Joi.number().greater(0).required(),
        });

        const { error, value } = transactionSchema.validate(req.body);
        if (error) {
            return handleError(res, 400, error.details[0].message);
        }

        const { transaction_type, amount } = value;
        const status = "completed";
        const user_req = req.user as IUser;

        const userRepository = getRepository(User);
        const user = await userRepository.findOne({ where: { id: user_req.id } });
        if (!user) {
            return handleError(res, 404, 'User not found.');
        }

        const transactionRepository = getRepository(Transaction);
        const newTransaction = transactionRepository.create({
            user,
            transaction_type,
            amount,
            status,
        });

        // Save the new transaction
        await transactionRepository.save(newTransaction);

        // Update wallet balance using the new function
        try {
            await updateWalletBalance(user.id, transaction_type, amount);
        } catch (error: any) {
            return handleError(res, 404, error.message);
        }

        return handleSuccess(res, 201, 'Transaction created successfully', newTransaction);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};