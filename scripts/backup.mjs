// Usage (the weekly GitHub Action runs this):
//   FIREBASE_SERVICE_ACCOUNT='<json>' node scripts/backup.mjs [out-file]
// Reads backup-public.pem from the repo root. Writes one encrypted file. Never prints document contents.
import fs from "node:fs";
import { readServiceAccount } from "../api/_lib/blockCore.js";
import { crawl, encryptBackup, summarise } from "./backupCore.js";

const sa = readServiceAccount();
if (!sa) { console.error("FIREBASE_SERVICE_ACCOUNT is missing or not valid JSON."); process.exit(1); }
const pubPath = new URL("../backup-public.pem", import.meta.url);
if (!fs.existsSync(pubPath)) { console.error("backup-public.pem is missing."); process.exit(1); }
const publicKey = fs.readFileSync(pubPath, "utf8");

const docs = [];
const count = await crawl({ sa, onDoc: (d) => { docs.push(d); } });
const out = process.argv[2] || `backup-${new Date().toISOString().slice(0, 10)}.enc`;
fs.writeFileSync(out, encryptBackup(docs, publicKey, { project: sa.project_id, takenAt: new Date().toISOString() }));
console.log(`Backed up ${count} documents to ${out}`);
console.log("By collection:", JSON.stringify(summarise(docs)));
if (count === 0) { console.error("Backup is empty. Something is wrong."); process.exit(2); }
