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
exports.ProcessVersion = void 0;
const typeorm_1 = require("typeorm");
const process_entity_1 = require("./process.entity");
const file_access_events_entity_1 = require("./file_access_events.entity");
const file_relationships_entity_1 = require("./file_relationships.entity");
const process_file_reads_entity_1 = require("./process_file_reads.entity");
let ProcessVersion = class ProcessVersion {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ProcessVersion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => process_entity_1.Process, (process) => process.versions, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: `process_id` }),
    __metadata("design:type", process_entity_1.Process)
], ProcessVersion.prototype, "process", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: `version_number`, type: `integer` }),
    __metadata("design:type", Number)
], ProcessVersion.prototype, "versionNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'created_at',
        type: 'datetime',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], ProcessVersion.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'working_directory',
        type: 'text',
        nullable: true,
    }),
    __metadata("design:type", String)
], ProcessVersion.prototype, "workingDirectory", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
    }),
    __metadata("design:type", String)
], ProcessVersion.prototype, "environment", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'environment_hash',
        type: 'text',
        nullable: true,
    }),
    __metadata("design:type", String)
], ProcessVersion.prototype, "environmentHash", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => file_access_events_entity_1.FileAccessEvent, (access) => access.version),
    __metadata("design:type", Array)
], ProcessVersion.prototype, "access", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => file_relationships_entity_1.FileRelationship, (file) => file.version),
    __metadata("design:type", Array)
], ProcessVersion.prototype, "relationship", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => process_file_reads_entity_1.ProcessFileRead, (file) => file.processVersionId),
    __metadata("design:type", Array)
], ProcessVersion.prototype, "fileRead", void 0);
ProcessVersion = __decorate([
    (0, typeorm_1.Index)('idx_process_versions_process', ['process']),
    (0, typeorm_1.Index)('PROCESS_ID_VER_NUM', [`process`, `versionNumber`], {
        unique: true,
    }),
    (0, typeorm_1.Entity)('process_versions')
], ProcessVersion);
exports.ProcessVersion = ProcessVersion;
