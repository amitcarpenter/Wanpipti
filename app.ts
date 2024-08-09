import path from 'path';
import 'reflect-metadata';
import dotenv from "dotenv";
import cors from "cors";
import configureApp from "./src/config/routes"
import { connectDatabase } from "./src/config/db";
import express, { Application, Request, Response } from "express";
import { cronJobForcreateGame, declare_result_by_70X } from "./src/services/cronJob"
import { resetTodayEarnings } from "./src/services/cronJob"

// (async()=> await resetTodayEarnings())()
dotenv.config()
const app: Application = express();

(async () => {
  await connectDatabase();
  let time = "12:01 AM"
  await cronJobForcreateGame(time)
})()

const PORT = process.env.PORT as string;
const APP_URL = process.env.APP_URL as string;
const EXPRESS_SESSION_SECRET = process.env.EXPRESS_SESSION_SECRET as string;


app.use('/', express.static(path.join(__dirname, 'src/uploads')));
app.use('/assets', express.static(path.join(__dirname, 'src/assets')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));


configureApp(app);
app.use(cors())

app.get("/", (req: Request, res: Response) => {
  return res.send("Wanpipti Project in TypeScript , TyoeORM , Mysql , Node js")
});


app.listen(PORT, (): void => {
  console.log(`Server is working on ${APP_URL}`);
});



