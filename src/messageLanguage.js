/* ==============================================================================
 * MERIDENT OS - PATIENT MESSAGE LANGUAGE (pure functions, no React)
 * Each patient can be messaged in English, Tamil or Hindi. English stays in the message builders;
 * this file holds the Tamil and Hindi wording. Have a native speaker read it before wide use.
 * ============================================================================== */

export const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "ta", label: "Tamil" },
  { id: "hi", label: "Hindi" },
];

/** Reads the patient's "Preferred language" (saved as the word, such as "Tamil") or a code. Anything else is English. */
export const languageOf = (patient) => {
  const v = String(patient?.language || "").trim().toLowerCase();
  const found = LANGUAGES.find((l) => l.id === v || l.label.toLowerCase() === v);
  return found ? found.id : "en";
};

const clinic = (v, fallback) => v.clinicName || fallback;

const T = {
  hi: {
    appointment: (v) =>
      `नमस्ते ${v.name},\n\n${clinic(v, "आपके दंत क्लिनिक")} की ओर से आपके अपॉइंटमेंट की याद दिलाई जा रही है: ${v.sameDay ? "आज" : "कल"}, ${v.dateTime}${v.doctor ? ` (${v.doctor} के साथ)` : ""}।\n\n` +
      `कृपया 10 मिनट पहले पहुँचें। समय बदलना हो तो इसी संदेश का जवाब दें।\n\nधन्यवाद।`,
    payment: (v) =>
      `नमस्ते ${v.name},\n\n${clinic(v, "आपके दंत क्लिनिक")} की ओर से एक विनम्र याद दिलाना: बिल ${v.invoiceId} पर ₹${v.amount} बाकी हैं।\n\n` +
      (v.upiId ? `आप UPI से ${v.upiId} पर भुगतान कर सकते हैं।\n\n` : "") +
      `यदि आप भुगतान कर चुके हैं तो कृपया इस संदेश को अनदेखा करें। धन्यवाद।`,
    recall: (v) =>
      `नमस्ते ${v.name},\n\n${clinic(v, "हमारे दंत क्लिनिक")} में आपकी पिछली विज़िट को ${v.months} महीने हो गए हैं। नियमित जाँच और सफाई से समस्याएँ जल्दी पकड़ में आती हैं।\n\n` +
      `समय तय करने के लिए इस संदेश का जवाब दें${v.phone ? ` या ${v.phone} पर कॉल करें` : ""}।\n\nधन्यवाद।`,
    birthday: (v) =>
      `जन्मदिन मुबारक, ${v.firstName}! 🎂\n\n${clinic(v, "आपके दंत क्लिनिक")} की ओर से आपके स्वस्थ और खुशहाल वर्ष की शुभकामनाएँ।\n\nमुस्कुराते रहिए!`,
  },
  ta: {
    appointment: (v) =>
      `வணக்கம் ${v.name},\n\n${clinic(v, "உங்கள் பல் மருத்துவமனை")} சார்பில் உங்கள் அப்பாயின்ட்மெண்ட் நினைவூட்டல்: ${v.sameDay ? "இன்று" : "நாளை"}, ${v.dateTime}${v.doctor ? ` (${v.doctor})` : ""}.\n\n` +
      `தயவுசெய்து 10 நிமிடம் முன்னதாக வரவும். நேரத்தை மாற்ற வேண்டுமெனில் இந்தச் செய்திக்குப் பதிலளிக்கவும்.\n\nநன்றி.`,
    payment: (v) =>
      `வணக்கம் ${v.name},\n\n${clinic(v, "உங்கள் பல் மருத்துவமனை")} சார்பில் ஒரு நினைவூட்டல்: பில் ${v.invoiceId}-ல் ₹${v.amount} நிலுவையில் உள்ளது.\n\n` +
      (v.upiId ? `UPI மூலம் ${v.upiId}-க்கு செலுத்தலாம்.\n\n` : "") +
      `ஏற்கனவே செலுத்தியிருந்தால் இந்தச் செய்தியைப் புறக்கணிக்கவும். நன்றி.`,
    recall: (v) =>
      `வணக்கம் ${v.name},\n\n${clinic(v, "எங்கள் பல் மருத்துவமனை")}-க்கு நீங்கள் கடைசியாக வந்து ${v.months} மாதங்கள் ஆகிவிட்டன. வழக்கமான பரிசோதனையும் சுத்தம் செய்தலும் பிரச்சினைகளை ஆரம்பத்திலேயே கண்டறிய உதவும்.\n\n` +
      `நேரம் பதிவு செய்ய இந்தச் செய்திக்குப் பதிலளிக்கவும்${v.phone ? ` அல்லது ${v.phone} எண்ணில் அழைக்கவும்` : ""}.\n\nநன்றி.`,
    birthday: (v) =>
      `பிறந்தநாள் வாழ்த்துகள், ${v.firstName}! 🎂\n\n${clinic(v, "உங்கள் பல் மருத்துவமனை")} சார்பில் உங்களுக்கு ஆரோக்கியமான, மகிழ்ச்சியான ஆண்டாக அமையட்டும்.\n\nபுன்னகையுடன் இருங்கள்!`,
  },
};

/** The message in the patient's language, or null when English (or unknown) so the caller uses its own English text. */
export const localized = (kind, language, vars) => {
  const make = T[language] && T[language][kind];
  return make ? make(vars) : null;
};
