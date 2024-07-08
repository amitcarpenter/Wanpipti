import express, { Application, Request, Response } from "express";
import { connectDatabase } from "./src/config/db";
import 'reflect-metadata';
import configureApp from "./src/config/routes"
import dotenv from "dotenv";
import path from 'path';
dotenv.config()

connectDatabase();
const app: Application = express();

const PORT = process.env.PORT as string;
const APP_URL = process.env.APP_URL as string;
const EXPRESS_SESSION_SECRET = process.env.EXPRESS_SESSION_SECRET as string;


app.use('/', express.static(path.join(__dirname, 'src/uploads')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));


// configureApp(app);

app.get("/", (req: Request, res: Response) => {
  res.send("PRO SPEECH APP")
});


app.listen(PORT, (): void => {
  console.log(`Server is working on ${APP_URL}`);
});
