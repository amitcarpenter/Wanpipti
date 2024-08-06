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
// const calculateWinnings = async (bets: Bet[], winningNumber: number, adminCommissionPercentage: number) => {
//     const winningBets = bets.filter((bet) => {
//         let bet_choosen_number = Number(bet.choosen_number);
//         return bet_choosen_number === winningNumber;
//     });

//     if (winningBets.length === 0) {
//         return {
//             totalAmount: 0,
//             adminCommission: 0,
//             distributableAmount: 0,
//             winnings: [],
//         };
//     }

//     // Calculate total bet amount
//     const totalBetAmount = bets.reduce((acc, bet) => Number(acc) + Number(bet.bet_amount), 0);

//     // Calculate admin commission based on percentage
//     const adminCommissionAmount = (Number(adminCommissionPercentage) / 100) * totalBetAmount;

//     // Calculate distributable amount
//     const distributableAmount = totalBetAmount - adminCommissionAmount;

//     // Calculate total winning bet amount
//     const totalWinningBetAmount = winningBets.reduce((acc, bet) => Number(acc) + Number(bet.bet_amount), 0);
//     console.log(totalWinningBetAmount)
//     console.log("asdfa")

//     // Calculate winnings for each winning bet
//     const winnings = winningBets.map(bet => {
//         const winningAmount = (Number(bet.bet_amount) / Number(totalWinningBetAmount)) * Number(distributableAmount);
//         console.log(Number(bet.bet_amount))
//         console.log(Number(totalWinningBetAmount))
//         console.log(winningAmount)
//         return {
//             userId: bet.user.id,
//             betId: bet.id,
//             winningAmount: winningAmount,
//         };
//     });

//     return {
//         totalAmount: totalBetAmount,
//         adminCommission: adminCommissionAmount,
//         distributableAmount: distributableAmount,
//         winnings: winnings,
//     };
// };

// Declare Results
// export const declareResults = async (req: Request, res: Response) => {
//     try {
//         const { game_id, winning_number, admin_commission_percentage } = req.body;
//         let winning_number_int = Number(winning_number);
//         let admin_commission_percentage_int = Number(admin_commission_percentage);
//         if (!game_id || winning_number === undefined) {
//             return handleError(res, 400, 'Game ID and winning number are required.');
//         }
//         const userRepository = getRepository(User);
//         const gameRepository = getRepository(Game);
//         const betRepository = getRepository(Bet);
//         const resultRepository = getRepository(Result);
//         const game = await gameRepository.findOne({
//             where: { id: game_id }
//         });
//         if (!game) {
//             return handleError(res, 400, 'Game not found.');
//         }
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);
//         const alreadyDeclared = await resultRepository.findOne({
//             where: {
//                 game: { id: game_id },
//                 created_at: MoreThan(today)
//             }
//         });

//         if (alreadyDeclared) {
//             return handleError(res, 400, 'Result for this game has already been declared today.');
//         }

//         const bets = await betRepository.find({
//             where: { game: { id: game_id } },
//             relations: ["user"]
//         });

//         console.log(bets)
//         console.log("bets.length")
//         if (bets.length === 1) {
//             return handleError(res, 400, '1 bet found for this game. can not declare result');
//         }

//         const result_calculate = await calculateWinnings(bets, winning_number_int, admin_commission_percentage_int);
//         console.log(result_calculate);
//         const results = [];

//         for (const bet of bets) {
//             const isWinning = Number(bet.choosen_number) === winning_number_int;
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

//         // Update wallets for winners
//         for (const winning of result_calculate.winnings) {
//             try {
//                 const user_find = await userRepository.findOneBy({ id: winning.userId });
//                 await updateWalletBalance(user_find, "betWin", winning.winningAmount);
//                 const walletRepository = getRepository(Wallet);
//                 const wallet = await walletRepository.findOne({
//                     where: { user: { id: winning.userId } }
//                 });
//                 if (wallet) {
//                     wallet.today_earning = parseFloat(wallet.today_earning.toString()) + winning.winningAmount;
//                     wallet.total_earning = parseFloat(wallet.total_earning.toString()) + winning.winningAmount;
//                     await walletRepository.save(wallet);
//                 }
//             } catch (error: any) {
//                 console.error(`Error updating wallet for user ${winning.userId}: ${error.message}`);
//                 // Consider how you want to handle errors here. You might want to log them or take other actions.
//             }
//         }

//         return handleSuccess(res, 201, 'Results declared successfully');
//     } catch (error: any) {
//         return handleError(res, 500, error.message);
//     }
// };

