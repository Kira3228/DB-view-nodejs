import { getRepository } from 'typeorm';
import { User } from '../entities/user.entity';
// import { getDBConnection } from '../database';

export class UserService {
    private userRepository = getRepository(User);
    async getAllUsers() {
        return this.userRepository.find();
    }

    
}