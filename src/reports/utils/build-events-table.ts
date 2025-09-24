import { TableData } from "../report.types";

export const buildEventsTable = (headers: string[], rows: string[][]): TableData => {
  return {
    headers,
    rows
  }
}