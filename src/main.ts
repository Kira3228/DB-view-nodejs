import { createConnection, getRepository } from "typeorm";
import express, { Router } from 'express';
import { EventEmitter } from 'events';
import cors from 'cors'
import { container, InjectionToken } from 'tsyringe'
import { validate } from "./middleware/validate";
import { errorHandler } from "./middleware/error-handler";
import { File, FileRead, FileVersion, FileWrite, Filesystem, OSUser, Process, ProcessVersion, } from './entities'
import { PREFIX_META, ROUTE_META, RouteInfo } from "./shared/utils/routing";
import { FileReadRepositoryToken, FileReadService, FileReadServiceToken, FileRepositoryToken, FileVersionRepositoryToken, FileWriteRepositoryToken } from "./File/file.service";
import { FileController } from "./File/file.controller";

EventEmitter.defaultMaxListeners = 15;

export const RouterToken: InjectionToken<Router> = "RouterToken"

async function bootstrap() {
    const connection = await createConnection({
        type: `sqlite`,
        database: `filemon.db`,
        synchronize: false,
        entities: [
            File,
            FileRead,
            FileVersion,
            FileWrite,
            Filesystem,
            OSUser,
            Process, ProcessVersion

        ],
    });
    const app = express();
    const PORT = 3000;
    app.use(express.json());
    app.use(cors())
    app.use(validate([]))
    app.use(errorHandler)

    container.register(RouterToken, { useValue: Router() })

    container.register(FileReadRepositoryToken, { useValue: getRepository(FileRead) });
    container.register(FileWriteRepositoryToken, { useValue: getRepository(FileWrite) });
    container.register(FileRepositoryToken, { useValue: getRepository(File) });
    container.register(FileVersionRepositoryToken, { useValue: getRepository(FileVersion) });

    container.register(FileReadServiceToken, { useClass: FileReadService })
    const controllers: { new(...args: any[]): any }[] = [FileController]

    for (const ControllerClass of controllers) {
        const prefix = Reflect.getMetadata(PREFIX_META, ControllerClass) || '';
        const instance = container.resolve(ControllerClass);
        const routes: RouteInfo[] = Reflect.getMetadata(ROUTE_META, ControllerClass) || [];

        const router = Router();
        for (const route of routes) {
            const handler = (instance as any)[route.handler].bind(instance);
            (router as any)[route.method](route.path, handler);
        }
        app.use(prefix, router);
    }

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

bootstrap().catch(error => {
    console.error("Application startup failed:", error);
    process.exit(1);
});