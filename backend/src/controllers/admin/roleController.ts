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
import { Role } from '../../entities/Role';
import { Request, Response } from "express";
import { sendEmail } from "../../services/otpService";
import { getRepository, MoreThan, Between } from "typeorm";
import { handleError, handleSuccess } from "../../utils/responseHandler";

// Create Role
export const createRole = async (req: Request, res: Response) => {
    try {
        const createRoleSchema = Joi.object({
            role_name: Joi.string().max(50).required(),
            role_value: Joi.number().integer().required(),
            description: Joi.string().max(255).allow(''),
        });

        const { error } = createRoleSchema.validate(req.body);
        if (error) {
            return handleError(res, 400, error.details[0].message);
        }

        const roleRepository = getRepository(Role);
        const newRole = roleRepository.create(req.body);
        const savedRole = await roleRepository.save(newRole);
        return handleSuccess(res, 201, 'Role created successfully', savedRole);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};

// Get all Roles
export const getRoles = async (req: Request, res: Response) => {
    try {
        console.log("asdihfkasdkfjkabsd")
        const roleRepository = getRepository(Role);
        const roles = await roleRepository.find({
            order: {
                created_at: 'DESC'
            }
        });
        return handleSuccess(res, 200, 'Roles fetched successfully', roles);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};

// Get Role by ID
export const getRoleById = async (req: Request, res: Response) => {
    try {
        console.log("*********")
        const id = parseInt(req.params.id);
        const roleRepository = getRepository(Role);
        const role = await roleRepository.findOneBy({ id });
        console.log(role)
        if (!role) {
            return handleError(res, 400, 'Role not found');
        }
        return handleSuccess(res, 200, 'Role fetched successfully', role);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};

// Update Role
export const updateRole = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const updateRoleSchema = Joi.object({
            role_name: Joi.string().max(50).optional(),
            role_value: Joi.number().integer().optional(),
            description: Joi.string().max(255).allow('').optional(),
        });

        // Validate request body
        const { error } = updateRoleSchema.validate(req.body);
        if (error) {
            return handleError(res, 400, error.details[0].message);
        }

        const roleRepository = getRepository(Role);
        const roleToUpdate = await roleRepository.findOneBy({ id });
        if (!roleToUpdate) {
            return handleError(res, 400, 'Role not found');
        }
        await roleRepository.update(id, req.body);
        const updatedRole = await roleRepository.findOneBy({ id });
        return handleSuccess(res, 200, 'Role updated successfully', updatedRole);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};

// Delete Role by ID
export const deleteRole = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const roleRepository = getRepository(Role);
        const roleToDelete = await roleRepository.findOneBy({ id });
        if (!roleToDelete) {
            return handleError(res, 400, 'Role not found');
        }
        await roleRepository.delete(id);
        return handleSuccess(res, 200, 'Role deleted successfully');
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};