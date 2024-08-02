import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import Joi, { number } from "joi";
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
            relations: ["user"],
            order: { created_at: "DESC" }
        });
        if (transactions.length === 0) {
            return handleError(res, 400, 'No transactions found for this user.');
        }

        return handleSuccess(res, 200, 'Transactions retrieved successfully', transactions);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};

// Updated function to update wallet balance
// export async function updateWalletBalance(user: any, transactionType: string, amount: number): Promise<Wallet> {
//     const walletRepository = getRepository(Wallet);
//     const wallet = await walletRepository.findOne({
//         where: { user: { id: user?.id } },
//         relations: ['user']
//     });

//     if (!wallet) {
//         throw new Error('Wallet not found for the user.');
//     }

//     let walletBalance = parseFloat(wallet.wallet_balance.toString());

//     switch (transactionType) {
//         case 'deposit':
//         case 'betWin':
//             walletBalance += Number(amount);
//             break;
//         case 'withdraw':
//         case 'betPlace':
//             walletBalance -= Number(amount);
//             break;
//         default:
//             throw new Error('Invalid transaction type');
//     }
//     const status = "completed";
//     const transactionRepository = getRepository(Transaction);
//     const newTransaction = transactionRepository.create({
//         user,
//         transaction_type: transactionType,
//         amount,
//         status,
//     });

//     console.log(newTransaction , ">>>>>>>>>>>>>>>>>>>>")

//     // Save the new transaction
//     await transactionRepository.save(newTransaction);


//     wallet.wallet_balance = walletBalance;
//     return await walletRepository.save(wallet);
// }

export async function updateWalletBalance(user: any, transactionType: string, amount: number): Promise<Wallet> {
    const walletRepository = getRepository(Wallet);
    const wallet = await walletRepository.findOne({
        where: { user: { id: user?.id } },
        relations: ['user']
    });

    if (!wallet) {
        throw new Error('Wallet not found for the user.');
    }

    let walletBalance = parseFloat(wallet.wallet_balance.toString());

    if (transactionType == "withdraw") {
        if (walletBalance < amount) {
            throw new Error('Not Sufficient Amount');
        }

    }

    switch (transactionType) {
        case 'deposit':
        case 'betWin':
            walletBalance += Number(amount);
            break;
        case 'withdraw':
        case 'betPlace':
            walletBalance -= Number(amount);
            break;
        default:
            throw new Error('Invalid transaction type');
    }

    const status = "completed";
    const transactionRepository = getRepository(Transaction);
    const newTransaction = transactionRepository.create({
        user,
        transaction_type: transactionType,
        amount,
        status,
        closing_balance: walletBalance
    });

    // Save the new transaction
    await transactionRepository.save(newTransaction);

    wallet.wallet_balance = walletBalance;
    await walletRepository.save(wallet);

    return wallet;
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

        const user_req = req.user as IUser;

        const userRepository = getRepository(User);
        const user = await userRepository.findOne({ where: { id: user_req.id } });
        if (!user) {
            return handleError(res, 400, 'User not found.');
        }

        try {
            await updateWalletBalance(user, transaction_type, amount);
        } catch (error: any) {
            return handleError(res, 400, error.message);
        }
        // Customize response message based on transaction type
        let responseMessage = '';
        switch (transaction_type) {
            case 'deposit':
                responseMessage = `Deposit of ${amount}$ successful. Your account has been credited.`;
                break;
            case 'betPlace':
                responseMessage = `Bet of ${amount}$ has been placed successfully.`;
                break;
            case 'betWin':
                responseMessage = `Congratulations! Your winnings of ${amount}$ have been credited to your Wallet.`;
                break;
            case 'withdraw':
                responseMessage = `Withdrawal of ${amount}$ has been processed successfully.`;
                break;
            default:
                responseMessage = 'Transaction successful';
        }

        return handleSuccess(res, 201, responseMessage);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};