import React from 'react';
import { Ticket, Engineer } from '../types';
import { calculateDaysBetweenVisitAndClose, parseDateString } from '../utils/dateUtils';
import { 
  BarChart2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Inbox, 
  TrendingUp, 
  Users, 
  MapPin, 
  Layers,
  Database,
  Download,
  FileText,
  FileSpreadsheet,
  HardDrive,
  Printer,
  Eye,
  Search,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdminDashboardProps {
  tickets: Ticket[];
  engineers: Engineer[];
  onNavigateToTab: (tab: any) => void;
  onEditTicket: (ticket: Ticket) => void;
  onKpiClick?: (status: string, date: 'all' | 'today' | 'week' | 'month') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  tickets, 
  engineers, 
  onNavigateToTab,
  onEditTicket,
  onKpiClick
}) => {
  // Database files state
  const [dbFiles, setDbFiles] = React.useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = React.useState(true);

  const fetchDbFiles = async () => {
    try {
      setLoadingFiles(true);
      const res = await fetch('/api/db/files');
      if (res.ok) {
        const data = await res.json();
        setDbFiles(data.files || []);
      }
    } catch (e) {
      console.error('Failed to load DB files', e);
    } finally {
      setLoadingFiles(false);
    }
  };

  React.useEffect(() => {
    fetchDbFiles();
  }, [tickets]);

  const handleDownloadFile = (filename: string) => {
    window.open(`/api/db/download?file=${encodeURIComponent(filename)}`, '_blank');
  };

  // Stat calculations
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status && t.status.trim().toLowerCase() === 'open').length;
  const holdCount = tickets.filter(t => t.status && t.status.trim().toLowerCase() === 'hold').length;
  const closedCount = tickets.filter(t => t.status && (t.status.trim().toLowerCase() === 'closed' || t.status.trim().toLowerCase() === 'close')).length;
  
  // Today's tickets (Local date matches local server format)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = tickets.filter(t => t.date === todayStr).length;

  // Engineer wise tickets distribution
  const engineerWiseCounts = engineers.map(eng => {
    const assignedTickets = tickets.filter(t => {
      if (!t.engineer) return false;
      const tEng = t.engineer.trim().toLowerCase();
      const eName = eng.name.trim().toLowerCase();
      return tEng === eName || eName.includes(tEng) || tEng.includes(eName);
    });
    const open = assignedTickets.filter(t => t.status === 'Open').length;
    const hold = assignedTickets.filter(t => t.status === 'Hold').length;
    const closed = assignedTickets.filter(t => t.status === 'Closed').length;
    return {
      name: eng.name,
      total: assignedTickets.length,
      open,
      hold,
      closed
    };
  }).sort((a, b) => b.total - a.total);

  // Tickets with 'Others...' engineer or unassigned
  const otherOrEmptyTickets = tickets.filter(t => {
    if (!t.engineer) return true;
    const tEng = t.engineer.trim().toLowerCase();
    return !engineers.some(e => {
      const eName = e.name.trim().toLowerCase();
      return tEng === eName || eName.includes(tEng) || tEng.includes(eName);
    });
  });
  if (otherOrEmptyTickets.length > 0) {
    const open = otherOrEmptyTickets.filter(t => t.status === 'Open').length;
    const hold = otherOrEmptyTickets.filter(t => t.status === 'Hold').length;
    const closed = otherOrEmptyTickets.filter(t => t.status === 'Closed').length;
    engineerWiseCounts.push({
      name: 'Others / Unassigned',
      total: otherOrEmptyTickets.length,
      open,
      hold,
      closed
    });
  }

  // Location wise tickets
  const locationCounts: { [key: string]: number } = {};
  tickets.forEach(t => {
    const loc = t.location || 'Unknown';
    locationCounts[loc] = (locationCounts[loc] || 0) + 1;
  });
  const topLocations = Object.entries(locationCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Product category wise tickets
  const categoryCounts: { [key: string]: number } = {};
  tickets.forEach(t => {
    let cat = (t.category || t.product || 'Other').trim().toUpperCase();
    if (
      cat === 'ALL IN ONE' || 
      cat === 'ALL-IN-ONE' || 
      cat === 'ALL_IN_ONE' || 
      cat === 'ALL INONE' || 
      cat === 'AIO' || 
      cat === 'DESKTOP' ||
      cat === 'DESKTOP COMPUTER' ||
      cat === 'PC' ||
      cat.includes('ALL IN ONE') ||
      cat.includes('DESKTOP')
    ) {
      cat = 'AIO';
    } else if (
      cat === 'BROTHER' ||
      cat === 'PRINTER' ||
      cat.includes('BROTHER') ||
      cat.includes('PRINTER')
    ) {
      cat = 'PRINTER';
    } else if (
      cat === 'SWITCH' ||
      cat === 'NETWORK SWICTH' ||
      cat === 'NETWORK SWITCH' ||
      cat === 'NETWORK SWICTH' ||
      cat.includes('SWITCH') ||
      cat.includes('NETWORK') ||
      cat === 'NETWORK'
    ) {
      cat = 'NETWORK';
    }
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const topCategories = Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Recent tickets
  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Resolution duration stats across closed tickets
  const closedWithDates = tickets.filter(t => {
    if (!t.first_visit_date && !t.date) return false;
    const res = calculateDaysBetweenVisitAndClose(t.first_visit_date, t.close_date, t.date, t.status);
    return res.days !== null && res.isClosed;
  });

  const avgResolutionDays = closedWithDates.length > 0
    ? (closedWithDates.reduce((sum, t) => sum + (calculateDaysBetweenVisitAndClose(t.first_visit_date, t.close_date, t.date, t.status).days || 0), 0) / closedWithDates.length).toFixed(1) + ' Days'
    : 'N/A';

  // Active (Open + Hold) ticket duration & aging stats
  const activeTickets = tickets.filter(t => {
    const s = (t.status || '').trim().toLowerCase();
    return s === 'open' || s === 'hold';
  });
  const openAndHoldCount = openCount + holdCount;

  const activeTicketsWithDays = activeTickets.map(t => {
    const diff = calculateDaysBetweenVisitAndClose(t.first_visit_date, t.close_date, t.date, t.status);
    return { ticket: t, days: diff.days || 0, text: diff.text, badgeClass: diff.badgeClass };
  }).sort((a, b) => b.days - a.days);

  const avgActiveOpenDays = activeTicketsWithDays.length > 0
    ? (activeTicketsWithDays.reduce((sum, item) => sum + item.days, 0) / activeTicketsWithDays.length).toFixed(1) + ' Days'
    : '0 Days';

  const agingOver3DaysCount = activeTicketsWithDays.filter(i => i.days >= 3).length;
  const agingOver5DaysCount = activeTicketsWithDays.filter(i => i.days >= 5).length;
  const longestPending = activeTicketsWithDays.length > 0 ? activeTicketsWithDays[0] : null;

  // Print Active Calls (Open & Hold) Report
  const [activeCallsSortDir, setActiveCallsSortDir] = React.useState<'asc' | 'desc'>('asc');

  // Regional Director Monthly Report state
  const [rdReportYear, setRdReportYear] = React.useState<number>(2026);
  const [rdReportMonth, setRdReportMonth] = React.useState<number>(2); // Default to February 2026 (or latest)
  const [expandedRdMetric, setExpandedRdMetric] = React.useState<'pendingStart' | 'newReceived' | 'outstandingEnd' | 'pendingOver3m' | null>(null);
  const [rdMetricSearchQuery, setRdMetricSearchQuery] = React.useState<string>('');
  const [rdSubPage, setRdSubPage] = React.useState<number>(1);

  const getTicketLogYearMonth = (t: Ticket): { year: number; monthIndex: number } => {
    if (t.ticket_id) {
      const cleanId = t.ticket_id.trim();
      // Ticket ID format: YYYYMMttt e.g., 202602001 -> Year 2026, Month 02 (February)
      if (/^\d{6,}/.test(cleanId)) {
        const year = parseInt(cleanId.substring(0, 4), 10);
        const monthIndex = parseInt(cleanId.substring(4, 6), 10) - 1;
        if (year >= 2000 && monthIndex >= 0 && monthIndex <= 11) {
          return { year, monthIndex };
        }
      }
    }
    const d = parseDateString(t.date) || parseDateString(t.first_visit_date) || parseDateString(t.created_at);
    if (d) {
      return { year: d.getFullYear(), monthIndex: d.getMonth() };
    }
    return { year: 2026, monthIndex: 1 }; // Default February 2026
  };

  // Generate dynamic list of months starting from February 2026 continuously
  const rdReportMonthList = React.useMemo(() => {
    let maxYear = 2026;
    let maxMonthIndex = 6; // At least July 2026

    tickets.forEach((t) => {
      const ym = getTicketLogYearMonth(t);
      if (ym.year > maxYear || (ym.year === maxYear && ym.monthIndex > maxMonthIndex)) {
        maxYear = ym.year;
        maxMonthIndex = ym.monthIndex;
      }
    });

    const list: { name: string; shortName: string; year: number; monthNum: number }[] = [];
    let currY = 2026;
    let currM = 1; // 1 = Feb (0-indexed)

    while (currY < maxYear || (currY === maxYear && currM <= maxMonthIndex)) {
      const monthDate = new Date(currY, currM, 1);
      const name = monthDate.toLocaleString('en-US', { month: 'long' });
      const shortName = monthDate.toLocaleString('en-US', { month: 'short' });
      list.push({ name, shortName, year: currY, monthNum: currM + 1 });
      currM++;
      if (currM > 11) {
        currM = 0;
        currY++;
      }
    }

    return list;
  }, [tickets]);

  // Calculate Regional Director Monthly Stats
  const getRdReportStats = (selectedYear: number, selectedMonthNum: number) => {
    const selectedMonthIndex = selectedMonthNum - 1;
    const monthStart = new Date(selectedYear, selectedMonthIndex, 1);
    const monthEnd = new Date(selectedYear, selectedMonthIndex + 1, 0, 23, 59, 59);

    // 1. Pending at beginning of month: logged before this month & NOT closed before monthStart
    const pendingStartTickets = tickets.filter(t => {
      const ym = getTicketLogYearMonth(t);
      if (ym.year > selectedYear) return false;
      if (ym.year === selectedYear && ym.monthIndex >= selectedMonthIndex) return false;

      const isClosed = (t.status || '').trim().toLowerCase() === 'closed';
      if (isClosed) {
        const closeDate = parseDateString(t.close_date);
        if (!closeDate || closeDate < monthStart) return false;
      }
      return true;
    });

    // 2. New complaints received during month: logged during this month (matching Ticket ID month prefix or date)
    const newReceivedTickets = tickets.filter(t => {
      const ym = getTicketLogYearMonth(t);
      return ym.year === selectedYear && ym.monthIndex === selectedMonthIndex;
    });

    // 4. Outstanding at end of month: logged on or before this month & NOT closed on or before monthEnd
    const outstandingEndTickets = tickets.filter(t => {
      const ym = getTicketLogYearMonth(t);
      if (ym.year > selectedYear) return false;
      if (ym.year === selectedYear && ym.monthIndex > selectedMonthIndex) return false;

      const isClosed = (t.status || '').trim().toLowerCase() === 'closed';
      if (isClosed) {
        const closeDate = parseDateString(t.close_date);
        if (!closeDate || closeDate <= monthEnd) return false;
      }
      return true;
    });

    // 3. Resolved during the month: (Pending at Start + New Received) - Outstanding at End
    const pendingAtStart = pendingStartTickets.length;
    const newReceived = newReceivedTickets.length;
    const outstandingEnd = outstandingEndTickets.length;
    const resolved = (pendingAtStart + newReceived) - outstandingEnd;

    // 5. Pending > 3 months: currently unresolved (or outstanding at end) AND logged >= 3 months prior
    const pendingOver3mTickets = outstandingEndTickets.filter(t => {
      const isClosed = (t.status || '').trim().toLowerCase() === 'closed';
      if (isClosed) return false; // Only active unresolved calls (Open or Hold)
      const ym = getTicketLogYearMonth(t);
      const monthsAgo = (selectedYear - ym.year) * 12 + (selectedMonthIndex - ym.monthIndex);
      return monthsAgo >= 3;
    });

    return {
      pendingAtStart,
      pendingStartList: pendingStartTickets,
      newReceived,
      newReceivedList: newReceivedTickets,
      resolved,
      outstandingEnd,
      pendingOver3Months: pendingOver3mTickets.length,
      pendingOver3mList: pendingOver3mTickets,
      outstandingEndList: outstandingEndTickets,
    };
  };

  const rdStatsCurrent = getRdReportStats(rdReportYear, rdReportMonth);
  const monthNameStr = new Date(rdReportYear, rdReportMonth - 1, 1).toLocaleString('en-US', { month: 'long' });

  const handlePrintRdReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocked. Please allow popups to print report.');
      return;
    }

    const stats = getRdReportStats(rdReportYear, rdReportMonth);

    // Build multi-month summary rows from February 2026 onwards
    const matrixRowsHtml = rdReportMonthList.map((m) => {
      const st = getRdReportStats(m.year, m.monthNum);
      const holdStartCount = st.pendingStartList.filter(t => (t.status || '').trim().toLowerCase() === 'hold').length;
      const pendingStartHold = holdStartCount > 0 ? ` (${holdStartCount} hold)` : '';
      return `
        <tr>
          <td style="font-weight: bold; text-align: center;">${m.name} ${m.year}</td>
          <td style="text-align: center;">${st.pendingAtStart}${pendingStartHold}</td>
          <td style="text-align: center; font-weight: bold; color: #2563eb;">${st.newReceived}</td>
          <td style="text-align: center; font-weight: bold; color: #16a34a;">${st.resolved}</td>
          <td style="text-align: center; font-weight: bold; color: #d97706;">${st.outstandingEnd}</td>
          <td style="text-align: center; font-weight: bold; color: #dc2626;">${st.pendingOver3Months > 0 ? st.pendingOver3Months : '0'}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Regional Director Monthly Report - ${monthNameStr} ${rdReportYear}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; color: #1e293b; margin: 0; padding: 20px; line-height: 1.4; }
            .header-box { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 20px; }
            .org-title { font-size: 18px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px; }
            .report-title { font-size: 14px; font-weight: 700; color: #475569; margin-top: 4px; text-decoration: underline; }
            .period-badge { font-size: 12px; font-weight: 800; color: #2563eb; margin-top: 4px; }
            
            .section-title { font-size: 12px; font-weight: bold; color: #1e3a8a; margin-top: 15px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
            
            table.grid-table { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 20px; font-size: 11px; }
            table.grid-table th, table.grid-table td { border: 1px solid #64748b; padding: 8px 10px; text-align: center; }
            table.grid-table th { background-color: #f8fafc; color: #0f172a; font-weight: bold; }
            
            table.report-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            table.report-table th, table.report-table td { border: 1px solid #94a3b8; padding: 8px 12px; text-align: left; }
            table.report-table th { background-color: #1e293b; color: #ffffff; font-weight: bold; font-size: 11px; }
            table.report-table td.num { font-weight: bold; text-align: right; font-size: 12px; color: #0f172a; width: 100px; }
            
            .sub-list { margin-top: 20px; }
            .sub-list h3 { font-size: 12px; color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; }
            table.detail-table { width: 100%; border-collapse: collapse; font-size: 10px; }
            table.detail-table th, table.detail-table td { border: 1px solid #cbd5e1; padding: 6px 8px; }
            table.detail-table th { background-color: #f1f5f9; color: #334155; }
            
            .footer-sig { margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header-box">
            <div class="org-title">EMPLOYEES' STATE INSURANCE CORPORATION (ESIC)</div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600;">Regional Office, IT Department / Helpdesk</div>
            <div class="report-title">REGIONAL DIRECTOR MONTHLY REPORT</div>
            <div class="period-badge">Report Period: ${monthNameStr} ${rdReportYear}</div>
          </div>

          <!-- 1. Matrix Overview Table matching Regional Director format -->
          <div class="section-title">Regional Director Monthly Complaints Matrix</div>
          <table class="grid-table">
            <thead>
              <tr>
                <th style="width: 80px;">Month</th>
                <th>Complaints pending at the beginning of the month</th>
                <th>New complaints received during the month</th>
                <th>total Complaints resolved during the month</th>
                <th>Outstanding complaints at the end of the month</th>
                <th>Complaints pending for more than 03 months</th>
              </tr>
            </thead>
            <tbody>
              ${matrixRowsHtml}
            </tbody>
          </table>

          <!-- 2. Selected Month Breakdown -->
          <div class="section-title">Detailed Breakup - Particulars for ${monthNameStr} ${rdReportYear}</div>
          <table class="report-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">S.N.</th>
                <th>Particulars / Performance Metric</th>
                <th style="text-align: right;">Total Complaints</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center;">1</td>
                <td><strong>Complaints pending at the beginning of the month</strong></td>
                <td class="num">${stats.pendingAtStart}</td>
              </tr>
              <tr>
                <td style="text-align: center;">2</td>
                <td><strong>New complaints received during the month</strong></td>
                <td class="num" style="color: #2563eb;">${stats.newReceived}</td>
              </tr>
              <tr>
                <td style="text-align: center;">3</td>
                <td><strong>Total complaints resolved during the month</strong></td>
                <td class="num" style="color: #16a34a;">${stats.resolved}</td>
              </tr>
              <tr style="background-color: #f8fafc;">
                <td style="text-align: center;">4</td>
                <td><strong>Outstanding complaints at the end of the month</strong></td>
                <td class="num" style="color: #d97706;">${stats.outstandingEnd}</td>
              </tr>
              <tr style="background-color: #fef2f2;">
                <td style="text-align: center;">5</td>
                <td><strong style="color: #991b1b;">Complaints pending for more than 03 months</strong></td>
                <td class="num" style="color: #dc2626;">${stats.pendingOver3Months}</td>
              </tr>
            </tbody>
          </table>

          ${stats.pendingStartList.length > 0 ? `
            <div class="sub-list">
              <h3>📌 Details of Complaints Pending at Beginning of Month (${monthNameStr} ${rdReportYear}) (${stats.pendingStartList.length} Calls)</h3>
              <table class="detail-table">
                <thead>
                  <tr>
                    <th>Sr</th>
                    <th>Ticket ID</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Problem Description</th>
                    <th>Engineer</th>
                    <th>Status</th>
                    <th>Close Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${stats.pendingStartList.map((t, i) => `
                    <tr>
                      <td>${i + 1}</td>
                      <td><strong>${t.ticket_id}</strong></td>
                      <td>${t.date || t.first_visit_date || ''}</td>
                      <td>${t.location || ''}</td>
                      <td>${t.problem || ''}</td>
                      <td>${t.engineer || ''}</td>
                      <td><span style="font-weight: bold;">${t.status || ''}</span></td>
                      <td>${t.close_date || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          ${stats.pendingOver3mList.length > 0 ? `
            <div class="sub-list">
              <h3>📌 Details of Complaints Pending for More Than 03 Months (${stats.pendingOver3Months})</h3>
              <table class="detail-table">
                <thead>
                  <tr>
                    <th>Sr</th>
                    <th>Ticket ID</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Problem Description</th>
                    <th>Engineer</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${stats.pendingOver3mList.map((t, i) => `
                    <tr>
                      <td>${i + 1}</td>
                      <td><strong>${t.ticket_id}</strong></td>
                      <td>${t.date}</td>
                      <td>${t.location}</td>
                      <td>${t.problem}</td>
                      <td>${t.engineer}</td>
                      <td><span style="color: #9333ea; font-weight: bold;">${t.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <div class="footer-sig">
            <div>Submitted By: IT Helpdesk Administrator</div>
            <div>Approved By: Regional Director / Authority</div>
          </div>

          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintActiveCalls = (overrideSortDir?: 'asc' | 'desc') => {
    const dir = overrideSortDir || activeCallsSortDir;

    const activeCalls = tickets.filter(t => {
      const s = (t.status || '').trim().toLowerCase();
      return s === 'open' || s === 'hold';
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocked. Please allow popups to print/export active calls.');
      return;
    }

    const getTicketDateObj = (t: Ticket): Date => {
      return parseDateString(t.date) || parseDateString(t.first_visit_date) || parseDateString(t.created_at) || new Date(0);
    };

    // Sort active calls month-wise / date-wise and numeric ticket ID
    const sortedActiveCalls = [...activeCalls].sort((a, b) => {
      const timeA = getTicketDateObj(a).getTime();
      const timeB = getTicketDateObj(b).getTime();

      if (timeA !== timeB) {
        return dir === 'asc' ? timeA - timeB : timeB - timeA;
      }

      // Secondary sort by numeric ticket ID
      const numA = parseInt(String(a.ticket_id || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(String(b.ticket_id || '').replace(/\D/g, ''), 10) || 0;
      return dir === 'asc' ? numA - numB : numB - numA;
    });

    // Group sorted calls month-wise
    const monthGroupsMap = new Map<string, Ticket[]>();
    sortedActiveCalls.forEach(t => {
      const dateObj = getTicketDateObj(t);
      const monthKey = dateObj.getTime() > 0
        ? dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' })
        : 'Unspecified Month';

      if (!monthGroupsMap.has(monthKey)) {
        monthGroupsMap.set(monthKey, []);
      }
      monthGroupsMap.get(monthKey)!.push(t);
    });

    let overallRowIdx = 1;
    let tableHtml = '';

    const monthPills: string[] = [];

    monthGroupsMap.forEach((groupTickets, monthName) => {
      monthPills.push(`<strong>${monthName}:</strong> ${groupTickets.length}`);

      // Month Header Row
      tableHtml += `
        <tr style="background-color: #1e293b; color: #ffffff; font-weight: 800; font-size: 11px;">
          <td colspan="14" style="padding: 8px 10px; background-color: #1e293b; color: #f8fafc; border: 1px solid #0f172a;">
            📅 <span style="letter-spacing: 0.5px; text-transform: uppercase;">${monthName}</span>
            &nbsp;—&nbsp;
            <span style="color: #38bdf8; font-weight: normal;">${groupTickets.length} Call(s) Pending</span>
          </td>
        </tr>
      `;

      groupTickets.forEach((t) => {
        const duration = calculateDaysBetweenVisitAndClose(t.first_visit_date, t.close_date, t.date, t.status);
        const isHold = (t.status || '').trim().toLowerCase() === 'hold';
        const statusBadge = isHold
          ? '<span style="background: #f3e8ff; color: #6b21a8; padding: 2px 7px; border-radius: 4px; font-weight: bold; font-size: 10px; border: 1px solid #d8b4fe;">HOLD</span>'
          : '<span style="background: #e0e7ff; color: #3730a3; padding: 2px 7px; border-radius: 4px; font-weight: bold; font-size: 10px; border: 1px solid #c7d2fe;">OPEN</span>';

        tableHtml += `
          <tr>
            <td style="text-align: center; font-weight: 500;">${overallRowIdx++}</td>
            <td style="font-family: monospace; font-weight: bold; color: #1e40af;">${t.ticket_id || ''}</td>
            <td style="font-weight: 600;">${t.date || ''}</td>
            <td style="font-weight: 600;">${t.username || ''}</td>
            <td>${t.contact || ''}</td>
            <td>${t.location || ''}</td>
            <td>${t.product || ''} ${t.model ? ' - ' + t.model : ''}</td>
            <td style="max-width: 220px; word-wrap: break-word;">${t.problem || ''}</td>
            <td style="font-weight: 500;">${t.engineer || ''}</td>
            <td style="text-align: center;">${statusBadge}</td>
            <td>${t.first_visit_date || 'N/A'}</td>
            <td>${t.hold_date || 'N/A'}</td>
            <td style="text-align: center; font-weight: bold; color: ${duration.days && duration.days >= 3 ? '#b91c1c' : '#1e3a8a'};">
              ${duration.text}
            </td>
            <td style="max-width: 180px; word-wrap: break-word;">${t.engineer_remark || ''}</td>
          </tr>
        `;
      });
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Active Calls Report (Month-wise ${dir === 'asc' ? 'Ascending' : 'Descending'})</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; color: #1e293b; margin: 0; padding: 15px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 15px; }
            .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
            .subtitle { font-size: 11px; color: #64748b; margin-top: 4px; }
            .summary-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 16px; margin-bottom: 15px; display: flex; flex-wrap: wrap; gap: 20px; align-items: center; }
            .stat-item { font-size: 11px; color: #475569; }
            .stat-item strong { font-size: 14px; color: #0f172a; display: block; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10.5px; }
            th { background: #0f172a; color: #ffffff; font-weight: bold; text-align: left; padding: 8px 8px; border: 1px solid #334155; }
            td { padding: 7px 8px; border: 1px solid #cbd5e1; vertical-align: top; }
            tr:nth-child(even) { background-color: #f8fafc; }
            tr { page-break-inside: avoid; }
            .footer { margin-top: 20px; font-size: 9px; color: #94a3b8; text-align: justify; border-top: 1px solid #e2e8f0; padding-top: 8px; }
            @media print {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">📋 Active Service Calls Summary Report (Open & Hold)</h1>
              <div class="subtitle">
                Month-wise Order: <strong>${dir === 'asc' ? 'Ascending ⬆️ (Oldest to Newest Month)' : 'Descending ⬇️ (Newest to Oldest Month)'}</strong> • Generated on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
              </div>
            </div>
            <div style="text-align: right;">
              <strong style="font-size: 14px; color: #2563eb;">ESIC Helpdesk Operations</strong>
              <div style="font-size: 10px; color: #64748b;">Pending Active Service Calls</div>
            </div>
          </div>

          <div class="summary-box">
            <div class="stat-item"><span>Total Active Calls:</span> <strong>${activeCalls.length}</strong></div>
            <div class="stat-item"><span>Open Calls:</span> <strong style="color: #3730a3;">${openCount}</strong></div>
            <div class="stat-item"><span>Hold Calls:</span> <strong style="color: #6b21a8;">${holdCount}</strong></div>
            <div class="stat-item"><span>Avg Duration:</span> <strong>${avgActiveOpenDays}</strong></div>
            <div class="stat-item"><span>Aging (≥3 Days):</span> <strong style="color: #b91c1c;">${agingOver3DaysCount}</strong></div>
            <div class="stat-item" style="border-left: 1px solid #cbd5e1; padding-left: 15px;">
              <span>Month Breakdown:</span>
              <div style="font-size: 11px; color: #334155; margin-top: 2px;">
                ${monthPills.join(' &nbsp;•&nbsp; ')}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th>Ticket ID</th>
                <th>Call Date</th>
                <th>Client Name</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Product / Model</th>
                <th>Problem / Issue</th>
                <th>Engineer</th>
                <th style="text-align: center;">Status</th>
                <th>First Visit</th>
                <th>Hold Date</th>
                <th style="text-align: center;">Days Open</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${tableHtml.length > 0 ? tableHtml : '<tr><td colspan="14" style="text-align:center; padding:20px;">No Active Open or Hold Calls Found</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            Confidential IT Helpdesk Operations Document.
          </div>

          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 -translate-y-4 translate-x-4 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">IT Service Desk Overview</h1>
          <p className="text-indigo-100 dark:text-slate-300 max-w-xl text-sm">
            Welcome to the command center. Easily track helpdesk metrics, monitor active engineer loads, and parse incoming WhatsApp messages instantly.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
        {[
          { title: "Today's Calls", value: todayCount, sub: "New today", icon: <Clock className="w-5 h-5 text-amber-500" />, bg: "bg-amber-500/10 dark:bg-amber-500/5", border: "border-amber-100 dark:border-amber-950/40", status: "all", date: "today" as const },
          { title: "Open Calls", value: openCount, sub: "In progress", icon: <Inbox className="w-5 h-5 text-indigo-500" />, bg: "bg-indigo-500/10 dark:bg-indigo-500/5", border: "border-indigo-100 dark:border-indigo-950/40", status: "Open", date: "all" as const },
          { title: "Hold Calls", value: holdCount, sub: "Awaiting parts/info", icon: <AlertCircle className="w-5 h-5 text-purple-500" />, bg: "bg-purple-500/10 dark:bg-purple-500/5", border: "border-purple-100 dark:border-purple-950/40", status: "Hold", date: "all" as const },
          { title: "Open & Hold", value: openAndHoldCount, sub: `${openCount} Open • ${holdCount} Hold`, icon: <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />, bg: "bg-blue-500/10 dark:bg-blue-500/5", border: "border-blue-200 dark:border-blue-900/50", status: "Open_Hold", date: "all" as const },
          { title: "Closed Calls", value: closedCount, sub: "Resolved", icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, bg: "bg-emerald-500/10 dark:bg-emerald-500/5", border: "border-emerald-100 dark:border-emerald-950/40", status: "Closed", date: "all" as const },
          { title: "Avg Resolution", value: avgResolutionDays, sub: "Closed calls avg", icon: <Clock className="w-5 h-5 text-sky-500" />, bg: "bg-sky-500/10 dark:bg-sky-500/5", border: "border-sky-100 dark:border-sky-950/40", status: "Closed", date: "all" as const },
          { title: "Total Calls", value: totalCount, sub: "All time total", icon: <TrendingUp className="w-5 h-5 text-slate-700 dark:text-slate-300" />, bg: "bg-slate-500/10 dark:bg-slate-500/5", border: "border-slate-200/80 dark:border-slate-800", status: "all", date: "all" as const }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: idx * 0.04, duration: 0.2 }}
            onClick={() => onKpiClick && onKpiClick(stat.status, stat.date)}
            className={`bg-white dark:bg-slate-900 rounded-xl p-4 border ${stat.border} shadow-[0_1px_3px_rgba(0,0,0,0.04)] bg-gradient-to-br ${stat.bg} flex flex-col justify-between relative overflow-hidden cursor-pointer hover:shadow-md transition-all group select-none`}
            title={`Click to view all ${stat.title}`}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{stat.title}</span>
              <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-slate-700/60 group-hover:bg-slate-50 dark:group-hover:bg-slate-750 transition-colors shrink-0">
                {stat.icon}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{stat.value}</h3>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                {stat.sub}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Live Field Radar Shortcut Banner */}
      <div 
        onClick={() => onNavigateToTab('LiveTracker')}
        className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white rounded-2xl p-5 shadow-md border border-indigo-500/30 hover:border-indigo-400 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 text-2xl flex items-center justify-center border border-white/20 shadow-inner group-hover:scale-105 transition-transform">
            🛵
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white font-extrabold text-[10px] uppercase tracking-wider">
                Live Field Radar
              </span>
              <span className="text-xs text-indigo-200 font-bold">
                Motorcycle Rider Navigation
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white mt-0.5">
              Track Field Engineers En-Route on Live Map
            </h3>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              View live GPS motorcycle movement, road travel routes, rider engineer names, speed, and real-time ETAs.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNavigateToTab('LiveTracker'); }}
          className="px-4 py-2.5 rounded-xl bg-white text-indigo-900 font-black text-xs hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-sm shrink-0 cursor-pointer"
        >
          <span>Launch Live Map</span>
          <span>➔</span>
        </button>
      </div>

      {/* Active Calls & Aging Call Summary Panel */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-indigo-900/40 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Active Calls Summary (Open & Hold)
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-500 text-white shadow-sm">
                  {openAndHoldCount} Total Pending Calls
                </span>
              </h2>
              <p className="text-xs text-indigo-200/80">
                Live monitoring of all non-resolved service calls and current open duration aging.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
            {/* Sort direction selector for printing active calls */}
            <div className="flex items-center bg-indigo-950/80 border border-indigo-700/60 rounded-xl p-1 shadow-sm gap-1">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wide px-2">Month Sort:</span>
              <button
                type="button"
                onClick={() => setActiveCallsSortDir('asc')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeCallsSortDir === 'asc'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-indigo-300 hover:text-white'
                }`}
                title="Sort month-wise ascending (oldest to newest)"
              >
                ⬆️ Asc
              </button>
              <button
                type="button"
                onClick={() => setActiveCallsSortDir('desc')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeCallsSortDir === 'desc'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-indigo-300 hover:text-white'
                }`}
                title="Sort month-wise descending (newest to oldest)"
              >
                ⬇️ Desc
              </button>
            </div>

            <button
              onClick={() => handlePrintActiveCalls()}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              title={`Print Active Calls report grouped month-wise in ${activeCallsSortDir === 'asc' ? 'Ascending' : 'Descending'} order`}
            >
              <Printer className="w-4 h-4" />
              <span>Print Active Calls ({activeCallsSortDir === 'asc' ? 'Month ⬆️' : 'Month ⬇️'})</span>
            </button>

            <button
              onClick={() => onKpiClick && onKpiClick('Open_Hold', 'all')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <span>View All {openAndHoldCount} Active Calls</span>
              <span>➔</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs">
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-1">
            <div className="text-indigo-200/70 font-medium">Open Calls Count</div>
            <div className="text-xl font-black text-indigo-400 flex items-center justify-between">
              <span>{openCount}</span>
              <span className="text-[10px] font-normal text-indigo-300 bg-indigo-900/50 px-2 py-0.5 rounded-md">
                {totalCount > 0 ? ((openCount / totalCount) * 100).toFixed(0) : 0}% of Total
              </span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-1">
            <div className="text-purple-200/70 font-medium">Hold Calls Count</div>
            <div className="text-xl font-black text-purple-400 flex items-center justify-between">
              <span>{holdCount}</span>
              <span className="text-[10px] font-normal text-purple-300 bg-purple-900/50 px-2 py-0.5 rounded-md">
                {totalCount > 0 ? ((holdCount / totalCount) * 100).toFixed(0) : 0}% of Total
              </span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-1">
            <div className="text-amber-200/70 font-medium">Avg Open Call Duration</div>
            <div className="text-xl font-black text-amber-400">
              {avgActiveOpenDays}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-1">
            <div className="text-rose-200/70 font-medium">Aging Calls (≥ 3 Days)</div>
            <div className="text-xl font-black text-rose-400 flex items-center justify-between">
              <span>{agingOver3DaysCount}</span>
              <span className="text-[10px] text-rose-300 bg-rose-950/60 border border-rose-800/40 px-2 py-0.5 rounded-md">
                {agingOver5DaysCount} ≥5 Days
              </span>
            </div>
          </div>
        </div>

        {longestPending && longestPending.days > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-300 font-semibold">Longest Pending Active Call:</span>
              <span className="font-bold text-white bg-indigo-900/80 px-2 py-0.5 rounded border border-indigo-700/50">
                #{longestPending.ticket.ticket_id} ({longestPending.ticket.location || 'Unknown Location'})
              </span>
              <span className="text-slate-400">assigned to <strong className="text-white">{longestPending.ticket.engineer || 'Unassigned'}</strong></span>
            </div>
            <span className={`px-2.5 py-1 rounded-md font-extrabold border ${longestPending.badgeClass}`}>
              {longestPending.text}
            </span>
          </div>
        )}
      </div>

      {/* Regional Director Monthly Report Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                Official Submission
              </span>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                Regional Director Monthly Report
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Monthly complaint statistics summary formatted for Regional Director review.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Month Selectors */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 border border-slate-200 dark:border-slate-700 flex-wrap">
              {rdReportMonthList.map((m) => (
                <button
                  key={`${m.year}-${m.monthNum}`}
                  type="button"
                  onClick={() => { setRdReportYear(m.year); setRdReportMonth(m.monthNum); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    rdReportYear === m.year && rdReportMonth === m.monthNum
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {m.shortName} {m.year}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handlePrintRdReport}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
              title="Print official report for Regional Director"
            >
              <Printer className="w-4 h-4" />
              <span>Print RD Report</span>
            </button>
          </div>
        </div>

        {/* 1. Regional Director Monthly Report Table (Exact User Format) */}
        <div>
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
            <span>MONTHLY COMPLAINTS OVERVIEW MATRIX</span>
            <span className="text-[11px] text-slate-400 font-normal">Format: Regional Director Submission</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-center border-collapse">
              <thead className="bg-slate-800 text-white font-bold text-[11px]">
                <tr>
                  <th className="border border-slate-700 px-3 py-2.5 w-24">Month</th>
                  <th className="border border-slate-700 px-3 py-2.5 max-w-[160px]">
                    Complaints pending at the beginning of the month
                  </th>
                  <th className="border border-slate-700 px-3 py-2.5 max-w-[160px]">
                    New complaints received during the month
                  </th>
                  <th className="border border-slate-700 px-3 py-2.5 max-w-[160px]">
                    total Complaints resolved during the month
                  </th>
                  <th className="border border-slate-700 px-3 py-2.5 max-w-[160px]">
                    Outstanding complaints at the end of the month
                  </th>
                  <th className="border border-slate-700 px-3 py-2.5 max-w-[160px]">
                    Complaints pending for more than 03 months
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                {rdReportMonthList.map((m) => {
                  const st = getRdReportStats(m.year, m.monthNum);
                  const isSelected = rdReportYear === m.year && rdReportMonth === m.monthNum;

                  const holdStartCount = st.pendingStartList.filter(t => (t.status || '').trim().toLowerCase() === 'hold').length;
                  const pendingStartHold = holdStartCount > 0 ? ` (${holdStartCount} hold)` : '';
                  
                  return (
                    <tr
                      key={`${m.year}-${m.monthNum}`}
                      onClick={() => { setRdReportYear(m.year); setRdReportMonth(m.monthNum); }}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 font-semibold ring-1 ring-blue-400 dark:ring-blue-600'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-850'
                      }`}
                    >
                      <td className="border border-slate-200 dark:border-slate-800 px-3 py-2.5 font-bold text-slate-900 dark:text-slate-100">
                        {m.name} {m.year}
                      </td>
                      <td className="border border-slate-200 dark:border-slate-800 px-3 py-2.5 font-mono">
                        {st.pendingAtStart}{pendingStartHold}
                      </td>
                      <td className="border border-slate-200 dark:border-slate-800 px-3 py-2.5 font-mono text-blue-600 dark:text-blue-400 font-bold">
                        {st.newReceived}
                      </td>
                      <td className="border border-slate-200 dark:border-slate-800 px-3 py-2.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {st.resolved}
                      </td>
                      <td className="border border-slate-200 dark:border-slate-800 px-3 py-2.5 font-mono text-amber-600 dark:text-amber-400 font-bold">
                        {st.outstandingEnd}
                      </td>
                      <td className="border border-slate-200 dark:border-slate-800 px-3 py-2.5 font-mono text-rose-600 dark:text-rose-400 font-bold">
                        {st.pendingOver3Months > 0 ? st.pendingOver3Months : '0'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Detailed Performance Metric Breakdown for Selected Month */}
        <div className="pt-2 space-y-3">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>DETAILED METRICS FOR {monthNameStr.toUpperCase()} {rdReportYear}</span>
            <span className="text-[11px] text-slate-400 font-normal">Click any metric row to inspect call details</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                <tr>
                  <th className="px-4 py-2.5 w-12 text-center">S.N.</th>
                  <th className="px-4 py-2.5">Particulars / Performance Metric</th>
                  <th className="px-4 py-2.5 text-right w-44">Total Complaints</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                {/* 1. Pending at Start */}
                <tr
                  onClick={() => setExpandedRdMetric(expandedRdMetric === 'pendingStart' ? null : 'pendingStart')}
                  className={`cursor-pointer transition-colors ${
                    expandedRdMetric === 'pendingStart'
                      ? 'bg-blue-50/90 dark:bg-blue-950/40 font-semibold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <td className="px-4 py-2.5 text-center text-slate-400">1</td>
                  <td className="px-4 py-2.5 font-semibold flex items-center justify-between gap-2">
                    <span>Complaints pending at the beginning of the month</span>
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-bold transition-colors ${
                      expandedRdMetric === 'pendingStart'
                        ? 'bg-blue-600 text-white dark:bg-blue-500'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 hover:bg-blue-200'
                    }`}>
                      <Eye className="w-3 h-3" />
                      {expandedRdMetric === 'pendingStart' ? 'Hide Calls List' : `View Calls (${rdStatsCurrent.pendingStartList.length})`}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {rdStatsCurrent.pendingAtStart}
                  </td>
                </tr>

                {/* 2. New Received */}
                <tr
                  onClick={() => setExpandedRdMetric(expandedRdMetric === 'newReceived' ? null : 'newReceived')}
                  className={`cursor-pointer transition-colors ${
                    expandedRdMetric === 'newReceived'
                      ? 'bg-blue-50/90 dark:bg-blue-950/40 font-semibold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <td className="px-4 py-2.5 text-center text-slate-400">2</td>
                  <td className="px-4 py-2.5 font-semibold flex items-center justify-between gap-2">
                    <span>New complaints received during the month</span>
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-bold transition-colors ${
                      expandedRdMetric === 'newReceived'
                        ? 'bg-blue-600 text-white dark:bg-blue-500'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 hover:bg-blue-200'
                    }`}>
                      <Eye className="w-3 h-3" />
                      {expandedRdMetric === 'newReceived' ? 'Hide Calls List' : `View Calls (${rdStatsCurrent.newReceivedList.length})`}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                    {rdStatsCurrent.newReceived}
                  </td>
                </tr>

                {/* 3. Total Resolved */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-850">
                  <td className="px-4 py-2.5 text-center text-slate-400">3</td>
                  <td className="px-4 py-2.5 font-semibold">Total complaints resolved during the month</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {rdStatsCurrent.resolved}
                  </td>
                </tr>

                {/* 4. Outstanding End */}
                <tr
                  onClick={() => setExpandedRdMetric(expandedRdMetric === 'outstandingEnd' ? null : 'outstandingEnd')}
                  className={`cursor-pointer transition-colors ${
                    expandedRdMetric === 'outstandingEnd'
                      ? 'bg-amber-100/80 dark:bg-amber-950/50 font-semibold'
                      : 'bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                  }`}
                >
                  <td className="px-4 py-2.5 text-center text-slate-400">4</td>
                  <td className="px-4 py-2.5 font-bold text-amber-900 dark:text-amber-300 flex items-center justify-between gap-2">
                    <span>Outstanding complaints at the end of the month</span>
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-bold transition-colors ${
                      expandedRdMetric === 'outstandingEnd'
                        ? 'bg-amber-600 text-white dark:bg-amber-500'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 hover:bg-amber-200'
                    }`}>
                      <Eye className="w-3 h-3" />
                      {expandedRdMetric === 'outstandingEnd' ? 'Hide Calls List' : `View Calls (${rdStatsCurrent.outstandingEndList.length})`}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-amber-700 dark:text-amber-400 text-sm">
                    {rdStatsCurrent.outstandingEnd}
                  </td>
                </tr>

                {/* 5. Pending > 3 months */}
                <tr
                  onClick={() => setExpandedRdMetric(expandedRdMetric === 'pendingOver3m' ? null : 'pendingOver3m')}
                  className={`cursor-pointer transition-colors ${
                    expandedRdMetric === 'pendingOver3m'
                      ? 'bg-rose-100/80 dark:bg-rose-950/50 font-semibold'
                      : 'bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                  }`}
                >
                  <td className="px-4 py-2.5 text-center text-slate-400">5</td>
                  <td className="px-4 py-2.5 font-bold text-rose-900 dark:text-rose-300 flex items-center justify-between gap-2">
                    <span>Complaints pending for more than 03 months</span>
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-bold transition-colors ${
                      expandedRdMetric === 'pendingOver3m'
                        ? 'bg-rose-600 text-white dark:bg-rose-500'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 hover:bg-rose-200'
                    }`}>
                      <Eye className="w-3 h-3" />
                      {expandedRdMetric === 'pendingOver3m' ? 'Hide Calls List' : `View Calls (${rdStatsCurrent.pendingOver3mList.length})`}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                    {rdStatsCurrent.pendingOver3Months}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Interactive Calls Sub-Table when a metric is expanded */}
          {expandedRdMetric && (() => {
            const listMap = {
              pendingStart: rdStatsCurrent.pendingStartList,
              newReceived: rdStatsCurrent.newReceivedList,
              outstandingEnd: rdStatsCurrent.outstandingEndList,
              pendingOver3m: rdStatsCurrent.pendingOver3mList,
            };
            const titleMap = {
              pendingStart: `Complaints Pending at Beginning of ${monthNameStr} ${rdReportYear}`,
              newReceived: `New Complaints Received during ${monthNameStr} ${rdReportYear}`,
              outstandingEnd: `Outstanding Complaints at End of ${monthNameStr} ${rdReportYear}`,
              pendingOver3m: `Complaints Pending for More Than 03 Months (${monthNameStr} ${rdReportYear})`,
            };
            const rawList = listMap[expandedRdMetric] || [];
            const q = rdMetricSearchQuery.toLowerCase().trim();
            const displayList = q
              ? rawList.filter(t => 
                  (t.ticket_id || '').toLowerCase().includes(q) ||
                  (t.location || '').toLowerCase().includes(q) ||
                  (t.problem || '').toLowerCase().includes(q) ||
                  (t.engineer || '').toLowerCase().includes(q) ||
                  (t.status || '').toLowerCase().includes(q)
                )
              : rawList;

            const subItemsPerPage = 10;
            const subTotalPages = Math.max(1, Math.ceil(displayList.length / subItemsPerPage));
            const activeSubPage = Math.min(rdSubPage, subTotalPages);
            const paginatedDisplayList = displayList.slice((activeSubPage - 1) * subItemsPerPage, activeSubPage * subItemsPerPage);

            return (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/70 dark:bg-slate-900/70 space-y-3 shadow-inner">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>{titleMap[expandedRdMetric]}</span>
                      <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-mono font-bold">
                        {rawList.length} Calls
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Showing 10 logs per page. Click on any row to view/edit ticket.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-52">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search call ID, location..."
                        value={rdMetricSearchQuery}
                        onChange={(e) => {
                          setRdMetricSearchQuery(e.target.value);
                          setRdSubPage(1);
                        }}
                        className="w-full text-xs pl-8 pr-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => setExpandedRdMetric(null)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800"
                      title="Close list"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-3 py-2 w-10 text-center">#</th>
                        <th className="px-3 py-2">Ticket ID</th>
                        <th className="px-3 py-2">Log Date</th>
                        <th className="px-3 py-2">Location / Dept</th>
                        <th className="px-3 py-2">Problem Description</th>
                        <th className="px-3 py-2">Assigned Engineer</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2 text-center">Close Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {paginatedDisplayList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-6 text-slate-400">
                            No complaints found matching filter criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedDisplayList.map((t, idx) => {
                          const statusLower = (t.status || '').toLowerCase();
                          const rowNum = (activeSubPage - 1) * subItemsPerPage + idx + 1;
                          return (
                            <tr
                              key={t.id || t.ticket_id || idx}
                              onClick={() => onEditTicket(t)}
                              className="hover:bg-blue-50/60 dark:hover:bg-blue-950/40 cursor-pointer transition-colors"
                            >
                              <td className="px-3 py-2 text-center text-slate-400 font-mono">{rowNum}</td>
                              <td className="px-3 py-2 font-mono font-bold text-blue-600 dark:text-blue-400">
                                {t.ticket_id}
                              </td>
                              <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{t.date || t.first_visit_date || '-'}</td>
                              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{t.location || '-'}</td>
                              <td className="px-3 py-2 text-slate-700 dark:text-slate-300 max-w-xs truncate" title={t.problem}>
                                {t.problem || '-'}
                              </td>
                              <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{t.engineer || '-'}</td>
                              <td className="px-3 py-2">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  statusLower === 'closed'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : statusLower === 'hold'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                }`}>
                                  {t.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center text-slate-500 font-mono">
                                {t.close_date || '-'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Sub-table Pagination bar */}
                {displayList.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 px-1">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Showing {(activeSubPage - 1) * subItemsPerPage + 1} to {Math.min(activeSubPage * subItemsPerPage, displayList.length)} of {displayList.length} calls
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRdSubPage(prev => Math.max(1, prev - 1))}
                        disabled={activeSubPage === 1}
                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Previous
                      </button>

                      <div className="flex items-center gap-1 text-xs">
                        {Array.from({ length: subTotalPages }).map((_, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => setRdSubPage(pIdx + 1)}
                            className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer ${
                              activeSubPage === pIdx + 1
                                ? 'bg-blue-600 text-white font-bold'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {pIdx + 1}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setRdSubPage(prev => Math.min(subTotalPages, prev + 1))}
                        disabled={activeSubPage === subTotalPages}
                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Analytics Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Engineer Wise Tickets Load */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <h2 className="text-md font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Engineer Task Loading
            </h2>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Duty Engineers</span>
          </div>

          <div className="space-y-4">
            {engineerWiseCounts.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No engineers found in the system. Add some to see tasks distribution.
              </div>
            ) : (
              engineerWiseCounts.map((eng, idx) => {
                return (
                  <div key={idx} className="space-y-1.5 p-3 rounded-xl border border-slate-50 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{eng.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex gap-2">
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{eng.open} Open</span>
                        <span className="text-purple-600 dark:text-purple-400 font-semibold">{eng.hold} Hold</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{eng.closed} Closed</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold">({eng.total} Total)</span>
                      </span>
                    </div>
                    {/* Multi-segmented Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      {eng.total > 0 ? (
                        <>
                          <div 
                             className="bg-indigo-500 transition-all duration-500 h-full" 
                            style={{ width: `${(eng.open / eng.total) * 100}%` }}
                            title={`${eng.open} Open`}
                          />
                          <div 
                            className="bg-purple-500 transition-all duration-500 h-full" 
                            style={{ width: `${(eng.hold / eng.total) * 100}%` }}
                            title={`${eng.hold} Hold`}
                          />
                          <div 
                            className="bg-emerald-500 transition-all duration-500 h-full" 
                            style={{ width: `${(eng.closed / eng.total) * 100}%` }}
                            title={`${eng.closed} Closed`}
                          />
                        </>
                      ) : (
                        <div className="w-0 h-full bg-slate-200 dark:bg-slate-700" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Categories & Locations Distribution */}
        <div className="space-y-6">
          {/* Top Categories */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-4">
            <h2 className="text-md font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/60">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Ticket Categories
            </h2>
            <div className="space-y-3">
              {topCategories.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-sm">No ticket categories found.</div>
              ) : (
                topCategories.map((cat, index) => {
                  const pct = totalCount > 0 ? (cat.count / totalCount) * 100 : 0;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <span>{cat.name}</span>
                        <span>{cat.count} tickets ({Math.round(pct)}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Top Locations */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-4">
            <h2 className="text-md font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/60">
              <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Top Outlets / Locations
            </h2>
            <div className="space-y-3">
              {topLocations.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-sm">No locations logged.</div>
              ) : (
                topLocations.map((loc, index) => {
                  const pct = totalCount > 0 ? (loc.count / totalCount) * 100 : 0;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <span>{loc.name}</span>
                        <span>{loc.count} tickets ({Math.round(pct)}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tickets Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/60">
          <h2 className="text-md font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Recently Created Tickets
          </h2>
          <button 
            onClick={() => onNavigateToTab('TicketsList')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline transition-colors cursor-pointer"
          >
            View All Tickets
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60">
              <tr>
                <th className="px-4 py-3 font-semibold">TID</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Problem</th>
                <th className="px-4 py-3 font-semibold">Engineer</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {recentTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-slate-400 dark:text-slate-500">
                    No tickets generated yet. Parse a WhatsApp message to get started!
                  </td>
                </tr>
              ) : (
                recentTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{t.ticket_id}</td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{t.date}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">{t.username}</td>
                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">{t.location}</td>
                    <td className="px-4 py-3.5 max-w-[200px] truncate text-slate-600 dark:text-slate-400" title={t.problem}>{t.problem}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">{t.engineer || 'Unassigned'}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        t.status === 'Open' ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-950/50' :
                        t.status === 'Hold' ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-100/50 dark:border-purple-950/50' :
                        'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-950/50'
                      }`}>
                        ● {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => onEditTicket(t)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline transition-colors cursor-pointer"
                      >
                        Edit / View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Database Storage & Backups File Explorer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/60">
          <h2 className="text-md font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Database Storage & Backups File Explorer
          </h2>
          <button 
            onClick={fetchDbFiles}
            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors cursor-pointer"
            title="Refresh files"
          >
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            Refresh
          </button>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-3xl">
          All ticket logs, engineer lists, and attendance worksheets are stored as structured JSON and auto-synchronized Excel spreadsheets in the persistent <code>/data</code> directory. Download copies directly in a single click.
        </p>

        {loadingFiles ? (
          <div className="flex items-center justify-center py-8 text-sm text-slate-400">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500 mr-2"></div>
            Scanning database storage directory...
          </div>
        ) : dbFiles.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No database files detected in storage.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dbFiles.map((file, index) => {
              const sizeKB = (file.size / 1024).toFixed(1);
              const lastUpdatedStr = new Date(file.updatedAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <motion.div
                  key={file.filename}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-slate-50/50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800/50 rounded-xl p-4 flex flex-col justify-between hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-slate-700/60">
                      {file.isExcel ? (
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <FileText className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                      )}
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={file.label}>
                        {file.label}
                      </h3>
                      <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500 truncate">
                        {file.filename}
                      </p>
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                          file.category === 'Tickets' ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-950/50' :
                          file.category === 'Engineers' ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-100/50 dark:border-purple-950/50' :
                          'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-950/50'
                        }`}>
                          {file.category}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          {sizeKB} KB
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 mt-4 pt-3">
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">
                      <span className="font-medium text-slate-500 dark:text-slate-400 block">Last Sync</span>
                      {lastUpdatedStr}
                    </div>
                    <button
                      onClick={() => handleDownloadFile(file.filename)}
                      className="inline-flex items-center gap-1 text-xs font-bold bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer transition-all hover:shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
