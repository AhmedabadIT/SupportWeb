import React, { useState } from 'react';
import { Engineer } from '../types';
import { Users, UserPlus, Mail, Phone, Check, X, ShieldAlert, Edit2, Trash2, MapPin, Briefcase, GraduationCap, Award, Calendar, Printer, FileText, Camera, Upload, Key } from 'lucide-react';
import { GurmystLogo, GurmystLogoHorizontal } from './GurmystLogo';

const compressImage = (dataUrl: string, maxWidth = 300, maxHeight = 300): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Compress as JPEG with 0.75 quality
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => {
      resolve(dataUrl);
    };
  });
};

interface EngineersManagerProps {
  engineers: Engineer[];
  onCreateEngineer: (fields: Partial<Engineer>) => Promise<void>;
  onUpdateEngineer: (id: string, updatedFields: Partial<Engineer>) => Promise<void>;
  onDeleteEngineer: (id: string) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const EngineersManager: React.FC<EngineersManagerProps> = ({
  engineers,
  onCreateEngineer,
  onUpdateEngineer,
  onDeleteEngineer,
  showToast
}) => {
  // Print modal state
  const [isPrintingModalOpen, setIsPrintingModalOpen] = useState(false);
  const [includeResignedInPrint, setIncludeResignedInPrint] = useState(false);
  const [printCardSize, setPrintCardSize] = useState<'normal' | 'compact'>('normal');
  const [printColumns, setPrintColumns] = useState<number>(2);

  const getPhotoSrc = (photoPath: string | undefined) => {
    if (!photoPath) return '';
    if (photoPath.startsWith('data:')) return photoPath;
    const cleanPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
    return `${window.location.origin}${encodeURI(cleanPath)}`;
  };

  const handleProceedToPrint = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showToast('Popup blocked. Please allow popups to open the print layout.', 'error');
        try {
          window.print();
        } catch (e) {
          console.error(e);
        }
        return;
      }

      printWindow.document.open();
      printWindow.document.write('<!DOCTYPE html><html><head><title>Gurmyst Field Services - Field Engineers Directory</title>');

