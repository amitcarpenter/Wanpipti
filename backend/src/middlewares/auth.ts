import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getRepository, } from "typeorm";
import { User } from "../entities/User";
import { IUser } from "../models/User";
import dotenv from "dotenv";
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET as string;
declare module 'express-serve-static-core' {
    interface Request {
        user?: IUser;
    }
}

// Middleware for authenticating user
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authorizationHeader = req.headers['authorization'];
        if (!authorizationHeader) {
            return res.status(401).json({
                success: false,
                status: 401,
                message: 'Unauthorized: No token provided',
            });
        }
        const token = authorizationHeader.split(' ')[1];
        console.log(token)
        const decodedToken = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
        const userRepository = getRepository(User);
        const user = await userRepository.findOneBy({ id: parseInt(decodedToken.userId) });
        if (!user) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: 'User not found',
            });
        }

        req.user = user as IUser;
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            status: 401,
            message: 'Unauthorized: Invalid token',
        });
    }
};


// Chack Admin Or Not Middle ware
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as IUser;
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        status: 403,
        message: 'Forbidden: You do not have the necessary permissions'
      });
    }
    next();
  };