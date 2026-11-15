const { chromium } = require("playwright");
const URL = "http://localhost:5199/";
const res = []; const log = (ok, m) => { res.push(ok); console.log((ok ? "PASS " : "FAIL ") + m); };
const inv = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("merident_u-test_invoices") || "[]"));
const seed = async (p) => {
  await p.evaluate(() => { localStorage.clear();
    localStorage.setItem("merident_u-test_profile", JSON.stringify({ name: "Smile Dental", drName: "Dr S", state: "TN", councilRegNumber: "12345" }));
    localStorage.setItem("merident_u-test_patients", JSON.stringify([{ id: "p1", name: "Asha Devi", age: "34", gender: "Female", phone: "9876543210", visits: [], plans: [], consent: { treatment: true, whatsapp: true } }])); });
  await p.reload(); await p.waitForTimeout(1800);
  await p.locator("nav button", { hasText: "Billing & Invoices" }).first().click(); await p.waitForTimeout(500);
};
async function newInvoice(p, { patient = "Asha Devi", treatment = "Scaling", amount = "1500", dbl = false, tax } = {}) {
  await p.getByText("New Invoice").first().click(); await p.waitForSelector("text=Patient Name *");
  const form = p.locator("form", { has: p.locator("text=Patient Name *") }).first();
  await form.locator('input[list="patient-options"]').fill(patient);
  await form.locator('input[placeholder^="e.g. Root Canal"]').fill(treatment);
  await form.locator('input[type="number"]').first().fill(amount);
  if (tax) await form.locator("select").last().selectOption(tax);
  const s = form.locator("button[type=submit]").first();
  if (dbl) await s.dblclick(); else await s.click();
  await p.waitForTimeout(700);
}
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
  p.errs = []; p.on("pageerror", e => p.errs.push(String(e).slice(0, 200))); p.on("dialog", d => d.accept());
  await p.goto(URL); await p.waitForTimeout(2000);
  await seed(p);
  await newInvoice(p, { dbl: true }); let list = await inv(p);
  log(list.length === 1, `double-click on Create invoice makes exactly 1 invoice (got ${list.length})`);
  log(list[0] && list[0].totalP === 150000, `Rs 1500 therapeutic = ${list[0] && list[0].totalP} paise (expect 150000)`);
  for (const [label, amount] of [["zero", "0"], ["negative", "-500"], ["blank", ""]]) {
    const before = (await inv(p)).length; await newInvoice(p, { amount }); const after = (await inv(p)).length;
    log(after === before, `invoice with ${label} amount is refused`);
    await p.keyboard.press("Escape"); await p.goto(URL); await p.waitForTimeout(1500); await p.locator("nav button", { hasText: "Billing & Invoices" }).first().click(); await p.waitForTimeout(400);
  }
  // huge, decimal
  for (const [label, amount] of [["huge 1e12", "1000000000000"], ["decimal 0.005", "0.005"], ["decimal 99.999", "99.999"], ["exponent 1e3", "1e3"]]) {
    const before = (await inv(p)).length; await newInvoice(p, { amount, treatment: "Edge " + label }); const l = await inv(p);
    const last = l[0] && l.find((x) => String(x.treatment).includes("Edge " + label));
    const ok = !last || (Number.isFinite(last.totalP) && last.totalP >= 0 && last.totalP < 1180000000 + 1 && !/huge/.test(label));
    log(ok, `amount ${label}: ${last ? "saved as " + last.totalP + " paise" : "refused"} (no NaN/negative)`);
    await p.keyboard.press("Escape"); await p.goto(URL); await p.waitForTimeout(1500); await p.locator("nav button", { hasText: "Billing & Invoices" }).first().click(); await p.waitForTimeout(400);
  }
  // hostile text invoice
  await newInvoice(p, { patient: "<img src=x onerror=window.__xss=1>", treatment: "<script>window.__xss=1</script>", amount: "100" });
  await p.goto(URL); await p.waitForTimeout(1500); await p.locator("nav button", { hasText: "Billing & Invoices" }).first().click(); await p.waitForTimeout(600);
  log(!(await p.evaluate(() => window.__xss)) && !/something went wrong/i.test(await p.innerText("body")), "hostile patient/treatment text on an invoice runs nothing");
  // numbering
  const ids = (await inv(p)).map(x => x.id); log(new Set(ids).size === ids.length, `invoice numbers unique: ${ids.length} invoices, ${new Set(ids).size} distinct numbers`);
  // payments
  await seed(p); await newInvoice(p, { amount: "1000", treatment: "Pay test" });
  await p.goto(URL); await p.waitForTimeout(1500); await p.locator("nav button", { hasText: "Billing & Invoices" }).first().click(); await p.waitForTimeout(500);
  await p.getByRole("button", { name: /^Collect$/ }).first().click(); const amt = p.getByPlaceholder(/Amount \(max/); await amt.waitFor();
  await amt.fill("400"); await amt.press("Enter"); await p.waitForTimeout(500);
  let paid = (await inv(p))[0].payments || []; log(paid.length === 1, `part payment Rs 400 recorded (${paid.length} payment)`);
  await p.getByRole("button", { name: /^Collect$/ }).first().click({ timeout: 2000 }).catch(() => {}); const amt2 = p.getByPlaceholder(/Amount \(max/); await amt2.waitFor({ timeout: 3000 }).catch(() => {});
  for (const bad of ["999999", "0", "-50", "abc"]) { await amt2.fill(bad).catch(() => {}); await amt2.press("Enter").catch(() => {}); await p.waitForTimeout(300); }
  paid = (await inv(p))[0].payments || []; log(paid.length === 1, `over-balance, zero, negative and text payments refused (still ${paid.length} payment)`);
  await amt2.fill("600").catch(() => {}); const sub = amt2.locator("xpath=ancestor::form//button[@type='submit']").first(); await sub.dblclick().catch(() => {}); await p.waitForTimeout(600);
  paid = (await inv(p))[0].payments || []; const sum = paid.reduce((s, x) => s + (x.amountP || 0), 0);
  log(sum <= 100000, `double-clicking the final payment never overpays (total paid ${sum / 100}, bill 1000)`);
  log(p.errs.length === 0, "no script errors in billing flows" + (p.errs[0] ? " -> " + p.errs[0] : ""));
  await b.close();
  console.log(`\n${res.length} checks, ${res.filter(x => !x).length} failed`);
})();
