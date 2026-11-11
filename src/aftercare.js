/* ==============================================================================
 * MERIDENT OS - AFTERCARE MESSAGES (pure functions, no React)
 * Plain advice a clinic can send on WhatsApp after a procedure, in English, Tamil or Hindi.
 * General advice only: no doses and no promises. The dentist decides what suits each patient.
 * The Tamil and Hindi wording is a draft. Have a native speaker read it before wide use.
 * ============================================================================== */

export const AFTERCARE_KINDS = [
  { id: "extraction", label: "After a tooth extraction", match: /extract|exo|remov(al|ed) of tooth|disimpact|wisdom/i },
  { id: "rootcanal", label: "After root canal treatment", match: /root canal|rct|pulp|endo|access opening|obturation/i },
  { id: "filling", label: "After a filling", match: /fill|restor|composite|gic|amalgam/i },
  { id: "scaling", label: "After scaling and cleaning", match: /scal|clean|prophy|polish/i },
  { id: "crown", label: "After a crown or bridge", match: /crown|bridge|cap|prosth|denture/i },
];

/** Guesses the kind from what was written in a visit note. Returns "" when nothing matches. */
export const suggestAftercare = (text) => {
  const t = String(text || "");
  const found = AFTERCARE_KINDS.find((k) => k.match.test(t));
  return found ? found.id : "";
};

