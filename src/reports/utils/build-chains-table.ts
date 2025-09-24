import { TableData, TChains } from "../report.types";

export const buildChainsTable = (chains: TChains[]): TableData => {
  const headers: string[] = [`Глубина`, "Цепочка", "Дата создания"]
  const rows: string[][] = chains.map(c => [String(c.chainDepth), c.pathChain.join(' -> '), c.createdAt]),
  return {
    headers,
    rows
  }
}