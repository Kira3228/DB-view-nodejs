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
exports.FileRelationship = void 0;
const typeorm_1 = require("typeorm");
const monitored_file_entity_1 = require("./monitored_file.entity");
const process_version_entity_1 = require("./process_version.entity");
let FileRelationship = class FileRelationship {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], FileRelationship.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: `relationship_type`, type: `text`, default: '`derived`' }),
    __metadata("design:type", String)
], FileRelationship.prototype, "relationshipType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: `created_at`,
        type: `datetime`,
        default: () => `CURRENT_TIMESTAMP`,
    }),
    __metadata("design:type", Date)
], FileRelationship.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parent_file_id' }),
    __metadata("design:type", Number)
], FileRelationship.prototype, "parentFileId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'child_file_id' }),
    __metadata("design:type", Number)
], FileRelationship.prototype, "childFileId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => monitored_file_entity_1.MonitoredFile, (file) => file.parentRelations),
    (0, typeorm_1.JoinColumn)({ name: `parent_file_id` }),
    __metadata("design:type", monitored_file_entity_1.MonitoredFile)
], FileRelationship.prototype, "parentFile", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => monitored_file_entity_1.MonitoredFile, (file) => file.childRelations),
    (0, typeorm_1.JoinColumn)({ name: `child_file_id` }),
    __metadata("design:type", monitored_file_entity_1.MonitoredFile)
], FileRelationship.prototype, "childFile", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => process_version_entity_1.ProcessVersion, (version) => version.relationship),
    (0, typeorm_1.JoinColumn)({ name: `process_version_id` }),
    __metadata("design:type", process_version_entity_1.ProcessVersion)
], FileRelationship.prototype, "version", void 0);
FileRelationship = __decorate([
    (0, typeorm_1.Index)('idx_file_relationships_parent', ['parentFile']),
    (0, typeorm_1.Index)('idx_file_relationships_child', ['childFile']),
    (0, typeorm_1.Index)(`PARENT_ID_CHILD_FILE_ID_RELATIONSHIP_TYPE`, [`parentFile`, `childFile`, `version`], {
        unique: true,
    }),
    (0, typeorm_1.Entity)(`file_relationships`)
], FileRelationship);
exports.FileRelationship = FileRelationship;
