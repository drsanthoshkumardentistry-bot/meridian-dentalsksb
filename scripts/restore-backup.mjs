// Check a backup, or restore it into a SEPARATE Firebase project.
//   node scripts/restore-backup.mjs <backup.enc> <private-key.pem>                      -> open it, print counts per collection
//   FIREBASE_SERVICE_ACCOUNT='<json of the TEST project>' node scripts/restore-backup.mjs <backup.enc> <private-key.pem> --restore --yes
// Restoring writes every document into the project of the service account. Use a test project, not the live one,
// unless live data is really lost. The private key stays on your own computer.
import fs from "node:fs";
import { readServiceAccount } from "../api/_lib/blockCore.js";
import { decryptBackup, summarise, restoreDocs } from "./backupCore.js";

const [file, keyFile, ...flags] = process.argv.slice(2);
if (!file || !keyFile) { console.error("Usage: node scripts/restore-backup.mjs <backup.enc> <private-key.pem> [--restore --yes]"); process.exit(1); }
const out = decryptBackup(fs.readFileSync(file), fs.readFileSync(keyFile, "utf8"));
console.log(`Backup of project "${out.project}" taken ${out.takenAt}: ${out.count} documents.`);
console.log("By collection:", JSON.stringify(summarise(out.docs)));

if (flags.includes("--restore")) {
  const sa = readServiceAccount();
  if (!sa) { console.error("Set FIREBASE_SERVICE_ACCOUNT to the TEST project's key to restore."); process.exit(1); }
  if (!flags.includes("--yes")) { console.error(`This writes ${out.count} documents into project "${sa.project_id}". Add --yes to continue.`); process.exit(1); }
  const n = await restoreDocs({ sa, docs: out.docs });
  console.log(`Restored ${n} documents into "${sa.project_id}".`);
}
