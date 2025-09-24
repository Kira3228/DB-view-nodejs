export const exceptionsToArray = (exceptions?: string): string[] => {
  return exceptions ? exceptions.split('\n').map(s => s.trim()).filter(Boolean) : [];
}