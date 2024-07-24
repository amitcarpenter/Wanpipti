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
dotenv.config();



// Get Today's Results for a Specific User
export const getTodaysResultsForUser = async (req: Request, res: Response) => {
    try {

        const user_req = req.user as IUser;

        // Get today's date and set time to start of the day
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const resultRepository = getRepository(Result);

        // Fetch results for the specified user declared today
        const results = await resultRepository
            .createQueryBuilder('result')
            .leftJoinAndSelect('result.game', 'game')
            .leftJoinAndSelect('result.bet', 'bet')
            .leftJoinAndSelect('result.user', 'user')
            .where('result.user.id = :userId', { userId: user_req.id })
            .andWhere('result.created_at >= :today', { today })
            .getMany();

        if (results.length === 0) {
            return handleError(res, 404, 'No results found for the user today.');
        }

        return handleSuccess(res, 200, 'Today\'s results for the user retrieved successfully', results);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};


// Get Today's Results for a Specific User
export const getAllResultsForUser = async (req: Request, res: Response) => {
    try {

        const user_req = req.user as IUser;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const resultRepository = getRepository(Result);
        const results = await resultRepository
            .createQueryBuilder('result')
            .leftJoinAndSelect('result.game', 'game')
            .leftJoinAndSelect('result.bet', 'bet')
            .leftJoinAndSelect('result.user', 'user')
            .where('result.user.id = :userId', { userId: user_req.id })
            .getMany();

        if (results.length === 0) {
            return handleError(res, 404, 'No results found for the user today.');
        }

        return handleSuccess(res, 200, 'Today\'s results for the user retrieved successfully', results);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};
