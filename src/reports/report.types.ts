export type TableHeader = {
  text: string
  style: string
};


export type DeepPartialFlags<T> = {
  [K in keyof T]?:
  T[K] extends object
  ? DeepPartialFlags<T[K]>
  : boolean | string;
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