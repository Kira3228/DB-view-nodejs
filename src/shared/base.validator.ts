import { query } from "express-validator";

export const presetNameQueryRules = [
  query('presetName')
    .exists({ checkFalsy: true })
    .withMessage('presetName обязателен')
    .bail()
    .isString()
    .withMessage('presetName должен быть строкой')
    .bail()
    .isLength({ min: 1, max: 255 })
    .withMessage('presetName должен содержать от 1 до 255 символов')
    .trim()
];