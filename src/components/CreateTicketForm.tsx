import React, { useState, useEffect } from 'react';
import { Ticket, Engineer } from '../types';
import { calculateDaysBetweenVisitAndClose } from '../utils/dateUtils';
import { normalizeModelString, getHardwareAliasSuggestion } from '../utils/modelNormalization';
import { 
  Sparkles, 
  Trash2, 
  Save, 
  AlertTriangle, 
  FileText, 
  CheckCircle, 
  User, 
  Phone, 
  MapPin, 
  Wrench, 
  Hash, 
  Loader2,
  Clock,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CreateTicketFormProps {
  engineers: Engineer[];
  editingTicket?: Ticket | null;
  onSaveTicket: (ticketData: Omit<Ticket, 'id' | 'ticket_id' | 'created_at' | 'updated_at'> & { id?: string; ticket_id?: string }) => Promise<void>;
  onCancelEdit?: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  systemMode: 'RO-Ahmedabad' | 'Surat';
  isAdmin?: boolean;
  defaultEngineer?: string;
}

export const CreateTicketForm: React.FC<CreateTicketFormProps> = ({
  engineers,
  editingTicket = null,
  onSaveTicket,
  onCancelEdit,
  showToast,
  systemMode,
  isAdmin = true,
  defaultEngineer = ''
}) => {
  // WhatsApp Paste State
  const [whatsappInput, setWhatsappInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  // Form Fields State
  const [id, setId] = useState<string | undefined>(undefined);
  const [tid, setTid] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [username, setUsername] = useState('');
  const [contact, setContact] = useState('');
  const [location, setLocation] = useState('');
  const [product, setProduct] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [problem, setProblem] = useState('');
  const [engineer, setEngineer] = useState('');
  const [status, setStatus] = useState<'Open' | 'Hold' | 'Closed'>('Open');
  const [actionTaken, setActionTaken] = useState('');
  const [firstVisitDate, setFirstVisitDate] = useState('');
  const [holdDate, setHoldDate] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isTidManuallyEdited, setIsTidManuallyEdited] = useState(false);
  const [suggestedTid, setSuggestedTid] = useState('');

  const handleStatusChange = (newStatus: 'Open' | 'Hold' | 'Closed') => {
    setStatus(newStatus);
    const today = new Date().toISOString().split('T')[0];
    if (newStatus === 'Closed' && !closeDate) {
      setCloseDate(today);
    } else if (newStatus === 'Hold' && !holdDate) {
      setHoldDate(today);
    } else if (!firstVisitDate) {
      setFirstVisitDate(today);
    }
  };
  const [touched, setTouched] = useState(false);

  const isMissingLocation = !location.trim();
  const isMissingUsername = !username.trim();
  const isMissingContact = !contact.trim();
  const isMissingProblem = !problem.trim();
  const isMissingEngineer = !engineer.trim();

  const hasValidationErrors = isMissingLocation || isMissingUsername || isMissingContact || isMissingProblem || isMissingEngineer;

  // Prefill when editing
  useEffect(() => {
    if (editingTicket) {
      setId(editingTicket.id);
      setTid(editingTicket.ticket_id);
      setDate(editingTicket.date);
      setUsername(editingTicket.username);
      setContact(editingTicket.contact);
      setLocation(editingTicket.location);
      setProduct(editingTicket.product);
      setCategory(editingTicket.category);
      setBrand(editingTicket.brand);
      setModel(editingTicket.model);
      setSerialNumber(editingTicket.serial_number);
      setProblem(editingTicket.problem);
      setEngineer(editingTicket.engineer);
      setStatus(editingTicket.status);
      setActionTaken(editingTicket.action_taken || '');
      setFirstVisitDate(editingTicket.first_visit_date || '');
      setHoldDate(editingTicket.hold_date || '');
      setCloseDate(editingTicket.close_date || '');
      setRemarks(editingTicket.engineer_remark || '');
      setTouched(false);
    } else {
      resetForm();
    }
  }, [editingTicket]);

  // Fetch TID automatically when in creation mode and date or systemMode changes
  useEffect(() => {
    if (!editingTicket) {
      fetchNextTID(date);
    }
  }, [date, systemMode, editingTicket]);

  // Pre-fill location based on systemMode in creation mode
  useEffect(() => {
    if (!editingTicket) {
      if (systemMode === 'Surat') {
        setLocation('Surat');
      } else if (location === 'Surat') {
        setLocation('');
      }
    }
  }, [systemMode, editingTicket]);

  // Pre-fill engineer if defaultEngineer passed
  useEffect(() => {
    if (!editingTicket && defaultEngineer) {
      setEngineer(prev => prev || defaultEngineer);
    }
  }, [defaultEngineer, editingTicket]);

  const fetchNextTID = async (forDate: string) => {
    try {
      const response = await fetch(`/api/tickets/next-tid?date=${forDate}&systemMode=${systemMode}`).catch(() => null);
      if (response && response.ok && response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        if (data.nextTid) {
          setSuggestedTid(data.nextTid);
          if (!isTidManuallyEdited) {
            setTid(data.nextTid);
          }
          return;
        }
      }
    } catch (err) {
      console.log('Using local TID generator');
    }

    // Standard YYYYMMNNN TID Generator matching DBService specification
    const targetDate = forDate ? new Date(forDate) : new Date();
    let year = targetDate.getFullYear();
    let month = targetDate.getMonth() + 1;
    if (isNaN(year) || isNaN(month)) {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1;
    }
    const yyyy = year.toString();
    const mm = month.toString().padStart(2, '0');
    const datePart = `${yyyy}${mm}`; // E.g., '202608'

    const isSurat = systemMode === 'Surat';
    const prefix = isSurat ? `sur-${datePart}` : datePart;

    const cachedTickets: any[] = JSON.parse(localStorage.getItem('cached_tickets') || '[]');
    let highestNNN = 0;
    for (const ticket of cachedTickets) {
      if (ticket.ticket_id && ticket.ticket_id.toLowerCase().startsWith(prefix.toLowerCase())) {
        const numPart = ticket.ticket_id.substring(prefix.length);
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > highestNNN) {
          highestNNN = num;
        }
      }
    }

    const nextNNN = (highestNNN + 1).toString().padStart(3, '0');
    const localNextTid = `${prefix}${nextNNN}`;
    setSuggestedTid(localNextTid);
    if (!isTidManuallyEdited) {
      setTid(localNextTid);
    }
  };

  const resetForm = () => {
    setId(undefined);
    setTid('');
    setSuggestedTid('');
    setIsTidManuallyEdited(false);
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    setUsername('');
    setContact('');
    setLocation('');
    setProduct('');
    setCategory('');
    setBrand('');
    setModel('');
    setSerialNumber('');
    setProblem('');
    setEngineer(defaultEngineer || '');
    setStatus('Open');
    setActionTaken('');
    setFirstVisitDate('');
    setHoldDate('');
    setCloseDate('');
    setRemarks('');
    setWhatsappInput('');
    setTouched(false);
    fetchNextTID(today);
  };

  const parseMessageData = (inputText: string) => {
    const text = (inputText || '').trim();
    if (!text) return null;

    // Extract Contact
    let contact = '';
    const phoneMatch = text.match(/(?:Contact(?:\s*No|\s*Number)?|Phone(?:\s*No|\s*Number)?|Mobile(?:\s*No|\s*Number)?|Mo\b|Mob\b|Ph\b|No\b)\s*[:=-]?\s*([0-9+\s-]{10,14})/i);
    if (phoneMatch) {
      contact = phoneMatch[1].replace(/[\s-]/g, '');
    } else {
      const genericPhone = text.match(/(?:(?:\+91|91|0)?[\s-]?)?([6-9]\d{9})/);
      if (genericPhone) {
        contact = genericPhone[1];
      }
    }

    // Extract User Name
    let username = '';
    const nameMatch = text.match(/(?:User\s*Name|User_name|Username|User|Name|Doctor|Dr\.|Officer|Staff|Person|Contact\s*Person)\s*[:=-]\s*([^\n\r]+)/i);
    if (nameMatch) {
      username = nameMatch[1].trim();
    }

    // Extract Location
    let location = '';
    const locMatch = text.match(/(?:Location|Branch\s*Office|Hospital|Center|Centre|Branch|Office|Dept|Place|BO)\s*[:=-]\s*([^\n\r]+)/i);
    if (locMatch) {
      location = locMatch[1].trim();
    } else {
      const boLine = text.match(/(?:^|\n)\s*(BO\s+[^\n\r]+)/i);
      if (boLine) {
        location = boLine[1].trim();
      }
    }
    if (!location && systemMode === 'Surat') {
      location = 'Surat';
    }

    // Extract Make / Model
    let rawMake = '';
    const makeMatch = text.match(/(?:Make|Model|Device|Machine|Brand|Hardware|Item|Equipment|Product\s*Model)\s*[:=-]\s*([^\n\r]+)/i);
    if (makeMatch) {
      rawMake = makeMatch[1].trim();
    }

    // Extract Serial Number
    let serialNumber = '';
    const snMatch = text.match(/(?:Serial\s*(?:no|num|number)?|S\/?N|SN|Sr\s*no|Tag\s*(?:no)?|Service\s*Tag)\s*[:=-]\s*([A-Za-z0-9_-]+)/i);
    if (snMatch) {
      serialNumber = snMatch[1].trim();
    }

    // Extract Problem Description
    let problem = '';
    const probMatch = text.match(/(?:Problem|Issue|Fault|Complaint|Error|Defect|Reason|Description|Remark)\s*[:=-]\s*([^\n\r]+)/i);
    if (probMatch) {
      problem = probMatch[1].trim();
    } else {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const unassigned = lines.filter(l => !l.includes(':') && !l.includes('=') && !l.match(/^[0-9+\s-]{10,14}$/));
      if (unassigned.length > 0) {
        problem = unassigned[unassigned.length - 1];
      }
    }

    // Infer Product & Brand
    let detectedProduct = 'AIO';
    let detectedBrand = '';
    const lower = (text + ' ' + rawMake).toLowerCase();

    if (lower.includes('hl 2080') || lower.includes('2080') || lower.includes('7535') || lower.includes('printer') || lower.includes('laserjet') || lower.includes('deskjet') || lower.includes('printing')) {
      detectedProduct = 'Printer';
      if (lower.includes('brother')) detectedBrand = 'Brother';
      else if (lower.includes('hp')) detectedBrand = 'HP';
      else if (lower.includes('canon')) detectedBrand = 'Canon';
      else if (lower.includes('epson')) detectedBrand = 'Epson';
    } else if (lower.includes('switch') || lower.includes('cisco') || lower.includes('3750') || lower.includes('2960')) {
      detectedProduct = 'Switch';
      detectedBrand = 'Cisco';
    } else if (lower.includes('scanner')) {
      detectedProduct = 'Scanner';
    } else if (lower.includes('laptop')) {
      detectedProduct = 'Laptop';
    } else if (lower.includes('mouse')) {
      detectedProduct = 'Mouse';
    } else if (lower.includes('keyboard')) {
      detectedProduct = 'Keyboard';
    } else if (lower.includes('ups') || lower.includes('power')) {
      detectedProduct = 'UPS';
    } else if (lower.includes('cctv') || lower.includes('camera') || lower.includes('nvr') || lower.includes('dvr')) {
      detectedProduct = 'CCTV';
    } else {
      detectedProduct = 'AIO';
    }

    if (!detectedBrand) {
      if (lower.includes('brother')) detectedBrand = 'Brother';
      else if (lower.includes('dell')) detectedBrand = 'Dell';
      else if (lower.includes('hp') || lower.includes('hewlett')) detectedBrand = 'HP';
      else if (lower.includes('lenovo')) detectedBrand = 'Lenovo';
      else if (lower.includes('acer')) detectedBrand = 'Acer';
      else if (lower.includes('cisco')) detectedBrand = 'Cisco';
      else if (lower.includes('canon')) detectedBrand = 'Canon';
      else if (lower.includes('epson')) detectedBrand = 'Epson';
    }

    const normalized = normalizeModelString(rawMake, detectedProduct, detectedBrand, text);

    return {
      location,
      username,
      contact,
      brand: normalized.brand || detectedBrand,
      model: normalized.model || rawMake,
      serial_number: serialNumber,
      problem: problem || 'Not working',
      product: normalized.product || detectedProduct || 'AIO',
      category: normalized.category || (detectedProduct ? detectedProduct.toUpperCase() : 'HARDWARE')
    };
  };

  const applyParsedData = (data: any, elapsedSec?: string) => {
    if (!data) return;

    if (data.location) setLocation(data.location);
    if (data.username) setUsername(data.username);
    if (data.contact) setContact(data.contact);
    if (data.brand) setBrand(data.brand);
    if (data.model) setModel(data.model);
    if (data.serial_number) setSerialNumber(data.serial_number);
    if (data.problem) setProblem(data.problem);
    if (data.product) setProduct(data.product);
    if (data.category) setCategory(data.category);

    // Auto-assign engineer if not assigned
    if (data.location) {
      const locLower = data.location.toLowerCase();
      if (locLower.includes('surat')) {
        setEngineer('Mayur Ahir');
      } else if (locLower.includes('rajkot')) {
        setEngineer('Sudhir Kuvardiya');
      } else if (locLower.includes('jamnagar')) {
        setEngineer('Parag');
      } else if (locLower.includes('bhavnagar')) {
        setEngineer('Amit Acharya');
      } else if (locLower.includes('kalol')) {
        setEngineer('Saifuddin Momin');
      } else if (!engineer && defaultEngineer) {
        setEngineer(defaultEngineer);
      } else if (!engineer) {
        setEngineer('Mahebub Mir');
      }
    }

    setTouched(true);
    showToast(`WhatsApp details parsed successfully${elapsedSec ? ` in ${elapsedSec}s` : ''}!`, 'success');
  };

  const handleAIParse = async () => {
    if (!whatsappInput.trim()) {
      showToast('Please paste a WhatsApp message first!', 'error');
      return;
    }

    const startTime = Date.now();
    setIsParsing(true);
    try {
      let data: any = null;

      try {
        const response = await fetch('/api/tickets/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: whatsappInput })
        });

        if (response && response.ok && response.headers.get('content-type')?.includes('application/json')) {
          data = await response.json();
        }
      } catch (err) {
        console.log('Using client-side WhatsApp parser');
      }

      // Fast, deterministic client-side parser fallback
      if (!data) {
        data = parseMessageData(whatsappInput);
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      applyParsedData(data, elapsed);

    } catch (err: any) {
      console.error(err);
      const fallbackData = parseMessageData(whatsappInput);
      if (fallbackData) {
        applyParsedData(fallbackData, '0.1');
      } else {
        showToast('Parsing failed. Please input fields manually.', 'error');
      }
    } finally {
      setIsParsing(false);
    }
  };

  const handleTextareaPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted && pasted.trim()) {
      setWhatsappInput(pasted);
      const data = parseMessageData(pasted);
      if (data) {
        setTimeout(() => {
          applyParsedData(data, '0.05');
        }, 100);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (hasValidationErrors) {
      let missingFieldsMsg = 'Missing fields: ';
      const missing = [];
      if (isMissingLocation) missing.push('Location');
      if (isMissingUsername) missing.push('Username');
      if (isMissingContact) missing.push('Contact Number');
      if (isMissingProblem) missing.push('Problem Description');
      if (isMissingEngineer) missing.push('Engineer');
      
      showToast(`Please complete mandatory fields: ${missing.join(', ')}`, 'error');
      return;
    }

    try {
      let mappedEngineer = engineer.trim();
      const cleanEng = mappedEngineer.toLowerCase();
      if (cleanEng) {
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
          if (cleanEng === shortName || cleanEng.startsWith(shortName) || shortName.startsWith(cleanEng)) {
            foundOfficialName = officialName;
            break;
          }
        }

        if (foundOfficialName) {
          mappedEngineer = foundOfficialName;
        } else {
          const matched = engineers.find(eng => {
            const engName = eng.name.trim().toLowerCase();
            return engName === cleanEng || engName.includes(cleanEng) || cleanEng.includes(engName);
          });
          if (matched) {
            mappedEngineer = matched.name;
          }
        }
      }

      let normalizedCategory = category.trim().toUpperCase();
      if (
        normalizedCategory === 'ALL IN ONE' || 
        normalizedCategory === 'ALL-IN-ONE' || 
        normalizedCategory === 'ALL_IN_ONE' || 
        normalizedCategory === 'ALL INONE' || 
        normalizedCategory === 'AIO' || 
        normalizedCategory === 'DESKTOP' ||
        normalizedCategory === 'DESKTOP COMPUTER' ||
        normalizedCategory === 'PC' ||
        normalizedCategory.includes('ALL IN ONE') ||
        normalizedCategory.includes('DESKTOP')
      ) {
        normalizedCategory = 'AIO';
      }

      let finalProduct = product.trim();
      if (finalProduct.toUpperCase() === 'DESKTOP') {
        finalProduct = 'AIO';
      }

      await onSaveTicket({
        id,
        ticket_id: tid,
        date,
        username,
        contact,
        location,
        product: finalProduct,
        category: normalizedCategory,
        brand,
        model,
        serial_number: serialNumber,
        problem,
        engineer: mappedEngineer,
        status,
        action_taken: actionTaken,
        first_visit_date: firstVisitDate,
        hold_date: holdDate,
        close_date: closeDate,
        engineer_remark: remarks
      });

      showToast(editingTicket ? 'Ticket updated successfully!' : 'Ticket created and saved successfully!', 'success');
      if (!editingTicket) {
        resetForm();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save ticket', 'error');
    }
  };

  // Model input handler with auto-normalization for hardware aliases
  const handleModelInputChange = (val: string) => {
    setModel(val);
    const suggestion = getHardwareAliasSuggestion(val);
    if (suggestion) {
      const normalized = normalizeModelString(val, product, brand);
      setModel(normalized.model);
      if (normalized.brand) setBrand(normalized.brand);
      if (normalized.product) setProduct(normalized.product);
      if (normalized.category) setCategory(normalized.category);
    }
  };

  // Preset automatic classifications for Category based on product detection
  const handleProductChange = (val: string) => {
    setProduct(val);
    const lower = val.toLowerCase();
    if (lower.includes('printer') || lower.includes('laserjet')) {
      setCategory('PRINTER');
    } else if (lower.includes('scanner')) {
      setCategory('SCANNER');
    } else if (lower.includes('aio') || lower.includes('all-in-one') || lower.includes('desktop') || lower.includes('optiplex') || lower.includes('veriton')) {
      setCategory('AIO');
    } else if (lower.includes('switch')) {
      setCategory('SWITCH');
    } else if (lower.includes('network')) {
      setCategory('NETWORK');
    } else if (lower.includes('mouse') || lower.includes('keyboard') || lower.includes('peripheral')) {
      setCategory('PERIPHERAL');
    } else if (lower.includes('ups') || lower.includes('power')) {
      setCategory('POWER');
    } else if (lower.includes('laptop')) {
      setCategory('LAPTOP');
    }
  };

  const STANDARD_MODELS = [
    { label: 'Cisco 3750 (Poe-24)', value: 'Cisco 3750 (Poe-24)', brand: 'Cisco', product: 'Switch', category: 'SWITCH' },
    { label: 'Cisco 3750 (Poe-48)', value: 'Cisco 3750 (Poe-48)', brand: 'Cisco', product: 'Switch', category: 'SWITCH' },
    { label: 'Cisco 2960 (Poe-24)', value: 'Cisco 2960 (Poe-24)', brand: 'Cisco', product: 'Switch', category: 'SWITCH' },
    { label: 'Brother DCP-B7535DW', value: 'Brother DCP-B7535DW', brand: 'Brother', product: 'Printer', category: 'PRINTER' },
    { label: 'Brother HL 2080 DW', value: 'Brother HL 2080 DW', brand: 'Brother', product: 'Printer', category: 'PRINTER' },
    { label: 'Dell Optiplex 7470', value: 'Dell Optiplex 7470', brand: 'Dell', product: 'AIO', category: 'AIO' },
    { label: 'Acer Veriton Z4660G', value: 'Acer Veriton Z4660G', brand: 'Acer', product: 'AIO', category: 'AIO' },
  ];

  const STANDARD_PRODUCTS = [
    'AIO',
    'Printer',
    'Switch',
    'Mouse',
    'Keyboard',
    'Scanner',
    'UPS',
    'Laptop',
    'Network'
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: WhatsApp Message Parsing Area (Only in create mode & Admin mode) */}
      {!editingTicket && isAdmin && (
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-md font-bold text-slate-800 dark:text-slate-200">WhatsApp AI Parsing</h2>
          </div>
          
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Copy and paste the entire WhatsApp support request message below. Our AI will automatically parse all details in under 10 seconds.
          </p>

          <div className="space-y-3">
            <textarea
              rows={8}
              value={whatsappInput}
              onChange={(e) => setWhatsappInput(e.target.value)}
              onPaste={handleTextareaPaste}
              placeholder="Paste WhatsApp message here...&#10;&#10;Location : BO DARIYAPUR&#10;User name : Anaya devrakhakar&#10;Make : BROTHER HL 2080DW&#10;Serial no : E78341F1N313961&#10;Problem : PRINTER NOT WORKING&#10;Contact : 9869006584"
              className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-mono focus:outline-none"
            />

            <button
              type="button"
              onClick={handleAIParse}
              disabled={isParsing}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-sm bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isParsing ? 'opacity-85 cursor-wait' : ''
              }`}
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI Extracting details...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI Extract & Classify
                </>
              )}
            </button>
          </div>

          <div className="p-3 bg-indigo-50/40 border border-indigo-100/40 dark:bg-indigo-950/20 dark:border-indigo-900/40 rounded-xl text-xs text-indigo-800 dark:text-indigo-300 space-y-1">
            <span className="font-bold">Pro Tip:</span>
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
              Field order, case variations, line gaps, or text wrappers like "Required tid" do not matter. The AI is highly adaptive.
            </p>
          </div>
        </div>
      )}

      {/* Right Column / Main Form: Editable Fields */}
      <div className={`${editingTicket || !isAdmin ? 'lg:col-span-12' : 'lg:col-span-8'} bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6`}>
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/60 mb-6">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {editingTicket ? `Edit Ticket - ${tid}` : 'Ticket Generation Form'}
            </h2>
          </div>
          {editingTicket && onCancelEdit && (
            <button
              onClick={onCancelEdit}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {/* Missing Required Warning Header */}
        <AnimatePresence>
          {touched && hasValidationErrors && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-50 border border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/30 rounded-xl p-4 mb-6 text-sm text-rose-800 dark:text-rose-300 flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Incomplete Ticket:</span>
                <p className="text-xs text-rose-700 dark:text-rose-400 mt-1 leading-relaxed">
                  Please complete the highlighted mandatory fields:
                  {isMissingLocation && ' [Location] '}
                  {isMissingUsername && ' [Username] '}
                  {isMissingContact && ' [Contact Number] '}
                  {isMissingProblem && ' [Problem Description] '}
                  {isMissingEngineer && ' [Assigned Engineer] '}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Ticket ID (Manual / Suggested Input) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  Ticket ID (TID) <span className="text-rose-500">*</span>
                </label>
                {!isAdmin && (
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/60 flex items-center gap-1 shrink-0">
                    <Lock className="w-3 h-3 text-amber-500" /> Read-Only for Engineer
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  value={tid}
                  readOnly={!isAdmin}
                  disabled={!isAdmin}
                  onChange={(e) => {
                    if (isAdmin) {
                      setTid(e.target.value);
                      setIsTidManuallyEdited(true);
                    }
                  }}
                  placeholder={isAdmin ? "Enter custom TID or use suggested..." : "Auto-generated Ticket ID"}
                  className={`w-full text-sm p-2.5 ${isAdmin ? 'pr-28' : 'pr-4'} border border-slate-200 dark:border-slate-800 ${
                    !isAdmin 
                      ? 'bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-mono font-bold cursor-not-allowed select-none' 
                      : 'bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-mono font-bold focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none'
                  }`}
                />
                {isAdmin && suggestedTid && tid !== suggestedTid && (
                  <button
                    type="button"
                    onClick={() => {
                      setTid(suggestedTid);
                      setIsTidManuallyEdited(false);
                    }}
                    className="absolute right-2 px-2.5 py-1 text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg border border-indigo-100/30 hover:bg-indigo-100/50 transition-colors cursor-pointer"
                  >
                    Use Suggested
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                {isAdmin
                  ? `Type manual TID or click Use Suggested (${suggestedTid || 'generating...'}).`
                  : `Ticket ID is automatically assigned (${tid || suggestedTid || 'generating...'}). Custom Ticket IDs can only be edited by Admins.`}
              </p>
            </div>

            {/* Date Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Username */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Username <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="E.g., Anaya devrakhakar"
                className={`w-full text-sm p-2.5 border rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                  touched && isMissingUsername 
                    ? 'border-rose-300 bg-rose-50/20 dark:border-rose-950 dark:bg-rose-950/20' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              />
            </div>

            {/* Contact Number */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Contact Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="E.g., 9869006584"
                className={`w-full text-sm p-2.5 border rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                  touched && isMissingContact 
                    ? 'border-rose-300 bg-rose-50/20 dark:border-rose-950 dark:bg-rose-950/20' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              />
            </div>

            {/* Location */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Location / Outlet <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="E.g., BO DARIYAPUR"
                className={`w-full text-sm p-2.5 border rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                  touched && isMissingLocation 
                    ? 'border-rose-300 bg-rose-50/20 dark:border-rose-950 dark:bg-rose-950/20' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              />
            </div>

            {/* Brand / Make */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Brand / Make
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="E.g., BROTHER"
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Model Selection */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Model Selection</span>
                <span className="text-[10px] text-slate-400 font-normal">Select standard hardware or type custom model</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={STANDARD_MODELS.some(m => m.value.toLowerCase() === model.toLowerCase()) ? STANDARD_MODELS.find(m => m.value.toLowerCase() === model.toLowerCase())?.value : (model ? 'custom' : '')}
                  onChange={(e) => {
                    const selectedVal = e.target.value;
                    if (selectedVal && selectedVal !== 'custom') {
                      const found = STANDARD_MODELS.find(m => m.value === selectedVal);
                      if (found) {
                        setModel(found.value);
                        setBrand(found.brand);
                        handleProductChange(found.product);
                        setCategory(found.category);
                      }
                    }
                  }}
                  className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium cursor-pointer"
                >
                  <option value="">-- Select Standard Model --</option>
                  {STANDARD_MODELS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label} ({item.brand})
                    </option>
                  ))}
                  <option value="custom">✏️ Other / Custom Model...</option>
                </select>

                <input
                  type="text"
                  value={model}
                  onChange={(e) => handleModelInputChange(e.target.value)}
                  placeholder="Type custom model or edit selected..."
                  className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Quick select chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick Select:</span>
                {STANDARD_MODELS.map((item) => {
                  const isSelected = model.toLowerCase() === item.value.toLowerCase();
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setModel(item.value);
                        setBrand(item.brand);
                        handleProductChange(item.product);
                        setCategory(item.category);
                      }}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {(() => {
                const aliasSuggestion = getHardwareAliasSuggestion(model);
                if (aliasSuggestion && model !== aliasSuggestion.model) {
                  return (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      <span>💡 Recognized hardware alias:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const normalized = normalizeModelString(model, product, brand);
                          setModel(normalized.model);
                          if (normalized.brand) setBrand(normalized.brand);
                          if (normalized.product) setProduct(normalized.product);
                          if (normalized.category) setCategory(normalized.category);
                        }}
                        className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 hover:bg-indigo-200 dark:hover:bg-indigo-900 font-bold underline cursor-pointer"
                      >
                        Set as {aliasSuggestion.model}
                      </button>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Product Type (Dropdown + Custom input) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-slate-400" />
                Product Type
              </label>
              <div className="space-y-1.5">
                <select
                  value={STANDARD_PRODUCTS.some(p => p.toLowerCase() === product.toLowerCase()) ? STANDARD_PRODUCTS.find(p => p.toLowerCase() === product.toLowerCase()) : (product ? 'custom' : '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && val !== 'custom') {
                      handleProductChange(val);
                    }
                  }}
                  className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer font-medium"
                >
                  <option value="">-- Select Product Type --</option>
                  {STANDARD_PRODUCTS.map((prod) => (
                    <option key={prod} value={prod}>
                      {prod}
                    </option>
                  ))}
                  <option value="custom">✏️ Other / Custom Product...</option>
                </select>

                <input
                  type="text"
                  value={product}
                  onChange={(e) => handleProductChange(e.target.value)}
                  placeholder="Or enter custom product type..."
                  className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="E.g., Printer, AIO, Peripheral"
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Serial Number */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Serial Number
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="E.g., E78341F1N313961"
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Problem Description */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Problem Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="E.g., PRINTER NOT WORKING / paper jamming"
                className={`w-full text-sm p-2.5 border rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                  touched && isMissingProblem 
                    ? 'border-rose-300 bg-rose-50/20 dark:border-rose-950 dark:bg-rose-950/20' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              />
            </div>

            {/* Engineer Assignment Dropdown / Manual Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Assigned Engineer <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                list="engineers-datalist"
                value={engineer}
                onChange={(e) => setEngineer(e.target.value)}
                placeholder="Type or select engineer name..."
                className={`w-full text-sm p-2.5 border rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                  touched && isMissingEngineer 
                    ? 'border-rose-300 bg-rose-50/20 dark:border-rose-950 dark:bg-rose-950/20' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              />
              <datalist id="engineers-datalist">
                {engineers.filter(e => e.active).map(eng => (
                  <option key={eng.id} value={eng.name} />
                ))}
              </datalist>
              <p className="text-[10px] text-slate-400">Select an engineer from the list or enter manually.</p>
            </div>

            {/* Resolution & Execution Details Header */}
            <div className="md:col-span-2 pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/60">
              <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-indigo-500" />
                Execution Details & Resolution Dates (First Visit, Hold, Close, Action & Remarks)
              </h4>
            </div>

            {/* Status Dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Ticket Status
              </label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as any)}
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer font-semibold"
              >
                <option value="Open">Open</option>
                <option value="Hold">Hold</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* First Visit Date */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                First Visit Date
              </label>
              <input
                type="date"
                value={firstVisitDate}
                onChange={(e) => setFirstVisitDate(e.target.value)}
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl"
              />
            </div>

            {/* Hold Date */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Hold Date
              </label>
              <input
                type="date"
                value={holdDate}
                onChange={(e) => setHoldDate(e.target.value)}
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl"
              />
            </div>

            {/* Close Date */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Close Date
              </label>
              <input
                type="date"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl"
              />
            </div>

            {/* Calculated Days Display Badge */}
            <div className="space-y-1 md:col-span-2">
              {(() => {
                const diff = calculateDaysBetweenVisitAndClose(firstVisitDate, closeDate, date, status);
                return (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-semibold">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      <span>Call Duration / Resolution Days:</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md font-bold text-xs border ${diff.badgeClass}`}>
                      {diff.text}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Action Taken */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Action Taken
              </label>
              <input
                type="text"
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                placeholder="E.g., Repaired fuser unit / Reinstalled driver"
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Engineer Remarks */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Engineer Remarks / Remarks
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="E.g., Waiting for spare parts / Done"
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

          </div>

          {/* Form Actions Panel */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap gap-3 justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Clear Fields
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {editingTicket ? 'Update & Save Ticket' : 'Save Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
