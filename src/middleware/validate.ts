import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { ContextRunner } from "express-validator/src/chain";

export function validate(rules: ContextRunner[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(rules.map(r => r.run(req)))
    const errors = validationResult(req)
    if (errors.isEmpty()) return next()

    return res.status(400).json({
      status: 400,
      message: `Validation faild`,
      errors: errors.array().map(e => ({
        param: e.param,
        msg: e.msg,
        value: e.value
      }))
    })
  }
}