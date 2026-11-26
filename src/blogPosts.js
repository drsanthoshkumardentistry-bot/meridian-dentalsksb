/* Blog posts for dental clinic owners. Plain data, like src/seoPages.js, so a test can check the facts and the sitemap.
 * Every post says we build MeriDent, and only describes what MeriDent does today. */
export const BLOG_PATH = "/blog";

export const BLOG_POSTS = [
  {
    slug: "how-to-choose-dental-software-india",
    path: "/blog/how-to-choose-dental-software-india",
    title: "How to choose dental software for your clinic in India | MeriDent",
    description: "Eight questions to ask before you pick dental practice software in India: charting, GST billing, data export, backups, offline use, staff roles, support and price.",
    h1: "How to choose dental software for your clinic in India",
    date: "2026-11-26",
    mins: 6,
    intro: "Most clinics pick software after one demo and live with the choice for years. Moving patient records later is slow and risky, so it pays to ask a few plain questions first. We build MeriDent, so we are not neutral, but the questions below apply to any product, ours included.",
    sections: [
      { h: "Start with your day, not the feature list", paras: [
        "Write down what goes wrong in a normal week: a patient who was double-booked, a balance nobody chased, a chart that sits in a notebook. The right software fixes those first. A long feature list you will never open does not help."] },
      { h: "Eight questions to ask every vendor", items: [
        "Charting: does it chart teeth the way you do, with a 32-tooth chart you can fill in within a few taps? Ask to try it on a real patient case.",
        "Billing: can it make a GST invoice, take part payments and show a UPI QR for the balance? Check how it treats exempt and taxable work on one invoice, and confirm the rates with your accountant.",
        "Your data: can you export patients, bills and visits whenever you like, without asking anyone? If the answer is vague, treat it as a no.",
        "Backups: where are copies kept, how often, and how can you check one yourself? A vendor who cannot explain this simply is a risk.",
        "Internet: what happens when the connection drops in the middle of a clinic day?",
        "Staff: can the receptionist take payments without seeing everything the owner sees? Look for separate roles and an activity log.",
        "Support: who answers when something breaks, how fast, and on which channel? WhatsApp support matters in a clinic.",
        "Price: is it written down in rupees, with notice before any change? Beware of a free tier that quietly stops being free."] },
      { h: "Try it for a week with real work", paras: [
        "A demo shows the best path. A week of real use shows everything else. Enter ten real patients, bill a few visits, book a day of appointments, then export your data and open the file. If anything feels slow or unclear on a busy morning, it will feel worse in month six."] },
      { h: "Red flags", items: [
        "No way to export your records.",
        "No clear answer on where your patient data lives or who can read it.",
        "Pressure to sign a long contract before you have used it.",
        "Reviews or client logos you cannot check."] },
      { h: "Where MeriDent fits, honestly", paras: [
        "MeriDent is practice software for Indian dental clinics, free during early access. It has a 32-tooth odontogram, treatment plans, GST invoices with a UPI QR, an appointments diary, WhatsApp reminders that open with the message ready, insurance and TPA claim tracking, and daily backups you can check.",
        "It is also young. Two dental students built it, it has no long track record or third-party reviews yet, it tracks insurance claims but does not submit them, and automatic WhatsApp sending and branch transfers are still on the way. If you need those today, say so and we will tell you plainly whether MeriDent fits."] }
    ],
    related: ["/dental", "/records-safety", "/dental-software-pricing"]
  },
  {
    slug: "go-paperless-dental-clinic",
    path: "/blog/go-paperless-dental-clinic",
    title: "How to go paperless in your dental clinic, step by step | MeriDent",
    description: "A practical plan to move a dental clinic from registers and paper files to digital records without stopping work: start with new patients, then charting, billing and backups.",
    h1: "How to go paperless in your dental clinic",
    date: "2026-11-26",
    mins: 6,
    intro: "Going paperless does not mean scanning every old file on a weekend. Clinics that succeed switch gradually, one part of the day at a time. This plan keeps the clinic running while you change. We build MeriDent, and the steps work with any software.",
    sections: [
      { h: "1. Pick a start date and a rule", paras: [
        "Choose a Monday and set one rule: every new patient from that day goes into the software only. Old patients stay on paper until they come back. Nobody has to retype a thousand files, and the paper pile stops growing."] },
      { h: "2. Move the front desk first", items: [
        "Register new patients on a screen: name, mobile number, chief complaint and medical history.",
        "Book appointments in a digital diary that warns about double bookings.",
        "Send reminders on WhatsApp the day before."] },
      { h: "3. Chart on the chair", paras: [
        "Chart findings on a tooth chart as you examine, and write visit notes straight after. The first week is slower while you learn it. After that the chief complaint is already there and each visit starts from the last note."] },
      { h: "4. Prescriptions, consents and bills", items: [
        "Print or send prescriptions as a PDF with your clinic name and logo.",
        "Take treatment consents with an on-screen signature and keep them on the patient's record.",
        "Make every invoice digital, with part payments recorded against it."] },
      { h: "5. Bring old patients in as they return", paras: [
        "When an old patient walks in, enter their details once and chart from there. Scan only what you still need: a key radiograph or a signed consent. Keep the paper file in a cupboard rather than shredding it."] },
      { h: "6. Make backups part of the routine", paras: [
        "Paper can burn or flood, and digital records can be lost too. Keep your own copy: download a backup on a schedule and store it away from the clinic computer. Open it once to check it works. Ask your vendor how their copies are made and how you can verify them."] },
      { h: "A note on record-keeping rules", paras: [
        "How long you must keep patient records, and in what form, depends on your state dental council and local law. Check with your council or a lawyer before you throw anything away."] },
      { h: "How MeriDent helps", paras: [
        "MeriDent covers steps 2 to 6: registration, diary, charting, prescriptions, consents, GST billing, a printable patient record and daily backups. It runs in a browser, so there is nothing to install, and it is free during early access."] }
    ],
    related: ["/dental-patient-records", "/dental-appointment-scheduling-software", "/dental-prescription-software"]
  },
  {
    slug: "reduce-dental-no-shows",
    path: "/blog/reduce-dental-no-shows",
    title: "How to reduce no-shows in a dental clinic | MeriDent",
    description: "Practical ways to cut missed dental appointments: day-before WhatsApp reminders, confirmed bookings, a recall list, a walk-in queue and tracking why patients do not come.",
    h1: "How to reduce no-shows in a dental clinic",
    date: "2026-11-26",
    mins: 5,
    intro: "An empty chair is lost income and a wasted slot. You cannot remove no-shows completely, but a few small habits cut them. We build MeriDent, and these habits work with a diary and a phone.",
    sections: [
      { h: "Remind on the day before", paras: [
        "A WhatsApp message the day before, with the time, the doctor and the clinic address, helps with forgotten appointments. Write it once and reuse it. A short, polite message gets more replies than a long one."] },
      { h: "Ask for a reply", paras: [
        "End the reminder with a question that needs an answer, such as Reply YES to confirm or tell us if you want another time. A patient who replies has told you they intend to come, and a patient who says they cannot come frees the slot for someone else."] },
      { h: "Confirm bookings, do not just accept them", paras: [
        "When patients book through a link or a message, confirm the slot back to them in writing. A booking that you confirmed feels firmer than one that was only requested."] },
      { h: "Recall patients before they drift", paras: [
        "Keep a list of patients due a six-month check-up and message them in batches. Opt-outs must be respected: a patient who asked not to be contacted should never be on the list."] },
      { h: "Use the empty slot", items: [
        "Keep a walk-in queue, with urgent cases first, so a cancelled slot is filled the same hour.",
        "Keep a short list of patients who asked for an earlier date, and message them when a slot opens."] },
      { h: "Find out why", paras: [
        "Mark every visit as Completed, No show or Cancelled, and ask the no-shows why when they next come. After a month you will see whether the cause is cost, distance, fear or forgetfulness. Each one needs a different fix."] },
      { h: "How MeriDent helps, and what it does not do", paras: [
        "MeriDent shows who to remind for tomorrow and opens WhatsApp with the message already written, so you tap Send. It warns before a double booking and keeps a walk-in queue and a six-month recall list. It does not send WhatsApp messages by itself yet, and we do not promise a particular drop in no-shows. That depends on your patients and how you follow up."] }
    ],
    related: ["/whatsapp-reminders", "/online-booking", "/dental-appointment-scheduling-software"]
  },
  {
    slug: "dental-clinic-data-backup",
    path: "/blog/dental-clinic-data-backup",
    title: "Dental clinic data backup: how to never lose patient records | MeriDent",
    description: "A simple backup plan for a dental clinic: keep more than one copy, store one away from the clinic, protect it with a password, and test a restore before you need it.",
    h1: "Dental clinic data backup: how to never lose patient records",
    date: "2026-11-26",
    mins: 5,
    intro: "Patient records are the one thing a clinic cannot rebuild. A stolen laptop, a failed disk, a ransomware message or a vendor shutting down can all take them away. A short backup routine protects you from all of them. We build MeriDent, and the advice applies to any system.",
    sections: [
      { h: "Keep three copies, in two places", paras: [
        "A common rule is three copies of your data: the live one plus two backups, with at least one stored away from the clinic. If one copy fails, another survives. A single backup on the same computer is not enough, because whatever kills the computer also kills the backup."] },
      { h: "A backup you have not opened is only a hope", paras: [
        "Once a month, open a backup and check it. Do the patient and invoice counts look right? Does the file open at all? A restore test on a copy, not on live data, tells you whether recovery will work on the day you need it."] },
      { h: "Protect the file", items: [
        "A backup holds private health details, so give it a password and keep the password in a password manager, not on a sticky note.",
        "Store backup files only on devices you control, not on a shared family computer.",
        "Keep the key or password in two places that two trusted people can reach."] },
      { h: "Questions to ask your software vendor", items: [
        "How often are copies made, and where are they kept?",
        "Can I download a full copy of my data myself, at any time, without asking?",
        "How long are old copies kept, and who can open them?",
        "Can I check that a copy exists and is complete?",
        "What happens to my data if you shut down?"] },
      { h: "What MeriDent does today", paras: [
        "MeriDent saves a cloud restore point of your clinic once a day, keeping the newest 7, then weekly and monthly ones. You can download a full backup with an optional password, and the bell reminds you every three days. We also keep our own encrypted daily copy for 90 days that only a private key we hold can open, and a daily check confirms it ran and that it can be unlocked. Deleted patients and invoices stay in a recycle bin for 30 days.",
        "No system is perfectly safe. Keep your own copy as well, and keep your original X-ray and photo files, because backups cover patients, appointments, invoices, stock, staff and the clinic profile but not the original pictures."] }
    ],
    related: ["/records-safety", "/dental-patient-records"]
  }
];

export const blogPostForPath = (pathname = "") => {
  const p = pathname.replace(/\/+$/, "") || "/";
  return BLOG_POSTS.find((x) => x.path === p) || null;
};

export const isBlogIndex = (pathname = "") => (pathname.replace(/\/+$/, "") || "/") === BLOG_PATH;
