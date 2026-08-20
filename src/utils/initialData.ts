import { Engineer, Ticket, LocationVisit, AttendanceRecord } from '../types';

export const INITIAL_ENGINEERS: Engineer[] = [
  {
    id: "eng-1",
    name: "Mahebub Mir",
    mobile: "9898531231",
    email: "mahbub.muskan@gmail.com",
    password: "Mahebub@9898",
    active: true,
    location: "Ro-Ahmedabad",
    address: "14, Mahebub Society, Sarkhej Juhapura Road, Ahmedabad - 55",
    work_profile: "Team Led Cum System Engineer",
    education: "Graduate",
    computer_certificate: "PGDCA, A+N+",
    experience: "18 Years",
    photo: "data/image/Mahebub Mir.jpg"
  },
  {
    id: "eng-2",
    name: "Karan Parmar",
    mobile: "9737284797",
    email: "Karanparmar1508@gmail.com",
    password: "Karan@9737",
    active: true,
    location: "Ro-Ahmedabad",
    address: "364, Vankar Vas, Camp Sadarbazar, Shahibaug, Ahmedabad",
    work_profile: "System Support Engineer",
    education: "12th",
    computer_certificate: "Hardware & Networking (IANT)",
    experience: "6.5 Years",
    photo: "data/image/Karan Parmar.jpeg"
  },
  {
    id: "eng-3",
    name: "Chirag Panchal",
    mobile: "8460004275",
    email: "Chiragpanchal0831@gmail.com",
    password: "Chirag@8460",
    active: true,
    location: "Ro-Ahmedabad",
    address: "2113 kailash niwas, azad chock, fadeli, dhanushdhari society, ahmedabad",
    work_profile: "System Support Engineer",
    education: "Graduate",
    computer_certificate: "BCA (Running)",
    experience: "Fresher",
    photo: "data/image/Chirag Panchal.jpeg"
  },
  {
    id: "eng-4",
    name: "Krushil Kapadiya",
    mobile: "8401456649",
    email: "krushilkapadiya@gmail.com",
    password: "Krushil@8401",
    active: true,
    location: "Ro-Ahmedabad",
    address: "49, Vinay Vihar Soc., Bhulabhai Park, Ahmedabad",
    work_profile: "System Support Engineer",
    education: "Graduate",
    computer_certificate: "A+ Hardware",
    experience: "7 Years",
    photo: "data/image/Krushil Kapadiya.jpeg"
  },
  {
    id: "eng-5",
    name: "Mayank Shravak",
    mobile: "9974053682",
    email: "shravakmayank411@gmail.com",
    password: "Mayank@9974",
    active: true,
    location: "RHGH",
    address: "1755/8, Pithavali Chali, Rajpur Gomtipur, Ahmedabad",
    work_profile: "System Support Engineer",
    education: "Graduate",
    computer_certificate: "Hardware & Networking",
    experience: "1.5 Years",
    photo: "data/image/Mayank Shravak.jpeg"
  },
  {
    id: "eng-6",
    name: "Pravin Prajapati",
    mobile: "7984434364",
    email: "prajapatipravin4321@gmail.com",
    password: "Pravin@7984",
    active: true,
    location: "Ro-Ahmedabad",
    address: "19, Devnandan Park Society, Isanpur, Ahmedabad",
    work_profile: "System Support Engineer",
    education: "12th",
    computer_certificate: "A+N+",
    experience: "5 Years",
    photo: "data/image/Pravin Prajapati.jpeg"
  },
  {
    id: "eng-7",
    name: "Prince Kumar",
    mobile: "9128770114",
    email: "priance.gautam@gmail.com",
    password: "Prince@9128",
    active: true,
    location: "Ro-Ahmedabad",
    address: "Trimurti Apartment, Memnagar, Ahmedabad",
    work_profile: "System Support Engineer",
    education: "Graduate",
    computer_certificate: "B.Sc. IT, N+",
    experience: "Fresher",
    photo: "data/image/Prince Kumar.jpeg"
  },
  {
    id: "eng-8",
    name: "Sudhir Kuvardiya",
    mobile: "9727332188",
    email: "itengineer.sudhir@gmail.com",
    password: "Sudhir@9727",
    active: true,
    location: "ADMS Rajkot",
    address: "107, Punitnagar Street no 6, Gondal Chowkdi, Rajkot",
    work_profile: "System Support Engineer",
    education: "Diploma",
    computer_certificate: "Hardware & Networking (CCNA)",
    experience: "10 Years",
    photo: "data/image/Sudhir Kuvardiya.jpeg"
  },
  {
    id: "eng-9",
    name: "Parag",
    mobile: "9998889468",
    email: "Parag7780@gmail.com",
    password: "Parag@9998",
    active: true,
    location: "Jamnagar Hospital",
    address: "Chandra Prabhu Appartment, Pavan Chakki, New Jail Road, Dangarvada, Jamnagar",
    work_profile: "System Support Engineer",
    education: "12th",
    computer_certificate: "Hardware & Networking",
    experience: "11 Years",
    photo: "data/image/Parag.jpeg"
  },
  {
    id: "eng-10",
    name: "Amit Acharya",
    mobile: "9327624707",
    email: "ameetacharya11@gmail.com",
    password: "Amit@9327",
    active: true,
    location: "Bhavnagar Hospital",
    address: "1403/A-2, Near Rajaram No Avedo, Ghodha Road, Bhavnagar",
    work_profile: "System Support Engineer",
    education: "Diploma",
    computer_certificate: "Hardware & Networking",
    experience: "4.5 Years",
    photo: "data/image/Amit Acharya.jpeg"
  },
  {
    id: "eng-11",
    name: "Saifuddin Momin",
    mobile: "9313224211",
    email: "safmominsafmomin@gmail.com",
    password: "Saifuddin@9313",
    active: true,
    location: "Kalol Hospital",
    address: "Mominvas, Serisa, Gandhinagar",
    work_profile: "System Support Engineer",
    education: "Graduate",
    computer_certificate: "Hardware & Networking",
    experience: "3.2 Years",
    photo: "data/image/Saifuddin Momin.jpeg"
  },
  {
    id: "eng-12",
    name: "Mayur Ahir",
    mobile: "8734000056",
    email: "Mayurahire525@gmail.com",
    password: "Mayur@8734",
    active: true,
    location: "Surat",
    address: "49 Radhe Homes, Orma, Masamagam, Orma, Po:orma, Dist:Surat Gujarat-394540",
    work_profile: "System Support Engineer",
    education: "12th",
    computer_certificate: "advance diploma engineering in cyber security standard",
    experience: "5 year"
  },
  {
    id: "eng-13",
    name: "Jenil Kosambiya",
    mobile: "9429913500",
    email: "jenilkosambiya9998@gmail.com",
    password: "Jenil@9429",
    active: true,
    location: "Surat",
    address: "545, Mahyavansi street near gujarat gas company, Adajan gam, surat, 395005.",
    work_profile: "System Support Engineer",
    education: "Graduate",
    computer_certificate: "Ccc tally with gst, Cloud computing standard",
    experience: "1.2 year"
  },
  {
    id: "eng-14",
    name: "Harshil Prajapati",
    mobile: "8140350994",
    email: "harshilprajapati@gmail.com",
    password: "Harshil@8140",
    active: false,
    resigned: true,
    resignation_date: "June 2026",
    location: "Ro-Ahmedabad",
    address: "Gujarat Housing Board, Meghaninagar, Asarwa, Ahmedabad",
    work_profile: "System Support Engineer",
    education: "Post Graduate",
    computer_certificate: "Hardware & Networking, CCNA",
    experience: "2 year"
  },
  {
    id: "eng-15",
    name: "Kaushik Vaghela",
    mobile: "7435999492",
    email: "kaushikyaghela@gmail.com",
    password: "Kaushik@7435",
    active: false,
    resigned: true,
    resignation_date: "March 2026",
    location: "Ro-Ahmedabad",
    address: "26/664, Dr. Ambedkar Colony, Ambawadi, Ahmedabad",
    work_profile: "System Support Engineer",
    education: "Msc IT",
    computer_certificate: "MSC IT",
    experience: "4 year"
  }
];