      // Copy all style sheets and style tags from current document to keep Tailwind CSS & Google fonts
      Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).forEach((styleEl) => {
        printWindow.document.write(styleEl.outerHTML);
      });

      // Write custom page layout overrides for the print window
      printWindow.document.write(`
        <style>
          body {
            background: white !important;
            color: black !important;
            padding: 40px !important;
            margin: 0 !important;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #print-section {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          .print-grid {
            display: grid !important;
            grid-template-columns: repeat(${printColumns}, minmax(0, 1fr)) !important;
            gap: 20px !important;
            width: 100% !important;
          }
          .print-card-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: 2px solid #cbd5e1 !important; /* Elegant slate grey borders for clean individual print bounds */
            border-radius: 12px !important;
            padding: 20px !important;
            background-color: #ffffff !important;
            box-shadow: none !important;
            position: relative !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            margin-bottom: 8px !important;
          }
          .print-card-break.border-rose-300 {
            border: 2px dashed #f43f5e !important; /* Bold dashed red border for resigned cards */
          }
          @media print {
            body {
              padding: 0 !important;
            }
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
      `);

      const printSectionEl = document.getElementById('print-section');
      if (printSectionEl) {
        printWindow.document.write('<div id="print-section">' + printSectionEl.innerHTML + '</div>');
      } else {
        printWindow.document.write('<p style="padding: 20px; font-weight: bold; color: red;">Error: Printable content could not be located.</p>');
      }

      printWindow.document.write(`
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 600);
          };
        </script>
      </body>
      </html>
      `);

      printWindow.document.close();

    } catch (err) {
      console.error('Advanced printing failed:', err);
      try {
        window.print();
      } catch (fallbackErr) {
        showToast('Printing is blocked by your browser settings. Please open the app in a new tab to print.', 'error');
      }
    }
  };

  // Add engineer state
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [workProfile, setWorkProfile] = useState('');
  const [education, setEducation] = useState('');
  const [computerCertificate, setComputerCertificate] = useState('');
  const [experience, setExperience] = useState('');
  const [photo, setPhoto] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editWorkProfile, setEditWorkProfile] = useState('');
  const [editEducation, setEditEducation] = useState('');
  const [editComputerCertificate, setEditComputerCertificate] = useState('');
  const [editExperience, setEditExperience] = useState('');
  const [editResigned, setEditResigned] = useState(false);
  const [editResignationDate, setEditResignationDate] = useState('');
  const [editPhoto, setEditPhoto] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Engineer name is required', 'error');
      return;
    }

    try {
      await onCreateEngineer({
        name,
        mobile,
        email,
        password: password.trim() || undefined,
        location,
        address,
        work_profile: workProfile,
        education,
        computer_certificate: computerCertificate,
        experience,
        photo,
        active: true
      });
      setName('');
      setMobile('');
      setEmail('');
      setPassword('');
      setLocation('');
      setAddress('');
      setWorkProfile('');
      setEducation('');
      setComputerCertificate('');
      setExperience('');
      setPhoto('');
      setIsAdding(false);
      showToast('New engineer registered successfully!', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to add engineer', 'error');
    }
  };

  const startEdit = (eng: Engineer) => {
    setEditingId(eng.id);
    setEditName(eng.name);
    setEditMobile(eng.mobile);
    setEditEmail(eng.email);
    setEditPassword(eng.password || '');
    setEditLocation(eng.location || '');
    setEditAddress(eng.address || '');
    setEditWorkProfile(eng.work_profile || '');
    setEditEducation(eng.education || '');
    setEditComputerCertificate(eng.computer_certificate || '');
    setEditExperience(eng.experience || '');
    setEditResigned(!!eng.resigned);
    setEditResignationDate(eng.resignation_date || '');
    setEditPhoto(eng.photo || '');
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    try {
      await onUpdateEngineer(id, {
        name: editName,
        mobile: editMobile,
        email: editEmail,
        password: editPassword.trim() || undefined,
        location: editLocation,
        address: editAddress,
        work_profile: editWorkProfile,
        education: editEducation,
        computer_certificate: editComputerCertificate,
        experience: editExperience,
        resigned: editResigned,
        resignation_date: editResigned ? editResignationDate : undefined,
        active: editResigned ? false : undefined,
        photo: editPhoto
      });
      setEditingId(null);
      showToast('Engineer details updated!', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to update details', 'error');
    }
  };

  const handleToggleActive = async (eng: Engineer) => {
    try {
      await onUpdateEngineer(eng.id, { active: !eng.active });
      showToast(`Engineer ${eng.name} is now ${!eng.active ? 'Active' : 'Inactive'}`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to toggle status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteEngineer(id);
      showToast('Engineer record removed', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to remove record', 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Left Column: Engineer Creation Panel */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/60">
          <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-md font-bold text-slate-800 dark:text-slate-200">Register Engineer</h2>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g., Pravin Kumar"
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location / RO</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="E.g., Ro-Ahmedabad"
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Work Profile</label>
              <input
                type="text"
                value={workProfile}
                onChange={(e) => setWorkProfile(e.target.value)}
                placeholder="E.g., System Support Engineer"
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mobile Number</label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="E.g., 9988776655"
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E.g., pravin@helpdesk.com"
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Key className="w-3 h-3 text-amber-500" /> Unique Password
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Unique Password (e.g., Pravin@7984)"
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Education</label>
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="E.g., Graduate"
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Experience</label>
              <input
                type="text"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="E.g., 5 Years"
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Computer Certificate</label>
            <input
              type="text"
              value={computerCertificate}
              onChange={(e) => setComputerCertificate(e.target.value)}
              placeholder="E.g., Hardware & Networking"
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Residential Address</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="E.g., Block 19, Devnandan Park, Isanpur..."
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Engineer Photo</label>
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith('image/')) {
                  const reader = new FileReader();
                  reader.onload = async (event) => {
                    const base64 = event.target?.result as string;
                    const compressed = await compressImage(base64);
                    setPhoto(compressed);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                      const base64 = event.target?.result as string;
                      const compressed = await compressImage(base64);
                      setPhoto(compressed);
                    };
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
              onPaste={async (e) => {
                const items = e.clipboardData.items;
                for (let i = 0; i < items.length; i++) {
                  if (items[i].type.indexOf('image') === 0) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        const base64 = event.target?.result as string;
                        const compressed = await compressImage(base64);
                        setPhoto(compressed);
                      };
                      reader.readAsDataURL(blob);
                    }
                  }
                }
              }}
              tabIndex={0}
              className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/20 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer relative overflow-hidden group min-h-[90px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {photo ? (
                <div className="relative w-full h-20 flex items-center justify-center">
                  <img src={getPhotoSrc(photo)} alt="Preview" className="h-full object-cover rounded-lg border border-slate-200 dark:border-slate-700" referrerPolicy="no-referrer" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhoto('');
                    }}
                    className="absolute -top-1 -right-1 p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-md transition-all cursor-pointer"
                    title="Remove Photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Camera className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Upload or Paste Photo</span>
                  </div>
                  <div className="text-[9px] text-slate-400 dark:text-slate-500">Drag/click to browse, or paste image here</div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add Engineer
          </button>
        </form>

        <div className="p-3.5 bg-amber-50/40 border border-amber-100/40 dark:bg-amber-950/20 dark:border-amber-900/40 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Deactivating an engineer prevents them from receiving new tickets in the WhatsApp form. Existing tickets remain unchanged.
          </p>
        </div>
      </div>

      {/* Right Column: Registered Engineers Grid */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-md font-bold text-slate-800 dark:text-slate-200">Field Engineers Directory</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPrintingModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100/80 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-bold transition-all border border-indigo-100/50 dark:border-indigo-900/40 cursor-pointer shadow-xs hover:shadow-sm"
              title="Print engineer profile cards/ID badges"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Cards</span>
            </button>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2 py-1 rounded-lg">
              {engineers.length} Registered
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {engineers.length === 0 ? (
            <div className="col-span-2 text-center py-10 text-slate-400 dark:text-slate-500 text-xs">
              No engineers registered. Create one using the left panel.
            </div>
          ) : (
            engineers.map(eng => {
              const isEditing = editingId === eng.id;
              return (
                <div 
                  key={eng.id} 
                  className={`border rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-xs hover:shadow-sm transition-all relative overflow-hidden ${
                    eng.active 
                      ? 'border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900' 
                      : 'border-slate-200/40 dark:border-slate-800/40 bg-slate-50/30 dark:bg-slate-900/40 opacity-75'
                  }`}
                >
                  {/* Center-aligned brand logo background watermark */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] dark:opacity-[0.03] pointer-events-none select-none z-0">
                    <GurmystLogo size={150} />
                  </div>

                  {isEditing ? (
                    <div className="space-y-2.5 flex-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                        placeholder="Engineer Name"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                          placeholder="Location / RO"
                        />
                        <input
                          type="text"
                          value={editWorkProfile}
                          onChange={(e) => setEditWorkProfile(e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                          placeholder="Work Profile"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editMobile}
                          onChange={(e) => setEditMobile(e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                          placeholder="Mobile Number"
                        />
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                          placeholder="Email Address"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-mono"
                          placeholder="Unique Password (e.g., Pravin@7984)"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editEducation}
                          onChange={(e) => setEditEducation(e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                          placeholder="Education"
                        />
                        <input
                          type="text"
                          value={editExperience}
                          onChange={(e) => setEditExperience(e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                          placeholder="Experience"
                        />
                      </div>
                      <input
                        type="text"
                        value={editComputerCertificate}
                        onChange={(e) => setEditComputerCertificate(e.target.value)}
                        className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                        placeholder="Computer Certificate"
                      />
                      <div className="flex items-center gap-3 py-1.5 px-2.5 bg-slate-50 dark:bg-slate-950/45 rounded-lg border border-slate-150 dark:border-slate-800/80">
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-bold shrink-0">
                          <input
                            type="checkbox"
                            checked={editResigned}
                            onChange={(e) => {
                              setEditResigned(e.target.checked);
                              if (e.target.checked && !editResignationDate) {
                                setEditResignationDate('June 2026');
                              }
                            }}
                            className="rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                          Resigned
                        </label>
                        {editResigned && (
                          <input
                            type="text"
                            value={editResignationDate}
                            onChange={(e) => setEditResignationDate(e.target.value)}
                            className="flex-1 text-[11px] py-1 px-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Resignation Date (e.g., June 2026)"
                          />
                        )}
                      </div>
                      <textarea
                        rows={2}
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 resize-none"
                        placeholder="Residential Address"
                      />
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Update Photo</label>
                        <div 
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={async (e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files?.[0];
                            if (file && file.type.startsWith('image/')) {
                              const reader = new FileReader();
                              reader.onload = async (event) => {
                                const base64 = event.target?.result as string;
                                const compressed = await compressImage(base64);
                                setEditPhoto(compressed);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = async (event) => {
                                  const base64 = event.target?.result as string;
                                  const compressed = await compressImage(base64);
                                  setEditPhoto(compressed);
                                };
                                reader.readAsDataURL(file);
                              }
                            };
                            input.click();
                          }}
                          onPaste={async (e) => {
                            const items = e.clipboardData.items;
                            for (let i = 0; i < items.length; i++) {
                              if (items[i].type.indexOf('image') === 0) {
                                const blob = items[i].getAsFile();
                                if (blob) {
                                  const reader = new FileReader();
                                  reader.onload = async (event) => {
                                    const base64 = event.target?.result as string;
                                    const compressed = await compressImage(base64);
                                    setEditPhoto(compressed);
                                  };
                                  reader.readAsDataURL(blob);
                                }
                              }
                            }
                          }}
                          tabIndex={0}
                          className="border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-2.5 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/20 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer relative overflow-hidden group min-h-[70px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {editPhoto ? (
                            <div className="relative w-full h-16 flex items-center justify-center">
                              <img src={getPhotoSrc(editPhoto)} alt="Preview" className="h-full object-cover rounded border border-slate-200 dark:border-slate-700" referrerPolicy="no-referrer" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditPhoto('');
                                }}
                                className="absolute -top-1 -right-1 p-0.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-sm transition-all cursor-pointer"
                                title="Remove Photo"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-center space-y-0.5">
                              <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400">
                                <Camera className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Upload or Paste Photo</span>
                              </div>
                              <div className="text-[8px] text-slate-400 dark:text-slate-500">Drag/click, or paste image here</div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5 justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 text-[10px] font-bold border border-slate-200 dark:border-slate-800 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdate(eng.id)}
                          className="px-2.5 py-1 text-[10px] font-bold bg-indigo-600 text-white rounded hover:bg-indigo-700 cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 flex-1 relative z-10">
                      {/* Subtle elegant corporate watermark */}
                      <div className="absolute -top-1 right-8 opacity-10 dark:opacity-[0.06] pointer-events-none select-none text-slate-900 dark:text-slate-100">
                        <GurmystLogo size={42} />
                      </div>

                      <div className="flex justify-between items-start gap-3">
                        <div className="flex gap-3 relative z-10">
                          {eng.photo ? (
                            <img 
                              src={getPhotoSrc(eng.photo)} 
                              alt={eng.name} 
                              className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0 shadow-xs" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-slate-50 dark:bg-slate-850 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-800/60 p-2.5 shadow-inner">
                              <GurmystLogo size={34} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{eng.name}</h3>
                            {eng.work_profile && (
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">{eng.work_profile}</p>
                            )}
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold mt-1.5 border ${
                              eng.resigned
                                ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-150 dark:border-rose-900/40'
                                : eng.active 
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100/40 dark:border-emerald-900/40' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200/40 dark:border-slate-800/40'
                            }`}>
                              ● {eng.resigned ? `Resigned in ${eng.resignation_date || 'N/A'}` : eng.active ? 'Active on Duty' : 'On Leave / Inactive'}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEdit(eng)}
                            className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded cursor-pointer"
                            title="Edit Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(eng.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded cursor-pointer"
                            title="Remove Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                        {eng.location && (
                          <div className="flex items-start gap-1.5 text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span><strong className="text-slate-700 dark:text-slate-300">RO:</strong> {eng.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{eng.mobile || 'No Phone Number'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{eng.email || 'No Email Address'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 dark:text-indigo-300 font-mono font-bold bg-indigo-50/70 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/40 w-fit">
                          <Key className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>Password: {eng.password || `${eng.name.split(' ')[0]}@${(eng.mobile || '1234').slice(0, 4)}`}</span>
                        </div>
                        {(eng.education || eng.experience) && (
                          <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                            {eng.education && (
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1">
                                <GraduationCap className="w-3 h-3" />
                                {eng.education}
                              </span>
                            )}
                            {eng.experience && (
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {eng.experience}
                              </span>
                            )}
                          </div>
                        )}
                        {eng.computer_certificate && (
                          <div className="flex items-start gap-1.5 text-[11px] bg-slate-50 dark:bg-slate-950/40 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800/40 mt-1">
                            <Award className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                            <span className="text-[10px] text-slate-600 dark:text-slate-400"><strong className="text-slate-700 dark:text-slate-300">Certificate:</strong> {eng.computer_certificate}</span>
                          </div>
                        )}
                        {eng.address && (
                          <div className="text-[10px] text-slate-400 mt-1 pl-1 border-l-2 border-slate-200 dark:border-slate-800">
                            {eng.address}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => handleToggleActive(eng)}
                      className={`w-full py-1.5 px-3 rounded-lg border text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer relative z-10 ${
                        eng.active
                          ? 'border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/40 dark:hover:bg-amber-950/40'
                          : 'border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/40 dark:hover:bg-emerald-950/40'
                      }`}
                    >
                      {eng.active ? (
                        <>
                          <X className="w-3 h-3" />
                          Deactivate / Mark on Leave
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3" />
                          Activate / Resume Duty
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Advanced Print Configuration & Card Generator Modal */}
      {isPrintingModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
          {/* Dynamic Print Stylesheet */}
          <style>{`
            @media print {
              body {
                background: white !important;
                color: black !important;
              }
              /* Hide all other elements on the page with .no-print */
              .no-print {
                display: none !important;
              }
              /* Reset body and hide everything by default */
              body * {
                visibility: hidden !important;
              }
              /* Make our printed section and all its contents visible */
              #print-section, #print-section * {
                visibility: visible !important;
              }
              /* Ensure parent elements allow full content flow and don't clip */
              .fixed.inset-0,
              .bg-white,
              .dark\\:bg-slate-900,
              .flex-1.overflow-y-auto,
              .lg\\:col-span-8 {
                position: static !important;
                display: block !important;
                overflow: visible !important;
                max-height: none !important;
                height: auto !important;
                width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
                box-shadow: none !important;
                background: transparent !important;
                backdrop-filter: none !important;
              }
              /* Positioning for the printed sheet */
              #print-section {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 10px !important;
                display: block !important;
                border: none !important;
                box-shadow: none !important;
                background: white !important;
              }
              .print-grid {
                display: grid !important;
                grid-template-columns: repeat(${printColumns}, minmax(0, 1fr)) !important;
                gap: 16px !important;
                width: 100% !important;
              }
              .print-card-break {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                border: 2px solid #64748b !important; /* Force elegant slate grey borders for printed sheet */
                border-radius: 12px !important;
                padding: 16px !important;
                background-color: #ffffff !important;
                box-shadow: none !important;
                position: relative !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                margin-bottom: 4px !important;
              }
              .print-card-break.border-rose-300 {
                border: 2px dashed #f43f5e !important; /* Bold dashed red border for resigned cards */
              }
            }
          `}</style>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-150 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h2 className="text-md font-bold text-slate-800 dark:text-slate-200">Print Field Engineers Directory</h2>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Generate high-fidelity sheets and contact badges of registered engineers</p>
                </div>
              </div>
              <button
                onClick={() => setIsPrintingModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content - Two Pane Layout */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Controls Panel */}
              <div className="lg:col-span-4 p-6 bg-slate-50/40 dark:bg-slate-950/10 border-r border-slate-100 dark:border-slate-800/60 space-y-5 no-print">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Layout Configuration</h3>
                
                {/* Option 1: Include Resigned */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Include Resigned</label>
                  <label className="flex items-center gap-2 py-2 px-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all select-none">
                    <input
                      type="checkbox"
                      checked={includeResignedInPrint}
                      onChange={(e) => setIncludeResignedInPrint(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Include resigned engineers</span>
                  </label>
                </div>

                {/* Option 2: Print Columns Layout */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grid Columns (Printer)</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[1, 2, 3].map((cols) => (
                      <button
                        key={cols}
                        type="button"
                        onClick={() => setPrintColumns(cols)}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          printColumns === cols
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                      >
                        {cols} {cols === 1 ? 'Col' : 'Cols'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Option 3: Card Density Format */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Card Format Detail</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['normal', 'compact'] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setPrintCardSize(size)}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer capitalize ${
                          printCardSize === size
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Print Notice for iframe users */}
                {window.self !== window.top && (
                  <div className="p-3 bg-indigo-50/50 border border-indigo-150/50 dark:bg-indigo-950/20 dark:border-indigo-900/30 rounded-xl text-[11px] text-indigo-800 dark:text-indigo-300 leading-relaxed no-print">
                    <span className="font-bold">💡 Preview Notice:</span> If the print dialog does not open, click the <strong>Open in new tab</strong> button at the top-right of your screen and print from there!
                  </div>
                )}

                {/* Info and Helpbox */}
                <div className="p-4 bg-amber-50/40 border border-amber-100/30 dark:bg-amber-950/15 dark:border-amber-900/30 rounded-2xl text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed space-y-1.5">
                  <span className="font-bold block text-amber-900 dark:text-amber-200">🖨️ Pro Printing Tips:</span>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Select <strong>A4 or Letter</strong> size in the system dialog.</li>
                    <li>Check <strong>"Background graphics"</strong> to print the badge colors and accents accurately.</li>
                    <li>Set Margins to <strong>"None"</strong> or <strong>"Default"</strong> for optimal card alignments.</li>
                  </ul>
                </div>
              </div>

              {/* Live Preview Area */}
              <div className="lg:col-span-8 p-6 bg-slate-100 dark:bg-slate-950/40 overflow-y-auto max-h-[60vh] lg:max-h-none flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 no-print">Live Document Sheet Preview</span>
                
                {/* Simulated Paper Sheets */}
                <div 
                  id="print-section"
                  className="bg-white text-slate-950 border border-slate-300 shadow-md p-8 w-full max-w-[210mm] min-h-[297mm] rounded-sm space-y-6 select-text"
                >
                  {/* Document Print Header */}
                  <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-end">
                    <div className="flex items-center gap-3 text-slate-900">
                      <GurmystLogo size={36} className="text-slate-950" />
                      <div>
                        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">Gurmyst Field Services</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Official Field Engineers Directory</p>
                      </div>
                    </div>
                    <div className="text-right text-[10px] font-bold text-slate-500">
                      <span>Date Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Cards Grid */}
                  <div className={`print-grid grid gap-4 grid-cols-1 ${
                    printColumns === 2 ? 'sm:grid-cols-2' : printColumns === 3 ? 'sm:grid-cols-3' : 'grid-cols-1'
                  }`}>
                    {engineers.filter(eng => includeResignedInPrint ? true : !eng.resigned).length === 0 ? (
                      <div className="text-center py-20 text-slate-400 text-xs col-span-full">
                        No engineers match the selected criteria.
                      </div>
                    ) : (
                      engineers
                        .filter(eng => includeResignedInPrint ? true : !eng.resigned)
                        .map((eng) => (
                          <div 
                            key={eng.id}
                            className={`print-card-break border border-slate-300 bg-white rounded-lg p-4 flex flex-col justify-between space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] relative overflow-hidden ${
                              eng.resigned ? 'border-dashed border-rose-300' : ''
                            }`}
                          >
                            {/* Decorative stripe */}
                            <div className={`absolute top-0 left-0 right-0 h-1 ${
                              eng.resigned ? 'bg-rose-500' : eng.active ? 'bg-indigo-600' : 'bg-slate-400'
                            }`} />

                            {/* Centered Large Background Watermark Logo */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none select-none z-0">
                              <GurmystLogo size={140} />
                            </div>

                            {/* Top Right Mini Corporate Brand Stamp */}
                            <div className="absolute top-2.5 right-3 opacity-25">
                              <GurmystLogo size={18} />
                            </div>

                            {/* Card Content */}
                            <div className="space-y-2 relative z-10">
                              <div className="flex gap-3">
                                {eng.photo ? (
                                  <img 
                                    src={getPhotoSrc(eng.photo)} 
                                    alt={eng.name} 
                                    className="w-14 h-14 rounded-lg object-cover border border-slate-300 shrink-0 shadow-xs" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-14 h-14 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-250 p-2 shadow-xs">
                                    <GurmystLogo size={34} />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-bold text-sm text-slate-900 truncate">{eng.name}</h4>
                                  {eng.work_profile && (
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5 truncate">{eng.work_profile}</span>
                                  )}
                                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                                      eng.resigned
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : eng.active
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                      {eng.resigned ? `RESIGNED (${eng.resignation_date || 'N/A'})` : eng.active ? 'ACTIVE' : 'ON LEAVE / INACTIVE'}
                                    </span>
                                    {eng.location && (
                                      <span className="text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-150 px-1 py-0.5 rounded truncate">
                                        {eng.location}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Details fields */}
                              <div className="text-[10px] text-slate-600 space-y-1 pt-1.5 border-t border-slate-100">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-800">Phone:</span>
                                  <span>{eng.mobile || '—'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="font-bold text-slate-800">Email:</span>
                                  <span className="truncate">{eng.email || '—'}</span>
                                </div>

                                {printCardSize === 'normal' && (
                                  <>
                                    {(eng.education || eng.experience) && (
                                      <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                                        {eng.education && (
                                          <span className="bg-slate-50 text-slate-700 px-1 py-0.5 rounded text-[9px] border border-slate-150">
                                            🎓 {eng.education}
                                          </span>
                                        )}
                                        {eng.experience && (
                                          <span className="bg-slate-50 text-slate-700 px-1 py-0.5 rounded text-[9px] border border-slate-150">
                                            📅 {eng.experience} Exp
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {eng.computer_certificate && (
                                      <div className="bg-indigo-50/40 p-1.5 rounded border border-indigo-100/50 text-[9px] text-slate-700 mt-1">
                                        <span className="font-bold text-indigo-950">Certificate: </span>
                                        {eng.computer_certificate}
                                      </div>
                                    )}
                                    {eng.address && (
                                      <div className="text-[9px] text-slate-500 pl-1 border-l border-slate-300 mt-1 italic">
                                        {eng.address}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>

                  {/* Printed Footer Info */}
                  <div className="border-t border-slate-200 pt-3 text-center text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-12">
                    Gurmyst Helpdesk Field Support System • Page 1 of 1
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex justify-end gap-3 no-print">
              <button
                type="button"
                onClick={() => setIsPrintingModalOpen(false)}
                className="px-4 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={handleProceedToPrint}
                className="px-4.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md active:scale-95 hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Proceed to Print</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
