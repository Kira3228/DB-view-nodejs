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
@Index('idx_file_relationships_parent', ['parentId'])
@Index('idx_file_relationships_child', ['childrenId'])
@Index(
  `PARENT_ID_CHILD_FILE_ID_RELATIONSHIP_TYPE`,
  [`parentId`, `childrenId`, `version`],
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

  @ManyToOne(() => MonitoredFile, (file) => file.parentRelation)
  @JoinColumn({ name: `parent_file_id` })
  parentId: MonitoredFile;

  @ManyToOne(() => MonitoredFile, (file) => file.childRelation)
  @JoinColumn({ name: `child_file_id` })
  childrenId: MonitoredFile;

  @ManyToOne(() => ProcessVersion, (version) => version.relationship)
  @JoinColumn({ name: `process_version_id` })
  version: ProcessVersion;
}
