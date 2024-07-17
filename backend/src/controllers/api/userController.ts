import { Request, Response } from "express";
import Joi from "joi";
import bcrypt from "bcrypt";
import { getRepository } from "typeorm";
import { User } from "../../entities/User";


// Register User
export const register = async (req: Request, res: Response) => {
    try {
        const registerSchema = Joi.object({
            full_name: Joi.string().min(3).max(30).required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required(),
        });
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: error.details[0].message,
            });
        }
        const { full_name, email, password } = value;
        const userRepository = getRepository(User);
        const existEmail = await userRepository.findOne({ where: { email } });
        if (existEmail) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Email already exists.",
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user instance
        const newUser = userRepository.create({
            full_name,
            email,
            password: hashedPassword,
        });

        await userRepository.save(newUser);
        return res.status(201).json({
            success: true,
            status: 201,
            message: "User registered successfully.",
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            status: 500,
            error: error.message,
        });
    }
};
