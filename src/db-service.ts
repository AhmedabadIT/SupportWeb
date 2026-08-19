import fs from 'fs';
import path from 'path';
import { Engineer, Ticket, AttendanceRecord, AttendanceStatus, LocationVisit } from './types';
import * as XLSX from 'xlsx';
import { calculateDaysBetweenVisitAndClose } from './utils/dateUtils';
import { normalizeModelString } from './utils/modelNormalization';

const DATA_DIR = path.join(process.cwd(), 'data');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');
const ENGINEERS_FILE = path.join(DATA_DIR, 'engineers.json');
const ATTENDANCE_FILE = path.join(DATA_DIR, 'attendance.json');
const LOCATION_VISITS_FILE = path.join(DATA_DIR, 'location_visits.json');

// Ensure database directory and files exist
function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(ENGINEERS_FILE)) {
    const defaultEngineers: Engineer[] = [
      {
        id: 'eng-1',
        name: 'Mahebub Mir',
        mobile: '9898531231',
        email: 'mahbub.muskan@gmail.com',
        active: true,
        location: 'Ro-Ahmedabad',
        address: '14, Mahebub Society, Sarkhej Juhapura Road, Ahmedabad - 55',
        work_profile: 'Team Led Cum System Engineer',
        education: 'Graduate',
        computer_certificate: 'PGDCA, A+N+',
        experience: '18 Years'
      },
      {
        id: 'eng-2',
        name: 'Karan Parmar',
        mobile: '9737284797',
        email: 'Karanparmar1508@gmail.com',
        active: true,
        location: 'Ro-Ahmedabad',
        address: '364, Vankar Vas, Camp Sadarbazar, Shahibaug, Ahmedabad',
        work_profile: 'System Support Engineer',
        education: '10th',
        computer_certificate: 'Hardware & Networking (IANT)',
        experience: '6.5 Years'
      },
      {
        id: 'eng-3',
        name: 'Chirag Panchal',
        mobile: '8460004275',
        email: 'Chiragpanchal0831@gmail.com',
        active: true,
        location: 'Ro-Ahmedabad',
        address: '2113 kailash niwas, azad chock, fadeli, dhanushdhari society, ahmedabad',
        work_profile: 'System Support Engineer',
        education: 'Graduate',
        computer_certificate: 'BCA (Running)',
        experience: 'Fresher'
      },
      {
        id: 'eng-4',
        name: 'Krushil Kapadiya',
        mobile: '8401456649',
        email: 'krushilkapadiya@gmail.com',
        active: true,
        location: 'Ro-Ahmedabad',
        address: '49, Vinay Vihar Soc., Bhulabhai Park, Ahmedabad',
        work_profile: 'System Support Engineer',
        education: 'Graduate',
        computer_certificate: 'A+ Hardware',
        experience: '7 Years'
      },
      {
        id: 'eng-5',
        name: 'Mayank Shravak',
        mobile: '9974053682',
        email: 'shravakmayank411@gmail.com',
        active: true,
        location: 'Ro-Ahmedabad',
        address: '1755/8, Pithavali Chali, Rajpur Gomtipur, Ahmedabad',
        work_profile: 'System Support Engineer',
        education: 'Graduate',
        computer_certificate: 'Hardware & Networking',
        experience: '1.5 Years'
      },
      {
        id: 'eng-6',
        name: 'Pravin Prajapati',
        mobile: '7984434364',
        email: 'prajapatipravin4321@gmail.com',
        active: true,
        location: 'Ro-Ahmedabad',
        address: '19, Devnandan Park Society, Isanpur, Ahmedabad',
        work_profile: 'System Support Engineer',
        education: '12th',
        computer_certificate: 'A+N+',
        experience: '5 Years'
      },
      {
        id: 'eng-7',
        name: 'Prince Kumar',
        mobile: '9128770114',
        email: 'priance.gautam@gmail.com',
        active: true,
        location: 'Ro-Ahmedabad',
        address: 'Trimurti Apartment, Memnagar, Ahmedabad',
        work_profile: 'System Support Engineer',
        education: 'Graduate',
        computer_certificate: 'B.Sc. IT, N+',
        experience: 'Fresher'
      },
      {
        id: 'eng-8',
        name: 'Sudhir Kuvardiya',
        mobile: '9727332188',
        email: 'itengineer.sudhir@gmail.com',
        active: true,
        location: 'ADMS Rajkot',
        address: '107, Punitnagar Street no 6, Gondal Chowkdi, Rajkot',
        work_profile: 'System Support Engineer',
        education: 'Diploma',
        computer_certificate: 'Hardware & Networking (CCNA)',
        experience: '10 Years'
      },
      {
        id: 'eng-9',
        name: 'Parag',
        mobile: '9998889468',
        email: 'Parag7780@gmail.com',
        active: true,
        location: 'Jamnagar Hospital',
        address: 'Chandra Prabhu Appartment, Pavan Chakki, New Jail Road, Dangarvada, Jamnagar',
        work_profile: 'System Support Engineer',
        education: '12th',
        computer_certificate: 'Hardware & Networking',
        experience: '11 Years'
      },
      {
        id: 'eng-10',
        name: 'Amit Acharya',
        mobile: '9327624707',
        email: 'ameetacharya11@gmail.com',
        active: true,
        location: 'Bhavnagar Hospital',
        address: '1403/A-2, Near Rajaram No Avedo, Ghodha Road, Bhavnagar',
        work_profile: 'System Support Engineer',
        education: 'Diploma',
        computer_certificate: 'Hardware & Networking',
        experience: '4.5 Years'
      },
      {
        id: 'eng-11',
        name: 'Saifuddin Momin',
        mobile: '9313224211',
        email: 'safmominsafmomin@gmail.com',
        active: true,
        location: 'Kalol Hospital',
        address: 'Mominvas, Serisa, Gandhinagar',
        work_profile: 'System Support Engineer',
        education: 'Graduate',
        computer_certificate: 'Hardware & Networking',
        experience: '3.2 Years'
      },
      {
        id: 'eng-12',
        name: 'Mayur Ahir',
        mobile: '8734000056',
        email: 'Mayurahire525@gmail.com',
        active: true,
        location: 'Surat',
        address: '49 Radhe Homes, Orma, Masamagam, Orma, Po:orma, Dist:Surat Gujarat-394540',
        work_profile: 'System Support Engineer',
        education: '12th',
        computer_certificate: 'advance diploma engineering in cyber security standard',
        experience: '5 year'
      },
      {
        id: 'eng-13',
        name: 'Jenil Kosambiya',
        mobile: '9429913500',
        email: 'jenilkosambiya9998@gmail.com',
        active: true,
        location: 'Surat',
        address: '545, Mahyavansi street near gujarat gas company, Adajan gam, surat, 395005.',
        work_profile: 'System Support Engineer',
        education: 'Graduate',
        computer_certificate: 'Ccc tally with gst, Cloud computing standard',
        experience: '1.2 year'
      }
    ];
    fs.writeFileSync(ENGINEERS_FILE, JSON.stringify(defaultEngineers, null, 2), 'utf8');
  } else {
    // If it exists but needs the new 13 detailed engineers, make sure they are written
    try {
      const content = fs.readFileSync(ENGINEERS_FILE, 'utf8');
      const current = JSON.parse(content) as Engineer[];
      const hasDetailedFields = current.some(e => e.location);
      if (!hasDetailedFields) {
        const defaultEngineers: Engineer[] = [
          {
            id: 'eng-1',
            name: 'Mahebub Mir',
            mobile: '9898531231',
            email: 'mahbub.muskan@gmail.com',
            active: true,
            location: 'Ro-Ahmedabad',
            address: '14, Mahebub Society, Sarkhej Juhapura Road, Ahmedabad - 55',
            work_profile: 'Team Led Cum System Engineer',
            education: 'Graduate',
            computer_certificate: 'PGDCA, A+N+',
            experience: '18 Years'
          },
          {
            id: 'eng-2',
            name: 'Karan Parmar',
            mobile: '9737284797',
            email: 'Karanparmar1508@gmail.com',
            active: true,
            location: 'Ro-Ahmedabad',
            address: '364, Vankar Vas, Camp Sadarbazar, Shahibaug, Ahmedabad',
            work_profile: 'System Support Engineer',
            education: '10th',
            computer_certificate: 'Hardware & Networking (IANT)',
            experience: '6.5 Years'
          },
          {
            id: 'eng-3',
            name: 'Chirag Panchal',
            mobile: '8460004275',
            email: 'Chiragpanchal0831@gmail.com',
            active: true,
            location: 'Ro-Ahmedabad',
            address: '2113 kailash niwas, azad chock, fadeli, dhanushdhari society, ahmedabad',
            work_profile: 'System Support Engineer',
            education: 'Graduate',
            computer_certificate: 'BCA (Running)',
            experience: 'Fresher'
          },
          {
            id: 'eng-4',
            name: 'Krushil Kapadiya',
            mobile: '8401456649',
            email: 'krushilkapadiya@gmail.com',
            active: true,
            location: 'Ro-Ahmedabad',
            address: '49, Vinay Vihar Soc., Bhulabhai Park, Ahmedabad',
            work_profile: 'System Support Engineer',
            education: 'Graduate',
            computer_certificate: 'A+ Hardware',
            experience: '7 Years'
          },
          {
            id: 'eng-5',
            name: 'Mayank Shravak',
            mobile: '9974053682',
            email: 'shravakmayank411@gmail.com',
            active: true,
            location: 'Ro-Ahmedabad',
            address: '1755/8, Pithavali Chali, Rajpur Gomtipur, Ahmedabad',
            work_profile: 'System Support Engineer',
            education: 'Graduate',
            computer_certificate: 'Hardware & Networking',
            experience: '1.5 Years'
          },
          {
            id: 'eng-6',
            name: 'Pravin Prajapati',
            mobile: '7984434364',
            email: 'prajapatipravin4321@gmail.com',
            active: true,
            location: 'Ro-Ahmedabad',
            address: '19, Devnandan Park Society, Isanpur, Ahmedabad',
            work_profile: 'System Support Engineer',
            education: '12th',
            computer_certificate: 'A+N+',
            experience: '5 Years'
          },
          {
            id: 'eng-7',
            name: 'Prince Kumar',
            mobile: '9128770114',
            email: 'priance.gautam@gmail.com',
            active: true,
            location: 'Ro-Ahmedabad',
            address: 'Trimurti Apartment, Memnagar, Ahmedabad',
            work_profile: 'System Support Engineer',
            education: 'Graduate',
            computer_certificate: 'B.Sc. IT, N+',
            experience: 'Fresher'
          },
          {
            id: 'eng-8',
            name: 'Sudhir Kuvardiya',
            mobile: '9727332188',
            email: 'itengineer.sudhir@gmail.com',
            active: true,
            location: 'ADMS Rajkot',
            address: '107, Punitnagar Street no 6, Gondal Chowkdi, Rajkot',
            work_profile: 'System Support Engineer',
            education: 'Diploma',
            computer_certificate: 'Hardware & Networking (CCNA)',
            experience: '10 Years'
          },
          {
            id: 'eng-9',
            name: 'Parag',
            mobile: '9998889468',
            email: 'Parag7780@gmail.com',
            active: true,
            location: 'Jamnagar Hospital',
            address: 'Chandra Prabhu Appartment, Pavan Chakki, New Jail Road, Dangarvada, Jamnagar',
            work_profile: 'System Support Engineer',
            education: '12th',
            computer_certificate: 'Hardware & Networking',
            experience: '11 Years'
          },
          {
            id: 'eng-10',
            name: 'Amit Acharya',
            mobile: '9327624707',
            email: 'ameetacharya11@gmail.com',
            active: true,
            location: 'Bhavnagar Hospital',
            address: '1403/A-2, Near Rajaram No Avedo, Ghodha Road, Bhavnagar',
            work_profile: 'System Support Engineer',
            education: 'Diploma',
            computer_certificate: 'Hardware & Networking',
            experience: '4.5 Years'
          },
          {
            id: 'eng-11',
            name: 'Saifuddin Momin',
            mobile: '9313224211',
            email: 'safmominsafmomin@gmail.com',
            active: true,
            location: 'Kalol Hospital',
            address: 'Mominvas, Serisa, Gandhinagar',
            work_profile: 'System Support Engineer',
            education: 'Graduate',
            computer_certificate: 'Hardware & Networking',
            experience: '3.2 Years'
          },
          {
            id: 'eng-12',
            name: 'Mayur Ahir',
            mobile: '8734000056',
            email: 'Mayurahire525@gmail.com',
            active: true,
            location: 'Surat',
            address: '49 Radhe Homes, Orma, Masamagam, Orma, Po:orma, Dist:Surat Gujarat-394540',
            work_profile: 'System Support Engineer',
            education: '12th',
            computer_certificate: 'advance diploma engineering in cyber security standard',
            experience: '5 year'
          },
          {
            id: 'eng-13',
            name: 'Jenil Kosambiya',
            mobile: '9429913500',
            email: 'jenilkosambiya9998@gmail.com',
            active: true,
            location: 'Surat',
            address: '545, Mahyavansi street near gujarat gas company, Adajan gam, surat, 395005.',
            work_profile: 'System Support Engineer',
            education: 'Graduate',
            computer_certificate: 'Ccc tally with gst, Cloud computing standard',
            experience: '1.2 year'
          }
        ];
        fs.writeFileSync(ENGINEERS_FILE, JSON.stringify(defaultEngineers, null, 2), 'utf8');
      }
    } catch (err) {
      console.error('Error migrating engineers.json file:', err);
    }
  }

  if (fs.existsSync(TICKETS_FILE)) {
    try {
      const content = fs.readFileSync(TICKETS_FILE, 'utf8');
      const tickets = JSON.parse(content);
      if (Array.isArray(tickets)) {
        let updated = false;
        tickets.forEach((ticket: any) => {
          const originalCategory = ticket.category || '';
          let upper = originalCategory.trim().toUpperCase();
          if (
            upper === 'ALL IN ONE' || 
            upper === 'ALL-IN-ONE' || 
            upper === 'ALL_IN_ONE' || 
            upper === 'ALL INONE' || 
            upper === 'AIO' || 
            upper === 'DESKTOP' ||
            upper === 'DESKTOP COMPUTER' ||
            upper === 'PC' ||
            upper.includes('ALL IN ONE') ||
            upper.includes('DESKTOP')
          ) {
            upper = 'AIO';
          }
          if (ticket.category !== upper) {
            ticket.category = upper;
            updated = true;
          }
          if (ticket.product && ticket.product.trim().toUpperCase() === 'DESKTOP') {
            ticket.product = 'AIO';
            updated = true;
          }
        });
        if (updated) {
          fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2), 'utf8');
          console.log('Database Migration: Successfully normalized existing ticket categories.');
        }

        const excelPath = path.join(DATA_DIR, 'tickets.xlsx');
        if (!fs.existsSync(excelPath) || updated) {
          DBService.generateTicketsExcelFile(tickets, excelPath);
        }
      }
    } catch (e) {
      console.error('Error during database migration of categories:', e);
    }
  } else {
    fs.writeFileSync(TICKETS_FILE, JSON.stringify([], null, 2), 'utf8');
  }

  if (!fs.existsSync(ATTENDANCE_FILE)) {
    fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

// Initialize database right away
initDB();

export class DBService {
  // --- Engineers ---
  static getEngineers(): Engineer[] {
    try {
      initDB();
      const content = fs.readFileSync(ENGINEERS_FILE, 'utf8');
      return JSON.parse(content) as Engineer[];
    } catch (e) {
      console.error('Error reading engineers:', e);
      return [];
    }
  }

  static saveEngineers(engineers: Engineer[]): void {
    try {
      initDB();
      fs.writeFileSync(ENGINEERS_FILE, JSON.stringify(engineers, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving engineers:', e);
    }
  }

  static saveBase64Image(engineerId: string, photoData: string | undefined): string | undefined {
    if (!photoData) return undefined;
    
    if (photoData.startsWith('/data/image/')) {
      return photoData;
    }

    if (photoData.startsWith('data:image/')) {
      try {
        const matches = photoData.match(/^data:image\/([A-Za-z+-]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          
          const filename = `${engineerId}.${extension}`;
          const imagePath = path.join(DATA_DIR, 'image', filename);
          
          const imageDir = path.join(DATA_DIR, 'image');
          if (!fs.existsSync(imageDir)) {
            fs.mkdirSync(imageDir, { recursive: true });
          }

          fs.writeFileSync(imagePath, buffer);
          return `/data/image/${filename}`;
        }
      } catch (e) {
        console.error('Error saving base64 image:', e);
      }
    }
    
    return photoData;
  }

  static createEngineer(engineerData: Omit<Engineer, 'id'>): Engineer {
    const engineers = this.getEngineers();
    const id = 'eng-' + Date.now();
    let photoPath = undefined;
    if (engineerData.photo) {
      photoPath = this.saveBase64Image(id, engineerData.photo);
    }

    const newEngineer: Engineer = {
      id,
      ...engineerData,
      photo: photoPath,
      active: engineerData.active !== false
    };
    engineers.push(newEngineer);
    this.saveEngineers(engineers);
    return newEngineer;
  }

  static updateEngineer(id: string, updatedFields: Partial<Omit<Engineer, 'id'>>): Engineer | null {
    const engineers = this.getEngineers();
    const index = engineers.findIndex(e => e.id === id);
    if (index === -1) return null;

    let updatedPhoto = updatedFields.photo;
    if (updatedFields.photo) {
      updatedPhoto = this.saveBase64Image(id, updatedFields.photo);
    }

    engineers[index] = { 
      ...engineers[index], 
      ...updatedFields,
      photo: updatedPhoto !== undefined ? updatedPhoto : engineers[index].photo
    };
    this.saveEngineers(engineers);
    return engineers[index];
  }

  static deleteEngineer(id: string): boolean {
    const engineers = this.getEngineers();
    const filtered = engineers.filter(e => e.id !== id);
    if (filtered.length === engineers.length) return false;
    this.saveEngineers(filtered);
    return true;
  }

  // --- Engineer Auth (Login & Signup) ---
  static verifyEngineerLogin(identifier: string, passwordInput: string): { success: boolean; engineer?: Engineer; message?: string } {
    if (!identifier || !passwordInput) {
      return { success: false, message: 'Please enter your Mobile / Email / Name and Password.' };
    }
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    const engineers = this.getEngineers();
    const found = engineers.find(e => 
      e.mobile.trim() === cleanId || 
      e.email.trim().toLowerCase() === cleanId ||
      e.name.trim().toLowerCase() === cleanId
    );

    if (!found) {
      return { success: false, message: 'No registered engineer found matching those details.' };
    }

    if (!found.active) {
      return { success: false, message: 'This engineer account is currently marked inactive.' };
    }

    // Unique password per engineer (fallback to Name@MobilePrefix if missing)
    const firstName = found.name.split(' ')[0] || 'Engineer';
    const mobilePrefix = (found.mobile || '1234').slice(0, 4);
    const expectedPassword = found.password || `${firstName}@${mobilePrefix}`;
    if (cleanPass !== expectedPassword) {
      return { success: false, message: 'Invalid password. Please check your assigned unique password.' };
    }

    return { success: true, engineer: found };
  }

  static signupEngineer(data: { name: string; mobile: string; email: string; password?: string; location?: string }): { success: boolean; engineer?: Engineer; message?: string } {
    if (!data.name || !data.mobile || !data.email) {
      return { success: false, message: 'Name, Mobile Number, and Email Address are required for registration.' };
    }

    const cleanName = data.name.trim();
    const cleanMobile = data.mobile.trim();
    const cleanEmail = data.email.trim().toLowerCase();
    const firstName = cleanName.split(' ')[0] || 'Engineer';
    const mobilePrefix = cleanMobile.slice(0, 4) || '1234';
    const password = data.password && data.password.trim() ? data.password.trim() : `${firstName}@${mobilePrefix}`;

    const engineers = this.getEngineers();
    const existingIndex = engineers.findIndex(e => 
      e.mobile.trim() === cleanMobile || 
      e.email.trim().toLowerCase() === cleanEmail
    );

    if (existingIndex !== -1) {
      engineers[existingIndex] = {
        ...engineers[existingIndex],
        name: cleanName,
        password: password,
        location: data.location || engineers[existingIndex].location,
        active: true
      };
      this.saveEngineers(engineers);
      return { success: true, engineer: engineers[existingIndex], message: 'Engineer profile credentials updated successfully!' };
    } else {
      const newEng: Engineer = {
        id: 'eng-' + Date.now(),
        name: cleanName,
        mobile: cleanMobile,
        email: cleanEmail,
        password: password,
        active: true,
        location: data.location || 'Ro-Ahmedabad',
        work_profile: 'System Support Engineer'
      };
      engineers.push(newEng);
      this.saveEngineers(engineers);
      return { success: true, engineer: newEng, message: 'New engineer account registered successfully!' };
    }
  }

  // --- Location Visits & Distance ---
  static getLocationVisits(engineerId?: string): LocationVisit[] {
    try {
      initDB();
      if (!fs.existsSync(LOCATION_VISITS_FILE)) {
        return [];
      }
      const content = fs.readFileSync(LOCATION_VISITS_FILE, 'utf8');
      const visits = JSON.parse(content) as LocationVisit[];
      if (engineerId) {
        return visits.filter(v => v.engineerId === engineerId);
      }
      return visits;
    } catch (e) {
      console.error('Error reading location visits:', e);
      return [];
    }
  }

  static saveLocationVisits(visits: LocationVisit[]): void {
    try {
      initDB();
      fs.writeFileSync(LOCATION_VISITS_FILE, JSON.stringify(visits, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving location visits:', e);
    }
  }

  static createLocationVisit(visitData: Omit<LocationVisit, 'id' | 'created_at'>): LocationVisit {
    const visits = this.getLocationVisits();
    const newVisit: LocationVisit = {
      id: 'visit-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      journeyId: visitData.journeyId || ('JRN-' + Date.now().toString().slice(-6)),
      ...visitData,
      created_at: new Date().toISOString()
    };
    visits.unshift(newVisit); // Newest first
    this.saveLocationVisits(visits);
    return newVisit;
  }

  static updateLocationVisit(id: string, updates: Partial<LocationVisit>): LocationVisit | null {
    const visits = this.getLocationVisits();
    const idx = visits.findIndex(v => v.id === id);
    if (idx === -1) return null;

    visits[idx] = {
      ...visits[idx],
      ...updates
    };
    this.saveLocationVisits(visits);
    return visits[idx];
  }

  static deleteLocationVisit(id: string): boolean {
    const visits = this.getLocationVisits();
    const filtered = visits.filter(v => v.id !== id);
    if (filtered.length === visits.length) return false;
    this.saveLocationVisits(filtered);
    return true;
  }

  static clearAllLocationVisits(): void {
    this.saveLocationVisits([]);
  }

  // --- Tickets ---
  static getTickets(): Ticket[] {
    try {
      initDB();
      const content = fs.readFileSync(TICKETS_FILE, 'utf8');
      return JSON.parse(content) as Ticket[];
    } catch (e) {
      console.error('Error reading tickets:', e);
      return [];
    }
  }

  static saveTickets(tickets: Ticket[]): void {
    try {
      initDB();
      fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2), 'utf8');
      this.generateTicketsExcelFile(tickets, path.join(DATA_DIR, 'tickets.xlsx'));
    } catch (e) {
      console.error('Error saving tickets:', e);
    }
  }

  static mapEngineerName(rawName: string): string {
    const clean = (rawName || '').trim().toLowerCase();
    if (!clean) return rawName || 'Unassigned';

    const map: { [key: string]: string } = {
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

    for (const [shortName, officialName] of Object.entries(map)) {
      if (clean === shortName || clean.startsWith(shortName) || shortName.startsWith(clean)) {
        return officialName;
      }
    }

    // Fallback fuzzy match
    try {
      const engineers = this.getEngineers();
      const matchedEng = engineers.find(eng => {
        const engName = eng.name.trim().toLowerCase();
        return engName === clean || engName.includes(clean) || clean.includes(engName);
      });
      if (matchedEng) {
        return matchedEng.name;
      }
    } catch (e) {
      console.error('Error fetching engineers during mapping fallback:', e);
    }

    return rawName;
  }

  /**
   * Generates next ticket ID using current date parts: YYYYMMNNN
   * reseting number monthly. Includes 'sur-' prefix for Surat location tickets.
   */
  static generateNextTID(dateStr?: string, systemMode?: string): string {
    const tickets = this.getTickets();
    const date = dateStr ? new Date(dateStr) : new Date();
    
    const yyyy = date.getFullYear().toString();
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const datePart = `${yyyy}${mm}`; // E.g., '202607'

    const isSurat = systemMode === 'Surat';
    const prefix = isSurat ? `sur-${datePart}` : datePart;

    // Find highest running number NNN for this prefix
    let highestNNN = 0;
    for (const ticket of tickets) {
      if (ticket.ticket_id && ticket.ticket_id.startsWith(prefix)) {
        const numPart = ticket.ticket_id.substring(prefix.length);
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > highestNNN) {
          highestNNN = num;
        }
      }
    }

    const nextNNN = (highestNNN + 1).toString().padStart(3, '0');
    return `${prefix}${nextNNN}`;
  }

  static normalizeCategoryName(catStr?: string): string {
    if (!catStr) return '';
    const upper = catStr.trim().toUpperCase();
    if (
      upper === 'ALL IN ONE' || 
      upper === 'ALL-IN-ONE' || 
      upper === 'ALL_IN_ONE' || 
      upper === 'ALL INONE' || 
      upper === 'AIO' || 
      upper === 'DESKTOP' ||
      upper === 'DESKTOP COMPUTER' ||
      upper === 'PC' ||
      upper.includes('ALL IN ONE') ||
      upper.includes('DESKTOP')
    ) {
      return 'AIO';
    }
    return upper;
  }

  static createTicket(ticketData: Omit<Ticket, 'id' | 'created_at' | 'updated_at'> & { ticket_id?: string; systemMode?: string }): Ticket {
    const tickets = this.getTickets();
    
    // Auto detect system mode from location if not explicitly provided
    const resolvedMode = ticketData.systemMode || 
      (ticketData.location?.toLowerCase().includes('surat') ? 'Surat' : 'RO-Ahmedabad');

    const tid = ticketData.ticket_id && ticketData.ticket_id.trim() 
      ? ticketData.ticket_id.trim() 
      : this.generateNextTID(ticketData.date, resolvedMode);

    // Check for duplicate ticket_id
    const duplicate = tickets.find(t => t.ticket_id.trim().toLowerCase() === tid.toLowerCase());
    if (duplicate) {
      throw new Error(`Ticket number "${tid}" already exists.`);
    }
    
    const mappedEngineer = this.mapEngineerName(ticketData.engineer);
    const normalizedCategory = this.normalizeCategoryName(ticketData.category);
    const normalizedHw = normalizeModelString(ticketData.model, ticketData.product, ticketData.brand);
    
    const nowISO = new Date().toISOString();
    const newTicket: Ticket = {
      ...ticketData,
      id: 'ticket-' + Date.now() + '-' + Math.floor(Math.random() * 100000),
      ticket_id: tid,
      category: normalizedCategory,
      engineer: mappedEngineer,
      model: normalizedHw.model || ticketData.model || '',
      brand: normalizedHw.brand || ticketData.brand || '',
      created_at: nowISO,
      updated_at: nowISO
    };

    tickets.push(newTicket);
    this.saveTickets(tickets);
    return newTicket;
  }

  static bulkCreateTickets(ticketsList: Array<Partial<Ticket>>): Ticket[] {
    const tickets = this.getTickets();
    const nowISO = new Date().toISOString();
    const created: Ticket[] = [];

    // Helper to generate next TID internally inside the loop to avoid generating duplicate TIDs for the same batch!
    let nextNumMap: { [prefix: string]: number } = {};

    const getNextTIDForBatch = (dateStr?: string, location?: string): string => {
      const date = dateStr ? new Date(dateStr) : new Date();
      let year = date.getFullYear();
      let month = date.getMonth() + 1;
      
      // Check for invalid date
      if (isNaN(year) || isNaN(month)) {
        const fallbackDate = new Date();
        year = fallbackDate.getFullYear();
        month = fallbackDate.getMonth() + 1;
      }

      const datePart = `${year}${month.toString().padStart(2, '0')}`;
      const isSurat = location && location.trim().toLowerCase().includes('surat');
      const prefix = isSurat ? `sur-${datePart}` : datePart;

      if (nextNumMap[prefix] === undefined) {
        // Initialize from existing tickets in the file + newly created in this batch
        let highestNNN = 0;
        const allTickets = [...tickets, ...created];
        for (const ticket of allTickets) {
          if (ticket.ticket_id && ticket.ticket_id.startsWith(prefix)) {
            const numPart = ticket.ticket_id.substring(prefix.length);
            const num = parseInt(numPart, 10);
            if (!isNaN(num) && num > highestNNN) {
              highestNNN = num;
            }
          }
        }
        nextNumMap[prefix] = highestNNN + 1;
      } else {
        nextNumMap[prefix]++;
      }

      const nextNNN = nextNumMap[prefix].toString().padStart(3, '0');
      return `${prefix}${nextNNN}`;
    };

    for (let i = 0; i < ticketsList.length; i++) {
      const item = ticketsList[i];
      const dateVal = item.date || '';
      const tid = item.ticket_id && item.ticket_id.trim()
        ? item.ticket_id.trim()
        : getNextTIDForBatch(dateVal || nowISO.split('T')[0], item.location);

      const normalizedTid = tid.toLowerCase();
      
      const statusVal = (item.status === 'Open' || item.status === 'Hold' || item.status === 'Closed')
        ? item.status
        : 'Open';

      // Check if ticket already exists in the master database
      const existingIdx = tickets.findIndex(t => t.ticket_id.trim().toLowerCase() === normalizedTid);
      
      if (existingIdx !== -1) {
        const existingTicket = tickets[existingIdx];
        if (existingTicket.status !== statusVal) {
          // Status has changed! Update and save existing ticket details
          const mappedEngineer = item.engineer ? this.mapEngineerName(item.engineer) : existingTicket.engineer;
          tickets[existingIdx] = {
            ...existingTicket,
            status: statusVal,
            date: item.date !== undefined ? item.date : existingTicket.date,
            username: item.username !== undefined ? item.username : existingTicket.username,
            contact: item.contact !== undefined ? item.contact : existingTicket.contact,
            location: item.location !== undefined ? item.location : existingTicket.location,
            product: item.product !== undefined ? item.product : existingTicket.product,
            category: item.category !== undefined ? this.normalizeCategoryName(item.category) : existingTicket.category,
            brand: item.brand !== undefined ? item.brand : existingTicket.brand,
            model: item.model !== undefined ? item.model : existingTicket.model,
            serial_number: item.serial_number !== undefined ? item.serial_number : existingTicket.serial_number,
            problem: item.problem !== undefined ? item.problem : existingTicket.problem,
            engineer: mappedEngineer,
            action_taken: item.action_taken !== undefined ? item.action_taken : existingTicket.action_taken,
            first_visit_date: item.first_visit_date !== undefined ? item.first_visit_date : existingTicket.first_visit_date,
            hold_date: item.hold_date !== undefined ? item.hold_date : existingTicket.hold_date,
            close_date: item.close_date !== undefined ? item.close_date : existingTicket.close_date,
            engineer_remark: item.engineer_remark !== undefined ? item.engineer_remark : existingTicket.engineer_remark,
            updated_at: nowISO
          };
        }
        continue;
      }

      // Check if ticket already exists in the newly created batch list (to handle internal batch duplicates)
      const batchIdx = created.findIndex(t => t.ticket_id.trim().toLowerCase() === normalizedTid);
      if (batchIdx !== -1) {
        const batchTicket = created[batchIdx];
        if (batchTicket.status !== statusVal) {
          const mappedEngineer = item.engineer ? this.mapEngineerName(item.engineer) : batchTicket.engineer;
          created[batchIdx] = {
            ...batchTicket,
            status: statusVal,
            date: item.date !== undefined ? item.date : batchTicket.date,
            username: item.username !== undefined ? item.username : batchTicket.username,
            contact: item.contact !== undefined ? item.contact : batchTicket.contact,
            location: item.location !== undefined ? item.location : batchTicket.location,
            product: item.product !== undefined ? item.product : batchTicket.product,
            category: item.category !== undefined ? this.normalizeCategoryName(item.category) : batchTicket.category,
            brand: item.brand !== undefined ? item.brand : batchTicket.brand,
            model: item.model !== undefined ? item.model : batchTicket.model,
            serial_number: item.serial_number !== undefined ? item.serial_number : batchTicket.serial_number,
            problem: item.problem !== undefined ? item.problem : batchTicket.problem,
            engineer: mappedEngineer,
            action_taken: item.action_taken !== undefined ? item.action_taken : batchTicket.action_taken,
            first_visit_date: item.first_visit_date !== undefined ? item.first_visit_date : batchTicket.first_visit_date,
            hold_date: item.hold_date !== undefined ? item.hold_date : batchTicket.hold_date,
            close_date: item.close_date !== undefined ? item.close_date : batchTicket.close_date,
            engineer_remark: item.engineer_remark !== undefined ? item.engineer_remark : batchTicket.engineer_remark,
            updated_at: nowISO
          };
        }
        continue;
      }

      const mappedEngineer = item.engineer ? this.mapEngineerName(item.engineer) : 'Unassigned';
      const normalizedHw = normalizeModelString(item.model, item.product, item.brand);

      const newTicket: Ticket = {
        id: 'ticket-' + Date.now() + '-' + Math.floor(Math.random() * 100000) + '-' + i,
        ticket_id: tid,
        date: dateVal,
        username: item.username || '',
        contact: item.contact || '',
        location: item.location || '',
        product: normalizedHw.product || item.product || '',
        category: normalizedHw.category || this.normalizeCategoryName(item.category),
        brand: normalizedHw.brand || item.brand || '',
        model: normalizedHw.model || item.model || '',
        serial_number: item.serial_number || '',
        problem: item.problem || '',
        engineer: mappedEngineer,
        action_taken: item.action_taken || '',
        first_visit_date: item.first_visit_date || '',
        hold_date: item.hold_date || '',
        close_date: item.close_date || '',
        status: statusVal,
        engineer_remark: item.engineer_remark || '',
        created_at: nowISO,
        updated_at: nowISO
      };

      created.push(newTicket);
    }

    tickets.push(...created);
    this.saveTickets(tickets);
    return created;
  }

  static updateTicket(id: string, updatedFields: Partial<Omit<Ticket, 'id' | 'created_at'>>): Ticket | null {
    const tickets = this.getTickets();
    const index = tickets.findIndex(t => t.id === id);
    if (index === -1) return null;

    const originalTicket = tickets[index];

    // If ticket_id is being changed, check for duplicates among other tickets
    const newTid = updatedFields.ticket_id?.trim();
    if (newTid && newTid.toLowerCase() !== originalTicket.ticket_id.toLowerCase()) {
      const duplicate = tickets.find(t => t.id !== id && t.ticket_id.trim().toLowerCase() === newTid.toLowerCase());
      if (duplicate) {
        throw new Error(`Ticket number "${newTid}" already exists.`);
      }
    }

    const nowISO = new Date().toISOString();

    const mappedFields = { ...updatedFields };
    if (mappedFields.engineer) {
      mappedFields.engineer = this.mapEngineerName(mappedFields.engineer);
    }
    if (mappedFields.category !== undefined) {
      mappedFields.category = this.normalizeCategoryName(mappedFields.category);
    }
    if (mappedFields.model !== undefined || mappedFields.product !== undefined || mappedFields.brand !== undefined) {
      const normalizedHw = normalizeModelString(
        mappedFields.model ?? originalTicket.model,
        mappedFields.product ?? originalTicket.product,
        mappedFields.brand ?? originalTicket.brand
      );
      mappedFields.model = normalizedHw.model || mappedFields.model;
      if (normalizedHw.brand) {
        mappedFields.brand = normalizedHw.brand;
      }
    }

    tickets[index] = {
      ...originalTicket,
      ...mappedFields,
      updated_at: nowISO
    } as Ticket;

    this.saveTickets(tickets);
    return tickets[index];
  }

  static deleteTicket(id: string): boolean {
    const tickets = this.getTickets();
    const filtered = tickets.filter(t => t.id !== id);
    if (filtered.length === tickets.length) return false;
    this.saveTickets(filtered);
    return true;
  }

  static deleteAllTickets(): void {
    this.saveTickets([]);
  }

  // --- Attendance ---
  static getAttendance(year: number, month: number): AttendanceRecord[] {
    try {
      initDB();
      const monthStr = month.toString().padStart(2, '0');
      const quarter = Math.floor((month - 1) / 3) + 1;

      const monthJsonFile = path.join(DATA_DIR, `attendance_${year}_${monthStr}.json`);
      const quarterJsonFile = path.join(DATA_DIR, `attendance_${year}_Q${quarter}.json`);

      let filtered: AttendanceRecord[] = [];

      if (fs.existsSync(monthJsonFile)) {
        try {
          const content = fs.readFileSync(monthJsonFile, 'utf8');
          filtered = JSON.parse(content) as AttendanceRecord[];
        } catch (err) {
          console.error(`Error reading monthly JSON ${monthJsonFile}:`, err);
        }
      } else if (fs.existsSync(quarterJsonFile)) {
        try {
          const content = fs.readFileSync(quarterJsonFile, 'utf8');
          const qRecords = JSON.parse(content) as AttendanceRecord[];
          filtered = qRecords.filter(r => r.year === year && r.month === month);
        } catch (err) {
          console.error(`Error reading quarterly JSON ${quarterJsonFile}:`, err);
        }
      } else {
        // Fallback to legacy global file
        if (fs.existsSync(ATTENDANCE_FILE)) {
          try {
            const content = fs.readFileSync(ATTENDANCE_FILE, 'utf8');
            const allRecords = JSON.parse(content) as AttendanceRecord[];
            filtered = allRecords.filter(r => r.year === year && r.month === month);
          } catch (err) {
            console.error(`Error reading legacy attendance file:`, err);
          }
        }
      }
      
      const engineers = this.getEngineers().filter(e => e.active);
      let updatedFiltered: AttendanceRecord[] = [];
      let changed = false;
      
      engineers.forEach(eng => {
        const existingRecord = filtered.find(r => r.engineerId === eng.id);
        if (existingRecord) {
          // Sync name and location if changed
          if (existingRecord.engineerName !== eng.name || existingRecord.location !== eng.location) {
            existingRecord.engineerName = eng.name;
            existingRecord.location = eng.location || '';
            changed = true;
          }
          updatedFiltered.push(existingRecord);
        } else {
          const daysInMonth = new Date(year, month, 0).getDate();
          const initialDays: { [day: number]: AttendanceStatus } = {};
          
          for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month - 1, d);
            const dayOfWeek = dateObj.getDay(); // 0 is Sunday
            initialDays[d] = dayOfWeek === 0 ? 'WO' : '';
          }
          
          const newRec: AttendanceRecord = {
            id: `att-${eng.id}-${year}-${month}`,
            engineerId: eng.id,
            engineerName: eng.name,
            location: eng.location || '',
            year,
            month,
            days: initialDays
          };
          updatedFiltered.push(newRec);
          changed = true;
        }
      });
      
      // If we initialized any records or synced name changes, save it right away to persist month-wise files
      if (changed || !fs.existsSync(monthJsonFile)) {
        this.saveAttendance(updatedFiltered);
      }
      
      return updatedFiltered;
    } catch (e) {
      console.error('Error reading/initializing attendance:', e);
      return [];
    }
  }

  static saveAttendance(records: AttendanceRecord[]): void {
    if (!records || records.length === 0) return;
    try {
      initDB();
      const first = records[0];
      const { year, month } = first;
      const monthStr = month.toString().padStart(2, '0');
      const quarter = Math.floor((month - 1) / 3) + 1;

      // 1. Save Month-wise JSON
      const monthJsonFile = path.join(DATA_DIR, `attendance_${year}_${monthStr}.json`);
      fs.writeFileSync(monthJsonFile, JSON.stringify(records, null, 2), 'utf8');

      // 2. Save Month-wise Excel sheet
      const monthExcelFile = path.join(DATA_DIR, `attendance_${year}_${monthStr}.xlsx`);
      this.generateMonthExcel(records, year, month, monthExcelFile);

      // 3. Save/Update Quarter-wise JSON
      const quarterJsonFile = path.join(DATA_DIR, `attendance_${year}_Q${quarter}.json`);
      let qRecords: AttendanceRecord[] = [];
      if (fs.existsSync(quarterJsonFile)) {
        try {
          const qContent = fs.readFileSync(quarterJsonFile, 'utf8');
          qRecords = JSON.parse(qContent) as AttendanceRecord[];
        } catch (e) {
          console.error('Error reading quarter json:', e);
        }
      }
      // Filter out this month's existing records to overwrite/update them
      qRecords = qRecords.filter(r => !(r.year === year && r.month === month));
      qRecords.push(...records);
      fs.writeFileSync(quarterJsonFile, JSON.stringify(qRecords, null, 2), 'utf8');

      // 4. Save/Update Quarter-wise Excel sheet
      const quarterExcelFile = path.join(DATA_DIR, `attendance_${year}_Q${quarter}.xlsx`);
      this.generateQuarterExcel(qRecords, year, quarter, quarterExcelFile);

      // 5. Sync to main legacy attendance file for backward safety
      try {
        if (!fs.existsSync(ATTENDANCE_FILE)) {
          fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify([], null, 2), 'utf8');
        }
        const content = fs.readFileSync(ATTENDANCE_FILE, 'utf8');
        let allRecords = JSON.parse(content) as AttendanceRecord[];
        
        records.forEach(newRec => {
          const index = allRecords.findIndex(r => r.engineerId === newRec.engineerId && r.year === newRec.year && r.month === newRec.month);
          if (index !== -1) {
            allRecords[index] = { ...allRecords[index], ...newRec };
          } else {
            allRecords.push(newRec);
          }
        });
        fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify(allRecords, null, 2), 'utf8');
        this.generateGlobalAttendanceExcel(allRecords, path.join(DATA_DIR, 'attendance.xlsx'));
      } catch (err) {
        console.error('Error updating legacy global attendance file:', err);
      }
    } catch (e) {
      console.error('Error saving attendance:', e);
    }
  }

  static generateMonthExcel(records: AttendanceRecord[], year: number, month: number, filePath: string): void {
    try {
      const monthLabel = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
      ][month - 1] || 'Month';
      const daysInMonth = new Date(year, month, 0).getDate();

      const dayNames: string[] = [];
      const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month - 1, d);
        dayNames.push(weekdays[dateObj.getDay()]);
      }

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
        
        // Calculate stats
        let workingDays = 0;
        let leaveDays = 0;
        for (let d = 1; d <= daysInMonth; d++) {
          const status = rec.days[d] || '';
          if (status === 'P') {
            workingDays += 1;
          } else if (status === 'HD') {
            workingDays += 0.5;
            leaveDays += 0.5;
          } else if (status === 'L') {
            leaveDays += 1;
          }
        }
        row.push(workingDays, leaveDays);
        return row;
      });

      // Construct Workbook
      const wb = XLSX.utils.book_new();
      const titleRow = [`${monthLabel.toUpperCase()} ${year} ATTENDANCE SHEET`];
      
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

      XLSX.utils.book_append_sheet(wb, ws, `${monthLabel}_Attendance`);
      XLSX.writeFile(wb, filePath);
    } catch (e) {
      console.error('Error generating monthly Excel:', e);
    }
  }

  static generateQuarterExcel(qRecords: AttendanceRecord[], year: number, quarter: number, filePath: string): void {
    try {
      const wb = XLSX.utils.book_new();
      const startMonth = (quarter - 1) * 3 + 1;
      const endMonth = startMonth + 2;
      const monthsLabels = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
      ];
      const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      let sheetAdded = false;

      for (let m = startMonth; m <= endMonth; m++) {
        const monthRecords = qRecords.filter(r => r.year === year && r.month === m);
        if (monthRecords.length === 0) continue;

        const monthLabel = monthsLabels[m - 1] || `Month_${m}`;
        const daysInMonth = new Date(year, m, 0).getDate();

        const dayNames: string[] = [];
        for (let d = 1; d <= daysInMonth; d++) {
          const dateObj = new Date(year, m - 1, d);
          dayNames.push(weekdays[dateObj.getDay()]);
        }

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
        const dataRows = monthRecords.map((rec, idx) => {
          const row: any[] = [idx + 1, rec.engineerName, rec.location || ''];
          for (let d = 1; d <= daysInMonth; d++) {
            row.push(rec.days[d] || '');
          }
          
          // Calculate stats
          let workingDays = 0;
          let leaveDays = 0;
          for (let d = 1; d <= daysInMonth; d++) {
            const status = rec.days[d] || '';
            if (status === 'P') {
              workingDays += 1;
            } else if (status === 'HD') {
              workingDays += 0.5;
              leaveDays += 0.5;
            } else if (status === 'L') {
              leaveDays += 1;
            }
          }
          row.push(workingDays, leaveDays);
          return row;
        });

        const titleRow = [`${monthLabel.toUpperCase()} ${year} ATTENDANCE SHEET`];
        
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

        XLSX.utils.book_append_sheet(wb, ws, monthLabel);
        sheetAdded = true;
      }

      if (sheetAdded) {
        XLSX.writeFile(wb, filePath);
      }
    } catch (e) {
      console.error('Error generating quarterly Excel:', e);
    }
  }

  static generateTicketsExcelFile(tickets: Ticket[], filePath: string): void {
    try {
      const headers = [
        'Sr No', 'Ticket ID', 'Date', 'Username', 'Contact', 'Location', 
        'Product', 'Category', 'Brand', 'Model', 'Serial Number', 
        'Problem', 'Engineer', 'Status', 'Action Taken', 
        'First Visit Date', 'Hold Date', 'Close Date', 'Remarks', 'Resolution Days (Visit ➔ Close)'
      ];

      const data = tickets.map((t, idx) => {
        const resDays = calculateDaysBetweenVisitAndClose(t.first_visit_date, t.close_date, t.date, t.status).text;
        return [
          idx + 1,
          t.ticket_id || '',
          t.date || '',
          t.username || '',
          t.contact || '',
          t.location || '',
          t.product || '',
          t.category || '',
          t.brand || '',
          t.model || '',
          t.serial_number || '',
          t.problem || '',
          t.engineer || '',
          t.status || '',
          t.action_taken || '',
          t.first_visit_date || '',
          t.hold_date || '',
          t.close_date || '',
          t.engineer_remark || '',
          resDays
        ];
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

      // Auto-fit columns
      const cols: any[] = [];
      headers.forEach((h, colIdx) => {
        let maxLen = h.length;
        data.forEach((row) => {
          const val = String(row[colIdx] || '');
          if (val.length > maxLen) {
            maxLen = val.length;
          }
        });
        cols.push({ wch: Math.min(Math.max(maxLen + 3, 10), 50) });
      });
      ws['!cols'] = cols;

      XLSX.utils.book_append_sheet(wb, ws, "All Tickets");
      XLSX.writeFile(wb, filePath);
    } catch (e) {
      console.error('Error generating tickets Excel file:', e);
    }
  }

  static generateGlobalAttendanceExcel(allRecords: AttendanceRecord[], filePath: string): void {
    try {
      if (!allRecords || allRecords.length === 0) return;
      const wb = XLSX.utils.book_new();

      // Group records by Year and Month
      const grouped: { [key: string]: AttendanceRecord[] } = {};
      allRecords.forEach(rec => {
        const monthStr = rec.month.toString().padStart(2, '0');
        const key = `${rec.year}_${monthStr}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(rec);
      });

      const keys = Object.keys(grouped).sort();
      const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const monthsLabels = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
      ];

      keys.forEach(key => {
        const records = grouped[key];
        const [year, month] = key.split('_').map(Number);
        const monthLabel = monthsLabels[month - 1] || `Month_${month}`;
        const daysInMonth = new Date(year, month, 0).getDate();

        const dayNames: string[] = [];
        for (let d = 1; d <= daysInMonth; d++) {
          const dateObj = new Date(year, month - 1, d);
          dayNames.push(weekdays[dateObj.getDay()]);
        }

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

        const dataRows = records.map((rec, idx) => {
          const row: any[] = [idx + 1, rec.engineerName, rec.location || ''];
          for (let d = 1; d <= daysInMonth; d++) {
            row.push(rec.days[d] || '');
          }
          
          let workingDays = 0;
          let leaveDays = 0;
          for (let d = 1; d <= daysInMonth; d++) {
            const status = rec.days[d] || '';
            if (status === 'P') {
              workingDays += 1;
            } else if (status === 'HD') {
              workingDays += 0.5;
              leaveDays += 0.5;
            } else if (status === 'L') {
              leaveDays += 1;
            }
          }
          row.push(workingDays, leaveDays);
          return row;
        });

        const titleRow = [`${monthLabel.toUpperCase()} ${year} ATTENDANCE SHEET`];
        const sheetData = [
          titleRow,
          [],
          headers,
          weekdayRow,
          ...dataRows
        ];

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: daysInMonth + 4 } }
        ];

        const sheetName = `${monthLabel} ${year}`.slice(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      XLSX.writeFile(wb, filePath);
    } catch (e) {
      console.error('Error generating global attendance Excel:', e);
    }
  }

  static syncExcelFiles(): void {
    try {
      initDB();
      const tickets = this.getTickets();
      this.generateTicketsExcelFile(tickets, path.join(DATA_DIR, 'tickets.xlsx'));

      if (fs.existsSync(ATTENDANCE_FILE)) {
        try {
          const content = fs.readFileSync(ATTENDANCE_FILE, 'utf8');
          const allRecords = JSON.parse(content) as AttendanceRecord[];
          this.generateGlobalAttendanceExcel(allRecords, path.join(DATA_DIR, 'attendance.xlsx'));
        } catch (e) {
          console.error('Error syncing global attendance excel:', e);
        }
      }
    } catch (err) {
      console.error('Error during automatic Excel files sync:', err);
    }
  }
}

// Perform initial Excel files sync on boot
DBService.syncExcelFiles();
