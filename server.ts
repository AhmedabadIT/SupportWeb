import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { DBService } from "./src/db-service";
import { normalizeModelString, extractSerialNumber } from "./src/utils/modelNormalization";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Initialize Gemini client if API key is provided
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } else {
    console.warn("WARNING: GEMINI_API_KEY is not defined. AI parsing features will be disabled.");
  }

  // --- API Routes ---

  // Parse WhatsApp message using Gemini
  app.post("/api/tickets/parse", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Missing or invalid WhatsApp message content" });
      }

      if (!ai) {
        return res.status(503).json({ error: "AI Parsing service is temporarily unavailable (missing API key)" });
      }

      const prompt = `Analyze the following WhatsApp message received by an IT Helpdesk. Extract or infer the following details:
1. Location (e.g. BO DARIYAPUR)
2. Username (e.g. Anaya devrakhakar)
3. Contact Number (e.g. 9869006584)
4. Brand / Make (e.g. BROTHER)
5. Model (e.g. Cisco 3750 (Poe-24), Cisco 3750 (Poe-48), Cisco 2960 (Poe-24), Brother DCP-B7535DW, Brother HL 2080 DW, Dell Optiplex 7470, Acer Veriton Z4660G). Rules:
- If message mentions "cisco 3750" with 48 or poe-48, set Model as "Cisco 3750 (Poe-48)", Brand as "Cisco", Product as "Switch", Category as "SWITCH".
- If message mentions "cisco 3750" with 24 or poe-24, set Model as "Cisco 3750 (Poe-24)", Brand as "Cisco", Product as "Switch", Category as "SWITCH".
- If message mentions "cisco 2960", set Model as "Cisco 2960 (Poe-24)", Brand as "Cisco", Product as "Switch", Category as "SWITCH".
- If message mentions "brother 7535", "7535", "dcp-b7535dw", "dcp 7535", or "b7535", set Model as "Brother DCP-B7535DW", Brand as "Brother", Product as "Printer", Category as "PRINTER".
- If message mentions "hl2080", "hl2080dw", "2080dw", "hl208080", "hl 2080", or Brother 2080, set Model as "Brother HL 2080 DW", Brand as "Brother", Product as "Printer", Category as "PRINTER".
- If message mentions "acer 7470", "acer z4660g", "acer veriton", "veriton 7470", "z4660g", set Model as "Acer Veriton Z4660G", Brand as "Acer", Product as "AIO", Category as "AIO".
- If message mentions "aio 7470", "dell 7470", "dell optiplex", "optiplex 7470", set Model as "Dell Optiplex 7470", Brand as "Dell", Product as "AIO", Category as "AIO".
6. Serial Number (e.g. E78341F1N313961)
7. Problem Description (e.g. PRINTER NOT WORKING)
8. Product type (Determine automatically. E.g., Brother HL 2080 DW -> "Printer", Acer Veriton -> "AIO", Dell OptiPlex -> "AIO", etc.)
9. Category of issue (e.g. "Printer", "Scanner", "AIO", "Peripheral", "Power", "Network", or "Other". Note: "Desktop" systems are categorized as "AIO".)

Important rules:
- Be highly flexible: ignore greetings, blank lines, signatures, emojis, or "Required tid" or "Required TID" strings.
- Normalize uppercase/lowercase to be clean.
- Apply hardware model normalizations strictly (Brother HL 2080 DW, Acer Veriton Z4660G, Dell Optiplex 7470).
- Problem descriptions should be brief but clear.
- If a field is not found in the message, return it as empty string "".

WhatsApp Message:
"""
${message}
"""`;

      const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest"];
      let response = null;
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            response = await ai.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    location: { type: Type.STRING },
                    username: { type: Type.STRING },
                    contact: { type: Type.STRING },
                    brand: { type: Type.STRING },
                    model: { type: Type.STRING },
                    serial_number: { type: Type.STRING },
                    problem: { type: Type.STRING },
                    product: { type: Type.STRING },
                    category: { type: Type.STRING }
                  },
                  required: ["location", "username", "contact", "brand", "model", "serial_number", "problem", "product", "category"]
                }
              }
            });
            if (response && response.text) {
              break;
            }
          } catch (err: any) {
            lastError = err;
            console.warn(`Attempt ${attempt + 1} with model ${modelName} failed:`, err.message || err);
            // Wait 500ms before retrying same model
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
        if (response && response.text) {
          break;
        }
      }

      if (!response || !response.text) {
        throw lastError || new Error("Failed to get response from Gemini AI models");
      }

      const extractedText = response.text;
      if (!extractedText) {
        throw new Error("Empty response from AI parser");
      }

      const parsedJSON = JSON.parse(extractedText.trim());

      // Server-side normalization fallback for Brother, Acer, Dell hardware variations
      const normalizedHw = normalizeModelString(
        parsedJSON.model,
        parsedJSON.product,
        parsedJSON.brand,
        message
      );

      if (normalizedHw.model) {
        parsedJSON.model = normalizedHw.model;
      }
      if (normalizedHw.brand) {
        parsedJSON.brand = normalizedHw.brand;
      }
      if (normalizedHw.product) {
        parsedJSON.product = normalizedHw.product;
      }
      if (normalizedHw.category) {
        parsedJSON.category = normalizedHw.category;
      }

      // Robust fallback for serial number extraction if AI missed it
      if (!parsedJSON.serial_number || !parsedJSON.serial_number.trim()) {
        parsedJSON.serial_number = extractSerialNumber(message);
      }

      // Clean phone number formatting (e.g. +91 8849973731 -> 8849973731)
      if (parsedJSON.contact) {
        let cleanPhone = String(parsedJSON.contact).replace(/[\s-]/g, '');
        if (cleanPhone.startsWith('+91') && cleanPhone.length === 13) {
          cleanPhone = cleanPhone.slice(3);
        } else if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
          cleanPhone = cleanPhone.slice(2);
        }
        parsedJSON.contact = cleanPhone;
      }

      res.json(parsedJSON);

    } catch (error: any) {
      console.error("AI Parser Error:", error);
      res.status(500).json({ error: error.message || "Failed to parse WhatsApp message" });
    }
  });

  // Get next TID
  app.get("/api/tickets/next-tid", (req, res) => {
    try {
      const { date, systemMode } = req.query;
      const nextTid = DBService.generateNextTID(date as string, systemMode as string);
      res.json({ nextTid });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Tickets CRUD
  app.get("/api/tickets", (req, res) => {
    try {
      const tickets = DBService.getTickets();
      res.json(tickets);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/tickets", (req, res) => {
    try {
      const ticket = DBService.createTicket(req.body);
      res.status(201).json(ticket);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/tickets/bulk", (req, res) => {
    try {
      const { tickets } = req.body;
      if (!Array.isArray(tickets)) {
        return res.status(400).json({ error: "Tickets list must be an array" });
      }
      const createdTickets = DBService.bulkCreateTickets(tickets);
      res.status(201).json({ success: true, count: createdTickets.length, tickets: createdTickets });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/tickets/:id", (req, res) => {
    try {
      const { id } = req.params;
      const updated = DBService.updateTicket(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/tickets", (req, res) => {
    try {
      DBService.deleteAllTickets();
      res.json({ success: true, message: "All ticket logs deleted successfully" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/tickets/:id", (req, res) => {
    try {
      const { id } = req.params;
      const success = DBService.deleteTicket(id);
      if (!success) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Engineers CRUD
  app.get("/api/engineers", (req, res) => {
    try {
      const engineers = DBService.getEngineers();
      res.json(engineers);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Engineer Auth: Login & Signup
  app.post("/api/engineers/login", (req, res) => {
    try {
      const { identifier, password } = req.body;
      const result = DBService.verifyEngineerLogin(identifier, password);
      if (!result.success) {
        return res.status(401).json({ error: result.message });
      }
      res.json({ success: true, engineer: result.engineer });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/engineers/signup", (req, res) => {
    try {
      const result = DBService.signupEngineer(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }
      res.status(201).json({ success: true, engineer: result.engineer, message: result.message });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Location Visits & Distance Logs
  app.get("/api/location-visits", (req, res) => {
    try {
      const engineerId = req.query.engineerId as string | undefined;
      const visits = DBService.getLocationVisits(engineerId);
      res.json(visits);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/location-visits", (req, res) => {
    try {
      const { engineerId, engineerName, startLocationName, destinationLocationName } = req.body;
      if (!engineerId || !engineerName || !startLocationName || !destinationLocationName) {
        return res.status(400).json({ error: "Missing required location visit fields (engineer, start location, destination location)" });
      }
      const newVisit = DBService.createLocationVisit(req.body);
      res.status(201).json(newVisit);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/location-visits/:id", (req, res) => {
    try {
      const { id } = req.params;
      const updated = DBService.updateLocationVisit(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Location visit record not found" });
      }
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/location-visits", (req, res) => {
    try {
      DBService.clearAllLocationVisits();
      res.json({ success: true, message: "All live tracking logs reset/cleared successfully" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/location-visits/:id", (req, res) => {
    try {
      const { id } = req.params;
      const success = DBService.deleteLocationVisit(id);
      if (!success) {
        return res.status(404).json({ error: "Location visit record not found" });
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/engineers", (req, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Engineer name is required" });
      }
      const newEng = DBService.createEngineer(req.body);
      res.status(201).json(newEng);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/engineers/:id", (req, res) => {
    try {
      const { id } = req.params;
      const updated = DBService.updateEngineer(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Engineer not found" });
      }
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/engineers/:id", (req, res) => {
    try {
      const { id } = req.params;
      const success = DBService.deleteEngineer(id);
      if (!success) {
        return res.status(404).json({ error: "Engineer not found" });
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Attendance ---
  app.get("/api/attendance", (req, res) => {
    try {
      const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();
      const month = parseInt(req.query.month as string, 10) || (new Date().getMonth() + 1);
      const attendance = DBService.getAttendance(year, month);
      res.json(attendance);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/attendance", (req, res) => {
    try {
      const { records } = req.body;
      if (!Array.isArray(records)) {
        return res.status(400).json({ error: "Records must be an array of attendance records" });
      }
      DBService.saveAttendance(records);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/attendance/backups", (req, res) => {
    try {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        return res.json({ files: [] });
      }
      const files = fs.readdirSync(dataDir);
      const backupFiles = files.filter(f => 
        f.startsWith("attendance_") && f !== "attendance.json" && (f.endsWith(".xlsx") || f.endsWith(".json"))
      );
      
      const fileInfos = backupFiles.map(filename => {
        const filepath = path.join(dataDir, filename);
        const stats = fs.statSync(filepath);
        
        let type: 'monthly' | 'quarterly' = 'monthly';
        let format: 'excel' | 'json' = 'json';
        
        if (filename.includes("_Q")) {
          type = 'quarterly';
        }
        if (filename.endsWith(".xlsx")) {
          format = 'excel';
        }
        
        return {
          filename,
          size: stats.size,
          updatedAt: stats.mtime.toISOString(),
          type,
          format
        };
      });
      
      fileInfos.sort((a, b) => b.filename.localeCompare(a.filename));
      res.json({ files: fileInfos });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/attendance/download", (req, res) => {
    try {
      const filename = req.query.file as string;
      if (!filename || typeof filename !== 'string') {
        return res.status(400).json({ error: "Missing filename parameter" });
      }
      
      const cleanName = path.basename(filename);
      if (cleanName !== filename || !filename.startsWith("attendance_") || filename === "attendance.json") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const filepath = path.join(process.cwd(), 'data', cleanName);
      if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: "File not found" });
      }
      
      res.download(filepath, cleanName);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Database System Backups and Storage ---
  app.get("/api/db/files", (req, res) => {
    try {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        return res.json({ files: [] });
      }
      const files = fs.readdirSync(dataDir);
      
      const allowedMainFiles = [
        'tickets.json',
        'tickets.xlsx',
        'engineers.json',
        'attendance.json',
        'attendance.xlsx'
      ];

      const filtered = files.filter(f => {
        return allowedMainFiles.includes(f) || (f.startsWith('attendance_') && (f.endsWith('.json') || f.endsWith('.xlsx')));
      });

      const fileInfos = filtered.map(filename => {
        const filepath = path.join(dataDir, filename);
        const stats = fs.statSync(filepath);
        
        let label = filename;
        let category: 'Tickets' | 'Engineers' | 'Attendance' = 'Attendance';

        if (filename.startsWith('tickets')) {
          category = 'Tickets';
          label = filename === 'tickets.json' ? 'Tickets JSON Database' : 'Tickets Excel Backup';
        } else if (filename.startsWith('engineers')) {
          category = 'Engineers';
          label = 'Engineers JSON List';
        } else if (filename === 'attendance.json') {
          category = 'Attendance';
          label = 'Global Attendance JSON';
        } else if (filename === 'attendance.xlsx') {
          category = 'Attendance';
          label = 'Global Attendance Excel';
        } else {
          category = 'Attendance';
          // Label monthly/quarterly sheets cleanly
          const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
          const parts = nameWithoutExt.split('_');
          const isExcel = filename.endsWith('.xlsx');
          const extLabel = isExcel ? 'Excel' : 'JSON';
          
          if (parts.length >= 3) {
            const year = parts[1];
            const detail = parts[2];
            if (detail.startsWith('Q')) {
              label = `${year} ${detail} Quarterly Attendance (${extLabel})`;
            } else {
              const months = [
                "January", "February", "March", "April", "May", "June", 
                "July", "August", "September", "October", "November", "December"
              ];
              const monthIdx = parseInt(detail, 10) - 1;
              const monthName = months[monthIdx] || `Month ${detail}`;
              label = `${monthName} ${year} Monthly Attendance (${extLabel})`;
            }
          } else {
            label = `${filename} (${extLabel})`;
          }
        }

        return {
          filename,
          label,
          category,
          size: stats.size,
          updatedAt: stats.mtime.toISOString(),
          isExcel: filename.endsWith('.xlsx')
        };
      });

      // Sort: Main files first, then rest chronologically descending
      const fileOrder = [
        'tickets.xlsx', 'tickets.json',
        'attendance.xlsx', 'attendance.json',
        'engineers.json'
      ];

      fileInfos.sort((a, b) => {
        const idxA = fileOrder.indexOf(a.filename);
        const idxB = fileOrder.indexOf(b.filename);
        
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        
        return b.filename.localeCompare(a.filename);
      });

      res.json({ files: fileInfos });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/db/download", (req, res) => {
    try {
      const filename = req.query.file as string;
      if (!filename || typeof filename !== 'string') {
        return res.status(400).json({ error: "Missing filename parameter" });
      }
      
      const cleanName = path.basename(filename);
      if (cleanName !== filename) {
        return res.status(403).json({ error: "Access denied" });
      }

      const allowedMainFiles = [
        'tickets.json',
        'tickets.xlsx',
        'engineers.json',
        'attendance.json',
        'attendance.xlsx'
      ];

      const isAllowed = allowedMainFiles.includes(cleanName) || 
                        (cleanName.startsWith('attendance_') && (cleanName.endsWith('.json') || cleanName.endsWith('.xlsx')));

      if (!isAllowed) {
        return res.status(403).json({ error: "Access to this file is not allowed" });
      }
      
      const filepath = path.join(process.cwd(), 'data', cleanName);
      if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: "File not found" });
      }
      
      res.download(filepath, cleanName);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Serve Engineer Images Statically ---
  app.get('/data/logo.svg', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'data', 'logo.svg'));
  });
  app.use('/data/image', express.static(path.join(process.cwd(), 'data', 'image')));

  // --- Serve Frontend ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
