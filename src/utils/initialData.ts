import { Engineer, Ticket, LocationVisit, AttendanceRecord } from '../types';

export const INITIAL_ENGINEERS: Engineer[] = [
  {
    id: "eng-1",
    emp_code: "GURM045",
    name: "Mahebub Mir",
    name_as_per_bank: "Mahebub Dinmohmad Mir",
    designation: "IT SUPPORT",
    mobile: "9898531231",
    email: "mahbub.muskan@gmail.com",
    password: "Mahebub@9898",
    active: true,
    location: "Ro-Ahmedabad",
    joining_date: "05-01-2024",
    address: "14, Mahebub Society, Sarkhej Juhapura Road, Ahmedabad - 55",
    work_profile: "Team Led Cum System Engineer",
    education: "Graduate",
    computer_certificate: "PGDCA, A+N+",
    experience: "18 Years",
    photo: "data/image/Mahebub Mir.jpg"
  },
  {
    id: "eng-2",
    emp_code: "GURM038",
    name: "Karan Parmar",
    name_as_per_bank: "Karankumar Amitbhai Parmar",
    designation: "DESKTOP ENGINEER",
    mobile: "9737284797",
    email: "Karanparmar1508@gmail.com",
    password: "Karan@9737",
    active: true,
    location: "Ro-Ahmedabad",
    joining_date: "03-01-2024",
    address: "364, Vankar Vas, Camp Sadarbazar, Shahibaug, Ahmedabad",
    work_profile: "System Support Engineer",
    education: "12th",
    computer_certificate: "Hardware & Networking (IANT)",
    experience: "6.5 Years",
    photo: "data/image/Karan Parmar.jpeg"
  },
  {
    id: "eng-15",
    emp_code: "GURM039",
    name: "Kaushik Vaghela",
    name_as_per_bank: "Kaushik Nareshbhai Vaghela",
    designation: "DESKTOP ENGINEER",
    mobile: "7435999492",
    email: "kaushikyaghela@gmail.com",
    password: "Kaushik@7435",
    active: false,
    resigned: true,
    resignation_date: "March 2026",
    location: "Ro-Ahmedabad",
    joining_date: "03-01-2024",
    address: "26/664, Dr. Ambedkar Colony, Ambawadi, Ahmedabad",
    work_profile: "System Support Engineer",
    education: "Msc IT",
    computer_certificate: "MSC IT",
    experience: "4 year"
  },
  {
    id: "eng-4",
    emp_code: "GURM054",
    name: "Krushil Kapadiya",
    name_as_per_bank: "Krushil Kanubhai Kapadiya",
    designation: "DESKTOP ENGINEER",
    mobile: "8401456649",
    email: "krushilkapadiya@gmail.com",
    password: "Krushil@8401",
    active: true,
    location: "Ro-Ahmedabad",
    joining_date: "22/08/2024",
    address: "49, Vinay Vihar Soc., Bhulabhai Park, Ahmedabad",
    work_profile: "System Support Engineer",
    education: "Graduate",
    computer_certificate: "A+ Hardware",
    experience: "7 Years",
    photo: "data/image/Krushil Kapadiya.jpeg"
  },
  {
    id: "eng-5",
    emp_code: "#16",
    name: "Mayank Shravak",
    name_as_per_bank: "Mayank Chandrakant Shravak",
    designation: "DESKTOP ENGINEER",
    mobile: "9974053682",
    email: "shravakmayank411@gmail.com",
    password: "Mayank@9974",
    active: true,
    location: "Gomtipur",
    joining_date: "12-02-2024",
    address: "1755/8, Pithavali Chali, Rajpur Gomtipur, Ahmedabad",
    work_profile: "System Support Engineer",
    education: "Graduate",
    computer_certificate: "Hardware & Networking",
    experience: "1.5 Years",
    photo: "data/image/Mayank Shravak.jpeg"
  },
  {
    id: "eng-6",
    emp_code: "",
    name: "Pravin Prajapati",
    name_as_per_bank: "Pravin Prajapati",
    designation: "DESKTOP ENGINEER",
    mobile: "7984434364",
    email: "prajapatipravin4321@gmail.com",
    password: "Pravin@7984",
    active: true,
    location: "Ro-Ahmedabad",
    joining_date: "12-10-2025",
    address: "19, Devnandan Park Society, Isanpur, Ahmedabad",
    work_profile: "System Support Engineer",
    education: "12th",
    computer_certificate: "A+N+",
    experience: "5 Years",
    photo: "data/image/Pravin Prajapati.jpeg"
  },
  {
    id: "eng-14",
    emp_code: "#22",
    name: "Harshil Prajapati",
    name_as_per_bank: "Harshilkumar Nitinkumar Prajapati",
    designation: "DESKTOP ENGINEER",
    mobile: "8140350994",
    email: "harshilprajapati@gmail.com",
    password: "Harshil@8140",
    active: false,
    resigned: true,
    resignation_date: "June 2026",
    location: "Ro-Ahmedabad",
    joining_date: "06-01-2025",
    address: "Gujarat Housing Board, Meghaninagar, Asarwa, Ahmedabad",
    work_profile: "System Support Engineer",
    education: "Post Graduate",
    computer_certificate: "Hardware & Networking, CCNA",
    experience: "2 year"
  },
  {
    id: "eng-7",
    emp_code: "",
    name: "Prince Kumar",
    name_as_per_bank: "Prince Gautam",
    designation: "DESKTOP ENGINEER",
    mobile: "9128770114",
    email: "priance.gautam@gmail.com",
    password: "Prince@9128",
    active: true,
    location: "Ro-Ahmedabad",
    joining_date: "02-11-2026",
    address: "Trimurti Apartment, Memnagar, Ahmedabad",
    work_profile: "System Support Engineer",
    education: "Graduate",
    computer_certificate: "B.Sc. IT, N+",
    experience: "Fresher",
    photo: "data/image/Prince Kumar.jpeg"
  },
  {
    id: "eng-8",
    emp_code: "#26",
    name: "Sudhir Kuvardiya",
    name_as_per_bank: "SUDHIR ASHOKBHAI KUVARDIYA",
    designation: "DESKTOP ENGINEER",
    mobile: "9727332188",
    email: "itengineer.sudhir@gmail.com",
    password: "Sudhir@9727",
    active: true,
    location: "ADMS Rajkot",
    joining_date: "02-01-2024",
    address: "107, Punitnagar Street no 6, Gondal Chowkdi, Rajkot",
    work_profile: "System Support Engineer",
    education: "Diploma",
    computer_certificate: "Hardware & Networking (CCNA)",
    experience: "10 Years",
    photo: "data/image/Sudhir Kuvardiya.jpeg"
  },
  {
    id: "eng-9",
    emp_code: "GURM029",
    name: "Parag",
    name_as_per_bank: "Parag sureshbhai kanakhara",
    designation: "DESKTOP ENGINEER",
    mobile: "9998889468",
    email: "Parag7780@gmail.com",
    password: "Parag@9998",
    active: true,
    location: "Jamnagar Hospital",
    joining_date: "02-01-2024",
    address: "Chandra Prabhu Appartment, Pavan Chakki, New Jail Road, Dangarvada, Jamnagar",
    work_profile: "System Support Engineer",
    education: "12th",
    computer_certificate: "Hardware & Networking",
    experience: "11 Years",
    photo: "data/image/Parag.jpeg"
  },
  {
    id: "eng-10",
    emp_code: "GURM030",
    name: "Amit Acharya",
    name_as_per_bank: "AMITSNAI NARENDRAKUMAR ACHASYA",
    designation: "DESKTOP ENGINEER",
    mobile: "9327624707",
    email: "ameetacharya11@gmail.com",
    password: "Amit@9327",
    active: true,
    location: "Bhavnagar Hospital",
    joining_date: "02-01-2024",
    address: "1403/A-2, Near Rajaram No Avedo, Ghodha Road, Bhavnagar",
    work_profile: "System Support Engineer",
    education: "Diploma",
    computer_certificate: "Hardware & Networking",
    experience: "4.5 Years",
    photo: "data/image/Amit Acharya.jpeg"
  },
  {
    id: "eng-11",
    emp_code: "GURM031",
    name: "Saifuddin Momin",
    name_as_per_bank: "Momin Sefudin",
    designation: "DESKTOP ENGINEER",
    mobile: "9313224211",
    email: "safmominsafmomin@gmail.com",
    password: "Saifuddin@9313",
    active: true,
    location: "Kalol Hospital",
    joining_date: "10-01-2024",
    address: "Mominvas, Serisa, Gandhinagar",
    work_profile: "System Support Engineer",
    education: "Graduate",
    computer_certificate: "Hardware & Networking",
    experience: "3.2 Years",
    photo: "data/image/Saifuddin Momin.jpeg"
  },
  {
    id: "eng-12",
    emp_code: "GURM027",
    name: "Mayur Ahir",
    name_as_per_bank: "Mayur Rajesh Ahire",
    designation: "DESKTOP ENGINEER",
    mobile: "8734000056",
    email: "Mayurahire525@gmail.com",
    password: "Mayur@8734",
    active: true,
    location: "SRO Surat",
    joining_date: "02-01-2024",
    address: "49 Radhe Homes, Orma, Masamagam, Orma, Po:orma, Dist:Surat Gujarat-394540",
    work_profile: "System Support Engineer",
    education: "12th",
    computer_certificate: "advance diploma engineering in cyber security standard",
    experience: "5 year"
  },
  {
    id: "eng-13",
    emp_code: "#18",
    name: "Jenil Kosambiya",
    name_as_per_bank: "JENIL ARVINDBHAI KOSAMBIYA",
    designation: "DESKTOP ENGINEER",
    mobile: "9429913500",
    email: "jenilkosambiya9998@gmail.com",
    password: "Jenil@9429",
    active: true,
    location: "SRO Surat",
    joining_date: "05-01-2025",
    address: "545, Mahyavansi street near gujarat gas company, Adajan gam, surat, 395005.",
    work_profile: "System Support Engineer",
    education: "Graduate",
    computer_certificate: "Ccc tally with gst, Cloud computing standard",
    experience: "1.2 year"
  },
  {
    id: "eng-3",
    emp_code: "GURM040",
    name: "Chirag Panchal",
    name_as_per_bank: "Chirag Panchal",
    designation: "DESKTOP ENGINEER",
    mobile: "8460004275",
    email: "Chiragpanchal0831@gmail.com",
    password: "Chirag@8460",
    active: true,
    location: "Ro-Ahmedabad",
    joining_date: "01-02-2025",
    address: "2113 kailash niwas, azad chock, fadeli, dhanushdhari society, ahmedabad",
    work_profile: "System Support Engineer",
    education: "Graduate",
    computer_certificate: "BCA (Running)",
    experience: "Fresher",
    photo: "data/image/Chirag Panchal.jpeg"
  }
];

