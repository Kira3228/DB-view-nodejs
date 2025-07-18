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
exports.FileAccessEvent = void 0;
const typeorm_1 = require("typeorm");
const monitored_file_entity_1 = require("./monitored_file.entity");
const process_version_entity_1 = require("./process_version.entity");
let FileAccessEvent = class FileAccessEvent {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], FileAccessEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: `access_type`, type: `text` }),
    __metadata("design:type", String)
], FileAccessEvent.prototype, "accessType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: `timestamp`,
        type: `datetime`,
        default: () => `CURRENT_TIMESTAMP`,
    }),
    __metadata("design:type", Date)
], FileAccessEvent.prototype, "timestamp", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: `file_descriptor`, type: `integer`, nullable: true }),
    __metadata("design:type", Number)
], FileAccessEvent.prototype, "fileDescriptor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: `bytes_accessed`, type: `integer`, default: 0 }),
    __metadata("design:type", Number)
], FileAccessEvent.prototype, "bytesAcessed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: `file_offset`, type: `integer`, default: 0 }),
    __metadata("design:type", Number)
], FileAccessEvent.prototype, "fileOffset", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: `access_flags`, type: `integer`, nullable: true }),
    __metadata("design:type", Number)
], FileAccessEvent.prototype, "accessFlags", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: `denied`, type: `boolean`, default: false }),
    __metadata("design:type", Boolean)
], FileAccessEvent.prototype, "dinied", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => monitored_file_entity_1.MonitoredFile, (file) => file.access),
    (0, typeorm_1.JoinColumn)({ name: `monitored_file_id` }),
    __metadata("design:type", monitored_file_entity_1.MonitoredFile)
], FileAccessEvent.prototype, "file", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => process_version_entity_1.ProcessVersion, (version) => version.access),
    (0, typeorm_1.JoinColumn)({ name: `process_version_id` }),
    __metadata("design:type", process_version_entity_1.ProcessVersion)
], FileAccessEvent.prototype, "version", void 0);
FileAccessEvent = __decorate([
    (0, typeorm_1.Index)('idx_file_access_timestamp', ['timestamp']),
    (0, typeorm_1.Index)('idx_file_access_file', ['file']),
    (0, typeorm_1.Index)('idx_file_access_process', ['version']),
    (0, typeorm_1.Entity)('file_access_events')
], FileAccessEvent);
exports.FileAccessEvent = FileAccessEvent;
