import type { AttendanceRecord } from '../types';

export const calculateAttendanceRate = (record: AttendanceRecord) => {
  const opened = Math.max(record.timesOpened, 0);
  const present = Math.max(record.timesPresent, 0);

  if (opened === 0) return 0;
  return Number(((present / opened) * 100).toFixed(1));
};

export const mergeAttendanceRecords = (existing: AttendanceRecord[], incoming: AttendanceRecord[]) => {
  const mergedMap = new Map(existing.map((record) => [record.id, record]));

  incoming.forEach((record) => {
    const candidateIndex = existing.findIndex(
      (current) =>
        current.id === record.id ||
        (current.studentId === record.studentId && current.termId === record.termId)
    );

    if (candidateIndex >= 0) {
      mergedMap.set(existing[candidateIndex].id, record);
      return;
    }

    mergedMap.set(record.id, record);
  });

  return Array.from(mergedMap.values());
};

export const saveAttendance = (existing: AttendanceRecord[], incoming: AttendanceRecord[]) => {
  return mergeAttendanceRecords(existing, incoming);
};
