import Joi from "joi";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { IUser } from "../../models/User";
import { User } from "../../entities/User";
import { Game } from '../../entities/Game';
import { Request, Response } from "express";
import { getRepository, MoreThan, Between } from "typeorm";
import { sendEmail } from "../../services/otpService";
import { handleError, handleSuccess } from "../../utils/responseHandler";

dotenv.config();

const APP_URL = process.env.APP_URL as string;

// Create Game
export const createGame = async (req: Request, res: Response) => {
  try {
    const game_data = [
      { game_time: "2 PM", status: "scheduled", winning_number: 12 },
      { game_time: "5 PM", status: "scheduled", winning_number: 12 },
      { game_time: "9 PM", status: "scheduled", winning_number: 12 },
    ];

    const gameRepository = getRepository(Game);
    const savedGames = await Promise.all(game_data.map(async (game) => {
      const newGame = gameRepository.create({
        ...req.body,
        ...game
      });
      return await gameRepository.save(newGame);
    }));

    return handleSuccess(res, 201, 'Games created successfully', savedGames);
  } catch (error: any) {
    return handleError(res, 500, error.message);
  }
};

// get all games
export const getGames = async (req: Request, res: Response) => {
  try {
    const gameRepository = getRepository(Game);
    const games = await gameRepository.find({
      order: {
        created_at: 'DESC'
      }
    });
    return handleSuccess(res, 200, 'Games fetched successfully', games);
  } catch (error: any) {
    return handleError(res, 500, error.message);
  }
};


// get today games
export const getTodayGames = async (req: Request, res: Response) => {
  try {
    const gameRepository = getRepository(Game);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const games = await gameRepository.find({
      where: {
        created_at: Between(today, tomorrow)
      },
      order: {
        created_at: 'DESC'
      }
    });

    return handleSuccess(res, 200, 'Today\'s games fetched successfully', games);
  } catch (error: any) {
    return handleError(res, 500, error.message);
  }
};


export const updateGame = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const gameRepository = getRepository(Game);
    const updatedGame = await gameRepository.findOneBy({ id });
    if (!updatedGame) {
      return handleError(res, 404, 'Game not found');
    }
    if (req.body.winning_number > 99 || req.body.winning_number < 0) {
      return handleError(res, 400, 'Number should be between in 00-99');
    }
    await gameRepository.update(id, req.body);
    const update_game = await gameRepository.findOneBy({ id });
    return handleSuccess(res, 200, 'Game updated successfully', update_game);
  } catch (error: any) {
    return handleError(res, 500, error.message);
  }
};

// Delete Game by id
export const deleteGame = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const gameRepository = getRepository(Game);
    const gameToDelete = await gameRepository.findOneBy({ id });
    if (!gameToDelete) {
      return handleError(res, 404, 'Game not found');
    }
    await gameRepository.delete(id);
    return handleSuccess(res, 200, 'Game deleted successfully');
  } catch (error: any) {
    return handleError(res, 500, error.message);
  }
};


console.log()