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
import { GameBetSetting } from "../../entities/GameBetSetting";
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
    const user_req = req.user as IUser;
    const userRepository = getRepository(User);
    const user = await userRepository.findOneBy({ id: user_req.id });

    if (!user) {
      return handleError(res, 400, 'User not found.');
    }
    const timeZone = TIMEZONE;
    const todayLocal = moment.tz(timeZone).startOf('day');
    const tomorrowLocal = moment.tz(timeZone).endOf('day');
    const todayUTC = todayLocal.clone().utc().toDate();
    const tomorrowUTC = tomorrowLocal.clone().utc().toDate();
    const currentDate = moment().tz(TIMEZONE).startOf('day').toDate();
    const gameRepository = getRepository(Game);
    const games = await gameRepository.find({
      where: {
        created_at: currentDate
      },
    });

    if (games.length === 0) {
      return handleError(res, 400, 'No games found for today.');
    }
    const gameIds = games.map(game => game.id);
    const betRepository = getRepository(Bet);
    const bets = await betRepository.find({
      where: {
        game: { id: In(gameIds) },
        user: { id: user.id },
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


export const get_bet_number_and_percentage = async (req: Request, res: Response) => {
  try {
    const { game_time } = req.body;
    const game_data: any = [];
    const currentDate = moment().tz(TIMEZONE).startOf('day').toDate();

    const gameSettingRepository = getRepository(GameBetSetting);
    const betRepository = getRepository(Bet);
    const gameRepository = getRepository(Game);

    const gameDetails = await gameRepository.findOne({
      where: {
        game_time: game_time,
        created_at: currentDate
      }
    });

    const bets = await betRepository.find({
      relations: ["game"],
      where: { game: { id: gameDetails?.id } }
    });

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const game_bet_settings = await gameSettingRepository.find({
      where: {
        set_date: Between(startOfDay, endOfDay),
      },
    });

    for (let i = 0; i <= 99; i++) {
      game_data.push({ number: i, completed_percentage: 0 });
    }
    game_bet_settings.forEach(setting => {
      const total_bet_amount = bets
        .filter(bet => Number(bet.choosen_number) === Number(setting.bet_number))
        .reduce((acc, bet) => acc + Number(bet.bet_amount), 0);
      const completed_percentage = (total_bet_amount / setting.max_bet_limit) * 100;
      console.log(setting.bet_number)
      game_data[setting.bet_number].completed_percentage = completed_percentage;
    });

    return handleSuccess(res, 200, "Game Numbers fetched successfully", game_data);

  } catch (error: any) {
    return handleError(res, 500, error.message);
  }
}
