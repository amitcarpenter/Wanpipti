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
import { GameSetting } from '../../entities/GameSetting';
import { IUser } from "../../models/User";
import { Request, Response } from "express";
import { getRepository, MoreThan, Between } from "typeorm";
import { sendEmail } from "../../services/otpService";
import { handleError, handleSuccess } from "../../utils/responseHandler";


const APP_URL = process.env.APP_URL as string;


// create game setting
export const createGameSetting = async (req: Request, res: Response) => {
    try {
        const schema = Joi.object({
            max_bet_limit: Joi.number().required(),
            game_id: Joi.number().required()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return handleError(res, 400, error.details[0].message);
        }

        const { max_bet_limit, game_id } = value;

        const gameRepository = getRepository(Game);
        const gameSettingRepository = getRepository(GameSetting);
        const game = await gameRepository.findOne({ where: { id: game_id } });
        const game_setting = await gameSettingRepository.findOne({ where: { game_id: game_id } });
        if (!game) {
            return handleError(res, 400, 'Game not found');
        }

        if (game_setting?.game_id == game_id) {
            return handleError(res, 400, 'Game Setting already exist');
        }

        const newGameSetting = gameSettingRepository.create({
            max_bet_limit,
            game_id
        });

        const savedGameSetting = await gameSettingRepository.save(newGameSetting);
        return handleSuccess(res, 201, 'Game setting created successfully', savedGameSetting);
    } catch (error: any) {
        console.error('Error in createGameSetting:', error);
        return handleError(res, 500, error.message);
    }
};

// Get game setting for today games
// export const getAllGameSettingsForToday = async (req: Request, res: Response) => {
//     try {
//         // Set the start of today and start of tomorrow
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);
//         const tomorrow = new Date(today);
//         tomorrow.setDate(tomorrow.getDate() + 1);

//         const gameSettingRepository = getRepository(GameSetting);
//         const gameSettings = await gameSettingRepository.find({
//             relations: ['game'],
//             where: {
//                 created_at: Between(today, tomorrow)
//             },
//             order: {
//                 created_at: 'DESC'
//             }
//         });

//         return handleSuccess(res, 200, 'Game settings for today retrieved successfully', gameSettings);
//     } catch (error: any) {
//         console.error('Error in getAllGameSettingsForToday:', error);
//         return handleError(res, 500, 'An error occurred while retrieving game settings for today');
//     }
// };


export const getAllGameSettingsForToday = async (req: Request, res: Response) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const gameSettingRepository = getRepository(GameSetting);
        const gameSettings = await gameSettingRepository
            .createQueryBuilder('gameSetting')
            .leftJoinAndSelect('Game', 'game', 'game.id = gameSetting.game_id')
            .where('gameSetting.created_at BETWEEN :today AND :tomorrow', { today, tomorrow })
            .orderBy('gameSetting.created_at', 'DESC')
            .getMany();

        // Transform the result to include game data
        const transformedGameSettings = gameSettings.map(gameSetting => ({
            ...gameSetting,
            game: (gameSetting as any).game_id // TypeScript might complain about this, but it should work
        }));

        return handleSuccess(res, 200, 'Game settings for today retrieved successfully', transformedGameSettings);
    } catch (error: any) {
        console.error('Error in getAllGameSettingsForToday:', error);
        return handleError(res, 500, 'An error occurred while retrieving game settings for today');
    }
};

// get all game settings
export const getAllGameSettings = async (req: Request, res: Response) => {
    try {
        const gameSettingRepository = getRepository(GameSetting);
        const gameSettings = await gameSettingRepository.find();
        return handleSuccess(res, 200, 'Game settings retrieved successfully', gameSettings);
    } catch (error: any) {
        console.error('Error in getAllGameSettings:', error);
        return handleError(res, 500, 'An error occurred while retrieving game settings');
    }
};


// update game setting 
export const updateGameSetting = async (req: Request, res: Response) => {
    try {
        console.log(req.body)
        const schema = Joi.object({
            max_bet_limit: Joi.number().required(),
            game_id: Joi.number().required(),
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return handleError(res, 400, error.details[0].message);
        }
        const { max_bet_limit, game_id } = value;
        let game_id_interger = parseInt(game_id)
        const gameSettingRepository = getRepository(GameSetting);
        let gameSetting = await gameSettingRepository.findOneBy({ game_id: game_id_interger });

        if (!gameSetting) {
            return handleError(res, 400, 'Game setting not found');
        }

        if (game_id) {
            const gameRepository = getRepository(Game);
            const game = await gameRepository.findOneBy({ id: game_id });

            if (!game) {
                return handleError(res, 400, 'Game not found');
            }

            gameSetting.game_id = game_id;
        }

        if (max_bet_limit) {
            gameSetting.max_bet_limit = max_bet_limit;
        }

        const updatedGameSetting = await gameSettingRepository.save(gameSetting);
        return handleSuccess(res, 200, 'Game setting updated successfully', updatedGameSetting);
    } catch (error: any) {
        console.error('Error in updateGameSetting:', error);
        return handleError(res, 500, 'An error occurred while updating the game setting');
    }
};



