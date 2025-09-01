import { NotFoundError } from "../errors/http-errors"

export const getPreset = (config: TConfig, presetName?: string): TPreset => {
  const targetPresetName = presetName || config.default_preset
  const preset = config.presets.find(p => p.presetName === targetPresetName)

  if (!preset) {
    throw new NotFoundError()
  }
  return preset
}

export type TConfig = {
  table_id: string
  default_preset: string
  presets: TPreset[]
}

export type TPreset = {
  presetName: string
  name: string
  headers: THeader[]
  exceptions: TExceptions[]
  default_filters: Record<string, any>
}

type THeader = {
  text: string
  value: string
  sortable: boolean
  isVisible: boolean
  width: number
  align?: string
}

type TExceptions = {
  field: string
  values: Array<string | number>
}