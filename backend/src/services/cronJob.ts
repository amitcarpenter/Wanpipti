import cron from 'node-cron';
import moment from 'moment-timezone';
import { Bet } from '../entities/Bet';
import { Game } from '../entities/Game';
import { Wallet } from '../entities/Wallet';
import { Request, Response } from 'express';
import { getRepository, MoreThan } from 'typeorm';
import { handleError, handleSuccess } from '../utils/responseHandler';
import { any, equal } from 'joi';

const TIMEZONE = process.env.TIMEZONE as string




// Schedule 2PM game processing
// cron.schedule('0 14 * * *', process2pmGame);

// Schedule 5PM game processing
cron.schedule('0 17 * * *', async () => {
    try {
        // Same logic as process2pmGame but for 5PM
    } catch (error) {
        console.log("Error processing 5PM game:", error);
    }
});

// Schedule 9PM game processing
cron.schedule('0 21 * * *', async () => {
    try {
        // Same logic as process2pmGame but for 9PM
    } catch (error) {
        console.log("Error processing 9PM game:", error);
    }
});


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


export const getGameDetails = async (gameTime: string) => {
    try {
        console.log("api call for the game")
        const gameRepository = getRepository(Game);
        const currentDate = moment().tz(TIMEZONE).startOf('day').toDate();
        console.log(currentDate);
        const gameDetails = await gameRepository.findOne({
            where: {
                game_time: gameTime,
                created_at: currentDate
            }
        });

        if (!gameDetails) {
            console.log(`No game found for ${gameTime} on the current date.`);
            return null;
        }
        console.log(gameDetails)
        return gameDetails;
    } catch (error) {
        console.log(`Error fetching game details for ${gameTime} on the current date:`, error);
        throw error;
    }
};


export const getBetsAndUserDetails = async (game: any) => {
    try {
        const betRepository = getRepository(Bet);

        const bets = await betRepository.find({
            relations: ['game', 'user'],
            where: { game: { id: game.id } },
        });
        
        if(game){
            bets.forEach((bet)=>{
                if(game.winning_number == bet.choosen_number)
                    {
                        console.log("TRUUUUUUUUUUUUUUU")
                    }
            })
        }
        console.log(bets, "ljalsdjfj")

        if (bets.length === 0) {
            console.log(`No bets found for game ID`);
            return [];
        }
        return bets.map(bet => ({
            betId: bet.id,
            choosenNumber: bet.choosen_number,
            betAmount: bet.bet_amount,
            userId: bet.user.id,
            userName: bet.user.full_name,
            userEmail: bet.user.email
        }));
    } catch (error) {
        console.log(`Error fetching bets and user details for game ID`, error);
        throw error;
    }
};
