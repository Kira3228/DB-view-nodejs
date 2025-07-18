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
exports.Process = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const process_version_entity_1 = require("./process_version.entity");
const system_events_entity_1 = require("./system_events.entity");
let Process = class Process {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Process.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer' }),
    __metadata("design:type", Number)
], Process.prototype, "pid", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'executable_path', type: 'text' }),
    __metadata("design:type", String)
], Process.prototype, "executablePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'command_line', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Process.prototype, "commandLine", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parent_pid', type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Process.prototype, "parentPid", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'group_id', type: 'integer' }),
    __metadata("design:type", Number)
], Process.prototype, "groupId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'created_at',
        type: 'datetime',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], Process.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'process_start_time', type: 'datetime' }),
    __metadata("design:type", Date)
], Process.prototype, "processStartTime", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => process_version_entity_1.ProcessVersion, (versions) => versions.process),
    __metadata("design:type", Array)
], Process.prototype, "versions", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => { user.processes; }, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Process.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => system_events_entity_1.SystemEvent, (event) => event.relatedProcessId),
    __metadata("design:type", Array)
], Process.prototype, "systemEvents", void 0);
Process = __decorate([
    (0, typeorm_1.Entity)('processes')
], Process);
exports.Process = Process;
