export type TableHeader = {
  text: string
  style: string
};



export type TChains = {
  ancestorId: number;
  ancestorPath: string;
  pathChain: string[];
  chainDepth: number;
  createdAt: string;
}


export type TableData = {
  headers: string[]
  rows: string[][]
}