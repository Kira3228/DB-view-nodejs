import { createConnection } from "typeorm";
import express from 'express'
import userRouter from './User/user.router'
import systemLogRouter from './system-log/system-log.router'
import { User } from "./entities/user.entity";
import { SystemEvent } from "./entities/system_events.entity";
import { Process } from "./entities/process.entity";
import { ProcessVersion } from "./entities/process_version.entity";
import { ProcessFileRead } from "./entities/process_file_reads.entity";
import { MonitoredFile } from "./entities/monitored_file.entity";
import { FileRelationship } from "./entities/file_relationships.entity";
import { FileOrigin } from "./entities/file_origins.entity";
import { FileAccessEvent } from "./entities/file_access_events.entity";
import { initSystemLogService } from "./system-log/system-log.controller";
async function bootstrap() {
    const connection = await createConnection({
        type: `sqlite`,
        database: `pmovt.db`,
        synchronize: false,
        entities: [
            User,
            SystemEvent,
            Process,
            ProcessVersion,
            ProcessFileRead,
            MonitoredFile,
            FileRelationship,
            FileOrigin,
            FileAccessEvent
        ],
        logging: true
    });
    console.log("Connected to database");
    initSystemLogService()
    const app = express()
    const PORT = 3000
    app.use(express.json())
    app.use('/api/users', userRouter)
    app.use('/api/logs', systemLogRouter)
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}


bootstrap().catch(error => {
    console.error("Application startup failed:", error);
    process.exit(1);
});