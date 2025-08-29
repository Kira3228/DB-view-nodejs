import { MonitoredFile } from "../entities/monitored_file.entity";

export interface INode {
  file: MonitoredFile,
  edges: Edge[]
}
interface Edge {
  type: string
  to: INode
  createdAt: Date
}