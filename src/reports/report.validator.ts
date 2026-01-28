
import { query } from "express-validator";


export const exceptionsQueryRules = [
  query(`startDate`).optional().isString().withMessage(`startDate должен быть строкой`).trim(),
  query(`endDate`).optional().isString().withMessage(`endDate должен быть строкой`).trim(),
  query(`depth`).optional().isInt({ min: 1 }).withMessage(`depth должен быть > 0`).toInt(),
  query(`minDepth`).optional().isInt({ min: 1 }).withMessage(`minDepth должен быть > 0`).toInt(),
  query(`maxDepth`).optional().isInt({ min: 1 }).withMessage(`maxDepth должен быть > 0`).toInt(),
]