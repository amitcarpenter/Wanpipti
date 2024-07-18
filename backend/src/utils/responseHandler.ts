import { Response } from 'express';

export const handleError = (res: Response, statusCode: number, message: string) => {
  return res.status(statusCode).send({
    success: false,
    status: statusCode,
    error: message
  });
};

export const handleSuccess = (res: Response, statusCode: number, message: string, ...data: any[]) => {
  return res.status(statusCode).json({
    success: true,
    status: statusCode,
    message: message,
    data: data.length > 0 ? data : undefined,
  });
};
