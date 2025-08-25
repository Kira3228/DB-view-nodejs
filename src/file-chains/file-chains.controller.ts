import { Request, Response, Router } from "express";
import { FileChainsService } from "./file-chains.service";

const express = require('express');

export class FileChainsController {
  constructor() {
    this.fileChainsService = new FileChainsService();
    this.router = express.Router();
    this.initializeRoutes();
  }
  router: Router
  fileChainsService: FileChainsService

  initializeRoutes() {
    this.router.get(`/`, this.getAllFileChains.bind(this))
  }

  async getAllFileChains(req: Request, res: Response) {
    try {
      const chains = await this.fileChainsService.getAllFileChains()
      res.status(200).json(chains)
    } catch (error) { }
  }

  getRouter() {
    return this.router;
  }
}
