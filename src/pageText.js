/* Wording for the public pages a patient opens from a link (booking and payment), in English and Tamil.
 * The Tamil has not been read by a native speaker yet: have someone at the clinic check it before wide use.
 * Values sent to the clinic (visit reason, time of day) always stay English; only the labels change. */

const KEY = "merident_page_lang";
export const PAGE_LANGUAGES = [{ id: "en", label: "English" }, { id: "ta", label: "தமிழ்" }];

/** Saved choice first, then the phone's language, else English. Never throws (private mode, blocked storage). */
export const pageLang = (storage = globalThis.localStorage, nav = globalThis.navigator) => {
  try { const v = storage && storage.getItem(KEY); if (v === "en" || v === "ta") return v; } catch (e) { /* ignore */ }
  try { if (nav && String(nav.language || "").toLowerCase().startsWith("ta")) return "ta"; } catch (e) { /* ignore */ }
  return "en";
};
export const saveLang = (id, storage = globalThis.localStorage) => { try { storage.setItem(KEY, id); } catch (e) { /* ignore */ } };

const S = {
  en: {
    loading: "Loading…", closedTitle: "Online booking is not available", closedBody: "This clinic is not taking online requests right now. Please call the clinic to book.",
    errTitle: "This page could not load", errBody: "Check your connection and try again.",
    sentTitle: "Request sent", sentBody: (n) => `${n} will confirm your appointment on WhatsApp or by phone. This is a request, not a confirmed booking.`,
    request: "Request an appointment", name: "Your name", phone: "Mobile number", reason: "Reason for visit", date: "Preferred date", time: "Time of day",
    choose: "Choose", note: "Anything the dentist should know (optional)", send: "Send request", sending: "Sending…",
    sendFail: "Could not send your request. Please check your connection or call the clinic.",
    privacy: "Your name and number are shared only with this clinic, to contact you about this visit. Do not use this form for emergencies.",
    Morning: "Morning", Afternoon: "Afternoon", Evening: "Evening",
    "Check-up and consultation": "Check-up and consultation", "Scaling and polishing": "Scaling and polishing", "Tooth pain": "Tooth pain", Filling: "Filling", "Root canal": "Root canal", "Braces enquiry": "Braces enquiry", Other: "Other",
    payInvalid: "This payment link is not valid", payChanged: "This link was changed or is not genuine. Do not pay it. ", payInvalidBody: "Ask the clinic to send the link again, or pay using the UPI QR on your bill.",
    pay: "Pay", yourClinic: "Your clinic", verified: "Verified: this link was issued by a MeriDent clinic account.", checking: "Checking this link…",
    unverified: "This link could not be verified. Confirm the clinic name and UPI ID with the clinic before you pay.",
    for: "For", payBtn: "Pay with a UPI app", payHint: "Opens GPay, PhonePe, Paytm or any UPI app on this phone.", qrHint: "On a computer? Scan this with your phone's UPI app.",
    upiId: "UPI ID", copy: "Copy", copied: "Copied", payCheck: "Check that the name above is your clinic before you pay. The money goes straight to this UPI ID.", qrAlt: "UPI QR code",
  },
  ta: {
    loading: "ஏற்றுகிறது…", closedTitle: "ஆன்லைன் முன்பதிவு இல்லை", closedBody: "இந்த மருத்துவமனை இப்போது ஆன்லைன் கோரிக்கைகளை ஏற்கவில்லை. முன்பதிவுக்கு மருத்துவமனையை அழைக்கவும்.",
    errTitle: "இந்தப் பக்கத்தை ஏற்ற முடியவில்லை", errBody: "இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
    sentTitle: "கோரிக்கை அனுப்பப்பட்டது", sentBody: (n) => `${n} உங்கள் அப்பாயின்ட்மெண்டை வாட்ஸ்அப் அல்லது தொலைபேசியில் உறுதிப்படுத்தும். இது கோரிக்கை மட்டுமே, உறுதியான முன்பதிவு அல்ல.`,
    request: "அப்பாயின்ட்மெண்ட் கோரிக்கை", name: "உங்கள் பெயர்", phone: "மொபைல் எண்", reason: "வருகைக்கான காரணம்", date: "விரும்பும் தேதி", time: "நாளின் நேரம்",
    choose: "தேர்வு செய்க", note: "பல் மருத்துவர் தெரிந்துகொள்ள வேண்டியவை (விருப்பம்)", send: "கோரிக்கையை அனுப்பு", sending: "அனுப்புகிறது…",
    sendFail: "கோரிக்கையை அனுப்ப முடியவில்லை. இணைய இணைப்பைச் சரிபார்க்கவும் அல்லது மருத்துவமனையை அழைக்கவும்.",
    privacy: "உங்கள் பெயரும் எண்ணும் இந்த வருகை பற்றித் தொடர்பு கொள்வதற்காக மட்டுமே இந்த மருத்துவமனையுடன் பகிரப்படும். அவசரத் தேவைக்கு இந்தப் படிவத்தைப் பயன்படுத்த வேண்டாம்.",
    Morning: "காலை", Afternoon: "மதியம்", Evening: "மாலை",
    "Check-up and consultation": "பரிசோதனை மற்றும் ஆலோசனை", "Scaling and polishing": "பற்கறை நீக்கம் மற்றும் மெருகூட்டல்", "Tooth pain": "பல் வலி", Filling: "பல் அடைப்பு", "Root canal": "வேர் சிகிச்சை", "Braces enquiry": "பிரேஸ் பற்றிய விசாரணை", Other: "மற்றவை",
    payInvalid: "இந்தக் கட்டண இணைப்பு செல்லாது", payChanged: "இந்த இணைப்பு மாற்றப்பட்டுள்ளது அல்லது உண்மையானது அல்ல. இதில் பணம் செலுத்த வேண்டாம். ", payInvalidBody: "மருத்துவமனையிடம் இணைப்பை மீண்டும் அனுப்பச் சொல்லுங்கள், அல்லது உங்கள் பில்லில் உள்ள UPI QR மூலம் செலுத்துங்கள்.",
    pay: "செலுத்துக", yourClinic: "உங்கள் மருத்துவமனை", verified: "சரிபார்க்கப்பட்டது: இந்த இணைப்பு MeriDent மருத்துவமனைக் கணக்கிலிருந்து வழங்கப்பட்டது.", checking: "இணைப்பைச் சரிபார்க்கிறது…",
    unverified: "இந்த இணைப்பைச் சரிபார்க்க முடியவில்லை. பணம் செலுத்தும் முன் மருத்துவமனையின் பெயரையும் UPI ID-ஐயும் மருத்துவமனையிடம் உறுதி செய்யுங்கள்.",
    for: "நோக்கம்:", payBtn: "UPI செயலியில் செலுத்துக", payHint: "இந்தத் தொலைபேசியில் GPay, PhonePe, Paytm அல்லது எந்த UPI செயலியையும் திறக்கும்.", qrHint: "கணினியில் இருக்கிறீர்களா? உங்கள் தொலைபேசியின் UPI செயலியால் இதை ஸ்கேன் செய்யுங்கள்.",
    upiId: "UPI ID", copy: "நகலெடு", copied: "நகலெடுக்கப்பட்டது", payCheck: "பணம் செலுத்தும் முன் மேலே உள்ள பெயர் உங்கள் மருத்துவமனையுடையது என்பதைச் சரிபார்க்கவும். பணம் நேரடியாக இந்த UPI ID-க்குச் செல்லும்.", qrAlt: "UPI QR குறியீடு",
  },
};

/** Looks a string up; falls back to English so a missing Tamil line never shows blank. */
export const tr = (lang, key, ...args) => {
  const v = (S[lang] && S[lang][key] != null ? S[lang][key] : S.en[key]);
  if (typeof v === "function") return v(...args);
  return v != null ? v : String(key);
};
export const PAGE_TEXT = S;
