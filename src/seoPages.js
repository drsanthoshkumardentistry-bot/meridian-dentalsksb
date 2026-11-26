/* Public feature pages (/dental, /odontogram, ...). Each one describes only what MeriDent does today,
 * in the same words as the landing page. Plain data so a test can check the facts and the sitemap. */
import { BLOG_POSTS, BLOG_PATH } from "./blogPosts.js";
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
      { q: "Does it work for a clinic with several doctors or branches?", a: "Yes. Give each person their own login as manager, dentist or receptionist, and run several branches from one account." },
      { q: "Is MeriDent the same as Meridian Dental OS?", a: "Yes. Meridian Dental OS was our earlier name. The product is now called MeriDent, and this website address still carries the old name." }
    ]
  },
  {
    path: "/odontogram",
    nav: "Odontogram & charting",
    title: "Dental charting software and digital odontogram | MeriDent",
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
      { q: "Which X-ray files and cameras work with MeriDent?", a: "Pictures saved as JPG or PNG by your RVG software, and DICOM (.dcm) files from digital sensors and panoramic units, can be added. DICOM files are converted to normal pictures in your browser. Compressed DICOM files are not read: export those as JPEG or PNG from your imaging software. A USB camera, an intraoral camera that appears as a webcam, or a phone camera can take pictures straight into the patient's record. MeriDent does not talk to the sensor itself, so it does not capture straight from the sensor." },
      { q: "Where are radiographs stored?", a: "Pictures are kept with the patient's record in your clinic's own workspace. Cloud storage for radiographs is still coming next." },
      { q: "Does the app diagnose?", a: "No. The chart records what you find. Any drafted note is a draft for the dentist to read and edit." }
    ]
  },
  {
    path: "/records-safety",
    nav: "Records safety",
    title: "How MeriDent keeps your dental records safe, and how to check | MeriDent",
    description: "Daily cloud restore points, an encrypted daily backup, 3-day download reminders and a recycle bin. Each safeguard comes with a way to check it yourself.",
    h1: "Built so your clinic records are not lost, with ways to check",
    lead: "Patient records are the hardest thing to replace in a clinic. Below is every safeguard MeriDent has today, how to see it working, and what it cannot promise.",
    sections: [
      { h: "Safeguards in place today", items: [
        "A cloud restore point of your clinic is saved once a day. We keep the newest 7, then one a week for 4 weeks and one a month for 6 months.",
        "You can download a full backup file any time, with an optional password. The bell reminds you every 3 days.",
        "We also keep our own encrypted daily copy of the whole database for 90 days. Only a private key we hold can open it.",
        "A deleted patient or invoice goes to Recently deleted for 30 days, so it can be brought back.",
        "Each clinic's records sit under its own account. The database rules that keep clinics apart are tested automatically.",
        "Branch-limited staff see only their branch, and an activity log shows who changed what."] },
      { h: "How to check it yourself", items: [
        "Open Practice Profile as the owner. The Records safety card shows the time of your newest cloud restore point and the patients it holds next to your live count.",
        "The same card shows when this device last downloaded a backup, and warns in plain words when it is overdue.",
        "Download a backup and open it. It lists your patient, appointment and invoice counts.",
        "Every day an automatic check confirms our backup ran, did not shrink, and that our encryption still locks and unlocks correctly. It also watches storage and sudden drops in a clinic's record count, and alerts us the same day.",
        "Ask us on WhatsApp and we will walk you through a restore test."] },
      { h: "What we cannot promise", items: [
        "No system is perfectly safe. That is why you can keep your own copy and why we keep several.",
        "A backup covers patients, appointments, invoices, stock, staff and your clinic profile. Keep your original radiograph and photo files too.",
        "A backup file you download holds private health details. Set a password, and store it somewhere only you can reach.",
        "MeriDent runs on free-tier cloud services during early access. We watch the storage limits daily and will tell you before they matter."] }
    ],
    faqs: [
      { q: "Can MeriDent lose my records?", a: "We cannot promise that nothing will ever go wrong. We keep a daily cloud restore point, a daily encrypted copy of our own and a recycle bin, and you can download your own backup. Several copies in different places is the protection." },
      { q: "Who can open my clinic's records?", a: "Only the people you invite, with the role you choose. We do not read patient records unless you ask us for support and agree to it." },
      { q: "Can I leave and take my data with me?", a: "Yes. A full backup and spreadsheets of patients, appointments and invoices can be downloaded at any time from Practice Profile." }
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
  },
  {
    path: "/dental-appointment-scheduling-software",
    nav: "Appointment scheduling",
    title: "Dental appointment scheduling software for clinics in India | MeriDent",
    description: "A dental appointments diary by chair and doctor, with a warning before you double-book, a walk-in queue and online booking requests you confirm. Free during early access.",
    h1: "Dental appointment scheduling for a busy clinic",
    lead: "See the day by chair and doctor, catch a double booking before it happens, and keep walk-ins and phone bookings in one diary.",
    sections: [
      { h: "The diary", items: [
        "An appointments diary by chair and by doctor.",
        "A warning before you double-book a chair or a doctor.",
        "Mark each visit Completed, No show or Cancelled, so the diary matches what happened.",
        "A walk-in queue with tokens, with urgent cases shown first."] },
      { h: "Getting patients into it", items: [
        "Share an online booking link on WhatsApp or Instagram. A patient sends a request, and you confirm it before it lands in the diary.",
        "WhatsApp reminders for tomorrow's patients open with the message already written, so you tap Send.",
        "A 6-month recall list shows who is due a check-up."] }
    ],
    faqs: [
      { q: "Is a booking confirmed without me?", a: "No. A patient's online request waits for you to confirm it, so you control the diary." },
      { q: "Does MeriDent send reminders by itself?", a: "Not yet. It opens WhatsApp with the reminder ready and you tap Send. Automatic sending is coming next." },
      { q: "Can several doctors and chairs share one diary?", a: "Yes. The diary is organised by chair and doctor, and each person signs in with their own role." }
    ]
  },
  {
    path: "/dental-insurance-tpa-claims-software",
    nav: "Insurance & TPA claims",
    title: "Dental insurance and TPA claim tracking for clinics | MeriDent",
    description: "Record each insurance or TPA claim on the patient's chart: amounts claimed, approved and settled, status, and what insurers still owe the clinic. Tracking only, not submission.",
    h1: "Track dental insurance and TPA claims in one place",
    lead: "Note every claim against the patient, follow it from pre-authorisation to settlement, and see how much insurers still owe the clinic. MeriDent tracks claims. It does not submit them.",
    sections: [
      { h: "What you record", items: [
        "The payer type: insurance, TPA, government scheme or corporate.",
        "The insurer or TPA, the policy number and the claim number.",
        "The amount claimed, approved and settled.",
        "The status: pre-authorisation requested or approved, claim submitted, query raised, approved, settled or rejected."] },
      { h: "What you see", items: [
        "A Claims tab on each patient's chart.",
        "A claims overview on the Billing screen, with what insurers still owe the clinic.",
        "Claims on the printable patient record, next to the visits and bills."] }
    ],
    faqs: [
      { q: "Does MeriDent submit claims to insurers or TPAs?", a: "No. You submit claims the way you do today. MeriDent keeps the record and the follow-up, so nothing is lost in a notebook." },
      { q: "Does it connect to a TPA portal?", a: "No. There is no integration with insurer or TPA portals at present." },
      { q: "Who can see claims?", a: "People you invite to your clinic, with the role you choose. Claims are kept with each patient's record, separate from every other clinic." }
    ]
  },
  {
    path: "/dental-prescription-software",
    nav: "Prescriptions & certificates",
    title: "Dental prescription software with PDF and WhatsApp | MeriDent",
    description: "Write a dental prescription from medicine presets and send it as a PDF on WhatsApp with your clinic logo. Also certificates with your council number and signed consents.",
    h1: "Dental prescriptions you can send in one tap",
    lead: "Build the prescription from presets, check it, and send a clean PDF with your clinic's name and logo on it.",
    sections: [
      { h: "Prescriptions", items: [
        "Add medicines from presets, then change anything before you save.",
        "A prescription PDF with your clinic logo and details, shared on WhatsApp.",
        "Refer a patient between departments from the same record."] },
      { h: "Certificates and consents", items: [
        "Medical, treatment and fitness certificates with your clinic name and council number.",
        "Treatment consents for extractions, root canals, implants, braces and more, signed on screen and kept on the patient's record."] }
    ],
    faqs: [
      { q: "Who decides what goes on the prescription?", a: "The dentist. Presets save typing, and every line can be edited before it is saved or sent." },
      { q: "Where are prescriptions kept?", a: "On the patient's record in your clinic's own workspace, with a daily cloud restore point and a backup you can download." }
    ]
  },
  {
    path: "/dental-software-coimbatore",
    nav: "For Coimbatore clinics",
    title: "Dental clinic software in Coimbatore, built by dental students | MeriDent",
    description: "MeriDent is practice software for dental clinics, built in Coimbatore by two dental students. Odontogram, GST billing, WhatsApp reminders and daily backups. Free during early access.",
    h1: "Dental clinic software built in Coimbatore",
    lead: "MeriDent is made by two dental students in Coimbatore who wanted a clinic tool that fits how Indian clinics really work. You can message the founders directly on WhatsApp.",
    sections: [
      { h: "What you get", items: [
        "A 32-tooth odontogram, treatment plans and prescriptions, saved on each patient's record.",
        "GST invoices with part payments and a scannable UPI QR for the exact balance.",
        "Appointments by chair and doctor, with WhatsApp reminders that open with the message written.",
        "Daily cloud restore points and an encrypted backup you can keep."] },
      { h: "Who it is for", items: [
        "Single-doctor clinics and small multi-doctor clinics that want one place for charts, billing and recall.",
        "Clinics that want to try the software before paying, with a founder on WhatsApp for questions."] }
    ],
    faqs: [
      { q: "Can I try it in my own clinic?", a: "Yes. It is free during early access and needs no credit card. Message the founders on WhatsApp if you would like a walk-through." },
      { q: "Who builds MeriDent?", a: "Two dental students from Coimbatore, Santhoshkumar S and Sivasabari G. Both are second-year BDS students." }
    ]
  },
  {
    path: "/dental-patient-records",
    nav: "Patient records & backups",
    title: "Dental patient record software with backups and data export | MeriDent",
    description: "Keep dental patient records, charts, bills and pictures in one place, with daily restore points, an encrypted backup and the ability to export your data at any time.",
    h1: "Dental patient records you can back up and take with you",
    lead: "Your records stay yours. MeriDent keeps each clinic's data separate from every other clinic's, and gives you ways to copy it out.",
    sections: [
      { h: "Keeping records safe", items: [
        "Each clinic's data is kept separate from every other clinic's.",
        "Daily cloud restore points, plus an encrypted daily backup you can download and keep.",
        "A recycle bin for deleted records, so a slip can be undone."] },
      { h: "Taking your data with you", items: [
        "Export your patient list, bills and records whenever you want.",
        "If MeriDent ever had to stop, you would get at least 90 days' notice and a full export."] }
    ],
    faqs: [
      { q: "Can I leave and take my data?", a: "Yes. Your patient records, bills and files are yours, and you can export them from the app at any time." },
      { q: "Are X-rays included in the backup?", a: "Not yet. Pictures are kept with each patient's record in your clinic's own workspace. Download important radiographs separately for now." }
    ]
  },
  {
    path: "/dental-software-pricing",
    nav: "Pricing",
    title: "Dental clinic software pricing in rupees | MeriDent",
    description: "MeriDent is free during early access. Planned prices: Free trial, Standard at 499 rupees a month or 4,999 a year, and Pro at 999 rupees a month. Nobody is charged yet.",
    h1: "Dental clinic software pricing, in rupees",
    lead: "MeriDent is free during our trial run, with no credit card. These are the planned prices, and nobody is being charged yet.",
    sections: [
      { h: "Planned plans", items: [
        "Free trial: ₹0 for 30 days.",
        "Standard: ₹499 per month, or ₹4,999 per year.",
        "Pro: ₹999 per month, with multiple branches and more."] },
      { h: "What we promise", items: [
        "Clinics that join during early access keep their plan price for 12 months.",
        "Any later change comes with at least 30 days' written notice."] }
    ],
    faqs: [
      { q: "Is MeriDent free right now?", a: "Yes. It is free during early access, with no credit card. We will tell you well before that changes." },
      { q: "Will the price go up after my team is trained?", a: "Clinics that join during early access keep their plan price for 12 months. After that, any change comes with at least 30 days' written notice." }
    ]
  },
  {
    path: "/help",
    nav: "Clinic guide",
    title: "MeriDent clinic guide: set up, chart, bill and manage your team",
    description: "A step-by-step guide for dental clinics using MeriDent: first-day setup, registering patients, charting, prescriptions, billing, voiding a wrong invoice and team roles.",
    h1: "The MeriDent clinic guide",
    lead: "Everything a doctor or front desk needs on day one, in the order you will use it. You can also print the guide as a two-page PDF.",
    download: { href: "/MeriDent_Clinic_Guide.pdf", label: "Download the guide (PDF)" },
    sections: [
      { h: "First day", items: [
        "Sign in with your email and verify it from your inbox.",
        "In Practice Profile, add the clinic name, address, phone, UPI ID and logo. They appear on prescriptions and invoices.",
        "Invite your team from the Team section of Practice Profile with their email and a role."] },
      { h: "Register a patient", items: [
        "Open Patients & Odontogram and tap Add Patient.",
        "Enter the name, mobile, chief complaint and medical history at the desk.",
        "The chief complaint becomes the first visit note, so the doctor does not retype it."] },
      { h: "Chart and treat", items: [
        "Tap a tooth and pick a finding to colour it on the chart.",
        "Record each visit in Visit Notes, and tick conditions and allergies in Medical History. Tick No relevant history when there is nothing to record.",
        "Write a prescription and send it as a PDF on WhatsApp."] },
      { h: "Bill the visit", items: [
        "Open the patient's Billing tab and tap New invoice. GST is worked out for you.",
        "Record part-payments, share the UPI QR, or send the invoice on WhatsApp.",
        "For insurance or TPA patients, use the Claims tab to record the insurer, claim amounts and status, and see what insurers still owe. MeriDent tracks claims; it does not submit them.",
        "A wrong invoice can be voided by the owner or a manager with a reason. It stays on record and counts as zero. An invoice that already has a payment cannot be voided."] },
      { h: "Who can do what", items: [
        "Owner: everything, including the team, the activity log and voiding invoices.",
        "Manager: patients, diary, billing, stock and reports.",
        "Dentist: patients, diary and queue, with billing view only.",
        "Receptionist: patients, diary and billing, but no voiding and no X-rays or photos."] },
      { h: "Your data and safety", items: [
        "Export your data at any time. A daily encrypted backup runs automatically, and deleted items go to a recycle bin first.",
        "Each person signs in with their own email. Remove a team member the day they leave.",
        "Role limits are enforced on our servers, not only on screen."] }
    ],
    faqs: [
      { q: "Who do I contact if I am stuck?", a: "Message the founders on WhatsApp from the website. Tell us what you tapped and what you expected, and a screenshot helps." },
      { q: "Can I print the guide?", a: "Yes. Download the PDF above. It is two pages." }
    ]
  }
];

export const seoPageForPath = (pathname = "") => {
  const p = pathname.replace(/\/+$/, "") || "/";
  return SEO_PAGES.find((x) => x.path === p) || null;
};

export const sitemapXml = () =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  ["/", "/login", "/free-early-access", ...SEO_PAGES.map((p) => p.path), BLOG_PATH, ...BLOG_POSTS.map((b) => b.path)].map((p) => `  <url><loc>${SITE}${p === "/" ? "/" : p}</loc></url>`).join("\n") +
  `\n</urlset>\n`;
