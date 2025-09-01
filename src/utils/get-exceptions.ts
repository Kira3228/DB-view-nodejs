import { TPreset } from "./get-presets";

export const getFilters = (preset: TPreset, field: string, rule: `exceptions` | `default_filters`) => {
  const exception = preset[rule].find(f => f.field === field)
  return exception ? exception.values : []
}