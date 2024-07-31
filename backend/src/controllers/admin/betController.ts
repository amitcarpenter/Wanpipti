import Joi from "joi";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import moment from 'moment';
import jwt from "jsonwebtoken";
import { Bet } from '../../entities/Bet';
import { IUser } from "../../models/User";
import { User } from "../../entities/User";
import { Game } from '../../entities/Game';
import { Request, Response } from "express";
import { Result } from '../../entities/Result';
import { sendEmail } from "../../services/otpService";
import { getRepository, MoreThan, Between, In } from "typeorm";
import { handleError, handleSuccess } from "../../utils/responseHandler";


const APP_URL = process.env.APP_URL as string;
const TIMEZONE = process.env.TIMEZONE as string

// get all bets
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
        const timeZone = TIMEZONE;
        const startOfDay = moment().tz(timeZone).startOf("day").toDate();
        const endOfDay = moment().tz(timeZone).endOf("day").toDate();
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

// getbets by date
export const getBetsbyDate = async (req: Request, res: Response) => {
    try {
        const { created_at } = req.body;
        if (!created_at) {
            return handleError(res, 400, "created_at not provided");
        }

        const createdDate = new Date(created_at);
        if (isNaN(createdDate.getTime())) {
            return handleError(res, 400, 'Invalid date format');
        }

        const startOfDay = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(startOfDay.getDate() + 1);

        const betRepository = getRepository(Bet);
        const resultRepository = getRepository(Result);

        console.log(startOfDay, endOfDay);
        const bets = await betRepository.find({
            where: {
                created_at: Between(startOfDay, endOfDay)
            }
        });

        if (bets.length === 0) {
            return handleError(res, 404, "No bets found for this date");
        }

        const betIds = bets.map(bet => bet.id);
        const results = await resultRepository.find({
            where: {
                bet: In(betIds)
            },
            relations: ["bet"]
        });

        const betsWithResults = bets.map(bet => {
            const result = results.find(result => result.bet && result.bet.id === bet.id);
            console.log(result)
            return {
                ...bet,
                result: result || null
            };
        });

        return handleSuccess(res, 200, "Bets retrieved successfully", betsWithResults);
    } catch (error: any) {
        console.error('Error in getBetsbyDate:', error);
        return handleError(res, 500, error.message);
    }
};