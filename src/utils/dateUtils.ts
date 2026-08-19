export const parseDateString = (dateStr?: string | number): Date | null => {
  if (dateStr === undefined || dateStr === null) return null;
  const s = String(dateStr).trim();
  if (!s || s === 'N/A' || s === 'undefined' || s === 'null') return null;

  // Check Excel serial number (e.g. 45000+)
  if (/^\d{5}$/.test(s)) {
    const num = parseInt(s, 10);
    const parsed = new Date((num - (25567 + 2)) * 86400 * 1000);
    if (!isNaN(parsed.getTime())) {
      parsed.setHours(0, 0, 0, 0);
      return parsed;
    }
  }

  // Handle YYYY-MM-DD or YYYY-MM-DDTHH:mm
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const parts = s.split('T')[0].split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }

  // Handle DD-MM-YYYY or DD/MM/YYYY
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(s)) {
    const parts = s.split(/[-/]/);
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }

  // Fallback to standard Date parsing (e.g. "20 July 2026")
  const fallbackDate = new Date(s);
  if (!isNaN(fallbackDate.getTime())) {
    fallbackDate.setHours(0, 0, 0, 0);
    return fallbackDate;
  }

  return null;
};

export interface DateDiffResult {
  days: number | null;
  text: string;
  badgeClass: string;
  isSameDay: boolean;
  isClosed: boolean;
  isOpen: boolean;
}

export const calculateDaysBetweenVisitAndClose = (
  firstVisitDate?: string | number,
  closeDate?: string | number,
  ticketDate?: string | number,
  status?: string
): DateDiffResult => {
  // Determine if ticket is closed
  const isClosedStatus = status
    ? (status.trim().toLowerCase() === 'closed' || status.trim().toLowerCase() === 'close')
    : false;
  
  const end = parseDateString(closeDate);
  const isClosed = isClosedStatus || !!end;

  // Primary start date: first visit date. Fallback start date: ticket creation date.
  const startVisit = parseDateString(firstVisitDate);
  const startCreated = parseDateString(ticketDate);
  const start = startVisit || startCreated;

  if (!start && !end) {
    return {
      days: null,
      text: 'N/A',
      badgeClass: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
      isSameDay: false,
      isClosed: false,
      isOpen: !isClosed
    };
  }

  // If closed:
  if (isClosed) {
    if (!start && end) {
      return {
        days: null,
        text: 'No Visit Date',
        badgeClass: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
        isSameDay: false,
        isClosed: true,
        isOpen: false
      };
    }

    if (start && end) {
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        return {
          days: 0,
          text: '0 Days (Same Day)',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50',
          isSameDay: true,
          isClosed: true,
          isOpen: false
        };
      }

      if (diffDays === 1) {
        return {
          days: 1,
          text: '1 Day',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50',
          isSameDay: false,
          isClosed: true,
          isOpen: false
        };
      }

      const isFast = diffDays <= 3;
      return {
        days: diffDays,
        text: `${diffDays} Days`,
        badgeClass: isFast
          ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50'
          : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50',
        isSameDay: false,
        isClosed: true,
        isOpen: false
      };
    }
  }

  // If ticket is STILL OPEN / HOLD (not closed):
  if (start && !isClosed) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pendingMs = today.getTime() - start.getTime();
    const pendingDays = Math.max(0, Math.round(pendingMs / (1000 * 60 * 60 * 24)));

    let badgeClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50';
    if (pendingDays >= 5) {
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50';
    } else if (pendingDays >= 2) {
      badgeClass = 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/50';
    }

    const text = pendingDays === 0
      ? '0 Days Open (Today)'
      : pendingDays === 1
      ? '1 Day Open'
      : `${pendingDays} Days Open`;

    return {
      days: pendingDays,
      text,
      badgeClass,
      isSameDay: false,
      isClosed: false,
      isOpen: true
    };
  }

  return {
    days: null,
    text: 'N/A',
    badgeClass: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    isSameDay: false,
    isClosed: false,
    isOpen: true
  };
};
