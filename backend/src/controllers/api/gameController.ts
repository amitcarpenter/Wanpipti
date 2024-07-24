import Joi from "joi";
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
import { Result } from "../../entities/Result";
import { Request, Response } from "express";
import { sendEmail } from "../../services/otpService";
import { GameSetting } from "../../entities/GameSetting";
import { getRepository, MoreThan, Between } from "typeorm";
import { handleError, handleSuccess } from "../../utils/responseHandler";



// Get today's games and results for a specific user
export const getUserTodayGameResults = async (req: Request, res: Response) => {
    try {
      const user_req = req.user as IUser;
      const userRepository = getRepository(User);
      const user = await userRepository.findOneBy({ id: user_req.id });
  
      if (!user) {
        return handleError(res, 404, 'User not found.');
      }
  
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
  
      const gameRepository = getRepository(Game);
      const games = await gameRepository.find({
        where: {
          created_at: Between(today, tomorrow)
        },
        order: {
          created_at: 'DESC'
        }
      });
  
      if (games.length === 0) {
        return handleError(res, 404, 'No games found for today.');
      }
  
      const resultRepository = getRepository(Result);
      const results = await resultRepository.find({
        where: {
          user: { id: user.id },
          game: { created_at: Between(today, tomorrow) }
        },
        relations: ['game', 'bet'],
        order: { created_at: 'DESC' }
      });
  
      const gamesWithResults = games.map(game => {
        const gameResults = results.filter(result => result.game.id === game.id);
        return {
          game,
          results: gameResults.map(result => ({
            bet: result.bet,
            is_winning: result.is_winning,
            winning_amount: result.winning_amount,
            created_at: result.created_at
          }))
        };
      });
  
      return handleSuccess(res, 200, 'User\'s game results for today fetched successfully', gamesWithResults);
    } catch (error: any) {
      return handleError(res, 500, error.message);
    }
  };