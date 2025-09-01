import { TPreset } from "./get-presets";

export const getExceptions = (preset: TPreset, field: string) => {
  const exception = preset.exceptions.find(f => f.field === field)
  return exception ? exception.values : []
}