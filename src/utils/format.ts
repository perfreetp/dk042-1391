import dayjs from 'dayjs';

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

export const formatDate = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const formatTime = (date: string | Date): string => {
  return dayjs(date).format('HH:mm');
};

export const formatHours = (hours: number): string => {
  return `${hours.toFixed(1)} FH`;
};

export const formatCycles = (cycles: number): string => {
  return `${cycles} FC`;
};

export const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    pass: '可放行',
    review: '需复核',
    reject: '禁止放行',
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭'
  };
  return map[status] || status;
};

export const getReportTypeText = (type: string): string => {
  const map: Record<string, string> = {
    blur_plate: '铭牌模糊',
    serial_mismatch: '序号不符',
    no_record: '系统无记录',
    other: '其他异常'
  };
  return map[type] || type;
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const generateReportNo = (): string => {
  const dateStr = dayjs().format('YYYYMMDD');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RPT${dateStr}${random}`;
};
