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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUser = exports.getUsers = exports.createUser = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userRepository = (0, typeorm_1.getRepository)(user_entity_1.User);
        const user = userRepository.create(req.body);
        const results = yield userRepository.save(user);
        return res.status(201).json(results);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.createUser = createUser;
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`БАМ БАМ`);
        const userRepository = (0, typeorm_1.getRepository)(user_entity_1.User);
        const users = yield userRepository.find();
        return res.status(200).json(users);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.getUsers = getUsers;
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userRepository = (0, typeorm_1.getRepository)(user_entity_1.User);
        const user = yield userRepository.findOne(req.params.id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        return res.status(200).json(user);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.getUser = getUser;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userRepository = (0, typeorm_1.getRepository)(user_entity_1.User);
        const user = yield userRepository.findOne(req.params.id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        userRepository.merge(user, req.body);
        const results = yield userRepository.save(user);
        return res.status(200).json(results);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.updateUser = updateUser;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userRepository = (0, typeorm_1.getRepository)(user_entity_1.User);
        const user = yield userRepository.findOne(req.params.id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        yield userRepository.remove(user);
        return res.status(200).json({ message: "User deleted successfully" });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.deleteUser = deleteUser;
