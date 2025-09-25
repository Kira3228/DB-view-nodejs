import { SystemEvent } from "../../entities/system_events.entity";
import { DeepPartialFlags, TableHeader } from "../report.types";

const addFieldConditionally = (
  fieldConfig: DeepPartialFlags<SystemEvent>,
  fieldName: string,
  entityPrefix: string,
  displayName: string,
  selectFields: string[],
  fieldNames: { text: string; style: string }[]
) => {
  if (fieldConfig[fieldName]) {
    selectFields.push(`${entityPrefix}.${fieldName}`);
    fieldNames.push({ text: displayName, style: 'tableHeader' });
  }
}

export const buildEventSelectHelper = (field: DeepPartialFlags<SystemEvent>) => {
  const selectFields: string[] = [];
  const fieldNames: TableHeader[] = [];
  addFieldConditionally(field, 'id', 'event', 'ID события', selectFields, fieldNames);
  addFieldConditionally(field, 'eventType', 'event', 'Тип события', selectFields, fieldNames);
  addFieldConditionally(field, 'eventData', 'event', 'Данные события', selectFields, fieldNames);
  addFieldConditionally(field, 'severity', 'event', 'Важность', selectFields, fieldNames);
  addFieldConditionally(field, 'source', 'event', 'Источник', selectFields, fieldNames);
  addFieldConditionally(field, 'timestamp', 'event', 'Время события', selectFields, fieldNames);

  if (field.relatedProcessId) {
    addFieldConditionally(field.relatedProcessId, 'id', 'process', 'ID процесса', selectFields, fieldNames);
    addFieldConditionally(field.relatedProcessId, 'pid', 'process', 'PID процесса', selectFields, fieldNames);
    addFieldConditionally(field.relatedProcessId, 'executablePath', 'process', 'Путь к исполняемому файлу', selectFields, fieldNames);
    addFieldConditionally(field.relatedProcessId, 'commandLine', 'process', 'Командная строка', selectFields, fieldNames);
    addFieldConditionally(field.relatedProcessId, 'parentPid', 'process', 'Родительский PID', selectFields, fieldNames);
    addFieldConditionally(field.relatedProcessId, 'groupId', 'process', 'ID группы', selectFields, fieldNames);
    addFieldConditionally(field.relatedProcessId, 'createdAt', 'process', 'Дата создания процесса', selectFields, fieldNames);
    addFieldConditionally(field.relatedProcessId, 'processStartTime', 'process', 'Время запуска', selectFields, fieldNames);
  }

  if (field.relatedFileId) {
    addFieldConditionally(field.relatedFileId, 'id', 'file', 'ID файла', selectFields, fieldNames);
    addFieldConditionally(field.relatedFileId, 'fileSystemId', 'file', 'ID файловой системы', selectFields, fieldNames);
    addFieldConditionally(field.relatedFileId, 'inode', 'file', 'Inode', selectFields, fieldNames);
    addFieldConditionally(field.relatedFileId, 'filePath', 'file', 'Путь к файлу', selectFields, fieldNames);
    addFieldConditionally(field.relatedFileId, 'fileName', 'file', 'Имя файла', selectFields, fieldNames);
    addFieldConditionally(field.relatedFileId, 'fileSize', 'file', 'Размер файла', selectFields, fieldNames);
    addFieldConditionally(field.relatedFileId, 'createdAt', 'file', 'Дата создания файла', selectFields, fieldNames);
    addFieldConditionally(field.relatedFileId, 'modifiedAt', 'file', 'Дата изменения', selectFields, fieldNames);
    addFieldConditionally(field.relatedFileId, 'isOriginalMarked', 'file', 'Родоначальник', selectFields, fieldNames);
    addFieldConditionally(field.relatedFileId, 'maxChainDepth', 'file', 'Макс. глубина цепочки', selectFields, fieldNames);
    addFieldConditionally(field.relatedFileId, 'minChainDepth', 'file', 'Мин. глубина цепочки', selectFields, fieldNames);
    addFieldConditionally(field.relatedFileId, 'status', 'file', 'Статус файла', selectFields, fieldNames);
    addFieldConditionally(field.relatedFileId, 'extendedAttributes', 'file', 'Дополнительные атрибуты', selectFields, fieldNames);
  }
  return { selectFields, fieldNames };

}