import React, { useState, useEffect, useRef } from 'react';
import { Engineer, AttendanceRecord, AttendanceStatus } from '../types';
import { 
  Calendar, 
  Save, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Trash2, 
  Check, 
  RefreshCw, 
  HelpCircle, 
  Sparkles,
  ClipboardCheck,
  Building,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface AttendanceManagerProps {
  engineers: Engineer[];
  showToast: (text: string, type: 'success' | 'error' | 'info') => void;
  systemMode: 'RO-Ahmedabad' | 'Surat';
}

const ATTENDANCE_LEGEND: { code: AttendanceStatus; label: string; bg: string; text: string; border: string }[] = [
  { code: 'P', label: 'PRESENT', bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800/60' },
  { code: 'L', label: 'LEAVE', bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-800 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800/60' },
  { code: 'WO', label: 'WEEKLYOFF', bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/60' },
  { code: 'H', label: 'HOLIDAY', bg: 'bg-teal-100 dark:bg-teal-950/60', text: 'text-teal-800 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800/60' },
  { code: 'HD', label: 'Half Leave', bg: 'bg-fuchsia-100 dark:bg-fuchsia-950/60', text: 'text-fuchsia-800 dark:text-fuchsia-300', border: 'border-fuchsia-200 dark:border-fuchsia-800/60' },
];

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({ 
  engineers, 
  showToast,
  systemMode
}) => {
  // View mode & Day check-in states
  const [viewMode, setViewMode] = useState<'calendar' | 'daily'>('calendar');
  const [selectedDay, setSelectedDay] = useState<number>(1);

  // Date selection state
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(2026); // Default to July 2026 matching image
  const [selectedMonth, setSelectedMonth] = useState<number>(7);   // Default to July

  // Year options: 2025 to 2028
  const years = [2025, 2026, 2027, 2028];
  
  // Month options
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  // Records state
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Server Backups / Stored Files State
  const [backupFiles, setBackupFiles] = useState<{ filename: string; size: number; updatedAt: string; type: 'monthly' | 'quarterly'; format: 'excel' | 'json' }[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState<boolean>(false);

  const fetchBackupFiles = async () => {
    setIsLoadingBackups(true);
    try {
      const response = await fetch('/api/attendance/backups').catch(() => null);
      if (response && response.ok && response.headers.get('content-type')?.includes('application/json')) {
        try {
          const data = await response.json();
          setBackupFiles(data.files || []);
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      console.log("Backups endpoint unavailable in static mode");
    } finally {
      setIsLoadingBackups(false);
    }
  };

  // Cell popover/dropdown editing state
  const [activeCell, setActiveCell] = useState<{ engineerId: string; day: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get active engineers for the current helpdesk system mode
  const filteredEngineers = React.useMemo(() => {
    if (systemMode === 'Surat') {
      return engineers.filter(e => e.active && ((e.location && e.location.toLowerCase().includes('surat')) || e.name === 'Mayur Ahir' || e.name === 'Jenil Kosambiya'));
    } else {
      return engineers.filter(e => e.active && !((e.location && e.location.toLowerCase().includes('surat')) || e.name === 'Mayur Ahir' || e.name === 'Jenil Kosambiya'));
    }
  }, [engineers, systemMode]);

  // Dynamic list of days of the selected month
  const daysInMonth = React.useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // Create lookup for day name (Wed, Thu, etc.)
  const dayNames = React.useMemo(() => {
    const list: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(selectedYear, selectedMonth - 1, d);
      const shortDay = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      list.push(shortDay);
    }
    return list;
  }, [selectedYear, selectedMonth, daysInMonth]);

  // Load attendance records
  const loadAttendance = async () => {
    setIsLoading(true);
    const storageKey = `attendance_${selectedYear}_${selectedMonth}`;
    try {
      const response = await fetch(`/api/attendance?year=${selectedYear}&month=${selectedMonth}`).catch(() => null);
      let data: AttendanceRecord[] = [];
      if (response && response.ok && response.headers.get('content-type')?.includes('application/json')) {
        try {
          data = await response.json();
          localStorage.setItem(storageKey, JSON.stringify(data));
        } catch (e) {
          const cached = localStorage.getItem(storageKey);
          data = cached ? JSON.parse(cached) : [];
        }
      } else {
        const cached = localStorage.getItem(storageKey);
        data = cached ? JSON.parse(cached) : [];
      }
      
      // If no records exist yet for this month, generate empty skeleton for active engineers
      if (data.length === 0) {
        data = filteredEngineers.map(eng => ({
          engineerId: eng.id,
          engineerName: eng.name,
          month: selectedMonth,
          year: selectedYear,
          days: {}
        }));
      }

      // Filter the records so only current system's engineers are loaded
      const filteredData = data.filter(record => 
        filteredEngineers.some(eng => eng.id === record.engineerId)
      );
      
      setRecords(filteredData);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.log('Using local attendance cache');
      const cached = localStorage.getItem(storageKey);
      const data = cached ? JSON.parse(cached) : filteredEngineers.map(eng => ({
        engineerId: eng.id,
        engineerName: eng.name,
        month: selectedMonth,
        year: selectedYear,
        days: {}
      }));
      setRecords(data);
      setHasUnsavedChanges(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Load when dates or engineers change
  useEffect(() => {
    if (filteredEngineers.length > 0) {
      loadAttendance();
    }
    fetchBackupFiles();
  }, [selectedYear, selectedMonth, engineers, systemMode]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActiveCell(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update a single day's attendance status
  const handleCellClick = (engineerId: string, day: number) => {
    setActiveCell({ engineerId, day });
  };

  const handleStatusChange = (engineerId: string, day: number, status: AttendanceStatus) => {
    setRecords(prev => prev.map(rec => {
      if (rec.engineerId === engineerId) {
        return {
          ...rec,
          days: {
            ...rec.days,
            [day]: status
          }
        };
      }
      return rec;
    }));
    setHasUnsavedChanges(true);
    setActiveCell(null);
  };

  // Bulk Operations
  const handleAutoFillSundays = () => {
    setRecords(prev => prev.map(rec => {
      const newDays = { ...rec.days };
      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(selectedYear, selectedMonth - 1, d);
        if (dateObj.getDay() === 0) { // Sunday
          newDays[d] = 'WO';
        }
      }
      return { ...rec, days: newDays };
    }));
    setHasUnsavedChanges(true);
    showToast('Auto-filled Sundays as WEEKLYOFF (WO)', 'info');
  };

  const handleFillBlanksAsPresent = () => {
    setRecords(prev => prev.map(rec => {
      const newDays = { ...rec.days };
      for (let d = 1; d <= daysInMonth; d++) {
        if (!newDays[d]) {
          newDays[d] = 'P';
        }
      }
      return { ...rec, days: newDays };
    }));
    setHasUnsavedChanges(true);
    showToast('Marked all blank days as PRESENT (P)', 'info');
  };

  const handleClearAll = () => {
    setRecords(prev => prev.map(rec => {
      const clearedDays: { [day: number]: AttendanceStatus } = {};
      for (let d = 1; d <= daysInMonth; d++) {
        clearedDays[d] = '';
      }
      return { ...rec, days: clearedDays };
    }));
    setHasUnsavedChanges(true);
    showToast('Cleared all attendance codes for this month', 'info');
  };

  // Save changes
  const handleSaveChanges = async () => {
    setIsSaving(true);
    const storageKey = `attendance_${selectedYear}_${selectedMonth}`;
    // Always persist to local cache first
    localStorage.setItem(storageKey, JSON.stringify(records));
    
    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records })
      });
      fetchBackupFiles();
    } catch (err: any) {
      console.log('Saved to local storage');
    } finally {
      setIsSaving(false);
      setHasUnsavedChanges(false);
      showToast('Attendance sheet saved successfully!', 'success');
    }
  };

  // Calculate stats for a record
  const getRecordStats = (record: AttendanceRecord) => {
    let workingDays = 0;
    let leaveDays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const status = record.days[d] || '';
      if (status === 'P') {
        workingDays += 1;
      } else if (status === 'HD') {
        workingDays += 0.5;
        leaveDays += 0.5;
      } else if (status === 'L') {
        leaveDays += 1;
      }
    }

    return { workingDays, leaveDays };
  };

  // Legend lookup for cell styles
  const getCellStyle = (status: AttendanceStatus) => {
    const matched = ATTENDANCE_LEGEND.find(l => l.code === status);
    if (matched) {
      return `${matched.bg} ${matched.text} font-black text-[11px] border-slate-200 dark:border-slate-800`;
    }
    return 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-slate-100 dark:border-slate-800/60';
  };

  // Copy data to clipboard formatted for Excel pasting
  const handleCopyToClipboard = () => {
    try {
      let tsv = 'S.No\tNAME\tLOCATION\t';
      
      // Header Day Numbers
      for (let d = 1; d <= daysInMonth; d++) {
        tsv += `${d}\t`;
      }
      tsv += 'TOTAL WORKING DAYS\tTOTAL LEAVE DAYS\n';

      // Header Weekday Names
      tsv += '\t\t\t';
      for (let d = 1; d <= daysInMonth; d++) {
        tsv += `${dayNames[d - 1]}\t`;
      }
      tsv += '\t\n';

      // Rows
      records.forEach((rec, idx) => {
        tsv += `${idx + 1}\t${rec.engineerName}\t${rec.location || 'N/A'}\t`;
        for (let d = 1; d <= daysInMonth; d++) {
          tsv += `${rec.days[d] || ''}\t`;
        }
        const { workingDays, leaveDays } = getRecordStats(rec);
        tsv += `${workingDays}\t${leaveDays}\n`;
      });

      navigator.clipboard.writeText(tsv)
        .then(() => showToast('Attendance sheet copied as tabular data! Paste it directly into Excel.', 'success'))
        .catch(() => showToast('Failed to copy sheet to clipboard', 'error'));
    } catch (e) {
      showToast('Clipboard copy failed', 'error');
    }
  };

  // Export to Excel file using SheetJS
  const handleExportToExcel = () => {
    try {
      const monthLabel = months.find(m => m.value === selectedMonth)?.label || 'Month';
      const sheetName = `${monthLabel}_${selectedYear}_Attendance`;

      // Formulate headers
      const headers = ['S.No', 'NAME', 'LOCATION'];
      for (let d = 1; d <= daysInMonth; d++) {
        headers.push(String(d));
      }
      headers.push('TOTAL WORKING DAYS', 'TOTAL LEAVE DAYS');

      const weekdayRow = ['', '', ''];
      for (let d = 1; d <= daysInMonth; d++) {
        weekdayRow.push(dayNames[d - 1]);
      }
      weekdayRow.push('', '');

      // Create data grid
      const dataRows = records.map((rec, idx) => {
        const row: any[] = [idx + 1, rec.engineerName, rec.location || ''];
        for (let d = 1; d <= daysInMonth; d++) {
          row.push(rec.days[d] || '');
        }
        const { workingDays, leaveDays } = getRecordStats(rec);
        row.push(workingDays, leaveDays);
        return row;
      });

      // Construct Workbook
      const wb = XLSX.utils.book_new();
      
      // We will place title at row 1
      const titleRow = [`${monthLabel.toUpperCase()} ${selectedYear} ATTENDANCE SHEET`];
      
      const sheetData = [
        titleRow,
        [],
        headers,
        weekdayRow,
        ...dataRows
      ];

      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      // Merge title row cells
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: daysInMonth + 4 } }
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Attendance Sheet');
      
      // Save
      XLSX.writeFile(wb, `${sheetName}.xlsx`);
      showToast('Exported successfully as .xlsx file!', 'success');
    } catch (e: any) {
      console.error(e);
      showToast('Failed to export to Excel: ' + e.message, 'error');
    }
  };

  // Import from CSV/Excel
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convert to array of arrays
        const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        if (rawRows.length < 3) {
          throw new Error('Spreadsheet format invalid. Must contain name and day columns.');
        }

        // We need to look for where headers start. Usually we find a row containing 'S.No' or 'NAME'
        let headerRowIndex = -1;
        for (let r = 0; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (row.includes('S.No') || row.includes('NAME') || row.includes('Name')) {
            headerRowIndex = r;
            break;
          }
        }

        if (headerRowIndex === -1) {
          throw new Error('Could not identify table headers ("S.No", "NAME") in spreadsheet.');
        }

        const headers = rawRows[headerRowIndex];
        const dataStartIdx = headerRowIndex + 2; // skip headers and weekdays row

        const updatedRecords = [...records];
        let matchCount = 0;

        for (let r = dataStartIdx; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length < 2) continue;

          // Attempt to locate engineer by name
          const excelName = String(row[1] || '').trim().toLowerCase();
          if (!excelName) continue;

          const recordIndex = updatedRecords.findIndex(rec => 
            rec.engineerName.trim().toLowerCase().includes(excelName) || 
            excelName.includes(rec.engineerName.trim().toLowerCase())
          );

          if (recordIndex !== -1) {
            matchCount++;
            const daysData = { ...updatedRecords[recordIndex].days };
            
            // Map values for days 1 to daysInMonth
            // S.No is col 0, NAME is col 1, LOCATION is col 2, so Day 1 is index 3
            for (let d = 1; d <= daysInMonth; d++) {
              const excelValue = String(row[d + 2] || '').trim().toUpperCase() as AttendanceStatus;
              if (['P', 'L', 'WO', 'H', 'HD', ''].includes(excelValue)) {
                daysData[d] = excelValue;
              }
            }
            updatedRecords[recordIndex] = {
              ...updatedRecords[recordIndex],
              days: daysData
            };
          }
        }

        if (matchCount === 0) {
          throw new Error('No engineers matched the spreadsheet. Verify the spelling of engineer names.');
        }

        setRecords(updatedRecords);
        setHasUnsavedChanges(true);
        showToast(`Successfully imported attendance for ${matchCount} engineers! Click "Save Changes" to save.`, 'success');

      } catch (err: any) {
        console.error(err);
        showToast(err.message || 'Error parsing attendance file', 'error');
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsBinaryString(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleBulkMarkSelectedDay = (status: AttendanceStatus) => {
    setRecords(prev => prev.map(rec => {
      return {
        ...rec,
        days: {
          ...rec.days,
          [selectedDay]: status
        }
      };
    }));
    setHasUnsavedChanges(true);
    showToast(`Marked all engineers as ${status || 'CLEARED'} for Day ${selectedDay}`, 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Attendance Board
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
              {systemMode === 'Surat' ? '🌴 Surat' : '🏢 RO Ahmedabad'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Record and export monthly rosters for field engineering staff. Days update dynamically.
          </p>
        </div>

        {/* View Mode & Date Filters Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          
          {/* View Mode Segmented Control */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/60">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Calendar Sheet</span>
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'daily'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Daily List</span>
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-850 hidden sm:block" />

          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(parseInt(e.target.value, 10));
              setActiveCell(null);
            }}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(parseInt(e.target.value, 10));
              setActiveCell(null);
            }}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button
            onClick={loadAttendance}
            title="Reload from Server"
            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

        </div>
      </div>

      {/* Main Content Area - Conditional based on View Mode */}
      {viewMode === 'calendar' ? (
        <>
          {/* Main Control Toolbar & Actions Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Bulk tools */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleAutoFillSundays}
                className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/60 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto WO (Sundays)</span>
              </button>

              <button
                onClick={handleFillBlanksAsPresent}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Fill Blanks (P)</span>
              </button>

              <button
                onClick={handleClearAll}
                className="px-3 py-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100/50 dark:hover:bg-rose-900/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Roster</span>
              </button>
            </div>

            {/* Export/Import/Save */}
            <div className="flex items-center gap-2 flex-wrap md:justify-end">
              
              <button
                onClick={handleCopyToClipboard}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Copy Tabular</span>
              </button>

              <button
                onClick={handleExportToExcel}
                className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/60 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={triggerFileInput}
                className="px-3 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100/70 dark:hover:bg-amber-900/60 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Excel</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImportFile} 
                accept=".xlsx,.xls,.csv" 
                className="hidden" 
              />

              <button
                onClick={handleSaveChanges}
                disabled={isSaving || !hasUnsavedChanges}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
                  hasUnsavedChanges
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                {isSaving ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
              </button>

            </div>
          </div>

          {/* Main Roster Spreadsheet Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.015)] relative">
            
            {isLoading && (
              <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 z-20 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Retrieving sheet logs...</p>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left min-w-[1200px]">
                <thead>
                  {/* Year and Month Title Row */}
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                    <th colSpan={daysInMonth + 5} className="py-3 px-4 text-center">
                      <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-widest block">
                        {months.find(m => m.value === selectedMonth)?.label} {selectedYear} ATTENDANCE SHEET
                      </span>
                    </th>
                  </tr>

                  {/* Day numbers row */}
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3 border-r border-slate-100 dark:border-slate-800 text-center w-12 sticky left-0 bg-slate-50 dark:bg-slate-850">S.No</th>
                    <th className="py-2.5 px-4 border-r border-slate-100 dark:border-slate-800 w-44 sticky left-12 bg-slate-50 dark:bg-slate-850">NAME</th>
                    <th className="py-2.5 px-4 border-r border-slate-100 dark:border-slate-800 w-40">LOCATION</th>
                    
                    {/* 1..31 Header numbers */}
                    {Array.from({ length: daysInMonth }).map((_, d) => (
                      <th key={d} className="py-2.5 text-center border-r border-slate-100 dark:border-slate-800 w-10">
                        {d + 1}
                      </th>
                    ))}
                    
                    <th className="py-2.5 px-3 border-r border-slate-100 dark:border-slate-800 text-center w-28 text-emerald-600 dark:text-emerald-400">WORKING DAYS</th>
                    <th className="py-2.5 px-3 text-center w-24 text-rose-600 dark:text-rose-400 font-bold">LEAVE DAYS</th>
                  </tr>

                  {/* Day names row */}
                  <tr className="bg-slate-100/30 dark:bg-slate-800/10 border-b border-slate-100 dark:border-slate-800 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    <th className="py-1.5 px-3 border-r border-slate-100 dark:border-slate-800 sticky left-0 bg-slate-100/30 dark:bg-slate-850"></th>
                    <th className="py-1.5 px-4 border-r border-slate-100 dark:border-slate-800 sticky left-12 bg-slate-100/30 dark:bg-slate-850"></th>
                    <th className="py-1.5 px-4 border-r border-slate-100 dark:border-slate-800"></th>
                    
                    {/* Weekday codes */}
                    {Array.from({ length: daysInMonth }).map((_, d) => (
                      <th 
                        key={d} 
                        className={`py-1.5 text-center border-r border-slate-100 dark:border-slate-800 ${
                          dayNames[d] === 'Sun' ? 'text-amber-500 dark:text-amber-400 font-bold' : ''
                        }`}
                      >
                        {dayNames[d]}
                      </th>
                    ))}

                    <th className="py-1.5 px-3 border-r border-slate-100 dark:border-slate-800"></th>
                    <th className="py-1.5 px-3"></th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={daysInMonth + 5} className="py-10 text-center text-slate-400 dark:text-slate-500 font-medium italic">
                        No records found. Click "Reload from Server" or ensure active engineers are configured.
                      </td>
                    </tr>
                  ) : (
                    records.map((rec, idx) => {
                      const { workingDays, leaveDays } = getRecordStats(rec);
                      return (
                        <tr 
                          key={rec.id} 
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all"
                        >
                          {/* Serial Number */}
                          <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-center font-bold text-slate-400 dark:text-slate-500 sticky left-0 bg-white dark:bg-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.01)]">
                            {idx + 1}
                          </td>

                          {/* Name */}
                          <td className="py-3 px-4 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-white sticky left-12 bg-white dark:bg-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.01)] truncate">
                            {rec.engineerName}
                          </td>

                          {/* Location */}
                          <td className="py-3 px-4 border-r border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium truncate">
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3 text-slate-400" />
                              <span>{rec.location || 'N/A'}</span>
                            </span>
                          </td>

                          {/* Days (Interactive Cells) */}
                          {Array.from({ length: daysInMonth }).map((_, d) => {
                            const dayNum = d + 1;
                            const status = rec.days[dayNum] || '';
                            const isSunday = dayNames[d] === 'Sun';
                            
                            return (
                              <td 
                                key={d} 
                                onClick={() => handleCellClick(rec.engineerId, dayNum)}
                                className={`p-1 border-r border-slate-100 dark:border-slate-800 text-center select-none cursor-pointer hover:ring-2 hover:ring-indigo-400 relative group transition-all ${getCellStyle(status)}`}
                              >
                                <span className="relative z-10 block font-bold text-[10px]">
                                  {status || (isSunday ? 'WO' : '-')}
                                </span>

                                {/* Cell hovering helper overlay */}
                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
                              </td>
                            );
                          })}

                          {/* Working Days count */}
                          <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-center font-black text-slate-800 dark:text-slate-100 bg-emerald-50/45 dark:bg-emerald-950/5 text-sm">
                            {workingDays}
                          </td>

                          {/* Leave Days count */}
                          <td className="py-3 px-3 text-center font-black text-slate-800 dark:text-slate-100 bg-rose-50/45 dark:bg-rose-950/5 text-sm">
                            {leaveDays}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Popover / Click dropdown for editing cell status */}
          {activeCell && (
            <div 
              ref={popoverRef}
              className="fixed inset-0 md:inset-auto z-50 flex items-center justify-center p-4"
              style={{
                // Standard centered layout on mobile, but positioned floating near user cursor on desktop
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              {/* Overlay to block page clicks */}
              <div className="fixed inset-0 bg-black/25 dark:bg-black/50 backdrop-blur-xs" onClick={() => setActiveCell(null)} />
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl relative z-10 w-full max-w-sm animate-scale-up">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 block">
                  Set Attendance Code
                </h4>
                
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                  Updating attendance for <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{records.find(r => r.engineerId === activeCell.engineerId)?.engineerName}</span> on <span className="underline">Day {activeCell.day}</span> ({dayNames[activeCell.day - 1]}).
                </p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {ATTENDANCE_LEGEND.map(legend => {
                    const isSelected = records.find(r => r.engineerId === activeCell.engineerId)?.days[activeCell.day] === legend.code;
                    return (
                      <button
                        key={legend.code}
                        onClick={() => handleStatusChange(activeCell.engineerId, activeCell.day, legend.code)}
                        className={`p-3 rounded-xl border text-left text-xs font-bold cursor-pointer transition-all flex items-center justify-between ${
                          isSelected 
                            ? `${legend.bg} ${legend.text} ring-2 ring-indigo-500 border-transparent` 
                            : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black ${legend.bg} ${legend.text}`}>
                            {legend.code}
                          </span>
                          <span>{legend.label}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(activeCell.engineerId, activeCell.day, '')}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Clear Day
                  </button>
                  
                  <button
                    onClick={() => setActiveCell(null)}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          {/* Day selection slider bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800/60 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Select Check-In Date</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Select a day in {months.find(m => m.value === selectedMonth)?.label} {selectedYear} to record attendance.
                </p>
              </div>

              {/* Day navigation arrows */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  onClick={() => setSelectedDay(prev => prev > 1 ? prev - 1 : daysInMonth)}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 rounded-lg transition-all cursor-pointer"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-black px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-lg border border-indigo-100/40 dark:border-indigo-900/20 min-w-24 text-center">
                  Day {selectedDay} of {daysInMonth}
                </span>
                <button
                  onClick={() => setSelectedDay(prev => prev < daysInMonth ? prev + 1 : 1)}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 rounded-lg transition-all cursor-pointer"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Horizontal Day selection bubble list */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              {Array.from({ length: daysInMonth }).map((_, d) => {
                const dayNum = d + 1;
                const dayOfWeek = dayNames[d];
                const isSunday = dayOfWeek === 'Sun';
                const isSelected = dayNum === selectedDay;

                // Progress indicators based on logs
                const filledCount = records.filter(r => r.days[dayNum]).length;
                const totalCount = records.length;
                const isFullyRecorded = totalCount > 0 && filledCount === totalCount;
                const isPartiallyRecorded = filledCount > 0 && filledCount < totalCount;

                return (
                  <button
                    key={dayNum}
                    onClick={() => setSelectedDay(dayNum)}
                    className={`flex flex-col items-center justify-center min-w-[54px] h-[64px] rounded-xl border transition-all cursor-pointer shrink-0 relative ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-102 ring-2 ring-indigo-500/20'
                        : isSunday
                        ? 'bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-100/40 dark:hover:bg-amber-950/20 text-slate-700 dark:text-slate-300 border-amber-100 dark:border-amber-900/30'
                        : 'bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-150 dark:border-slate-800/80'
                    }`}
                  >
                    <span className={`text-[9px] uppercase font-bold tracking-wider ${
                      isSelected ? 'text-indigo-100' : isSunday ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {dayOfWeek}
                    </span>
                    <span className="text-base font-extrabold tracking-tight mt-0.5 leading-none">
                      {dayNum}
                    </span>

                    {/* Progress indicator dot under the number */}
                    <div className="absolute bottom-1 flex gap-0.5 justify-center w-full">
                      {isFullyRecorded ? (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                      ) : isPartiallyRecorded ? (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-indigo-200' : 'bg-amber-400'}`} />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily list control bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/50 dark:border-slate-800/40">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-2">Quick Actions for Day {selectedDay}:</span>
              
              <button
                onClick={() => handleBulkMarkSelectedDay('P')}
                className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/60 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark All Present</span>
              </button>

              <button
                onClick={() => handleBulkMarkSelectedDay('WO')}
                className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100/70 dark:hover:bg-amber-900/60 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mark All Weeklyoff</span>
              </button>

              <button
                onClick={() => handleBulkMarkSelectedDay('')}
                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100/50 dark:hover:bg-rose-900/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Today</span>
              </button>
            </div>

            <button
              onClick={handleSaveChanges}
              disabled={isSaving || !hasUnsavedChanges}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white animate-pulse'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
            </button>
          </div>

          {/* Engineers check-in roster cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {records.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                <p className="text-slate-400 dark:text-slate-500 font-medium italic">
                  No active engineers loaded.
                </p>
              </div>
            ) : (
              records.map((rec, idx) => {
                const currentStatus = rec.days[selectedDay] || '';
                return (
                  <div 
                    key={rec.id}
                    className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-[0_2px_12px_rgba(0,0,0,0.01)] hover:shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-white leading-tight">
                            {rec.engineerName}
                          </h4>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span>{rec.location || 'N/A'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Active tag indicator */}
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase shrink-0 ${
                        currentStatus 
                          ? ATTENDANCE_LEGEND.find(l => l.code === currentStatus)?.bg + ' ' + ATTENDANCE_LEGEND.find(l => l.code === currentStatus)?.text
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                      }`}>
                        {currentStatus || 'UNMARKED'}
                      </span>
                    </div>

                    {/* Button Group segment */}
                    <div className="grid grid-cols-6 gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-150 dark:border-slate-850">
                      {ATTENDANCE_LEGEND.map(legend => {
                        const isSelected = currentStatus === legend.code;
                        return (
                          <button
                            key={legend.code}
                            title={legend.label}
                            onClick={() => {
                              handleStatusChange(rec.engineerId, selectedDay, legend.code);
                            }}
                            className={`py-2 px-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                              isSelected
                                ? `${legend.bg} ${legend.text} shadow-xs ring-1 ring-slate-200 dark:ring-slate-800`
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <span className="text-[11px]">{legend.code}</span>
                          </button>
                        );
                      })}
                      
                      {/* Clear Button */}
                      <button
                        title="Clear status"
                        onClick={() => {
                          handleStatusChange(rec.engineerId, selectedDay, '');
                        }}
                        className={`py-2 px-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex flex-col items-center justify-center ${
                          currentStatus === ''
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-xs'
                            : 'text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 hover:text-rose-500'
                        }`}
                      >
                        <span className="text-[10px]">Clear</span>
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Roster Legend Box */}
      <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 p-5">
        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
          <span>Attendance Code Legend & Formula Guideline</span>
        </h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {ATTENDANCE_LEGEND.map(legend => (
            <div 
              key={legend.code}
              className={`p-2.5 rounded-xl border ${legend.bg} ${legend.border} flex items-center gap-2.5`}
            >
              <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800/80 shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex items-center justify-center font-black text-xs shrink-0">
                {legend.code}
              </div>
              <div className="overflow-hidden">
                <span className={`font-black text-[10px] block leading-tight ${legend.text}`}>
                  {legend.code}
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 block font-medium truncate">
                  {legend.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed mt-4 border-t border-slate-200/40 dark:border-slate-800/40 pt-3">
          💡 **Formula Rules**: Total Working Days = Present + 0.5 &times; Half Leave. Total Leave Days = Leave + 0.5 &times; Half Leave. Saturdays are editable. Sundays default to Weekly Off (WO) during new sheet generation, but can be customized manually or through file uploads.
        </p>
      </div>

      {/* Server Files Repository (Month-wise & Quarter-wise) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Server-Stored Archives (Month & Quarter-wise)</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Excel spreadsheets and raw JSON archives generated automatically on save. Fully isolated by month and quarter.
            </p>
          </div>
          
          <button
            onClick={fetchBackupFiles}
            disabled={isLoadingBackups}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all border border-slate-200/40 dark:border-slate-700/50 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBackups ? 'animate-spin text-emerald-500' : ''}`} />
            <span>Refresh Files</span>
          </button>
        </div>

        {isLoadingBackups && backupFiles.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
            Loading file registry...
          </div>
        ) : backupFiles.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 font-medium flex flex-col items-center gap-2">
            <Info className="w-5 h-5 text-slate-300 dark:text-slate-700" />
            <span>No archived files found on the server. Save changes to generate them.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Column */}
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5 border-b border-slate-100/50 dark:border-slate-800/40 pb-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Monthly Backups ({backupFiles.filter(f => f.type === 'monthly').length})</span>
              </h4>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {backupFiles.filter(f => f.type === 'monthly').length === 0 ? (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">No monthly files stored yet.</p>
                ) : (
                  backupFiles.filter(f => f.type === 'monthly').map(file => (
                    <div 
                      key={file.filename}
                      className="group p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40 hover:border-slate-200 dark:hover:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-900/60 transition-all flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {file.format === 'excel' ? (
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center font-black text-[10px] text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30 shrink-0">
                            XLSX
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center font-black text-[10px] text-violet-600 dark:text-violet-400 border border-violet-100/50 dark:border-violet-900/30 shrink-0">
                            JSON
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate" title={file.filename}>
                            {file.filename}
                          </p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                            {(file.size / 1024).toFixed(1)} KB • {new Date(file.updatedAt).toLocaleDateString(undefined, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`/api/attendance/download?file=${file.filename}`}
                        download
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400 transition-all shrink-0"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quarterly Column */}
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5 border-b border-slate-100/50 dark:border-slate-800/40 pb-1.5">
                <Building className="w-3.5 h-3.5 text-amber-500" />
                <span>Quarterly Backups ({backupFiles.filter(f => f.type === 'quarterly').length})</span>
              </h4>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {backupFiles.filter(f => f.type === 'quarterly').length === 0 ? (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">No quarterly files stored yet.</p>
                ) : (
                  backupFiles.filter(f => f.type === 'quarterly').map(file => (
                    <div 
                      key={file.filename}
                      className="group p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40 hover:border-slate-200 dark:hover:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-900/60 transition-all flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {file.format === 'excel' ? (
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center font-black text-[10px] text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30 shrink-0">
                            XLSX
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center font-black text-[10px] text-violet-600 dark:text-violet-400 border border-violet-100/50 dark:border-violet-900/30 shrink-0">
                            JSON
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate" title={file.filename}>
                            {file.filename}
                          </p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                            {(file.size / 1024).toFixed(1)} KB • {new Date(file.updatedAt).toLocaleDateString(undefined, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`/api/attendance/download?file=${file.filename}`}
                        download
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400 transition-all shrink-0"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
