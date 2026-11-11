// Sign-in only works on MeriDent's own addresses. A copy of the app on any other address cannot log anyone in.
export const ALLOWED_HOSTS = [
  "www.meridiandentalos.com",
  "meridiandentalos.com",
  "meridian-dentalsksb.vercel.app",
  "localhost",
  "127.0.0.1",
];

export const isAllowedHost = (hostname, extra = "") => {
  const h = String(hostname || "").toLowerCase();
  const more = String(extra || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  return [...ALLOWED_HOSTS, ...more].includes(h);
};

export const HOST_ERROR = "Sign-in is only available on the official MeriDent website, www.meridiandentalos.com.";
