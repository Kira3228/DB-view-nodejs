"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemEvent = void 0;
const typeorm_1 = require("typeorm");
const monitored_file_entity_1 = require("./monitored_file.entity");
const process_entity_1 = require("./process.entity");
let SystemEvent = class SystemEvent {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SystemEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: `event_type`, type: `text` }),
    __metadata("design:type", String)
], SystemEvent.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: `event_data`, type: `text`, nullable: true }),
    __metadata("design:type", String)
], SystemEvent.prototype, "eventData", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: `severity`, type: `text`, default: '`info`' }),
    __metadata("design:type", String)
], SystemEvent.prototype, "severity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: `source`, type: `text`, default: '`fanotify`' }),
    __metadata("design:type", String)
], SystemEvent.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: `timestamp`,
        type: `datetime`,
        default: () => `CURRENT_TIMESTAMP`,
    }),
    __metadata("design:type", Date)
], SystemEvent.prototype, "timestamp", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => monitored_file_entity_1.MonitoredFile, (file) => file.systemEvents),
    (0, typeorm_1.JoinColumn)({ name: `related_file_id` }),
    __metadata("design:type", monitored_file_entity_1.MonitoredFile)
], SystemEvent.prototype, "relatedFileId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => process_entity_1.Process, (process) => process.systemEvents),
    (0, typeorm_1.JoinColumn)({ name: `related_process_id` }),
    __metadata("design:type", process_entity_1.Process)
], SystemEvent.prototype, "relatedProcessId", void 0);
SystemEvent = __decorate([
    (0, typeorm_1.Index)('idx_system_events_timestamp', ['timestamp']),
    (0, typeorm_1.Index)('idx_system_events_type', ['eventType']),
    (0, typeorm_1.Entity)(`system_events`)
], SystemEvent);
exports.SystemEvent = SystemEvent;