export const INITIAL_TICKETS: Ticket[] = [];

export const INITIAL_VISITS: LocationVisit[] = [];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  // --- FEBRUARY 2026 ---
  {
    id: "att-eng-1-2026-2",
    engineerId: "eng-1",
    engineerName: "Mahebub Mir",
    empCode: "GURM045",
    nameAsPerBank: "Mahebub Dinmohmad Mir",
    designation: "IT SUPPORT",
    location: "Ro-Ahmedabad",
    joiningDate: "05-01-2024",
    year: 2026,
    month: 2,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P"
    }
  },
  {
    id: "att-eng-2-2026-2",
    engineerId: "eng-2",
    engineerName: "Karan Parmar",
    empCode: "GURM038",
    nameAsPerBank: "Karankumar Amitbhai Parmar",
    designation: "DESKTOP ENGINEER",
    location: "Ro-Ahmedabad",
    joiningDate: "03-01-2024",
    year: 2026,
    month: 2,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "L", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P"
    }
  },
  {
    id: "att-eng-15-2026-2",
    engineerId: "eng-15",
    engineerName: "Kaushik Vaghela",
    empCode: "GURM039",
    nameAsPerBank: "Kaushik Nareshbhai Vaghela",
    designation: "DESKTOP ENGINEER",
    location: "Ro-Ahmedabad",
    joiningDate: "03-01-2024",
    year: 2026,
    month: 2,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "L", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P"
    }
  },
  {
    id: "att-eng-4-2026-2",
    engineerId: "eng-4",
    engineerName: "Krushil Kapadiya",
    empCode: "GURM054",
    nameAsPerBank: "Krushil Kanubhai Kapadiya",
    designation: "DESKTOP ENGINEER",
    location: "Ro-Ahmedabad",
    joiningDate: "22/08/2024",
    year: 2026,
    month: 2,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "L",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "L",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P"
    }
  },
  {
    id: "att-eng-5-2026-2",
    engineerId: "eng-5",
    engineerName: "Mayank Shravak",
    empCode: "#16",
    nameAsPerBank: "Mayank Chandrakant Shravak",
    designation: "DESKTOP ENGINEER",
    location: "Gomtipur",
    joiningDate: "12-02-2024",
    year: 2026,
    month: 2,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P"
    }
  },
  {
    id: "att-eng-6-2026-2",
    engineerId: "eng-6",
    engineerName: "Pravin Prajapati",
    empCode: "",
    nameAsPerBank: "Pravin Prajapati",
    designation: "DESKTOP ENGINEER",
    location: "Ro-Ahmedabad",
    joiningDate: "12-10-2025",
    year: 2026,
    month: 2,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P"
    }
  },
  {
    id: "att-eng-14-2026-2",
    engineerId: "eng-14",
    engineerName: "Harshil Prajapati",
    empCode: "#22",
    nameAsPerBank: "Harshilkumar Nitinkumar Prajapati",
    designation: "DESKTOP ENGINEER",
    location: "Ro-Ahmedabad",
    joiningDate: "06-01-2025",
    year: 2026,
    month: 2,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "L", 15: "WO", 16: "L", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P"
    }
  },
  {
    id: "att-eng-7-2026-2",
    engineerId: "eng-7",
    engineerName: "Prince Kumar",
    empCode: "",
    nameAsPerBank: "Prince Gautam",
    designation: "DESKTOP ENGINEER",
    location: "Ro-Ahmedabad",
    joiningDate: "02-11-2026",
    year: 2026,
    month: 2,
    days: {
      1: "WO", 8: "WO", 11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P"
    }
  },
  {
    id: "att-eng-8-2026-2",
    engineerId: "eng-8",
    engineerName: "Sudhir Kuvardiya",
    empCode: "#26",
    nameAsPerBank: "SUDHIR ASHOKBHAI KUVARDIYA",
    designation: "DESKTOP ENGINEER",
    location: "ADMS Rajkot",
    joiningDate: "02-01-2024",
    year: 2026,
    month: 2,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "L", 28: "P"
    }
  },
  {
    id: "att-eng-9-2026-2",
    engineerId: "eng-9",
    engineerName: "Parag",
    empCode: "GURM029",
    nameAsPerBank: "Parag sureshbhai kanakhara",
    designation: "DESKTOP ENGINEER",
    location: "Jamnagar Hospital",
    joiningDate: "02-01-2024",
    year: 2026,
    month: 2,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P"
    }
  },
  {
    id: "att-eng-10-2026-2",
    engineerId: "eng-10",
    engineerName: "Amit Acharya",
    empCode: "GURM030",
    nameAsPerBank: "AMITSNAI NARENDRAKUMAR ACHASYA",
    designation: "DESKTOP ENGINEER",
    location: "Bhavnagar Hospital",
    joiningDate: "02-01-2024",
    year: 2026,
    month: 2,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P"
    }
  },
  {
    id: "att-eng-11-2026-2",
    engineerId: "eng-11",
    engineerName: "Saifuddin Momin",
    empCode: "GURM031",
    nameAsPerBank: "Momin Sefudin",
    designation: "DESKTOP ENGINEER",
    location: "Kalol Hospital",
    joiningDate: "10-01-2024",
    year: 2026,
    month: 2,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P"
    }
  },
  {
    id: "att-eng-12-2026-2",
    engineerId: "eng-12",
    engineerName: "Mayur Ahir",
    empCode: "GURM027",
    nameAsPerBank: "Mayur Rajesh Ahire",
    designation: "DESKTOP ENGINEER",
    location: "SRO Surat",
    joiningDate: "02-01-2024",
    year: 2026,
    month: 2,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P"
    }
  },
  {
    id: "att-eng-13-2026-2",
    engineerId: "eng-13",
    engineerName: "Jenil Kosambiya",
    empCode: "#18",
    nameAsPerBank: "JENIL ARVINDBHAI KOSAMBIYA",
    designation: "DESKTOP ENGINEER",
    location: "SRO Surat",
    joiningDate: "05-01-2025",
    year: 2026,
    month: 2,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P"
    }
  },
  {
    id: "att-eng-3-2026-2",
    engineerId: "eng-3",
    engineerName: "Chirag Panchal",
    empCode: "GURM040",
    nameAsPerBank: "Chirag Panchal",
    designation: "DESKTOP ENGINEER",
    location: "Ro-Ahmedabad",
    joiningDate: "01-02-2025",
    year: 2026,
    month: 2,
    days: {
      1: "WO", 2: "P", 3: "P", 4: "P", 5: "P", 6: "P", 7: "P", 8: "WO", 9: "P", 10: "P",
      11: "P", 12: "P", 13: "P", 14: "P", 15: "WO", 16: "P", 17: "P", 18: "P", 19: "P", 20: "P",
      21: "P", 22: "WO", 23: "P", 24: "P", 25: "P", 26: "P", 27: "P", 28: "P"
    }
  },

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
