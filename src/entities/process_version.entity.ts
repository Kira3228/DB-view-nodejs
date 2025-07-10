import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Process } from './process.entity';
import { FileAccessEvent } from './file_access_events.entity';
import { FileRelationship } from './file_relationships.entity';
import { ProcessFileRead } from './process_file_reads.entity';
@Index('idx_process_versions_process', ['process'])
@Index('PROCESS_ID_VER_NUM', [`process`, `versionNumber`], {
  unique: true,
})
@Entity('process_versions')
export class ProcessVersion {
  @PrimaryGeneratedColumn()
  id: number;
  @ManyToOne(() => Process, (process) => process.versions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: `process_id` })
  process: Process;

  @Column({ name: `version_number`, type: `integer` })
  versionNumber: number;

  @Column({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
  @Column({
    name: 'working_directory',
    type: 'text',
    nullable: true,
  })
  workingDirectory: string;
  @Column({
    type: 'text',
    nullable: true,
  })
  environment: string;
  @Column({
    name: 'environment_hash',
    type: 'text',
    nullable: true,
  })
  environmentHash: string;

  @OneToMany(() => FileAccessEvent, (access) => access.version)
  access: FileAccessEvent[];

  @OneToMany(() => FileRelationship, (file) => file.version)
  relationship: FileRelationship[];

  @OneToMany(() => ProcessFileRead, (file) => file.processVersionId)
  fileRead: ProcessFileRead[];
}
