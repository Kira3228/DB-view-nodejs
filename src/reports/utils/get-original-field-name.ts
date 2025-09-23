export const getOriginalFieldNameHelper = (displayName: string) => {
  const fieldMap: Record<string, string> = {
    'ID события': 'id',
    'Тип события': 'eventType',
    'Данные события': 'eventData',
    'Важность': 'severity',
    'Источник': 'source',
    'Время события': 'timestamp',
    'ID процесса': 'ProcessId_id',
    'PID процесса': 'pid',
    'Путь к исполняемому файлу': 'executablePath',
    'Командная строка': 'commandLine',
    'Родительский PID': 'parentPid',
    'ID группы': 'groupId',
    'Дата создания процесса': 'ProcessId_createdAt',
    'Время запуска': 'processStartTime',
    'ID файла': 'FileId_id',
    'ID файловой системы': 'fileSystemId',
    'Inode': 'inode',
    'Путь к файлу': 'filePath',
    'Имя файла': 'fileName',
    'Размер файла': 'fileSize',
    'Дата создания файла': 'FileId_createdAt',
    'Дата изменения': 'modifiedAt',
    'Родоначальник': 'isOriginalMarked',
    'Макс. глубина цепочки': 'maxChainDepth',
    'Мин. глубина цепочки': 'minChainDepth',
    'Статус файла': 'status',
    'Дополнительные атрибуты': 'extendedAttributes'
  };
  return fieldMap[displayName] || displayName.toLowerCase().replace(/\s+/g, '');
}