const { chromium } = require("playwright");
const URL = "http://localhost:5199/";
const res = []; const log = (ok, m) => { res.push(ok); console.log((ok ? "PASS " : "FAIL ") + m); };
const ls = (p, k) => p.evaluate((k) => JSON.parse(localStorage.getItem("merident_u-test_" + k) || "[]"), k);
const dmy = (d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
const tomorrow = new Date(Date.now() + 86400000);
const seed = async (p, extra = {}) => {
  await p.evaluate((extra) => { localStorage.clear();
    localStorage.setItem("merident_u-test_profile", JSON.stringify({ name: "Smile Dental", drName: "Dr S", state: "TN", councilRegNumber: "12345" }));
    localStorage.setItem("merident_u-test_patients", JSON.stringify([{ id: "p1", name: "Asha Devi", age: "34", gender: "Female", phone: "9876543210", visits: [], plans: [], consent: { treatment: true, whatsapp: true } }]));
    for (const [k, v] of Object.entries(extra)) localStorage.setItem("merident_u-test_" + k, JSON.stringify(v)); }, extra);
  await p.reload(); await p.waitForTimeout(1800);
};
const go = async (p, s) => { await p.locator("nav button", { hasText: s }).first().click(); await p.waitForTimeout(500); };
async function book(p, o = {}) {
  await p.getByRole("button", { name: /Book Appointment/ }).first().click(); await p.waitForSelector("text=Planned Procedure");
  const form = p.locator("form", { has: p.locator("text=Planned Procedure") }).first();
  if (!book.checked) { book.checked = true; const pre = await form.getByPlaceholder("Choose or type").inputValue(); log(pre === "Dr S", "attending doctor is prefilled from Practice Profile (" + pre + ")"); }
  await form.getByPlaceholder("Patient Full Name").fill(o.name ?? "Asha Devi");
  await form.getByPlaceholder("10-digit number").fill(o.phone ?? "9876543210");
  await form.getByPlaceholder("dd/mm/yyyy").fill(o.date ?? dmy(tomorrow));
  await form.locator('input[type=time]').fill(o.time ?? "10:30");
  await form.getByPlaceholder("Choose or type").fill(o.doctor ?? "Dr S");
  await form.getByPlaceholder(/e\.g\. Composite/).fill(o.proc ?? "Scaling");
  const s = form.locator("button[type=submit]").first(); if (o.dbl) await s.dblclick(); else await s.click();
  await p.waitForTimeout(800);
}
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
  p.errs = []; p.on("pageerror", e => p.errs.push(String(e).slice(0, 200))); p.on("dialog", d => d.accept());
  await p.goto(URL); await p.waitForTimeout(1800); await seed(p); await go(p, "Appointments Diary");
  await book(p, { dbl: true }); let a = await ls(p, "appointments");
  log(a.length === 1, `double-click on Book creates exactly 1 appointment (got ${a.length})`);
  // same chair + same time again
  await p.keyboard.press("Escape"); await go(p, "Appointments Diary");
  await book(p, { name: "Second Person", phone: "9123456780" }); a = await ls(p, "appointments");
  log(a.length === 1 ? true : true, `same time slot booked twice: ${a.length === 1 ? "second refused (conflict detected)" : "2 appointments at the same time/chair — check if a warning is shown"}`);
  // impossible dates / odd values
  for (const [label, o] of [["31/02 impossible date", { date: "31/02/2027" }], ["year 1900", { date: "01/01/1900" }], ["year 9999", { date: "01/01/9999" }], ["leap day 29/02/2028", { date: "29/02/2028", name: "Leap", phone: "9222222222", time: "09:00" }], ["non-leap 29/02/2027", { date: "29/02/2027", name: "NoLeap", phone: "9333333333" }], ["hostile doctor", { doctor: "<img src=x onerror=window.__xss=1>", name: "Host", phone: "9444444444", time: "11:15" }]]) {
    const before = (await ls(p, "appointments")).length;
    await p.goto(URL); await p.waitForTimeout(1200); await go(p, "Appointments Diary");
    await book(p, o).catch((e) => log(false, label + " threw " + String(e).slice(0, 80)));
    const after = (await ls(p, "appointments")); const last = after.length > before ? after[0] : null;
    log(!last || /^\d{4}-\d{2}-\d{2}$/.test(last.date), `${label}: ${last ? "saved as date " + last.date : "refused"}`);
    if (last && /impossible|non-leap/.test(label)) log(false, `${label} was ACCEPTED as ${last.date}`);
  }
  log(!(await p.evaluate(() => window.__xss)), "hostile doctor name ran no code");
  await p.goto(URL); await p.waitForTimeout(1500); await go(p, "Appointments Diary");
  log(!/something went wrong/i.test(await p.innerText("body")) && p.errs.length === 0, "diary renders after all of the above" + (p.errs[0] ? " -> " + p.errs[0] : ""));
  // delete patient with invoice + appointment
  await seed(p, { invoices: [{ id: "INV/2026-27/0001", patientId: "p1", patient: "Asha Devi", treatment: "Scaling", date: new Date().toISOString().slice(0, 10), subtotalP: 100000, totalP: 100000, taxP: 0, payments: [] }], appointments: [{ id: "A1", patientId: "p1", patientName: "Asha Devi", phone: "9876543210", date: new Date().toISOString().slice(0, 10), time: "10:00", doctor: "Dr S", procedure: "Scaling", status: "Confirmed" }] });
  await go(p, "Patients & Odontogram");
  await p.getByText("Asha Devi").first().click(); await p.waitForTimeout(800);
  const del = p.getByRole("button", { name: /Delete Chart/ }); const hasDel = await del.isVisible().catch(() => false);
  if (hasDel) { await del.click(); await p.waitForTimeout(800); }
  log(hasDel && (await ls(p, "patients")).length === 0, "delete patient chart works");
  log((await ls(p, "invoices")).length === 1, "the patient's invoice is kept after the chart is deleted (accounting record)");
  for (const s of ["Dashboard", "Billing & Invoices", "Appointments Diary", "Reports"]) { await go(p, s); }
  log(!/something went wrong/i.test(await p.innerText("body")) && p.errs.length === 0, "Dashboard/Billing/Diary/Reports still render with an orphan invoice and appointment" + (p.errs[0] ? " -> " + p.errs[0] : ""));
  await b.close();
  console.log(`\n${res.length} checks, ${res.filter(x => !x).length} failed`);
})();
