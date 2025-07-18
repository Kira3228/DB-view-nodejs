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
exports.MonitoredFile = void 0;
const typeorm_1 = require("typeorm");
const file_access_events_entity_1 = require("./file_access_events.entity");
const file_relationships_entity_1 = require("./file_relationships.entity");
const file_origins_entity_1 = require("./file_origins.entity");
const system_events_entity_1 = require("./system_events.entity");
const process_file_reads_entity_1 = require("./process_file_reads.entity");
let MonitoredFile = class MonitoredFile {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MonitoredFile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'filesystem_id', type: 'text' }),
    __metadata("design:type", String)
], MonitoredFile.prototype, "fileSystemId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer' }),
    __metadata("design:type", Number)
], MonitoredFile.prototype, "inode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_path', type: 'text' }),
    __metadata("design:type", String)
], MonitoredFile.prototype, "filePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_name', type: 'text' }),
    __metadata("design:type", String)
], MonitoredFile.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_size', type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], MonitoredFile.prototype, "fileSize", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'created_at',
        type: 'datetime',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], MonitoredFile.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'modified_at',
        type: 'datetime',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], MonitoredFile.prototype, "modifiedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'is_original_marked',
        type: 'boolean',
        default: false,
    }),
    __metadata("design:type", Boolean)
], MonitoredFile.prototype, "isOriginalMarked", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'max_chain_depth',
        type: 'integer',
        default: 0,
    }),
    __metadata("design:type", Number)
], MonitoredFile.prototype, "maxChainDepth", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'min_chain_depth',
        type: 'integer',
        default: 0,
    }),
    __metadata("design:type", Number)
], MonitoredFile.prototype, "minChainDepth", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        default: 'active',
    }),
    __metadata("design:type", String)
], MonitoredFile.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'extended_attributes',
        type: 'text',
        nullable: true,
    }),
    __metadata("design:type", String)
], MonitoredFile.prototype, "extendedAttributes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => file_access_events_entity_1.FileAccessEvent, (access) => access.file),
    __metadata("design:type", Array)
], MonitoredFile.prototype, "access", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => file_relationships_entity_1.FileRelationship, (file) => file.parentFile),
    __metadata("design:type", Array)
], MonitoredFile.prototype, "parentRelations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => file_relationships_entity_1.FileRelationship, (file) => file.childFile),
    __metadata("design:type", Array)
], MonitoredFile.prototype, "childRelations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => file_origins_entity_1.FileOrigin, (origin) => origin.file),
    __metadata("design:type", Array)
], MonitoredFile.prototype, "origins", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => file_origins_entity_1.FileOrigin, (origins) => origins.originFile),
    __metadata("design:type", Array)
], MonitoredFile.prototype, "descendants", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => process_file_reads_entity_1.ProcessFileRead, (file) => file.monitoredFileId),
    __metadata("design:type", Array)
], MonitoredFile.prototype, "fileRead", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => system_events_entity_1.SystemEvent, (event) => event.relatedFileId),
    __metadata("design:type", Array)
], MonitoredFile.prototype, "systemEvents", void 0);
MonitoredFile = __decorate([
    (0, typeorm_1.Index)('idx_monitored_files_inode', ['inode']),
    (0, typeorm_1.Index)('idx_monitored_files_path', ['filePath']),
    (0, typeorm_1.Index)('idx_monitored_files_original', ['isOriginalMarked']),
    (0, typeorm_1.Index)('IDX_MONITORED_FILES_INODE_PATH', ['inode', 'filePath'], {
        unique: true,
    }),
    (0, typeorm_1.Entity)('monitored_files')
], MonitoredFile);
exports.MonitoredFile = MonitoredFile;
