import { BaseFilters } from "../../shared/interfaces/common.interface";

export interface ActiveFileFilters extends BaseFilters {
  filePath?: string
  inode?: number
  filePathException?: string[]
  processPathException?: string[]
  page?: number
  limit?: number
}

export interface RelationshipGraph {
  nodes: any[]
  edges: GraphEdge[]
  roots: number[]
}

export interface GraphEdge {
  type: string
  fromId: number
  toId: number
  createdAt: Date
}