export interface Engineer {
  id: string;
  name: string;
  emp_code?: string;
  name_as_per_bank?: string;
  designation?: string;
  mobile: string;
  email: string;
  active: boolean;
  password?: string; // Predefined or set password
  resigned?: boolean;
  resignation_date?: string;
  location?: string;
  address?: string;
  work_profile?: string;
  education?: string;
  computer_certificate?: string;
  experience?: string;
  photo?: string; // Base64 or image URL
  joining_date?: string;
  paid_leaves_taken?: number;
  lwp_taken?: number;
  leave_balance?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Ticket {
  id: string;
  ticket_id: string;
  date: string;
  username: string;
  contact: string;
  location: string;
  product: string;
  category: string;
  brand: string;
  model: string;
  serial_number: string;
  problem: string;
  engineer: string; // Assigned engineer name or ID
  action_taken: string;
  first_visit_date: string;
  hold_date: string;
  close_date: string;
  status: 'Open' | 'Hold' | 'Closed';
  engineer_remark: string;
  resolution_days?: number | null;
  created_at: string;
  updated_at: string;
}

export type ViewRole = 'Admin' | 'Engineer';

export type AdminTab = 'Dashboard' | 'CreateTicket' | 'TicketsList' | 'ManageEngineers' | 'LocationsList' | 'Analytics' | 'Attendance' | 'LiveTracker';

export type EngineerTab = 'Dashboard' | 'MyTickets' | 'VisitHistory';

export type AttendanceStatus = 'P' | 'A' | 'L' | 'LPW' | 'LWP' | 'WO' | 'H' | 'HD' | '';

export interface AttendanceRecord {
  id: string;
  engineerId: string;
  engineerName: string;
  empCode?: string;
  nameAsPerBank?: string;
  designation?: string;
  location?: string;
  joiningDate?: string;
  paidLeavesTaken?: number;
  leaveWithoutPayTaken?: number;
  leaveBalanceAsOnDate?: number;
  deductionDays?: number;
  payableSalaryDays?: number;
  currentLeaveBalance?: number;
  year: number;
  month: number; // 1-12
  days: { [day: number]: AttendanceStatus };
}

export interface GPSTrackPoint {
  lat: number;
  lng: number;
  timestamp: string; // HH:mm:ss
  speedKmH: number;
  accuracyMeters: number;
  batteryPercent: number;
  isMock: boolean;
  networkStatus: 'Online' | 'Offline';
}

export interface LocationVisit {
  id: string;
  journeyId?: string;
  engineerId: string;
  engineerName: string;
  ticketId?: string;
  ticketNumber?: string;
  startLocationName: string;
  startCoords?: { lat: number; lng: number };
  destinationLocationName: string;
  destinationCoords?: { lat: number; lng: number };
  distanceKm: number;
  distanceMiles: number;
  visitDate: string; // YYYY-MM-DD
  visitTime: string; // HH:mm
  startTime?: string;
  endTime?: string;
  totalDurationMins?: number;
  progressPercent?: number;
  avgSpeedKmH?: number;
  maxSpeedKmH?: number;
  trafficDelayMins?: number;
  etaMins?: number;
  stopsCount?: number;
  geofenceEntered?: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  siteDurationMins?: number;
  gpsAccuracyMeters?: number;
  deviceBatteryPercent?: number;
  mockGpsDetected?: boolean;
  networkStatus?: 'Online' | 'Offline';
  gpsTrackPoints?: GPSTrackPoint[];
  notes?: string;
  status?: 'Started' | 'In Progress' | 'Arrived' | 'Completed';
  created_at: string;
}

