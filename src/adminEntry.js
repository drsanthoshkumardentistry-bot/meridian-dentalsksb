// The founder's own entrance at /admin. It opens the admin dashboard and nothing else. Who is a founder is still decided
// by the server (FOUNDER_EMAILS), so anyone else who types this address is sent to the normal home page.
export const ADMIN_PATH = "/admin";
export const isAdminPath = (pathname = "") => (String(pathname).replace(/\/+$/, "") || "/") === ADMIN_PATH;

/** Makes the page behave as its own small app: its own name and install icon, and hidden from search. */
export const prepareAdminPage = (doc = document) => {
  try {
    const link = doc.querySelector('link[rel="manifest"]');
    if (link) link.setAttribute("href", "/admin.webmanifest");
    doc.title = "MeriDent Admin";
    const meta = doc.createElement("meta");
    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "noindex,nofollow");
    doc.head.appendChild(meta);
  } catch { /* the page still works without these */ }
};
