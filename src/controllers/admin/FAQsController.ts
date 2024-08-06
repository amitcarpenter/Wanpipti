import Joi from "joi";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import moment from 'moment';
import jwt from "jsonwebtoken";
import { Bet } from '../../entities/Bet';
import { IUser } from "../../models/User";
import { User } from "../../entities/User";
import { Game } from '../../entities/Game';
import { FAQ } from '../../entities/FAQ';
import { Request, Response } from "express";
import { Result } from '../../entities/Result';
import { sendEmail } from "../../services/otpService";
import { getRepository, MoreThan, Between, In } from "typeorm";
import { handleError, handleSuccess } from "../../utils/responseHandler";


const APP_URL = process.env.APP_URL as string;
const TIMEZONE = process.env.TIMEZONE as string

// Create FAQ
export const createFAQ = async (req: Request, res: Response) => {
    try {
        const schema = Joi.object({
            question: Joi.string().required(),
            answer: Joi.string().required(),
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return handleError(res, 400, error.details[0].message);
        }

        const faqRepository = getRepository(FAQ);
        const newFAQ = faqRepository.create(value);
        const savedFAQ = await faqRepository.save(newFAQ);

        return handleSuccess(res, 201, 'FAQ created successfully', savedFAQ);
    } catch (error: any) {
        console.error('Error in createFAQ:', error);
        return handleError(res, 500, 'An error occurred while creating the FAQ');
    }
};

// Get All FAQ
export const getFAQs = async (req: Request, res: Response) => {
    try {
        const faqRepository = getRepository(FAQ);
        const faqs = await faqRepository.find();

        if (faqs.length === 0) {
            return handleError(res, 400, 'No FAQs found');
        }

        return handleSuccess(res, 200, 'FAQs retrieved successfully', faqs);
    } catch (error: any) {
        console.error('Error in getFAQs:', error);
        return handleError(res, 500, 'An error occurred while retrieving the FAQs');
    }
};

// Get FAQ by ID
export const getFAQById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const faqRepository = getRepository(FAQ);
        const faq = await faqRepository.findOne({ where: { id: Number(id) } });

        if (!faq) {
            return handleError(res, 400, 'FAQ not found');
        }

        return handleSuccess(res, 200, 'FAQ retrieved successfully', faq);
    } catch (error: any) {
        console.error('Error in getFAQById:', error);
        return handleError(res, 500, 'An error occurred while retrieving the FAQ');
    }
};

// Update FAQ by ID
export const updateFAQ = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const schema = Joi.object({
            question: Joi.string().optional(),
            answer: Joi.string().optional(),
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            return handleError(res, 400, error.details[0].message);
        }
        const faqRepository = getRepository(FAQ);
        let faq = await faqRepository.findOneBy({ id: Number(id) });

        if (!faq) {
            return handleError(res, 400, 'FAQ not found');
        }
        faq = { ...faq, ...value };
        const updatedFAQ = await faqRepository.save(faq as FAQ);
        return handleSuccess(res, 200, 'FAQ updated successfully', updatedFAQ);
    } catch (error: any) {
        console.error('Error in updateFAQ:', error);
        return handleError(res, 500, 'An error occurred while updating the FAQ');
    }
};


// Delet FAQ By ID
export const deleteFAQ = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const faqRepository = getRepository(FAQ);
        const faq = await faqRepository.findOne({ where: { id: Number(id) } });

        if (!faq) {
            return handleError(res, 400, 'FAQ not found');
        }

        await faqRepository.delete(id);

        return handleSuccess(res, 200, 'FAQ deleted successfully');
    } catch (error: any) {
        console.error('Error in deleteFAQ:', error);
        return handleError(res, 500, 'An error occurred while deleting the FAQ');
    }
};

