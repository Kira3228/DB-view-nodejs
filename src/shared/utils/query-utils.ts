export const parsePathExceptions = (raw?: string): string[] => {
  console.log(raw);

  if (!raw || typeof raw !== `string`) return []
  return raw.split(';').map(s => s.trim()).filter(Boolean)
}
