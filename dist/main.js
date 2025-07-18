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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const express_1 = __importDefault(require("express"));
const events_1 = require("events");
const user_entity_1 = require("./entities/user.entity");
const system_events_entity_1 = require("./entities/system_events.entity");
const process_entity_1 = require("./entities/process.entity");
const process_version_entity_1 = require("./entities/process_version.entity");
const process_file_reads_entity_1 = require("./entities/process_file_reads.entity");
const monitored_file_entity_1 = require("./entities/monitored_file.entity");
const file_relationships_entity_1 = require("./entities/file_relationships.entity");
const file_origins_entity_1 = require("./entities/file_origins.entity");
const file_access_events_entity_1 = require("./entities/file_access_events.entity");
const system_log_controller_1 = require("./system-log/system-log.controller");
const active_file_controller_1 = require("./active-file/active-file.controller");
const cors_1 = __importDefault(require("cors"));
const reports_controller_1 = require("./reports/reports.controller");
// Увеличиваем лимит слушателей событий
events_1.EventEmitter.defaultMaxListeners = 15;
function bootstrap() {
    return __awaiter(this, void 0, void 0, function* () {
        const connection = yield (0, typeorm_1.createConnection)({
            type: `sqlite`,
            database: `pmovt.db`,
            synchronize: false,
            entities: [
                user_entity_1.User,
                system_events_entity_1.SystemEvent,
                process_entity_1.Process,
                process_version_entity_1.ProcessVersion,
                process_file_reads_entity_1.ProcessFileRead,
                monitored_file_entity_1.MonitoredFile,
                file_relationships_entity_1.FileRelationship,
                file_origins_entity_1.FileOrigin,
                file_access_events_entity_1.FileAccessEvent
            ],
            // logging: true
        });
        console.log("Connected to database");
        const systemLogController = new system_log_controller_1.SystemLogController();
        const activeFileController = new active_file_controller_1.ActiveFileController();
        const reportController = new reports_controller_1.ReportController();
        const app = (0, express_1.default)();
        const PORT = 3000;
        app.use(express_1.default.json());
        app.use((0, cors_1.default)());
        app.use('/api/logs', systemLogController.getRouter());
        app.use('/api/active', activeFileController.getRouter());
        app.use(`/api/reports`, reportController.getRouter());
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    });
}
bootstrap().catch(error => {
    console.error("Application startup failed:", error);
    process.exit(1);
});
