import Joi from "joi";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import moment from 'moment';
import jwt from "jsonwebtoken";
import { Bet } from '../../entities/Bet';
import { User } from "../../entities/User";
import { Game } from '../../entities/Game';
import { IUser } from "../../models/User";
import { Request, Response } from "express";
import { getRepository, MoreThan, Between } from "typeorm";
import { sendEmail } from "../../services/otpService";
import { handleError, handleSuccess } from "../../utils/responseHandler";


const APP_URL = process.env.APP_URL as string;


export const getBets = async (req: Request, res: Response) => {
    try {
        const betRepository = getRepository(Bet);
        const bets = await betRepository.find({ relations: ['user', 'game'] });

        if (bets.length === 0) {
            return handleError(res, 404, 'No bets found');
        }

        return handleSuccess(res, 200, 'Bets retrieved successfully', bets);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};


export const getBetsForToday = async (req: Request, res: Response) => {
    try {
        const betRepository = getRepository(Bet);
        // Get the start and end of the current day in the 'Asia/Kolkata' timezone
        const startOfDay = moment().tz("Asia/Kolkata").startOf("day").toDate();
        const endOfDay = moment().tz("Asia/Kolkata").endOf("day").toDate();

        const bets = await betRepository
            .createQueryBuilder("bet")
            .leftJoinAndSelect("bet.game", "game")
            .leftJoinAndSelect("bet.user", "user")
            .andWhere("bet.created_at BETWEEN :startDate AND :endDate", {
                startDate: startOfDay,
                endDate: endOfDay,
            })
            .getMany();

        if (bets.length === 0) {
            return handleError(res, 404, "No bets found for today");
        }

        return handleSuccess(res, 200, "Bets retrieved successfully", bets);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};
