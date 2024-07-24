import Joi from "joi";
import ejs from 'ejs';
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
import { getRepository, MoreThan, Between } from "typeorm";
import { updateWalletBalance } from "./walletTransactionController"
import { handleError, handleSuccess } from "../../utils/responseHandler";

const APP_URL = process.env.APP_URL as string;

// Place Bet
export const placeBet = async (req: Request, res: Response) => {
    try {
        const createBetSchema = Joi.object({
            game_id: Joi.number().integer().required(),
            choosen_number: Joi.number().min(0).max(99).required(),
            bet_amount: Joi.number().min(1).required(),
        });
        const { error, value } = createBetSchema.validate(req.body);
        if (error) {
            return handleError(res, 400, error.details[0].message);
        }
        const { game_id, choosen_number, bet_amount } = value;
        const user_req = req.user as IUser;
        const userRepository = getRepository(User);
        const user = await userRepository.findOneBy({ id: user_req.id });
        const gameRepository = getRepository(Game);
        const betRepository = getRepository(Bet);
        const gameSettingRepository = getRepository(GameSetting);
        const walletRepository = getRepository(Wallet);


        if (!user) {
            return handleError(res, 404, "User Not Found");
        }

        const game = await gameRepository.findOne({
            where: { id: game_id },
            select: ["id", "game_time", "created_at"],
        });

        const game_setting = await gameSettingRepository.findOne({
            where: { id: game_id },
        });

        const all_bets = await betRepository.find();

        let max_bet_limit = game_setting?.max_bet_limit
        console.log(max_bet_limit)

        if (Number(max_bet_limit) < all_bets.length) {
            return handleError(res, 400, `Maximum bet limit exceeded. No more bets can be placed for this game.`);
        }

        if (!game) {
            return handleError(res, 404, "Game not found");
        }

        // Check if the game is for the current date
        const currentDate = new Date();
        const gameDate = new Date(game.created_at);
        if (gameDate.toDateString() !== currentDate.toDateString()) {
            return handleError(
                res,
                400,
                "Bets are only allowed for games on the current date"
            );
        }

        const gameTime = moment(game.game_time, "h:mm A").tz('Asia/Kolkata');
        const currentTime = moment().tz('Asia/Kolkata');
        gameTime.year(currentTime.year());
        gameTime.month(currentTime.month());
        gameTime.date(currentTime.date());

        // Check if current time is after game time
        if (currentTime.isAfter(gameTime)) {
            return handleError(
                res,
                400,
                "Betting is closed for this game as it has already started or ended"
            );
        }



        const timeDifference = gameTime.diff(currentTime, 'minutes');
        if (timeDifference < 10) {
            return handleError(
                res,
                400,
                "Bets are closed 10 minutes before the game starts"
            );
        }



        // Check if user has already placed a bet for this game
        const existingBet = await betRepository.findOne({
            where: {
                user: { id: user.id },
                game: { id: game_id }
            }
        });

        if (existingBet) {
            return handleError(
                res,
                400,
                "You have already placed a bet for this game"
            );
        }


        const walletDetails = await walletRepository.findOne({
            where: {
                user: { id: user.id },
            },
            relations: ['user']
        });
        console.log(walletDetails)

        if (!walletDetails) {
            return handleError(res, 404, 'Wallet not found.');
        }

        // Check wallet balance 
        if (walletDetails.wallet_balance < bet_amount) {
            return handleError(res, 400, "Wallet amount is not sufficient");
        }

        const newBet = betRepository.create({
            user,
            game,
            choosen_number,
            bet_amount,
        });
        const savedBet = await betRepository.save(newBet);


        // // Deduct the bet amount from the wallet balance
        // walletDetails.wallet_balance -= bet_amount;
        // await walletRepository.save(walletDetails);

        // Update wallet balance using the new function
        try {
            await updateWalletBalance(user.id, "betPlace", bet_amount);
        } catch (error: any) {
            return handleError(res, 404, error.message);
        }

        let email = user?.email
        const emailTemplatePath = path.resolve(__dirname, '../../views/betConfirmation.ejs');
        const emailHtml = await ejs.renderFile(emailTemplatePath);
        const emailOptions = {
            to: email,
            subject: "Bet Confirmed",
            html: emailHtml,


        };
        await sendEmail(emailOptions);

        return handleSuccess(res, 201, "Bet placed successfully", savedBet);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};

// Get Today placed bets
export const getUserBetsForToday = async (req: Request, res: Response) => {
    try {
        const betRepository = getRepository(Bet);
        const user_req = req.user as IUser;
        const userRepository = getRepository(User);
        const user = await userRepository.findOneBy({ id: user_req.id });

        if (!user) {
            return handleError(res, 404, "User Not Found");
        }

        // Get the start and end of the current day in the 'Asia/Kolkata' timezone
        const startOfDay = moment().tz("Asia/Kolkata").startOf("day").toDate();
        const endOfDay = moment().tz("Asia/Kolkata").endOf("day").toDate();

        const bets = await betRepository
            .createQueryBuilder("bet")
            .leftJoinAndSelect("bet.game", "game")
            .where("bet.userId = :userId", { userId: user.id })
            .andWhere("bet.created_at BETWEEN :startDate AND :endDate", {
                startDate: startOfDay,
                endDate: endOfDay,
            })
            .getMany();

        if (bets.length === 0) {
            return handleError(res, 404, "No bets found for today");
        }

        return handleSuccess(res, 200, "Today Bets retrieved successfully", bets);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};


