import cron from 'node-cron';
import moment from 'moment-timezone';
import { getRepository } from 'typeorm';
import { Game } from '../entities/Game';
import { Wallet } from '../entities/Wallet';
import { Request, Response } from 'express';
import { handleError, handleSuccess } from '../utils/responseHandler';

const TIMEZONE = process.env.TIMEZONE as string

// Function to create games
export const createGame = async () => {
    try {
        const game_data = [
            {
                game_time: "2 PM",
                status: "scheduled",
                winning_number: "12",
            },
            {
                game_time: "5 PM",
                status: "scheduled",
                winning_number: "12",
            },
            {
                game_time: "9 PM",
                status: "scheduled",
                winning_number: "12",
            },
        ];

        const gameRepository = getRepository(Game);

        const savedGames = await Promise.all(game_data.map(async (game) => {
            const newGame = gameRepository.create(game);
            return await gameRepository.save(newGame);
        }));

        await resetTodayEarnings()
        console.log('Games created successfully', savedGames);
    } catch (error: any) {
        console.error('Error creating games:', error.message);
    }
};

// Function to reset today's earnings to 0 for all wallets
export const resetTodayEarnings = async () => {
    try {
        const walletRepository = getRepository(Wallet);
        const wallets = await walletRepository.find();

        await Promise.all(wallets.map(async (wallet) => {
            wallet.today_earning = 0;
            await walletRepository.save(wallet);
        }));

        console.log('Today earnings reset to 0 for all wallets');
    } catch (error: any) {
        console.error('Error resetting today earnings:', error.message);
    }
};

// Function to convert time string to cron expression
export const timeToCronExpression = (time: string): string => {
    const [hourMinute, period] = time.split(' ');
    const [hour, minute] = hourMinute.split(':').map(num => parseInt(num, 10));

    let cronHour = hour;
    if (period.toUpperCase() === 'PM' && cronHour < 12) {
        cronHour += 12;
    } else if (period.toUpperCase() === 'AM' && cronHour === 12) {
        cronHour = 0;
    }

    return `${minute} ${cronHour} * * *`;
};

// Function to schedule the cron job
export const cronJobForcreateGame = (time: string) => {
    const cronExpression = timeToCronExpression(time);
    console.log(`Scheduling cron job with expression: ${cronExpression}`);
    cron.schedule(cronExpression, () => {
        const now = moment().tz('Asia/Kolkata').format();
        createGame();
    }, {
        timezone: TIMEZONE
    });
};

