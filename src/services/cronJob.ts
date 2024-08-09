import cron from 'node-cron';
import moment from 'moment-timezone';
import { Bet } from '../entities/Bet';
import { Game } from '../entities/Game';
import { Wallet } from '../entities/Wallet';
import { Request, Response } from 'express';
import { getRepository, MoreThan } from 'typeorm';
import { handleError, handleSuccess } from '../utils/responseHandler';
import { any, equal } from 'joi';
import { Result } from '../entities/Result';
import { updateWalletBalance } from '../controllers/api/walletTransactionController';

const TIMEZONE = process.env.TIMEZONE as string



// Function to create games
export const createGame = async () => {
    try {
        const game_data = [
            {
                game_time: "2 PM",
                status: "scheduled",
                winning_number: "15",
            },
            {
                game_time: "5 PM",
                status: "scheduled",
                winning_number: "20",
            },
            {
                game_time: "9 PM",
                status: "scheduled",
                winning_number: "45",
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
export const cronJobForcreateGame = async (time: string) => {
    const cronExpression = timeToCronExpression(time);
    console.log(`Scheduling cron job with expression: ${cronExpression}`);
    cron.schedule(cronExpression, () => {
        const now = moment().tz('Asia/Kolkata').format();
        createGame();
    }, {
        timezone: TIMEZONE
    });
};


// Declare Results of the bets
export const declare_result_by_70X = async (game_time: string) => {
    try {
        const currentDate = moment().startOf('day').toDate();
        const betRepository = getRepository(Bet)
        const gameRepository = getRepository(Game)
        const resultRepository = getRepository(Result)

        const get_current_date_game_data = await gameRepository.findOneBy({ game_time: game_time, created_at: currentDate })
        const game_winning_number = Number(get_current_date_game_data?.winning_number)
        const get_bets_by_game = await betRepository.find(
            {
                relations: ["game", "user"],
                where: {
                    game: { id: get_current_date_game_data?.id }
                }
            })

        if (!get_current_date_game_data) {
            console.log("No game Available for this Time")
            return
        }

        if (get_bets_by_game.length == 0) {
            console.log("No Bet Available for this game")
            return
        }

        const result_data = await resultRepository.findOne({
            relations: ["game"],
            where: {
                game: { id: get_current_date_game_data?.id }
            }
        })

        if (result_data) {
            console.log("Result Already Declare")
            return
        }

        const results: any = [];
        get_bets_by_game.map(async (bet) => {
            if (Number(bet?.choosen_number) === game_winning_number) {
                const isWinning = true
                const winningAmount = Number(bet?.bet_amount) * 70
                const result = resultRepository.create({
                    game: bet.game,
                    bet,
                    user: bet.user,
                    is_winning: isWinning,
                    winning_amount: winningAmount
                });
                await updateWalletBalance(bet.user, "BetWin", winningAmount);
                results.push(result);
            } else {
                const isWinning = false
                const winningAmount = 0
                const result = resultRepository.create({
                    game: bet.game,
                    bet,
                    user: bet.user,
                    is_winning: isWinning,
                    winning_amount: winningAmount
                });
                results.push(result);
            }
        })
        await resultRepository.save(results);

    } catch (error: any) {
        console.log(error.message)
    }
}


// Schedule 2PM game declaration
cron.schedule('0 14 * * *', async () => {
    try {
        await declare_result_by_70X("3 PM")
    } catch (error) {
        console.log("Error processing 5PM game:", error);
    }
});

// Schedule 5PM game declaration
cron.schedule('0 17 * * *', async () => {
    try {
        await declare_result_by_70X("5 PM")
    } catch (error) {
        console.log("Error processing 5PM game:", error);
    }
});

// Schedule 9PM game declaration
cron.schedule('0 21 * * *', async () => {
    try {
        await declare_result_by_70X("5 PM")
    } catch (error) {
        console.log("Error processing 9PM game:", error);
    }
});
