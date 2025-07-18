import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MonitoredFile } from './monitored_file.entity';
import { ProcessVersion } from './process_version.entity';
@Index('idx_file_relationships_parent', ['parentFile'])
@Index('idx_file_relationships_child', ['childFile'])
@Index(
  `PARENT_ID_CHILD_FILE_ID_RELATIONSHIP_TYPE`,
  [`parentFile`, `childFile`, `version`],
  {
    unique: true,
  },
)
@Entity(`file_relationships`)
export class FileRelationship {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: `relationship_type`, type: `text`, default: '`derived`' })
  relationshipType: `derived` | `copied` | `modified` | `created_from`;

  @Column({
    name: `created_at`,
    type: `datetime`,
    default: () => `CURRENT_TIMESTAMP`,
  })
  createdAt: Date;
  
  @Column({ name: 'parent_file_id' })
  parentFileId: number;

  @Column({ name: 'child_file_id' })
  childFileId: number;
  @ManyToOne(() => MonitoredFile, (file) => file.parentRelations)
  @JoinColumn({ name: `parent_file_id` })
  parentFile: MonitoredFile;

  @ManyToOne(() => MonitoredFile, (file) => file.childRelations)
  @JoinColumn({ name: `child_file_id` })
  childFile: MonitoredFile;

  @ManyToOne(() => ProcessVersion, (version) => version.relationship)
  @JoinColumn({ name: `process_version_id` })
  version: ProcessVersion;
}
