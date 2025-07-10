import { Router } from "express";
import { getFilteredSystemLog, getSystemLog } from "./system-log.controller";

const router = Router();
router.get('/', getSystemLog);
router.get('/filtered', getFilteredSystemLog)
export default router;
