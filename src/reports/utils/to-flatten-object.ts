import { SystemEvent } from "../../entities/system_events.entity";

export const toFlattenObject = (obj: SystemEvent, prefix: string = '') => {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    const newKey = prefix ? `${prefix}_${key}` : key;

    if (value instanceof Date) {
      result[newKey] = value.toISOString().replace('T', ' ').replace('.000Z', '');
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, toFlattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  }
  return result;
}