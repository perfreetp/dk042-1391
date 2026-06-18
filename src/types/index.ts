export type VerifyStatus = 'pass' | 'review' | 'reject';

export type ReportStatus = 'pending' | 'processing' | 'resolved' | 'closed';

export type ReportType = 'blur_plate' | 'serial_mismatch' | 'no_record' | 'other';

export interface AircraftPosition {
  aircraftNo: string;
  position: string;
}

export interface PartInfo {
  id: string;
  serialNumber: string;
  partNumber: string;
  partName: string;
  isLifeControlled: boolean;
  remainingHours: number;
  remainingCycles: number;
  maxHours: number;
  maxCycles: number;
  hasMELRestriction: boolean;
  melReference?: string;
  hasCDLRestriction: boolean;
  cdlReference?: string;
  lastInstalledBy: string;
  lastInstalledAt: string;
  manufacturer: string;
  installDate: string;
}

export interface VerifyRecord {
  id: string;
  serialNumber: string;
  partName: string;
  partNumber: string;
  aircraftNo: string;
  position: string;
  status: VerifyStatus;
  statusText: string;
  verifiedBy: string;
  verifiedAt: string;
  flightNo?: string;
  remark?: string;
  remainingHours: number;
  remainingCycles: number;
  hasMELRestriction: boolean;
  hasCDLRestriction: boolean;
}

export interface ReportRecord {
  id: string;
  reportNo: string;
  type: ReportType;
  typeText: string;
  serialNumber?: string;
  partNumber?: string;
  partName?: string;
  flightNo: string;
  parkingPosition: string;
  aircraftNo: string;
  photos: string[];
  remark?: string;
  reportedBy: string;
  reportedAt: string;
  status: ReportStatus;
  statusText: string;
  handler?: string;
  handleRemark?: string;
  handledAt?: string;
}

export interface UserInfo {
  id: string;
  name: string;
  employeeNo: string;
  role: string;
  department: string;
  phone: string;
}

export interface DailyStats {
  totalVerify: number;
  passCount: number;
  reviewCount: number;
  rejectCount: number;
  reportCount: number;
}
