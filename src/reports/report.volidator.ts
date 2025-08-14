
import { query } from "express-validator";

export const eventsReportQueryRules = [
  query('id').optional().isBoolean().toBoolean(),
  query('eventType').optional().isBoolean().toBoolean(),
  query('eventData').optional().isBoolean().toBoolean(),
  query('severity').optional().isBoolean().toBoolean(),
  query('source').optional().isBoolean().toBoolean(),
  query('timestamp').optional().isBoolean().toBoolean(),
  query('relatedFileId.id').optional().isBoolean().toBoolean(),
  query('relatedFileId.fileSystemId').optional().isBoolean().toBoolean(),
  query('relatedFileId.inode').optional().isBoolean().toBoolean(),
  query('relatedFileId.filePath').optional().isBoolean().toBoolean(),
  query('relatedFileId.fileName').optional().isBoolean().toBoolean(),
  query('relatedFileId.fileSize').optional().isBoolean().toBoolean(),
  query('relatedFileId.createdAt').optional().isBoolean().toBoolean(),
  query('relatedFileId.modifiedAt').optional().isBoolean().toBoolean(),
  query('relatedFileId.isOriginalMarked').optional().isBoolean().toBoolean(),
  query('relatedFileId.maxChainDepth').optional().isBoolean().toBoolean(),
  query('relatedFileId.minChainDepth').optional().isBoolean().toBoolean(),
  query('relatedFileId.status').optional().isBoolean().toBoolean(),
  query('relatedFileId.extendedAttributes').optional().isBoolean().toBoolean(),
  query('relatedProcessId.id').optional().isBoolean().toBoolean(),
  query('relatedProcessId.pid').optional().isBoolean().toBoolean(),
  query('relatedProcessId.executablePath').optional().isBoolean().toBoolean(),
  query('relatedProcessId.commandLine').optional().isBoolean().toBoolean(),
  query('relatedProcessId.parentPid').optional().isBoolean().toBoolean(),
  query('relatedProcessId.groupId').optional().isBoolean().toBoolean(),
  query('relatedProcessId.createdAt').optional().isBoolean().toBoolean(),
  query('relatedProcessId.processStartTime').optional().isBoolean().toBoolean(),
]

export const exceptionsQueryRules = [
  query(`startDate`).optional().isString().withMessage(`startDate должен быть строкой`).trim(),
  query(`endDate`).optional().isString().withMessage(`endDate должен быть строкой`).trim(),
  query(`depth`).optional().isInt({ min: 1 }).withMessage(`depth должен быть > 0`).toInt(),
  query(`minDepth`).optional().isInt({ min: 1 }).withMessage(`minDepth должен быть > 0`).toInt(),
  query(`maxDepth`).optional().isInt({ min: 1 }).withMessage(`maxDepth должен быть > 0`).toInt(),
]