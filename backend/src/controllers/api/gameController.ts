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
import { getRepository, MoreThan, Between, In } from "typeorm";
import { handleError, handleSuccess } from "../../utils/responseHandler";

const TIMEZONE = process.env.TIMEZONE as string
console.log(TIMEZONE)


// Get today's games and results for a specific user
// export const getUserTodayGameResults = async (req: Request, res: Response) => {
//   try {
//     const user_req = req.user as IUser;
//     const userRepository = getRepository(User);
//     const user = await userRepository.findOneBy({ id: user_req.id });

//     if (!user) {
//       return handleError(res, 400, 'User not found.');
//     }

//     // Use the desired timezone
//     const timeZone = TIMEZONE;
//     const todayLocal = moment.tz(timeZone).startOf('day');
//     const tomorrowLocal = moment.tz(timeZone).endOf('day');

//     // Convert local start and end times to UTC
//     const todayUTC = todayLocal.clone().utc().toDate();
//     const tomorrowUTC = tomorrowLocal.clone().utc().toDate();

//     console.log(`Today UTC: ${todayUTC}`);
//     console.log(`Tomorrow UTC: ${tomorrowUTC}`);

//     const gameRepository = getRepository(Game);
//     const games = await gameRepository.find({
//       where: {
//         created_at: Between(todayUTC, tomorrowUTC)
//       },
//       // order: {
//       //   created_at: 'DESC'
//       // }
//     });

//     if (games.length === 0) {
//       return handleError(res, 400, 'No games found for today.');
//     }

//     const resultRepository = getRepository(Result);
//     const results = await resultRepository.find({
//       where: {
//         user: { id: user.id },
//         game: { created_at: Between(todayUTC, tomorrowUTC) }
//       },
//       relations: ['game', 'bet'],
//       order: { created_at: 'DESC' }
//     });

//     const gamesWithResults = games.map(game => {
//       const gameResults = results.filter(result => result.game.id === game.id);
//       return {
//         game,
//         results: gameResults.map(result => ({
//           bet: result.bet,
//           is_winning: result.is_winning,
//           winning_amount: result.winning_amount,
//           created_at: result.created_at
//         }))
//       };
//     });

//     return handleSuccess(res, 200, "User's game results for today fetched successfully", gamesWithResults);
//   } catch (error: any) {
//     return handleError(res, 500, error.message);
//   }
// };



// export const getUserTodayGameResults = async (req: Request, res: Response) => {
//   try {
//     console.log("@@@@@@@@@@@@@@");
//     const user_req = req.user as IUser;
//     const userRepository = getRepository(User);
//     const user = await userRepository.findOneBy({ id: user_req.id });

//     if (!user) {
//       return handleError(res, 400, 'User not found.');
//     }

//     // Use the desired timezone
//     const timeZone = TIMEZONE;
//     const todayLocal = moment.tz(timeZone).startOf('day');
//     const tomorrowLocal = moment.tz(timeZone).endOf('day');

//     // Convert local start and end times to UTC
//     const todayUTC = todayLocal.clone().utc().toDate();
//     const tomorrowUTC = tomorrowLocal.clone().utc().toDate();

//     const gameRepository = getRepository(Game);
//     const games = await gameRepository.find({
//       where: {
//         created_at: Between(todayUTC, tomorrowUTC)
//       },
//     });

//     if (games.length === 0) {
//       return handleError(res, 400, 'No games found for today.');
//     }

//     // Extract game IDs
//     const gameIds = games.map(game => game.id);

//     // Fetch bets related to these games
//     const betRepository = getRepository(Bet);
//     const bets = await betRepository.find({
//       where: {
//         game: { id: In(gameIds) },
//         created_at: Between(todayUTC, tomorrowUTC)
//       },
//       relations: ['game'],
//     });

//     // Map to store chosen numbers for each game
//     const gameChosenNumbersMap: { [key: number]: string[] } = {};