const WORDS = {
  en: {
    hello: (n) => `Hello ${n},`,
    from: (c) => `Care instructions from ${c || "your dental clinic"}:`,
    closing: "If you have heavy bleeding, swelling that grows, fever, or pain that is getting worse, please call the clinic or visit us. Take care!",
    items: {
      extraction: [
        "Bite gently on the gauze for 30 to 45 minutes.",
        "Do not rinse, spit or use a straw for the first 24 hours.",
        "Eat soft, cool food today. Avoid hot drinks and spicy food.",
        "Do not touch the area with your tongue or fingers.",
        "From tomorrow, rinse gently with warm salt water after meals.",
        "Take only the medicines your dentist prescribed.",
      ],
      rootcanal: [
        "Do not chew on this tooth until the final filling or crown is done.",
        "Mild soreness for a few days is common.",
        "Take only the medicines your dentist prescribed.",
        "Brush and floss as usual, and keep your next appointment so the tooth is sealed properly.",
      ],
      filling: [
        "Wait until the numbness is gone before you eat, and do not bite your cheek or lip.",
        "Some sensitivity to hot and cold for a few days is common.",
        "If the bite feels high or uncomfortable after a few days, let us know.",
        "Brush and floss gently around the filling.",
      ],
      scaling: [
        "Gums can feel tender or bleed a little for a day or two.",
        "Rinse with warm salt water, and brush gently twice a day.",
        "You may feel some sensitivity for a few days.",
        "Come back for a check-up in six months.",
      ],
      crown: [
        "Avoid very hard or sticky food for the first few days.",
        "Brush and floss carefully around the crown or bridge.",
        "If it feels loose, high or uncomfortable, call us. Do not try to fix it yourself.",
        "Keep your follow-up appointment.",
      ],
    },
  },
  hi: {
    hello: (n) => `नमस्ते ${n},`,
    from: (c) => `${c || "आपके दंत क्लिनिक"} की ओर से देखभाल के निर्देश:`,
    closing: "यदि बहुत खून बहे, सूजन बढ़ती जाए, बुखार आए या दर्द बढ़ता जाए, तो कृपया क्लिनिक को फ़ोन करें या आएँ। अपना ध्यान रखें!",
    items: {
      extraction: [
        "30 से 45 मिनट तक रुई को हल्के से दबाकर रखें।",
        "पहले 24 घंटे कुल्ला न करें, थूकें नहीं और स्ट्रॉ का उपयोग न करें।",
        "आज नरम और ठंडा भोजन करें। गरम पेय और तीखा खाना न लें।",
        "उस जगह को जीभ या उँगली से न छुएँ।",
        "कल से भोजन के बाद गुनगुने नमक के पानी से हल्के कुल्ले करें।",
        "केवल वही दवाइयाँ लें जो आपके दंत चिकित्सक ने लिखी हैं।",
      ],
      rootcanal: [
        "अंतिम फिलिंग या क्राउन लगने तक इस दाँत से न चबाएँ।",
        "कुछ दिन हल्का दर्द होना सामान्य है।",
        "केवल वही दवाइयाँ लें जो आपके दंत चिकित्सक ने लिखी हैं।",
        "सामान्य रूप से ब्रश करें और अपनी अगली अपॉइंटमेंट ज़रूर लें ताकि दाँत ठीक से बंद हो सके।",
      ],
      filling: [
        "सुन्नपन जाने तक कुछ न खाएँ, और गाल या होंठ को न काटें।",
        "कुछ दिन गरम-ठंडे से झनझनाहट होना सामान्य है।",
        "यदि कुछ दिन बाद काटने में ऊँचा या असहज लगे तो हमें बताएँ।",
        "फिलिंग के आसपास हल्के से ब्रश और फ्लॉस करें।",
      ],
      scaling: [
        "मसूड़े एक-दो दिन संवेदनशील रह सकते हैं या थोड़ा खून आ सकता है।",
        "गुनगुने नमक के पानी से कुल्ला करें और दिन में दो बार हल्के से ब्रश करें।",
        "कुछ दिन झनझनाहट हो सकती है।",
        "छह महीने बाद जाँच के लिए आएँ।",
      ],
      crown: [
        "पहले कुछ दिन बहुत कठोर या चिपचिपा खाना न खाएँ।",
        "क्राउन या ब्रिज के आसपास ध्यान से ब्रश और फ्लॉस करें।",
        "यदि ढीला, ऊँचा या असहज लगे तो हमें फ़ोन करें। खुद ठीक करने की कोशिश न करें।",
        "अपनी फ़ॉलो-अप अपॉइंटमेंट ज़रूर लें।",
      ],
    },
  },
  ta: {
    hello: (n) => `வணக்கம் ${n},`,
    from: (c) => `${c || "உங்கள் பல் மருத்துவமனை"} வழங்கும் பராமரிப்பு வழிமுறைகள்:`,
    closing: "அதிக இரத்தப்போக்கு, அதிகரிக்கும் வீக்கம், காய்ச்சல் அல்லது அதிகரிக்கும் வலி இருந்தால், தயவுசெய்து மருத்துவமனையை அழைக்கவும் அல்லது வரவும். கவனமாக இருங்கள்!",
    items: {
      extraction: [
        "30 முதல் 45 நிமிடங்கள் வரை பஞ்சை மெதுவாகக் கடித்து வைத்திருங்கள்.",
        "முதல் 24 மணி நேரம் வாய் கொப்பளிக்கவோ, துப்பவோ, ஸ்ட்ரா பயன்படுத்தவோ வேண்டாம்.",
        "இன்று மென்மையான, குளிர்ந்த உணவு சாப்பிடுங்கள். சூடான பானங்கள், காரமான உணவை தவிர்க்கவும்.",
        "அந்த இடத்தை நாக்காலோ விரலாலோ தொடாதீர்கள்.",
        "நாளை முதல் உணவுக்குப் பிறகு வெதுவெதுப்பான உப்பு நீரில் மெதுவாக வாய் கொப்பளியுங்கள்.",
        "பல் மருத்துவர் எழுதிக் கொடுத்த மருந்துகளை மட்டுமே எடுத்துக்கொள்ளுங்கள்.",
      ],
      rootcanal: [
        "இறுதி நிரப்புதல் அல்லது கிரீடம் போடும் வரை இந்தப் பல்லால் மெல்ல வேண்டாம்.",
        "சில நாட்கள் லேசான வலி இருப்பது இயல்பு.",
        "பல் மருத்துவர் எழுதிக் கொடுத்த மருந்துகளை மட்டுமே எடுத்துக்கொள்ளுங்கள்.",
        "வழக்கம்போல பல் துலக்குங்கள். பல் சரியாக மூடப்பட அடுத்த சந்திப்புக்கு வாருங்கள்.",
      ],
      filling: [
        "மரத்துப்போன உணர்வு போகும் வரை சாப்பிட வேண்டாம். கன்னம் அல்லது உதட்டைக் கடிக்காதீர்கள்.",
        "சில நாட்கள் சூடு, குளிர்ச்சியில் கூச்சம் இருப்பது இயல்பு.",
        "சில நாட்களுக்குப் பிறகும் கடிக்கும்போது உயரமாகவோ சங்கடமாகவோ இருந்தால் எங்களிடம் சொல்லுங்கள்.",
        "நிரப்பிய இடத்தைச் சுற்றி மெதுவாகப் பல் துலக்கி, ஃப்ளாஸ் செய்யுங்கள்.",
      ],
      scaling: [
        "ஈறுகள் ஓரிரு நாட்கள் மென்மையாக இருக்கலாம், சிறிது இரத்தம் வரலாம்.",
        "வெதுவெதுப்பான உப்பு நீரில் வாய் கொப்பளித்து, தினமும் இரண்டு முறை மெதுவாகப் பல் துலக்குங்கள்.",
        "சில நாட்கள் கூச்சம் இருக்கலாம்.",
        "ஆறு மாதங்களுக்குப் பிறகு பரிசோதனைக்கு வாருங்கள்.",
      ],
      crown: [
        "முதல் சில நாட்கள் மிகக் கடினமான அல்லது ஒட்டும் உணவைத் தவிர்க்கவும்.",
        "கிரீடம் அல்லது பாலத்தைச் சுற்றி கவனமாகப் பல் துலக்கி, ஃப்ளாஸ் செய்யுங்கள்.",
        "தளர்வாகவோ உயரமாகவோ சங்கடமாகவோ இருந்தால் எங்களை அழைக்கவும். நீங்களே சரிசெய்ய முயற்சிக்க வேண்டாம்.",
        "உங்கள் அடுத்த சந்திப்புக்கு வாருங்கள்.",
      ],
    },
  },
};

/** Builds the WhatsApp text. language is "en", "hi" or "ta". Returns "" for an unknown kind. */
export const buildAftercare = ({ kind, language = "en", clinicName = "", patientName = "" } = {}) => {
  const w = WORDS[language] || WORDS.en;
  const items = w.items[kind];
  if (!items) return "";
  const name = String(patientName || "").trim().split(/\s+/)[0] || "";
  return [
    name ? w.hello(name) : "",
    w.from(String(clinicName || "").trim()),
    "",
    ...items.map((t, i) => `${i + 1}. ${t}`),
    "",
    w.closing,
  ].filter((l, i, a) => !(l === "" && (i === 0 || a[i - 1] === ""))).join("\n");
};
