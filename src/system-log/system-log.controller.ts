import { Request, Response } from "express";
import { SystemLogService } from "./system-log.service";
import { FiltersDto } from "./dto/filters.dto";

// Важно: создаем экземпляр сервиса только после установки соединения
let systemLogService: SystemLogService;

export function initSystemLogService() {
    systemLogService = new SystemLogService();
}

export const getSystemLog = async (req: Request, res: Response) => {
    if (!systemLogService) {
        return res.status(500).json({ error: "SystemLogService not initialized" });
    }
    console.log('Fetching system logs...');
    try {
        const result = await systemLogService.getSystemEvents();
        return res.status(201).json(result)
    } catch (error) {
        console.error("Error in getSystemLog:", error);
        throw error;
    }
};

export const getFilteredSystemLog = async (req: Request, res: Response) => {
    if (!systemLogService) {
        return res.status(500).json({ error: "SystemLogService not initialized" });
    }
    console.log('Fetching system filtered logs...');
    try {
        const filters: FiltersDto = {
            ...req.query,
            ...req.body
        }
        const result = await systemLogService.getFilteredSystemEvents(filters)
        return res.status(200).json(result);
    }
    catch (error) {
        console.error("Error in getFilteredSystem:", error);
        return res.status(500).json({
            error: error.message || "Internal server error"
        });
    }
}

export const getSelectedLogs = async (req: Request, res: Response) => {
    if (!systemLogService) {
        return res.status(500).json({ error: "SystemLogService not initialized" });
    }
    try {

    }
    catch (error) {

    }
}