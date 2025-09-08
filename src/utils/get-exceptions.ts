import { TPreset } from "./get-presets";

export const getFilters = (preset: TPreset, field: string, rule: `exceptions` | `default_filters`) => {
  if (!preset || !preset[rule]) {
    return []
  }
  if (!Array.isArray(preset[rule])) {
    return []
  }

  return preset[rule].find(f => f.field === field)
  // const exception = preset[rule].find(f => f.field === field)
  // return exception ? exception.values : []
}