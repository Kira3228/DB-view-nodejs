import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToMany,
} from 'typeorm';
import { FileAccessEvent } from './file_access_events.entity';
import { FileRelationship } from './file_relationships.entity';
import { FileOrigin } from './file_origins.entity';
import { SystemEvent } from './system_events.entity';
import { ProcessFileRead } from './process_file_reads.entity';
@Index('idx_monitored_files_inode', ['inode'])
@Index('idx_monitored_files_path', ['filePath'])
@Index('idx_monitored_files_original', ['isOriginalMarked'])
@Index('IDX_MONITORED_FILES_INODE_PATH', ['inode', 'filePath'], {
  unique: true,
})
@Entity('monitored_files')
export class MonitoredFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'filesystem_id', type: 'text' })
  fileSystemId: string;

  @Column({ type: 'integer' })
  inode: number;

  @Column({ name: 'file_path', type: 'text' })
  filePath: string;

  @Column({ name: 'file_name', type: 'text' })
  fileName: string;

  @Column({ name: 'file_size', type: 'integer', default: 0 })
  fileSize: number;

  @Column({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    name: 'modified_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  modifiedAt: Date;

  @Column({
    name: 'is_original_marked',
    type: 'boolean',
    default: false,
  })
  isOriginalMarked: boolean;

  @Column({
    name: 'max_chain_depth',
    type: 'integer',
    default: 0,
  })
  maxChainDepth: number;

  @Column({
    name: 'min_chain_depth',
    type: 'integer',
    default: 0,
  })
  minChainDepth: number;

  @Column({
    type: 'text',
    default: 'active',
  })
  status: 'active' | 'archived' | 'deleted';

  @Column({
    name: 'extended_attributes',
    type: 'text',
    nullable: true,
  })
  extendedAttributes: string;

  @OneToMany(() => FileAccessEvent, (access) => access.file)
  access: FileAccessEvent[];

  @OneToMany(() => FileRelationship, (file) => file.parentId)
  parentRelation: FileRelationship[];
  @OneToMany(() => FileRelationship, (file) => file.childrenId)
  childRelation: FileRelationship[];

  @OneToMany(() => FileOrigin, (origin) => origin.file)
  origins: FileOrigin[];
  @OneToMany(() => FileOrigin, (origins) => origins.originFile)
  descendants: FileOrigin[];

  @OneToMany(() => ProcessFileRead, (file) => file.monitoredFileId)
  fileRead: ProcessFileRead[];

  @OneToMany(() => SystemEvent, (event) => event.relatedFileId)
  systemEvents: SystemEvent[];
}
