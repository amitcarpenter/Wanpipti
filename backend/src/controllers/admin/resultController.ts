import Joi from "joi";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Bet } from '../../entities/Bet';
import { IUser } from "../../models/User";
import { User } from "../../entities/User";
import { Role } from '../../entities/Role';
import { Game } from '../../entities/Game';
import { Request, Response } from "express";
import { Result } from '../../entities/Result';
import { Wallet } from "../../entities/Wallet";
import { getRepository, MoreThan } from "typeorm";
import { sendEmail } from "../../services/otpService";
import { handleError, handleSuccess } from "../../utils/responseHandler";
dotenv.config();

const calculateWinnings = async (bets: Bet[], winningNumber: number, adminCommission: number) => {
    // Filter bets that match the winning number
    const winningBets = bets.filter((bet) => {
        let bet_choosen_number = Number(bet.choosen_number)
        return bet_choosen_number === winningNumber
    });

    if (winningBets.length === 0) {
        return {
            totalAmount: 0,
            adminCommission: 0,
            distributableAmount: 0,
            winnings: [],
        };
    }

    // Calculate total bet amount
    const totalBetAmount = bets.reduce((acc, bet) => Number(acc) + Number(bet.bet_amount), 0);

    // Calculate admin commission
    const adminCommissionAmount = adminCommission;

    // Calculate distributable amount
    const distributableAmount = totalBetAmount - adminCommissionAmount;

    // Calculate total bet amount for winners
    const totalWinningBetAmount = winningBets.reduce((acc, bet) => Number(acc) + Number(bet.bet_amount), 0);

    // Calculate winnings for each winner
    const winnings = winningBets.map(bet => {
        const winningAmount = (Number(bet.bet_amount) / totalWinningBetAmount) * distributableAmount;
        return {
            userId: bet.user.id,
            betId: bet.id,
            winningAmount: winningAmount,
        };
    });

    return {
        totalAmount: totalBetAmount,
        adminCommission: adminCommissionAmount,
        distributableAmount: distributableAmount,
        winnings: winnings,
    };
};

// Declare Results
export const declareResults = async (req: Request, res: Response) => {
    try {
        const { game_id, winning_number, } = req.body;

        // Validate input
        if (!game_id || winning_number === undefined) {
            return handleError(res, 400, 'Game ID and winning number are required.');
        }

        const gameRepository = getRepository(Game);
        const betRepository = getRepository(Bet);
        const resultRepository = getRepository(Result);
        const walletRepository = getRepository(Wallet);

        // Find the game
        const game = await gameRepository.findOne({
            where: { id: game_id }
        });

        if (!game) {
            return handleError(res, 404, 'Game not found.');
        }

        // Get all bets for the game
        const bets = await betRepository.find({
            where: { game: { id: game_id } },
            relations: ["user"]
        });

        if (bets.length === 0) {
            return handleError(res, 404, 'No bets found for this game.');
        }

        let winningAmount = 225; 
        const result = await calculateWinnings(bets, 9, 50);

        const results = [];
        for (const bet of bets) {
            const isWinning = bet.choosen_number === winning_number ? true : false;
            const result = resultRepository.create({
                game,
                bet,
                user: bet.user,
                is_winning: isWinning,
                winning_amount: isWinning ? winningAmount : 0
            });
            results.push(result);


            // If bet is winning, update wallet balance
            if (isWinning) {
                const wallet = await walletRepository.findOne({
                    where: { user: { id: bet.user.id } }
                });
                console.log(wallet, "wallet _______")

                const result = await calculateWinnings(bets, 9, 50);

                result.winnings.forEach(async winning => {
                    const wallet = await walletRepository.findOne({
                        where: { user: { id: winning.userId } }
                    });

                    if (wallet) {
                        // Convert decimal values to numbers
                        let wallet_balance = parseFloat(wallet.wallet_balance.toString());
                        let wallet_today_earning = parseFloat(wallet.today_earning.toString());
                        let wallet_total_earning = parseFloat(wallet.total_earning.toString());

                        console.log("Updated Wallet Balance1:", wallet_balance);
                        console.log("Updated Today Earning2:", wallet_today_earning);
                        console.log("Updated Total Earning3:", wallet_total_earning);

                        // Add winning amount
                        wallet_balance += winning.winningAmount;
                        wallet_today_earning += winning.winningAmount;
                        wallet_total_earning += winning.winningAmount;

                        // Update wallet object
                        wallet.wallet_balance = wallet_balance;
                        wallet.today_earning = wallet_today_earning;
                        wallet.total_earning = wallet_total_earning;

                        // Logging for debugging
                        console.log("Updated Wallet Balance:", wallet_balance);
                        console.log("Updated Today Earning:", wallet_today_earning);
                        console.log("Updated Total Earning:", wallet_total_earning);

                        // Save updated wallet
                        await walletRepository.save(wallet);
                    }
                });

            }
        }

        // Save results
        await resultRepository.save(results);

        return handleSuccess(res, 201, 'Results declared successfully');
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};

// Get Results for a Game
export const getResultsForGame = async (req: Request, res: Response) => {
    try {
        const { game_id } = req.params;

        if (!game_id) {
            return handleError(res, 400, 'Game ID is required.');
        }
        const resultRepository = getRepository(Result);
        // Fetch results for the specified game
        const results = await resultRepository
            .createQueryBuilder('result')
            .leftJoinAndSelect('result.game', 'game')
            .leftJoinAndSelect('result.bet', 'bet')
            .leftJoinAndSelect('result.user', 'user')
            .where('result.gameId = :gameId', { gameId: game_id })
            .getMany();

        if (results.length === 0) {
            return handleError(res, 404, 'No results found for this game.');
        }

        return handleSuccess(res, 200, 'Results retrieved successfully', results);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};
