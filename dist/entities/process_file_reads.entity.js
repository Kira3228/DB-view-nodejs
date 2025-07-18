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
exports.ProcessFileRead = void 0;
const typeorm_1 = require("typeorm");
const process_version_entity_1 = require("./process_version.entity");
const monitored_file_entity_1 = require("./monitored_file.entity");
let ProcessFileRead = class ProcessFileRead {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ProcessFileRead.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: `first_read_at`,
        type: `datetime`,
        default: () => `CURRENT_TIMESTAMP`,
    }),
    __metadata("design:type", Date)
], ProcessFileRead.prototype, "firstReadAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: `last_read_at`,
        type: `datetime`,
        default: () => `CURRENT_TIMESTAMP`,
    }),
    __metadata("design:type", Date)
], ProcessFileRead.prototype, "lastReadAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: `read_count`, type: `integer`, default: 1 }),
    __metadata("design:type", Number)
], ProcessFileRead.prototype, "readCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: `total_bytes_read`, type: `integer`, default: 0 }),
    __metadata("design:type", Number)
], ProcessFileRead.prototype, "totalBytesRead", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => process_version_entity_1.ProcessVersion, (version) => version.fileRead),
    (0, typeorm_1.JoinColumn)({ name: `process_version_id` }),
    __metadata("design:type", Number)
], ProcessFileRead.prototype, "processVersionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => monitored_file_entity_1.MonitoredFile, (file) => file.fileRead),
    (0, typeorm_1.JoinColumn)({ name: `monitored_file_id` }),
    __metadata("design:type", Number)
], ProcessFileRead.prototype, "monitoredFileId", void 0);
ProcessFileRead = __decorate([
    (0, typeorm_1.Index)(`VERSION_MONITORED_FILE_IDS`, [`processVersionId`, `monitoredFileId`], {
        unique: true,
    }),
    (0, typeorm_1.Entity)(`process_file_reads`)
], ProcessFileRead);
exports.ProcessFileRead = ProcessFileRead;
