/* Public feature pages (/dental, /odontogram, ...). Each one describes only what MeriDent does today,
 * in the same words as the landing page. Plain data so a test can check the facts and the sitemap. */
export const SITE = "https://www.meridiandentalos.com";

export const SEO_PAGES = [
  {
    path: "/dental",
    nav: "For dental clinics",
    title: "Dental practice management software for Indian clinics | MeriDent",
    description: "MeriDent is a cloud practice manager for Indian dental clinics: 32-tooth odontogram, treatment plans, GST invoices with UPI QR, appointments and WhatsApp reminders. Free during early access.",
    h1: "Practice management software for Indian dental clinics",
    lead: "Chart the tooth, bill the visit and remind the patient from one place. It runs in your browser, so there is nothing to install.",
    sections: [
      { h: "What a dental clinic gets", items: [
        "A 32-tooth odontogram for adults, with fillings, crowns, planned work and missing teeth.",
        "Treatment plans priced tooth by tooth, which patients approve from their phone.",
        "GST invoices with part payments and a scannable UPI QR for the exact balance.",
        "An appointments diary by chair and doctor, with a warning before you double-book.",
        "WhatsApp reminders and recall that open with the message already written.",
        "Stock with reorder and expiry alerts, staff logins with roles, and reports for your accountant."] },
      { h: "Built for how Indian clinics work", items: [
        "Therapeutic dental care is shown as GST-exempt and cosmetic work at 18%, mixed on one invoice.",
        "Dates are shown as dd/mm/yyyy and money in rupees.",
        "Keep working when the internet drops. Changes save on the device and sync when you are back online."] }
    ],
    faqs: [
      { q: "Is MeriDent free?", a: "It is free during early access, with no credit card. We will announce simple pricing well before anything changes." },
      { q: "Does it work for a clinic with several doctors or branches?", a: "Yes. Give each person their own login as manager, dentist or receptionist, and run several branches from one account." }
    ]
  },
  {
    path: "/odontogram",
    nav: "Odontogram & charting",
    title: "Dental odontogram and tooth charting software | MeriDent",
    description: "Chart all 32 teeth on a digital odontogram, with perio chart, OPG viewer, caries risk and signed consents. Saved on each patient's record. Free during early access.",
    h1: "A digital odontogram that keeps up with the chair",
    lead: "Open a patient and chart the first tooth in a few taps. Every finding is saved on the patient's record with its date.",
    sections: [
      { h: "Charting tools", items: [
        "32-tooth odontogram with a legend for fillings, crowns, planned work and missing teeth.",
        "Perio chart: six probing depths per tooth, with bleeding and mobility, colour-coded green, amber and red.",
        "OPG and diagnosis studio: zoom, adjust brightness and contrast, invert the negative and calibrate to measure in millimetres.",
        "Extra radiographs such as IOPA, CBCT and X-ray, plus pre-op and post-op pictures side by side.",
        "Caries risk and gum (BPE) screening, and an extra-oral examination record."] },
      { h: "From the chart to the note", items: [
        "One tap drafts findings, advice and the next planned treatment from the chart. You edit it before you save.",
        "Signed treatment consents with on-screen signature, kept on the patient's record."] }
    ],
    faqs: [
      { q: "Where are radiographs stored?", a: "Pictures are kept with the patient's record in your clinic's own workspace. Cloud storage for radiographs is still coming next." },
      { q: "Does the app diagnose?", a: "No. The chart records what you find. Any drafted note is a draft for the dentist to read and edit." }
    ]
  },
  {
    path: "/dental-billing-gst",
    nav: "GST billing & UPI QR",
    title: "Dental billing software with GST invoices and UPI QR | MeriDent",
    description: "Make GST invoices for dental treatment, take part payments and show a UPI QR for the exact balance. Instalments, dues tracking and daily collection reports. Free during early access.",
    h1: "Dental billing with GST and a UPI QR",
    lead: "Bill several treatments on one invoice, take part payments, and let the patient scan a UPI QR for the exact balance.",
    sections: [
      { h: "Billing features", items: [
        "Multi-item invoices that mix GST-exempt therapeutic care and 18% work.",
        "Part payments, printable invoices and receipts, and a UPI QR for the balance.",
        "Instalment plans from 2 to 24 monthly parts, each marked Paid, Part paid, Due or Overdue.",
        "Dues by age, an overdue filter, patient search and an export to a spreadsheet."] },
      { h: "For your accountant", items: [
        "Daily collections by cash, UPI and card.",
        "A monthly GST summary you can download as a spreadsheet or print as a PDF."] }
    ],
    faqs: [
      { q: "How does GST work on invoices?", a: "Therapeutic dental care is shown as GST-exempt and cosmetic work at 18%. Confirm the rate for your own services with your accountant." },
      { q: "Does MeriDent take payments?", a: "It shows a UPI QR and a payment link that the patient pays in their own UPI app. You record the payment against the invoice." }
    ]
  },
  {
    path: "/whatsapp-reminders",
    nav: "WhatsApp reminders",
    title: "WhatsApp appointment reminders and recall for dentists | MeriDent",
    description: "See who to remind for tomorrow, who owes a balance and who is due a 6-month check-up. One tap opens WhatsApp with the message ready. Patients can opt out.",
    h1: "WhatsApp reminders for dental clinics",
    lead: "MeriDent shows who needs a reminder and opens WhatsApp with the message already written, so you tap Send.",
    sections: [
      { h: "What you can send", items: [
        "Appointment reminders for tomorrow.",
        "Payment reminders with the balance and a UPI payment link.",
        "6-month recall for patients due a check-up.",
        "Feedback requests after a visit, and a review link for happy patients.",
        "Treatment plan nudges and lab updates."] },
      { h: "Respectful by design", items: [
        "Patients who opt out are never listed.",
        "Automatic sending is not available yet. It is listed as coming next."] }
    ],
    faqs: [
      { q: "Does MeriDent send WhatsApp messages by itself?", a: "Not yet. It opens WhatsApp with the message ready and you tap Send. Automatic sending is coming next." },
      { q: "Do patients need to install anything?", a: "No. Messages go to the patient's normal WhatsApp." }
    ]
  },
  {
    path: "/online-booking",
    nav: "Online booking",
    title: "Online appointment booking page for dental clinics | MeriDent",
    description: "Share a booking link on WhatsApp or Instagram. Patients send a request, you confirm it, and it lands in your diary with a WhatsApp confirmation ready.",
    h1: "An online booking page for your clinic",
    lead: "Switch on a link you can share anywhere. Patients send a request, and you stay in control of what goes in the diary.",
    sections: [
      { h: "How it works", items: [
        "Turn on your booking page and share the link on WhatsApp or Instagram.",
        "A patient sends a request with their details and preferred time.",
        "You confirm it, and it lands in your appointments diary.",
        "A WhatsApp confirmation is ready for you to send."] },
      { h: "At the desk", items: [
        "Walk-in queue with tokens and urgent cases first.",
        "A warning before you double-book a chair or doctor.",
        "Mark each visit Completed, No show or Cancelled."] }
    ],
    faqs: [
      { q: "Is a booking confirmed automatically?", a: "No. A request waits for you to confirm it, so you control your diary." },
      { q: "Does the patient need an account?", a: "No. They open the link and send a request." }
    ]
  },
  {
    path: "/treatment-plans",
    nav: "Treatment plans & estimates",
    title: "Treatment plan and estimate software for dentists | MeriDent",
    description: "Price a treatment plan tooth by tooth and send the patient a link on WhatsApp. They approve or decline from their phone, and approved plans become an invoice.",
    h1: "Treatment plans patients can approve from their phone",
    lead: "Price the plan tooth by tooth, send one link, and see the patient's answer without chasing.",
    sections: [
      { h: "From estimate to invoice", items: [
        "Price each tooth and treatment, then send the patient a link on WhatsApp.",
        "The patient approves or declines from their phone, with no sign-in.",
        "Approved plans turn into an invoice.",
        "See estimates nobody has answered and approved plans nobody has booked, and nudge them with one tap."] },
      { h: "Paperwork", items: [
        "Prescriptions from presets, shared on WhatsApp.",
        "Medical, treatment and fitness certificates with your clinic name and council number.",
        "Signed treatment consents for extractions, root canals, implants, braces and more."] }
    ],
    faqs: [
      { q: "Can patients pay in instalments?", a: "Yes. The Collect window can split a balance into 2 to 24 monthly parts." },
      { q: "Does the patient see other patients' data?", a: "No. The link opens only that patient's estimate." }
    ]
  }
];

export const seoPageForPath = (pathname = "") => {
  const p = pathname.replace(/\/+$/, "") || "/";
  return SEO_PAGES.find((x) => x.path === p) || null;
};

export const sitemapXml = () =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  ["/", "/login", "/free-early-access", ...SEO_PAGES.map((p) => p.path)].map((p) => `  <url><loc>${SITE}${p === "/" ? "/" : p}</loc></url>`).join("\n") +
  `\n</urlset>\n`;
