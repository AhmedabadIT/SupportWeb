import React, { useState, useMemo } from 'react';
import { Ticket, Engineer } from '../types';
import * as XLSX from 'xlsx';
import { calculateDaysBetweenVisitAndClose } from '../utils/dateUtils';
import { normalizeModelString } from '../utils/modelNormalization';
import { 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Edit, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal,
  X,
  FileSpreadsheet,
  Upload,
  Check,
  Info,
  Trash2,
  History,
  Calendar,
  FileText,
  Copy,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ReportPeriodType = 'month' | 'quarter';

interface ReportPeriod {
  id: string;
  label: string;
  type: ReportPeriodType;
  months: number[]; // 0-indexed month indices (0 = Jan, 1 = Feb, etc.)
}

const reportPeriods: ReportPeriod[] = [
  // Quarters
  { id: 'q-feb-apr', label: 'Feb - Apr', type: 'quarter', months: [1, 2, 3] },
  { id: 'q-may-jul', label: 'May - Jul', type: 'quarter', months: [4, 5, 6] },
  { id: 'q-aug-oct', label: 'Aug - Oct', type: 'quarter', months: [7, 8, 9] },
  { id: 'q-nov-jan', label: 'Nov - Jan', type: 'quarter', months: [10, 11, 0] },
  
  // Months
  { id: 'm-0', label: 'January', type: 'month', months: [0] },
  { id: 'm-1', label: 'February', type: 'month', months: [1] },
  { id: 'm-2', label: 'March', type: 'month', months: [2] },
  { id: 'm-3', label: 'April', type: 'month', months: [3] },
  { id: 'm-4', label: 'May', type: 'month', months: [4] },
  { id: 'm-5', label: 'June', type: 'month', months: [5] },
  { id: 'm-6', label: 'July', type: 'month', months: [6] },
  { id: 'm-7', label: 'August', type: 'month', months: [7] },
  { id: 'm-8', label: 'September', type: 'month', months: [8] },
  { id: 'm-9', label: 'October', type: 'month', months: [9] },
  { id: 'm-10', label: 'November', type: 'month', months: [10] },
  { id: 'm-11', label: 'December', type: 'month', months: [11] },
];

const getTicketYearAndMonth = (t: Ticket): { year: string; monthIndex: number } | null => {
  // First, check if ticket_id is a 9-digit numeric string (e.g., 202602001)
  if (t.ticket_id) {
    const cleanId = t.ticket_id.trim();
    if (/^\d{9}$/.test(cleanId)) {
      const year = cleanId.substring(0, 4);
      const monthStr = cleanId.substring(4, 6);
      const monthIndex = parseInt(monthStr, 10) - 1; // 0-indexed month index (Jan = 0, Feb = 1, etc.)
      if (monthIndex >= 0 && monthIndex <= 11) {
        return { year, monthIndex };
      }
    }
  }

  // Second, check t.date fallback (standard format: YYYY-MM-DD)
  if (t.date) {
    const parts = t.date.split('-');
    if (parts.length >= 2) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1; // 0-indexed month index
      if (year.length === 4 && monthIndex >= 0 && monthIndex <= 11) {
        return { year, monthIndex };
      }
    }
  }

  return null;
};

const formatToCustomDate = (dateStr?: string) => {
  if (!dateStr || dateStr === 'N/A' || dateStr.trim() === '') return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    if (monthIndex >= 0 && monthIndex < 12 && !isNaN(day)) {
      return `${day} ${months[monthIndex]} ${year}`;
    }
  }
  
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
  } catch (e) {
    // ignore
  }
  return dateStr;
};

const formatTicketHorizontal = (t: Ticket): string => {
  const tid = t.ticket_id || '';
  const dateVal = t.date || '';
  const usernameVal = t.username || '';
  const contactVal = t.contact || '';
  const locationVal = t.location || '';
  const productVal = t.product || '';
  const categoryVal = t.category || '';
  const modelVal = t.model || '';
  const serialVal = t.serial_number || '';
  const problemVal = t.problem || '';
  const engineerVal = t.engineer || '';
  const actionVal = (t.action_taken === 'N/A' || !t.action_taken) ? '' : t.action_taken;
  const firstVisitVal = t.first_visit_date || '';
  const holdVal = t.hold_date || '';
  const closeVal = t.close_date || '';
  const resolutionDaysVal = calculateDaysBetweenVisitAndClose(t.first_visit_date, t.close_date, t.date, t.status).text;
  const statusVal = t.status || '';
  const remarkVal = (t.engineer_remark === 'N/A' || !t.engineer_remark) ? '' : t.engineer_remark;

  return [
    tid,
    dateVal,
    usernameVal,
    contactVal,
    locationVal,
    productVal,
    categoryVal,
    modelVal,
    serialVal,
    problemVal,
    engineerVal,
    actionVal,
    firstVisitVal,
    holdVal,
    closeVal,
    statusVal,
    remarkVal,
    resolutionDaysVal
  ].join('\t');
};

interface TicketsTableProps {
  tickets: Ticket[];
  engineers: Engineer[];
  onEditTicket: (ticket: Ticket) => void;
  onDeleteTicket: (id: string) => Promise<void>;
  onImportTickets: (tickets: Array<Partial<Ticket>>) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onDeleteAllTickets: () => Promise<void>;
  initialStatusFilter?: string;
  initialDateFilter?: 'all' | 'today' | 'week' | 'month';
}

