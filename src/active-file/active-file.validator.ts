import { body, param, query } from "express-validator";

export const listActiveFilesQueryRules = [
  query(`page`)
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage(`page должен быть больше 1`)
    .toInt(),
  query(`limit`)
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 100 })
    .withMessage(`limit должен быть от 1 до 100`)
    .toInt(),
  query(`inode`)
    .optional({ checkFalsy: true })
    .isInt()
    .withMessage(`inode должен быть числом`)
    .toInt(),
  query(`filePath`)
    .optional({ checkFalsy: true })
    .isString()
    .withMessage(`filePath должен быть строкой`)
    .trim(),
  query(`filePathException`)
    .optional({ checkFalsy: true })
    .isString()
    .withMessage(`filePathException должен быть строкой`)
    .customSanitizer(v => String(v).split(`;`).map((s: string) => s.trim()).filter(Boolean)),
  query(`processPathException`)
    .optional({ checkFalsy: true })
    .isString()
    .withMessage(`processPathException должен быть строкой`)
    .customSanitizer(v => String(v).split(`;`).map((s: string) => s.trim()).filter(Boolean)),
]
export const graphQueryRules = [
  query(`filePath`)
    .optional({ checkFalsy: true })
    .isString()
    .withMessage(`filePath должен быть строкой`)
    .trim(),
  query(`inode`)
    .optional({ checkFalsy: true })
    .isInt()
    .withMessage(`inode должен быть числом`)
    .toInt(),
  query(`filePathException`)
    .optional({ checkFalsy: true })
    .isString()
    .withMessage(`filePathException должен быть строкой`)
    .customSanitizer(v => String(v).split(`;`).map((s: string) => s.trim()).filter(Boolean)),
  query(`processPathException`)
    .optional({ checkFalsy: true })
    .isString()
    .withMessage(`processPathException должен быть строкой`)
    .customSanitizer(v => String(v).split(`;`).map((s: string) => s.trim()).filter(Boolean)),
]

export const updateStatusRules = [
  param(`id`).isInt({ min: 1 }).withMessage(`id должно быть больше 1`).toInt(),
  body(`status`)
    .isIn([`active`, `archived`, `deleted`])
    .withMessage(`status должен быть active, archived или deleted`)
]