/**
 * Privacy policy and terms of use, written to match what MeriDent actually does today.
 * Plain data so a test can check the facts and the page can render it. Have a lawyer review before relying on it.
 */
export const LEGAL_UPDATED = "11 November 2026";
export const CONTACT = { name: "Santhoshkumar S, Founder and Managing Director", whatsapp: "919043205927", display: "+91 90432 05927" };

export const PRIVACY = {
  title: "Privacy Policy",
  intro: "MeriDent is dental practice software. Clinics use it to keep patient records, appointments and bills. This page explains what information is stored, who can see it, and what you can ask us to do. It follows the principles of India's Digital Personal Data Protection Act, 2023.",
  sections: [
    { h: "Who is responsible for patient records", p: [
      "The clinic that enters a patient's details decides why and how they are used. We provide the software and store the records on the clinic's behalf. If you are a patient and want to see, correct or delete your record, ask your clinic first. We will help the clinic act on your request."] },
    { h: "What we store", p: [
      "For a clinic account: the sign-in email, clinic name, address, registration details and staff logins with their roles.",
      "For patients, as entered by the clinic: name, phone, age, gender, address, medical alerts and allergies, tooth charts, diagnoses, treatment plans, prescriptions, lab orders, signed consent forms, appointments, invoices and payments.",
      "For MeriDent Connect (the professional community): the posts, comments and images a dentist chooses to share. Clinics are asked not to include patient names or identifying details."] },
    { h: "How it is used", p: [
      "Records are used only to run the clinic's work: showing charts, booking appointments, billing, reminders and reports. We do not sell patient data and we do not show advertisements.",
      "We may look at technical logs to fix faults. We do not read patient records unless a clinic asks us for support and agrees to it."] },
    { h: "Where it is kept and who can see it", p: [
      "Data is stored with Google Firebase (Cloud Firestore and Firebase Authentication). Each clinic's records sit under its own account and are not visible to other clinics. Only people the clinic invites, with a role the clinic chooses, can open them. Branch-limited staff see only their branch.",
      "Our service providers are Google (data storage and sign-in), Vercel (website hosting) and, only when a clinic switches on Meridee writing help, Google (the Gemini AI service). They process data only to provide those services."] },
    { h: "Meridee writing help", p: [
      "Meridee also has a Help chat in the bottom right corner. It sends only the question a user types, and the recent chat, to the AI service so it can answer how to use MeriDent. Users are told not to type patient details.",
      "Meridee writing help is off by default. A clinic's owner or manager can switch it on in Practice Profile. When a user asks for a draft, only the text typed for that request, or the treatment names, teeth and amounts of the chosen plan, is sent to Google's Gemini service. On its free plan Google may keep this text and use it to improve its products, so clinics should not type anything they would not want kept. The patient's name and phone number are not sent.",
      "AI output is a draft. The dentist must read and edit it before saving or sending it, and it is not medical advice or a diagnosis."] },
    { h: "WhatsApp messages", p: [
      "MeriDent prepares a message and opens WhatsApp on the clinic's device. The clinic taps Send. The message goes through WhatsApp, which has its own privacy terms.",
      "A patient's consent to WhatsApp messages is recorded separately, and clinics should not message a patient who has not agreed or who has opted out."] },
    { h: "Consent", p: [
      "Clinics are responsible for getting a patient's permission to keep their record and to treat them. MeriDent provides consent forms with a signature for this. We recommend each clinic has its consent wording checked by its own adviser."] },
    { h: "How long we keep data", p: [
      "Records stay until the clinic deletes them or closes its account. Dental and medical records may need to be kept for a minimum period under professional and legal rules, so clinics should check before deleting. After an account is closed we delete its data within 90 days, unless the law requires us to keep something."] },
    { h: "Your choices", p: [
      "A clinic can download a full copy of its data at any time from Practice Profile, as a backup file or spreadsheets, and can move it to another system.",
      "You can ask to correct or delete your information, to withdraw consent, or to complain about how it is handled. Send the request to the contact below. We will reply within 30 days."] },
    { h: "Security", p: [
      "Access needs a verified sign-in. Connections are encrypted. Clinics control staff roles and can see an activity log of changes. No system is perfectly secure, so keep passwords private, remove staff who leave, and protect downloaded backups, which hold private health details unless a password is set.",
      "If we learn of a data breach that affects your information, we will tell the clinic without delay so it can inform patients as the law requires."] },
    { h: "Children", p: [
      "Records of patients under 18 are entered by the clinic, with a parent or guardian's consent. Sign-up to MeriDent is for dentists and clinic staff."] },
    { h: "Changes", p: [
      "If this policy changes in a way that matters, we will update the date on this page and tell clinics through the app."] },
  ],
};

