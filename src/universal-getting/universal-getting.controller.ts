import { Request, Response, Router } from "express";
import { UniversalGettingService } from "./universal-getting.service";

const express = require('express');

export class UnibersalGettingController {


  constructor() {
    this.service = new UniversalGettingService()
    this.router = express.Router();
    this.initializeRoutes();
  }
  private router: Router
  private service: UniversalGettingService
  private initializeRoutes() {
    this.router.get(`/tables`, this.getTablesName.bind(this));
    this.router.get(`/fields`, this.getFieldsName.bind(this));
  }
  async getTablesName(req: Request, res: Response) {
    try {
      const result = await this.service.getTablesName()
      return res.status(200).json(result)
    }
    catch {

    }
  }

  async getFieldsName(req: Request, res: Response) {
    try {
      const result = await this.service.getFieldsName()
      return res.status(200).json(result)
    }
    catch {

    }
  }

  async test(req: Request, res: Response) {
    try {

      const result = await this.service.getUsers()

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error in getFilteredSystem:", error);
      return res.status(500).json({
        error: error.message || "Internal server error"
      });
    }
  }



  getRouter() {
    return this.router;
  }
}