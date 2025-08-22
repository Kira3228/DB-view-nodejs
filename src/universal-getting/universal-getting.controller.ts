import { Request, Response, Router } from "express";
import { UniversalGettingService } from "./universal-getting.service";
import { QueryConfig } from "./dto/query-config";

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
    this.router.get(`/v2/:table/fields`, this.getFieldsName.bind(this));
    this.router.post(`/data`, this.getData.bind(this))
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
      const tableName = req.params.table
      const result = await this.service.getFieldsName(tableName)
      return res.status(200).json(result)
    }
    catch {

    }
  }

  async getData(req: Request, res: Response) {
    try {
      // const query: Partial<QueryConfig> = { ...req.query }
      const query: QueryConfig = { ...req.body }
      const result = await this.service.getData(query)

      res.status(200).json(result)
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