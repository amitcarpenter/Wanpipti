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
        const walletRepository = getRepository(Wallet);

        const transactions = await transactionRepository.createQueryBuilder("transaction")
            .leftJoinAndSelect("transaction.user", "user")
            .select([
                "transaction.id",
                "transaction.transaction_type",
                "transaction.amount",
                "transaction.status",
                "transaction.closing_balance",
                "transaction.created_at",
                "transaction.updated_at",
                "user.id",
                "user.full_name",
            ])
            .getMany();

        if (transactions.length === 0) {
            return handleError(res, 400, 'No transactions found.');
        }

        // // Get wallet balances for each user
        // const userIds = transactions.map(transaction => transaction.user.id);
        // const wallets = await walletRepository.createQueryBuilder("wallet")
        //     .where("wallet.userId IN (:...userIds)", { userIds })
        //     .leftJoinAndSelect("wallet.user", "user")
        //     .getMany()
        // console.log(wallets)
        // // Attach wallet balances to transactions
        // const transactionsWithWallets = transactions.map(transaction => {
        //     const wallet = wallets.find(wallet => wallet.user.id === transaction.user.id);
        //     return {
        //         ...transaction,
        //         wallet_balance: wallet ? wallet.wallet_balance : 0
        //     };
        // });

        return handleSuccess(res, 200, 'Transactions retrieved successfully', transactions);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};