// Get Results for a Game
// export const getResultsForGame = async (req: Request, res: Response) => {
//     try {
//         const { game_id } = req.params;
//         if (!game_id) {
//             return handleError(res, 400, 'Game ID is required.');
//         }
//         const resultRepository = getRepository(Result);
//         // Fetch results for the specified game
//         const results = await resultRepository
//             .createQueryBuilder('result')
//             .leftJoinAndSelect('result.game', 'game')
//             .leftJoinAndSelect('result.bet', 'bet')
//             .leftJoinAndSelect('result.user', 'user')
//             .where('result.gameId = :gameId', { gameId: game_id })
//             .getMany();

//         if (results.length === 0) {
//             return handleError(res, 400, 'No results found for this game.');
//         }

//         return handleSuccess(res, 200, 'Results retrieved successfully', results);
//     } catch (error: any) {
//         return handleError(res, 500, error.message);
//     }
// };

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
            return handleError(res, 400, 'No results found for today.');
        }
        return handleSuccess(res, 200, 'Today\'s results retrieved successfully', results);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};




//==================================== New Logic =====================================
const calculateWinnings = async (bets: Bet[], winningNumber: number, adminCommissionPercentage: number, maxBetLimits: Record<number, number>) => {
    const winningBets = bets.filter(bet => Number(bet.choosen_number) === winningNumber);

    if (winningBets.length === 0) {
        return {
            totalAmount: 0,
            adminCommission: 0,
            distributableAmount: 0,
            winnings: [],
        };
    }
    const totalBetAmount = bets.reduce((acc, bet) => Number(acc) + Number(bet.bet_amount), 0);
    const adminCommissionAmount = (Number(adminCommissionPercentage) / 100) * totalBetAmount;
    const distributableAmount = totalBetAmount - adminCommissionAmount;

    // Calculate total winning bet amount (considering max bet limit)
    const totalWinningBetAmount = winningBets.reduce((acc, bet) => {
        const maxBetLimit = maxBetLimits[winningNumber] || Number.MAX_SAFE_INTEGER;
        const adjustedBetAmount = Math.min(Number(bet.bet_amount), maxBetLimit);
        return Number(acc) + adjustedBetAmount;
    }, 0);

    // Calculate winnings for each winning bet
    const winnings = winningBets.map(bet => {
        const maxBetLimit = maxBetLimits[winningNumber] || Number.MAX_SAFE_INTEGER;
        const adjustedBetAmount = Math.min(Number(bet.bet_amount), maxBetLimit);
        const winningAmount = (adjustedBetAmount / totalWinningBetAmount) * distributableAmount;
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


export const declareResults = async (req: Request, res: Response) => {
    try {
        const { game_id, winning_number, admin_commission_percentage, max_bet_limits } = req.body;
        let winning_number_int = Number(winning_number);
        let admin_commission_percentage_int = Number(admin_commission_percentage);

        if (!game_id || winning_number === undefined) {
            return handleError(res, 400, 'Game ID and winning number are required.');
        }

        const userRepository = getRepository(User);
        const gameRepository = getRepository(Game);
        const betRepository = getRepository(Bet);
        const resultRepository = getRepository(Result);

        const game = await gameRepository.findOne({ where: { id: game_id } });
        if (!game) {
            return handleError(res, 400, 'Game not found.');
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const alreadyDeclared = await resultRepository.findOne({
            where: { game: { id: game_id }, created_at: MoreThan(today) }
        });

        if (alreadyDeclared) {
            return handleError(res, 400, 'Result for this game has already been declared today.');
        }

        const bets = await betRepository.find({
            where: { game: { id: game_id } },
            relations: ["user"]
        });

        if (bets.length === 0) {
            return handleError(res, 400, 'No bets found for this game.');
        }
        const result_calculate = await calculateWinnings(bets, winning_number_int, admin_commission_percentage_int, max_bet_limits);

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
        for (const winning of result_calculate.winnings) {
            try {
                const user_find = await userRepository.findOneBy({ id: winning.userId });
                await updateWalletBalance(user_find, "betWin", winning.winningAmount);
                const walletRepository = getRepository(Wallet);
                const wallet = await walletRepository.findOne({ where: { user: { id: winning.userId } } });
                if (wallet) {
                    wallet.today_earning = parseFloat(wallet.today_earning.toString()) + winning.winningAmount;
                    wallet.total_earning = parseFloat(wallet.total_earning.toString()) + winning.winningAmount;
                    await walletRepository.save(wallet);
                }
            } catch (error: any) {
                console.error(`Error updating wallet for user ${winning.userId}: ${error.message}`);
            }
        }

        return handleSuccess(res, 201, 'Results declared successfully');
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};



