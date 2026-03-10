import { query } from "express-validator";

export const selectedLogsQueryRules = [
  query('ids')
    .exists({ checkFalsy: true })
    .withMessage('ids is required and must be a non-empty string like "1,2,3"')
    .bail()
    .isString()
    .withMessage('ids must be a string')
    .bail()
    .matches(/^\d+(,\d+)*$/)
    .withMessage('ids must be a comma-separated list of integers, e.g. "1,2,3"')
    .bail()
    .customSanitizer((v: string) =>
      v.split(',').map(s => Number(s)).filter(n => Number.isInteger(n))
    )
    .custom((arr: number[]) => Array.isArray(arr) && arr.length > 0)
    .withMessage('ids must contain at least one integer'),
];