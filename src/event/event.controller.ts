import { inject, injectable } from "tsyringe";
import { Controller, Get, Patch, Post } from "../shared/utils/routing";
import { EventService, } from "./event.service";
import { Request, Response } from "express";
import { log } from "console";
import { EventFilterDto } from "./dto/event-filter.dto";

@Controller(`/events`)
@injectable()
export class FileController {
  constructor(
    @inject(EventService) private readonly eventService: EventService
  ) { }

  @Get(`/files`)
  async getFiles(req: Request, res: Response) {
    const { filesystem_id, deleted } = req.query;
    const result = await this.eventService.getFiles({
      filesystemId: filesystem_id ? Number(filesystem_id) : undefined,
      deleted: deleted === "true" ? true : deleted === "false" ? false : undefined,
    });
    res.status(200).json(result);
  }

  @Get(`/files/:id`)
  async getFileById(req: Request, res: Response) {
    const result = await this.eventService.getFileById(Number(req.params.id));
    if (!result) return res.status(404).json({ message: "File not found" });
    res.status(200).json(result);
  }

  @Get(`/versions`)
  async getFileVersions(req: Request, res: Response) {
    const { file_id, origin_process_version_id, depth } = req.query;
    const result = await this.eventService.getFileVersions({
      fileId: file_id ? Number(file_id) : undefined,
      originProcessVersionId: origin_process_version_id
        ? Number(origin_process_version_id)
        : undefined,
      depth: depth ? Number(depth) : undefined,
    });
    res.status(200).json(result);
  }

  @Get(`/versions/:id`)
  async getFileVersionById(req: Request, res: Response) {
    const result = await this.eventService.getFileVersionById(
      Number(req.params.id)
    );
    if (!result) return res.status(404).json({ message: "File version not found" });
    res.status(200).json(result);
  }

  @Get(`/all`)
  async getReads(req: Request<any, any, any, EventFilterDto>, res: Response) {
    const result = await this.eventService.getEvents(req.query);
    res.status(200).json(result);
  }


  @Get(`/reads/:fileId/:processVersionId`)
  async getReadByPk(req: Request, res: Response) {
    const result = await this.eventService.getFileReadByPk(
      Number(req.params.fileId),
      Number(req.params.processVersionId)
    );
    if (!result) return res.status(404).json({ message: "Read record not found" });
    res.status(200).json(result);
  }


  @Get(`/writes`)
  async getWrites(req: Request, res: Response) {
    const { file_id, process_version_id, from, to } = req.query;
    const result = await this.eventService.getFileWrite({
      fileId: file_id ? Number(file_id) : undefined,
      processVersionId: process_version_id
        ? Number(process_version_id)
        : undefined,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
    });
    res.status(200).json(result);
  }

  @Get(`/writes/:fileId/:processVersionId`)
  async getWriteByPk(req: Request, res: Response) {
    const result = await this.eventService.getFileWriteByPk(
      Number(req.params.fileId),
      Number(req.params.processVersionId)
    );
    if (!result) return res.status(404).json({ message: "Write record not found" });
    res.status(200).json(result);
  }

  @Get(`/chain/:fileId`)
  async getChain(req: Request, res: Response) {
    const result = await this.eventService.getFileChain(
      Number(req.params.fileId),
      req.query.depth ? Number(req.query.depth) : undefined
    );
    if (!result) return res.status(404).json({ message: "File not found" });
    res.status(200).json(result);
  }

  @Post(`/generate`)
  async generateMock(req: Request, res: Response) {
    await this.eventService.seedDatabase()
    res.status(200).json({ status: `OK` })
  }
}