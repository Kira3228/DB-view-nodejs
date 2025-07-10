import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProcessVersion } from './process_version.entity';
import { MonitoredFile } from './monitored_file.entity';
@Index(`VERSION_MONITORED_FILE_IDS`, [`processVersionId`, `monitoredFileId`], {
  unique: true,
})
@Entity(`process_file_reads`)
export class ProcessFileRead {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({
    name: `first_read_at`,
    type: `datetime`,
    default: () => `CURRENT_TIMESTAMP`,
  })
  firstReadAt: Date;
  @Column({
    name: `last_read_at`,
    type: `datetime`,
    default: () => `CURRENT_TIMESTAMP`,
  })
  lastReadAt: Date;

  @Column({ name: `read_count`, type: `integer`, default: 1 })
  readCount: number;
  @Column({ name: `total_bytes_read`, type: `integer`, default: 0 })
  totalBytesRead: number;

  @ManyToOne(() => ProcessVersion, (version) => version.fileRead)
  @JoinColumn({ name: `process_version_id` })
  processVersionId: number;
  @ManyToOne(() => MonitoredFile, (file) => file.fileRead)
  @JoinColumn({ name: `monitored_file_id` })
  monitoredFileId: number;
}
