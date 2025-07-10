
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Process } from './process.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'username', type: 'text', unique: true })
  userName: string;

  @Column({ name: 'uid', type: 'integer', unique: true })
  uid: number;

  @Column({ name: 'gid', type: 'integer' })
  gid: number;

  @Column({ name: 'home_directory', type: 'text', nullable: true })
  homeDirectory: string;

  @Column({ name: 'shell', type: 'text', nullable: true })
  shell: string;

  @Column({ name: 'full_name', type: 'text' })
  fullName: string;

  @Column({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @OneToMany(() => Process, (processes) => processes.user, { cascade: true })
  processes: Process[];
}
