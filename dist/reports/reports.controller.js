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
exports.ReportController = void 0;
const reports_service_1 = require("./reports.service");
const express = require('express');
class ReportController {
    constructor() {
        this.reportService = new reports_service_1.ReportService();
        this.router = express.Router();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get(`/pdf`, this.exportPdf.bind(this));
        this.router.get(`/docx`, this.exportDocx.bind(this));
        this.router.get(`/xlsx`, this.exportXlsx.bind(this));
        this.router.get(`/chains`, this.distributionChainsExport.bind(this));
    }
    exportPdf(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const filters = Object.assign({}, req.query);
            const pdfDoc = yield this.reportService.getPdfReport(filters);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="system_logs.pdf"');
            pdfDoc.pipe(res);
            pdfDoc.end();
        });
    }
    exportDocx(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // const filters: Partial<ReportDto> = { ...req.query }
                const filters = Object.assign({}, req.query);
                const buffer = yield this.reportService.getDocxReport(filters);
                if (!Buffer.isBuffer(buffer)) {
                    throw new Error('Generated content is not a valid Buffer');
                }
                res.set({
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'Content-Disposition': 'attachment; filename=report.docx',
                    'Content-Length': buffer.length
                });
                res.end(buffer);
            }
            catch (error) {
                console.error("Ошибка генерации DOCX:", error);
                res.status(500).send("Не удалось создать файл");
            }
        });
    }
    exportXlsx(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const filters = Object.assign({}, req.query);
                const buffer = yield this.reportService.getXlsxReport(filters);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=report.xlsx`);
                res.send(buffer);
                res.end();
            }
            catch (error) {
                console.error("Ошибка генерации XLSX:", error);
                res.status(500).send("Не удалось создать файл");
            }
        });
    }
    distributionChainsExport(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const pdfDoc = yield this.reportService.distributionChainsExport();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="system_logs.pdf"');
            pdfDoc.pipe(res);
            pdfDoc.end();
        });
    }
    getRouter() {
        return this.router;
    }
}
exports.ReportController = ReportController;
