import Joi, { number } from "joi";
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
import { GameSetting } from '../../entities/GameSetting';
import { GameBetSetting } from '../../entities/GameBetSetting';
import { getRepository, MoreThan, Between } from "typeorm";
import { sendEmail } from "../../services/otpService";
import { handleError, handleSuccess } from "../../utils/responseHandler";


const APP_URL = process.env.APP_URL as string;


// create game setting
export const createGameBetSetting = async (req: Request, res: Response) => {
    try {
        const schema = Joi.object({
            bet_number: Joi.number().min(0).max(99).required(),
            max_bet_limit: Joi.number().required(),
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return handleError(res, 400, error.details[0].message);
        }
        const { max_bet_limit, bet_number } = value;
        const gameSettingBetRepository = getRepository(GameBetSetting);
        const game_bet_setting = await gameSettingBetRepository.findOneBy({ bet_number: bet_number });
        if (game_bet_setting) {
            return handleError(res, 400, "this number already exist");
        }

        const newGameSetting = gameSettingBetRepository.create({
            max_bet_limit,
            bet_number
        });
        const savedGameBetSetting = await gameSettingBetRepository.save(newGameSetting);
        return handleSuccess(res, 201, 'Game setting created successfully', savedGameBetSetting);
    } catch (error: any) {
        console.error('Error in createGameSetting:', error);
        return handleError(res, 500, error.message);
    }
};


// get all game settings
export const getAllGameBetSettings = async (req: Request, res: Response) => {
    try {
        const gameSettingRepository = getRepository(GameBetSetting);
        const gameSettings = await gameSettingRepository.find();
        return handleSuccess(res, 200, 'Game Bet settings retrieved successfully', gameSettings);
    } catch (error: any) {
        console.error('Error in getAllGameSettings:', error);
        return handleError(res, 500, 'An error occurred while retrieving game settings');
    }
};

// update game setting 
export const updateBetGameSetting = async (req: Request, res: Response) => {
    try {
        const schema = Joi.object({
            max_bet_limit: Joi.number().required(),
            bet_number: Joi.number().required(),
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return handleError(res, 400, error.details[0].message);
        }
        const { max_bet_limit, bet_number } = value;
        const gameSettingRepository = getRepository(GameBetSetting);
        let gameSetting = await gameSettingRepository.findOneBy({ bet_number: bet_number });

        if (!gameSetting) {
            return handleError(res, 404, 'Game setting not found');
        }

        if (max_bet_limit) {
            gameSetting.max_bet_limit = max_bet_limit;
        }
        const updatedGameSetting = await gameSettingRepository.save(gameSetting);
        return handleSuccess(res, 200, 'Game Bet setting updated successfully', updatedGameSetting);
    } catch (error: any) {
        console.error('Error in updateGameSetting:', error);
        return handleError(res, 500, 'An error occurred while updating the game setting');
    }
};

// Delete Game Bet Limit by ID
export const delete_game_limit = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return handleError(res, 400, 'Invalid ID');
        }
        const gameSettingRepository = getRepository(GameBetSetting);
        const gameBetLimitDelete = await gameSettingRepository.findOneBy({ id });
        if (!gameBetLimitDelete) {
            return handleError(res, 404, 'Bet Limit not found');
        }
        await gameSettingRepository.delete(id);
        return handleSuccess(res, 200, 'Bet Limit deleted successfully');
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};
