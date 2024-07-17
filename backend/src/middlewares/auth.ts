import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source"; // TypeORM data source
import { User } from "../entities/User";
import { IUser } from "../models/User"; 

const JWT_SECRET = process.env.JWT_SECRET as string;

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
    const decodedToken = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: parseInt(decodedToken.userId) });

    if (!user) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'User not found',
      });
    }

    req.user = user as IUser; // Now this will not raise an error
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      status: 401,
      message: 'Unauthorized: Invalid token',
    });
  }
};
