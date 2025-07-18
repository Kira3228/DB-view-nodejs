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
exports.ActiveFileController = void 0;
const express_1 = require("express");
const active_file_service_1 = require("./active-file.service");
const console_1 = require("console");
class ActiveFileController {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
        this.activeFileService = new active_file_service_1.ActiveFilesService();
    }
    initializeRoutes() {
        this.router.get('/get/active', this.get.bind(this));
        this.router.get('/get/archive', this.getArchive.bind(this));
        this.router.patch('/get/active/update/:id', this.updateStatus.bind(this));
        this.router.get('/get/graph', this.graph.bind(this));
    }
    get(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const filters = Object.assign({}, req.query);
            (0, console_1.log)(filters);
            const result = yield this.activeFileService.getActiveFiles(filters, filters.page, filters.limit);
            return res.status(200).json(result);
        });
    }
    getArchive(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const filters = Object.assign({}, req.query);
            (0, console_1.log)(`фильтры`, filters);
            const result = yield this.activeFileService.getArchive(filters, filters.page, filters.limit);
            (0, console_1.log)(`контроллер`, result);
            return res.status(200).json(result);
        });
    }
    updateStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = req.body;
            (0, console_1.log)(body);
            const id = Number(req.params.id);
            (0, console_1.log)(id);
            const result = yield this.activeFileService.updateStatus(body, id);
            return res.status(200).json(result);
        });
    }
    graph(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = req.query;
            (0, console_1.log)(body);
            const filePath = body.filePath;
            const inode = body.inode;
            (0, console_1.log)(filePath, inode);
            const result = yield this.activeFileService.graph(filePath, Number(inode));
            return res.status(200).json(result);
        });
    }
    getRouter() {
        return this.router;
    }
}
exports.ActiveFileController = ActiveFileController;
