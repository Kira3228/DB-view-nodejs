import { Router } from "express";

export class MonitoredFilesController {
    constructor() {
        this.router = Router()
    }
    router: Router
    monitoredFileService
    
    initializeRoutes(){
        this.router
    }
}