import Joi from "joi";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import moment from 'moment';
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
    const today = moment().startOf('day').toDate();
    const tomorrow = moment().startOf('day').add(1, 'day').toDate();
    const gameRepositoryies = getRepository(Game);
    const existingGames = await gameRepositoryies.find({
      where: {
        created_at: Between(today, tomorrow)
      }
    });

    if (existingGames.length >= 3) {
      return handleError(res, 400, 'Games already exist for today');
    }


    const game_data = [
      { game_time: "2 PM", status: "active", winning_number: 25 },
      { game_time: "5 PM", status: "active", winning_number: 12 },
      { game_time: "9 PM", status: "active", winning_number: 12 },
    ];

    const gameRepository = getRepository(Game);
    const savedGames = await Promise.all(game_data.map(async (game) => {
      const newGame = gameRepository.create({
        ...req.body,
        ...game
      });
      return await gameRepository.save(newGame);
    }));

    return handleSuccess(res, 201, 'Games created successfully');
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
    return handleSuccess(res, 200, 'Game updated successfully');
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


// update game setting 
export const edit_game_details = async (req: Request, res: Response) => {
  try {
    const schema = Joi.object({
      first_game_winning_number: Joi.number().required(),
      second_game_winning_number: Joi.number().required(),
      third_game_winning_number: Joi.number().required(),
      created_at: Joi.string().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return handleError(res, 400, error.details[0].message);
    }

    const { first_game_winning_number, second_game_winning_number, third_game_winning_number, created_at } = value;
    const gameRepository = getRepository(Game);

    const createdDate = new Date(created_at);
    const startDate = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate() + 1);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);


    console.log(startDate, endDate)

    // Fetch the games based on the created_at date
    const games = await gameRepository.find({
      where: {
        created_at: Between(startDate, endDate)
      }
    });

    if (games.length !== 3) {
      return handleError(res, 404, 'Three games not found for the given created_at date');
    }

    const gameUpdates = games.map(game => {
      switch (game.game_time) {
        case '2 PM':
          game.winning_number = first_game_winning_number;
          break;
        case '5 PM':
          game.winning_number = second_game_winning_number;
          break;
        case '9 PM':
          game.winning_number = third_game_winning_number;
          break;
        default:
          break;
      }
      return game;
    });

    // Save the updated game settings
    await gameRepository.save(gameUpdates);

    return handleSuccess(res, 200, 'Game settings updated successfully', gameUpdates);
  } catch (error: any) {
    console.error('Error in edit_game_details:', error);
    return handleError(res, 500, 'An error occurred while updating the game settings');
  }
};