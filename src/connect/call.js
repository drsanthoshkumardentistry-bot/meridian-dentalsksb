// Video call invites between verified dentists. Calls run on the free Jitsi Meet service:
// no account, no cost, and the room name is a long random string only the two dentists receive.
const HOST = "https://meet.jit.si";
const PREFIX = "MeriDentConnect-";

export const newRoomName = (cryptoObj = globalThis.crypto) => {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(20);
  cryptoObj.getRandomValues(bytes);
  return PREFIX + Array.from(bytes, (b) => chars[b % chars.length]).join("");
};

export const callLink = (room) => `${HOST}/${room}`;

/** The chat message that carries the invite. Kept under the 800 character message limit. */
export const inviteText = ({ fromName, when = "", room }) => {
  const at = String(when || "").trim().slice(0, 60);
  return `Video call invite from ${fromName}${at ? `, ${at}` : ""}.\nJoin: ${callLink(room)}\nPlease do not share patient names or phone numbers on the call without consent.`;
};

const LINK = /https:\/\/meet\.jit\.si\/MeriDentConnect-[A-Za-z0-9]{20}\b/;
/** The call link inside a message, or "" when the message is not an invite. */
export const findCallLink = (text) => {
  const m = LINK.exec(String(text || ""));
  return m ? m[0] : "";
};
