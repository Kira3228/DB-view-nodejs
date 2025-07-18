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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const process_entity_1 = require("./process.entity");
let User = class User {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'username', type: 'text', unique: true }),
    __metadata("design:type", String)
], User.prototype, "userName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uid', type: 'integer', unique: true }),
    __metadata("design:type", Number)
], User.prototype, "uid", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'gid', type: 'integer' }),
    __metadata("design:type", Number)
], User.prototype, "gid", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'home_directory', type: 'text', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "homeDirectory", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shell', type: 'text', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "shell", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'full_name', type: 'text' }),
    __metadata("design:type", String)
], User.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'created_at',
        type: 'datetime',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => process_entity_1.Process, (processes) => processes.user, { cascade: true }),
    __metadata("design:type", Array)
], User.prototype, "processes", void 0);
User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
exports.User = User;
