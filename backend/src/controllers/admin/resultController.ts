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
import { sendEmail } from "../../services/otpService";
import { getRepository, MoreThan, FindOptionsWhere } from "typeorm";
import { handleError, handleSuccess } from "../../utils/responseHandler";
import { updateWalletBalance } from "../api/walletTransactionController";
dotenv.config();


// Calculate the Winning Numbers
const calculateWinnings = async (bets: Bet[], winningNumber: number, adminCommission: number) => {
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
    const totalBetAmount = bets.reduce((acc, bet) => Number(acc) + Number(bet.bet_amount), 0);
    const adminCommissionAmount = adminCommission;
    const distributableAmount = totalBetAmount - adminCommissionAmount;
    const totalWinningBetAmount = winningBets.reduce((acc, bet) => Number(acc) + Number(bet.bet_amount), 0);
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
// export const declareResults = async (req: Request, res: Response) => {
//     try {
//         const { game_id, winning_number, admin_commission_amount } = req.body;

//         let winning_number_int = Number(winning_number)
//         let admin_commission_percentage_int = Number(admin_commission_amount)

//         if (!game_id || winning_number === undefined) {
//             return handleError(res, 400, 'Game ID and winning number are required.');
//         }
//         const gameRepository = getRepository(Game);
//         const betRepository = getRepository(Bet);
//         const resultRepository = getRepository(Result);
//         const walletRepository = getRepository(Wallet);

//         // Find the game
//         const game = await gameRepository.findOne({
//             where: { id: game_id }
//         });
//         if (!game) {
//             return handleError(res, 404, 'Game not found.');
//         }
//         // Check if the game result is already declared today
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);  // Set the time to the start of the day
//         const alreadyDeclared = await resultRepository.findOne({
//             where: {
//                 game: { id: game_id },
//                 created_at: MoreThan(today)
//             }
//         });

//            if (alreadyDeclared) {
//                return handleError(res, 400, 'Result for this game has already been declared today.');
//            }

//         // Get all bets for the game
//         const bets = await betRepository.find({
//             where: { game: { id: game_id } },
//             relations: ["user"]
//         });
//         if (bets.length === 0) {
//             return handleError(res, 404, 'No bets found for this game.');
//         }

//         const result_calculate = await calculateWinnings(bets, winning_number_int, admin_commission_percentage_int);
//         console.log(result_calculate)
//         const results = [];

//         for (const bet of bets) {
//             const isWinning = Number(bet.choosen_number) === winning_number_int ? true : false;
//             const winningEntry = result_calculate.winnings.find(w => w.betId === bet.id);
//             const winningAmount = winningEntry ? winningEntry.winningAmount : 0;
//             const result = resultRepository.create({
//                 game,
//                 bet,
//                 user: bet.user,
//                 is_winning: isWinning,
//                 winning_amount: winningAmount
//             });
//             results.push(result);
//         }
//         await resultRepository.save(results);


//         result_calculate.winnings.forEach(async winning => {
//             const wallet = await walletRepository.findOne({
//                 where: { user: { id: winning.userId } }
//             });

//             if (wallet) {
//                 let wallet_balance = parseFloat(wallet.wallet_balance.toString());
//                 let wallet_today_earning = parseFloat(wallet.today_earning.toString());
//                 let wallet_total_earning = parseFloat(wallet.total_earning.toString());
//                 wallet_balance += winning.winningAmount;
//                 wallet_today_earning += winning.winningAmount;
//                 wallet_total_earning += winning.winningAmount;
//                 wallet.wallet_balance = wallet_balance;
//                 wallet.today_earning = wallet_today_earning;
//                 wallet.total_earning = wallet_total_earning;
//                 await walletRepository.save(wallet);
//             }
//         });
//         return handleSuccess(res, 201, 'Results declared successfully');
//     } catch (error: any) {
//         return handleError(res, 500, error.message);
//     }
// };


export const declareResults = async (req: Request, res: Response) => {
    try {
        const { game_id, winning_number, admin_commission_amount } = req.body;

        let winning_number_int = Number(winning_number);
        let admin_commission_percentage_int = Number(admin_commission_amount);

        if (!game_id || winning_number === undefined) {
            return handleError(res, 400, 'Game ID and winning number are required.');
        }

        const gameRepository = getRepository(Game);
        const betRepository = getRepository(Bet);
        const resultRepository = getRepository(Result);

        // Find the game
        const game = await gameRepository.findOne({
            where: { id: game_id }
        });
        if (!game) {
            return handleError(res, 404, 'Game not found.');
        }

        // Check if the game result is already declared today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const alreadyDeclared = await resultRepository.findOne({
            where: {
                game: { id: game_id },
                created_at: MoreThan(today)
            }
        });

        if (alreadyDeclared) {
            return handleError(res, 400, 'Result for this game has already been declared today.');
        }

        // Get all bets for the game
        const bets = await betRepository.find({
            where: { game: { id: game_id } },
            relations: ["user"]
        });
        if (bets.length === 0) {
            return handleError(res, 404, 'No bets found for this game.');
        }

        const result_calculate = await calculateWinnings(bets, winning_number_int, admin_commission_percentage_int);
        console.log(result_calculate);
        const results = [];

        for (const bet of bets) {
            const isWinning = Number(bet.choosen_number) === winning_number_int;
            const winningEntry = result_calculate.winnings.find(w => w.betId === bet.id);
            const winningAmount = winningEntry ? winningEntry.winningAmount : 0;
            const result = resultRepository.create({
                game,
                bet,
                user: bet.user,
                is_winning: isWinning,
                winning_amount: winningAmount
            });
            results.push(result);
        }
        await resultRepository.save(results);

        // Update wallets for winners
        for (const winning of result_calculate.winnings) {
            try {
                await updateWalletBalance(winning.userId, "betWin", winning.winningAmount);
                
                // Update today's earning and total earning
                const walletRepository = getRepository(Wallet);
                const wallet = await walletRepository.findOne({
                    where: { user: { id: winning.userId } }
                });
                
                if (wallet) {
                    wallet.today_earning = parseFloat(wallet.today_earning.toString()) + winning.winningAmount;
                    wallet.total_earning = parseFloat(wallet.total_earning.toString()) + winning.winningAmount;
                    await walletRepository.save(wallet);
                }
            } catch (error: any) {
                console.error(`Error updating wallet for user ${winning.userId}: ${error.message}`);
                // Consider how you want to handle errors here. You might want to log them or take other actions.
            }
        }

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

// Get Today's Results for Games
export const getTodaysResultsForGames = async (req: Request, res: Response) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { game_id } = req.params;
        if (!game_id) {
            return handleError(res, 400, 'Game ID is required.');
        }
        const resultRepository = getRepository(Result);
        const results = await resultRepository
            .createQueryBuilder('result')
            .leftJoinAndSelect('result.game', 'game')
            .leftJoinAndSelect('result.bet', 'bet')
            .leftJoinAndSelect('result.user', 'user')
            .where('result.created_at >= :today', { today })
            .where('result.gameId = :gameId', { gameId: game_id })
            .getMany();

        if (results.length === 0) {
            return handleError(res, 404, 'No results found for today.');
        }
        return handleSuccess(res, 200, 'Today\'s results retrieved successfully', results);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};
