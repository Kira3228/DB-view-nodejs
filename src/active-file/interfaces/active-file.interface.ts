import { BaseFilters, PaginationParams } from "../../shared/interfaces/common.interface";

export interface ActiveFileFilters extends BaseFilters, PaginationParams {
  filePath?: string
  inode?: number
  filePathException?: string[]
  processPathException?: string[]
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