//     bets.forEach(bet => {
//       const gameId = bet.game.id;
//       const chosenNumber = bet.choosen_number;

//       if (!gameChosenNumbersMap[gameId]) {
//         gameChosenNumbersMap[gameId] = [];
//       }
//       gameChosenNumbersMap[gameId].push(chosenNumber);
//     });

//     const resultRepository = getRepository(Result);
//     const results = await resultRepository.find({
//       where: {
//         user: { id: user.id },
//         game: { created_at: Between(todayUTC, tomorrowUTC) }
//       },
//       relations: ['game', 'bet'],
//       order: { created_at: 'DESC' }
//     });

//     const gamesWithResults = games.map(game => {
//       const gameResults = results.filter(result => result.game.id === game.id);
//       return {
//         game,
//         choosen_numbers: gameChosenNumbersMap[game.id] || [],
//         results: gameResults.map(result => ({
//           bet: result.bet,
//           is_winning: result.is_winning,
//           winning_amount: result.winning_amount,
//           created_at: result.created_at
//         }))
//       };
//     });

//     return handleSuccess(res, 200, "User's game results for today fetched successfully", gamesWithResults);
//   } catch (error: any) {
//     return handleError(res, 500, error.message)
//   }
// };


export const getUserTodayGameResults = async (req: Request, res: Response) => {
  try {
    console.log("@@@@@@@@@@@@@@");
    const user_req = req.user as IUser;
    const userRepository = getRepository(User);
    const user = await userRepository.findOneBy({ id: user_req.id });

    if (!user) {
      return handleError(res, 400, 'User not found.');
    }

    // Use the desired timezone
    const timeZone = TIMEZONE;
    const todayLocal = moment.tz(timeZone).startOf('day');
    const tomorrowLocal = moment.tz(timeZone).endOf('day');

    // Convert local start and end times to UTC
    const todayUTC = todayLocal.clone().utc().toDate();
    const tomorrowUTC = tomorrowLocal.clone().utc().toDate();

    const gameRepository = getRepository(Game);
    const games = await gameRepository.find({
      where: {
        created_at: Between(todayUTC, tomorrowUTC)
      },
    });

    if (games.length === 0) {
      return handleError(res, 400, 'No games found for today.');
    }

    // Extract game IDs
    const gameIds = games.map(game => game.id);

    // Fetch bets related to these games and by this user
    const betRepository = getRepository(Bet);
    const bets = await betRepository.find({
      where: {
        game: { id: In(gameIds) },
        user: { id: user.id }, // Ensure bets are only for the logged-in user
        created_at: Between(todayUTC, tomorrowUTC)
      },
      relations: ['game'],
    });

    // Map to store chosen numbers for each game
    const gameChosenNumbersMap: { [key: number]: string[] } = {};

    bets.forEach(bet => {
      const gameId = bet.game.id;
      const chosenNumber = bet.choosen_number;

      if (!gameChosenNumbersMap[gameId]) {
        gameChosenNumbersMap[gameId] = [];
      }
      gameChosenNumbersMap[gameId].push(chosenNumber);
    });

    const resultRepository = getRepository(Result);
    const results = await resultRepository.find({
      where: {
        user: { id: user.id },
        game: { created_at: Between(todayUTC, tomorrowUTC) }
      },
      relations: ['game', 'bet'],
      order: { created_at: 'DESC' }
    });

    const gamesWithResults = games.map(game => {
      const gameResults = results.filter(result => result.game.id === game.id);
      return {
        game,
        choosen_number: gameChosenNumbersMap[game.id] || [],
        results: gameResults.map(result => ({
          bet: result.bet,
          is_winning: result.is_winning,
          winning_amount: result.winning_amount,
          created_at: result.created_at
        }))
      };
    });

    return handleSuccess(res, 200, "User's game results for today fetched successfully", gamesWithResults);
  } catch (error: any) {
    return handleError(res, 500, error.message);
  }
};
