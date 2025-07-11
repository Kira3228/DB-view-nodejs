import { Router } from "express";
import { exportCSV, getFilteredSystemLog, getSelectedLogs, getSystemLog } from "./system-log.controller";

const router = Router();
router.get('/', getSystemLog);
router.get('/filtered', getFilteredSystemLog)
router.get('/csv/', exportCSV)
router.get('/csv/selected/', getSelectedLogs)

export default router;
