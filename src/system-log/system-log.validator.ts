import { query } from "express-validator";

export const filteredSystemLogQueryRules = [
  query(`eventType`)
    .optional({ checkFalsy: true })
    .isString()
    .withMessage(`eventType должен быть строкой`)
    .trim(),
  query(`status`)
    .optional({ checkFalsy: false })
    .isString()
    .withMessage(`status должен быть строкой`)
    .trim(),
  query(`filePath`)
    .optional({ checkFalsy: true })
    .isString()
    .withMessage(`filePath должен быть строкой`)
    .trim(),
  query(`fileSystemId`)
    .optional({ checkFalsy: true })
    .isString()
    .withMessage(`fileSystemId должен быть строкой`)
    .trim(),
  query(`page`)
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage(`page должно быть число > 0`)
    .toInt(),
  query(`limit`)
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 100 })
    .withMessage(`limit должен быть от 1 до 100`)
    .toInt(),
  query(`startDate`)
    .optional({ checkFalsy: true })
    .isString()
    .withMessage(`startDate должен быть строкой`)
    .trim(),
  query(`endDate`)
    .optional({ checkFalsy: true })
    .isString()
    .withMessage(`endDate должен быть строкой`)
    .trim(),
  query(`filePathException`)
    .optional({ checkFalsy: true })
    .isString()
    .withMessage(`filePathException должен быть строкой`)
    .customSanitizer(v => {
      const res = String(v).split(`;`).map((s: string) => {
        return s.trim()
      }).filter(Boolean)
      return res
    }),
  query(`processPathException`)
    .optional({ checkFalsy: true })
    .isString()
    .withMessage(`processPathException должен быть строкой`)
    .customSanitizer(v => String(v).split(`;`).map((s: string) => s.trim()).filter(Boolean)),
]

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



