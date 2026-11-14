// Real-browser smoke test of the built site: node e2e/smoke.cjs [baseUrl]
// Needs `npm run build` + `npx vite preview --port 4173` running, and Playwright installed.
const { chromium } = require("playwright");
const base = process.argv[2] || "http://localhost:4173/";
const SIZES = { phone: { width: 390, height: 844 }, tablet: { width: 820, height: 1180 }, desktop: { width: 1366, height: 800 } };
let failed = 0;
const check = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failed++; };

(async () => {
  const browser = await chromium.launch();
  for (const [name, viewport] of Object.entries(SIZES)) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(base, { waitUntil: "load" });
    await page.waitForSelector("text=Start free with Google", { timeout: 15000 }).catch(() => {});
    check(await page.isVisible("text=Start free with Google"), `${name}: landing page shows the main button`);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(over <= 1, `${name}: no sideways scroll (${over}px over)`);
    check(!(await page.isVisible("#boot")), `${name}: opening screen has gone`);
    check((await page.innerText("body")).includes("meridentapp@gmail.com"), `${name}: contact email is shown`);
    await page.click("text=Use email and password instead").catch(() => {});
    const email = await page.$("input[type=email]");
    check(!!email, `${name}: email sign-in form opens`);
    if (email) {
      const submit = await page.$("button[type=submit]");
      const blocked = submit ? await submit.isDisabled() : true;
      const refused = blocked || (await (async () => { await submit.click(); await page.waitForTimeout(400); return page.evaluate(() => !!document.querySelector("input:invalid, [role=alert]")); })());
      check(refused, `${name}: empty form cannot be submitted`);
    }
    check(errors.length === 0, `${name}: no script errors${errors.length ? " -> " + errors[0] : ""}`);
    await page.close();
  }
  await browser.close();
  console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
  process.exit(failed ? 1 : 0);
})();
