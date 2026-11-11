/* ==============================================================================
 * MERIDENT OS - COMMERCIAL HEALTHCARE PRODUCTION SUITE
 * Preserves exact original UI styling, typography, layout, and color palette.
 * Enhanced with Institutional Hospital EHR, Inter-Department Referrals & Systemic Alerts.
 * File: src/App.jsx
 * ============================================================================== */

import { AGING_BUCKETS, agingSummary, filterInvoices, invoiceAgeDays } from "./receivables.js";
import { toggleFinding, normalizeConditions, chartedCount as chartedTeeth } from "./odontogram.js";
import { billingSummary, invoiceView, invoicesCsv, buildInvoiceMessage, isOverdue, daysOverdue, dueDateIn } from "./billingView.js";
import { adjustStock, buildStockItem, stockState, stockSummary, stockView, buildReorderMessage } from "./stock.js";
import { APPT_STATUSES, findClash, diarySummary, diaryView, withStatus, needsUpdate } from "./diary.js";
import { LEAVE_TYPES, buildLeave, setLeaveStatus, removeLeave, leaveDays, onLeaveOn, buildReview, averageRating, staffAlerts } from "./staff.js";
import GlobalSearch from "./components/GlobalSearch.jsx";
import ActivityLog from "./components/ActivityLog.jsx";
import { buildAuditEntry } from "./audit.js";
import { writeAudit, watchAudit } from "./auditStore.js";
import TeamCard from "./components/TeamCard.jsx";
import { canRead, canWrite, navFor, NAV_BY_ROLE, firstScreen, branchScope, ROLE_LABEL } from "./roles.js";
import { isActiveMember, isPendingInvite, buildInvite, inviteMessage } from "./team.js";
import { watchMyMembership, watchTeam, createInvite, acceptInvite, updateMember, removeMember } from "./teamStore.js";
import BranchesCard from "./components/BranchesCard.jsx";
import DataPortability from "./components/DataPortability.jsx";
import { buildPatientBackup, backupFileName } from "./portability.js";
import { branchesOf, filterByBranch, writeBranchId, tagBranch, scopeToBranches } from "./branches.js";
import QueuePanel from "./components/QueuePanel.jsx";
import BookingRequests from "./components/BookingRequests.jsx";
import Assessments from "./components/Assessments.jsx";
import { draftVisitNote } from "./clinicalNote.js";
import { askAi } from "./aiClient.js";
import HelpChat from "./components/HelpChat.jsx";
import { addAssessment, removeAssessment } from "./assessments.js";
import { addWalkIn, setQueueStatus, pruneQueue } from "./queue.js";
import { buildBookingPage, bookingUrl, requestToAppointment } from "./booking.js";
import { publishBookingPage, watchBookingRequests, markBookingRequest } from "./bookingStore.js";
import { patientSummary } from "./patientSummary.js";
import { buildVisit, addVisit, removeVisit } from "./visits.js";
import { shiftDay, dayGrid, hourMarks } from "./dayView.js";
import OpgViewer from "./components/OpgViewer.jsx";
import Connect from "./components/Connect.jsx";
import { bindApi } from "./connect/api.js";
import { geocodeAddress } from "./connect/geo.js";
import Odontogram from "./components/Odontogram.jsx";
import TreatmentPlans from "./components/TreatmentPlans.jsx";
import { planToInvoiceItems, markPlanBilled, plannedTeeth, planTotals } from "./plans.js";
import ConsentForms from "./components/ConsentForms.jsx";
import { consentHtml } from "./consent.js";
import BranchCompare from "./components/BranchCompare.jsx";
import { languageOf } from "./messageLanguage.js";
import SetupChecklist from "./components/SetupChecklist.jsx";
import { setupProgress } from "./setup.js";
import DayClose from "./components/DayClose.jsx";
import BirthdayPanel from "./components/BirthdayPanel.jsx";
import { dayClose } from "./dayClose.js";
import { dueBirthdays, buildBirthdayMessage, markGreeted } from "./greetings.js";
import FeeList from "./components/FeeList.jsx";
import { applyFee, sortedFees } from "./fees.js";
import DentistEarnings from "./components/DentistEarnings.jsx";
import BookingShare from "./components/BookingShare.jsx";
import { dentistEarnings, dentistEarningsCsv, cleanPct } from "./dentistReport.js";
import { branchComparison, branchComparisonCsv } from "./branchReport.js";
import LabOrders from "./components/LabOrders.jsx";
import LabBoard from "./components/LabBoard.jsx";
import { openLabOrders, overdueCount as labOverdueCount, knownLabs, moveLabOrder, buildLabChase, buildPatientReady, markPatientNotified } from "./lab.js";
import FollowUpPanels, { ReviewInvites } from "./components/FollowUpPanels.jsx";
import {
  dueFeedbackRequests, awaitingRatings, lowRatings, feedbackSummary, buildFeedbackMessage, markFeedbackAsked, recordRating, resolveFeedback,
  buildReviewMessage, markReviewAsked, isValidReviewLink, duePlanFollowUps, buildPlanFollowUp, markPlanFollowedUp
} from "./followup.js";
import { createShare, fetchShare, deleteShare } from "./planShare.js";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Menu,
  X,
  Search,
  Plus,
  Network,
  Trash2,
  Share2,
  Eye,
  Upload,
  Calendar,
  Users,
  Sun,
  DollarSign,
  Package,
  Briefcase,
  UserCheck,
  Send,
  CheckCircle2,
  Clock,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  QrCode,
  Download,
  FileSpreadsheet,
  Settings,
  Baby,
  Activity,
  Layers,
  Ruler,
  Phone,
  FileText,
  User,
  HeartPulse,
  LogIn,
  LogOut,
  ArrowUpRight,
  ShieldAlert,
  ClipboardCheck,
  Bell,
  Star,
  BarChart3,
  IndianRupee,
  LayoutDashboard,
  CalendarDays,
  ScanSearch,
  MessagesSquare,
  UserCog,
  Hospital,
  Wallet,
  UsersRound
} from "lucide-react";

// Safe dynamic import from ./firebase
import * as FirebaseModule from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, setDoc, onSnapshot, deleteDoc } from "firebase/firestore";
import LandingPage from "./components/landingpage";
import { AppLoading, VerifyEmailScreen, IdleWarning } from "./components/AuthScreens";
import { friendlyAuthError, usesPasswordLogin } from "./authErrors";
import {
  dateKey, dueAppointmentReminders, buildAppointmentReminder, duePaymentReminders, buildPaymentReminder,
  whatsappLink, markAppointmentReminded, markInvoiceReminded, formatTime12,
  dueRecalls, buildRecallMessage, markPatientRecalled, RECALL_OPTIONS, DEFAULT_RECALL_MONTHS, whatsappNumber } from "./reminders";
import {
  MODE_KEYS, currentMonthKey, collectionsForMonth, gstSummaryForMonth, outstandingTotalP,
  collectionsCsv, gstRegisterCsv, buildReportHtml, monthLabel,
} from "./reports";
import {
  TAX_CATEGORIES, MAX_LINE_ITEMS, computeLineItemTotals, nextInvoiceNumber, normalizeInvoice, addPayment,
  paidPaise, balancePaise, paymentStatus, buildUpiUri, isValidUpiId, buildInvoiceHtml, formatINR, toPaise,
} from "./billing";

const auth = FirebaseModule.auth;
const db = FirebaseModule.db;
const storage = FirebaseModule.storage;
const firebaseConfigured = Boolean(auth && FirebaseModule.firebaseConfigured !== false);
const loginWithGoogle = FirebaseModule.loginWithGoogle || (async () => {});
const logoutUser = FirebaseModule.logoutUser || (async () => {});
const signInWithEmail = FirebaseModule.signInWithEmail || (async () => {});
const signUpWithEmail = FirebaseModule.signUpWithEmail || (async () => {});
const sendPasswordReset = FirebaseModule.sendPasswordReset || (async () => {});
const resendVerificationEmail = FirebaseModule.resendVerificationEmail || (async () => {});
const refreshVerifiedStatus = FirebaseModule.refreshVerifiedStatus || (async () => false);
const completeRedirectLogin = FirebaseModule.completeRedirectLogin || (async () => null);

// --- DENTITION SCHEMAS (FDI TWO-DIGIT SYSTEM) ---
const PERMANENT_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const PERMANENT_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const DECIDUOUS_UPPER = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const DECIDUOUS_LOWER = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

// Exact palette items matching screenshot (73145.jpg)
const CLINICAL_PALETTE = [
  { id: "HLT", label: "Healthy", border: "border-emerald-300", bg: "bg-emerald-50/60", text: "text-emerald-700" },
  { id: "CAR", label: "Caries", border: "border-rose-200", bg: "bg-rose-50/60", text: "text-rose-600" },
  { id: "RES", label: "Restored", border: "border-sky-200", bg: "bg-sky-50/60", text: "text-sky-600" },
  { id: "RCT", label: "RCT Done", border: "border-purple-200", bg: "bg-purple-50/60", text: "text-purple-600" },
  { id: "CRW", label: "Crown", border: "border-amber-200", bg: "bg-amber-50/60", text: "text-amber-600" },
  { id: "BRG", label: "Bridge (under crown)", border: "border-indigo-200", bg: "bg-indigo-50/60", text: "text-indigo-600" },
  { id: "IMP", label: "Implanted", border: "border-teal-200", bg: "bg-teal-50/60", text: "text-teal-600" },
  { id: "FRC", label: "Fractured (Trauma)", border: "border-rose-400 ring-2 ring-rose-200", bg: "bg-rose-50", text: "text-rose-700" },
  { id: "SPC", label: "Spacing", border: "border-cyan-200", bg: "bg-cyan-50/60", text: "text-cyan-600" },
  { id: "ATT", label: "Attrited", border: "border-orange-200", bg: "bg-orange-50/60", text: "text-orange-600" },
  { id: "MAL", label: "Malaligned", border: "border-fuchsia-200", bg: "bg-fuchsia-50/60", text: "text-fuchsia-600" },
  { id: "PRM", label: "Paramolar", border: "border-pink-200", bg: "bg-pink-50/60", text: "text-pink-600" },
  { id: "SCL", label: "Calculus (scaling)", border: "border-yellow-200", bg: "bg-yellow-50/60", text: "text-yellow-600" },
  { id: "DEF", label: "Deformities", border: "border-purple-200", bg: "bg-purple-50/60", text: "text-purple-600" },
  { id: "BND", label: "Bone Deformations", border: "border-rule", bg: "bg-enamel", text: "text-slate-600" },
  { id: "MIS", label: "Missing / Extracted", border: "border-slate-300", bg: "bg-slate-100", text: "text-slate-600" },
];

// Institutional Dental Specialty Referral Departments
const DENTAL_DEPARTMENTS = [
  { id: "omfs", code: "OMFS", name: "Oral & Maxillofacial Surgery", room: "Room 2" },
  { id: "perio", code: "PERIO", name: "Periodontics & Implantology", room: "Room 3" },
  { id: "cons", code: "CONS", name: "Conservative Dentistry & Endodontics", room: "Room 4" },
  { id: "ortho", code: "ORTHO", name: "Orthodontics & Dentofacial", room: "Room 5" },
  { id: "pedo", code: "PEDO", name: "Pediatric & Preventive Dentistry", room: "Room 6" },
  { id: "prostho", code: "PROSTHO", name: "Prosthodontics & Crown-Bridge", room: "Room 7" },
  { id: "omr", code: "OMR", name: "Oral Medicine & Radiology", room: "Room 1" },
  { id: "phd", code: "PHD", name: "Public Health Dentistry", room: "Room 8" }
];

const PRESET_MEDICATIONS = [
  { name: "Zerodol-SP", generic: "Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg", frequency: "1-0-1", duration: "3 Days", timing: "After Food" },
  { name: "Moxikind-CV 625", generic: "Amoxicillin 500mg + Clavulanic Acid 125mg", frequency: "1-0-1", duration: "5 Days", timing: "After Food" },
  { name: "Ketorol-DT", generic: "Ketorolac Tromethamine 10mg (Dispersible)", frequency: "SOS", duration: "2 Days", timing: "Dissolve in half cup water" },
  { name: "Metrogyl 400", generic: "Metronidazole 400mg", frequency: "1-1-1", duration: "3 Days", timing: "After Food" },
  { name: "Rexidin 0.2%", generic: "Chlorhexidine Gluconate 0.2% w/v Mouthwash", frequency: "1-0-1", duration: "7 Days", timing: "10ml rinse for 1 min after brushing" },
  { name: "Kenacort 0.1%", generic: "Triamcinolone Acetonide 0.1% Oral Paste", frequency: "0-0-1", duration: "5 Days", timing: "Apply thinly at bedtime over ulcer" },
];

// ---------------------------------------------------------------------------
// Cloud sync helpers: every record is stored under clinics/{uid}/..., one
// Firestore document per record, with offline support and safe IDs.
// ---------------------------------------------------------------------------
const newId = (prefix) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

const blankInvoiceItem = () => ({ id: newId("LI"), description: "", amount: "", taxCategory: "therapeutic" });

const byIdDesc = (a, b) => String(b.id).localeCompare(String(a.id));

const stableStringify = (value) =>
  JSON.stringify(value, (key, val) =>
    val && typeof val === "object" && !Array.isArray(val)
      ? Object.keys(val)
          .sort()
          .reduce((acc, k) => {
            acc[k] = val[k];
            return acc;
          }, {})
      : val
  );

