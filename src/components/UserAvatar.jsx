import React, { useEffect, useState } from "react";

/** The account's Google profile photo, or the first letter of the name when there is no photo or it cannot load. */
export default function UserAvatar({ user, className = "w-8 h-8", textClass = "text-xs" }) {
  const [broken, setBroken] = useState(false);
  const url = user?.photoURL || "";
  useEffect(() => { setBroken(false); }, [url]);
  const letter = String((user && (user.displayName || user.email)) || "M").trim().charAt(0).toUpperCase();
  if (url && !broken) {
    return (
      <img
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={`${className} rounded-full object-cover bg-white border border-white/70 shadow-sm shrink-0`}
        data-testid="user-photo"
      />
    );
  }
  return (
    <span className={`${className} ${textClass} rounded-full bg-brand-600 text-white font-bold flex items-center justify-center shrink-0`} data-testid="user-initial">
      {letter}
    </span>
  );
}
