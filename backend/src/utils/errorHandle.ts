import { Response } from 'express';

export const handleError = (res: Response, statusCode: number, message: string) => {
  return res.status(statusCode).send({
    success: false,
    status: statusCode,
    error: message
  });
};