// Invoice numbers contain "/" which is not allowed inside a Firestore document id
const cloudDocId = (id) => String(id).replace(/\//g, "_");

const cleanForCloud = (value) => JSON.parse(JSON.stringify(value));

const SYNC_FAILED = "__sync_failed__";
const SYNC_DELETING = "__sync_deleting__";

function useCloudCollection({ clinicId, ready, name, items, setItems, sortFn, onError, readOnly = false }) {
  const synced = useRef(new Map());
  const itemsRef = useRef(items);
  const [loaded, setLoaded] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const onErrorRef = useRef(onError);
  const setItemsRef = useRef(setItems);
  const sortFnRef = useRef(sortFn);

  useEffect(() => {
    itemsRef.current = items;
    onErrorRef.current = onError;
    setItemsRef.current = setItems;
    sortFnRef.current = sortFn;
  }, [items, onError, setItems, sortFn]);

  // Listen to this clinic's collection
  useEffect(() => {
    synced.current = new Map();
    setLoaded(false);
    if (!db || !clinicId || !ready) return undefined;

    let first = true;
    const unsubscribe = onSnapshot(
      collection(db, "clinics", clinicId, name),
      (snapshot) => {
        const remote = new Map();
        snapshot.docs.forEach((d) => {
          const data = d.data();
          const id = String(data.id ?? d.id);
          remote.set(id, { ...data, id: data.id ?? d.id });
        });

        const local = itemsRef.current;
        const localById = new Map(local.map((it) => [String(it.id), it]));
        const next = [];

        remote.forEach((remoteItem, id) => {
          const known = synced.current.get(id);
          const localItem = localById.get(id);
          if (localItem === undefined && known !== undefined) {
            // Deleted on this device and the delete is still in flight: do not bring it back
            return;
          }
          if (
            localItem !== undefined &&
            known !== undefined &&
            stableStringify(cleanForCloud(localItem)) !== known
          ) {
            // Unsaved local edits: keep them
            next.push(localItem);
            return;
          }
          synced.current.set(id, stableStringify(remoteItem));
          next.push(remoteItem);
        });

        local.forEach((localItem) => {
          const id = String(localItem.id);
          if (remote.has(id)) return;
          // Keep items that were never uploaded yet; drop items deleted on another device
          if (first || !synced.current.has(id)) next.push(localItem);
        });

        first = false;
        const sorter = sortFnRef.current;
        setItemsRef.current(sorter ? [...next].sort(sorter) : next);
        setLoaded(true);
      },
      (error) => {
        if (onErrorRef.current) onErrorRef.current(error);
      }
    );
    return () => unsubscribe();
  }, [clinicId, ready, name]);

  // Save changes (debounced) and propagate deletions
  useEffect(() => {
    if (!db || !clinicId || !ready || !loaded || readOnly) return undefined;

    const timer = setTimeout(() => {
      const currentIds = new Set();

      items.forEach((item) => {
        if (item === null || item === undefined || item.id === null || item.id === undefined) return;
        const id = String(item.id);
        currentIds.add(id);
        const clean = cleanForCloud(item);
        const json = stableStringify(clean);
        if (synced.current.get(id) === json) return;
        synced.current.set(id, json);
        setDoc(doc(db, "clinics", clinicId, name, cloudDocId(id)), clean).catch((error) => {
          synced.current.set(id, SYNC_FAILED);
          if (onErrorRef.current) onErrorRef.current(error);
          setTimeout(() => setRetryTick((t) => t + 1), 10000);
        });
      });

      Array.from(synced.current.entries()).forEach(([id, value]) => {
        if (currentIds.has(id) || value === SYNC_DELETING) return;
        synced.current.set(id, SYNC_DELETING);
        deleteDoc(doc(db, "clinics", clinicId, name, cloudDocId(id)))
          .then(() => synced.current.delete(id))
          .catch((error) => {
            synced.current.delete(id);
            if (onErrorRef.current) onErrorRef.current(error);
          });
      });
    }, 700);

    return () => clearTimeout(timer);
  }, [items, loaded, retryTick, clinicId, ready, name, readOnly]);
}

function useCloudDoc({ clinicId, ready, name, value, setValue, onError, readOnly = false }) {
  const syncedJson = useRef(null);
  const valueRef = useRef(value);
  const onErrorRef = useRef(onError);
  const setValueRef = useRef(setValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    valueRef.current = value;
    onErrorRef.current = onError;
    setValueRef.current = setValue;
  }, [value, onError, setValue]);

  useEffect(() => {
    syncedJson.current = null;
    setLoaded(false);
    if (!db || !clinicId || !ready) return undefined;

    const unsubscribe = onSnapshot(
      doc(db, "clinics", clinicId, "store", name),
      (snapshot) => {
        if (snapshot.exists()) {
          const remote = snapshot.data();
          const remoteJson = stableStringify(remote);
          const dirty =
            syncedJson.current !== null &&
            stableStringify(cleanForCloud(valueRef.current)) !== syncedJson.current;
          if (!dirty && remoteJson !== syncedJson.current) {
            syncedJson.current = remoteJson;
            setValueRef.current(remote);
          }
        }
        setLoaded(true);
      },
      (error) => {
        if (onErrorRef.current) onErrorRef.current(error);
      }
    );
    return () => unsubscribe();
  }, [clinicId, ready, name]);

  useEffect(() => {
    if (!db || !clinicId || !ready || !loaded || readOnly) return undefined;
    const clean = cleanForCloud(value);
    const json = stableStringify(clean);
    if (json === syncedJson.current) return undefined;
    const timer = setTimeout(() => {
      syncedJson.current = json;
      setDoc(doc(db, "clinics", clinicId, "store", name), clean).catch((error) => {
        syncedJson.current = SYNC_FAILED;
        if (onErrorRef.current) onErrorRef.current(error);
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [value, loaded, clinicId, ready, name, readOnly]);
}

// ---------------------------------------------------------------------------
// Data entry helpers: required demographics, validation and shared form pieces
// ---------------------------------------------------------------------------
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];
const BLOOD_GROUPS = ["Unknown", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const LANGUAGES = ["English", "Tamil", "Hindi", "Telugu", "Malayalam", "Kannada"];
const REFERRAL_SOURCES = ["Walk-in", "Doctor referral", "Friend / family", "Google / website", "Social media", "Camp / school", "Other"];
const GUARDIAN_RELATIONS = ["Mother", "Father", "Guardian", "Other"];
const TOBACCO_OPTIONS = ["Not recorded", "None", "Smoking", "Smokeless tobacco", "Betel quid / areca nut", "More than one"];
const ALCOHOL_OPTIONS = ["Not recorded", "None", "Occasional", "Regular"];
const BRUSHING_OPTIONS = ["Not recorded", "Not daily", "Once daily", "Twice daily", "More than twice"];
const DIET_OPTIONS = ["Not recorded", "Vegetarian", "Mixed", "Eggetarian", "Vegan"];
const PAYMENT_MODES = ["Cash", "UPI", "Card", "Net banking"];
const VISIT_TYPES = ["New patient", "Follow-up", "Review", "Emergency"];
const COUNCIL_NAMES = ["Dental Council of India", "Tamil Nadu Dental Council", "Karnataka State Dental Council", "Kerala State Dental Council", "Andhra Pradesh State Dental Council", "Telangana State Dental Council", "Maharashtra State Dental Council", "Other State Dental Council"];

const digitsOnly = (value) => String(value || "").replace(/\D/g, "");
const normalizePhone = (value) => {
  const d = digitsOnly(value);
  return d.length === 12 && d.startsWith("91") ? d.slice(2) : d;
};
const isValidMobile = (value) => /^[6-9]\d{9}$/.test(normalizePhone(value));
const isValidPincode = (value) => /^[1-9]\d{5}$/.test(String(value || "").trim());
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || "").trim());
const isValidGstin = (value) => /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(String(value || "").trim().toUpperCase());
const isValidAbha = (value) => digitsOnly(value).length === 14;

const ageFromDob = (dob) => {
  if (!dob) return "";
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age <= 120 ? String(age) : "";
};

const patientLocation = (p) => [p.area, p.city].filter(Boolean).join(", ");

const licenseStatus = (expiry) => {
  if (!expiry) return { label: "Expiry not set", tone: "text-slate-500" };
  const end = new Date(expiry);
  if (Number.isNaN(end.getTime())) return { label: "Expiry not set", tone: "text-slate-500" };
  const days = Math.ceil((end.getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: `Expired ${Math.abs(days)} days ago`, tone: "text-rose-700 font-semibold" };
  if (days <= 60) return { label: `Expires in ${days} days`, tone: "text-amber-700 font-medium" };
  return { label: `Valid until ${end.toLocaleDateString("en-IN")}`, tone: "text-emerald-700" };
};

const EMPTY_PATIENT_FORM = {
  name: "", phone: "", dob: "", age: "", gender: "",
  area: "", city: "", pincode: "", email: "",
  guardianName: "", guardianRelation: "Mother", guardianPhone: "",
  bloodGroup: "Unknown", occupation: "", language: "English", referredBy: "Walk-in",
  emergencyName: "", emergencyPhone: "", abhaNumber: "",
  pregnancy: "Not applicable", chiefComplaint: "",
  conditions: "None reported", allergies: "NKDA", medicalAlert: "",
  consentTreatment: false, consentWhatsapp: true,
};

// Returns the first problem found, or an empty string when the form is valid
const validatePatientForm = (f) => {
  if (!f.name.trim()) return "Full name is required";
  if (!isValidMobile(f.phone)) return "Enter a valid 10-digit Indian mobile number";
  const age = Number(f.age);
  if (f.age === "" || Number.isNaN(age) || age < 0 || age > 120) return "Enter a valid age (0 to 120)";
  if (!f.gender) return "Please select a gender";
  if (f.pincode && !isValidPincode(f.pincode)) return "Pincode must be 6 digits";
  if (f.email && !isValidEmail(f.email)) return "Enter a valid email address";
  if (age < 18 && !f.guardianName.trim()) return "Guardian name is required for patients under 18";
  if (f.guardianPhone && !isValidMobile(f.guardianPhone)) return "Guardian phone must be a valid 10-digit mobile number";
  if (f.emergencyPhone && !isValidMobile(f.emergencyPhone)) return "Emergency contact phone must be a valid 10-digit mobile number";
  if (f.abhaNumber && !isValidAbha(f.abhaNumber)) return "ABHA number must have 14 digits";
  if (!f.consentTreatment) return "Consent for examination, treatment and record keeping is required";
  return "";
};

const fieldInputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 bg-white";

function Field({ label, required, hint, className = "", children }) {
  return (
    <div className={className}>
      <label className="block font-semibold text-slate-600 mb-1">
        {label}
        {required ? " *" : ""}
      </label>
      {children}
      {hint ? <p className="text-[10px] text-slate-500 mt-1">{hint}</p> : null}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 pt-1">{children}</div>;
}

const IDLE_WARN_MS = 29 * 60 * 1000;
const IDLE_LOGOUT_MS = 30 * 60 * 1000;

// Signs the user out after 30 minutes without activity (warns 60 seconds before)
function useIdleTimeout({ enabled, onTimeout }) {
  const lastActivity = useRef(Date.now());
  const warningVisible = useRef(false);
  const onTimeoutRef = useRef(onTimeout);
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    if (!enabled) {
      warningVisible.current = false;
      setSecondsLeft(null);
      return undefined;
    }
    lastActivity.current = Date.now();
    warningVisible.current = false;

    const markActive = () => {
      if (!warningVisible.current) lastActivity.current = Date.now();
    };
    const eventNames = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    eventNames.forEach((name) => window.addEventListener(name, markActive, { passive: true }));

    const timer = setInterval(() => {
      const idle = Date.now() - lastActivity.current;
      if (idle >= IDLE_LOGOUT_MS) {
        clearInterval(timer);
        warningVisible.current = false;
        setSecondsLeft(null);
        if (onTimeoutRef.current) onTimeoutRef.current();
      } else if (idle >= IDLE_WARN_MS) {
        warningVisible.current = true;
        setSecondsLeft(Math.max(1, Math.ceil((IDLE_LOGOUT_MS - idle) / 1000)));
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      eventNames.forEach((name) => window.removeEventListener(name, markActive));
    };
  }, [enabled]);

  const stay = () => {
    lastActivity.current = Date.now();
    warningVisible.current = false;
    setSecondsLeft(null);
  };

  return { secondsLeft, stay };
}

const DEFAULT_EMPLOYEES = [];
const DEFAULT_PROFILE = {
  name: "My Dental Clinic",
  tagline: "",
  regNumber: "",
  drName: "",
  qualification: "",
  phone: "",
  email: "",
  upiId: "",
  address: "",
  city: "",
  pincode: "",
  state: "",
  gstin: "",
  dentalCouncil: "",
  councilRegNumber: "",
  onlineBooking: false,
  reviewLink: ""
};

export default function App() {

  // Firebase authentication gate
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [emailVerifiedNow, setEmailVerifiedNow] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState("");

  // Google accounts are verified by Google; email-and-password accounts must verify their address first
  const isVerified = Boolean(authUser && (authUser.emailVerified || emailVerifiedNow || !usesPasswordLogin(authUser)));
  // Every signed-in, verified account gets its own isolated clinic workspace
  // A signed-in person is either the owner of their own clinic or an accepted team member of someone else's.
  const [membership, setMembership] = useState(null);
  const [membershipReady, setMembershipReady] = useState(false);
  const activeMember = authUser && isActiveMember(membership) && membership.clinicId !== authUser.uid ? membership : null;
  const pendingInvite = authUser && isPendingInvite(membership) && membership.clinicId !== authUser.uid ? membership : null;
  const role = activeMember ? activeMember.role : "owner";
  const CLINIC_ID = isVerified && membershipReady ? (activeMember ? activeMember.clinicId : authUser.uid) : null;
  // Team members keep their own device cache so they never read or overwrite the owner's
  const CACHE_ID = CLINIC_ID && activeMember ? `${CLINIC_ID}_s${authUser.uid}` : CLINIC_ID;

  useEffect(() => {
    if (!isVerified || !authUser?.email || !db) {
      setMembership(null);
      setMembershipReady(Boolean(isVerified) || !authUser);
      return undefined;
    }
    setMembershipReady(false);
    // If the answer is slow (first visit while offline), open the person's own clinic rather than wait forever.
    // A real membership still takes over the moment it arrives.
    const fallback = setTimeout(() => setMembershipReady(true), 4000);
    const stop = watchMyMembership(
      db,
      authUser.email,
      (m) => { clearTimeout(fallback); setMembership(m); setMembershipReady(true); },
      () => { clearTimeout(fallback); setMembership(null); setMembershipReady(true); }
    );
    return () => { clearTimeout(fallback); stop(); };
  }, [isVerified, authUser?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!firebaseConfigured || !auth) {
      setAuthLoading(false);
      return undefined;
    }
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setAuthUser(user || null);
        setEmailVerifiedNow(false);
        setVerifyNotice("");
        setAuthLoading(false);
      },
      (error) => {
        console.error("Authentication state error:", error);
        setAuthError("Could not verify your login. Please refresh and try again.");
        setAuthLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  // Finish a Google sign-in that used a full-page redirect (phone browsers that block pop-ups)
  useEffect(() => {
    if (!firebaseConfigured || !auth) return;
    completeRedirectLogin().catch((error) => setAuthError(friendlyAuthError(error)));
  }, []);

  const runAuthAction = async (action) => {
    setAuthError("");
    setAuthNotice("");
    setLoginBusy(true);
    try {
      await action();
    } catch (error) {
      setAuthError(friendlyAuthError(error));
    } finally {
      setLoginBusy(false);
    }
  };

  const handleGoogleLogin = () => runAuthAction(() => loginWithGoogle());
  const handleEmailSignIn = (email, password) => runAuthAction(() => signInWithEmail(email, password));
  const handleEmailSignUp = (name, email, password) => runAuthAction(() => signUpWithEmail(name, email, password));

  const handleResetPassword = async (email) => {
    setAuthError("");
    setAuthNotice("");
    setLoginBusy(true);
    try {
      await sendPasswordReset(email);
    } catch (error) {
      const code = error && error.code;
      if (code === "auth/invalid-email" || code === "auth/network-request-failed" || code === "auth/too-many-requests") {
        setAuthError(friendlyAuthError(error));
        setLoginBusy(false);
        return;
      }
      // Any other result: do not reveal whether an account exists
    }
    setAuthNotice("If an account exists for that email, a password reset link has been sent.");
    setLoginBusy(false);
  };

  const handleResendVerification = async () => {
    setVerifyBusy(true);
    setAuthError("");
    setVerifyNotice("");
    try {
      await resendVerificationEmail();
      setVerifyNotice("Verification email sent. Check your inbox and spam folder.");
    } catch (error) {
      setAuthError(friendlyAuthError(error));
    } finally {
      setVerifyBusy(false);
    }
  };

  const handleCheckVerified = async () => {
    setVerifyBusy(true);
    setAuthError("");
    setVerifyNotice("");
    try {
      const verified = await refreshVerifiedStatus();
      if (verified) {
        setEmailVerifiedNow(true);
      } else {
        setAuthError("Your email is not verified yet. Open the link we sent, then try again.");
      }
    } catch (error) {
      setAuthError(friendlyAuthError(error));
    } finally {
      setVerifyBusy(false);
    }
  };

  const handleLogout = async (notice) => {
    try {
      await logoutUser();
      setAuthUser(null);
      setAuthError("");
      setAuthNotice(typeof notice === "string" ? notice : "");
    } catch (error) {
      setAuthError("Unable to sign out. Please try again.");
    }
  };

  const { secondsLeft: idleSecondsLeft, stay: staySignedIn } = useIdleTimeout({
    enabled: Boolean(authUser),
    onTimeout: () => handleLogout("You were signed out after 30 minutes of inactivity to protect patient records."),
  });

  // Navigation State
  const [activeNav, setActiveNav] = useState("Patients & Odontogram");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // filters the Patients list only
  const [toastMessage, setToastMessage] = useState(null);

  // --- PERSISTENT DATA STORES (isolated per signed-in account) ---
  const [allPatients, setPatients] = useState([]);
  const [allAppointments, setAppointments] = useState([]);
  const [allInvoices, setInvoices] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [employees, setEmployees] = useState(DEFAULT_EMPLOYEES);
  const [allQueue, setQueue] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [practiceProfile, setPracticeProfile] = useState(DEFAULT_PROFILE);
  const [hydratedFor, setHydratedFor] = useState(null);

  // Branches: every screen shows the branch picked in the header (or all). Raw lists keep every branch for sync and saving.
  const [activeBranch, setActiveBranch] = useState("all");
  const allBranches = useMemo(() => branchesOf(practiceProfile), [practiceProfile]);
  const allowedBranchIds = branchScope(activeMember);
  const branches = useMemo(() => (allowedBranchIds ? allBranches.filter((b) => allowedBranchIds.includes(b.id)) : allBranches), [allBranches, activeMember]); // eslint-disable-line react-hooks/exhaustive-deps
  const shownBranch = activeBranch === "all" || branches.some((b) => b.id === activeBranch) ? activeBranch : "all";
  const writeBranch = writeBranchId(branches, shownBranch);
  const patients = useMemo(() => filterByBranch(scopeToBranches(allPatients, allowedBranchIds), shownBranch), [allPatients, shownBranch, activeMember]); // eslint-disable-line react-hooks/exhaustive-deps
  const appointments = useMemo(() => filterByBranch(scopeToBranches(allAppointments, allowedBranchIds), shownBranch), [allAppointments, shownBranch, activeMember]); // eslint-disable-line react-hooks/exhaustive-deps
  const invoices = useMemo(() => filterByBranch(scopeToBranches(allInvoices, allowedBranchIds), shownBranch), [allInvoices, shownBranch, activeMember]); // eslint-disable-line react-hooks/exhaustive-deps
  const queue = useMemo(() => filterByBranch(scopeToBranches(allQueue, allowedBranchIds), shownBranch), [allQueue, shownBranch, activeMember]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load this account's local cache when the signed-in user changes; reset on sign-out
  useEffect(() => {
    if (!CLINIC_ID) {
      setPatients([]);
      setAppointments([]);
      setInvoices([]);
      setInventory([]);
      setEmployees(DEFAULT_EMPLOYEES);
      setQueue([]);
      setActiveBranch("all");
      setBookingRequests([]);
      setPracticeProfile(DEFAULT_PROFILE);
      setHydratedFor(null);
      return;
    }
    const load = (name, fallback) => {
      try {
        const stored = localStorage.getItem(`merident_${CACHE_ID}_${name}`);
        return stored ? JSON.parse(stored) : fallback;
      } catch {
        return fallback;
      }
    };
    setPatients(load("patients", []));
    setAppointments(load("appointments", []));
    setInvoices(load("invoices", []));
    setInventory(load("inventory", []));
    setEmployees(load("employees", DEFAULT_EMPLOYEES));
    setQueue(pruneQueue(load("queue", [])));
    setActiveBranch(load("branch", "all"));
    setPracticeProfile(load("profile", DEFAULT_PROFILE));
    setHydratedFor(CLINIC_ID);
  }, [CLINIC_ID, CACHE_ID]);

  // Real-time, offline-capable cloud sync (only this account's clinic)
  const cloudReady = Boolean(db && CLINIC_ID && hydratedFor === CLINIC_ID);
  const lastSyncToastAt = useRef(0);
  const reportSyncError = (error) => {
    console.warn("Cloud sync issue", error);
    const now = Date.now();
    if (now - lastSyncToastAt.current > 30000) {
      lastSyncToastAt.current = now;
      showToast("Cloud sync issue. Your changes are kept and will retry automatically.");
    }
  };
  useCloudCollection({ clinicId: CLINIC_ID, ready: cloudReady && canRead(role, "patients"), readOnly: !canWrite(role, "patients"), name: "patients", items: allPatients, setItems: setPatients, sortFn: byIdDesc, onError: reportSyncError });
  useCloudCollection({ clinicId: CLINIC_ID, ready: cloudReady && canRead(role, "appointments"), readOnly: !canWrite(role, "appointments"), name: "appointments", items: allAppointments, setItems: setAppointments, sortFn: byIdDesc, onError: reportSyncError });
  useCloudCollection({ clinicId: CLINIC_ID, ready: cloudReady && canRead(role, "invoices"), readOnly: !canWrite(role, "invoices"), name: "invoices", items: allInvoices, setItems: setInvoices, sortFn: byIdDesc, onError: reportSyncError });
  useCloudCollection({ clinicId: CLINIC_ID, ready: cloudReady && canRead(role, "inventory"), readOnly: !canWrite(role, "inventory"), name: "inventory", items: inventory, setItems: setInventory, onError: reportSyncError });
  useCloudCollection({ clinicId: CLINIC_ID, ready: cloudReady && canRead(role, "queue"), readOnly: !canWrite(role, "queue"), name: "queue", items: allQueue, setItems: setQueue, onError: reportSyncError });
  useCloudCollection({ clinicId: CLINIC_ID, ready: cloudReady && canRead(role, "employees"), readOnly: !canWrite(role, "employees"), name: "employees", items: employees, setItems: setEmployees, onError: reportSyncError });
  useCloudDoc({ clinicId: CLINIC_ID, ready: cloudReady && canRead(role, "profile"), readOnly: !canWrite(role, "profile"), name: "profile", value: practiceProfile, setValue: setPracticeProfile, onError: reportSyncError });

  // Save changes to localStorage
  useEffect(() => {
    if (!CLINIC_ID || hydratedFor !== CLINIC_ID) return;
    localStorage.setItem(`merident_${CACHE_ID}_patients`, JSON.stringify(allPatients));
  }, [allPatients, hydratedFor, CLINIC_ID]);

  useEffect(() => {
    if (!CLINIC_ID || hydratedFor !== CLINIC_ID) return;
    localStorage.setItem(`merident_${CACHE_ID}_appointments`, JSON.stringify(allAppointments));
  }, [allAppointments, hydratedFor, CLINIC_ID]);

  useEffect(() => {
    if (!CLINIC_ID || hydratedFor !== CLINIC_ID) return;
    localStorage.setItem(`merident_${CACHE_ID}_invoices`, JSON.stringify(allInvoices));
  }, [allInvoices, hydratedFor, CLINIC_ID]);

  useEffect(() => {
    if (!CLINIC_ID || hydratedFor !== CLINIC_ID) return;
    localStorage.setItem(`merident_${CACHE_ID}_inventory`, JSON.stringify(inventory));
  }, [inventory, hydratedFor, CLINIC_ID]);

  useEffect(() => {
    if (!CLINIC_ID || hydratedFor !== CLINIC_ID) return;
    localStorage.setItem(`merident_${CACHE_ID}_employees`, JSON.stringify(employees));
  }, [employees, hydratedFor, CLINIC_ID]);

  useEffect(() => {
    if (!CLINIC_ID || hydratedFor !== CLINIC_ID) return;
    localStorage.setItem(`merident_${CACHE_ID}_branch`, JSON.stringify(shownBranch));
  }, [shownBranch, hydratedFor, CLINIC_ID]);

  useEffect(() => {
    if (!CLINIC_ID || hydratedFor !== CLINIC_ID) return;
    localStorage.setItem(`merident_${CACHE_ID}_queue`, JSON.stringify(allQueue));
  }, [allQueue, hydratedFor, CLINIC_ID]);

  // Activity log: one line per important change, written by whoever made it
  const logAudit = (action, subject, detail) => {
    if (!db || !CLINIC_ID || !authUser) return;
    const entry = buildAuditEntry({ actor: { uid: authUser.uid, email: authUser.email, role }, action, subject, detail }, newId("AU"));
    writeAudit(db, CLINIC_ID, entry).catch(() => {});
  };
  const [auditEntries, setAuditEntries] = useState([]);
  useEffect(() => {
    if (!db || !CLINIC_ID || hydratedFor !== CLINIC_ID || !(role === "owner" || role === "manager") || activeNav !== "Practice Profile") return undefined;
    return watchAudit(db, CLINIC_ID, setAuditEntries, () => {});
  }, [hydratedFor, CLINIC_ID, role, activeNav]);

  // Owner: the list of team logins
  const [team, setTeam] = useState([]);
  useEffect(() => {
    if (!db || !CLINIC_ID || hydratedFor !== CLINIC_ID || role !== "owner") { setTeam([]); return undefined; }
    return watchTeam(db, CLINIC_ID, setTeam, () => {});
  }, [hydratedFor, CLINIC_ID, role]);

  // Keep a team member on a screen their role allows
  useEffect(() => {
    if (!CLINIC_ID) return;
    const allowed = NAV_BY_ROLE[role];
    if (allowed && !allowed.includes(activeNav)) setActiveNav(firstScreen(role));
  }, [role, activeNav, CLINIC_ID]);

  // Online booking: publish the public page and listen for requests (only while signed in to this clinic)
  useEffect(() => {
    if (!db || !CLINIC_ID || hydratedFor !== CLINIC_ID || !(role === "owner" || role === "manager")) return;
    publishBookingPage(db, CLINIC_ID, buildBookingPage(practiceProfile, CLINIC_ID, { enabled: practiceProfile.onlineBooking })).catch(() => {});
  }, [practiceProfile.name, practiceProfile.address, practiceProfile.phone, practiceProfile.drName, practiceProfile.onlineBooking, hydratedFor, CLINIC_ID]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!db || !CLINIC_ID || hydratedFor !== CLINIC_ID || role === "dentist") return undefined;
    return watchBookingRequests(db, CLINIC_ID, setBookingRequests, () => {});
  }, [hydratedFor, CLINIC_ID, role]);

  useEffect(() => {
    if (!CLINIC_ID || hydratedFor !== CLINIC_ID) return;
    localStorage.setItem(`merident_${CACHE_ID}_profile`, JSON.stringify(practiceProfile));
  }, [practiceProfile, hydratedFor, CLINIC_ID]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- MODAL STATES ---
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState("32-Tooth Odontogram");

  // Employee Roster state modals & forms
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [selectedStaffForAction, setSelectedStaffForAction] = useState(null);

  const [newStaffForm, setNewStaffForm] = useState({
    name: "",
    role: "General Dentistry",
    license: "",
    licenseExpiry: "",
    phone: "",
    qualification: "",
    shift: "Full day",
    active: true
  });

  const [leaveForm, setLeaveForm] = useState({
    employeeName: "",
    leaveType: "Sick leave",
    startDate: "",
    endDate: "",
    reason: ""
  });

  const [performanceForm, setPerformanceForm] = useState({
    employeeName: "",
    reviewerName: "",
    date: dateKey(),
    rating: 4,
    notes: ""
  });

  // New Patient Form with Medical Alert & Area
  const [newPatientForm, setNewPatientForm] = useState({ ...EMPTY_PATIENT_FORM });

  // Odontogram Screen Local State
  const [isDeciduous, setIsDeciduous] = useState(false);
  const [activePaletteStatus, setActivePaletteStatus] = useState("CAR");

  // Inter-Departmental Referrals State
  const [refTreatment, setRefTreatment] = useState("");
  const [refTooth, setRefTooth] = useState("");
  const [refDept, setRefDept] = useState("CONS");


  // OPG Workstation State
  const [opgSelectedPatientId, setOpgSelectedPatientId] = useState(null);

  // New Appointment Modal State
  const [isAddApptOpen, setIsAddApptOpen] = useState(false);
  const [newApptForm, setNewApptForm] = useState({
    patientId: "",
    patientName: "",
    phone: "",
    age: "",
    date: dateKey(),
    time: "10:30",
    chair: "Chair 1 (Main Operatory)",
    doctor: "",
    procedure: "",
    visitType: "New patient",
    status: "Confirmed",
  });

  // New Invoice Modal State
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [activeUpiQrInvoice, setActiveUpiQrInvoice] = useState(null);
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    patientId: "",
    patientName: "",
    paymentMode: "Cash",
    items: [blankInvoiceItem()],
    discount: "",
    advance: "",
    dueDate: "",
    doctor: "",
  });
  const [payForm, setPayForm] = useState({ amount: "", mode: "Cash" });
  const [upiQrDataUrl, setUpiQrDataUrl] = useState("");

  // New Stock Modal State
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [newStockForm, setNewStockForm] = useState({
    name: "",
    category: "Restorative",
    quantity: 10,
    unit: "Syringes",
    minThreshold: 5,
    expiry: "",
  });
  const [stockQuery, setStockQuery] = useState("");
  const [stockViewId, setStockViewId] = useState("all");
  const [stockQty, setStockQty] = useState({});

  const activePatient = patients.find((p) => p.id === selectedPatientId) || null;

  const updateActivePatient = (changes) => {
    if (!activePatient) return;
    setPatients((prev) => prev.map((p) => (p.id === activePatient.id ? { ...p, ...changes } : p)));
  };

  // Add Patient Action
  const handleCreatePatient = (e) => {
    e.preventDefault();
    const problem = validatePatientForm(newPatientForm);
    if (problem) {
      showToast(problem);
      return;
    }
    const { consentTreatment, consentWhatsapp, ...formFields } = newPatientForm;
    const created = {
      id: newId("P"),
      ...formFields,
      name: newPatientForm.name.trim(),
      phone: normalizePhone(newPatientForm.phone),
      guardianPhone: newPatientForm.guardianPhone ? normalizePhone(newPatientForm.guardianPhone) : "",
      emergencyPhone: newPatientForm.emergencyPhone ? normalizePhone(newPatientForm.emergencyPhone) : "",
      abhaNumber: digitsOnly(newPatientForm.abhaNumber),
      consent: {
        treatment: Boolean(consentTreatment),
        whatsapp: Boolean(consentWhatsapp),
        recordedAt: new Date().toISOString(),
      },
      systemic: {},
      habits: {},
      registeredDate: new Date().toLocaleDateString("en-IN"),
      toothConditions: {},
      opgImage: null,
      diagnosis: {
        trauma: "No acute trauma recorded.",
        impaction: "None charted.",
        boneDeformations: "Normal bone crest height.",
        diagnosisNotes: "No diagnostic notes entered.",
      },
      prescriptions: [],
      referrals: [],
    };

    setPatients((prev) => [tagBranch(created, writeBranch), ...prev]);
    logAudit("patient.add", created.name);
    setNewPatientForm({ ...EMPTY_PATIENT_FORM });
    setIsAddPatientOpen(false);
    setSelectedPatientId(created.id);
    setIsChartModalOpen(true);
    showToast(`Patient ${created.name} registered successfully`);
  };

  // Tooth Click in Odontogram
  const handleToothTap = (toothNumber) => {
    if (!activePatient) return;
    const next = toggleFinding(activePatient.toothConditions, toothNumber, activePaletteStatus);
    setPatients((prev) => prev.map((p) => (p.id === activePatient.id ? { ...p, toothConditions: next } : p)));
  };

  // Remove one finding from one tooth (from the per-tooth list under the chart)
  const handleRemoveFinding = (toothNumber, code) => {
    if (!activePatient) return;
    const next = toggleFinding(activePatient.toothConditions, toothNumber, code);
    setPatients((prev) => prev.map((p) => (p.id === activePatient.id ? { ...p, toothConditions: next } : p)));
  };

  // Update Diagnostic Fields in Realtime
  const handleUpdateDiagnosis = (field, value, patientId) => {
    const targetId = patientId || (activePatient && activePatient.id);
    if (!targetId) return;
    setPatients((prev) =>
      prev.map((p) => (p.id === targetId ? { ...p, diagnosis: { ...(p.diagnosis || {}), [field]: value } } : p))
    );
  };

  // Add Department Referral
  const handleAddReferral = (e) => {
    e.preventDefault();
    if (!refTreatment.trim() || !activePatient) return;
    const deptObj = DENTAL_DEPARTMENTS.find((d) => d.code === refDept) || { name: refDept, room: "OPD" };
    const newRef = {
      id: newId("REF"),
      treatment: refTreatment.trim(),
      toothRegion: refTooth.trim() || "U/L",
      department: deptObj.name,
      roomNo: deptObj.room,
      status: "Approved",
      date: new Date().toLocaleDateString("en-IN"),
    };

    setPatients((prev) =>
      prev.map((p) => (p.id === activePatient.id ? { ...p, referrals: [...(p.referrals || []), newRef] } : p))
    );

    setRefTreatment("");
    setRefTooth("");
    showToast(`Referral to ${deptObj.code} added`);
  };

  // Add Prescription to Patient
  const handleAddPrescription = (med) => {
    if (!activePatient) return;
    const newRxItem = {
      id: Date.now(),
      drug: med.name || med.drug,
      generic: med.generic,
      dosage: med.dosage || "1 Tab",
      frequency: med.frequency,
      duration: med.duration,
      instruction: med.timing || med.instruction || "After food",
    };
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === activePatient.id) {
          return {
            ...p,
            prescriptions: [...(p.prescriptions || []), newRxItem],
          };
        }
        return p;
      })
    );
    showToast(`Added ${newRxItem.drug} to prescription slip`);
  };

  const handleRemovePrescription = (rxId) => {
    if (!activePatient) return;
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === activePatient.id) {
          return {
            ...p,
            prescriptions: (p.prescriptions || []).filter((x) => x.id !== rxId),
          };
        }
        return p;
      })
    );
  };

  // WhatsApp Clinical Notifier / Rx Dispatcher
  const dispatchPatientWhatsApp = () => {
    if (!activePatient) return;
    if (activePatient.consent && activePatient.consent.whatsapp === false) {
      showToast("This patient has not agreed to WhatsApp messages");
      return;
    }
    let cleanPhone = activePatient.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

    if (!cleanPhone || cleanPhone.length < 10) {
      showToast("Invalid phone number for WhatsApp dispatch");
      return;
    }

    const chartedList = Object.entries(normalizeConditions(activePatient.toothConditions))
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([tooth, codes]) => {
        const labels = codes.map((code) => (CLINICAL_PALETTE.find((p) => p.id === code) || { label: code }).label);
        return `#${tooth} (${labels.join(" + ")})`;
      })
      .join(", ") || "General Oral Examination";

    const rxList = (activePatient.prescriptions || [])
      .map((p, idx) => `${idx + 1}. *${p.drug}* - ${p.frequency} (${p.duration})\n   Instruction: ${p.instruction}`)
      .join("\n\n");

    const message = encodeURIComponent(
      `🦷 *${practiceProfile.name.toUpperCase()}*\n` +
      `📍 ${practiceProfile.address} | 📞 ${practiceProfile.phone}\n` +
      `----------------------------------------\n` +
      `👤 *Patient:* ${activePatient.name} (Age: ${activePatient.age || "N/A"} Yrs / ${activePatient.gender})\n` +
      (activePatient.medicalAlert ? `⚠️ *Medical Alert:* ${activePatient.medicalAlert}\n` : "") +
      `📅 *Date:* ${activePatient.registeredDate}\n` +
      `🩺 *Doctor:* ${practiceProfile.drName}${practiceProfile.qualification ? `, ${practiceProfile.qualification}` : ""}\n` +
      (practiceProfile.councilRegNumber ? `🪪 *Reg. No:* ${practiceProfile.councilRegNumber}\n` : "") +
      `----------------------------------------\n` +
      `📋 *FDI Odontogram Findings:*\n${chartedList}\n\n` +
      (rxList ? `💊 *Medications Prescribed:*\n${rxList}\n\n` : "") +
      `----------------------------------------\n` +
      `⚠️ *Patient Care Advice:*\n` +
      `• Please take prescribed medications strictly on time.\n` +
      `• In case of persistent swelling or drug allergy, contact clinic immediately.\n\n` +
      `_Sent via MeriDent_`
    );

    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank", "noopener,noreferrer");
    showToast("WhatsApp message dispatched!");
  };

  // OPG Upload for Selected Patient (compressed so it fits in the patient record)
  const compressImageToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const attempts = [
          { dim: 1600, quality: 0.72 },
          { dim: 1280, quality: 0.6 },
          { dim: 1000, quality: 0.5 },
        ];
        let result = "";
        for (const { dim, quality } of attempts) {
          const scale = Math.min(1, dim / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          result = canvas.toDataURL("image/jpeg", quality);
          if (result.length < 700000) break;
        }
        URL.revokeObjectURL(objectUrl);
        if (result.length >= 900000) {
          reject(new Error("Image is too large"));
        } else {
          resolve(result);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Could not read image"));
      };
      img.src = objectUrl;
    });

  const handleOpgFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file (JPG or PNG)");
      return;
    }
    const targetId = opgSelectedPatientId || selectedPatientId || (patients[0] && patients[0].id);
    if (!targetId) {
      showToast("Please register or select a patient first");
      return;
    }
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setPatients((prev) =>
        prev.map((p) =>
          p.id === targetId ? { ...p, opgImage: dataUrl, opgUploadedAt: new Date().toLocaleDateString("en-IN"), opgCalibration: null } : p
        )
      );
      showToast("OPG radiograph uploaded & linked to patient");
    } catch (err) {
      showToast("Could not use this image. Try a smaller JPG or PNG.");
    }
  };

  // Appointment Booking Action
  const handleCreateAppointment = (e) => {
    e.preventDefault();
    if (!newApptForm.patientName.trim()) {
      showToast("Patient name is required");
      return;
    }
    if (!isValidMobile(newApptForm.phone)) {
      showToast("Enter a valid 10-digit mobile number");
      return;
    }
    if (!newApptForm.date || !newApptForm.time) {
      showToast("Choose a date and time");
      return;
    }
    if (!newApptForm.doctor.trim()) {
      showToast("Choose the attending doctor");
      return;
    }
    const clash = findClash(appointments, newApptForm);
    if (clash) {
      showToast(
        clash.reason === "chair"
          ? `${clash.appt.chair} is already booked at ${formatTime12(clash.appt.time)} for ${clash.appt.patientName}. Pick another time or chair.`
          : `${clash.appt.doctor} is already booked at ${formatTime12(clash.appt.time)} for ${clash.appt.patientName}. Pick another time or doctor.`
      );
      return;
    }
    const appt = {
      id: newId("APT"),
      ...newApptForm,
      phone: normalizePhone(newApptForm.phone),
      procedure: newApptForm.procedure.trim() || "Consultation",
    };
    setAppointments((prev) => [tagBranch(appt, writeBranch), ...prev]);
    logAudit("appointment.add", appt.patientName, `${appt.date} ${appt.time}`);
    setNewApptForm((f) => ({ ...f, patientId: "", patientName: "", phone: "", age: "", procedure: "" }));
    setIsAddApptOpen(false);
    showToast(`Appointment booked for ${appt.patientName} on ${appt.date}`);
  };

  // Walk-in queue
  const handleAddWalkIn = (form) => {
    const r = addWalkIn(queue, form, newId("Q"));
    if (!r.ok) return r;
    setQueue((prev) => [tagBranch(r.entry, writeBranch), ...prev]);
    showToast(`Token ${r.entry.token} issued to ${r.entry.name}`);
    return r;
  };
  const handleQueueStatus = (entry, status) => setQueue((prev) => prev.map((e) => (e.id === entry.id ? setQueueStatus(e, status) : e)));
  const handleQueueRemove = (entry) => setQueue((prev) => prev.filter((e) => e.id !== entry.id));

  // Online booking requests
  const confirmBooking = async (req) => {
    const doctor = practiceProfile.drName || "Doctor";
    const { appointment } = requestToAppointment(req, { newId, doctor, chair: newApptForm.chair, patients });
    const clash = findClash(appointments, appointment);
    if (clash) {
      showToast(`${clash.appt.chair} is booked at ${formatTime12(clash.appt.time)}. Open the diary and book a free time, then confirm.`);
      return;
    }
    try {
      await markBookingRequest(db, req.id, "confirmed");
      logAudit("booking.confirm", req.name, `${req.date} ${req.slot}`);
    } catch {
      showToast("Could not update the request. Check your connection and try again.");
      return;
    }
    setAppointments((prev) => [tagBranch(appointment, writeBranch), ...prev]);
    const wa = whatsappNumber(req.phone);
    showToast(`Booked ${req.name} for ${appointment.date} at ${formatTime12(appointment.time)}`);
    if (wa) {
      const text = `Hello ${req.name}, your appointment at ${practiceProfile.name} is confirmed for ${appointment.date} at ${formatTime12(appointment.time)}. Please reply if you need to change it.`;
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    }
  };
  const declineBooking = async (req) => {
    try {
      await markBookingRequest(db, req.id, "declined");
      logAudit("booking.decline", req.name, req.date);
    } catch {
      showToast("Could not update the request. Check your connection and try again.");
    }
  };
  const contactBooking = (req) => {
    const wa = whatsappNumber(req.phone);
    if (!wa) return;
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(`Hello ${req.name}, this is ${practiceProfile.name} about your appointment request for ${req.date}.`)}`, "_blank", "noopener,noreferrer");
  };

  // --- Reports ---
  const [reportMonth, setReportMonth] = useState(currentMonthKey());
  const reportInvoices = invoices;
  const reportCollections = collectionsForMonth(reportInvoices, reportMonth);
  const reportGst = gstSummaryForMonth(reportInvoices, reportMonth);
  const branchCmp = useMemo(
    () => branchComparison(branches, { patients: scopeToBranches(allPatients, allowedBranchIds), appointments: scopeToBranches(allAppointments, allowedBranchIds), invoices: scopeToBranches(allInvoices, allowedBranchIds) }, reportMonth),
    [branches, allPatients, allAppointments, allInvoices, reportMonth, activeMember] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const dentistCmp = useMemo(
    () => dentistEarnings(scopeToBranches(allInvoices, allowedBranchIds), scopeToBranches(allAppointments, allowedBranchIds), reportMonth, practiceProfile.commissions),
    [allInvoices, allAppointments, reportMonth, practiceProfile.commissions, activeMember] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const downloadCsv = (csv, name) => {
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadFile = (text, name, type, bom) => {
    const blob = new Blob([bom ? "\ufeff" + text : text], { type: `${type};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const printReport = () => {
    const win = window.open("", "_blank");
    if (!win) {
      showToast("Allow pop-ups to print the report");
      return;
    }
    win.document.write(buildReportHtml(reportInvoices, reportMonth, practiceProfile));
    win.document.close();
  };

  // --- WhatsApp reminders (opens WhatsApp with the message ready; the clinic taps Send) ---
  const birthdaysToday = dueBirthdays(patients);
  const closeSummary = dayClose({ invoices, appointments, patients });
  const dueApptReminders = dueAppointmentReminders(appointments, new Date(), patients);
  const dueRecallList = dueRecalls(patients, appointments, invoices.map(normalizeInvoice));
  const duePayReminders = duePaymentReminders(invoices.map(normalizeInvoice), patients);
  const feedbackDue = dueFeedbackRequests(appointments, patients);
  const awaitingList = awaitingRatings(appointments);
  const lowList = lowRatings(appointments);
  const feedbackStats = feedbackSummary(appointments);
  const planFollowUps = duePlanFollowUps(patients, appointments);
  const labRows = openLabOrders(patients);
  const labLate = labOverdueCount(patients);
  const [showAllRecalls, setShowAllRecalls] = useState(false);
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const connectApi = useMemo(() => bindApi(db, CLINIC_ID), [CLINIC_ID]);
  const aging = agingSummary(invoices);
  const [invoiceQuery, setInvoiceQuery] = useState("");
  const [diaryViewId, setDiaryViewId] = useState("upcoming");
  const [dayDate, setDayDate] = useState(dateKey());
  const [aiNotes, setAiNotes] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [visitForm, setVisitForm] = useState({ complaint: "", findings: "", treatment: "", advice: "", nextVisit: "", date: "" });
  const [diaryQuery, setDiaryQuery] = useState("");
  const visibleInvoices = invoiceView(invoices, { status: invoiceFilter, query: invoiceQuery });
  const billing = billingSummary(invoices);
  const diarySum = diarySummary(appointments);
  const stockSum = stockSummary(inventory);
  const todaysVisits = diaryView(appointments, { view: "today" }).filter((a) => !["cancelled", "no show", "completed"].includes(String(a.status || "").toLowerCase()));
  const overdueList = invoiceView(invoices, { status: "overdue" });

  const sendInvoiceToPatient = (inv) => {
    const patient = patients.find((p) => p.id === inv.patientId) || patients.find((p) => p.name === inv.patient);
    const link = whatsappLink(
      patient?.phone,
      buildInvoiceMessage({ clinicName: practiceProfile.name, inv, upiId: isValidUpiId(practiceProfile.upiId) ? practiceProfile.upiId : "" })
    );
    if (!link) {
      showToast("This patient has no valid mobile number");
      return;
    }
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const sendApptReminder = ({ appt, kind }) => {
    const link = whatsappLink(
      appt.phone,
      buildAppointmentReminder({ clinicName: practiceProfile.name, appt, kind, language: languageOf(patients.find((p) => String(p.id) === String(appt.patientId))) })
    );
    if (!link) {
      showToast("This patient has no valid mobile number");
      return;
    }
    window.open(link, "_blank", "noopener,noreferrer");
    setAppointments((prev) => prev.map((a) => (a.id === appt.id ? markAppointmentReminded(a, kind) : a)));
  };

  const sendPayReminder = ({ inv, phone }) => {
    const link = whatsappLink(
      phone,
      buildPaymentReminder({ clinicName: practiceProfile.name, inv, upiId: isValidUpiId(practiceProfile.upiId) ? practiceProfile.upiId : "", language: languageOf(patients.find((p) => String(p.id) === String(inv.patientId))) })
    );
    if (!link) {
      showToast("This patient has no valid mobile number");
      return;
    }
    window.open(link, "_blank", "noopener,noreferrer");
    setInvoices((prev) => prev.map((i) => (i.id === inv.id ? markInvoiceReminded(i) : i)));
  };

  const sendRecall = ({ patient, months }) => {
    const link = whatsappLink(
      patient.phone,
      buildRecallMessage({ clinicName: practiceProfile.name, clinicPhone: practiceProfile.phone, patient, months, language: languageOf(patient) })
    );
    if (!link) {
      showToast("This patient has no valid mobile number");
      return;
    }
    window.open(link, "_blank", "noopener,noreferrer");
    setPatients((prev) => prev.map((p) => (p.id === patient.id ? markPatientRecalled(p) : p)));
  };

  const greetBirthday = (patient) => {
    const link = whatsappLink(patient.phone, buildBirthdayMessage({ clinicName: practiceProfile.name, patient, language: languageOf(patient) }));
    if (!link) { showToast("This patient has no valid mobile number"); return; }
    window.open(link, "_blank", "noopener,noreferrer");
    setPatients((prev) => prev.map((p) => (p.id === patient.id ? markGreeted(p) : p)));
  };

  const patchAppt = (id, fn) => setAppointments((prev) => prev.map((a) => (a.id === id ? fn(a) : a)));
  const openWhatsApp = (phone, text) => {
    const link = whatsappLink(phone, text);
    if (!link) { showToast("This patient has no valid mobile number"); return false; }
    window.open(link, "_blank", "noopener,noreferrer");
    return true;
  };
  const askFeedback = (appt) => {
    if (openWhatsApp(appt.phone, buildFeedbackMessage({ clinicName: practiceProfile.name, appt }))) patchAppt(appt.id, (a) => markFeedbackAsked(a));
  };
  const rateFeedback = (appt, rating, comment) => {
    patchAppt(appt.id, (a) => recordRating(a, rating, comment));
    showToast(rating <= 3 ? "Saved. This patient is flagged so you can call them." : "Rating saved");
  };
  const handleFeedback = (appt) => patchAppt(appt.id, (a) => resolveFeedback(a));
  const inviteReview = (appt) => {
    if (openWhatsApp(appt.phone, buildReviewMessage({ clinicName: practiceProfile.name, appt, reviewLink: practiceProfile.reviewLink }))) patchAppt(appt.id, (a) => markReviewAsked(a));
  };
  const followUpPlan = ({ patient, plan }) => {
    const totalP = planTotals(plan).totalP;
    if (openWhatsApp(patient.phone, buildPlanFollowUp({ clinicName: practiceProfile.name, clinicPhone: practiceProfile.phone, patient, plan, totalP }))) {
      setPatients((prev) => prev.map((p) => (p.id === patient.id ? markPlanFollowedUp(p, plan.id) : p)));
    }
  };
  const patchLab = (patientId, orderId, fn) =>
    setPatients((prev) => prev.map((p) => (p.id === patientId ? { ...p, labOrders: (p.labOrders || []).map((o) => (o.id === orderId ? fn(o) : o)) } : p)));
  const receiveLab = ({ patient, order }) => { patchLab(patient.id, order.id, (o) => moveLabOrder(o, "received")); showToast("Marked as received"); };
  const fitLab = ({ patient, order }) => { patchLab(patient.id, order.id, (o) => moveLabOrder(o, "fitted")); showToast("Marked as fitted"); };
  const chaseLab = ({ patient, order }) => { openWhatsApp(order.labPhone, buildLabChase({ clinicName: practiceProfile.name, patient, order })); };
  const tellPatientLab = ({ patient, order }) => {
    if (openWhatsApp(patient.phone, buildPatientReady({ clinicName: practiceProfile.name, clinicPhone: practiceProfile.phone, patient, order }))) patchLab(patient.id, order.id, (o) => markPatientNotified(o));
  };
  const snoozePlan = ({ patient, plan }) => setPatients((prev) => prev.map((p) => (p.id === patient.id ? markPlanFollowedUp(p, plan.id) : p)));

  // "Not now": hides this patient from the recall list for 30 days
  const snoozeRecall = ({ patient }) => {
    setPatients((prev) => prev.map((p) => (p.id === patient.id ? markPatientRecalled(p) : p)));
  };

  const sendAppointmentWhatsApp = (appt) => {
    let cleanPhone = appt.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

    const message = encodeURIComponent(
      `🦷 *APPOINTMENT CONFIRMATION*\n` +
      `🏥 *${practiceProfile.name}*\n` +
      `----------------------------------------\n` +
      `👤 *Patient:* ${appt.patientName} (Age: ${appt.age || "N/A"})\n` +
      `📅 *Date:* ${appt.date}\n` +
      `⏰ *Time Slot:* ${appt.time}\n` +
      `💺 *Operatory:* ${appt.chair}\n` +
      `🩺 *Attending Doctor:* ${appt.doctor}\n` +
      `🔬 *Procedure:* ${appt.procedure}\n` +
      `----------------------------------------\n` +
      `📍 Please arrive 10 minutes prior to chair setup.\n\n` +
      `_MeriDent OS_`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank", "noopener,noreferrer");
  };

  // Real, scannable UPI QR for the balance due on the selected invoice
  const qrInvoice = activeUpiQrInvoice ? normalizeInvoice(invoices.find((i) => i.id === activeUpiQrInvoice.id) || activeUpiQrInvoice) : null;
  const qrBalanceP = qrInvoice ? balancePaise(qrInvoice) : 0;
  const upiUri =
    qrInvoice && isValidUpiId(practiceProfile.upiId) && qrBalanceP > 0
      ? buildUpiUri({ vpa: practiceProfile.upiId, name: practiceProfile.name, amountP: qrBalanceP, note: qrInvoice.id })
      : "";
  useEffect(() => {
    let cancelled = false;
    if (!upiUri) {
      setUpiQrDataUrl("");
      return undefined;
    }
    import("qrcode").then((m) => (m.default || m).toDataURL(upiUri, { margin: 1, width: 240 }))
      .then((url) => !cancelled && setUpiQrDataUrl(url))
      .catch(() => !cancelled && setUpiQrDataUrl(""));
    return () => {
      cancelled = true;
    };
  }, [upiUri]);

  const closeInvoiceModal = () => {
    if (newInvoiceForm.planId) {
      setNewInvoiceForm({
        patientId: "", patientName: "", paymentMode: "Cash",
        items: [blankInvoiceItem()], discount: "", advance: "", dueDate: "", doctor: "",
      });
    }
    setIsAddInvoiceOpen(false);
  };

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    if (!newInvoiceForm.patientName.trim()) {
      showToast("Patient Name is required");
      return;
    }
    const items = newInvoiceForm.items;
    if (items.some((it) => !(parseFloat(it.amount) > 0))) {
      showToast("Enter a bill amount greater than zero for every item");
      return;
    }
    if (items.some((it) => !it.description.trim())) {
      showToast("Describe the treatment billed for every item");
      return;
    }
    const totals = computeLineItemTotals({ items, discount: newInvoiceForm.discount });
    if (totals.totalP <= 0) {
      showToast("Invoice total must be greater than zero");
      return;
    }
    const advanceP = toPaise(newInvoiceForm.advance);
    if (advanceP > totals.totalP) {
      showToast("Advance cannot be more than the invoice total");
      return;
    }
    const today = new Date().toLocaleDateString("en-IN");
    const inv = {
      id: nextInvoiceNumber(allInvoices),
      patientId: newInvoiceForm.patientId || "",
      patient: newInvoiceForm.patientName.trim(),
      paymentMode: newInvoiceForm.paymentMode,
      ...(String(newInvoiceForm.doctor || "").trim() ? { doctor: String(newInvoiceForm.doctor).trim() } : {}),
      treatment: totals.lines.map((l) => l.description).join(", "),
      taxCategory: new Set(totals.lines.map((l) => l.taxCategory)).size === 1 ? totals.lines[0].taxCategory : "mixed",
      ...totals,
      payments: advanceP > 0 ? [{ date: today, mode: newInvoiceForm.paymentMode, amountP: advanceP }] : [],
      total: (totals.totalP / 100).toLocaleString("en-IN"),
      rawAmount: String(totals.totalP / 100),
      date: today,
      ...(newInvoiceForm.dueDate ? { dueDate: newInvoiceForm.dueDate } : {}),
    };
    setInvoices((prev) => [tagBranch(inv, writeBranch), ...prev]);
    logAudit("invoice.add", inv.id, `${inv.patient}, ₹${formatINR(inv.totalP)}`);
    if (newInvoiceForm.planId && newInvoiceForm.patientId) {
      setPatients((prev) =>
        prev.map((p) =>
          p.id === newInvoiceForm.patientId
            ? { ...p, plans: (p.plans || []).map((pl) => (pl.id === newInvoiceForm.planId ? markPlanBilled(pl, inv.id) : pl)) }
            : p
        )
      );
    }
    setNewInvoiceForm({
      patientId: "",
      patientName: "",
      paymentMode: "Cash",
      items: [blankInvoiceItem()],
      discount: "",
      advance: "",
      dueDate: "",
      doctor: "",
    });
    setIsAddInvoiceOpen(false);
    showToast(`Invoice ${inv.id} generated for ₹${formatINR(inv.totalP)}`);
  };

  const handleCollectPayment = (e) => {
    e.preventDefault();
    const current = normalizeInvoice(invoices.find((i) => i.id === activeUpiQrInvoice?.id));
    if (!current) return;
    const result = addPayment(current, { amount: payForm.amount, mode: payForm.mode });
    if (!result.ok) {
      showToast(result.error);
      return;
    }
    setInvoices((prev) => prev.map((i) => (i.id === current.id ? result.invoice : i)));
    logAudit("payment.add", current.id, `₹${formatINR(toPaise(payForm.amount))} by ${payForm.mode}`);
    setActiveUpiQrInvoice(result.invoice);
    setPayForm({ amount: "", mode: payForm.mode });
    showToast(`₹${formatINR(toPaise(payForm.amount))} received. Balance ₹${formatINR(balancePaise(result.invoice))}`);
  };

  const handlePrintInvoice = (inv, receipt = false) => {
    const win = window.open("", "_blank");
    if (!win) {
      showToast("Allow pop-ups to print the invoice");
      return;
    }
    win.document.write(buildInvoiceHtml(normalizeInvoice(inv), practiceProfile, { receipt }));
    win.document.close();
  };

  const handleStockAdjust = (stockId, delta) => {
    setInventory((prev) => prev.map((item) => (item.id === stockId ? adjustStock(item, delta) : item)));
  };

  const handleCreateStock = (e) => {
    e.preventDefault();
    const built = buildStockItem(newStockForm, newId("STK"));
    if (!built.ok) {
      showToast(built.error);
      return;
    }
    setInventory([...inventory, built.item]);
    setNewStockForm({ name: "", category: "Restorative", quantity: 10, unit: "Syringes", minThreshold: 5, expiry: "" });
    setIsAddStockOpen(false);
    showToast(`Added ${built.item.name} to stock`);
  };

  const handleRemoveStock = (item) => {
    if (!confirm(`Remove ${item.name} from stock?`)) return;
    setInventory((prev) => prev.filter((x) => x.id !== item.id));
  };

  const sendReorderList = () => {
    const text = buildReorderMessage({ clinicName: practiceProfile.name, items: inventory });
    if (!text) {
      showToast("Nothing needs reordering right now");
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const handleCreateStaff = (e) => {
    e.preventDefault();
    if (!newStaffForm.name.trim()) {
      showToast("Staff name is required");
      return;
    }
    if (!isValidMobile(newStaffForm.phone)) {
      showToast("Enter a valid 10-digit staff mobile number");
      return;
    }
    const staffMember = {
      id: newId("EMP"),
      ...newStaffForm,
      phone: normalizePhone(newStaffForm.phone)
    };
    setEmployees([...employees, staffMember]);
    setIsAddStaffOpen(false);
    setNewStaffForm({ name: "", role: "Orthodontist", license: "", licenseExpiry: "", phone: "", qualification: "", shift: "Full day", active: true });
    showToast(`Staff member ${staffMember.name} added successfully`);
  };

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery)
  );

  const currentOpgPatient = patients.find((p) => p.id === (opgSelectedPatientId || (patients[0] && patients[0].id))) || null;

  const dashboardDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return date;
  });

  const dashboardDateKey = (value) => {
    if (!value) return "";
    const parts = String(value).split(/[\\/.-]/);
    if (parts.length === 3 && parts[0].length <= 2) {
      const [day, month, year] = parts;
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
  };

  const dashboardPatientSeries = dashboardDays.map((date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return {
      label: date.toLocaleDateString("en-IN", { weekday: "short" }),
      value: patients.filter((patient) => dashboardDateKey(patient.registeredDate) === key).length,
    };
  });

  const dashboardRevenueSeries = dashboardDays.map((date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return {
      label: date.toLocaleDateString("en-IN", { weekday: "short" }),
      value: invoices.filter((invoice) => dashboardDateKey(invoice.date) === key)
        .reduce((sum, invoice) => sum + paidPaise(normalizeInvoice(invoice)) / 100, 0),
    };
  });


  const todayKey = dashboardDateKey(new Date().toLocaleDateString("en-IN"));

  const doctorOptions = Array.from(
    new Set([practiceProfile.drName, ...employees.filter((e) => e.active !== false).map((e) => e.name)].filter(Boolean))
  );

  // Small renderers for the "Patient Details" tab (plain functions, not components)
  const patientField = (field, label, opts = {}) => (
    <Field label={label} required={opts.required} hint={opts.hint} className={opts.className || ""}>
      <input
        type={opts.type || "text"}
        value={activePatient ? activePatient[field] ?? "" : ""}
        onChange={(e) => updateActivePatient({ [field]: e.target.value })}
        placeholder={opts.placeholder || ""}
        className={fieldInputClass}
      />
    </Field>
  );
  const patientSelect = (field, label, options, opts = {}) => {
    const current = activePatient ? activePatient[field] ?? "" : "";
    const list = current && !options.includes(current) ? [...options, current] : options;
    return (
      <Field label={label} required={opts.required} className={opts.className || ""}>
        <select value={current} onChange={(e) => updateActivePatient({ [field]: e.target.value })} className={fieldInputClass}>
          {opts.blank ? <option value="">Select</option> : null}
          {list.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </Field>
    );
  };
  const habitSelect = (key, label, options) => {
    const habits = (activePatient && activePatient.habits) || {};
    return (
      <Field label={label}>
        <select
          value={habits[key] || "Not recorded"}
          onChange={(e) => updateActivePatient({ habits: { ...habits, [key]: e.target.value } })}
          className={fieldInputClass}
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </Field>
    );
  };

  if (authLoading) {
    return <AppLoading />;
  }

  if (!authUser) {
    return (
      <LandingPage
        onLoginClick={handleGoogleLogin}
        onEmailSignIn={handleEmailSignIn}
        onEmailSignUp={handleEmailSignUp}
        onResetPassword={handleResetPassword}
        loginBusy={loginBusy}
        authError={authError}
        authNotice={authNotice}
        firebaseConfigured={firebaseConfigured}
      />
    );
  }

  if (isVerified && !membershipReady) {
    return <AppLoading />;
  }

  if (!isVerified) {
    return (
      <VerifyEmailScreen
        email={authUser.email}
        busy={verifyBusy}
        notice={verifyNotice}
        error={authError}
        onResend={handleResendVerification}
        onCheck={handleCheckVerified}
        onLogout={() => handleLogout()}
      />
    );
  }

  return (
    <div className="flex h-screen bg-enamel text-slate-800 font-sans overflow-hidden">
      
      {idleSecondsLeft !== null && (
        <IdleWarning secondsLeft={idleSecondsLeft} onStay={staySignedIn} onLogout={() => handleLogout()} />
      )}

      {pendingInvite && (
        <div role="dialog" aria-label="Team invitation" className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,520px)] bg-white border border-blue-200 rounded-xl shadow-xl p-4 text-xs space-y-2">
          <div className="font-bold text-slate-900 text-sm">{pendingInvite.clinicName || "A clinic"} invited you as {ROLE_LABEL[pendingInvite.role]}</div>
          <p className="text-slate-600">Accepting moves you into that clinic's workspace. Your own clinic stays safe and comes back if you leave. Only accept if you know this clinic.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => acceptInvite(db, authUser.email).catch(() => showToast("Could not accept. Check your connection."))} className="px-4 py-2 rounded-lg bg-[#1d4ed8] text-white font-semibold">Accept</button>
            <button type="button" onClick={() => removeMember(db, authUser.email).catch(() => showToast("Could not decline. Check your connection."))} className="px-4 py-2 rounded-lg border border-rule text-slate-700 font-semibold">Decline</button>
          </div>
        </div>
      )}

      {/* Toast Notifier */}
      {toastMessage && (
        <div className="fixed bottom-20 right-5 z-50 bg-ink text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <HelpChat />

      <datalist id="patient-options">
        {patients.map((pt) => (
          <option key={pt.id} value={pt.name} />
        ))}
      </datalist>
      <datalist id="doctor-options">
        {doctorOptions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      {/* --- SIDEBAR --- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white text-ink border-r border-rule flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="p-5 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt=""
                className="w-9 h-9 rounded-lg object-cover bg-brand-50"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div>
                <div className="font-display text-lg font-extrabold text-ink tracking-tight leading-none">
                  MeriDent
                </div>
                <div className="text-[11px] text-slate-500 font-normal mt-1">
                  Practice management
                </div>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-500 hover:text-ink"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-3 space-y-1">
            {navFor(role, [
              { label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
              { label: "Appointments Diary", icon: <CalendarDays className="w-4 h-4" /> },
              { label: "Patients & Odontogram", icon: <Users className="w-4 h-4" /> },
              { label: "OPG & Diagnosis Studio", icon: <ScanSearch className="w-4 h-4" /> },
              { label: "Billing & Invoices", icon: <IndianRupee className="w-4 h-4" /> },
              { label: "MeriDent Connect", icon: <MessagesSquare className="w-4 h-4" /> },
              { label: "Reports", icon: <BarChart3 className="w-4 h-4" /> },
              { label: "Stock Maintenance", icon: <Package className="w-4 h-4" /> },
              { label: "Employee Roles & Roster", icon: <UserCog className="w-4 h-4" /> },
              { label: "Practice Profile", icon: <Hospital className="w-4 h-4" /> },
            ]).map((item) => {
              const isActive = activeNav === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setActiveNav(item.label);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-700 font-semibold"
                      : "text-slate-600 hover:bg-enamel hover:text-ink"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            {authUser.photoURL ? (
              <img src={authUser.photoURL} alt="Avatar" className="h-9 w-9 rounded-full border border-rule object-cover" />
            ) : (
              <div className="h-9 w-9 shrink-0 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-ink">{authUser.displayName || "Dr. Clinician"}</div>
              <div className="truncate text-[11px] text-slate-500">{authUser.email}</div>
              {activeMember && <div className="truncate text-[11px] text-brand-600" data-testid="member-role">{ROLE_LABEL[role]} at {activeMember.clinicName || "this clinic"}</div>}
            </div>
          </div>
          {activeMember && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Leave ${activeMember.clinicName || "this clinic"}? You will need a new invitation to return.`)) removeMember(db, authUser.email).catch(() => showToast("Could not leave. Check your connection."));
              }}
              className="mt-3 w-full rounded-lg border border-rule px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-enamel"
            >
              Leave this clinic
            </button>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-rule px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* --- WORKSPACE --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white/90 backdrop-blur border-b border-rule px-3 sm:px-6 flex items-center justify-between gap-2 sticky top-0 z-30">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 shrink">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu" className="md:hidden shrink-0 -ml-1 p-1.5 text-slate-600 hover:text-slate-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:block font-display text-lg font-bold text-ink tracking-tight truncate">{activeNav}</div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end min-w-0">
            {branches.length > 1 && (
              <select
                aria-label="Branch"
                value={shownBranch}
                onChange={(e) => setActiveBranch(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold text-slate-700 max-w-[160px] focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">All branches</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
            <GlobalSearch
              patients={patients}
              appointments={appointments}
              invoices={invoices}
              onPick={(type, item) => {
                if (type === "patient") {
                  setActiveNav("Patients & Odontogram");
                  setSelectedPatientId(item.id);
                  setActiveModalTab("32-Tooth Odontogram");
                  setIsChartModalOpen(true);
                } else if (type === "appointment") {
                  setActiveNav("Appointments Diary");
                  setDiaryViewId("all");
                  setDiaryQuery(item.patientName);
                } else {
                  setActiveNav("Billing & Invoices");
                  setInvoiceFilter("all");
                  setInvoiceQuery(item.id);
                }
              }}
            />
            <div
              title={authUser.email}
              className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold"
            >
              {(authUser.displayName || authUser.email || "M").trim().charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          
          {/* TAB 1: PATIENTS & ODONTOGRAM */}
          {activeNav === "Patients & Odontogram" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Patient Records</h1>
                  <p className="text-xs text-slate-500">FDI 32-Tooth Odontogram, Trauma, Rx & History</p>
                </div>
                <button
                  onClick={() => setIsAddPatientOpen(true)}
                  className="shrink-0 whitespace-nowrap px-4 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-card"
                >
                  <Plus className="w-4 h-4" /> Add Patient
                </button>
              </div>

              {patients.length > 0 && (
                <input
                  type="search"
                  aria-label="Filter patients"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by name or phone"
                  className="mb-4 w-full sm:w-80 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
                />
              )}
              {filteredPatients.length === 0 ? (
                <div className="bg-white rounded-xl border border-rule p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">{patients.length ? "No patient matches your filter" : "No Patient Records Yet"}</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {patients.length ? "Try a different name or phone number." : 'Click "Add Patient" to register a clinical case sheet with dental odontogram and systemic review.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPatients.map((p) => {
                    const chartedCount = chartedTeeth(p.toothConditions);
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPatientId(p.id);
                          setIsChartModalOpen(true);
                        }}
                        className="bg-white rounded-xl border border-rule p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <div>
                          <div className="text-base font-bold text-slate-900 flex flex-wrap items-center gap-x-2 gap-y-1">
                            {p.name}
                            <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                              Age: {p.age || "N/A"} Yrs
                            </span>
                            <span className="text-[10px] text-slate-500 font-normal">({p.gender})</span>
                            {p.medicalAlert && (
                              <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                                ALERT: {p.medicalAlert}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {p.phone}{patientLocation(p) ? ` • ${patientLocation(p)}` : ""} • Registered: {p.registeredDate}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Conditions: <span className="font-medium text-slate-700">{p.conditions || "None reported"}</span>
                          </div>
                        </div>

                        <div className="sm:text-right flex items-center justify-between sm:justify-end gap-4">
                          <div>
                            <span className="inline-block whitespace-nowrap text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                              {chartedCount} Teeth Charted
                            </span>
                            <div className="text-[11px] text-slate-500 mt-1">Open Casesheet →</div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Remove record for ${p.name}?`)) {
                                setPatients((prev) => prev.filter((x) => x.id !== p.id));
                                logAudit("patient.delete", p.name);
                                showToast(`Removed ${p.name}`);
                              }
                            }}
                            className="p-1 text-slate-500 hover:text-rose-500 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OPG & DIAGNOSIS STUDIO */}
          {activeNav === "OPG & Diagnosis Studio" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">OPG & Diagnosis Studio</h1>
                  <p className="text-xs text-slate-500">Side-by-Side Panoramic Radiograph & Clinical Findings Workstation</p>
                </div>
                <div>
                  {patients.length > 0 && (
                    <select
                      value={opgSelectedPatientId || (currentOpgPatient ? currentOpgPatient.id : "")}
                      onChange={(e) => setOpgSelectedPatientId(e.target.value, currentOpgPatient?.id)}
                      className="text-xs border border-rule rounded-lg px-3 py-2 bg-white text-slate-700 font-semibold focus:outline-none"
                    >
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}{p.age ? ` (${p.age}y)` : ""}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Left: OPG viewer */}
                <OpgViewer
                  key={currentOpgPatient ? currentOpgPatient.id : "none"}
                  patient={currentOpgPatient}
                  onUpload={handleOpgFileChange}
                  onRemove={() =>
                    currentOpgPatient &&
                    setPatients((prev) =>
                      prev.map((p) => (p.id === currentOpgPatient.id ? { ...p, opgImage: "", opgUploadedAt: "", opgCalibration: null } : p))
                    )
                  }
                  onCalibrate={(cal) =>
                    currentOpgPatient &&
                    setPatients((prev) => prev.map((p) => (p.id === currentOpgPatient.id ? { ...p, opgCalibration: cal } : p)))
                  }
                  onAddToNotes={(line) =>
                    currentOpgPatient &&
                    handleUpdateDiagnosis("diagnosisNotes", `${currentOpgPatient.diagnosis?.diagnosisNotes ? currentOpgPatient.diagnosis.diagnosisNotes + "\n" : ""}${line}`, currentOpgPatient.id)
                  }
                  showToast={showToast}
                />

                {/* Right: Diagnostic Entry Pane */}
                <div className="bg-white rounded-xl border border-rule p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="text-xs font-bold text-slate-800 tracking-wider uppercase flex items-center gap-2">
                      <ScanSearch className="w-4 h-4 text-blue-600" /> Diagnostic Entry Pane
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-rose-600 mb-1">Trauma Findings</label>
                      <input
                        type="text"
                        value={currentOpgPatient?.diagnosis?.trauma || ""}
                        onChange={(e) => handleUpdateDiagnosis("trauma", e.target.value, currentOpgPatient?.id)}
                        placeholder="Crown fracture, luxation, alveolar ridge integrity..."
                        className="w-full px-3 py-2 border border-rule rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Impaction Classification</label>
                      <input
                        type="text"
                        value={currentOpgPatient?.diagnosis?.impaction || ""}
                        onChange={(e) => handleUpdateDiagnosis("impaction", e.target.value, currentOpgPatient?.id)}
                        placeholder="Angulation, depth, position relative to ramus..."
                        className="w-full px-3 py-2 border border-rule rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Bone Deformations & Height</label>
                      <input
                        type="text"
                        value={currentOpgPatient?.diagnosis?.boneDeformations || ""}
                        onChange={(e) => handleUpdateDiagnosis("boneDeformations", e.target.value, currentOpgPatient?.id)}
                        placeholder="Horizontal bone loss, angular crest defects, furcation..."
                        className="w-full px-3 py-2 border border-rule rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Diagnosis & Treatment Plan</label>
                      <textarea
                        rows={3}
                        value={currentOpgPatient?.diagnosis?.diagnosisNotes || ""}
                        onChange={(e) => handleUpdateDiagnosis("diagnosisNotes", e.target.value, currentOpgPatient?.id)}
                        placeholder="Type formal clinical diagnosis and operative procedures..."
                        className="w-full px-3 py-2 border border-rule rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => showToast("Diagnostic findings saved successfully")}
                      className="w-full py-2.5 bg-[#1d4ed8] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Save Diagnostic Findings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APPOINTMENTS DIARY */}
          {activeNav === "Appointments Diary" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Appointments Diary</h1>
                  <p className="text-xs text-slate-500">Chair-side scheduling & automated WhatsApp alerts</p>
                </div>
                <button
                  onClick={() => setIsAddApptOpen(true)}
                  className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-card"
                >
                  <Plus className="w-4 h-4" /> Book Appointment
                </button>
              </div>

              {(dueApptReminders.length > 0 || duePayReminders.length > 0) && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3" data-testid="reminders-panel">
                  <div className="text-xs font-bold text-blue-900">
                    Reminders to send ({dueApptReminders.length + duePayReminders.length})
                  </div>
                  <div className="space-y-2">
                    {dueApptReminders.map((d) => (
                      <div key={`${d.appt.id}-${d.kind}`} className="flex items-center justify-between gap-3 bg-white rounded-lg border border-blue-100 px-3 py-2 text-xs">
                        <div>
                          <div className="font-semibold text-slate-900">{d.appt.patientName}</div>
                          <div className="text-[11px] text-slate-500">
                            {d.kind === "sameDay" ? "Today" : "Tomorrow"} at {formatTime12(d.appt.time)} · {d.appt.procedure}
                          </div>
                        </div>
                        <button
                          onClick={() => sendApptReminder(d)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap"
                        >
                          <Send className="w-3 h-3" /> Remind
                        </button>
                      </div>
                    ))}
                    {duePayReminders.map((d) => (
                      <div key={`${d.inv.id}-pay`} className="flex items-center justify-between gap-3 bg-white rounded-lg border border-blue-100 px-3 py-2 text-xs">
                        <div>
                          <div className="font-semibold text-slate-900">{d.inv.patient}</div>
                          <div className="text-[11px] text-slate-500">
                            Payment due ₹{formatINR(balancePaise(d.inv))} · {d.inv.id}
                          </div>
                        </div>
                        <button
                          onClick={() => sendPayReminder(d)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap"
                        >
                          <Send className="w-3 h-3" /> Remind
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-blue-800/70">
                    WhatsApp opens with the message ready. Tap Send there, then come back for the next one.
                  </p>
                </div>
              )}

              {dueRecallList.length > 0 && (
                <div className="bg-white border border-rule rounded-xl p-4 space-y-3" data-testid="recall-panel">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-900">Patient recall ({dueRecallList.length} due)</div>
                    {dueRecallList.length > 5 && (
                      <button
                        onClick={() => setShowAllRecalls(!showAllRecalls)}
                        className="text-[11px] font-semibold text-blue-700"
                      >
                        {showAllRecalls ? "Show fewer" : "Show all"}
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {(showAllRecalls ? dueRecallList : dueRecallList.slice(0, 5)).map((d) => (
                      <div key={d.patient.id} className="flex items-center justify-between gap-3 bg-enamel rounded-lg border border-slate-100 px-3 py-2 text-xs">
                        <div>
                          <div className="font-semibold text-slate-900">{d.patient.name}</div>
                          <div className="text-[11px] text-slate-500">
                            Last visit {d.lastVisit.toLocaleDateString("en-IN")} · {d.months} months ago
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => snoozeRecall(d)}
                            className="px-2 py-1.5 text-slate-500 hover:text-slate-700 text-[11px] font-semibold whitespace-nowrap"
                          >
                            Not now
                          </button>
                          <button
                            onClick={() => sendRecall(d)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap"
                          >
                            <Send className="w-3 h-3" /> Recall
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Patients whose last visit was 6+ months ago (or the interval set on their profile), with no visit booked. Opted-out patients are never listed.
                  </p>
                </div>
              )}

              <FollowUpPanels
                feedbackDue={feedbackDue} awaiting={awaitingList} low={lowList} plansDue={planFollowUps} summary={feedbackStats}
                reviewLink={practiceProfile.reviewLink} canWrite={canWrite(role, "appointments")}
                onAsk={askFeedback} onRate={rateFeedback} onResolve={handleFeedback} onPlan={followUpPlan} onSnoozePlan={snoozePlan}
              />
              <LabBoard rows={labRows} canWrite={canWrite(role, "patients")} onReceive={receiveLab} onFit={fitLab} onChase={chaseLab} onTellPatient={tellPatientLab} />
              <ReviewInvites appointments={appointments} reviewLink={practiceProfile.reviewLink} onReview={inviteReview} />

              <BookingRequests requests={bookingRequests} onConfirm={confirmBooking} onDecline={declineBooking} onContact={contactBooking} />
              <QueuePanel queue={queue} today={dateKey()} onAdd={handleAddWalkIn} onStatus={handleQueueStatus} onRemove={handleQueueRemove} />

              {appointments.length === 0 ? (
                <div className="bg-white rounded-xl border border-rule p-12 text-center space-y-3">
                  <Calendar className="w-10 h-10 text-blue-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">No appointments yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">Book a visit to see today's list, get reminders ready to send, and avoid double-booking a chair.</p>
                </div>
              ) : (() => {
                const dsum = diarySummary(appointments);
                const rows = diaryView(appointments, { view: diaryViewId, query: diaryQuery });
                return (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="diary-summary">
                    {[
                      { label: "Today", value: dsum.today, tone: "text-slate-900" },
                      { label: "Tomorrow", value: dsum.tomorrow, tone: "text-slate-900" },
                      { label: "Upcoming", value: dsum.upcoming, tone: "text-slate-900" },
                      { label: "Needs a status", value: dsum.needsUpdate, tone: dsum.needsUpdate ? "text-amber-600" : "text-slate-900" },
                    ].map((c) => (
                      <div key={c.label} className="bg-white border border-rule rounded-xl p-4">
                        <div className="text-[11px] font-semibold text-slate-500">{c.label}</div>
                        <div className={`text-lg font-bold mt-1 tabular ${c.tone}`}>{c.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs" role="group" aria-label="Show appointments">
                    {[["day", "Day view"], ["today", "Today"], ["upcoming", "Upcoming"], ["past", "Past"], ["update", `Needs a status (${dsum.needsUpdate})`], ["all", "All"]].map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={diaryViewId === id}
                        onClick={() => setDiaryViewId(id)}
                        className={`px-3 py-1.5 rounded-full border font-semibold ${diaryViewId === id ? "bg-ink text-white border-ink" : "bg-white text-slate-700 border-rule hover:bg-blue-50"}`}
                      >
                        {label}
                      </button>
                    ))}
                    <input
                      type="search"
                      aria-label="Search appointments"
                      value={diaryQuery}
                      onChange={(e) => setDiaryQuery(e.target.value)}
                      placeholder="Search patient, phone or doctor"
                      className="ml-auto w-full sm:w-64 px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
                    />
                  </div>

                  {diaryViewId === "day" ? (() => {
                    const grid = dayGrid(appointments, dayDate, ["Chair 1 (Main Operatory)", "Chair 2 (Pediatric / Perio)", "Chair 3 (Prosthodontics)"]);
                    const marks = hourMarks();
                    return (
                      <div className="bg-white rounded-xl border border-rule shadow-xs p-4 space-y-3" data-testid="day-view">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <button type="button" aria-label="Previous day" onClick={() => setDayDate(shiftDay(dayDate, -1))} className="px-2.5 py-1.5 border border-rule rounded-lg font-bold hover:bg-blue-50">‹</button>
                          <input type="date" aria-label="Day to show" value={dayDate} onChange={(e) => e.target.value && setDayDate(e.target.value)} className="px-2.5 py-1.5 border border-slate-300 rounded-lg" />
                          <button type="button" aria-label="Next day" onClick={() => setDayDate(shiftDay(dayDate, 1))} className="px-2.5 py-1.5 border border-rule rounded-lg font-bold hover:bg-blue-50">›</button>
                          <button type="button" onClick={() => setDayDate(dateKey())} className="px-3 py-1.5 border border-rule rounded-lg font-semibold hover:bg-blue-50">Today</button>
                          <span className="ml-auto text-slate-500">{grid.total} {grid.total === 1 ? "visit" : "visits"} on {new Date(dayDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <div className="flex min-w-[640px]">
                            <div className="w-14 shrink-0 relative" style={{ height: grid.heightPx + 28, paddingTop: 28 }}>
                              {marks.map((m) => (
                                <div key={m.hour} className="absolute right-2 text-[10px] text-slate-500 -translate-y-1.5" style={{ top: m.top + 28 }}>{formatTime12(`${m.hour}:00`)}</div>
                              ))}
                            </div>
                            {grid.columns.map((col) => (
                              <div key={col.chair} className="flex-1 min-w-[170px] border-l border-rule">
                                <div className="h-7 px-2 text-[11px] font-bold text-slate-700 truncate" title={col.chair}>{col.chair.split(" (")[0]}</div>
                                <div className="relative" style={{ height: grid.heightPx }}>
                                  {marks.map((m) => (
                                    <div key={m.hour} className="absolute left-0 right-0 border-t border-slate-100" style={{ top: m.top }} />
                                  ))}
                                  {col.items.map(({ appt, top, height }) => (
                                    <div
                                      key={appt.id}
                                      className={`absolute left-1 right-1 rounded-md border px-2 py-0.5 text-[11px] overflow-hidden ${
                                        appt.status === "Completed" ? "bg-emerald-50 border-emerald-300 text-emerald-900" : appt.status === "No show" ? "bg-rose-50 border-rose-300 text-rose-900" : "bg-blue-50 border-blue-300 text-blue-900"
                                      }`}
                                      style={{ top, height: height - 2 }}
                                      title={`${appt.patientName}: ${appt.procedure} (${appt.status || "Confirmed"})`}
                                    >
                                      <span className="font-bold">{formatTime12(appt.time)}</span> {appt.patientName}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {grid.offHours.length > 0 && (
                          <p className="text-[11px] text-amber-700">Outside clinic hours: {grid.offHours.map((a) => `${a.patientName} at ${formatTime12(a.time)}`).join(", ")}</p>
                        )}
                      </div>
                    );
                  })() : (
                  <div className="bg-white rounded-xl border border-rule overflow-x-auto shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-enamel text-slate-600 font-semibold uppercase text-[10px] border-b border-rule">
                        <tr>
                          <th className="p-3.5">Patient</th>
                          <th className="p-3.5">Date & time</th>
                          <th className="p-3.5">Chair</th>
                          <th className="p-3.5">Procedure</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.length === 0 && (
                          <tr><td colSpan={6} className="p-8 text-center text-slate-500">{diaryQuery ? "No appointment matches your search." : "No appointments in this view."}</td></tr>
                        )}
                        {rows.map((appt) => (
                          <tr key={appt.id} className="hover:bg-enamel/60">
                            <td className="p-3.5">
                              <div className="font-bold text-slate-900">{appt.patientName}</div>
                              <div className="text-[10px] text-slate-500">{appt.phone}</div>
                            </td>
                            <td className="p-3.5 font-medium">
                              {appt.date === dateKey() ? "Today" : new Date(appt.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} at <strong>{formatTime12(appt.time)}</strong>
                              {appt.doctor ? <div className="text-[10px] text-slate-500">{appt.doctor}</div> : null}
                            </td>
                            <td className="p-3.5 text-slate-600">{appt.chair}</td>
                            <td className="p-3.5 font-semibold text-blue-700">{appt.procedure}</td>
                            <td className="p-3.5">
                              <select
                                aria-label={`Status for ${appt.patientName}`}
                                value={APPT_STATUSES.includes(appt.status) ? appt.status : "Confirmed"}
                                onChange={(e) => { logAudit("appointment.status", appt.patientName, `${appt.status || "Confirmed"} to ${e.target.value}`); setAppointments((prev) => prev.map((x) => (x.id === appt.id ? withStatus(x, e.target.value) : x))); }}
                                className={`px-2 py-1 rounded-lg border text-[11px] font-bold bg-white ${
                                  appt.status === "Completed" ? "border-emerald-300 text-emerald-700" : appt.status === "Cancelled" || appt.status === "No show" ? "border-rose-300 text-rose-700" : "border-blue-200 text-blue-700"
                                }`}
                              >
                                {APPT_STATUSES.map((st) => (<option key={st}>{st}</option>))}
                              </select>
                              {needsUpdate(appt) ? <div className="text-[10px] font-semibold text-amber-600 mt-1">Mark the outcome</div> : null}
                              {appt.reminders && (appt.reminders.dayBefore || appt.reminders.sameDay) ? (
                                <div className="text-[10px] text-slate-500 mt-1">Reminder sent</div>
                              ) : null}
                            </td>
                            <td className="p-3.5 text-center space-x-2 whitespace-nowrap">
                              <button
                                onClick={() => sendAppointmentWhatsApp(appt)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold inline-flex items-center gap-1"
                              >
                                <Send className="w-3 h-3" /> WhatsApp
                              </button>
                              <button
                                aria-label={`Delete appointment for ${appt.patientName}`}
                                onClick={() => { if (confirm(`Delete the appointment for ${appt.patientName}? To keep a record, set its status to Cancelled instead.`)) setAppointments((prev) => prev.filter((x) => x.id !== appt.id)); logAudit("appointment.delete", appt.patientName, `${appt.date} ${appt.time}`); }}
                                className="p-1 text-slate-500 hover:text-rose-500"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  )}
                </>
                );
              })()}
            </div>
          )}

          {/* TAB 4: BILLING & INVOICES */}
          {activeNav === "Billing & Invoices" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Billing & Invoices</h1>
                  <p className="text-xs text-slate-500">GST invoices, part payments and UPI collection</p>
                </div>
                <button
                  onClick={() => setIsAddInvoiceOpen(true)}
                  className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-card"
                >
                  <Plus className="w-4 h-4" /> New Invoice
                </button>
              </div>

              {invoices.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="billing-summary">
                  {[
                    { label: "Billed this month", value: billing.billedP, tone: "text-slate-900" },
                    { label: "Collected this month", value: billing.collectedP, tone: "text-emerald-700" },
                    { label: "Outstanding (all time)", value: billing.outstandingP, tone: billing.outstandingP ? "text-rose-600" : "text-slate-900" },
                    { label: `Overdue${billing.overdueCount ? ` (${billing.overdueCount})` : ""}`, value: billing.overdueP, tone: billing.overdueP ? "text-rose-600" : "text-slate-900" },
                  ].map((c) => (
                    <div key={c.label} className="bg-white border border-rule rounded-xl p-4">
                      <div className="text-[11px] font-semibold text-slate-500">{c.label}</div>
                      <div className={`text-lg font-bold mt-1 tabular ${c.tone}`}>₹{formatINR(c.value)}</div>
                    </div>
                  ))}
                </div>
              )}

              {aging.count > 0 && (
                <div className="space-y-3" data-testid="receivables">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {aging.buckets.map((b) => {
                      const on = invoiceFilter === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          aria-pressed={on}
                          disabled={b.count === 0}
                          onClick={() => setInvoiceFilter(on ? "all" : b.id)}
                          className={`text-left rounded-xl border p-4 transition-colors disabled:opacity-50 disabled:cursor-default ${
                            on ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-rule bg-white hover:border-blue-300"
                          }`}
                        >
                          <div className="text-[11px] font-semibold text-slate-500">{b.label}</div>
                          <div className={`text-lg font-bold mt-1 tabular ${b.id === "60+" && b.count ? "text-rose-600" : "text-slate-900"}`}>
                            ₹{formatINR(b.totalP)}
                          </div>
                          <div className="text-[11px] text-slate-500">{b.count} unpaid {b.count === 1 ? "invoice" : "invoices"}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {invoices.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs" role="group" aria-label="Show invoices">
                  {[
                    ["all", "All invoices"],
                    ["unpaid", `Unpaid (${aging.count})`],
                    ["part", "Part paid"],
                    ["paid", "Paid"],
                    ["overdue", `Overdue (${overdueList.length})`],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={invoiceFilter === id}
                      onClick={() => setInvoiceFilter(id)}
                      className={`px-3 py-1.5 rounded-full border font-semibold ${
                        invoiceFilter === id ? "bg-ink text-white border-ink" : "bg-white text-slate-700 border-rule hover:bg-blue-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <input
                    type="search"
                    aria-label="Search invoices"
                    value={invoiceQuery}
                    onChange={(e) => setInvoiceQuery(e.target.value)}
                    placeholder="Search patient, invoice or treatment"
                    className="ml-auto w-full sm:w-64 px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => downloadCsv(invoicesCsv(visibleInvoices), `invoices-${dateKey()}.csv`)}
                    className="px-3 py-1.5 bg-white border border-rule hover:bg-blue-50 rounded-lg font-semibold text-slate-800 inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Export list
                  </button>
                  {AGING_BUCKETS.some((b) => b.id === invoiceFilter) && (
                    <span className="text-slate-500">Showing {AGING_BUCKETS.find((b) => b.id === invoiceFilter).label}, oldest first</span>
                  )}
                </div>
              )}

              {invoices.length === 0 ? (
                <div className="bg-white rounded-xl border border-rule p-12 text-center space-y-3">
                  <IndianRupee className="w-10 h-10 text-blue-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">No invoices yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">Bill a visit with GST, take part payments and share a UPI QR for the balance.</p>
                  <button
                    type="button"
                    onClick={() => setIsAddInvoiceOpen(true)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                  >
                    Create first invoice
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-rule overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-enamel text-slate-600 font-semibold uppercase text-[10px] border-b border-rule">
                      <tr>
                        <th className="p-4">Invoice</th>
                        <th className="p-4">Patient</th>
                        <th className="p-4">Payment</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Total (₹)</th>
                        <th className="p-4">Balance (₹)</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleInvoices.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">{invoiceQuery ? "No invoice matches your search." : "Nothing to show in this view."}</td>
                        </tr>
                      )}
                      {visibleInvoices.map(normalizeInvoice).map((inv) => (
                        <tr key={inv.id} className="hover:bg-enamel/60">
                          <td className="p-4">
                            <div className="font-bold text-blue-700">{inv.id}</div>
                            {balancePaise(inv) > 0 && invoiceAgeDays(inv) !== null ? (
                              <div className="text-[10px] text-slate-500">{invoiceAgeDays(inv)} {invoiceAgeDays(inv) === 1 ? "day" : "days"} old</div>
                            ) : null}
                          </td>
                          <td className="p-4 font-semibold">{inv.patient}</td>
                          <td className="p-4 text-slate-600">
                            {inv.paymentMode || "Cash"}
                            {inv.treatment ? <div className="text-[10px] text-slate-500 max-w-[14rem] truncate">{inv.treatment}</div> : null}
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {paymentStatus(inv)}
                            </span>
                            {isOverdue(inv) ? (
                              <div className="text-[10px] font-bold text-rose-600 mt-1">Overdue by {daysOverdue(inv)} {daysOverdue(inv) === 1 ? "day" : "days"}</div>
                            ) : balancePaise(inv) > 0 && inv.dueDate ? (
                              <div className="text-[10px] text-slate-500 mt-1">Due {new Date(inv.dueDate).toLocaleDateString("en-IN")}</div>
                            ) : null}
                          </td>
                          <td className="p-4 font-bold text-sm">
                            ₹{formatINR(inv.totalP)}
                            {inv.gstRate > 0 ? <div className="text-[10px] font-normal text-slate-500">incl. GST {inv.gstRate}%</div> : null}
                          </td>
                          <td className={`p-4 font-bold text-sm ${balancePaise(inv) > 0 ? "text-rose-600" : "text-emerald-600"}`}>₹{formatINR(balancePaise(inv))}</td>
                          <td className="p-4 text-center space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => { setPayForm({ amount: "", mode: "Cash" }); setActiveUpiQrInvoice(inv); }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 border border-rule text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                            >
                              <QrCode className="w-3.5 h-3.5" /> {balancePaise(inv) > 0 ? "Collect" : "Payments"}
                            </button>
                            <button
                              onClick={() => sendInvoiceToPatient(inv)}
                              className="px-3 py-1.5 bg-white hover:bg-emerald-50 border border-rule text-slate-800 rounded-lg text-xs font-semibold"
                              aria-label={`Send invoice ${inv.id} on WhatsApp`}
                            >
                              Send
                            </button>
                            <button
                              onClick={() => handlePrintInvoice(inv, false)}
                              className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-rule text-slate-800 rounded-lg text-xs font-semibold"
                            >
                              Print
                            </button>
                            {balancePaise(inv) > 0 && (() => {
                              const due = duePayReminders.find((d) => d.inv.id === inv.id);
                              if (due) {
                                return (
                                  <button
                                    onClick={() => sendPayReminder(due)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                                  >
                                    Remind
                                  </button>
                                );
                              }
                              return inv.lastReminderAt ? (
                                <span className="text-[10px] text-slate-500">Reminded {new Date(inv.lastReminderAt).toLocaleDateString("en-IN")}</span>
                              ) : null;
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* MERIDENT CONNECT */}
          {activeNav === "MeriDent Connect" && (
            <Connect
              api={connectApi}
              uid={CLINIC_ID}
              showToast={showToast}
              geocode={geocodeAddress}
              defaults={{ clinicName: practiceProfile.name, clinicAddress: practiceProfile.address, phone: practiceProfile.phone }}
            />
          )}

          {/* REPORTS */}
          {activeNav === "Reports" && (
            <div className="space-y-6" data-testid="reports-screen">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Reports</h1>
                  <p className="text-xs text-slate-500">Daily collections and GST summary for your accountant</p>
                </div>
                <input
                  type="month"
                  aria-label="Report month"
                  value={reportMonth}
                  max={currentMonthKey()}
                  onChange={(e) => e.target.value && setReportMonth(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none bg-white"
                />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Received", value: reportCollections.totals.totalP, tone: "text-emerald-700" },
                  { label: "GST payable", value: reportGst.sum.taxP, tone: "text-blue-700" },
                  { label: "Invoiced (incl. GST)", value: reportGst.sum.totalP, tone: "text-slate-900" },
                  { label: "Outstanding (all time)", value: outstandingTotalP(reportInvoices), tone: "text-rose-600" },
                ].map((c) => (
                  <div key={c.label} className="bg-white border border-rule rounded-xl p-4">
                    <div className="text-[11px] font-semibold text-slate-500">{c.label}</div>
                    <div className={`text-lg font-bold mt-1 ${c.tone}`}>₹{formatINR(c.value)}</div>
                  </div>
                ))}
              </div>

              <DentistEarnings
                report={dentistCmp}
                ym={reportMonth}
                commissions={practiceProfile.commissions || {}}
                canEditRates={role === "owner"}
                onRate={(name, v) => setPracticeProfile({ ...practiceProfile, commissions: { ...(practiceProfile.commissions || {}), [name]: v === "" ? "" : cleanPct(v) } })}
                onDownload={() => downloadCsv(dentistEarningsCsv(dentistCmp, reportMonth), `dentists-${reportMonth}.csv`)}
              />

              <BranchCompare cmp={branchCmp} ym={reportMonth} onDownload={() => downloadCsv(branchComparisonCsv(branchCmp, reportMonth), `branches-${reportMonth}.csv`)} />

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => downloadCsv(collectionsCsv(reportInvoices, reportMonth), `collections-${reportMonth}.csv`)}
                  className="px-3 py-2 bg-white border border-rule hover:bg-blue-50 rounded-lg text-xs font-semibold text-slate-800 inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Collections (spreadsheet)
                </button>
                <button
                  onClick={() => downloadCsv(gstRegisterCsv(reportInvoices, reportMonth), `gst-register-${reportMonth}.csv`)}
                  className="px-3 py-2 bg-white border border-rule hover:bg-blue-50 rounded-lg text-xs font-semibold text-slate-800 inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> GST register (spreadsheet)
                </button>
                <button
                  onClick={printReport}
                  className="px-3 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  Print / save as PDF
                </button>
              </div>

              <div className="bg-white border border-rule rounded-xl overflow-x-auto">
                <div className="px-4 pt-3 text-xs font-bold text-slate-900">Money received · {monthLabel(reportMonth)}</div>
                {reportCollections.days.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">No payments recorded this month.</div>
                ) : (
                  <table className="w-full text-left text-xs mt-2">
                    <thead className="bg-enamel text-slate-600 font-semibold uppercase text-[10px] border-y border-rule">
                      <tr>
                        <th className="p-3">Date</th>
                        {[...MODE_KEYS, ...(reportCollections.totals.byMode.Other > 0 ? ["Other"] : [])].map((m) => (
                          <th key={m} className="p-3 text-right">{m}</th>
                        ))}
                        <th className="p-3 text-right">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportCollections.days.map((d) => (
                        <tr key={d.date}>
                          <td className="p-3 font-semibold">{d.date}</td>
                          {[...MODE_KEYS, ...(reportCollections.totals.byMode.Other > 0 ? ["Other"] : [])].map((m) => (
                            <td key={m} className="p-3 text-right text-slate-600">{d.byMode[m] ? formatINR(d.byMode[m]) : "–"}</td>
                          ))}
                          <td className="p-3 text-right font-bold">{formatINR(d.totalP)}</td>
                        </tr>
                      ))}
                      <tr className="bg-enamel font-bold">
                        <td className="p-3">Total</td>
                        {[...MODE_KEYS, ...(reportCollections.totals.byMode.Other > 0 ? ["Other"] : [])].map((m) => (
                          <td key={m} className="p-3 text-right">{formatINR(reportCollections.totals.byMode[m])}</td>
                        ))}
                        <td className="p-3 text-right">{formatINR(reportCollections.totals.totalP)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>

              <div className="bg-white border border-rule rounded-xl p-4 text-xs space-y-2">
                <div className="font-bold text-slate-900">GST summary · invoices raised in {monthLabel(reportMonth)}</div>
                {[
                  ["Invoices", String(reportGst.sum.invoices)],
                  ["Exempt services (therapeutic)", `₹${formatINR(reportGst.sum.exemptP)}`],
                  ["Taxable services (cosmetic)", `₹${formatINR(reportGst.sum.taxableAt18P)}`],
                  ["CGST collected", `₹${formatINR(reportGst.sum.cgstP)}`],
                  ["SGST collected", `₹${formatINR(reportGst.sum.sgstP)}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-slate-600">
                    <span>{k}</span>
                    <span className="font-semibold text-slate-900">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-slate-900">
                  <span>Total GST payable</span>
                  <span>₹{formatINR(reportGst.sum.taxP)}</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  GST is counted on the invoice date. Money received is counted on the payment date. Please have your accountant verify before filing.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: STOCK MAINTENANCE */}
          {activeNav === "Stock Maintenance" && (() => {
            const sum = stockSummary(inventory);
            const rows = stockView(inventory, { view: stockViewId, query: stockQuery });
            return (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Stock Maintenance</h1>
                  <p className="text-xs text-slate-500">Consumables, materials and medicines: reorder levels and expiry dates</p>
                </div>
                <div className="flex gap-2">
                  {inventory.length > 0 && (
                    <button onClick={sendReorderList} className="px-3 py-2 bg-white border border-rule hover:bg-emerald-50 rounded-lg text-xs font-semibold text-slate-800">
                      Send reorder list
                    </button>
                  )}
                  <button
                    onClick={() => setIsAddStockOpen(true)}
                    className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-card"
                  >
                    <Plus className="w-4 h-4" /> Add Stock Item
                  </button>
                </div>
              </div>

              {inventory.length === 0 ? (
                <div className="bg-white rounded-xl border border-rule p-12 text-center space-y-3">
                  <Package className="w-10 h-10 text-blue-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">No stock items yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">Add the materials you use. Set a reorder level to be warned before you run out, and an expiry date to be warned before it lapses.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="stock-summary">
                    {[
                      { label: "Items", value: sum.total, tone: "text-slate-900" },
                      { label: "Out of stock", value: sum.out, tone: sum.out ? "text-rose-600" : "text-slate-900" },
                      { label: "Running low", value: sum.low, tone: sum.low ? "text-amber-600" : "text-slate-900" },
                      { label: "Expired or expiring", value: sum.expired + sum.expiring, tone: sum.expired ? "text-rose-600" : sum.expiring ? "text-amber-600" : "text-slate-900" },
                    ].map((c) => (
                      <div key={c.label} className="bg-white border border-rule rounded-xl p-4">
                        <div className="text-[11px] font-semibold text-slate-500">{c.label}</div>
                        <div className={`text-lg font-bold mt-1 tabular ${c.tone}`}>{c.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs" role="group" aria-label="Show stock">
                    {[["all", "All items"], ["reorder", `Needs reorder (${sum.out + sum.low})`], ["expiring", `Expiry (${sum.expired + sum.expiring})`]].map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={stockViewId === id}
                        onClick={() => setStockViewId(id)}
                        className={`px-3 py-1.5 rounded-full border font-semibold ${stockViewId === id ? "bg-ink text-white border-ink" : "bg-white text-slate-700 border-rule hover:bg-blue-50"}`}
                      >
                        {label}
                      </button>
                    ))}
                    <input
                      type="search"
                      aria-label="Search stock"
                      value={stockQuery}
                      onChange={(e) => setStockQuery(e.target.value)}
                      placeholder="Search item or category"
                      className="ml-auto w-full sm:w-64 px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
                    />
                  </div>

                  <div className="bg-white rounded-xl border border-rule overflow-x-auto shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-enamel text-slate-600 font-semibold uppercase text-[10px] border-b border-rule">
                        <tr>
                          <th className="p-3.5">Item</th>
                          <th className="p-3.5">Category</th>
                          <th className="p-3.5">On hand</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5">Expiry</th>
                          <th className="p-3.5 text-center">Update</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.length === 0 && (
                          <tr><td colSpan={6} className="p-8 text-center text-slate-500">{stockQuery ? "No item matches your search." : "Nothing needs attention here."}</td></tr>
                        )}
                        {rows.map((item) => {
                          const st = stockState(item);
                          const amount = stockQty[item.id] ?? "1";
                          const n = Math.max(1, Math.floor(Number(amount)) || 1);
                          return (
                            <tr key={item.id} className="hover:bg-enamel/60">
                              <td className="p-3.5 font-bold text-slate-900">{item.name}</td>
                              <td className="p-3.5 text-slate-600">{item.category}</td>
                              <td className="p-3.5">
                                <span className="font-bold text-sm tabular">{item.quantity}</span> {item.unit}
                                <div className="text-[10px] text-slate-500">Reorder at {item.minThreshold}</div>
                              </td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  st.out ? "bg-rose-100 text-rose-800 border-rose-300" : st.low ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-emerald-100 text-emerald-800 border-emerald-300"
                                }`}>
                                  {st.out ? "Out of stock" : st.low ? "Low stock" : "In stock"}
                                </span>
                              </td>
                              <td className="p-3.5">
                                {st.days === null ? <span className="text-slate-500">Not set</span> : st.expired ? (
                                  <span className="font-bold text-rose-600">Expired {Math.abs(st.days)} {Math.abs(st.days) === 1 ? "day" : "days"} ago</span>
                                ) : st.expiringSoon ? (
                                  <span className="font-bold text-amber-600">In {st.days} {st.days === 1 ? "day" : "days"}</span>
                                ) : (
                                  <span className="text-slate-600">{new Date(item.expiry).toLocaleDateString("en-IN")}</span>
                                )}
                              </td>
                              <td className="p-3.5">
                                <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                                  <input
                                    type="number"
                                    min="1"
                                    aria-label={`Amount for ${item.name}`}
                                    value={amount}
                                    onChange={(e) => setStockQty({ ...stockQty, [item.id]: e.target.value })}
                                    className="w-14 px-2 py-1 border border-slate-300 rounded text-center"
                                  />
                                  <button onClick={() => handleStockAdjust(item.id, -n)} aria-label={`Use ${n} of ${item.name}`} className="px-2.5 py-1 bg-slate-100 rounded font-semibold text-slate-700 hover:bg-slate-200">Use</button>
                                  <button onClick={() => handleStockAdjust(item.id, n)} aria-label={`Receive ${n} of ${item.name}`} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded font-semibold hover:bg-blue-100">Receive</button>
                                  <button onClick={() => handleRemoveStock(item)} aria-label={`Remove ${item.name}`} className="p-1 text-slate-500 hover:text-rose-600"><X className="w-3.5 h-3.5" /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
            );
          })()}

          {/* TAB 6: EMPLOYEE ROLES & ROSTER (Enhanced with Alerts, Leave & Performance Review) */}
          {activeNav === "Employee Roles & Roster" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Employee Roles & Roster</h1>
                  <p className="text-xs text-slate-500">Operatory Staff, License Expiry & Performance Management</p>
                </div>
                <button
                  onClick={() => setIsAddStaffOpen(true)}
                  className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-card cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Staff Member
                </button>
              </div>

              {(() => {
                const alerts = staffAlerts(employees);
                const away = onLeaveOn(employees);
                if (!alerts.length && !away.length) return null;
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-xs" data-testid="staff-alerts">
                    <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs text-amber-900">
                      <div className="font-bold">Needs attention</div>
                      {alerts.map((al) => (
                        <div key={al.text} className={al.level === "danger" ? "font-semibold text-rose-700" : ""}>{al.text}</div>
                      ))}
                      {away.length > 0 && <div>On leave today: {away.map((x) => x.name).join(", ")}</div>}
                    </div>
                  </div>
                );
              })()}

              {employees.length === 0 ? (
                <div className="bg-white rounded-xl border border-rule p-12 text-center space-y-3 shadow-xs">
                  <Briefcase className="w-10 h-10 text-slate-500 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">No Staff Added</h3>
                  <p className="text-xs text-slate-500">Add dental specialists, assistants, and hygienists to assign operatory duties.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-rule shadow-xs overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {employees.map((emp) => (
                      <div key={emp.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-enamel/50 transition">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <h3 className="text-sm font-bold text-slate-900">{emp.name}</h3>
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-rule">
                              {emp.license}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-3">
                            <span>Role: <strong className="text-slate-800">{emp.role}</strong></span>
                            <span>•</span>
                            <span className={licenseStatus(emp.licenseExpiry).tone}>{licenseStatus(emp.licenseExpiry).label}</span>
                          </div>
                          {(() => {
                            const pend = (emp.leaves || []).filter((l) => l.status === "Pending").length;
                            const avg = averageRating(emp);
                            const away = onLeaveOn([emp]).length > 0;
                            return pend || avg || away ? (
                              <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold">
                                {away && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-rule">On leave today</span>}
                                {pend > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">{pend} leave pending</span>}
                                {avg && <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Rating {avg} / 5</span>}
                              </div>
                            ) : null;
                          })()}
                          {[emp.qualification, emp.phone ? `+91 ${emp.phone}` : "", emp.shift].filter(Boolean).length > 0 ? (
                            <div className="text-xs text-slate-500">
                              {[emp.qualification, emp.phone ? `+91 ${emp.phone}` : "", emp.shift].filter(Boolean).join(" • ")}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">Active Status</span>
                            <button
                              onClick={() => {
                                setEmployees(employees.map(x => x.id === emp.id ? { ...x, active: !x.active } : x));
                                showToast(`Updated status for ${emp.name}`);
                              }}
                              className={`w-10 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${emp.active ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'}`}
                            >
                              <div className="w-4 h-4 rounded-full bg-white shadow-card"></div>
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedStaffForAction(emp);
                              setLeaveForm({...leaveForm, employeeName: emp.name});
                              setIsLeaveModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Leave
                          </button>

                          <button
                            onClick={() => {
                              setSelectedStaffForAction(emp);
                              setPerformanceForm({...performanceForm, employeeName: emp.name});
                              setIsPerformanceModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Reviews
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Remove staff member ${emp.name}?`)) {
                                setEmployees(employees.filter(x => x.id !== emp.id));
                                showToast(`Removed ${emp.name}`);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: PRACTICE PROFILE */}
          {activeNav === "Practice Profile" && (
            <div className="max-w-3xl bg-white rounded-xl border border-rule p-6 md:p-8 space-y-6">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Practice Profile & Legal Registration</h1>
                <p className="text-xs text-slate-500">Clinic details used on prescriptions, invoices, and patient messages</p>
              </div>

              {!allowedBranchIds && <BranchesCard
                branches={allBranches}
                data={{ patients: allPatients, appointments: allAppointments, invoices: allInvoices, queue: allQueue }}
                newId={newId}
                onChange={(list) => setPracticeProfile({ ...practiceProfile, branches: list })}
                onTransfer={(r, patient, toName) => {
                  setPatients(r.patients);
                  setAppointments(r.appointments);
                  setInvoices(r.invoices);
                  logAudit("patient.move", patient.name, `to ${toName}, ${r.counts.appointments} appointments, ${r.counts.invoices} invoices`);
                }}
              />}

              {!allowedBranchIds && (role === "owner" || role === "manager") && <DataPortability
                data={{ patients: allPatients, appointments: allAppointments, invoices: allInvoices, inventory, employees, profile: practiceProfile }}
                newId={newId}
                onDownloadFile={downloadFile}
                onAudit={logAudit}
                onImported={(r) => {
                  if (r.patients) setPatients(r.patients);
                  if (r.appointments) setAppointments(r.appointments);
                  if (r.invoices) setInvoices(r.invoices);
                  if (r.inventory) setInventory(r.inventory);
                  if (r.employees) setEmployees(r.employees);
                  if (r.addBranches && r.addBranches.length) setPracticeProfile({ ...practiceProfile, branches: [...allBranches, ...r.addBranches] });
                  showToast("Import complete");
                }}
              />}

              {role === "owner" && (
                <TeamCard
                  members={team}
                  branches={allBranches}
                  ownerEmail={authUser.email}
                  clinicName={practiceProfile.name}
                  origin={window.location.origin}
                  onInvite={async (v) => {
                    await createInvite(db, buildInvite(v, { clinicId: CLINIC_ID, clinicName: practiceProfile.name, ownerEmail: authUser.email }));
                    logAudit("team.invite", v.email, v.role);
                    showToast(`Invitation saved for ${v.email}`);
                  }}
                  onUpdate={(email, changes) => updateMember(db, email, changes).then(() => logAudit("team.update", email, Object.entries(changes).map(([k, v]) => `${k}: ${v}`).join(", "))).catch(() => showToast("Could not save the change. Check your connection."))}
                  onRemove={(email) => removeMember(db, email).then(() => logAudit("team.remove", email)).catch(() => showToast("Could not remove this login. Check your connection."))}
                  message={inviteMessage}
                />
              )}

              {(role === "owner" || role === "manager") && <ActivityLog entries={auditEntries} />}

              {(role === "owner" || role === "manager") && <FeeList fees={practiceProfile.fees} newId={newId} onChange={(list) => setPracticeProfile({ ...practiceProfile, fees: list })} />}

              {(role === "owner" || role === "manager") && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs space-y-2" data-testid="ai-settings">
                  <label className="flex items-center gap-2 font-semibold text-slate-800">
                    <input type="checkbox" checked={Boolean(practiceProfile.aiEnabled)} onChange={(e) => setPracticeProfile({ ...practiceProfile, aiEnabled: e.target.checked })} />
                    Use MeriDent AI writing help (drafts only)
                  </label>
                  <p className="text-slate-600">When on, staff can ask MeriDent AI to tidy visit notes and explain a treatment plan in the patient's language. Only the text typed for that request is sent to an outside AI service (Google Gemini on its free plan, which may keep the text and use it to improve Google products), never the patient's name or phone number. Every draft must be checked by the dentist.</p>
                </div>
              )}

              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs space-y-2" data-testid="booking-settings">
                <label className="flex items-center gap-2 font-semibold text-slate-800">
                  <input type="checkbox" checked={Boolean(practiceProfile.onlineBooking)} onChange={(e) => setPracticeProfile({ ...practiceProfile, onlineBooking: e.target.checked })} />
                  Accept online appointment requests
                </label>
                {practiceProfile.onlineBooking ? (
                  <>
                    <p className="text-slate-600">Share this link on WhatsApp, Instagram or Google Business Profile. Patients send a request and you confirm it in the Appointments Diary.</p>
                    <BookingShare url={bookingUrl(window.location.origin, CLINIC_ID)} clinicName={practiceProfile.name} onCopy={() => { navigator.clipboard?.writeText(bookingUrl(window.location.origin, CLINIC_ID)); showToast("Booking link copied"); }} />
                    <div className="flex flex-wrap gap-2 items-center">
                      <input readOnly aria-label="Booking link" value={bookingUrl(window.location.origin, CLINIC_ID)} onFocus={(e) => e.target.select()} className="flex-1 min-w-[220px] px-3 py-2 border border-slate-300 rounded-lg bg-white" />
                      <button type="button" onClick={() => { navigator.clipboard?.writeText(bookingUrl(window.location.origin, CLINIC_ID)); showToast("Booking link copied"); }} className="px-3 py-2 rounded-lg bg-[#1d4ed8] text-white font-semibold">Copy link</button>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-500">Off. Patients cannot book online.</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Clinic Name</label>
                  <input
                    type="text"
                    value={practiceProfile.name}
                    onChange={(e) => setPracticeProfile({ ...practiceProfile, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Udyam Registration Number</label>
                  <input
                    type="text"
                    value={practiceProfile.regNumber}
                    onChange={(e) => setPracticeProfile({ ...practiceProfile, regNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono font-bold text-indigo-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Lead Dental Surgeons</label>
                  <input
                    type="text"
                    value={practiceProfile.drName}
                    onChange={(e) => setPracticeProfile({ ...practiceProfile, drName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Qualifications</label>
                  <input
                    type="text"
                    value={practiceProfile.qualification}
                    onChange={(e) => setPracticeProfile({ ...practiceProfile, qualification: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Official Contact Number</label>
                  <input
                    type="text"
                    value={practiceProfile.phone}
                    onChange={(e) => setPracticeProfile({ ...practiceProfile, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Clinic UPI ID (for QR Billing)</label>
                  <input
                    type="text"
                    value={practiceProfile.upiId}
                    onChange={(e) => setPracticeProfile({ ...practiceProfile, upiId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono focus:outline-none"
                  />
                  {practiceProfile.upiId && !isValidUpiId(practiceProfile.upiId) ? (
                    <p className="text-[10px] text-rose-600 mt-1">A UPI ID looks like name@bank. QR codes and WhatsApp payment messages use it only when it is valid.</p>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-1">Shown as a QR code when you collect a payment and added to payment messages.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="review-link" className="block font-semibold text-slate-600 mb-1">Google review link (optional)</label>
                  <input
                    id="review-link"
                    type="url"
                    value={practiceProfile.reviewLink || ""}
                    onChange={(e) => setPracticeProfile({ ...practiceProfile, reviewLink: e.target.value })}
                    placeholder="https://g.page/r/..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                  />
                  {practiceProfile.reviewLink && !isValidReviewLink(practiceProfile.reviewLink) ? (
                    <p className="text-[10px] text-rose-600 mt-1">Paste the full link starting with https://</p>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-1">Patients who rate you 4 or 5 can be sent this link to leave a public review.</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-600 mb-1">Clinic Address</label>
                  <input
                    type="text"
                    value={practiceProfile.address}
                    onChange={(e) => setPracticeProfile({ ...practiceProfile, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                  />
                </div>

                <Field label="City">
                  <input
                    type="text"
                    value={practiceProfile.city || ""}
                    onChange={(e) => setPracticeProfile({ ...practiceProfile, city: e.target.value })}
                    className={fieldInputClass}
                  />
                </Field>

                <Field label="Pincode">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={practiceProfile.pincode || ""}
                    onChange={(e) => setPracticeProfile({ ...practiceProfile, pincode: digitsOnly(e.target.value) })}
                    className={fieldInputClass}
                  />
                  {practiceProfile.pincode && !isValidPincode(practiceProfile.pincode) ? (
                    <p className="text-[10px] text-rose-600 mt-1">Pincode must be 6 digits.</p>
                  ) : null}
                </Field>

                <Field label="State" hint="Used for GST place of supply.">
                  <select
                    value={practiceProfile.state || ""}
                    onChange={(e) => setPracticeProfile({ ...practiceProfile, state: e.target.value })}
                    className={fieldInputClass}
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Clinic Email">
                  <input
                    type="email"
                    value={practiceProfile.email || ""}
                    onChange={(e) => setPracticeProfile({ ...practiceProfile, email: e.target.value })}
                    className={fieldInputClass}
                  />
                  {practiceProfile.email && !isValidEmail(practiceProfile.email) ? (
                    <p className="text-[10px] text-rose-600 mt-1">Check the email address.</p>
                  ) : null}
                </Field>

                <Field label="Dental Council" hint="Shown on prescriptions with your registration number.">
                  <select
                    value={practiceProfile.dentalCouncil || ""}
                    onChange={(e) => setPracticeProfile({ ...practiceProfile, dentalCouncil: e.target.value })}
                    className={fieldInputClass}
                  >
                    <option value="">Select council</option>
                    {COUNCIL_NAMES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Dental Council Registration No.">
                  <input
                    type="text"
                    value={practiceProfile.councilRegNumber || ""}
                    onChange={(e) => setPracticeProfile({ ...practiceProfile, councilRegNumber: e.target.value })}
                    className={`${fieldInputClass} font-mono`}
                  />
                </Field>

                <Field label="GSTIN (optional)" hint="Only if your clinic is GST registered.">
                  <input
                    type="text"
                    maxLength={15}
                    value={practiceProfile.gstin || ""}
                    onChange={(e) => setPracticeProfile({ ...practiceProfile, gstin: e.target.value.toUpperCase() })}
                    className={`${fieldInputClass} font-mono`}
                  />
                  {practiceProfile.gstin && !isValidGstin(practiceProfile.gstin) ? (
                    <p className="text-[10px] text-rose-600 mt-1">GSTIN must be 15 characters in the standard format.</p>
                  ) : null}
                </Field>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Cloud Persistence Active
                </span>
                <button
                  onClick={() => showToast("Practice credentials saved")}
                  className="px-4 py-2 bg-[#1d4ed8] text-white rounded-lg text-xs font-semibold shadow-card hover:bg-blue-700"
                >
                  Update Profile
                </button>
              </div>
            </div>
          )}

          {/* TAB 8: DASHBOARD OVERVIEW */}
          {activeNav !== "Practice Profile" && (!practiceProfile.drName || !practiceProfile.state || !practiceProfile.councilRegNumber) && (
            <div className="mt-5 mb-6 rounded-xl border border-brand-100 bg-brand-50 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
              <div className="text-sm text-slate-700">
                <strong className="text-brand-700">Complete your clinic profile.</strong> Add the doctor name, state and Dental Council registration number so
                prescriptions and invoices are correct.
              </div>
              <button
                type="button"
                onClick={() => setActiveNav("Practice Profile")}
                className="shrink-0 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                Open Practice Profile
              </button>
            </div>
          )}

          {activeNav === "Dashboard" && (
            <div className="space-y-6">

              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-3">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clinical Overview</h1>
                  <p className="text-sm text-slate-500 mt-1">MeriDent Clinical Workspace</p>
                </div>
                <button onClick={() => setActiveNav("Appointments Diary")} className="self-start text-sm font-semibold text-blue-600 hover:text-blue-800 py-1">
                  View today's diary ›
                </button>
              </div>

              {role === "owner" && <SetupChecklist
                progress={setupProgress({ profile: practiceProfile, patients: allPatients, appointments: allAppointments, invoices: allInvoices })}
                dismissed={Boolean(practiceProfile.setupHidden)}
                onGo={(to) => setActiveNav(to)}
                onDismiss={() => setPracticeProfile({ ...practiceProfile, setupHidden: true })}
              />}

              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { title: "Patients", value: patients.length, note: "Registered patient records", icon: <UsersRound className="w-5 h-5" />, tone: "bg-blue-50 text-blue-600" },
                  { title: "Visits Today", value: diarySum.today, note: diarySum.tomorrow ? `${diarySum.tomorrow} tomorrow` : "Active bookings today", icon: <CalendarDays className="w-5 h-5" />, tone: "bg-aqua-50 text-aqua-700" },
                  { title: "Collected this month", value: `₹${formatINR(billing.collectedP)}`, note: `₹${formatINR(billing.billedP)} billed this month`, icon: <IndianRupee className="w-5 h-5" />, tone: "bg-emerald-50 text-emerald-600" },
                  { title: "Outstanding", value: `₹${formatINR(billing.outstandingP)}`, note: billing.overdueCount ? `${billing.overdueCount} overdue, ₹${formatINR(billing.overdueP)}` : "Unpaid balance across invoices", icon: <Wallet className="w-5 h-5" />, tone: billing.overdueCount ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600" },
                ].map((card) => (
                  <div key={card.title} className="bg-white rounded-xl border border-rule p-4 sm:p-5 shadow-card flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl flex items-center justify-center ${card.tone}`}>{card.icon}</div>
                    <div className="min-w-0">
                      <div className="text-[13px] sm:text-sm font-medium text-slate-500">{card.title}</div>
                      <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 break-words tabular">{card.value}</div>
                      <div className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-snug">{card.note}</div>
                    </div>
                  </div>
                ))}
              </div>

              <section className="bg-white rounded-xl border border-rule p-5 shadow-card" data-testid="today-actions">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="text-base font-bold text-slate-900">Today's actions</h2>
                  {dueApptReminders.length + dueRecallList.length + duePayReminders.length === 0 && (
                    <span className="text-xs rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 font-semibold">All caught up</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { label: "Appointment reminders", count: dueApptReminders.length, to: "Appointments Diary", on: "border-blue-200 bg-blue-50 hover:bg-blue-100", num: "text-blue-700" },
                    { label: "Patients due for recall", count: dueRecallList.length, to: "Appointments Diary", on: "border-aqua-100 bg-aqua-50 hover:bg-aqua-100", num: "text-aqua-700" },
                    { label: "Payments to chase", count: duePayReminders.length, to: "Billing & Invoices", on: "border-amber-200 bg-gold-50 hover:bg-amber-100", num: "text-gold-700" },
                  ].map((a) => (
                    <button
                      key={a.label}
                      onClick={() => setActiveNav(a.to)}
                      className={`text-left rounded-xl border p-3 sm:p-4 transition-colors ${
                        a.count > 0 ? a.on : "border-rule bg-enamel hover:bg-slate-100"
                      }`}
                    >
                      <div className={`text-2xl font-bold ${a.count > 0 ? a.num : "text-slate-500"}`}>{a.count}</div>
                      <div className="text-xs font-semibold text-slate-700 mt-0.5">{a.label}</div>
                      <div className="text-[11px] text-slate-500 mt-1 leading-snug">{a.count > 0 ? "Tap to send ›" : "Nothing to send"}</div>
                    </button>
                  ))}
                </div>
              </section>

              <BirthdayPanel due={birthdaysToday} onGreet={greetBirthday} canWrite={canWrite(role, "patients")} />

              {canRead(role, "invoices") && <DayClose summary={closeSummary} clinicName={practiceProfile.name} onCopy={(t) => { navigator.clipboard?.writeText(t); showToast("Summary copied"); }} />}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <section className="bg-white rounded-xl border border-rule p-5 shadow-card" data-testid="today-schedule">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h2 className="text-base font-bold text-slate-900">Today's schedule</h2>
                    <button onClick={() => setActiveNav("Appointments Diary")} className="text-xs font-semibold text-blue-600 hover:text-blue-800">Open diary ›</button>
                  </div>
                  {todaysVisits.length === 0 ? (
                    <p className="text-sm text-slate-500">No visits booked for the rest of today.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {todaysVisits.slice(0, 6).map((a) => (
                        <li key={a.id} className="py-2 flex items-center gap-3 text-sm">
                          <span className="w-16 shrink-0 font-bold text-blue-700 tabular">{formatTime12(a.time)}</span>
                          <span className="min-w-0 flex-1">
                            <span className="font-semibold text-slate-900">{a.patientName}</span>
                            <span className="text-slate-500"> · {a.procedure}</span>
                          </span>
                          <span className="text-xs text-slate-500 shrink-0">{String(a.chair || "").split(" (")[0]}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="bg-white rounded-xl border border-rule p-5 shadow-card" data-testid="attention">
                  <h2 className="text-base font-bold text-slate-900 mb-3">Needs attention</h2>
                  {(() => {
                    const items = [
                      { n: billing.overdueCount, text: `${billing.overdueCount} overdue ${billing.overdueCount === 1 ? "invoice" : "invoices"}, ₹${formatINR(billing.overdueP)}`, to: "Billing & Invoices" },
                      { n: diarySum.needsUpdate, text: `${diarySum.needsUpdate} past ${diarySum.needsUpdate === 1 ? "visit has" : "visits have"} no outcome marked`, to: "Appointments Diary" },
                      { n: labLate, text: `${labLate} lab ${labLate === 1 ? "order is" : "orders are"} overdue`, to: "Appointments Diary" },
                      { n: lowList.length, text: `${lowList.length} low patient ${lowList.length === 1 ? "rating needs" : "ratings need"} a call`, to: "Appointments Diary" },
                      { n: stockSum.out + stockSum.low, text: `${stockSum.out + stockSum.low} ${stockSum.out + stockSum.low === 1 ? "item" : "items"} to reorder`, to: "Stock Maintenance" },
                      { n: stockSum.expired + stockSum.expiring, text: `${stockSum.expired + stockSum.expiring} ${stockSum.expired + stockSum.expiring === 1 ? "item" : "items"} expired or expiring soon`, to: "Stock Maintenance" },
                    ].filter((x) => x.n > 0);
                    return items.length === 0 ? (
                      <p className="text-sm text-slate-500">Nothing needs attention right now.</p>
                    ) : (
                      <ul className="space-y-2">
                        {items.map((x) => (
                          <li key={x.text}>
                            <button onClick={() => setActiveNav(x.to)} className="w-full text-left flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/60 hover:bg-amber-50 px-3 py-2 text-sm font-semibold text-slate-800">
                              {x.text}
                              <span className="text-amber-700">›</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                </section>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <section className="xl:col-span-2 bg-white rounded-xl border border-rule p-5 md:p-6 shadow-card">
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Patient Registration</h2>
                      <p className="text-xs text-slate-500 mt-1">New patients over the last 7 days</p>
                    </div>
                    <span className="text-xs rounded-full bg-blue-50 text-blue-700 px-3 py-1 font-semibold">Weekly trend</span>
                  </div>
                  <div className="h-56 flex items-end gap-3 sm:gap-5 border-b border-rule px-1">
                    {dashboardPatientSeries.map((day, index) => {
                      const max = Math.max(1, ...dashboardPatientSeries.map((item) => item.value));
                      const height = day.value ? Math.max(8, (day.value / max) * 145) : 2;
                      return (
                        <div key={`${day.label}-${index}`} className="flex-1 h-full flex flex-col justify-end items-center gap-2">
                          <span className="text-xs font-semibold text-slate-600">{day.value || ""}</span>
                          <div className={`w-full max-w-12 rounded-t-lg transition-all ${day.value ? "bg-blue-500" : "bg-slate-100"}`} style={{ height: `${height}px` }} />
                          <span className="text-xs text-slate-500 pb-2">{day.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="bg-white rounded-xl border border-rule p-5 md:p-6 shadow-card">
                  <div className="mb-5">
                    <h2 className="text-base font-bold text-slate-900">Billed this week</h2>
                    <p className="text-xs text-slate-500 mt-1">Invoice value raised over the last 7 days</p>
                  </div>
                  <div className="h-56 flex items-end gap-3 border-b border-rule px-1">
                    {dashboardRevenueSeries.map((day, index) => {
                      const max = Math.max(1, ...dashboardRevenueSeries.map((item) => item.value));
                      const height = day.value ? Math.max(8, (day.value / max) * 145) : 2;
                      return (
                        <div key={`${day.label}-${index}`} className="flex-1 h-full flex flex-col justify-end items-center gap-2 min-w-0">
                          <span className="text-[10px] font-semibold text-slate-600 truncate max-w-full">
                            {day.value ? `₹${day.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : ""}
                          </span>
                          <div className={`w-full rounded-t-lg transition-all ${day.value ? "bg-emerald-500" : "bg-slate-100"}`} style={{ height: `${height}px` }} />
                          <span className="text-xs text-slate-500 pb-2">{day.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ======================================================== */}
      {/* ADD STAFF MODAL                                          */}
      {/* ======================================================== */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <form
            onSubmit={handleCreateStaff}
            className="bg-white rounded-3xl border border-rule w-full max-w-md p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Staff Member</h3>
              <button type="button" onClick={() => setIsAddStaffOpen(false)} className="text-slate-500 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Staff Name *</label>
              <input
                type="text"
                required
                value={newStaffForm.name}
                onChange={(e) => setNewStaffForm({...newStaffForm, name: e.target.value})}
                placeholder="e.g. Dr. Ramesh Kumar"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Specialty / Role</label>
              <select
                value={newStaffForm.role}
                onChange={(e) => setNewStaffForm({...newStaffForm, role: e.target.value})}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none"
              >
                <option>Orthodontist</option>
                <option>Endodontist</option>
                <option>Oral & Maxillofacial Surgeon</option>
                <option>Periodontist</option>
                <option>General Dentistry</option>
                <option>Hygienist</option>
                <option>Dental Assistant</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Mobile *</label>
                <input
                  type="tel"
                  required
                  value={newStaffForm.phone}
                  onChange={(e) => setNewStaffForm({...newStaffForm, phone: e.target.value})}
                  placeholder="10-digit number"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Qualification</label>
                <input
                  type="text"
                  value={newStaffForm.qualification}
                  onChange={(e) => setNewStaffForm({...newStaffForm, qualification: e.target.value})}
                  placeholder="e.g. BDS, MDS"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Shift</label>
              <select
                value={newStaffForm.shift}
                onChange={(e) => setNewStaffForm({...newStaffForm, shift: e.target.value})}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none"
              >
                <option>Morning</option>
                <option>Evening</option>
                <option>Full day</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">License Number</label>
                <input
                  type="text"
                  value={newStaffForm.license}
                  placeholder="Council registration no."
                  onChange={(e) => setNewStaffForm({...newStaffForm, license: e.target.value})}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">License Expiry</label>
                <input
                  type="date"
                  value={newStaffForm.licenseExpiry}
                  onChange={(e) => setNewStaffForm({...newStaffForm, licenseExpiry: e.target.value})}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                checked={newStaffForm.active}
                onChange={(e) => setNewStaffForm({...newStaffForm, active: e.target.checked})}
                className="rounded text-blue-600 cursor-pointer"
              />
              <span className="font-semibold text-slate-700">Active Duty Status</span>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button type="button" onClick={() => setIsAddStaffOpen(false)} className="px-4 py-2 border rounded-xl text-slate-600 cursor-pointer">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 cursor-pointer">Save Staff Member</button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* LEAVE MANAGEMENT MODAL                                   */}
      {/* ======================================================== */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const target = employees.find((x) => x.id === selectedStaffForAction?.id);
              if (!target) return;
              const built = buildLeave(leaveForm, target.leaves || [], newId("LV"));
              if (!built.ok) {
                showToast(built.error);
                return;
              }
              setEmployees((prev) => prev.map((x) => (x.id === target.id ? { ...x, leaves: [...(x.leaves || []), built.leave] } : x)));
              setLeaveForm((f) => ({ ...f, startDate: "", endDate: "", reason: "" }));
              showToast(`Leave request recorded for ${target.name}. Approve it below.`);
            }}
            className="bg-white rounded-3xl border border-rule w-full max-w-md p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Leave</h3>
              <button type="button" onClick={() => setIsLeaveModalOpen(false)} className="text-slate-500 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Employee Name</label>
              <input
                type="text"
                readOnly
                value={leaveForm.employeeName}
                className="w-full px-3.5 py-2.5 bg-enamel border border-rule rounded-xl font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Leave Type</label>
              <select
                value={leaveForm.leaveType}
                onChange={(e) => setLeaveForm({...leaveForm, leaveType: e.target.value})}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none"
              >
                {LEAVE_TYPES.map((t) => (<option key={t}>{t}</option>))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Reason for Leave</label>
              <textarea
                rows="3"
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                placeholder="Provide details..."
                className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none"
              />
            </div>

            {(() => {
              const live = employees.find((x) => x.id === selectedStaffForAction?.id);
              const leaves = [...(live?.leaves || [])].sort((a, b) => b.startDate.localeCompare(a.startDate));
              if (!leaves.length) return null;
              const update = (fn) => setEmployees((prev) => prev.map((x) => (x.id === live.id ? fn(x) : x)));
              return (
                <div className="space-y-2" data-testid="leave-history">
                  <div className="font-semibold text-slate-600">Leave on record</div>
                  {leaves.map((l) => (
                    <div key={l.id} className="rounded-xl border border-rule p-2.5 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-slate-800">{l.type}: {new Date(l.startDate).toLocaleDateString("en-IN")}{l.endDate !== l.startDate ? ` to ${new Date(l.endDate).toLocaleDateString("en-IN")}` : ""} ({leaveDays(l)} {leaveDays(l) === 1 ? "day" : "days"})</div>
                        {l.reason ? <div className="text-slate-500">{l.reason}</div> : null}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full font-bold border ${l.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : l.status === "Rejected" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>{l.status}</span>
                        {l.status === "Pending" && (
                          <>
                            <button type="button" onClick={() => update((x) => setLeaveStatus(x, l.id, "Approved"))} aria-label={`Approve leave from ${l.startDate}`} className="px-2 py-1 rounded bg-emerald-600 text-white font-semibold">Approve</button>
                            <button type="button" onClick={() => update((x) => setLeaveStatus(x, l.id, "Rejected"))} aria-label={`Reject leave from ${l.startDate}`} className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-semibold">Reject</button>
                          </>
                        )}
                        <button type="button" onClick={() => update((x) => removeLeave(x, l.id))} aria-label={`Delete leave from ${l.startDate}`} className="p-1 text-slate-500 hover:text-rose-600"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button type="button" onClick={() => setIsLeaveModalOpen(false)} className="px-4 py-2 border rounded-xl text-slate-600 cursor-pointer">Close</button>
              <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 cursor-pointer">Request leave</button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* PERFORMANCE REVIEW MODAL                                 */}
      {/* ======================================================== */}
      {isPerformanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const target = employees.find((x) => x.id === selectedStaffForAction?.id);
              if (!target) return;
              const built = buildReview({ rating: performanceForm.rating, notes: performanceForm.notes, reviewer: practiceProfile.drName || practiceProfile.name, date: dateKey() }, newId("RV"));
              if (!built.ok) {
                showToast(built.error);
                return;
              }
              setEmployees((prev) => prev.map((x) => (x.id === target.id ? { ...x, reviews: [built.review, ...(x.reviews || [])] } : x)));
              setPerformanceForm((f) => ({ ...f, notes: "", rating: 4 }));
              showToast(`Review saved for ${target.name}`);
            }}
            className="bg-white rounded-3xl border border-rule w-full max-w-md p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Performance reviews</h3>
              <button type="button" onClick={() => setIsPerformanceModalOpen(false)} className="text-slate-500 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Employee Name</label>
              <input
                type="text"
                readOnly
                value={performanceForm.employeeName}
                className="w-full px-3.5 py-2.5 bg-enamel border border-rule rounded-xl font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Reviewer Name</label>
              <input
                type="text"
                readOnly
                value={practiceProfile.drName || practiceProfile.name}
                className="w-full px-3.5 py-2.5 bg-enamel border border-rule rounded-xl font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Rating (1 to 5 Stars)</label>
              <div className="flex items-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setPerformanceForm({...performanceForm, rating: star})}
                    className="p-1 cursor-pointer"
                  >
                    <Star className={`w-6 h-6 ${star <= performanceForm.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Clinical / Professional Remarks</label>
              <textarea
                rows="3"
                value={performanceForm.notes}
                onChange={(e) => setPerformanceForm({...performanceForm, notes: e.target.value})}
                placeholder="Punctuality, precision in procedures, patient rapport..."
                className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none"
              />
            </div>

            {(() => {
              const live = employees.find((x) => x.id === selectedStaffForAction?.id);
              const reviews = live?.reviews || [];
              if (!reviews.length) return null;
              return (
                <div className="space-y-2" data-testid="review-history">
                  <div className="font-semibold text-slate-600">Past reviews</div>
                  {reviews.slice(0, 5).map((r) => (
                    <div key={r.id} className="rounded-xl border border-rule p-2.5">
                      <div className="font-semibold text-slate-800">{r.rating} / 5 <span className="font-normal text-slate-500">on {new Date(r.date).toLocaleDateString("en-IN")}{r.reviewer ? ` by ${r.reviewer}` : ""}</span></div>
                      {r.notes ? <div className="text-slate-500">{r.notes}</div> : null}
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button type="button" onClick={() => setIsPerformanceModalOpen(false)} className="px-4 py-2 border rounded-xl text-slate-600 cursor-pointer">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 cursor-pointer">Save review</button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* PATIENT CASESHEET MODAL (WITH SYSTEMIC ALERT & ROUTING)  */}
      {/* ======================================================== */}
      {isChartModalOpen && activePatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-rule w-full max-w-4xl p-6 md:p-7 relative max-h-[92vh] flex flex-col justify-between overflow-y-auto">
            
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-3">
                <div>
                  <div className="text-xl font-bold text-slate-900 flex items-center gap-3">
                    {activePatient.name}
                    <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-xs font-medium text-slate-700 border border-rule">
                      <span>Age:</span>
                      <input
                        type="number"
                        value={activePatient.age || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPatients((prev) =>
                            prev.map((p) => (p.id === activePatient.id ? { ...p, age: val } : p))
                          );
                        }}
                        placeholder="24"
                        className="w-10 bg-transparent text-xs font-bold text-blue-700 focus:outline-none"
                      />
                      <span>Yrs ({activePatient.gender || "Female"})</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{activePatient.phone}{patientLocation(activePatient) ? ` • ${patientLocation(activePatient)}` : ""}</div>
                </div>

                <button
                  onClick={() => setIsChartModalOpen(false)}
                  className="text-slate-500 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* PERSISTENT SYSTEMIC MEDICAL ALERT BANNER */}
              {activePatient.medicalAlert && (
                <div className="mb-4 p-3 px-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                    <span className="text-xs font-bold text-rose-800">
                      MEDICAL ALERT: {activePatient.medicalAlert}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-rose-600 uppercase">
                    Verify Vitals Prior to Infiltration
                  </span>
                </div>
              )}

              {/* PATIENT SUMMARY */}
              {(() => {
                const sm = patientSummary(activePatient, invoices, appointments);
                return (
                  <div className="mb-4 grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs" data-testid="patient-summary">
                    <div className={`rounded-xl border px-3 py-2 ${sm.dueP > 0 ? "border-rose-200 bg-rose-50" : "border-rule bg-enamel"}`}>
                      <div className="text-[11px] text-slate-500">Balance due</div>
                      <div className={`font-bold text-sm ${sm.dueP > 0 ? "text-rose-700" : "text-slate-900"}`}>₹{formatINR(sm.dueP)}</div>
                    </div>
                    <div className="rounded-xl border border-rule bg-enamel px-3 py-2">
                      <div className="text-[11px] text-slate-500">Next visit</div>
                      <div className="font-bold text-sm text-slate-900">{sm.nextAppt ? `${new Date(sm.nextAppt.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${formatTime12(sm.nextAppt.time)}` : "None booked"}</div>
                    </div>
                    <div className="rounded-xl border border-rule bg-enamel px-3 py-2">
                      <div className="text-[11px] text-slate-500">Last visit</div>
                      <div className="font-bold text-sm text-slate-900">{sm.lastVisitDate ? new Date(sm.lastVisitDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Not recorded"}</div>
                    </div>
                    <div className="rounded-xl border border-rule bg-enamel px-3 py-2">
                      <div className="text-[11px] text-slate-500">Open treatment plans</div>
                      <div className="font-bold text-sm text-slate-900">{sm.plansOpen}</div>
                    </div>
                  </div>
                );
              })()}

              {/* Exact Tab Pills */}
              <div className="flex flex-wrap items-center gap-2 mt-2 mb-6">
                {[
                  "32-Tooth Odontogram",
                  "Visit Notes",
                  "Assessments",
                  "Department Referrals",
                  "Diagnosis & Trauma",
                  "Systemic Review",
                  "Prescriptions",
                  "Treatment Plan",
                  "Lab Work",
                  "Consent",
                  "Medical History",
                  "Patient Details",
                ].map((tab) => {
                  const isActive = activeModalTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveModalTab(tab)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isActive
                          ? "bg-[#1d4ed8] text-white shadow-card font-semibold"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {tab === "32-Tooth Odontogram" && isDeciduous ? "20-Tooth Deciduous" : tab}
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: 32-TOOTH ODONTOGRAM */}
              {activeModalTab === "32-Tooth Odontogram" && (
                <Odontogram
                  conditions={activePatient.toothConditions || {}}
                  palette={CLINICAL_PALETTE}
                  activeStatus={activePaletteStatus}
                  onSelectStatus={setActivePaletteStatus}
                  onTap={handleToothTap}
                  onRemoveFinding={handleRemoveFinding}
                  onClear={() => {
                    if (confirm("Clear every finding on this chart?")) updateActivePatient({ toothConditions: {} });
                  }}
                  isDeciduous={isDeciduous}
                  onToggleDeciduous={() => setIsDeciduous(!isDeciduous)}
                  plannedTeeth={plannedTeeth(activePatient.plans)}
                />
              )}

              {/* ASSESSMENTS */}
              {activeModalTab === "Assessments" && (
                <Assessments
                  patient={activePatient}
                  newId={newId}
                  onSave={(a) => { setPatients((prev) => prev.map((p) => (p.id === activePatient.id ? addAssessment(p, a) : p))); showToast("Assessment saved"); }}
                  onRemove={(a) => { if (confirm("Delete this assessment?")) setPatients((prev) => prev.map((p) => (p.id === activePatient.id ? removeAssessment(p, a.id) : p))); }}
                />
              )}

              {/* VISIT NOTES */}
              {activeModalTab === "Visit Notes" && (
                <div className="space-y-5" data-testid="visit-notes">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-slate-500">Fill the note from this patient's chart, then edit it before saving.</p>
                    <button
                      type="button"
                      onClick={() => {
                        const d = draftVisitNote(activePatient, CLINICAL_PALETTE);
                        if (!d.findings && !d.advice && !d.nextVisit) { showToast("Chart some findings first, then draft the note"); return; }
                        setVisitForm((f) => ({ ...f, findings: d.findings || f.findings, advice: d.advice || f.advice, nextVisit: d.nextVisit || f.nextVisit }));
                        showToast("Draft added. Review and edit before saving");
                      }}
                      className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-[#1d4ed8] text-xs font-semibold hover:bg-blue-100"
                    >
                      Draft from chart
                    </button>
                  </div>
                  {practiceProfile.aiEnabled && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs space-y-2" data-testid="ai-visit-note">
                      <label htmlFor="ai-notes" className="block font-semibold text-slate-700">Type quick notes, then let MeriDent AI tidy them into the fields below</label>
                      <textarea id="ai-notes" rows="3" value={aiNotes} onChange={(e) => setAiNotes(e.target.value)} placeholder="e.g. pain lower left 3 days, deep caries 36 tender on percussion, started RCT access opening, soft diet, come back next week" className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none" />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-slate-500">Do not type the patient's name or phone number. MeriDent AI writes a draft. You check it before saving.</span>
                        <button
                          type="button"
                          disabled={aiBusy}
                          onClick={async () => {
                            setAiBusy(true);
                            try {
                              const { note } = await askAi({ task: "visit_note", notes: aiNotes });
                              setVisitForm((f) => ({ ...f, complaint: note.complaint || f.complaint, findings: note.findings || f.findings, treatment: note.treatment || f.treatment, advice: note.advice || f.advice, nextVisit: note.nextVisit || f.nextVisit }));
                              showToast("MeriDent AI draft added. Check and edit it before saving");
                            } catch (error) {
                              showToast(error.message || "MeriDent AI is not available right now.");
                            } finally {
                              setAiBusy(false);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#1d4ed8] hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
                        >
                          {aiBusy ? "Writing..." : "Tidy with MeriDent AI"}
                        </button>
                      </div>
                    </div>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const built = buildVisit(visitForm, newId("VN"));
                      if (!built.ok) {
                        showToast(built.error);
                        return;
                      }
                      setPatients((prev) => prev.map((p) => (p.id === activePatient.id ? addVisit(p, built.visit) : p)));
                      setVisitForm({ complaint: "", findings: "", treatment: "", advice: "", nextVisit: "", date: "" });
                      showToast("Visit note saved");
                    }}
                    className="rounded-xl border border-rule bg-enamel/60 p-4 grid sm:grid-cols-2 gap-3 text-xs"
                  >
                    {[
                      ["complaint", "Chief complaint", "e.g. Pain on chewing, lower left"],
                      ["findings", "Findings", "e.g. Deep caries 36, tender to percussion"],
                      ["treatment", "Treatment done", "e.g. Access opening and cleaning, tooth 36"],
                      ["advice", "Advice and medicines", "e.g. Soft diet, analgesic if needed"],
                    ].map(([key, label, ph]) => (
                      <div key={key}>
                        <label htmlFor={`visit-${key}`} className="block font-semibold text-slate-600 mb-1">{label}</label>
                        <textarea
                          id={`visit-${key}`}
                          rows="2"
                          value={visitForm[key]}
                          onChange={(e) => setVisitForm({ ...visitForm, [key]: e.target.value })}
                          placeholder={ph}
                          className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none"
                        />
                      </div>
                    ))}
                    <div>
                      <label htmlFor="visit-date" className="block font-semibold text-slate-600 mb-1">Visit date</label>
                      <input id="visit-date" type="date" max={dateKey()} value={visitForm.date || dateKey()} onChange={(e) => setVisitForm({ ...visitForm, date: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none" />
                    </div>
                    <div>
                      <label htmlFor="visit-next" className="block font-semibold text-slate-600 mb-1">Next visit plan</label>
                      <input id="visit-next" type="text" value={visitForm.nextVisit} onChange={(e) => setVisitForm({ ...visitForm, nextVisit: e.target.value })} placeholder="e.g. Obturation and crown prep in 1 week" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none" />
                    </div>
                    <div className="sm:col-span-2 flex justify-end">
                      <button type="submit" className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-lg font-semibold">Save visit note</button>
                    </div>
                  </form>

                  {(activePatient.visits || []).length === 0 ? (
                    <p className="text-sm text-slate-500">No visit notes yet. Record what you found and did at each visit so the next one starts with the history.</p>
                  ) : (
                    <ol className="space-y-3">
                      {(activePatient.visits || []).map((v) => (
                        <li key={v.id} className="rounded-xl border border-rule bg-white p-4 text-xs">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <span className="font-bold text-sm text-slate-900">{new Date(v.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                            <button
                              type="button"
                              aria-label={`Delete visit note from ${v.date}`}
                              onClick={() => { if (confirm("Delete this visit note?")) setPatients((prev) => prev.map((p) => (p.id === activePatient.id ? removeVisit(p, v.id) : p))); }}
                              className="text-slate-500 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                            {[["Complaint", v.complaint], ["Findings", v.findings], ["Treatment done", v.treatment], ["Advice", v.advice], ["Next visit", v.nextVisit]]
                              .filter(([, val]) => val)
                              .map(([k, val]) => (
                                <div key={k}>
                                  <dt className="text-[11px] font-semibold text-slate-500">{k}</dt>
                                  <dd className="text-slate-800 whitespace-pre-wrap">{val}</dd>
                                </div>
                              ))}
                          </dl>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}

              {/* TAB 2: DEPARTMENT REFERRALS ROUTER */}
              {activeModalTab === "Department Referrals" && (
                <div className="space-y-4">
                  <form onSubmit={handleAddReferral} className="p-4 rounded-xl bg-enamel border border-rule flex flex-wrap items-end gap-3 text-xs">
                    <div className="flex-1 min-w-[140px]">
                      <label className="font-bold text-slate-600 block mb-1">Treatment Directive</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. EXTRACTION, SCALING, GIC"
                        value={refTreatment}
                        onChange={(e) => setRefTreatment(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-rule bg-white"
                      />
                    </div>
                    <div className="w-28">
                      <label className="font-bold text-slate-600 block mb-1">Tooth / Region</label>
                      <input
                        type="text"
                        placeholder="e.g. 18 or 46"
                        value={refTooth}
                        onChange={(e) => setRefTooth(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-rule bg-white"
                      />
                    </div>
                    <div className="w-44">
                      <label className="font-bold text-slate-600 block mb-1">Department</label>
                      <select
                        value={refDept}
                        onChange={(e) => setRefDept(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-rule bg-white"
                      >
                        {DENTAL_DEPARTMENTS.map((d) => (
                          <option key={d.id} value={d.code}>{d.code} ({d.room})</option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="px-4 py-1.5 rounded-lg bg-[#1d4ed8] text-white font-bold">
                      + Add Referral
                    </button>
                  </form>

                  <div className="space-y-2">
                    {(activePatient.referrals || []).length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 bg-enamel rounded-xl">
                        No specialty referrals queued. Route directives to OMFS, Perio, Cons, or Prostho above.
                      </div>
                    ) : (
                      activePatient.referrals.map((r, i) => (
                        <div key={r.id || i} className="p-3 rounded-xl border border-rule bg-white flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                              {i + 1}
                            </span>
                            <div>
                              <span className="font-bold text-slate-900 uppercase">{r.treatment}</span>
                              <span className="text-slate-500 font-mono ml-2">Tooth/Arch: <strong>{r.toothRegion}</strong></span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                              {r.department} ({r.roomNo})
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                              Approved
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: DIAGNOSIS & TRAUMA */}
              {activeModalTab === "Diagnosis & Trauma" && (
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                    Radiology & Diagnostic Record
                  </div>
                  <div className="border border-rule rounded-xl p-4 divide-y divide-slate-100 bg-white">
                    <div className="py-2.5">
                      <div className="text-xs font-bold text-rose-600">Trauma Evaluation:</div>
                      <input
                        type="text"
                        value={activePatient.diagnosis?.trauma || ""}
                        onChange={(e) => handleUpdateDiagnosis("trauma", e.target.value)}
                        className="w-full text-xs text-slate-700 mt-1 border-b border-dashed border-slate-300 focus:outline-none"
                      />
                    </div>
                    <div className="py-2.5">
                      <div className="text-xs font-bold text-indigo-700">Impaction Status:</div>
                      <input
                        type="text"
                        value={activePatient.diagnosis?.impaction || ""}
                        onChange={(e) => handleUpdateDiagnosis("impaction", e.target.value)}
                        className="w-full text-xs text-slate-700 mt-1 border-b border-dashed border-slate-300 focus:outline-none"
                      />
                    </div>
                    <div className="py-2.5">
                      <div className="text-xs font-bold text-slate-800">Bone Deformations:</div>
                      <input
                        type="text"
                        value={activePatient.diagnosis?.boneDeformations || ""}
                        onChange={(e) => handleUpdateDiagnosis("boneDeformations", e.target.value)}
                        className="w-full text-xs text-slate-700 mt-1 border-b border-dashed border-slate-300 focus:outline-none"
                      />
                    </div>
                    <div className="py-2.5">
                      <div className="text-xs font-bold text-slate-800">Diagnosis Notes:</div>
                      <input
                        type="text"
                        value={activePatient.diagnosis?.diagnosisNotes || ""}
                        onChange={(e) => handleUpdateDiagnosis("diagnosisNotes", e.target.value)}
                        className="w-full text-xs text-slate-700 mt-1 border-b border-dashed border-slate-300 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SYSTEMIC REVIEW CHECKBOX MATRIX */}
              {activeModalTab === "Systemic Review" && (
                <div className="space-y-4 text-xs">
                  <span className="text-xs font-bold uppercase text-slate-500 tracking-wider block">
                    SYSTEMIC CONDITIONS & MEDICAL SCREENING
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: "hypertension", label: "Hypertension (BP)" },
                      { id: "diabetes", label: "Diabetes Mellitus" },
                      { id: "thyroid", label: "Thyroid (Thyroxine)" },
                      { id: "cardiac", label: "Heart Disease" },
                      { id: "allergy", label: "Drug Allergies" },
                      { id: "bleeding", label: "Bleeding Diathesis" },
                      { id: "respiratory", label: "Asthma / Respiratory" },
                      { id: "epilepsy", label: "Epileptic Seizures" }
                    ].map((item) => (
                      <label key={item.id} className="p-3 rounded-xl border border-rule bg-enamel/50 flex items-center gap-2 cursor-pointer hover:bg-enamel">
                        <input
                          type="checkbox"
                          checked={Boolean((activePatient.systemic || {})[item.id])}
                          onChange={(e) => updateActivePatient({ systemic: { ...(activePatient.systemic || {}), [item.id]: e.target.checked } })}
                          className="rounded text-blue-600 focus:ring-0"
                        />
                        <span className="font-semibold text-slate-700">{item.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider block mb-2">
                      PERSONAL HABITS & HYGIENE
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {habitSelect("tobacco", "Tobacco / areca nut", TOBACCO_OPTIONS)}
                      {habitSelect("alcohol", "Alcohol", ALCOHOL_OPTIONS)}
                      {habitSelect("brushing", "Brushing", BRUSHING_OPTIONS)}
                      {habitSelect("diet", "Diet", DIET_OPTIONS)}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: PRESCRIPTIONS & WHATSAPP ENGINE */}
              {activeModalTab === "Treatment Plan" && (
                <TreatmentPlans
                  patient={activePatient}
                  practiceProfile={practiceProfile}
                  showToast={showToast}
                  clinicId={CLINIC_ID}
                  shareApi={{
                    enabled: Boolean(db && CLINIC_ID && role === "owner"),
                    reason: role === "owner" ? undefined : "Approval links can be sent from the owner login",
                    create: (token, share) => createShare(db, token, share),
                    fetch: (token) => fetchShare(db, token),
                    remove: (token) => deleteShare(db, token),
                  }}
                  onChange={(plans) => updateActivePatient({ plans })}
                  onBill={!canWrite(role, "invoices") ? undefined : (plan) => {
                    setNewInvoiceForm({
                      patientId: activePatient.id,
                      patientName: activePatient.name,
                      paymentMode: "Cash",
                      items: planToInvoiceItems(plan, () => newId("LI")),
                      discount: plan.discount || "",
                      advance: "",
                      planId: plan.id,
                    });
                    setIsChartModalOpen(false);
                    setActiveNav("Billing & Invoices");
                    setIsAddInvoiceOpen(true);
                  }}
                />
              )}

              {activeModalTab === "Consent" && (
                <ConsentForms
                  patient={activePatient}
                  profile={practiceProfile}
                  newId={() => newId("CN")}
                  canWrite={canWrite(role, "patients")}
                  onChange={(consents) => updateActivePatient({ consents })}
                  onSigned={(c) => logAudit("consent.sign", activePatient.name, c.title)}
                  onPrint={(c) => {
                    const win = window.open("", "_blank");
                    if (!win) { showToast("Allow pop-ups to print"); return; }
                    win.document.write(consentHtml(c, activePatient, practiceProfile));
                    win.document.close();
                  }}
                />
              )}

              {activeModalTab === "Lab Work" && (
                <LabOrders
                  patient={activePatient}
                  labs={knownLabs(patients)}
                  newId={() => newId("LB")}
                  canWrite={canWrite(role, "patients")}
                  onChange={(labOrders) => updateActivePatient({ labOrders })}
                />
              )}

              {activeModalTab === "Prescriptions" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                      Prescriptions Slip
                    </div>
                    <button
                      type="button"
                      onClick={dispatchPatientWhatsApp}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-card transition-all bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Send className="w-3.5 h-3.5" /> Dispatch WhatsApp Prescription
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                      Quick-Select Dental Presets:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_MEDICATIONS.map((med) => (
                        <button
                          key={med.name}
                          type="button"
                          onClick={() => handleAddPrescription(med)}
                          className="px-2.5 py-1 text-xs bg-enamel hover:bg-blue-50 border border-rule text-slate-700 hover:text-blue-700 rounded-lg flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3 text-blue-600" />
                          <span className="font-semibold">{med.name}</span>
                          <span className="text-[10px] text-slate-500">({med.frequency})</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border border-rule rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-enamel text-slate-600 font-semibold uppercase text-[10px] border-b border-rule">
                        <tr>
                          <th className="p-3">Drug & Generic Name</th>
                          <th className="p-3">Dosage</th>
                          <th className="p-3">Frequency</th>
                          <th className="p-3">Duration</th>
                          <th className="p-3">Instruction</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(activePatient.prescriptions || []).length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-slate-500 italic">
                              No medications prescribed yet. Tap presets above to add.
                            </td>
                          </tr>
                        ) : (
                          activePatient.prescriptions.map((p) => (
                            <tr key={p.id}>
                              <td className="p-3">
                                <div className="font-bold text-slate-800">{p.drug}</div>
                                <div className="text-[10px] text-slate-500">{p.generic}</div>
                              </td>
                              <td className="p-3 font-medium text-slate-700">{p.dosage}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[11px]">
                                  {p.frequency}
                                </span>
                              </td>
                              <td className="p-3 font-medium text-slate-700">{p.duration}</td>
                              <td className="p-3 text-slate-600">{p.instruction}</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleRemovePrescription(p.id)}
                                  className="text-rose-500 hover:text-rose-700"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 6: MEDICAL HISTORY */}
              {/* TAB: PATIENT DETAILS (demographics, contacts, consent) */}
              {activeModalTab === "Patient Details" && (
                <div className="space-y-4 text-xs">
                  <SectionTitle>Identity</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {patientField("name", "Full name", { required: true })}
                    <Field label="Mobile (WhatsApp)" required>
                      <input
                        type="tel"
                        value={activePatient.phone || ""}
                        onChange={(e) => updateActivePatient({ phone: e.target.value })}
                        className={fieldInputClass}
                      />
                      {activePatient.phone && !isValidMobile(activePatient.phone) ? (
                        <p className="text-[10px] text-rose-600 mt-1">Check the number: it should be a 10-digit Indian mobile.</p>
                      ) : null}
                    </Field>
                    <Field label="Date of birth" hint="Optional. Updates age automatically.">
                      <input
                        type="date"
                        value={activePatient.dob || ""}
                        onChange={(e) => {
                          const dob = e.target.value;
                          updateActivePatient({ dob, ...(dob && ageFromDob(dob) !== "" ? { age: ageFromDob(dob) } : {}) });
                        }}
                        className={fieldInputClass}
                      />
                    </Field>
                    {patientField("age", "Age (years)", { required: true, type: "number" })}
                    {patientSelect("gender", "Gender", ["Female", "Male", "Other"], { required: true, blank: true })}
                    {patientSelect("bloodGroup", "Blood group", BLOOD_GROUPS)}
                    {patientField("occupation", "Occupation")}
                    {patientSelect("language", "Preferred language", LANGUAGES, { hint: "WhatsApp reminders are written in English, Tamil or Hindi to match." })}
                  </div>

                  <SectionTitle>Address and contact</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {patientField("area", "Area / locality")}
                    {patientField("city", "City")}
                    {patientField("pincode", "Pincode")}
                    {patientField("email", "Email", { type: "email" })}
                    {patientField("emergencyName", "Emergency contact name")}
                    {patientField("emergencyPhone", "Emergency contact mobile", { type: "tel" })}
                  </div>

                  {Number(activePatient.age) < 18 && activePatient.age !== "" && activePatient.age !== undefined ? (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 space-y-3">
                      <SectionTitle>Parent / guardian (patient under 18)</SectionTitle>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {patientField("guardianName", "Guardian name", { required: true })}
                        {patientSelect("guardianRelation", "Relation", GUARDIAN_RELATIONS)}
                        {patientField("guardianPhone", "Guardian mobile", { type: "tel" })}
                      </div>
                    </div>
                  ) : null}

                  <SectionTitle>Clinical background</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activePatient.gender === "Female"
                      ? patientSelect("pregnancy", "Pregnancy / breastfeeding", ["Not applicable", "Not pregnant", "Pregnant", "Breastfeeding"])
                      : null}
                    {patientField("chiefComplaint", "Chief complaint", { className: "sm:col-span-2" })}
                    {patientSelect("referredBy", "How did they find the clinic", REFERRAL_SOURCES)}
                    {patientField("abhaNumber", "ABHA number", { hint: "Optional. 14 digits." })}
                  </div>

                  <SectionTitle>Consent</SectionTitle>
                  {activePatient.consent ? (
                    <div className="rounded-xl border border-rule bg-enamel/60 p-3 space-y-2">
                      <div className="text-slate-600">
                        Consent for examination, treatment and record keeping:{" "}
                        <strong>{activePatient.consent.treatment ? "Recorded" : "Not recorded"}</strong>
                        {activePatient.consent.recordedAt ? ` on ${new Date(activePatient.consent.recordedAt).toLocaleDateString("en-IN")}` : ""}
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activePatient.consent.whatsapp !== false}
                          onChange={(e) => updateActivePatient({ consent: { ...activePatient.consent, whatsapp: e.target.checked } })}
                          className="rounded text-blue-600 focus:ring-0"
                        />
                        <span className="font-semibold text-slate-700">OK to send reminders and prescriptions on WhatsApp</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">Recall for check-up every</span>
                        <select
                          value={RECALL_OPTIONS.includes(Number(activePatient.recallMonths)) ? Number(activePatient.recallMonths) : DEFAULT_RECALL_MONTHS}
                          onChange={(e) => updateActivePatient({ recallMonths: Number(e.target.value) })}
                          className="px-2 py-1 border border-slate-300 rounded-lg bg-white focus:outline-none"
                        >
                          {RECALL_OPTIONS.map((m) => (
                            <option key={m} value={m}>{m} months</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-center justify-between gap-3">
                      <span className="text-amber-800">No consent on record (registered before consent capture).</span>
                      <button
                        type="button"
                        onClick={() => updateActivePatient({ consent: { treatment: true, whatsapp: true, recordedAt: new Date().toISOString() } })}
                        className="px-3 py-1.5 rounded-lg bg-[#1d4ed8] text-white font-semibold hover:bg-blue-700"
                      >
                        Record consent now
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeModalTab === "Medical History" && (
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                    Systemic Screening & Allergies
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-rule rounded-xl p-4 bg-white">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Conditions
                      </div>
                      <input
                        type="text"
                        value={activePatient.conditions || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPatients((prev) =>
                            prev.map((p) => (p.id === activePatient.id ? { ...p, conditions: val } : p))
                          );
                        }}
                        className="w-full text-sm font-medium text-slate-800 border-b border-rule focus:outline-none"
                      />
                    </div>
                    <div className="border border-rose-100 rounded-xl p-4 bg-rose-50/40">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-1">
                        Allergies
                      </div>
                      <input
                        type="text"
                        value={activePatient.allergies || "NKDA"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPatients((prev) =>
                            prev.map((p) => (p.id === activePatient.id ? { ...p, allergies: val } : p))
                          );
                        }}
                        className="w-full text-sm font-bold text-rose-700 border-b border-rose-200 bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete chart for ${activePatient.name}?`)) {
                    setPatients((prev) => prev.filter((p) => p.id !== activePatient.id));
                    logAudit("patient.delete", activePatient.name);
                    setIsChartModalOpen(false);
                    showToast("Patient chart deleted");
                  }
                }}
                className="text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Chart
              </button>

              {!allowedBranchIds && (role === "owner" || role === "manager") && (
                <button
                  type="button"
                  onClick={() => {
                    const b = buildPatientBackup(activePatient.id, { patients: allPatients, appointments: allAppointments, invoices: allInvoices }, practiceProfile);
                    if (!b) return;
                    downloadFile(JSON.stringify(b), backupFileName(b), "application/json");
                    logAudit("data.export", activePatient.name, "One patient's record");
                    showToast("Record downloaded. It holds private health details, keep it safe.");
                  }}
                  className="text-brand-700 hover:text-brand-900 font-medium flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download record
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsChartModalOpen(false)}
                className="text-slate-600 hover:text-slate-900 font-semibold"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- ADD PATIENT MODAL --- */}
      {isAddPatientOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleCreatePatient}
            className="bg-white rounded-xl border border-rule w-full max-w-lg p-6 space-y-4 shadow-xl text-xs my-4"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add New Patient</h3>
              <button type="button" onClick={() => setIsAddPatientOpen(false)} className="text-slate-500 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <SectionTitle>Patient</SectionTitle>
            <Field label="Full Name" required>
              <input
                type="text"
                required
                value={newPatientForm.name}
                onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
                placeholder="e.g. Nirmala J"
                className={fieldInputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Date of Birth" hint="Optional. Fills the age automatically.">
                <input
                  type="date"
                  max={dateKey()}
                  value={newPatientForm.dob}
                  onChange={(e) => {
                    const dob = e.target.value;
                    const calculated = ageFromDob(dob);
                    setNewPatientForm({ ...newPatientForm, dob, age: dob && calculated !== "" ? calculated : newPatientForm.age });
                  }}
                  className={fieldInputClass}
                />
              </Field>
              <Field label="Age (Years)" required>
                <input
                  type="number"
                  required
                  min="0"
                  max="120"
                  value={newPatientForm.age}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, age: e.target.value })}
                  placeholder="e.g. 46"
                  className={fieldInputClass}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Gender" required>
                <select
                  required
                  value={newPatientForm.gender}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value })}
                  className={fieldInputClass}
                >
                  <option value="">Select</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="WhatsApp Phone" required>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  value={newPatientForm.phone}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                  placeholder="10-digit mobile"
                  className={fieldInputClass}
                />
              </Field>
            </div>

            {newPatientForm.age !== "" && Number(newPatientForm.age) < 18 ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 space-y-3">
                <SectionTitle>Parent / guardian (required under 18)</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Guardian name" required>
                    <input
                      type="text"
                      value={newPatientForm.guardianName}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, guardianName: e.target.value })}
                      className={fieldInputClass}
                    />
                  </Field>
                  <Field label="Relation">
                    <select
                      value={newPatientForm.guardianRelation}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, guardianRelation: e.target.value })}
                      className={fieldInputClass}
                    >
                      {GUARDIAN_RELATIONS.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Guardian mobile" hint="Leave empty to use the patient's number.">
                  <input
                    type="tel"
                    value={newPatientForm.guardianPhone}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, guardianPhone: e.target.value })}
                    className={fieldInputClass}
                  />
                </Field>
              </div>
            ) : null}

            <SectionTitle>Contact and address</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Area / Locality">
                <input
                  type="text"
                  value={newPatientForm.area}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, area: e.target.value })}
                  placeholder="e.g. Sowripalayam"
                  className={fieldInputClass}
                />
              </Field>
              <Field label="City">
                <input
                  type="text"
                  value={newPatientForm.city}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, city: e.target.value })}
                  className={fieldInputClass}
                />
              </Field>
              <Field label="Pincode">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPatientForm.pincode}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, pincode: digitsOnly(e.target.value) })}
                  className={fieldInputClass}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={newPatientForm.email}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
                  className={fieldInputClass}
                />
              </Field>
            </div>

            <SectionTitle>Medical</SectionTitle>
            <Field label="Medical Alert (High Risk)">
              <input
                type="text"
                value={newPatientForm.medicalAlert}
                onChange={(e) => setNewPatientForm({ ...newPatientForm, medicalAlert: e.target.value })}
                placeholder="e.g. Hypertensive on medication / Thyroid (Thyroxine)"
                className="w-full px-3 py-2 border border-rose-200 bg-rose-50/40 rounded-lg text-rose-800 font-medium focus:outline-none"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Known conditions">
                <input
                  type="text"
                  value={newPatientForm.conditions}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, conditions: e.target.value })}
                  className={fieldInputClass}
                />
              </Field>
              <Field label="Drug allergies">
                <input
                  type="text"
                  value={newPatientForm.allergies}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, allergies: e.target.value })}
                  className={fieldInputClass}
                />
              </Field>
            </div>

            <details className="rounded-xl border border-rule p-3">
              <summary className="cursor-pointer font-semibold text-slate-700">More details (optional)</summary>
              <div className="space-y-3 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Blood group">
                    <select
                      value={newPatientForm.bloodGroup}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, bloodGroup: e.target.value })}
                      className={fieldInputClass}
                    >
                      {BLOOD_GROUPS.map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Occupation">
                    <input
                      type="text"
                      value={newPatientForm.occupation}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, occupation: e.target.value })}
                      className={fieldInputClass}
                    />
                  </Field>
                  <Field label="Preferred language">
                    <select
                      value={newPatientForm.language}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, language: e.target.value })}
                      className={fieldInputClass}
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="How did they find the clinic">
                    <select
                      value={newPatientForm.referredBy}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, referredBy: e.target.value })}
                      className={fieldInputClass}
                    >
                      {REFERRAL_SOURCES.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Emergency contact name">
                    <input
                      type="text"
                      value={newPatientForm.emergencyName}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, emergencyName: e.target.value })}
                      className={fieldInputClass}
                    />
                  </Field>
                  <Field label="Emergency contact mobile">
                    <input
                      type="tel"
                      value={newPatientForm.emergencyPhone}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, emergencyPhone: e.target.value })}
                      className={fieldInputClass}
                    />
                  </Field>
                </div>
                {newPatientForm.gender === "Female" && Number(newPatientForm.age) >= 12 && Number(newPatientForm.age) <= 55 ? (
                  <Field label="Pregnancy / breastfeeding" hint="Affects medicines and X-ray decisions.">
                    <select
                      value={newPatientForm.pregnancy}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, pregnancy: e.target.value })}
                      className={fieldInputClass}
                    >
                      {["Not applicable", "Not pregnant", "Pregnant", "Breastfeeding"].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </Field>
                ) : null}
                <Field label="ABHA number" hint="Optional. 14 digits. Do not enter Aadhaar numbers.">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newPatientForm.abhaNumber}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, abhaNumber: e.target.value })}
                    className={fieldInputClass}
                  />
                </Field>
                <Field label="Chief complaint">
                  <input
                    type="text"
                    value={newPatientForm.chiefComplaint}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, chiefComplaint: e.target.value })}
                    placeholder="e.g. Pain in lower right back tooth"
                    className={fieldInputClass}
                  />
                </Field>
              </div>
            </details>

            <SectionTitle>Consent</SectionTitle>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newPatientForm.consentTreatment}
                onChange={(e) => setNewPatientForm({ ...newPatientForm, consentTreatment: e.target.checked })}
                className="mt-0.5 rounded text-blue-600 focus:ring-0"
              />
              <span className="text-slate-700">
                The patient (or guardian) agrees to dental examination, treatment, and storage of this record. *
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newPatientForm.consentWhatsapp}
                onChange={(e) => setNewPatientForm({ ...newPatientForm, consentWhatsapp: e.target.checked })}
                className="mt-0.5 rounded text-blue-600 focus:ring-0"
              />
              <span className="text-slate-700">OK to send appointment reminders and prescriptions on WhatsApp.</span>
            </label>
            <p className="text-[10px] text-slate-500">Only collect what you need. Never enter Aadhaar numbers.</p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddPatientOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-rule text-slate-600 hover:bg-enamel font-semibold"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 rounded-lg bg-[#1d4ed8] text-white hover:bg-blue-700 font-semibold">
                Register & Open Odontogram
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- ADD APPOINTMENT MODAL --- */}
      {isAddApptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreateAppointment}
            className="bg-white rounded-xl border border-rule w-full max-w-md p-6 space-y-4 shadow-xl text-xs"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Book Chair-side Appointment</h3>
              <button
                type="button"
                onClick={() => setIsAddApptOpen(false)}
                className="text-slate-500 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Patient Name *</label>
              <input
                type="text"
                required
                value={newApptForm.patientName}
                list="patient-options"
                onChange={(e) => {
                  const value = e.target.value;
                  const match = patients.find((pt) => pt.name.toLowerCase() === value.trim().toLowerCase());
                  setNewApptForm({
                    ...newApptForm,
                    patientName: value,
                    ...(match
                      ? { patientId: match.id, phone: match.phone || "", age: match.age || "" }
                      : { patientId: "" }),
                  });
                }}
                placeholder="Patient Full Name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Mobile *</label>
                <input
                  type="tel"
                  required
                  value={newApptForm.phone}
                  onChange={(e) => setNewApptForm({ ...newApptForm, phone: e.target.value })}
                  placeholder="10-digit number"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Age</label>
                <input
                  type="number"
                  value={newApptForm.age}
                  onChange={(e) => setNewApptForm({ ...newApptForm, age: e.target.value })}
                  placeholder="Age"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  value={newApptForm.date}
                  onChange={(e) => setNewApptForm({ ...newApptForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Time Slot</label>
                <input
                  type="time"
                  value={newApptForm.time}
                  onChange={(e) => setNewApptForm({ ...newApptForm, time: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Operatory Chair</label>
              <select
                value={newApptForm.chair}
                onChange={(e) => setNewApptForm({ ...newApptForm, chair: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
              >
                <option>Chair 1 (Main Operatory)</option>
                <option>Chair 2 (Pediatric / Perio)</option>
                <option>Chair 3 (Prosthodontics)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Attending Doctor *</label>
                <input
                  type="text"
                  required
                  list="doctor-options"
                  value={newApptForm.doctor}
                  onChange={(e) => setNewApptForm({ ...newApptForm, doctor: e.target.value })}
                  placeholder="Choose or type"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Visit Type</label>
                <select
                  value={newApptForm.visitType}
                  onChange={(e) => setNewApptForm({ ...newApptForm, visitType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none bg-white"
                >
                  {VISIT_TYPES.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Planned Procedure</label>
              <input
                type="text"
                value={newApptForm.procedure}
                onChange={(e) => setNewApptForm({ ...newApptForm, procedure: e.target.value })}
                placeholder="e.g. Composite Restoration #16"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddApptOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-rule text-slate-600 hover:bg-enamel font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#1d4ed8] text-white hover:bg-blue-700 font-semibold"
              >
                Schedule Appointment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- ADD INVOICE MODAL --- */}
      {isAddInvoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreateInvoice}
            className="bg-white rounded-xl border border-rule w-full max-w-md p-6 space-y-4 shadow-xl text-xs"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Generate Invoice</h3>
              <button
                type="button"
                onClick={closeInvoiceModal}
                className="text-slate-500 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Patient Name *</label>
              <input
                type="text"
                required
                value={newInvoiceForm.patientName}
                list="patient-options"
                onChange={(e) => {
                  const value = e.target.value;
                  const match = patients.find((pt) => pt.name.toLowerCase() === value.trim().toLowerCase());
                  setNewInvoiceForm({ ...newInvoiceForm, patientName: value, patientId: match ? match.id : "" });
                }}
                placeholder="Patient Full Name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Payment Mode</label>
              <select
                value={newInvoiceForm.paymentMode}
                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, paymentMode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none bg-white"
              >
                {PAYMENT_MODES.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="invoice-doctor" className="block font-semibold text-slate-600 mb-1">Treated by</label>
              <input
                id="invoice-doctor"
                type="text"
                list="doctor-options"
                value={newInvoiceForm.doctor || ""}
                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, doctor: e.target.value })}
                placeholder="Dentist who did the work"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-semibold text-slate-600">Treatments billed</label>
              {newInvoiceForm.items.map((it, idx) => {
                const setItem = (changes) =>
                  setNewInvoiceForm({
                    ...newInvoiceForm,
                    items: newInvoiceForm.items.map((x) => (x.id === it.id ? { ...x, ...changes } : x)),
                  });
                return (
                  <div key={it.id} className="rounded-xl border border-rule bg-enamel/60 p-2.5 space-y-2">
                    <input
                      type="text"
                      aria-label={`Treatment ${idx + 1} description`}
                      value={it.description}
                      list="invoice-fee-options"
                      onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, items: newInvoiceForm.items.map((x) => (x.id === it.id ? applyFee(x, practiceProfile.fees, e.target.value) : x)) })}
                      placeholder="e.g. Root Canal Therapy"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none bg-white"
                    />
                    <div className="grid grid-cols-[1fr_1.4fr_auto] gap-2 items-center">
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        aria-label={`Treatment ${idx + 1} amount before tax`}
                        value={it.amount}
                        onChange={(e) => setItem({ amount: e.target.value })}
                        placeholder="Amount ₹"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold focus:outline-none bg-white"
                      />
                      <select
                        aria-label={`Treatment ${idx + 1} tax category`}
                        value={it.taxCategory}
                        onChange={(e) => setItem({ taxCategory: e.target.value })}
                        className="w-full px-2 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none bg-white"
                      >
                        {TAX_CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                      {newInvoiceForm.items.length > 1 ? (
                        <button
                          type="button"
                          aria-label={`Remove treatment ${idx + 1}`}
                          onClick={() =>
                            setNewInvoiceForm({ ...newInvoiceForm, items: newInvoiceForm.items.filter((x) => x.id !== it.id) })
                          }
                          className="p-1.5 text-slate-500 hover:text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="w-7" />
                      )}
                    </div>
                  </div>
                );
              })}
              <datalist id="invoice-fee-options">{sortedFees(practiceProfile.fees).map((f) => <option key={f.id} value={f.name} />)}</datalist>
              {newInvoiceForm.items.length < MAX_LINE_ITEMS && (
                <button
                  type="button"
                  onClick={() => setNewInvoiceForm({ ...newInvoiceForm, items: [...newInvoiceForm.items, blankInvoiceItem()] })}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add another treatment
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newInvoiceForm.discount}
                  onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, discount: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Advance received now (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newInvoiceForm.advance}
                  onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, advance: e.target.value })}
                  placeholder="0 (optional)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="inv-due" className="block font-semibold text-slate-600 mb-1">Payment due by (optional)</label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  id="inv-due"
                  type="date"
                  value={newInvoiceForm.dueDate || ""}
                  onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, dueDate: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
                {[["On visit", 0], ["7 days", 7], ["15 days", 15], ["30 days", 30]].map(([label, d]) => (
                  <button key={label} type="button" onClick={() => setNewInvoiceForm({ ...newInvoiceForm, dueDate: dueDateIn(d) })} className="px-2.5 py-1.5 rounded-full border border-rule bg-white hover:bg-blue-50 font-semibold text-slate-700">
                    {label}
                  </button>
                ))}
                {newInvoiceForm.dueDate && (
                  <button type="button" onClick={() => setNewInvoiceForm({ ...newInvoiceForm, dueDate: "" })} className="text-slate-500 hover:text-rose-600">Clear</button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Unpaid invoices are flagged Overdue after this date.</p>
            </div>

            {(() => {
              const t = computeLineItemTotals({ items: newInvoiceForm.items, discount: newInvoiceForm.discount });
              return (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1 text-slate-700">
                  <div className="flex justify-between"><span>Taxable value</span><span>₹{formatINR(t.taxableP)}</span></div>
                  {t.gstRate > 0 && (
                    <>
                      <div className="flex justify-between"><span>CGST {t.gstRate / 2}%</span><span>₹{formatINR(t.cgstP)}</span></div>
                      <div className="flex justify-between"><span>SGST {t.gstRate / 2}%</span><span>₹{formatINR(t.sgstP)}</span></div>
                    </>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 border-t border-blue-100 pt-1"><span>Total</span><span>₹{formatINR(t.totalP)}</span></div>
                </div>
              );
            })()}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeInvoiceModal}
                className="px-3 py-1.5 rounded-lg border border-rule text-slate-600 hover:bg-enamel font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#1d4ed8] text-white hover:bg-blue-700 font-semibold"
              >
                Generate Invoice
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- ADD STOCK ITEM MODAL --- */}
      {isAddStockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreateStock}
            className="bg-white rounded-xl border border-rule w-full max-w-md p-6 space-y-4 shadow-xl text-xs"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add Stock Item</h3>
              <button
                type="button"
                onClick={() => setIsAddStockOpen(false)}
                className="text-slate-500 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Item Name *</label>
              <input
                type="text"
                required
                value={newStockForm.name}
                onChange={(e) => setNewStockForm({ ...newStockForm, name: e.target.value })}
                placeholder="e.g. Composite Resin Syringes"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Category</label>
                <select
                  value={newStockForm.category}
                  onChange={(e) => setNewStockForm({ ...newStockForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                >
                  <option>Restorative</option>
                  <option>Surgical</option>
                  <option>Materials</option>
                  <option>Medications</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Unit of Measure</label>
                <input
                  type="text"
                  value={newStockForm.unit}
                  onChange={(e) => setNewStockForm({ ...newStockForm, unit: e.target.value })}
                  placeholder="e.g. Syringes, Boxes, Strips"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Quantity on Hand</label>
                <input
                  type="number"
                  value={newStockForm.quantity}
                  onChange={(e) => setNewStockForm({ ...newStockForm, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Reorder level</label>
                <input
                  type="number"
                  value={newStockForm.minThreshold}
                  onChange={(e) => setNewStockForm({ ...newStockForm, minThreshold: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="stock-expiry" className="block font-semibold text-slate-600 mb-1">Expiry date (optional)</label>
              <input
                id="stock-expiry"
                type="date"
                value={newStockForm.expiry}
                onChange={(e) => setNewStockForm({ ...newStockForm, expiry: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddStockOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-rule text-slate-600 hover:bg-enamel font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#1d4ed8] text-white hover:bg-blue-700 font-semibold"
              >
                Save item
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- COLLECT PAYMENT / UPI QR MODAL --- */}
      {qrInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-rule w-full max-w-sm p-6 text-center space-y-4 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2 border-slate-100">
              <span className="text-xs font-bold text-slate-700">Collect payment · {qrInvoice.id}</span>
              <button onClick={() => setActiveUpiQrInvoice(null)} className="text-slate-500 hover:text-slate-600" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="text-[11px] text-slate-500">{qrInvoice.patient}</div>
              <div className="text-xl font-bold text-slate-900">₹{formatINR(qrBalanceP)} <span className="text-xs font-medium text-slate-500">due</span></div>
              <div className="text-[11px] text-slate-500">Total ₹{formatINR(qrInvoice.totalP)} · Paid ₹{formatINR(paidPaise(qrInvoice))}</div>
            </div>

            {qrBalanceP > 0 && (
              <>
                {upiUri ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-enamel rounded-xl border border-rule inline-block">
                      {upiQrDataUrl ? (
                        <img src={upiQrDataUrl} alt="UPI payment QR" className="w-44 h-44" />
                      ) : (
                        <div className="w-44 h-44 flex items-center justify-center text-[11px] text-slate-500">Preparing QR…</div>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">{practiceProfile.upiId}</div>
                    <a href={upiUri} className="text-[11px] font-semibold text-blue-700 underline">Open in UPI app (phone)</a>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                    Add a valid UPI ID (like name@bank) in Settings to show a payment QR.
                  </p>
                )}

                <form onSubmit={handleCollectPayment} className="space-y-2 text-left text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={payForm.amount}
                      onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                      placeholder={`Amount (max ${formatINR(qrBalanceP)})`}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                    />
                    <select
                      value={payForm.mode}
                      onChange={(e) => setPayForm({ ...payForm, mode: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none"
                    >
                      {PAYMENT_MODES.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPayForm({ ...payForm, amount: String(qrBalanceP / 100) })} className="px-3 py-2 rounded-lg border border-rule text-slate-600 font-semibold">
                      Full balance
                    </button>
                    <button type="submit" className="flex-1 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-lg font-semibold">
                      Record payment
                    </button>
                  </div>
                </form>
              </>
            )}

            {(qrInvoice.payments || []).length > 0 && (
              <div className="text-left text-[11px] border-t border-slate-100 pt-2 space-y-1">
                {qrInvoice.payments.map((p, i) => (
                  <div key={i} className="flex justify-between text-slate-600">
                    <span>{p.date} · {p.mode}</span>
                    <span className="font-semibold">₹{formatINR(p.amountP)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => handlePrintInvoice(qrInvoice, false)} className="flex-1 py-2 border border-rule rounded-lg text-xs font-semibold text-slate-700 hover:bg-enamel">
                Print invoice
              </button>
              {paidPaise(qrInvoice) > 0 && (
                <button onClick={() => handlePrintInvoice(qrInvoice, true)} className="flex-1 py-2 border border-rule rounded-lg text-xs font-semibold text-slate-700 hover:bg-enamel">
                  Print receipt
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}