export const INITIAL_TICKETS: Ticket[] = [];

export const INITIAL_VISITS: LocationVisit[] = [];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  // --- MARCH 2026 ---
  {
    id: "att-eng-1-2026-3",
    engineerId: "eng-1",
    engineerName: "Mahebub Mir",
    location: "Ro-Ahmedabad",
    year: 2026,
    month: 3,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P", 29: "WO", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-2-2026-3",
    engineerId: "eng-2",
    engineerName: "Karan Parmar",
    location: "Ro-Ahmedabad",
    year: 2026,
    month: 3,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "L", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P", 29: "WO", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-15-2026-3",
    engineerId: "eng-15",
    engineerName: "Kaushik Vaghela",
    location: "Ro-Ahmedabad",
    year: 2026,
    month: 3,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "L", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P", 29: "WO", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-4-2026-3",
    engineerId: "eng-4",
    engineerName: "Krushil Kapadiya",
    location: "Ro-Ahmedabad",
    year: 2026,
    month: 3,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "L",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "L",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P", 29: "WO", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-5-2026-3",
    engineerId: "eng-5",
    engineerName: "Mayank Shravak",
    location: "Gomtipur",
    year: 2026,
    month: 3,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P", 29: "WO", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-6-2026-3",
    engineerId: "eng-6",
    engineerName: "Pravin Prajapati",
    location: "Ro-Ahmedabad",
    year: 2026,
    month: 3,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P", 29: "WO", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-14-2026-3",
    engineerId: "eng-14",
    engineerName: "Harshil Prajapati",
    location: "Ro-Ahmedabad",
    year: 2026,
    month: 3,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "L", 14: "WO", 15: "L", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P", 29: "WO", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-7-2026-3",
    engineerId: "eng-7",
    engineerName: "Prince Kumar",
    location: "Ro-Ahmedabad",
    year: 2026,
    month: 3,
    days: {
      1: "WO", 8: "WO", 11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P", 29: "WO", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-8-2026-3",
    engineerId: "eng-8",
    engineerName: "Sudhir Kuvardiya",
    location: "ADMS Rajkot",
    year: 2026,
    month: 3,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "L", 28: "P", 29: "WO", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-9-2026-3",
    engineerId: "eng-9",
    engineerName: "Parag",
    location: "Jamnagar Hospital",
    year: 2026,
    month: 3,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P", 29: "WO", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-10-2026-3",
    engineerId: "eng-10",
    engineerName: "Amit Acharya",
    location: "Bhavnagar Hospital",
    year: 2026,
    month: 3,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P", 29: "WO", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-11-2026-3",
    engineerId: "eng-11",
    engineerName: "Saifuddin Momin",
    location: "Kalol Hospital",
    year: 2026,
    month: 3,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P", 29: "WO", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-12-2026-3",
    engineerId: "eng-12",
    engineerName: "Mayur Ahir",
    location: "SRO Surat",
    year: 2026,
    month: 3,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P", 29: "WO", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-13-2026-3",
    engineerId: "eng-13",
    engineerName: "Jenil Kosambiya",
    location: "SRO Surat",
    year: 2026,
    month: 3,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P", 29: "WO", 30: "P", 31: "P"
    }
  },
  // --- JULY 2026 ---
  {
    id: "att-eng-1-2026-7",
    engineerId: "eng-1",
    engineerName: "Mahebub Mir",
    location: "Ro-Ahmedabad",
    year: 2026,
    month: 7,
    days: {
      1: "P", 2: "P", 3: "P", 4: "P", 5: "WO", 6: "P", 7: "P", 8: "P", 9: "P", 10: "P",
      11: "P", 12: "WO", 13: "P", 14: "P", 15: "P", 16: "H", 17: "P", 18: "P", 19: "WO", 20: "P",
      21: "P", 22: "P", 23: "P", 24: "P", 25: "P", 26: "WO", 27: "P", 28: "P", 29: "P", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-2-2026-7",
    engineerId: "eng-2",
    engineerName: "Karan Parmar",
    location: "Ro-Ahmedabad",
    year: 2026,
    month: 7,
    days: {
      1: "P", 2: "P", 3: "P", 4: "P", 5: "WO", 6: "P", 7: "P", 8: "P", 9: "L", 10: "P",
      11: "P", 12: "WO", 13: "P", 14: "P", 15: "P", 16: "H", 17: "P", 18: "P", 19: "WO", 20: "P",
      21: "P", 22: "P", 23: "P", 24: "P", 25: "P", 26: "WO", 27: "P", 28: "P", 29: "P", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-4-2026-7",
    engineerId: "eng-4",
    engineerName: "Krushil Kapadiya",
    location: "Ro-Ahmedabad",
    year: 2026,
    month: 7,
    days: {
      1: "P", 2: "P", 3: "P", 4: "P", 5: "WO", 6: "P", 7: "P", 8: "P", 9: "P", 10: "P",
      11: "P", 12: "WO", 13: "P", 14: "P", 15: "P", 16: "H", 17: "P", 18: "P", 19: "WO", 20: "P",
      21: "P", 22: "P", 23: "P", 24: "P", 25: "P", 26: "WO", 27: "P", 28: "P", 29: "L", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-5-2026-7",
    engineerId: "eng-5",
    engineerName: "Mayank Shravak",
    location: "RHGH",
    year: 2026,
    month: 7,
    days: {
      1: "L", 2: "P", 3: "P", 4: "P", 5: "WO", 6: "P", 7: "P", 8: "P", 9: "P", 10: "P",
      11: "P", 12: "WO", 13: "P", 14: "P", 15: "P", 16: "H", 17: "P", 18: "P", 19: "WO", 20: "P",
      21: "P", 22: "P", 23: "P", 24: "P", 25: "P", 26: "WO", 27: "P", 28: "P", 29: "P", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-6-2026-7",
    engineerId: "eng-6",
    engineerName: "Pravin Prajapati",
    location: "Ro-Ahmedabad",
    year: 2026,
    month: 7,
    days: {
      1: "P", 2: "P", 3: "P", 4: "P", 5: "WO", 6: "P", 7: "P", 8: "P", 9: "P", 10: "P",
      11: "P", 12: "WO", 13: "P", 14: "P", 15: "P", 16: "H", 17: "L", 18: "L", 19: "WO", 20: "L",
      21: "P", 22: "P", 23: "P", 24: "L", 25: "P", 26: "WO", 27: "P", 28: "P", 29: "P", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-7-2026-7",
    engineerId: "eng-7",
    engineerName: "Prince Kumar",
    location: "Ro-Ahmedabad",
    year: 2026,
    month: 7,
    days: {
      1: "P", 2: "P", 3: "P", 4: "P", 5: "WO", 6: "P", 7: "P", 8: "P", 9: "P", 10: "P",
      11: "P", 12: "WO", 13: "P", 14: "P", 15: "P", 16: "H", 17: "P", 18: "P", 19: "WO", 20: "P",
      21: "P", 22: "P", 23: "P", 24: "P", 25: "P", 26: "WO", 27: "P", 28: "P", 29: "P", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-3-2026-7",
    engineerId: "eng-3",
    engineerName: "Chirag Panchal",
    location: "Ro-Ahmedabad",
    year: 2026,
    month: 7,
    days: {
      1: "P", 2: "P", 3: "P", 4: "P", 5: "WO", 6: "P", 7: "P", 8: "P", 9: "P", 10: "P",
      11: "P", 12: "WO", 13: "P", 14: "P", 15: "P", 16: "H", 17: "P", 18: "P", 19: "WO", 20: "P",
      21: "P", 22: "P", 23: "P", 24: "L", 25: "P", 26: "WO", 27: "P", 28: "P", 29: "P", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-8-2026-7",
    engineerId: "eng-8",
    engineerName: "Sudhir Kuvardiya",
    location: "ADMS Rajkot",
    year: 2026,
    month: 7,
    days: {
      1: "P", 2: "P", 3: "P", 4: "P", 5: "WO", 6: "P", 7: "P", 8: "P", 9: "P", 10: "P",
      11: "P", 12: "WO", 13: "P", 14: "P", 15: "P", 16: "P", 17: "P", 18: "P", 19: "WO", 20: "P",
      21: "P", 22: "P", 23: "P", 24: "P", 25: "P", 26: "WO", 27: "P", 28: "P", 29: "P", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-9-2026-7",
    engineerId: "eng-9",
    engineerName: "Parag",
    location: "Jamnagar Hospital",
    year: 2026,
    month: 7,
    days: {
      1: "P", 2: "P", 3: "P", 4: "P", 5: "WO", 6: "P", 7: "P", 8: "P", 9: "P", 10: "P",
      11: "P", 12: "WO", 13: "P", 14: "P", 15: "P", 16: "P", 17: "P", 18: "P", 19: "WO", 20: "P",
      21: "P", 22: "P", 23: "P", 24: "P", 25: "P", 26: "WO", 27: "P", 28: "P", 29: "P", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-10-2026-7",
    engineerId: "eng-10",
    engineerName: "Amit Acharya",
    location: "Bhavnagar Hospital",
    year: 2026,
    month: 7,
    days: {
      1: "P", 2: "P", 3: "P", 4: "P", 5: "WO", 6: "P", 7: "P", 8: "P", 9: "P", 10: "P",
      11: "P", 12: "WO", 13: "P", 14: "P", 15: "P", 16: "P", 17: "P", 18: "P", 19: "WO", 20: "P",
      21: "P", 22: "P", 23: "P", 24: "P", 25: "P", 26: "WO", 27: "P", 28: "P", 29: "P", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-11-2026-7",
    engineerId: "eng-11",
    engineerName: "Saifuddin Momin",
    location: "Kalol Hospital",
    year: 2026,
    month: 7,
    days: {
      1: "P", 2: "P", 3: "P", 4: "P", 5: "WO", 6: "P", 7: "P", 8: "P", 9: "P", 10: "P",
      11: "P", 12: "WO", 13: "P", 14: "P", 15: "P", 16: "P", 17: "P", 18: "P", 19: "WO", 20: "P",
      21: "P", 22: "P", 23: "P", 24: "P", 25: "P", 26: "WO", 27: "P", 28: "P", 29: "P", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-12-2026-7",
    engineerId: "eng-12",
    engineerName: "Mayur Ahir",
    location: "Surat",
    year: 2026,
    month: 7,
    days: {
      1: "P", 2: "P", 3: "P", 4: "P", 5: "WO", 6: "P", 7: "P", 8: "P", 9: "P", 10: "P",
      11: "P", 12: "WO", 13: "P", 14: "P", 15: "P", 16: "H", 17: "P", 18: "P", 19: "WO", 20: "P",
      21: "P", 22: "P", 23: "P", 24: "P", 25: "P", 26: "WO", 27: "P", 28: "P", 29: "P", 30: "P", 31: "P"
    }
  },
  {
    id: "att-eng-13-2026-7",
    engineerId: "eng-13",
    engineerName: "Jenil Kosambiya",
    location: "Surat",
    year: 2026,
    month: 7,
    days: {
      1: "P", 2: "P", 3: "P", 4: "P", 5: "WO", 6: "P", 7: "P", 8: "P", 9: "P", 10: "P",
      11: "P", 12: "WO", 13: "P", 14: "P", 15: "P", 16: "H", 17: "P", 18: "P", 19: "WO", 20: "P",
      21: "P", 22: "P", 23: "P", 24: "P", 25: "P", 26: "WO", 27: "P", 28: "P", 29: "P", 30: "P", 31: "P"
    }
  },

  // --- AUGUST 2026 ---
  {
    id: "att-eng-1-2026-8",
    engineerId: "eng-1",
    engineerName: "Mahebub Mir",
    location: "Ro-Ahmedabad",
    year: 2026,
    month: 8,
    days: {
      1: "P", 2: "WO", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "P", 9: "WO", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "H", 16: "WO", 17: "P", 18: "P", 19: "P", 23: "WO", 30: "WO"
    }
  },
  {
    id: "att-eng-2-2026-8",
    engineerId: "eng-2",
    engineerName: "Karan Parmar",
    location: "Ro-Ahmedabad",
    year: 2026,
    month: 8,
    days: {
      1: "P", 2: "WO", 3: "P", 4: "P", 5: "L", 6: "P", 7: "L", 8: "P", 9: "WO", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "H", 16: "WO", 17: "P", 18: "P", 19: "P", 23: "WO", 30: "WO"
    }
  },
  {
    id: "att-eng-4-2026-8",
    engineerId: "eng-4",
    engineerName: "Krushil Kapadiya",
    location: "Ro-Ahmedabad",
    year: 2026,
    month: 8,
    days: {
      1: "P", 2: "WO", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "P", 9: "WO", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "H", 16: "WO", 17: "P", 18: "P", 19: "P", 23: "WO", 30: "WO"
    }
  },
  {
    id: "att-eng-5-2026-8",
    engineerId: "eng-5",
    engineerName: "Mayank Shravak",
    location: "RHGH",
    year: 2026,
    month: 8,
    days: {
      1: "P", 2: "WO", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "P", 9: "WO", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "P", 16: "WO", 17: "P", 18: "P", 19: "P", 23: "WO", 30: "WO"
    }
  },
  {
    id: "att-eng-6-2026-8",
    engineerId: "eng-6",
    engineerName: "Pravin Prajapati",
    location: "Ro-Ahmedabad",
    year: 2026,
    month: 8,
    days: {
      1: "P", 2: "WO", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "P", 9: "WO", 10: "L",
      11: "L", 12: "P", 13: "P", 14: "P", 15: "H", 16: "WO", 17: "P", 18: "P", 19: "L", 23: "WO", 30: "WO"
    }
  },
  {
    id: "att-eng-7-2026-8",
    engineerId: "eng-7",
    engineerName: "Prince Kumar",
    location: "Ro-Ahmedabad",
    year: 2026,
    month: 8,
    days: {
      1: "P", 2: "WO", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "P", 9: "WO", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "H", 16: "WO", 17: "P", 18: "P", 19: "P", 23: "WO", 30: "WO"
    }
  },
  {
    id: "att-eng-3-2026-8",
    engineerId: "eng-3",
    engineerName: "Chirag Panchal",
    location: "Ro-Ahmedabad",
    year: 2026,
    month: 8,
    days: {
      1: "P", 2: "WO", 3: "P", 4: "P", 5: "P", 6: "L", 7: "P", 8: "P", 9: "WO", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "H", 16: "WO", 17: "P", 18: "P", 19: "P", 23: "WO", 30: "WO"
    }
  },
  {
    id: "att-eng-8-2026-8",
    engineerId: "eng-8",
    engineerName: "Sudhir Kuvardiya",
    location: "ADMS Rajkot",
    year: 2026,
    month: 8,
    days: {
      1: "P", 2: "WO", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "P", 9: "WO", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "H", 16: "WO", 17: "P", 18: "P", 19: "P", 23: "WO", 30: "WO"
    }
  },
  {
    id: "att-eng-9-2026-8",
    engineerId: "eng-9",
    engineerName: "Parag",
    location: "Jamnagar Hospital",
    year: 2026,
    month: 8,
    days: {
      1: "P", 2: "WO", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "P", 9: "WO", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "H", 16: "WO", 17: "P", 18: "P", 19: "P", 23: "WO", 30: "WO"
    }
  },
  {
    id: "att-eng-10-2026-8",
    engineerId: "eng-10",
    engineerName: "Amit Acharya",
    location: "Bhavnagar Hospital",
    year: 2026,
    month: 8,
    days: {
      1: "P", 2: "WO", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "P", 9: "WO", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "H", 16: "WO", 17: "P", 18: "P", 19: "P", 23: "WO", 30: "WO"
    }
  },
  {
    id: "att-eng-11-2026-8",
    engineerId: "eng-11",
    engineerName: "Saifuddin Momin",
    location: "Kalol Hospital",
    year: 2026,
    month: 8,
    days: {
      1: "P", 2: "WO", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "P", 9: "WO", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "P", 16: "WO", 17: "P", 18: "P", 19: "P", 23: "WO", 30: "WO"
    }
  },
  {
    id: "att-eng-12-2026-8",
    engineerId: "eng-12",
    engineerName: "Mayur Ahir",
    location: "Surat",
    year: 2026,
    month: 8,
    days: {
      1: "P", 2: "WO", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "P", 9: "WO", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "H", 16: "WO", 17: "P", 18: "P", 19: "P", 23: "WO", 30: "WO"
    }
  },
  {
    id: "att-eng-13-2026-8",
    engineerId: "eng-13",
    engineerName: "Jenil Kosambiya",
    location: "Surat",
    year: 2026,
    month: 8,
    days: {
      1: "P", 2: "WO", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "P", 9: "WO", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "H", 16: "WO", 17: "P", 18: "P", 19: "P", 23: "WO", 30: "WO"
    }
  }
];
