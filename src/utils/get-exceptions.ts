import { TPreset } from "./get-presets";

export const getFilters = (preset: TPreset, field: string, rule: `exceptions` | `default_filters`) => {
  if (!preset || !preset[rule]) {
    return []; // или другое значение по умолчанию
  }
  if (!Array.isArray(preset[rule])) {
    return []; // или другое значение по умолчанию
  }
  const exception = preset[rule].find(f => f.field === field)
  return exception ? exception.values : []
}