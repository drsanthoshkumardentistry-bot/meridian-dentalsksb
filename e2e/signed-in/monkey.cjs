// Random-click "monkey" test: clicks buttons, types junk into inputs, switches screens, at phone and desktop size. Reports crashes and script errors.
const { chromium } = require("playwright");
const URL = "http://localhost:5199/";
let seed = Number(process.argv[2] || 12345); const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const JUNK = ["", " ", "0", "-1", "1e99", "NaN", "<script>window.__xss=1</script>", "' OR 1=1 --", "😀🦷", "சந்தோஷ்", "A".repeat(3000), "99999999999", "31/02/2027", "00:00", "9876543210", "a@b.co", "../../etc/passwd", "‮", "%s%n"];
const SKIP = /sign out|log ?out|delete (all|account|clinic)|erase|reset|clear (all|data)|restore|import|backup|download|export|print|pdf|send|whatsapp|call|share|upload/i;
(async () => {
  const b = await chromium.launch(); let bad = 0, total = 0;
  for (const [w, h, label] of [[390, 844, "phone"], [1280, 800, "desktop"]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); const errs = [];
    p.on("pageerror", e => errs.push(String(e).slice(0, 700))); p.on("console", m => { if (m.type() === "error" && !/ERR_TUNNEL|ERR_NAME|Failed to load resource|favicon/.test(m.text())) errs.push("console: " + m.text().slice(0, 700)); });
    p.on("dialog", d => rnd() < 0.5 ? d.accept("x") : d.dismiss()); p.on("popup", pp => pp.close()); await p.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    await p.goto(URL); await p.waitForTimeout(2000);
    await p.evaluate(() => { localStorage.setItem("merident_u-test_profile", JSON.stringify({ name: "Smile Dental", drName: "Dr S", state: "TN", councilRegNumber: "12345" })); localStorage.setItem("merident_u-test_patients", JSON.stringify([{ id: "p1", name: "Asha Devi", age: "34", gender: "Female", phone: "9876543210", visits: [], plans: [], consent: { treatment: true, whatsapp: true } }])); });
    await p.reload(); await p.waitForTimeout(1500);
    for (let i = 0; i < 450; i++) {
      total++;
      try {
        const r = rnd();
        if (r < 0.55) { const btns = await p.$$("button:visible, a[role=button]:visible, [role=tab]:visible"); if (btns.length) { const el = btns[Math.floor(rnd() * btns.length)]; const t = ((await el.textContent().catch(() => "")) + (await el.getAttribute("aria-label").catch(() => ""))) || ""; if (!SKIP.test(t)) await el.click({ timeout: 800, force: true }).catch(() => {}); } }
        else if (r < 0.85) { const ins = await p.$$("input:visible:not([type=file]):not([type=checkbox]):not([type=radio]), textarea:visible"); if (ins.length) { const el = ins[Math.floor(rnd() * ins.length)]; await el.fill(JUNK[Math.floor(rnd() * JUNK.length)], { timeout: 800 }).catch(() => {}); } }
        else if (r < 0.93) { const sel = await p.$$("select:visible"); if (sel.length) { const el = sel[Math.floor(rnd() * sel.length)]; const opts = await el.$$eval("option", o => o.map(x => x.value)); if (opts.length) await el.selectOption(opts[Math.floor(rnd() * opts.length)]).catch(() => {}); } }
        else if (r < 0.97) await p.keyboard.press(["Escape", "Enter", "Tab", "Backspace"][Math.floor(rnd() * 4)]);
        else { const nav = await p.$$("nav button:visible"); if (nav.length) await nav[Math.floor(rnd() * nav.length)].click({ timeout: 800 }).catch(() => {}); }
        if (i % 15 === 0) {
          await p.waitForTimeout(80);
          const body = await p.innerText("body").catch(() => "");
          if (/something went wrong/i.test(body)) { bad++; console.log(`FAIL ${label} step ${i}: CRASH SCREEN`); errs.length && console.log("   ", errs.slice(-2).join(" | ")); await p.reload(); await p.waitForTimeout(1500); }
          if (await p.evaluate(() => window.__xss)) { bad++; console.log(`FAIL ${label} step ${i}: XSS ran`); await p.evaluate(() => { delete window.__xss; }); }
        }
      } catch (e) { /* page navigated or closed by the click; keep going */ }
    }
    const uniq = [...new Set(errs)];
    console.log(`${label}: ${450} random actions, crashes/xss: ${bad}, distinct script errors: ${uniq.length}`); uniq.slice(0, 6).forEach(e => console.log("   -", e));
    await ctx.close();
  }
  await b.close(); console.log(bad ? `\n${bad} problem(s)` : "\nNo crashes");
})();
