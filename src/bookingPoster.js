// A print-ready "Scan to book" poster (A4) for the front desk: clinic name, big QR code, the link in words.
const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** `qrPng` must be a data:image/png URL; anything else is dropped, so the page can never carry a script. */
export const buildBookingPosterHtml = ({ clinicName, url, qrPng }) => {
  const img = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(String(qrPng || "")) ? qrPng : "";
  const name = esc(clinicName || "Our clinic");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Scan to book - ${name}</title>
<style>@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#12275a;text-align:center;background:#fff}
h1{font-size:54px;line-height:1.1;margin:0 0 8px}h2{font-size:30px;margin:0 0 36px;font-weight:600;color:#2a54b8}img{width:420px;height:420px;border:6px solid #12275a;border-radius:24px;padding:12px}
p{font-size:22px;margin:28px 0 0;color:#3d527f;word-break:break-all;max-width:640px}small{display:block;margin-top:36px;font-size:16px;color:#6b7fa8}</style></head>
<body><h1>${name}</h1><h2>Scan to book your appointment</h2>${img ? `<img src="${img}" alt="QR code to book an appointment">` : ""}<p>${esc(url)}</p><small>Point your phone camera at the code. We will confirm your slot.</small>
</body></html>`;
};
