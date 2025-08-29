import { NextFunction, Request, Response } from "express";
import { HttpError } from "../errors/http-errors";

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    const payload: any = {
      status: err.status,
      code: err.code,
      message: err.message
    }
    if (err.details) {
      payload.details = err.details
    }
    return res.status(err.status).json(payload)
  }
  return res.status(500).json({
    status: 500,
    code: `INTERNAL_ERROR`,
    message: `Internal server error`
  })
}