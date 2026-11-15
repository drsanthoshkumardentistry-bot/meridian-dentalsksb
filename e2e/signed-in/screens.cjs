const { chromium } = require("playwright");
const URL = "http://localhost:5199/";
const SH = require("os").tmpdir() + "/";
const res = []; const log = (ok, m) => { res.push(ok); console.log((ok ? "PASS " : "FAIL ") + m); };
const NAV = ["Dashboard","Appointments Diary","Patients & Odontogram","OPG & Diagnosis Studio","Billing & Invoices","MeriDent Connect","Memberships & Leads","Reports","Stock Maintenance","Employee Roles & Roster","Practice Profile","Settings"];
const newPage = async (b, w, h, extra = {}) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, ...extra }); const p = await ctx.newPage(); p.errs = [];
  p.on("pageerror", e => p.errs.push("PAGEERROR " + String(e).slice(0, 200)));
  p.on("console", m => { if (m.type() === "error" && !/ERR_TUNNEL|ERR_NAME|Failed to load resource/.test(m.text())) p.errs.push("console: " + m.text().slice(0, 200)); });
  p.on("dialog", d => d.accept());
  return [ctx, p];
};
(async () => {
  const b = await chromium.launch();
  // A. every screen at 3 sizes
  for (const [w, h] of [[320, 568], [390, 844], [1280, 800]]) {
    const [ctx, p] = await newPage(b, w, h);
    await p.goto(URL, { waitUntil: "load" }); await p.waitForTimeout(2500);
    for (const label of NAV) {
      // on phones the menu may be collapsed: try the nav button, else open the hamburger
      let btn = p.locator("nav button", { hasText: label }).first();
      if (!(await btn.isVisible().catch(() => false))) { await p.locator("button[aria-label*='enu' i]").first().click({ timeout: 1500 }).catch(() => {}); await p.waitForTimeout(300); btn = p.locator("nav button", { hasText: label }).first(); }
      await btn.click({ timeout: 4000 }).catch(() => {});
      await p.waitForTimeout(700);
      const body = (await p.innerText("body")).slice(0, 20000);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      const crashed = /something went wrong/i.test(body);
      const errs = p.errs.splice(0);
      const bad = [];
      if (crashed) bad.push("CRASH SCREEN"); if (over > 1) bad.push(`sideways ${over}px`); if (errs.length) bad.push(errs[0]);
      log(bad.length === 0, `${w}px ${label}${bad.length ? " -> " + bad.join(" | ") : ""}`);
      if (w === 390 && ["Dashboard","Patients & Odontogram","Billing & Invoices"].includes(label)) await p.screenshot({ path: SH + `app-${w}-${label.replace(/\W+/g,"_")}.png` });
    }
    await ctx.close();
  }
  await b.close();
  console.log(`\n${res.length} checks, ${res.filter(x => !x).length} failed`);
})();
