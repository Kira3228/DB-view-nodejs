"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.field = exports.testFields = void 0;
exports.testFields = [
    { key: `id`, title: `id` },
    { key: `eventData`, title: `id` },
    { key: `eventType`, title: `id` },
    { key: `relatedFileId`, title: `id`, nestedFileProp: { key: "fileName", title: `Имя файла` } },
    { key: `relatedProcessId`, title: `id`, nestedProcessProp: { key: "groupId", title: `Id Группы` } },
    { key: `severity`, title: `id` },
    { key: `source`, title: `id` },
    { key: `timestamp`, title: `id` },
];
exports.field = {
    timestamp: true,
    id: true,
    eventType: true,
    relatedProcessId: {
        pid: true,
        id: true,
        createdAt: true
    },
    relatedFileId: {
        createdAt: true,
        fileName: true,
        filePath: true
    }
};
