import { Request, Response } from "express";
import { SystemLogService } from "./system-log.service";
import { FiltersDto } from "./dto/filters.dto";

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
        const result = await systemLogService.getFilteredSystemEvents({ ...filters, page: 1, limit: 30 })
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
        const ids = req.query.ids && typeof req.query.ids === 'string' ? req.query.ids.split(',').map(Number) : undefined;
        const result = await systemLogService.getSelectedEvents(ids);
        const csv = result.headers + '\n' + result.rows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="logs.csv"');
        res.send(csv);
    } catch (error) {
        console.error("Error in getFilteredSystem:", error);
        return res.status(500).json({
            error: error.message || "Internal server error"
        });
    }
}
export const exportCSV = async (req: Request, res: Response) => {
    if (!systemLogService) {
        return res.status(500).json({ error: "SystemLogService not initialized" });
    }
    try {
        const result = await systemLogService.getAllCSV()
        const csv = result.headers + '\n' + result.rows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="logs.csv"');
        res.send(csv);
    }
    catch (error) {
        console.error("Error in getFilteredSystem:", error);
        return res.status(500).json({
            error: error.message || "Internal server error"
        });
    }
}