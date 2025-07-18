"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemLogController = void 0;
const system_log_service_1 = require("./system-log.service");
const console_1 = require("console");
const express = require('express');
class SystemLogController {
    constructor() {
        this.systemLogService = new system_log_service_1.SystemLogService();
        this.router = express.Router();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get('/', this.getSystemLog.bind(this));
        this.router.get('/filtered', this.getFilteredSystemLog.bind(this));
        this.router.get('/export/selected', this.getSelectedLogs.bind(this));
        this.router.get('/export/all', this.exportCSV.bind(this));
        this.router.get('/get/options', this.getAllOptions.bind(this));
        this.router.get(`/get/pdf`, this.getPdfReport.bind(this));
    }
    getSystemLog(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Fetching system logs...');
            try {
                const result = yield this.systemLogService.getSystemEvents();
                return res.status(201).json(result);
            }
            catch (error) {
                console.error("Error in getSystemLog:", error);
                return res.status(500).json({ error: error.message || "Internal server error" });
            }
        });
    }
    getFilteredSystemLog(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const filters = Object.assign(Object.assign({}, req.query), req.body);
                (0, console_1.log)(filters);
                const result = yield this.systemLogService.getFilteredSystemEvents(filters, filters.page, filters.limit);
                return res.status(200).json(result);
            }
            catch (error) {
                console.error("Error in getFilteredSystem:", error);
                return res.status(500).json({
                    error: error.message || "Internal server error"
                });
            }
        });
    }
    getSelectedLogs(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ids = req.query.ids && typeof req.query.ids === 'string' ?
                    req.query.ids.split(',').map(Number) : undefined;
                const result = yield this.systemLogService.getSelectedEvents(ids);
                const csv = result.headers + '\n' + result.rows;
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename="logs.csv"');
                res.send(csv);
            }
            catch (error) {
                console.error("Error in getSelectedLogs:", error);
                return res.status(500).json({
                    error: error.message || "Internal server error"
                });
            }
        });
    }
    exportCSV(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.systemLogService.getAllCSV();
                const csv = result.headers + '\n' + result.rows;
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename="logs.csv"');
                res.send(csv);
            }
            catch (error) {
                console.error("Error in exportCSV:", error);
                return res.status(500).json({
                    error: error.message || "Internal server error"
                });
            }
        });
    }
    getAllOptions(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.systemLogService.getAllEventTypeOption();
                return res.json(result);
            }
            catch (error) {
                console.error("Error in exportCSV:", error);
                return res.status(500).json({
                    error: error.message || "Internal server error"
                });
            }
        });
    }
    getPdfReport(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Получаем PDF документ из сервиса
                const pdfDoc = yield this.systemLogService.generatePdfReport();
                // Устанавливаем правильные заголовки для PDF
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename="system_logs.pdf"');
                pdfDoc.pipe(res);
                pdfDoc.end();
            }
            catch (error) {
                console.error('Ошибка при генерации PDF:', error);
                res.status(500).send('Ошибка при генерации отчета');
            }
        });
    }
    getRouter() {
        return this.router;
    }
}
exports.SystemLogController = SystemLogController;
