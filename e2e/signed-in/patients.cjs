const { chromium } = require("playwright");
const URL = "http://localhost:5199/";
const res = []; const log = (ok, m) => { res.push(ok); console.log((ok ? "PASS " : "FAIL ") + m); };
const KEY = "merident_u-test_patients";
const mk = async (b, w = 1280, h = 800, ctx0) => {
  const ctx = ctx0 || await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); p.errs = [];
  p.on("pageerror", e => p.errs.push("PAGEERROR " + String(e).slice(0, 200)));
  p.on("console", m => { if (m.type() === "error" && !/ERR_TUNNEL|ERR_NAME|Failed to load resource/.test(m.text())) p.errs.push("console: " + m.text().slice(0, 200)); });
  p.on("dialog", d => d.accept());
  return [ctx, p];
};
const open = async (p, screen = "Patients & Odontogram") => { await p.goto(URL, { waitUntil: "load" }); await p.waitForTimeout(2200); await p.locator("nav button", { hasText: screen }).first().click(); await p.waitForTimeout(500); };
const count = (p) => p.evaluate((k) => JSON.parse(localStorage.getItem(k) || "[]").length, KEY);
const field = (p, label) => p.locator(`form label:has-text("${label}")`).first().locator("xpath=following-sibling::*[self::input or self::select][1]");
let PH = 9000000000;
async function addPatient(p, o = {}) {
  await p.getByText("Add Patient", { exact: false }).first().click(); await p.waitForSelector("text=Add New Patient");
  const f = async (l, v) => { const el = field(p, l); if (v == null) return; const tag = await el.evaluate(e => e.tagName); if (tag === "SELECT") await el.selectOption({ label: v }).catch(async () => el.selectOption(v)); else await el.fill(v); };
  await f("Full Name", o.name ?? "Asha Devi"); await f("Age", o.age ?? "34"); await f("Gender", o.gender ?? "Female"); await f("WhatsApp Phone", o.phone ?? String(++PH));
  if (o.consent !== false) await p.getByLabel(/agrees to dental examination/i).check();
  const submit = p.locator("form button[type=submit]").first();
  if (o.dbl) await submit.dblclick(); else await submit.click();
  await p.waitForTimeout(800);
  // Registering opens the new patient's casesheet over the page; close it so the next step can click through.
  const sheet = p.getByRole("button", { name: /^Close/i }).first();
  for (let i = 0; i < 3 && (await p.locator(".fixed.inset-0.z-50").count()) > 0; i++) { await p.keyboard.press("Escape"); await p.waitForTimeout(250); }
  if ((await p.locator(".fixed.inset-0.z-50").count()) > 0 && (await sheet.count()) > 0) await sheet.click().catch(() => {});
}
(async () => {
  const b = await chromium.launch();
  // B1 normal add, count 1, persists after reload
  let [ctx, p] = await mk(b); await open(p); await addPatient(p);
  log(await count(p) === 1, "add patient: saved once");
  await p.reload(); await p.waitForTimeout(2000);
  log(await count(p) === 1, "add patient: still there after refresh");
  // B2 double-click submit
  await ctx.clearCookies(); await p.evaluate(() => localStorage.clear()); await open(p); await addPatient(p, { name: "Double Click", dbl: true });
  const n2 = await count(p); log(n2 === 1, `double-click submit creates exactly 1 patient (got ${n2})`);
  // B3 missing consent / bad phone refused
  await p.evaluate(() => localStorage.clear()); await open(p); await addPatient(p, { name: "No Consent", consent: false });
  log(await count(p) === 0, "no consent: patient not saved");
  await p.keyboard.press("Escape"); await open(p); await addPatient(p, { name: "Bad Phone", phone: "12345" });
  log(await count(p) === 0, "bad phone: patient not saved");
  // B4 hostile / odd names all save and show as text
  await p.evaluate(() => localStorage.clear());
  const names = ["<img src=x onerror=window.__xss=1>", "சந்தோஷ் குமார்", "👩‍⚕️ Emoji", "A".repeat(500), "O'Brien \"Q\" & <b>bold</b>"];
  for (const nm of names) { await open(p); await addPatient(p, { name: nm }); }
  const saved = await count(p);
  log(saved === names.length, `hostile/odd names: ${saved}/${names.length} saved`);
  await open(p); await p.waitForTimeout(500);
  log(!(await p.evaluate(() => window.__xss)), "hostile name did not run code");
  log(!/something went wrong/i.test(await p.innerText("body")), "patients list renders with hostile names");
  log(p.errs.length === 0, "no script errors during patient tests" + (p.errs[0] ? " -> " + p.errs[0] : ""));
  // C two tabs same browser: tab2 sees data after reload; both add -> no loss on reload
  await p.evaluate(() => localStorage.clear()); await open(p); await addPatient(p, { name: "Tab One" });
  const p2 = await ctx.newPage(); p2.errs = []; p2.on("pageerror", e => p2.errs.push(String(e))); p2.on("dialog", d => d.accept()); await open(p2); await addPatient(p2, { name: "Tab Two" });
  await p.reload(); await p.waitForTimeout(1500);
  const names2 = await p.evaluate((k) => JSON.parse(localStorage.getItem(k) || "[]").map(x => x.name), KEY);
  log(names2.includes("Tab One") && names2.includes("Tab Two"), `two tabs both adding: ${JSON.stringify(names2)} ${names2.length === 2 ? "" : "(one overwrote the other!)"}`);
  // D offline add then online
  await ctx.setOffline(true); await p2.bringToFront(); await addPatient(p2, { name: "Offline Add" }).catch(() => {}); await ctx.setOffline(false);
  const off = await p2.evaluate((k) => JSON.parse(localStorage.getItem(k) || "[]").map(x => x.name), KEY);
  log(off.includes("Offline Add"), "added a patient while offline: saved on the device");
  // E rapid navigation stress
  const labels = ["Dashboard","Appointments Diary","Patients & Odontogram","Billing & Invoices","Reports","Settings"];
  for (let i = 0; i < 60; i++) await p2.locator("nav button", { hasText: labels[i % labels.length] }).first().click({ timeout: 2000 }).catch(() => {});
  await p2.waitForTimeout(800);
  log(!/something went wrong/i.test(await p2.innerText("body")) && p2.errs.length === 0, "60 rapid screen switches: no crash" + (p2.errs[0] ? " -> " + p2.errs[0] : ""));
  await b.close();
  console.log(`\n${res.length} checks, ${res.filter(x => !x).length} failed`);
})();