export const TERMS = {
  title: "Terms of Use",
  intro: "These terms apply when a clinic or dentist signs up for MeriDent. By creating an account you agree to them.",
  sections: [
    { h: "The service", p: [
      "MeriDent is software to help run a dental practice. It supports your work. It is not medical advice, and it does not replace a dentist's judgment. You are responsible for the clinical decisions, treatment and records of your practice."] },
    { h: "Your account", p: [
      "You must be a registered dental practitioner or work for a clinic that is. Give correct details, keep passwords private, and give staff only the role they need. You are responsible for what happens under your account."] },
    { h: "Your data", p: [
      "The records you enter belong to you or your clinic. You give us permission to store and process them to run the service. You promise that you have the right and the patient's consent to enter them, and that you follow the laws and professional rules that apply to you, including those on patient confidentiality."] },
    { h: "What you must not do", p: [
      "Do not use MeriDent for anything unlawful, to harass others, or to try to reach another clinic's data. Do not post patient identity details in MeriDent Connect, or post misleading medical claims or advertising that the dental council rules forbid. Do not send WhatsApp messages to people who have not agreed to receive them."] },
    { h: "MeriDent Connect", p: [
      "You are responsible for what you post. We may remove posts that break these terms, and may suspend accounts that repeatedly do so."] },
    { h: "Fees", p: [
      "Fees, if any, are agreed with you before they start. We will give notice before any change in price."] },
    { h: "Availability and backups", p: [
      "We work to keep the service running, but it may sometimes be unavailable. Keep your own backups using the download feature, especially before making large changes."] },
    { h: "Limits on our responsibility", p: [
      "We provide the service as it is. To the extent the law allows, we are not responsible for indirect loss, or for loss caused by incorrect data entered by users, by treatment decisions, or by problems with services we depend on such as the internet, Google or WhatsApp. Nothing here limits any right you have that cannot be limited by law."] },
    { h: "Ending the account", p: [
      "You can stop using MeriDent and ask us to delete your clinic's data at any time. Download a copy first. We may suspend an account that breaks these terms, after telling you why where we can."] },
    { h: "Governing law", p: [
      "These terms are governed by the laws of India. Courts at Coimbatore, Tamil Nadu have jurisdiction."] },
  ],
};

export const PRICING = {
  title: "Pricing",
  intro: "MeriDent is free while we are in early access. There is no card to enter and no trial that runs out.",
  sections: [
    { h: "What you get today", p: [
      "Everything in the app, for your whole clinic: patient records with the tooth chart, appointments, treatment plans, GST invoices with UPI QR, stock, staff and roles, reports, branches, consent forms and MeriDent Connect."] },
    { h: "What happens later", p: [
      "We will introduce paid plans after early access. Clinics already using MeriDent will get at least 60 days' written notice, in the app and on WhatsApp, before any charge begins. You choose then whether to continue.",
      "Anything that costs us money per use, such as automatic WhatsApp reminders sent through Meta, would be an optional add-on. It would never be switched on without your say."] },
    { h: "Your data stays yours", p: [
      "Whatever happens with pricing, you can download a full copy of your records from Practice Profile at any time and take it elsewhere. We will not hold your data back."] },
    { h: "Questions about pricing", p: [
      "If you are a larger group or want to plan ahead, message us and we will tell you what we know."] },
  ],
};

export const PAGES = { privacy: PRIVACY, terms: TERMS, pricing: PRICING };
export const legalPageFromSearch = (search = "") => {
  const key = new URLSearchParams(search).get("page");
  return Object.prototype.hasOwnProperty.call(PAGES, key) ? key : null;
};
