export const getPreset = (config: any, presetName: string) => {
  config[presetName]
}


type TConfig = {
  table_id: string
  default_preset: string
  presets: []
}

type TPreset = {
  presetName: string
  name: string
  headers: []
  exceptions:
}
type THeader = {
  text: string
  value: string
  sortable: boolean
  isVisible: boolean
  width: number
}
type TExceptions = {
  filePath: string[]
  inode: string[] | number[]
}