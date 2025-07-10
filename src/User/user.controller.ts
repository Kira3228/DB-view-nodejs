import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { User } from "../entities/user.entity";

export const createUser = async (req: Request, res: Response) => {
    try {
        const userRepository = getRepository(User);
        const user = userRepository.create(req.body);
        const results = await userRepository.save(user);
        return res.status(201).json(results);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        console.log(`БАМ БАМ`)
        const userRepository = getRepository(User);
        const users = await userRepository.find();
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getUser = async (req: Request, res: Response) => {
    try {
        const userRepository = getRepository(User);
        const user = await userRepository.findOne(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const userRepository = getRepository(User);
        const user = await userRepository.findOne(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        userRepository.merge(user, req.body);
        const results = await userRepository.save(user);
        return res.status(200).json(results);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const userRepository = getRepository(User);
        const user = await userRepository.findOne(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        await userRepository.remove(user);
        return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

