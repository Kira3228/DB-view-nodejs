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
        this.router.get(`/`, this.getEvents.bind(this));
    }
    getEvents(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const pdfDoc = yield this.reportService.getEvents();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="system_logs.pdf"');
            pdfDoc.pipe(res);
            pdfDoc.end();
            // res.json(pdfDoc)
        });
    }
    getRouter() {
        return this.router;
    }
}
exports.ReportController = ReportController;
