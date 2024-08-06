// import "reflect-metadata";
// import { DataSource } from "typeorm";
// import { User } from "../entities/User";
// import { Transaction } from "../entities/Transaction";
// import { Game } from "../entities/Game";
// import { Bet } from "../entities/Bet";
// import { Payout } from "../entities/Payout";
// import { GameSetting } from "../entities/GameSetting";
// import { ChatbotQuery } from "../entities/ChatbotQuery";
// import { FAQ } from "../entities/FAQ";

// export const AppDataSource = new DataSource({
//   type: "mysql",
//   host: process.env.DB_HOST,
//   port: parseInt(process.env.DB_PORT || "3306"),
//   username: process.env.DB_USERNAME,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   synchronize: true, // Note: Never use synchronize in production, use migrations instead
//   logging: false,
//   entities: [User, Transaction, Game, Bet, Payout, GameSetting, ChatbotQuery, FAQ],
//   migrations: ["src/migrations/*.ts"],
//   subscribers: [],
// });
