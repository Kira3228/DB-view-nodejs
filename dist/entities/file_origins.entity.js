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
exports.FileOrigin = void 0;
const typeorm_1 = require("typeorm");
const monitored_file_entity_1 = require("./monitored_file.entity");
let FileOrigin = class FileOrigin {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], FileOrigin.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: `origin_chain_length`, type: `integer` }),
    __metadata("design:type", Number)
], FileOrigin.prototype, "originChainLength", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: `discovered_at`,
        type: `datetime`,
        default: () => `CURRENT_TIMESTAMP`,
    }),
    __metadata("design:type", Date)
], FileOrigin.prototype, "discoveredAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => monitored_file_entity_1.MonitoredFile, (file) => file.origins),
    (0, typeorm_1.JoinColumn)({ name: `file_id` }),
    __metadata("design:type", monitored_file_entity_1.MonitoredFile)
], FileOrigin.prototype, "file", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => monitored_file_entity_1.MonitoredFile, (file) => file.descendants),
    (0, typeorm_1.JoinColumn)({ name: 'origin_file_id' }),
    __metadata("design:type", monitored_file_entity_1.MonitoredFile)
], FileOrigin.prototype, "originFile", void 0);
FileOrigin = __decorate([
    (0, typeorm_1.Index)('idx_file_origins_file', ['file']),
    (0, typeorm_1.Index)('idx_file_origins_origin', ['originFile']),
    (0, typeorm_1.Index)(`FILE_ORIGIN_FILE_IDS`, [`file`, `originFile`], {
        unique: true,
    }),
    (0, typeorm_1.Entity)(`file_origins`)
], FileOrigin);
exports.FileOrigin = FileOrigin;
