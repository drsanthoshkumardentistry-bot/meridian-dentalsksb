import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  serverTimestamp 
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebaseConfig";

const CLINIC_ID = "meridian_main_clinic";

// --- PATIENT MANAGEMENT ---
export const addPatientRecord = async (patientData) => {
  const patientRef = doc(collection(db, "clinics", CLINIC_ID, "patients"));
  const payload = {
    ...patientData,
    id: patientRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(patientRef, payload);
  return payload;
};

export const subscribeToPatients = (callback) => {
  const q = collection(db, "clinics", CLINIC_ID, "patients");
  return onSnapshot(q, (snapshot) => {
    const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(patients);
  });
};

// --- 5-SURFACE FDI ODONTOGRAM ---
export const saveToothCondition = async (patientId, toothNumber, surfaceData) => {
  const chartRef = doc(db, "clinics", CLINIC_ID, "patients", patientId, "charts", String(toothNumber));
  return await setDoc(chartRef, {
    toothNumber,
    surfaces: surfaceData, // { occlusal: 'caries', mesial: 'composite', ... }
    lastModified: serverTimestamp()
  }, { merge: true });
};

// --- RADIOGRAPH / OPG UPLOADER ---
export const uploadRadiograph = async (patientId, file, meta = {}) => {
  const storagePath = `clinics/${CLINIC_ID}/patients/${patientId}/radiographs/${Date.now()}_${file.name}`;
  const fileRef = ref(storage, storagePath);
  
  const uploadTask = await uploadBytesResumable(fileRef, file);
  const downloadUrl = await getDownloadURL(uploadTask.ref);
  
  const radDocRef = doc(collection(db, "clinics", CLINIC_ID, "patients", patientId, "radiographs"));
  const payload = {
    id: radDocRef.id,
    url: downloadUrl,
    type: meta.type || "OPG",
    calibrationRatio: meta.ratio || 1.0, // mm per pixel
    notes: meta.notes || "",
    uploadedAt: serverTimestamp()
  };
  
  await setDoc(radDocRef, payload);
  return payload;
};

// --- WHATSAPP CLINICAL NOTIFICATIONS ---
export const triggerWhatsAppNotification = (phone, patientName, appointmentTime, operatory) => {
  // Cleanses phone to E.164 without '+' or leading zero
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const message = encodeURIComponent(
    `Hello ${patientName}, your dental appointment at Meridian Dental OS is confirmed for ${appointmentTime} in Operatory ${operatory}. Please arrive 10 minutes prior.`
  );
  const waUrl = `https://wa.me/${cleanPhone}?text=${message}`;
  window.open(waUrl, "_blank");
};