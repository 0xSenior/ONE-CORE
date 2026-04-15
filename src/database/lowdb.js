import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the database directory exists at the root
const DB_DIR = path.join(__dirname, '../../database');
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initial Data Structures
const defaultStaffData = { users: [] };
const defaultTicketData = { tickets: [], adminRatings: [], nextTicketNumber: 1 };

// Correct path to the JSON files
const staffPath = path.join(DB_DIR, 'staff.json');
const ticketPath = path.join(DB_DIR, 'tickets.json');

// Initialize Databases
export const staffDb = await JSONFilePreset(staffPath, defaultStaffData);
export const ticketDb = await JSONFilePreset(ticketPath, defaultTicketData);

console.log('✅ Lowdb databases initialized (staff.json, tickets.json)');
