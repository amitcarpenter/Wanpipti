import Joi from "joi";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import moment from "moment-timezone";
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

const TIMEZONE = process.env.TIMEZONE as string



// Get Today's Results for a Specific User
// export const getTodaysResultsForUser = async (req: Request, res: Response) => {
//     try {

//         const user_req = req.user as IUser;
//         const timeZone = TIMEZONE; 
//         const todayLocal = moment.tz(timeZone).startOf('day');
//         const todayUTC = todayLocal.clone().utc().toDate();


//     console.log(`Today UTC: ${todayUTC}`);

//         const resultRepository = getRepository(Result);
//         const results = await resultRepository
//             .createQueryBuilder('result')
//             .leftJoinAndSelect('result.game', 'game')
//             .leftJoinAndSelect('result.bet', 'bet')
//             .leftJoinAndSelect('result.user', 'user')
//             .where('result.user.id = :userId', { userId: user_req.id })
//             .andWhere('result.created_at >= :today', { todayUTC })
//             .getMany();

//         if (results.length === 0) {
//             return handleError(res, 400, 'No results found for the user today.');
//         }
//         return handleSuccess(res, 200, 'Today\'s results for the user retrieved successfully', results);
//     } catch (error: any) {
//         return handleError(res, 500, error.message);
//     }
// };


// Get Today's Results for a Specific User
export const getTodaysResultsForUser = async (req: Request, res: Response) => {
    try {
        const user_req = req.user as IUser;
        const timeZone = TIMEZONE; 
        const todayLocal = moment.tz(timeZone).startOf('day');
        const todayUTC = todayLocal.clone().utc().toDate();

        console.log(`Today Local: ${todayLocal.format()}`);
        console.log(`Today UTC: ${todayUTC}`);

        const resultRepository = getRepository(Result);
        const results = await resultRepository
            .createQueryBuilder('result')
            .leftJoinAndSelect('result.game', 'game')
            .leftJoinAndSelect('result.bet', 'bet')
            .leftJoinAndSelect('result.user', 'user')
            .where('result.user.id = :userId', { userId: user_req.id })
            .andWhere('result.created_at >= :todayUTC', { todayUTC })
            .getMany();

        if (results.length === 0) {
            return handleError(res, 400, 'No results found for the user today.');
        }

        return handleSuccess(res, 200, "Today's results for the user retrieved successfully", results);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};


// Get Today's Results for a Specific User
export const getAllResultsForUser = async (req: Request, res: Response) => {
    try {
        const user_req = req.user as IUser;
        const resultRepository = getRepository(Result);
        const results = await resultRepository
            .createQueryBuilder('result')
            .leftJoinAndSelect('result.game', 'game')
            .leftJoinAndSelect('result.bet', 'bet')
            .leftJoinAndSelect('result.user', 'user')
            .where('result.user.id = :userId', { userId: user_req.id })
            .getMany();

        if (results.length === 0) {
            return handleError(res, 404, 'No results found for the user');
        }

        return handleSuccess(res, 200, 'Total results for the user retrieved successfully', results);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};