export const TicketsTable: React.FC<TicketsTableProps> = ({
  tickets,
  engineers,
  onEditTicket,
  onDeleteTicket,
  onImportTickets,
  showToast,
  onDeleteAllTickets,
  initialStatusFilter = 'all',
  initialDateFilter = 'all'
}) => {
  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>(initialDateFilter);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [locationFilter, setLocationFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [engineerFilter, setEngineerFilter] = useState('all');
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);

  // Synchronize state from parent props
  React.useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  React.useEffect(() => {
    setDateFilter(initialDateFilter);
  }, [initialDateFilter]);

  // Single Ticket Delete confirmation state (2-step verification)
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [deleteConfirmCheckbox, setDeleteConfirmCheckbox] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);

  // Sorting State
  const [sortField, setSortField] = useState<keyof Ticket | 'resolution_days'>('ticket_id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Excel/Clipboard Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPastedText, setImportPastedText] = useState('');
  const [importHasHeader, setImportHasHeader] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  // Delete All Logs confirmation state
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // File drag & drop active state
  const [dragActive, setDragActive] = useState(false);

  // Monthly / Quarter-wise Log Reports State
  const [showLogsReportModal, setShowLogsReportModal] = useState(false);
  const [reportPeriodType, setReportPeriodType] = useState<ReportPeriodType>('quarter');
  const [selectedReportPeriodId, setSelectedReportPeriodId] = useState<string>('q-feb-apr');
  const [selectedReportYear, setSelectedReportYear] = useState<string>(() => {
    return new Date().getFullYear().toString();
  });

  // Get unique lists for filter options
  const uniqueLocations = useMemo(() => {
    const locs = tickets.map(t => t.location).filter(Boolean);
    return Array.from(new Set(locs)).sort();
  }, [tickets]);

  const uniqueProducts = useMemo(() => {
    const prods = tickets.map(t => t.product || t.category).filter(Boolean);
    return Array.from(new Set(prods)).sort();
  }, [tickets]);

  const uniqueYears = useMemo(() => {
    const yearsSet = new Set<string>();
    tickets.forEach(t => {
      const parsed = getTicketYearAndMonth(t);
      if (parsed) {
        yearsSet.add(parsed.year);
      }
    });
    const currentYear = new Date().getFullYear().toString();
    yearsSet.add(currentYear);
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [tickets]);

  const activePeriod = useMemo(() => {
    return reportPeriods.find(p => p.id === selectedReportPeriodId) || reportPeriods[0];
  }, [selectedReportPeriodId]);

  const periodFilteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const parsed = getTicketYearAndMonth(t);
      if (!parsed) return false;
      
      // Check year match
      if (parsed.year !== selectedReportYear) return false;
      
      // Check month match
      return activePeriod.months.includes(parsed.monthIndex);
    });
  }, [tickets, activePeriod, selectedReportYear]);

  const reportStats = useMemo(() => {
    const total = periodFilteredTickets.length;
    const open = periodFilteredTickets.filter(t => t.status && t.status.trim().toLowerCase() === 'open').length;
    const hold = periodFilteredTickets.filter(t => t.status && t.status.trim().toLowerCase() === 'hold').length;
    const closed = periodFilteredTickets.filter(t => t.status && (t.status.trim().toLowerCase() === 'closed' || t.status.trim().toLowerCase() === 'close')).length;
    return { total, open, hold, closed };
  }, [periodFilteredTickets]);

  // Handle Sort Change
  const handleSort = (field: keyof Ticket | 'resolution_days') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Filter & Sort Logic
  const filteredAndSortedTickets = useMemo(() => {
    let result = [...tickets];

    // 1. Text Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => {
        return (
          t.ticket_id?.toLowerCase().includes(term) ||
          t.username?.toLowerCase().includes(term) ||
          t.contact?.toLowerCase().includes(term) ||
          t.engineer?.toLowerCase().includes(term) ||
          t.location?.toLowerCase().includes(term) ||
          t.model?.toLowerCase().includes(term) ||
          t.serial_number?.toLowerCase().includes(term) ||
          t.status?.toLowerCase().includes(term)
        );
      });
    }

    // 2. Date Filter (Quick Filters)
    if (dateFilter !== 'all') {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      result = result.filter(t => {
        if (dateFilter === 'today') {
          return t.date === todayStr;
        } else if (dateFilter === 'week') {
          // Check if ticket date is within last 7 days
          const ticketDate = new Date(t.date);
          const diffTime = Math.abs(now.getTime() - ticketDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 7;
        } else if (dateFilter === 'month') {
          // Check if ticket is in same month and year
          const parsed = getTicketYearAndMonth(t);
          if (parsed) {
            return parsed.monthIndex === now.getMonth() && parseInt(parsed.year, 10) === now.getFullYear();
          }
          const ticketDate = new Date(t.date);
          return ticketDate.getMonth() === now.getMonth() && ticketDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    // 3. Status Filter
    if (statusFilter !== 'all') {
      const sf = statusFilter.toLowerCase();
      if (sf === 'open_hold' || sf === 'open+hold' || sf === 'open & hold') {
        result = result.filter(t => t.status && (t.status.trim().toLowerCase() === 'open' || t.status.trim().toLowerCase() === 'hold'));
      } else {
        result = result.filter(t => t.status && t.status.trim().toLowerCase() === sf);
      }
    }

    // 4. Location Filter
    if (locationFilter !== 'all') {
      result = result.filter(t => t.location === locationFilter);
    }

    // 5. Product Filter
    if (productFilter !== 'all') {
      result = result.filter(t => (t.product === productFilter || t.category === productFilter));
    }

    // 6. Engineer Filter
    if (engineerFilter !== 'all') {
      if (engineerFilter === 'Others...') {
        result = result.filter(t => {
          if (!t.engineer) return true;
          const tEng = t.engineer.trim().toLowerCase();
          return !engineers.some(e => {
            const eName = e.name.trim().toLowerCase();
            return tEng === eName || eName.includes(tEng) || tEng.includes(eName);
          });
        });
      } else {
        result = result.filter(t => t.engineer === engineerFilter);
      }
    }

    // 7. Sort
    result.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';

      if (sortField === 'ticket_id') {
        const numA = parseInt(String(aVal).replace(/\D/g, ''), 10);
        const numB = parseInt(String(bVal).replace(/\D/g, ''), 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }
      }

      if (sortField === 'resolution_days') {
        const daysA = calculateDaysBetweenVisitAndClose(a.first_visit_date, a.close_date, a.date, a.status).days;
        const daysB = calculateDaysBetweenVisitAndClose(b.first_visit_date, b.close_date, b.date, b.status).days;
        const numA = daysA !== null ? daysA : 999999;
        const numB = daysB !== null ? daysB : 999999;
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      if (sortField === 'created_at' || sortField === 'updated_at') {
        const timeA = new Date(aVal).getTime();
        const timeB = new Date(bVal).getTime();
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();

      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [tickets, searchTerm, dateFilter, statusFilter, locationFilter, productFilter, engineerFilter, sortField, sortDirection]);

  // Paginated Tickets
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedTickets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedTickets, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedTickets.length / itemsPerPage));

  const getVisiblePageNumbers = (current: number, total: number) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleClearFilters = () => {
    setDateFilter('all');
    setStatusFilter('all');
    setLocationFilter('all');
    setProductFilter('all');
    setEngineerFilter('all');
    setSearchTerm('');
    showToast('Filters cleared', 'info');
  };

  // --- Export Actions ---

  // Export to Genuine Excel (.xlsx) file
  const handleExportExcel = () => {
    if (filteredAndSortedTickets.length === 0) {
      showToast('No ticket data to export', 'error');
      return;
    }

    const headers = [
      'Sr No', 'Ticket ID', 'Date', 'Username', 'Contact', 'Location', 
      'Product', 'Category', 'Brand', 'Model', 'Serial Number', 
      'Problem', 'Engineer', 'Status', 'Action Taken', 
      'First Visit Date', 'Hold Date', 'Close Date', 'Remarks', 'Resolution Days'
    ];

    const data = filteredAndSortedTickets.map((t, idx) => ({
      'Sr No': idx + 1,
      'Ticket ID': t.ticket_id,
      'Date': t.date,
      'Username': t.username,
      'Contact': t.contact,
      'Location': t.location,
      'Product': t.product || '',
      'Category': t.category || '',
      'Brand': t.brand || '',
      'Model': t.model || '',
      'Serial Number': t.serial_number || '',
      'Problem': t.problem,
      'Engineer': t.engineer,
      'Status': t.status,
      'Action Taken': t.action_taken || '',
      'First Visit Date': t.first_visit_date || '',
      'Hold Date': t.hold_date || '',
      'Close Date': t.close_date || '',
      'Remarks': t.engineer_remark || '',
      'Resolution Days': calculateDaysBetweenVisitAndClose(t.first_visit_date, t.close_date, t.date, t.status).text
    }));

    try {
      const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets Log");

      // Auto-fit column widths elegantly
      const objectMaxWidths: any[] = [];
      headers.forEach((h) => {
        let maxLen = h.length;
        data.forEach((row: any) => {
          const val = String(row[h] || '');
          if (val.length > maxLen) {
            maxLen = val.length;
          }
        });
        objectMaxWidths.push({ wch: Math.min(Math.max(maxLen + 3, 10), 50) }); // Bounds of 10 to 50
      });
      worksheet['!cols'] = objectMaxWidths;

      XLSX.writeFile(workbook, `IT_Tickets_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('Excel (.xlsx) file downloaded successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Export failed: ' + err.message, 'error');
    }
  };

  // Export to standard CSV file (RFC 4180 compliant)
  const handleExportCSV = () => {
    if (filteredAndSortedTickets.length === 0) {
      showToast('No ticket data to export', 'error');
      return;
    }

    const headers = [
      'Sr No', 'Ticket ID', 'Date', 'Username', 'Contact', 'Location', 
      'Product', 'Category', 'Brand', 'Model', 'Serial Number', 
      'Problem', 'Engineer', 'Status', 'Action Taken', 
      'First Visit Date', 'Hold Date', 'Close Date', 'Remarks', 'Resolution Days'
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filteredAndSortedTickets.map((t, idx) => [
      idx + 1,
      t.ticket_id,
      t.date,
      escapeCSV(t.username),
      escapeCSV(t.contact),
      escapeCSV(t.location),
      escapeCSV(t.product || ''),
      escapeCSV(t.category || ''),
      escapeCSV(t.brand || ''),
      escapeCSV(t.model || ''),
      escapeCSV(t.serial_number || ''),
      escapeCSV(t.problem),
      escapeCSV(t.engineer),
      escapeCSV(t.status),
      escapeCSV(t.action_taken || ''),
      escapeCSV(t.first_visit_date || ''),
      escapeCSV(t.hold_date || ''),
      escapeCSV(t.close_date || ''),
      escapeCSV(t.engineer_remark || ''),
      escapeCSV(calculateDaysBetweenVisitAndClose(t.first_visit_date, t.close_date, t.date, t.status).text)
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
    
    // Use Uint8Array UTF-8 BOM (Byte Order Mark) to ensure proper character rendering in Excel/CSV viewers
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `IT_Tickets_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('CSV file downloaded successfully!', 'success');
  };

  // Copy visible ticket data as tab-separated spreadsheet-ready horizontal data
  const handleCopyAsTabular = () => {
    if (filteredAndSortedTickets.length === 0) {
      showToast('No visible tickets to copy!', 'error');
      return;
    }

    const headers = [
      'Sr no.',
      'Ticket Number',
      'Date',
      'Username',
      'Contact Number',
      'Location/ Address',
      'Product',
      'CATEGORY',
      'Model',
      'System Sr no.',
      'Problem',
      'Assign to',
      'Action Taken',
      'First Visit Date',
      'Hold Date',
      'Close Date',
      'Status',
      'Remark of Engineer',
      'Resolution Days'
    ].join('\t');

    const rows = filteredAndSortedTickets.map((t, idx) => {
      const srNo = String(idx + 1);
      
      const tid = t.ticket_id || '';
      const dateVal = t.date || '';
      const usernameVal = t.username || '';
      const contactVal = t.contact || '';
      const locationVal = t.location || '';
      const productVal = t.product || '';
      const categoryVal = t.category || '';
      const modelVal = t.model || '';
      const serialVal = t.serial_number || '';
      const problemVal = t.problem || '';
      const engineerVal = t.engineer || '';
      const actionVal = (t.action_taken === 'N/A' || !t.action_taken) ? '' : t.action_taken;
      const firstVisitVal = t.first_visit_date || '';
      const holdVal = t.hold_date || '';
      const closeVal = t.close_date || '';
      const resolutionDaysVal = calculateDaysBetweenVisitAndClose(t.first_visit_date, t.close_date, t.date, t.status).text;
      const statusVal = t.status || '';
      const remarkVal = (t.engineer_remark === 'N/A' || !t.engineer_remark) ? '' : t.engineer_remark;

      return [
        srNo,
        tid,
        dateVal,
        usernameVal,
        contactVal,
        locationVal,
        productVal,
        categoryVal,
        modelVal,
        serialVal,
        problemVal,
        engineerVal,
        actionVal,
        firstVisitVal,
        holdVal,
        closeVal,
        statusVal,
        remarkVal,
        resolutionDaysVal
      ].join('\t');
    });

    const tabularText = [headers, ...rows].join('\n');

    navigator.clipboard.writeText(tabularText)
      .then(() => showToast(`Copied ${filteredAndSortedTickets.length} visible ticket(s) as spreadsheet-ready tabular data!`, 'success'))
      .catch(() => showToast('Failed to copy tabular data', 'error'));
  };

  // Print/PDF View using standard window.print() but with an optimized print layout
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Popup blocked. Please allow popups to print/export PDF.', 'error');
      return;
    }

    const tableRows = filteredAndSortedTickets.map((t, idx) => `
      <tr>
        <td style="text-align: center; font-weight: 500;">${idx + 1}</td>
        <td style="font-family: monospace; font-weight: bold; color: #1e40af;">${t.ticket_id}</td>
        <td>${t.date}</td>
        <td>${t.username}</td>
        <td>${t.contact}</td>
        <td class="wrap-col-md">${t.location}</td>
        <td>${t.product || ''}</td>
        <td>${t.category || ''}</td>
        <td>${t.brand || ''}</td>
        <td>${t.model || ''}</td>
        <td>${t.serial_number || ''}</td>
        <td class="wrap-col-lg">${t.problem}</td>
        <td>${t.engineer}</td>
        <td style="text-align: center;">
          <span class="status-badge ${t.status.toLowerCase()}">${t.status}</span>
        </td>
        <td class="wrap-col-lg">${t.action_taken || ''}</td>
        <td>${t.first_visit_date || ''}</td>
        <td>${t.hold_date || ''}</td>
        <td>${t.close_date || ''}</td>
        <td class="wrap-col-md">${t.remarks || ''}</td>
        <td>${calculateDaysBetweenVisitAndClose(t.first_visit_date, t.close_date, t.date, t.status).text}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>IT Tickets List Export</title>
          <style>
            @page {
              size: landscape;
              margin: 4mm 6mm;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body {
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              padding: 5px;
              color: #1e293b;
              background-color: #fff;
              margin: 0;
            }
            .header-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 6px;
              margin-bottom: 10px;
            }
            h1 {
              font-size: 15px;
              color: #1e3a8a;
              margin: 0;
              font-weight: 800;
              letter-spacing: -0.5px;
            }
            .meta-info {
              font-size: 9px;
              color: #64748b;
              margin: 0;
              font-weight: 500;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 7px;
              line-height: 1.15;
              table-layout: auto;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 3px 3px;
              text-align: left;
              vertical-align: top;
              white-space: normal;
              word-break: break-word;
            }
            th {
              background-color: #f1f5f9 !important;
              font-weight: 800;
              color: #334155;
              text-transform: uppercase;
              font-size: 6.5px;
              letter-spacing: 0.3px;
            }
            .wrap-col-md {
              max-width: 90px;
              min-width: 50px;
            }
            .wrap-col-lg {
              max-width: 130px;
              min-width: 70px;
            }
            .status-badge {
              display: inline-block;
              padding: 1px 4px;
              border-radius: 3px;
              font-weight: 800;
              font-size: 6.5px;
              text-align: center;
              white-space: nowrap;
            }
            .status-badge.open { background: #eff6ff !important; color: #1d4ed8 !important; border: 1px solid #bfdbfe; }
            .status-badge.hold { background: #faf5ff !important; color: #6b21a8 !important; border: 1px solid #e9d5ff; }
            .status-badge.closed { background: #ecfdf5 !important; color: #047857 !important; border: 1px solid #a7f3d0; }

            .priority-badge {
              display: inline-block;
              padding: 1px 4px;
              border-radius: 3px;
              font-weight: 800;
              font-size: 6.5px;
              text-align: center;
              white-space: nowrap;
            }
            .priority-badge.critical { background: #fef2f2 !important; color: #b91c1c !important; border: 1px solid #fecaca; }
            .priority-badge.high { background: #fff7ed !important; color: #c2410c !important; border: 1px solid #ffedd5; }
            .priority-badge.medium { background: #fffbeb !important; color: #b45309 !important; border: 1px solid #fef3c7; }
            .priority-badge.low { background: #f0fdf4 !important; color: #15803d !important; border: 1px solid #dcfce7; }
          </style>
        </head>
        <body>
          <div class="header-section">
            <div>
              <h1>IT Ticket Management System</h1>
              <p class="meta-info" style="margin-top: 2px;">Export Date: ${new Date().toLocaleDateString()} | Generated At: ${new Date().toLocaleTimeString()}</p>
            </div>
            <div class="meta-info" style="text-align: right; font-weight: bold;">
              Total Filtered Tickets: ${filteredAndSortedTickets.length}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">Sr No</th>
                <th>Ticket ID</th>
                <th>Date</th>
                <th>Username</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Product</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Model</th>
                <th>Serial Number</th>
                <th>Problem</th>
                <th>Engineer</th>
                <th style="text-align: center;">Status</th>
                <th>Action Taken</th>
                <th>First Visit Date</th>
                <th>Hold Date</th>
                <th>Close Date</th>
                <th>Remarks</th>
                <th>Resolution Days</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Printing Period (Monthly / Quarter-wise) Reports with clean formatting
  const handlePrintPeriodReport = (period: ReportPeriod, year: string, periodTickets: Ticket[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Popup blocked. Please allow popups to print/export PDF.', 'error');
      return;
    }

    const openCount = periodTickets.filter(t => t.status === 'Open').length;
    const holdCount = periodTickets.filter(t => t.status === 'Hold').length;
    const closedCount = periodTickets.filter(t => t.status === 'Closed').length;

    const tableRows = periodTickets.map((t, idx) => `
      <tr>
        <td style="text-align: center; font-weight: 500;">${idx + 1}</td>
        <td style="font-family: monospace; font-weight: bold; color: #1e40af;">${t.ticket_id}</td>
        <td>${t.date}</td>
        <td>${t.username}</td>
        <td>${t.contact}</td>
        <td class="wrap-col-md">${t.location}</td>
        <td>${t.product || ''}</td>
        <td>${t.category || ''}</td>
        <td>${t.brand || ''}</td>
        <td>${t.model || ''}</td>
        <td>${t.serial_number || ''}</td>
        <td class="wrap-col-lg">${t.problem}</td>
        <td>${t.engineer}</td>
        <td style="text-align: center;">
          <span class="status-badge ${t.status.toLowerCase()}">${t.status}</span>
        </td>
        <td class="wrap-col-lg">${t.action_taken || ''}</td>
        <td>${t.first_visit_date || ''}</td>
        <td>${t.hold_date || ''}</td>
        <td>${t.close_date || ''}</td>
        <td class="wrap-col-md">${t.engineer_remark || ''}</td>
        <td>${calculateDaysBetweenVisitAndClose(t.first_visit_date, t.close_date, t.date, t.status).text}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>IT Tickets Logs - ${period.label} ${year}</title>
          <style>
            @page {
              size: landscape;
              margin: 4mm 6mm;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body {
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              padding: 5px;
              color: #1e293b;
              background-color: #fff;
              margin: 0;
            }
            .header-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 6px;
              margin-bottom: 10px;
            }
            h1 {
              font-size: 15px;
              color: #1e3a8a;
              margin: 0;
              font-weight: 800;
              letter-spacing: -0.5px;
            }
            .period-title {
              font-size: 11px;
              font-weight: bold;
              color: #4f46e5;
              text-transform: uppercase;
              margin-top: 2px;
            }
            .meta-info {
              font-size: 9px;
              color: #64748b;
              margin: 0;
              font-weight: 500;
            }
            .stats-badges {
              display: flex;
              gap: 8px;
              font-size: 8px;
              font-weight: bold;
              margin-top: 2px;
            }
            .stat-badge {
              border: 1px solid #cbd5e1;
              padding: 1px 4px;
              border-radius: 3px;
              background: #f8fafc;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 7px;
              line-height: 1.15;
              table-layout: auto;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 3px 3px;
              text-align: left;
              vertical-align: top;
              white-space: normal;
              word-break: break-word;
            }
            th {
              background-color: #f1f5f9 !important;
              font-weight: 800;
              color: #334155;
              text-transform: uppercase;
              font-size: 6.5px;
              letter-spacing: 0.3px;
            }
            .wrap-col-md {
              max-width: 90px;
              min-width: 50px;
            }
            .wrap-col-lg {
              max-width: 130px;
              min-width: 70px;
            }
            .status-badge {
              display: inline-block;
              padding: 1px 4px;
              border-radius: 3px;
              font-weight: 800;
              font-size: 6.5px;
              text-align: center;
              white-space: nowrap;
            }
            .status-badge.open { background: #eff6ff !important; color: #1d4ed8 !important; border: 1px solid #bfdbfe; }
            .status-badge.hold { background: #faf5ff !important; color: #6b21a8 !important; border: 1px solid #e9d5ff; }
            .status-badge.closed { background: #ecfdf5 !important; color: #047857 !important; border: 1px solid #a7f3d0; }

            .priority-badge {
              display: inline-block;
              padding: 1px 4px;
              border-radius: 3px;
              font-weight: 800;
              font-size: 6.5px;
              text-align: center;
              white-space: nowrap;
            }
            .priority-badge.critical { background: #fef2f2 !important; color: #b91c1c !important; border: 1px solid #fecaca; }
            .priority-badge.high { background: #fff7ed !important; color: #c2410c !important; border: 1px solid #ffedd5; }
            .priority-badge.medium { background: #fffbeb !important; color: #b45309 !important; border: 1px solid #fef3c7; }
            .priority-badge.low { background: #f0fdf4 !important; color: #15803d !important; border: 1px solid #dcfce7; }
          </style>
        </head>
        <body>
          <div class="header-section">
            <div>
              <h1>IT Ticket Management System - Log Report</h1>
              <div class="period-title">Period: ${period.label} ${year}</div>
              <p class="meta-info" style="margin-top: 2px;">Report Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
            </div>
            <div style="text-align: right;">
              <div class="meta-info" style="font-weight: bold; margin-bottom: 2px;">
                Total Period Tickets: ${periodTickets.length}
              </div>
              <div class="stats-badges">
                <span class="stat-badge" style="color: #1d4ed8; border-color: #bfdbfe;">Open: ${openCount}</span>
                <span class="stat-badge" style="color: #6b21a8; border-color: #e9d5ff;">Hold: ${holdCount}</span>
                <span class="stat-badge" style="color: #047857; border-color: #a7f3d0;">Closed: ${closedCount}</span>
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">Sr No</th>
                <th>Ticket ID</th>
                <th>Date</th>
                <th>Username</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Product</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Model</th>
                <th>Serial Number</th>
                <th>Problem</th>
                <th>Engineer</th>
                <th style="text-align: center;">Status</th>
                <th>Action Taken</th>
                <th>First Visit Date</th>
                <th>Hold Date</th>
                <th>Close Date</th>
                <th>Remarks</th>
                <th>Resolution Days</th>
              </tr>
            </thead>
            <tbody>
              ${periodTickets.length === 0 ? `
                <tr>
                  <td colspan="19" style="text-align: center; padding: 20px; color: #64748b; font-weight: bold;">
                    No tickets found in this period.
                  </td>
                </tr>
              ` : tableRows}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Copy full detailed ticket logs to clipboard
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null);

  const handleCopyDetails = (t: Ticket) => {
    const details = formatTicketHorizontal(t);

    navigator.clipboard.writeText(details)
      .then(() => {
        setCopiedTicketId(t.id);
        showToast(`Ticket ${t.ticket_id} copied to clipboard!`, 'success');
        setTimeout(() => setCopiedTicketId(null), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
        showToast('Failed to copy ticket details.', 'error');
      });
  };

  // Reactively parse pasted spreadsheet content
  const parsedImportRows = useMemo(() => {
    if (!importPastedText.trim()) return [];

    // Detect delimiter: tab or comma
    const delimiter = importPastedText.includes('\t') ? '\t' : (importPastedText.includes(',') ? ',' : '\t');

    // Robustly parse TSV/CSV text respecting double quotes and newlines within cells
    const parseTSVOrCSV = (text: string, delim: string): string[][] => {
      const result: string[][] = [];
      let row: string[] = [];
      let cell = '';
      let inQuotes = false;
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            cell += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delim && !inQuotes) {
          row.push(cell);
          cell = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
          row.push(cell);
          result.push(row);
          row = [];
          cell = '';
        } else {
          cell += char;
        }
      }
      if (cell || row.length > 0) {
        row.push(cell);
        result.push(row);
      }
      return result;
    };

    const allRows = parseTSVOrCSV(importPastedText, delimiter);
    if (allRows.length === 0) return [];

    // Filter out rows that are entirely blank (e.g. trailing tabs or spaces from WPS office)
    const nonBlankRows = allRows.filter(row => row.some(cell => cell.trim().length > 0));
    if (nonBlankRows.length === 0) return [];

    // Helper to normalize various date formats (e.g., 16-02-2026, 15 July 2026, July 15, 2026) to YYYY-MM-DD
    const parseImportDate = (dateStr: string | undefined): string => {
      if (!dateStr) return '';
      const cleanStr = dateStr.trim().replace(/\s+/g, ' ');
      if (!cleanStr) return '';

      // 1. Check if already YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
        return cleanStr;
      }

      // 2. Check if YYYY/MM/DD
      if (/^\d{4}\/\d{2}\/\d{2}$/.test(cleanStr)) {
        return cleanStr.replace(/\//g, '-');
      }

      // 3. Check for DD-MM-YYYY or DD/MM/YYYY
      const dmyMatch = cleanStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
      if (dmyMatch) {
        const day = dmyMatch[1].padStart(2, '0');
        const month = dmyMatch[2].padStart(2, '0');
        const year = dmyMatch[3];
        return `${year}-${month}-${day}`;
      }

      // Months map for name-based matching
      const monthsMap: { [key: string]: string } = {
        jan: '01', january: '01',
        feb: '02', february: '02',
        mar: '03', march: '03',
        apr: '04', april: '04',
        may: '05',
        jun: '06', june: '06',
        jul: '07', july: '07',
        aug: '08', august: '08',
        sep: '09', september: '09', sept: '09',
        oct: '10', october: '10',
        nov: '11', november: '11',
        dec: '12', december: '12'
      };

      // Normalize slashes/hyphens to spaces to make regex words matching simpler
      const normalizedWordsStr = cleanStr.replace(/[-/]/g, ' ');

      // 4. Check for DD Month YYYY (e.g., "15 July 2026", "15th July 2026", "15-July-2026")
      const wordDateMatch1 = normalizedWordsStr.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)\s+(\d{4})$/i);
      if (wordDateMatch1) {
        const day = wordDateMatch1[1].padStart(2, '0');
        const monthName = wordDateMatch1[2].toLowerCase();
        const year = wordDateMatch1[3];
        const matchedMonthKey = Object.keys(monthsMap).find(k => monthName.startsWith(k));
        const month = matchedMonthKey ? monthsMap[matchedMonthKey] : '01';
        return `${year}-${month}-${day}`;
      }

      // 5. Check for Month DD YYYY or Month DD, YYYY (e.g., "July 15, 2026", "July 15 2026")
      const wordDateMatch2 = normalizedWordsStr.replace(/,/g, '').match(/^([a-zA-Z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\d{4})$/i);
      if (wordDateMatch2) {
        const monthName = wordDateMatch2[1].toLowerCase();
        const day = wordDateMatch2[2].padStart(2, '0');
        const year = wordDateMatch2[3];
        const matchedMonthKey = Object.keys(monthsMap).find(k => monthName.startsWith(k));
        const month = matchedMonthKey ? monthsMap[matchedMonthKey] : '01';
        return `${year}-${month}-${day}`;
      }

      // 6. Try standard JS parsing
      try {
        const parsed = new Date(cleanStr);
        if (!isNaN(parsed.getTime())) {
          const year = parsed.getFullYear();
          const month = String(parsed.getMonth() + 1).padStart(2, '0');
          const day = String(parsed.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      } catch (e) {
        // Ignore
      }

      return cleanStr;
    };

    // Field mappings with exact alias matches
    const FIELD_MAPPINGS: { [field in keyof Ticket]?: string[] } = {
      date: ['date', 'ticket date'],
      ticket_id: ['ticket number', 'ticket_id', 'ticket no.', 'ticket no', 'ticket id', 'tid'],
      username: ['username', 'customer name', 'name', 'user name', 'user'],
      contact: ['contact number', 'contact no', 'contact_number', 'contact', 'phone', 'mobile'],
      location: ['location/ address', 'location/address', 'location', 'address', 'outlet'],
      product: ['product', 'item'],
      category: ['category', 'product category', 'type'],
      brand: ['brand', 'make'],
      model: ['model', 'model no', 'model number'],
      serial_number: ['system sr no.', 'system sr no', 'system sr. no.', 'serial number', 'serial no', 'serial_number', 'sr no', 'system sr'],
      problem: ['problem', 'issue', 'complaint'],
      engineer: ['assign to', 'assigned to', 'engineer', 'assigned engineer'],
      status: ['status', 'ticket status', 'ticket_status'],
      action_taken: ['action taken', 'action_taken', 'action'],
      first_visit_date: ['first visit date', 'first_visit_date', 'first visit'],
      hold_date: ['hold date', 'hold_date', 'hold'],
      close_date: ['close date', 'close_date', 'closed date'],
      engineer_remark: ['remark of engineer', 'engineer remark', 'remarks', 'remark']
    };

    const fallbackFields: Array<keyof Ticket> = [
      'date', 'ticket_id', 'username', 'contact', 'location', 
      'product', 'category', 'brand', 'model', 'serial_number', 
      'problem', 'engineer', 'status', 'action_taken', 
      'first_visit_date', 'hold_date', 'close_date', 'engineer_remark'
    ];

    let rawRows: any[] = [];

    if (importHasHeader) {
      // Helper to strip non-alphanumeric characters for robust exact field mapping
      const getAlphanumeric = (str: string) => {
        return str.toLowerCase().replace(/[^a-z0-9]/g, '');
      };

      const headers = nonBlankRows[0].map(h => h.trim().replace(/^\*+|\*+$/g, ''));
      rawRows = nonBlankRows.slice(1).map(cols => {
        const rowObj: any = {};
        
        headers.forEach((rawHeader, index) => {
          if (cols[index] === undefined) return;
          const cellVal = cols[index].trim();
          const normHeader = getAlphanumeric(rawHeader);
          if (!normHeader) return;
          
          let matchedField: string | null = null;
          
          // Pass 1: Exact Alphanumeric Match (e.g. "date" === "date", "assignto" === "assignto")
          for (const [field, aliases] of Object.entries(FIELD_MAPPINGS)) {
            if (aliases.some(alias => getAlphanumeric(alias) === normHeader)) {
              matchedField = field;
              break;
            }
          }
          
          // Pass 2: Loose Match (only if not already matched)
          if (!matchedField) {
            for (const [field, aliases] of Object.entries(FIELD_MAPPINGS)) {
              if (aliases.some(alias => {
                const normAlias = getAlphanumeric(alias);
                return normAlias && (normHeader.includes(normAlias) || normAlias.includes(normHeader));
              })) {
                matchedField = field;
                break;
              }
            }
          }
          
          if (matchedField) {
            rowObj[matchedField] = cellVal;
          }
        });
        return rowObj;
      });
    } else {
      // Map columns in direct layout order
      rawRows = nonBlankRows.map(cols => {
        const rowObj: any = {};
        cols.forEach((cell, index) => {
          if (index < fallbackFields.length) {
            rowObj[fallbackFields[index]] = cell.trim();
          }
        });
        return rowObj;
      });
    }

    // Filter out rows that are entirely empty after parsing mapping
    const finalRows = rawRows.filter(row => {
      return Object.values(row).some(val => val && String(val).trim().length > 0);
    });

    // Post-process rows: Normalize dates, statuses, and auto-derive Brand if missing
    return finalRows.map(row => {
      const processed: any = { ...row };

      // 1. Normalize dates (but do NOT generate date auto if blank)
      processed.date = parseImportDate(processed.date);
      if (processed.first_visit_date) processed.first_visit_date = parseImportDate(processed.first_visit_date);
      if (processed.hold_date) processed.hold_date = parseImportDate(processed.hold_date);
      if (processed.close_date) processed.close_date = parseImportDate(processed.close_date);

      // 2. Normalize status (e.g. "Close" to "Closed", "hold" to "Hold")
      if (processed.status) {
        const s = processed.status.trim().toLowerCase();
        if (s === 'open') processed.status = 'Open';
        else if (s === 'hold') processed.status = 'Hold';
        else if (s === 'close' || s === 'closed') processed.status = 'Closed';
        else processed.status = 'Open'; // default
      } else {
        processed.status = 'Open';
      }

      // 3. Normalize Model & Brand (e.g. "aio 7470", "dell 7470", "dell optiplex" -> "Dell Optiplex 7470")
      const normalizedHw = normalizeModelString(processed.model, processed.product, processed.brand);
      processed.model = normalizedHw.model || processed.model;
      if (normalizedHw.brand) {
        processed.brand = normalizedHw.brand;
      }

      // Auto-derive Brand if blank or missing
      if (!processed.brand) {
        const modelStr = (processed.model || '').toLowerCase();
        const prodStr = (processed.product || '').toLowerCase();
        const brands = ['hp', 'dell', 'lenovo', 'acer', 'brother', 'canon', 'cisco', 'epson', 'samsung', 'asus'];
        
        const foundInModel = brands.find(b => modelStr.includes(b));
        const foundInProd = brands.find(b => prodStr.includes(b));
        const matchedBrand = foundInModel || foundInProd;
        
        if (matchedBrand) {
          processed.brand = matchedBrand.toUpperCase();
        } else {
          processed.brand = '';
        }
      }

      // 4. Normalize and map Engineer name to official roster name if matching
      if (processed.engineer) {
        const engInput = processed.engineer.trim().toLowerCase();
        if (engInput) {
          const engineerMap: { [key: string]: string } = {
            'mahebub': 'Mahebub Mir',
            'karan': 'Karan Parmar',
            'chirag': 'Chirag Panchal',
            'krushil': 'Krushil Kapadiya',
            'mayank': 'Mayank Shravak',
            'pravin': 'Pravin Prajapati',
            'prince': 'Prince Kumar',
            'sudhir': 'Sudhir Kuvardiya',
            'parag': 'Parag',
            'amit': 'Amit Acharya',
            'saifuddin': 'Saifuddin Momin',
            'mayur': 'Mayur Ahir',
            'jenil': 'Jenil Kosambiya'
          };

          let foundOfficialName = '';
          for (const [shortName, officialName] of Object.entries(engineerMap)) {
            if (engInput === shortName || engInput.startsWith(shortName) || shortName.startsWith(engInput)) {
              foundOfficialName = officialName;
              break;
            }
          }

          if (foundOfficialName) {
            processed.engineer = foundOfficialName;
          } else {
            const matchedEng = engineers.find(eng => {
              const engName = eng.name.trim().toLowerCase();
              return engName === engInput || engName.includes(engInput) || engInput.includes(engName);
            });
            if (matchedEng) {
              processed.engineer = matchedEng.name;
            }
          }
        }
      }

      return processed;
    });
  }, [importPastedText, importHasHeader]);

  const handleCommitImport = async () => {
    if (parsedImportRows.length === 0) return;
    setIsImporting(true);
    try {
      await onImportTickets(parsedImportRows);
      showToast(`Imported ${parsedImportRows.length} tickets successfully!`, 'success');
      setImportPastedText('');
      setShowImportModal(false);
    } catch (e: any) {
      showToast(e.message || 'Failed to import tickets', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // Handle parsing of Excel (.xlsx/.xls) or CSV files
  const handleFileLoad = (file: File) => {
    if (!file) return;

    const fileType = file.name.split('.').pop()?.toLowerCase();
    
    if (fileType === 'xlsx' || fileType === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = evt.target?.result;
          if (!data) return;
          const arr = new Uint8Array(data as ArrayBuffer);
          const workbook = XLSX.read(arr, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert sheet to text (Tab-separated) which fits into our custom pasted text parsing!
          const tsv = XLSX.utils.sheet_to_txt(worksheet);
          if (tsv && tsv.trim().length > 0) {
            setImportPastedText(tsv);
            setImportHasHeader(true);
            showToast(`Excel file "${file.name}" loaded successfully!`, 'success');
          } else {
            showToast('Excel file sheet is empty or invalid.', 'error');
          }
        } catch (err: any) {
          console.error(err);
          showToast('Failed to parse Excel file: ' + err.message, 'error');
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (fileType === 'csv') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (text && text.trim().length > 0) {
          setImportPastedText(text);
          showToast(`CSV file "${file.name}" loaded successfully!`, 'success');
        } else {
          showToast('CSV file is empty or invalid.', 'error');
        }
      };
      reader.readAsText(file);
    } else {
      showToast('Unsupported format. Please select a .xlsx, .xls, or .csv file.', 'error');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileLoad(e.dataTransfer.files[0]);
    }
  };

  const handleDeleteAllConfirm = async () => {
    setIsDeletingAll(true);
    try {
      await onDeleteAllTickets();
      showToast('All ticket logs have been permanently deleted.', 'success');
      setShowDeleteAllConfirm(false);
    } catch (e: any) {
      showToast(e.message || 'Failed to clear ticket logs', 'error');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleDeleteSingleConfirm = async () => {
    if (!ticketToDelete) return;
    setIsDeletingSingle(true);
    try {
      await onDeleteTicket(ticketToDelete.id);
      showToast(`Ticket ${ticketToDelete.ticket_id} has been successfully deleted.`, 'success');
      setTicketToDelete(null);
    } catch (e: any) {
      showToast(e.message || 'Failed to delete ticket', 'error');
    } finally {
      setIsDeletingSingle(false);
    }
  };

  const [viewLayout, setViewLayout] = useState<'table' | 'cards'>('table');

  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden">
      {/* Search and Action Header */}
      <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch w-full max-w-full">
        {/* Search & Status Filter Group */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1 min-w-0">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search by ID, requester, location/address, or engineer name..."
              className="w-full text-sm pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all shadow-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                className="absolute right-3 top-3 p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Status Dropdown */}
          <div className="relative min-w-[140px] sm:min-w-[160px]">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full text-sm py-2.5 pl-3 pr-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all appearance-none cursor-pointer font-bold shadow-xs"
              title="Filter by ticket status"
              id="header-status-filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Hold">Hold</option>
              <option value="Closed">Closed</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Action Panel Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
          {/* Card / Table View Toggle on Mobile & Tablet */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewLayout('cards')}
              className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewLayout === 'cards'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Card View (Mobile Friendly)"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('table')}
              className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewLayout === 'table'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Full Table View"
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          <button
            onClick={() => setShowFilters(prev => !showFilters)}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showFilters || dateFilter !== 'all' || statusFilter !== 'all' || locationFilter !== 'all' || productFilter !== 'all' || engineerFilter !== 'all'
                ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-1.5 text-xs sm:text-sm font-bold cursor-pointer"
            title="Export to Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden md:inline">Export Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-1.5 text-xs sm:text-sm font-bold cursor-pointer"
            title="Export to standard CSV"
          >
            <Download className="w-4 h-4 text-teal-600" />
            <span className="hidden md:inline">Export CSV</span>
          </button>

          <button
            onClick={handleCopyAsTabular}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-1.5 text-xs sm:text-sm font-bold cursor-pointer"
            id="copy-tabular-data-btn"
            title="Copy visible tickets to clipboard as tab-separated spreadsheet data"
          >
            <Copy className="w-4 h-4 text-indigo-600" />
            <span className="hidden md:inline">Copy Tabular Data</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-1.5 text-xs sm:text-sm font-bold cursor-pointer"
            title="Import from Excel or Paste raw spreadsheet rows"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span className="hidden md:inline">Import Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-1.5 text-xs sm:text-sm font-bold cursor-pointer"
            title="Print / PDF Export"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span className="hidden md:inline">Print</span>
          </button>

          <button
            onClick={() => setShowLogsReportModal(true)}
            className="p-2 sm:p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 flex items-center gap-1.5 text-xs sm:text-sm font-bold cursor-pointer transition-all"
            title="View Ticket Logs & Print Reports"
          >
            <History className="w-4 h-4 text-indigo-600" />
            <span className="hidden md:inline">Logs</span>
          </button>

          <button
            onClick={() => setShowDeleteAllConfirm(true)}
            className="p-2 sm:p-2.5 rounded-xl border border-rose-200 dark:border-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-1.5 text-xs sm:text-sm font-bold cursor-pointer transition-all"
            title="Delete All Ticket Logs"
          >
            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="hidden md:inline">Delete All</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
          >
            {/* Date Filters */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date Duration</label>
              <select
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value as any); setCurrentPage(1); }}
                className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Hold">Hold</option>
                <option value="Closed">Closed</option>
              </select>
            </div>



            {/* Location Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location / Outlet</label>
              <select
                value={locationFilter}
                onChange={(e) => { setLocationFilter(e.target.value); setCurrentPage(1); }}
                className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="all">All Locations</option>
                {uniqueLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Product Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product / Item</label>
              <select
                value={productFilter}
                onChange={(e) => { setProductFilter(e.target.value); setCurrentPage(1); }}
                className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="all">All Products</option>
                {uniqueProducts.map(prod => (
                  <option key={prod} value={prod}>{prod}</option>
                ))}
              </select>
            </div>

            {/* Engineer Filter */}
            <div className="space-y-1 flex flex-col justify-between">
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Engineer</label>
                <select
                  value={engineerFilter}
                  onChange={(e) => { setEngineerFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="all">All Engineers</option>
                  {engineers.map(eng => (
                    <option key={eng.id} value={eng.name}>{eng.name}</option>
                  ))}
                  <option value="Others...">Others...</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-2 text-[10px] font-bold text-red-600 hover:text-red-800 dark:text-rose-400 dark:hover:text-rose-300 flex items-center justify-center gap-1 self-end bg-white dark:bg-slate-950 border border-rose-100 dark:border-rose-950/40 rounded px-2 py-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                Reset All
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Status Filter Tabs & Selection Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
        {/* Status Quick Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => { setStatusFilter('all'); setDateFilter('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-800'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            📋 All Calls ({tickets.length})
          </button>
          <button
            onClick={() => { setStatusFilter('Open'); setDateFilter('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'Open'
                ? 'bg-indigo-600 text-white shadow-xs border border-indigo-600'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            🔵 Open ({tickets.filter(t => t.status && t.status.trim().toLowerCase() === 'open').length})
          </button>
          <button
            onClick={() => { setStatusFilter('Hold'); setDateFilter('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'Hold'
                ? 'bg-purple-600 text-white shadow-xs border border-purple-600'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            🟣 Hold ({tickets.filter(t => t.status && t.status.trim().toLowerCase() === 'hold').length})
          </button>
          <button
            onClick={() => { setStatusFilter('Open_Hold'); setDateFilter('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'Open_Hold' || statusFilter === 'open_hold' || statusFilter === 'open+hold' || statusFilter === 'open & hold'
                ? 'bg-blue-600 text-white shadow-xs border border-blue-600'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            ⚡ Open & Hold ({tickets.filter(t => t.status && (t.status.trim().toLowerCase() === 'open' || t.status.trim().toLowerCase() === 'hold')).length})
          </button>
          <button
            onClick={() => { setStatusFilter('Closed'); setDateFilter('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'Closed'
                ? 'bg-emerald-600 text-white shadow-xs border border-emerald-600'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            🟢 Closed ({tickets.filter(t => t.status && (t.status.trim().toLowerCase() === 'closed' || t.status.trim().toLowerCase() === 'close')).length})
          </button>
        </div>

        {/* Selected tickets action details */}
        {selectedTicketIds.length > 0 && (
          <div className="flex items-center gap-2 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/40 px-3 py-1 rounded-xl animate-fade-in w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">
              {selectedTicketIds.length} selected
            </span>
            <div className="flex items-center gap-2">
              {/* If exactly 1 ticket is selected, show Edit option */}
              {selectedTicketIds.length === 1 && (
                <button
                  onClick={() => {
                    const selectedTicket = tickets.find(t => t.id === selectedTicketIds[0]);
                    if (selectedTicket) {
                      onEditTicket(selectedTicket);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                  title="Edit Selected Ticket"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Ticket</span>
                </button>
              )}

              {/* Copy ID(s) option - styled secondary if Edit is present, otherwise primary */}
              <button
                onClick={() => {
                  const selectedList = tickets.filter(t => selectedTicketIds.includes(t.id));
                  const idsText = selectedList.map(t => t.ticket_id).join('\n');
                  navigator.clipboard.writeText(idsText)
                    .then(() => showToast(`Copied ${selectedTicketIds.length} ticket ID(s) to clipboard!`, 'success'))
                    .catch(() => showToast('Failed to copy', 'error'));
                }}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedTicketIds.length === 1
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
                title="Copy Ticket ID(s)"
              >
                <Copy className="w-3 h-3" />
                <span>Copy ID{selectedTicketIds.length > 1 ? 's' : ''}</span>
              </button>

              {/* Copy Details option */}
              <button
                onClick={() => {
                  const selectedList = tickets.filter(t => selectedTicketIds.includes(t.id));
                  const detailsText = selectedList.map(t => formatTicketHorizontal(t)).join('\n');
                  navigator.clipboard.writeText(detailsText)
                    .then(() => showToast(`Copied ${selectedTicketIds.length} ticket(s) in horizontal format!`, 'success'))
                    .catch(() => showToast('Failed to copy', 'error'));
                }}
                className="px-2.5 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 dark:text-indigo-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                title="Copy full ticket details as tabular data"
              >
                <Copy className="w-3 h-3" />
                <span>Copy Details</span>
              </button>

              <button
                onClick={() => setSelectedTicketIds([])}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Deselect All"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table or Card List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Card View (Mobile / Tablet Friendly) */}
        {viewLayout === 'cards' ? (
          <div className="p-3 sm:p-4 divide-y divide-slate-100 dark:divide-slate-800/60">
            {paginatedTickets.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium text-sm">
                No tickets found matching your query.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {paginatedTickets.map((t, idx) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                  const dateDiff = calculateDaysBetweenVisitAndClose(t.first_visit_date, t.close_date, t.date, t.status);
                  const isSelected = selectedTicketIds.includes(t.id);

                  return (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800'
                          : 'bg-slate-50/40 dark:bg-slate-800/30 border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Card Header: Checkbox, Index, TID & Status */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-2.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              let updated: string[];
                              if (isChecked) {
                                updated = [...selectedTicketIds, t.id];
                                navigator.clipboard.writeText(t.ticket_id)
                                  .then(() => {
                                    showToast(`Ticket ID ${t.ticket_id} copied!`, 'success');
                                  })
                                  .catch(() => {});
                              } else {
                                updated = selectedTicketIds.filter(id => id !== t.id);
                              }
                              setSelectedTicketIds(updated);
                            }}
                            className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                          />
                          <span className="text-[10px] font-mono text-slate-400">#{globalIndex}</span>
                          <div className="flex items-center gap-1 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            <span>{t.ticket_id}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyDetails(t)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                              title="Copy Ticket Details"
                            >
                              {copiedTicketId === t.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            t.status && t.status.trim().toLowerCase() === 'open' ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border border-indigo-100/50' :
                            t.status && t.status.trim().toLowerCase() === 'hold' ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-100/50' :
                            'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50'
                          }`}>
                            ● {t.status}
                          </span>
                        </div>
                      </div>

                      {/* Requester & Location */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{t.username}</span>
                          <a
                            href={`tel:${t.contact}`}
                            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            {t.contact}
                          </a>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          <span className="text-slate-400">Location:</span> {t.location}
                        </p>
                      </div>

                      {/* Equipment Details */}
                      <div className="bg-white dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800/60 text-[11px] space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Hardware:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{t.product || 'Other'} ({t.category || 'Other'})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Model:</span>
                          <span className="text-slate-600 dark:text-slate-400">{t.model || 'N/A'}</span>
                        </div>
                        {t.serial_number && (
                          <div className="flex justify-between font-mono text-[10px]">
                            <span className="text-slate-400">Sr No:</span>
                            <span className="text-slate-600 dark:text-slate-400">{t.serial_number}</span>
                          </div>
                        )}
                      </div>

                      {/* Problem & Action Taken */}
                      <div className="space-y-1 text-[11px]">
                        <p className="text-slate-700 dark:text-slate-300 font-medium">
                          <span className="text-slate-400">Problem:</span> {t.problem}
                        </p>
                        {t.action_taken && (
                          <p className="text-slate-600 dark:text-slate-400">
                            <span className="text-slate-400">Action:</span> {t.action_taken}
                          </p>
                        )}
                      </div>

                      {/* Engineer & Dates Footer */}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="text-slate-400">Assigned: </span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{t.engineer || 'Unassigned'}</span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${dateDiff.badgeClass}`}>
                          {dateDiff.text}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleCopyDetails(t)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy Log</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditTicket(t)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTicketToDelete(t);
                            setDeleteConfirmCheckbox(false);
                            setDeleteConfirmText('');
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg cursor-pointer"
                          title="Delete Ticket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Full Excel-Format Table View */
          <div className="overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-lg">
            <table className="w-full text-xs text-left text-slate-700 dark:text-slate-200 border-collapse">
              <thead className="text-[11px] text-slate-700 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 whitespace-nowrap sticky top-0 z-10 select-none">
                <tr className="divide-x divide-slate-300 dark:divide-slate-700">
                  <th className="px-2.5 py-2.5 text-center font-bold w-12 bg-slate-100 dark:bg-slate-800">Sr No</th>
                  <th className="px-2 py-2.5 text-center font-bold w-10 bg-slate-100 dark:bg-slate-800">
                    <input
                      type="checkbox"
                      checked={paginatedTickets.length > 0 && paginatedTickets.every(t => selectedTicketIds.includes(t.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const newSelected = Array.from(new Set([...selectedTicketIds, ...paginatedTickets.map(t => t.id)]));
                          setSelectedTicketIds(newSelected);
                        } else {
                          const paginatedIds = paginatedTickets.map(t => t.id);
                          setSelectedTicketIds(selectedTicketIds.filter(id => !paginatedIds.includes(id)));
                        }
                      }}
                      className="rounded border-slate-400 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                    />
                  </th>
                  <th onClick={() => handleSort('ticket_id')} className="px-3 py-2.5 font-bold cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors">
                    Ticket Number {sortField === 'ticket_id' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('date')} className="px-3 py-2.5 font-bold cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors">
                    Date {sortField === 'date' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('username')} className="px-3 py-2.5 font-bold cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors">
                    Username {sortField === 'username' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-3 py-2.5 font-bold">Contact Number</th>
                  <th onClick={() => handleSort('location')} className="px-3 py-2.5 font-bold cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors">
                    Location/ Address {sortField === 'location' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-3 py-2.5 font-bold">Product</th>
                  <th className="px-3 py-2.5 font-bold">Category</th>
                  <th className="px-3 py-2.5 font-bold">Model</th>
                  <th className="px-3 py-2.5 font-bold">System Sr no.</th>
                  <th className="px-3 py-2.5 font-bold">Problem</th>
                  <th onClick={() => handleSort('engineer')} className="px-3 py-2.5 font-bold cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors">
                    Assign to {sortField === 'engineer' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-3 py-2.5 font-bold">Action Taken</th>
                  <th className="px-3 py-2.5 font-bold">First Visit Date</th>
                  <th className="px-3 py-2.5 font-bold">Hold Date</th>
                  <th className="px-3 py-2.5 font-bold">Close Date</th>
                  <th onClick={() => handleSort('status')} className="px-3 py-2.5 font-bold cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors text-center">
                    Status {sortField === 'status' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-3 py-2.5 font-bold">Remark of Engineer</th>
                  <th onClick={() => handleSort('resolution_days')} className="px-3 py-2.5 font-bold text-center cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors whitespace-nowrap" title="Click to sort by calculated days between First Visit Date & Close Date">
                    Resolution Days {sortField === 'resolution_days' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-3 py-2.5 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 whitespace-nowrap">
                {paginatedTickets.length === 0 ? (
                  <tr>
                    <td colSpan={21} className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
                      No tickets found matching your query.
                    </td>
                  </tr>
                ) : (
                  paginatedTickets.map((t, idx) => {
                    const globalIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                    return (
                      <tr key={t.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/40 transition-colors align-middle divide-x divide-slate-200 dark:divide-slate-700 text-xs">
                        <td className="px-2.5 py-2.5 text-center text-slate-500 font-mono font-medium">{globalIndex}</td>
                        <td className="px-2 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={selectedTicketIds.includes(t.id)}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              let updated: string[];
                              if (isChecked) {
                                updated = [...selectedTicketIds, t.id];
                                navigator.clipboard.writeText(t.ticket_id)
                                  .then(() => {
                                    showToast(`Ticket ID ${t.ticket_id} copied to clipboard!`, 'success');
                                  })
                                  .catch(err => console.error('Failed to copy: ', err));
                              } else {
                                updated = selectedTicketIds.filter(id => id !== t.id);
                              }
                              setSelectedTicketIds(updated);
                            }}
                            className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          <div className="flex items-center gap-1.5 group select-all">
                            <span>{t.ticket_id}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyDetails(t)}
                              className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer"
                              title="Copy full ticket details"
                            >
                              {copiedTicketId === t.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{t.date}</td>
                        <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-100">{t.username}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-300">{t.contact}</td>
                        <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 max-w-[180px] truncate" title={t.location}>{t.location}</td>
                        <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-200">{t.product || 'Other'}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{t.category || 'Other'}</td>
                        <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">{t.model || 'N/A'}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-400">{t.serial_number || 'N/A'}</td>
                        <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={t.problem}>{t.problem}</td>
                        <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-200">{t.engineer || 'Unassigned'}</td>
                        <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={t.action_taken}>{t.action_taken || 'N/A'}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{t.first_visit_date || 'N/A'}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{t.hold_date || 'N/A'}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{t.close_date || 'N/A'}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.status && t.status.trim().toLowerCase() === 'open' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800' :
                            t.status && t.status.trim().toLowerCase() === 'hold' ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800' :
                            'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}>
                            ● {t.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 max-w-[180px] truncate" title={t.engineer_remark}>{t.engineer_remark || 'N/A'}</td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          {(() => {
                            const dateDiff = calculateDaysBetweenVisitAndClose(t.first_visit_date, t.close_date, t.date, t.status);
                            return (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${dateDiff.badgeClass}`}>
                                {dateDiff.text}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onEditTicket(t)}
                              className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded transition-all cursor-pointer"
                              title="Edit Ticket"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setTicketToDelete(t);
                                setDeleteConfirmCheckbox(false);
                                setDeleteConfirmText('');
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-all cursor-pointer"
                              title="Remove Ticket"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination & Summary Panel */}
        {filteredAndSortedTickets.length > 0 && (
          <div className="bg-slate-50/50 dark:bg-slate-900/40 px-4 py-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span>
                Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {Math.min(currentPage * itemsPerPage, filteredAndSortedTickets.length)}
                </span>{' '}
                of <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredAndSortedTickets.length}</span> tickets
              </span>

              <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-3">
                <span className="text-slate-400">Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold px-2 py-0.5 text-slate-700 dark:text-slate-300 cursor-pointer outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 text-xs">
                {getVisiblePageNumbers(currentPage, totalPages).map((p, i) => (
                  typeof p === 'number' ? (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handlePageChange(p)}
                      className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                        currentPage === p
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={i} className="px-1 text-slate-400">
                      {p}
                    </span>
                  )
                ))}
              </div>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Excel/Clipboard Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full p-6 border border-slate-200/60 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-left"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-slate-900 dark:text-slate-100">Excel / Spreadsheet Data Porter</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Import multiple tickets by copy-pasting directly from Excel or loading a CSV file.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportPastedText('');
                  }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
                {/* Information / Instructions */}
                <div className="p-3 bg-indigo-50/40 border border-indigo-100/50 dark:bg-slate-800/30 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-400">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>Instructions & Supported Columns</span>
                  </div>
                  <p className="leading-relaxed">
                    Simply open your Microsoft Excel, Google Sheets, or any other spreadsheet, highlight your rows (including headers if present), copy them (<kbd className="bg-white dark:bg-slate-950 border px-1 rounded font-mono text-[10px]">Ctrl+C</kbd>), and paste (<kbd className="bg-white dark:bg-slate-950 border px-1 rounded font-mono text-[10px]">Ctrl+V</kbd>) into the field below. Our parser will automatically map the columns!
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                    <span className="font-bold text-slate-500 dark:text-slate-400">Fields detected:</span>
                    {['Date', 'Ticket ID', 'Username', 'Contact', 'Location/Address', 'Product', 'Category', 'Brand', 'Model', 'Serial Number', 'Problem', 'Engineer', 'Status', 'Action Taken', 'Remarks'].map((col) => (
                      <span key={col} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400 font-mono">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Main Inputs Split */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Copy Paste Text Area */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Paste Spreadsheet Rows here</label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={importHasHeader}
                          onChange={(e) => setImportHasHeader(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        First row contains column headers
                      </label>
                    </div>
                    <textarea
                      rows={6}
                      value={importPastedText}
                      onChange={(e) => setImportPastedText(e.target.value)}
                      placeholder="Paste cells copied from Excel/Google Sheets here...&#10;Date	Username	Contact	Location	Problem...&#10;2026-07-15	Pravin Kumar	9988776655	Ahmedabad	Monitor flickering..."
                      className="w-full font-mono text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 resize-none h-[180px]"
                    />
                  </div>

                  {/* Or upload Excel / CSV file */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Or Upload Excel / CSV File</label>
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all flex flex-col items-center justify-center h-[180px] relative cursor-pointer group ${
                        dragActive 
                          ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20' 
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/20'
                      }`}
                    >
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileLoad(file);
                        }}
                      />
                      <Upload className={`w-8 h-8 transition-colors mb-2.5 ${
                        dragActive ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-600 group-hover:text-emerald-500'
                      }`} />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {dragActive ? 'Drop file here!' : 'Click to upload or drag & drop'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        Accepts Excel (.xlsx, .xls) and standard .csv files
                      </span>
                    </div>
                  </div>
                </div>

                {/* Parsing Live Preview Table */}
                {parsedImportRows.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Live Preview ({parsedImportRows.length} Rows Parsed)
                      </span>
                      <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Auto-Mapped successfully
                      </span>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-[160px] overflow-y-auto">
                      <table className="w-full text-[11px] text-left text-slate-600 dark:text-slate-400">
                        <thead className="text-[9px] text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                          <tr>
                            <th className="px-2 py-1.5 font-bold">#</th>
                            <th className="px-2 py-1.5 font-bold">Date</th>
                            <th className="px-2 py-1.5 font-bold">Username</th>
                            <th className="px-2 py-1.5 font-bold">Contact</th>
                            <th className="px-2 py-1.5 font-bold">Location</th>
                            <th className="px-2 py-1.5 font-bold">Product</th>
                            <th className="px-2 py-1.5 font-bold">Problem</th>
                            <th className="px-2 py-1.5 font-bold">Engineer</th>
                            <th className="px-2 py-1.5 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                          {parsedImportRows.slice(0, 10).map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                              <td className="px-2 py-1.5 text-slate-400">{idx + 1}</td>
                              <td className="px-2 py-1.5 font-semibold text-slate-700 dark:text-slate-300">{row.date || 'Auto'}</td>
                              <td className="px-2 py-1.5 text-slate-800 dark:text-slate-200">{row.username || 'N/A'}</td>
                              <td className="px-2 py-1.5">{row.contact || 'N/A'}</td>
                              <td className="px-2 py-1.5 truncate max-w-[100px]">{row.location || 'N/A'}</td>
                              <td className="px-2 py-1.5">{row.product || 'N/A'}</td>
                              <td className="px-2 py-1.5 truncate max-w-[120px]">{row.problem || 'N/A'}</td>
                              <td className="px-2 py-1.5 text-indigo-600 dark:text-indigo-400">{row.engineer || 'Unassigned'}</td>
                              <td className="px-2 py-1.5">
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {row.status || 'Open'}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {parsedImportRows.length > 10 && (
                            <tr>
                              <td colSpan={9} className="px-2 py-1.5 text-center text-slate-400 font-medium italic">
                                ... and {parsedImportRows.length - 10} more rows are ready for import.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800/60 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportPastedText('');
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setImportPastedText(
                        `Date\tUsername\tContact\tLocation/Address\tProduct\tCategory\tBrand\tModel\tSerial Number\tProblem\tAssign to\tStatus\tAction Taken\tRemark of Engineer\n` +
                        `2026-07-15\tAmit Patel\t9876543210\tRO-Ahmedabad\tAIO\tAIO\tHP\tProDesk\tSGH123456\tNo Power\tSudhir Kuvardiya\tOpen\tChecked SMPS\tNeeds spare replacement`
                      );
                      setImportHasHeader(true);
                      showToast('Sample template loaded in textbox!', 'info');
                    }}
                    className="px-3 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Load Sample Excel Format
                  </button>
                  <button
                    type="button"
                    disabled={parsedImportRows.length === 0 || isImporting}
                    onClick={handleCommitImport}
                    className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    {isImporting ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Import {parsedImportRows.length} Rows Into Database
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete All Confirmation Modal */}
      <AnimatePresence>
        {showDeleteAllConfirm && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl max-w-md w-full relative space-y-4"
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-full text-red-600 dark:text-red-400 shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete All Ticket Logs?</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    This will permanently delete all ticket logs in the database. This action cannot be undone. Are you sure you want to proceed?
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setShowDeleteAllConfirm(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingAll}
                  onClick={handleDeleteAllConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  {isDeletingAll ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Yes, Delete All
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Single Ticket Delete 2-Step Verification Modal */}
      <AnimatePresence>
        {ticketToDelete && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl max-w-md w-full relative space-y-4 text-left"
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-full text-rose-600 dark:text-rose-400 shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Ticket {ticketToDelete.ticket_id}?</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    You are performing a sensitive deletion of the ticket registered for <span className="font-semibold text-slate-700 dark:text-slate-200">{ticketToDelete.username}</span> ({ticketToDelete.product || 'Other'} - {ticketToDelete.category || 'Other'}).
                  </p>
                </div>
              </div>

              {/* Two-Step Verification Form */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 space-y-3">
                {/* Step 1: Confirmation Checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={deleteConfirmCheckbox}
                    onChange={(e) => setDeleteConfirmCheckbox(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-rose-600 focus:ring-rose-500 h-4 w-4 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
                    I understand this action is permanent, completely irreversible, and will delete this ticket from the database.
                  </span>
                </label>

                {/* Step 2: Code Verification Input */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    To verify, type the Ticket ID <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 select-all bg-indigo-50 dark:bg-indigo-950/30 px-1 py-0.5 rounded">{ticketToDelete.ticket_id}</span> below:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type Ticket ID to confirm"
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-1 focus:ring-rose-500 focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setTicketToDelete(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    !deleteConfirmCheckbox || 
                    deleteConfirmText.trim().toLowerCase() !== ticketToDelete.ticket_id.trim().toLowerCase() ||
                    isDeletingSingle
                  }
                  onClick={handleDeleteSingleConfirm}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed transition-all"
                >
                  {isDeletingSingle ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Ticket Permanently
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Monthly / Quarter-wise Log Reports Modal */}
      <AnimatePresence>
        {showLogsReportModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden relative"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-slate-900 dark:text-white">Ticket Logs & Reports</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">View and print comprehensive ticket logs filtered by custom month or quarter intervals.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLogsReportModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body: Two Panel Split */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Controls Panel */}
                <div className="w-80 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/25 p-4 flex flex-col gap-4 overflow-y-auto shrink-0 text-left">
                  {/* Year Select Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Calendar Year</label>
                    <select
                      value={selectedReportYear}
                      onChange={(e) => setSelectedReportYear(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer font-medium"
                    >
                      {uniqueYears.map(yr => (
                        <option key={yr} value={yr}>{yr} Year</option>
                      ))}
                    </select>
                  </div>

                  {/* Period Type Buttons Segment */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Interval Type</label>
                    <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
                      <button
                        onClick={() => {
                          setReportPeriodType('quarter');
                          setSelectedReportPeriodId('q-feb-apr');
                        }}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          reportPeriodType === 'quarter'
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        Quarters
                      </button>
                      <button
                        onClick={() => {
                          setReportPeriodType('month');
                          setSelectedReportPeriodId('m-1'); // Default to Feb
                        }}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          reportPeriodType === 'month'
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        Months Wise
                      </button>
                    </div>
                  </div>

                  {/* Period List List */}
                  <div className="space-y-1.5 flex-1 flex flex-col">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Select Period</label>
                    <div className="space-y-1 overflow-y-auto pr-1 flex-1">
                      {reportPeriods
                        .filter(p => p.type === reportPeriodType)
                        .map(period => {
                          const count = tickets.filter(t => {
                            const parsed = getTicketYearAndMonth(t);
                            if (!parsed) return false;
                            return parsed.year === selectedReportYear && period.months.includes(parsed.monthIndex);
                          }).length;

                          const isSelected = selectedReportPeriodId === period.id;

                          return (
                            <button
                              key={period.id}
                              onClick={() => setSelectedReportPeriodId(period.id)}
                              className={`w-full p-3 rounded-xl flex items-center justify-between text-xs font-bold border transition-all cursor-pointer text-left ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/10'
                                  : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span className="truncate">{period.label}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                isSelected
                                  ? 'bg-indigo-700 text-indigo-100'
                                  : count > 0 
                                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                              }`}>
                                {count} {count === 1 ? 'ticket' : 'tickets'}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* Right Content View Panel */}
                <div className="flex-1 p-6 flex flex-col overflow-hidden text-left bg-white dark:bg-slate-900">
                  {/* Period Header Toolbar */}
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4 shrink-0">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
                        <span>Period: {activePeriod.label} {selectedReportYear}</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Displaying {periodFilteredTickets.length} logged tickets for the selected interval.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePrintPeriodReport(activePeriod, selectedReportYear, periodFilteredTickets)}
                      className="px-4.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer transition-all self-stretch sm:self-auto justify-center"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Period Report
                    </button>
                  </div>

                  {/* Summary Cards Panel */}
                  <div className="grid grid-cols-4 gap-3 mb-4 shrink-0">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-200/40 dark:border-slate-800/60 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Logs</span>
                      <span className="text-lg font-extrabold text-slate-800 dark:text-white mt-1 block">{reportStats.total}</span>
                    </div>
                    <div className="p-3 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/40 dark:border-blue-900/30 rounded-xl">
                      <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider block">Open</span>
                      <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">{reportStats.open}</span>
                    </div>
                    <div className="p-3 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/40 dark:border-purple-900/30 rounded-xl">
                      <span className="text-[10px] font-bold text-purple-500 dark:text-purple-400 uppercase tracking-wider block">On Hold</span>
                      <span className="text-lg font-extrabold text-purple-600 dark:text-purple-400 mt-1 block">{reportStats.hold}</span>
                    </div>
                    <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/40 dark:border-emerald-900/30 rounded-xl">
                      <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider block">Closed</span>
                      <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">{reportStats.closed}</span>
                    </div>
                  </div>

                  {/* View Logs List Table */}
                  <div className="flex-1 overflow-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
                        <tr>
                          <th className="px-4 py-3 text-center">Sr No</th>
                          <th className="px-4 py-3">Ticket ID</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Requester</th>
                          <th className="px-4 py-3">Location</th>
                          <th className="px-4 py-3">Engineer</th>
                          <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                        {periodFilteredTickets.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                              <div className="flex flex-col items-center justify-center space-y-2 py-6">
                                <FileText className="w-8 h-8 text-slate-300" />
                                <p className="font-medium">No ticket logs found for this period</p>
                                <p className="text-[10px]">Create or import tickets in this time frame to see records.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          periodFilteredTickets.map((t, idx) => (
                            <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-4 py-3 text-center text-slate-400 dark:text-slate-500 font-medium">{idx + 1}</td>
                              <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                <div className="flex items-center gap-1.5 group select-all">
                                  <span>{t.ticket_id}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyDetails(t)}
                                    className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer"
                                    title="Copy full ticket details"
                                  >
                                    {copiedTicketId === t.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">{t.date}</td>
                              <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{t.username}</td>
                              <td className="px-4 py-3 truncate max-w-[150px]" title={t.location}>{t.location}</td>
                              <td className="px-4 py-3 truncate max-w-[120px]" title={t.engineer}>{t.engineer}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  t.status === 'Open' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/35' :
                                  t.status === 'Hold' ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200/50 dark:border-purple-900/35' :
                                  'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/35'
                                }`}>
                                  {t.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
