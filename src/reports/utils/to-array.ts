import { TChains } from "../report.types"

export const toArray = (chainsArray: TChains[]) => {
  return chainsArray.map((chain) => [
    String(chain.chainDepth),
    chain.pathChain.join(' -> '),
    chain.createdAt,
  ])
}