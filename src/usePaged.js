import { useEffect, useState } from "react";

export const PAGE_SIZE = 50;

/** Shows the first `size` rows of a long list, with a way to show more. Starts again from the top when `resetKey` changes. */
export function usePaged(list, resetKey, size = PAGE_SIZE) {
  const [count, setCount] = useState(size);
  useEffect(() => { setCount(size); }, [resetKey, size]);
  const total = list.length;
  return { shown: total > count ? list.slice(0, count) : list, total, hasMore: total > count, more: () => setCount((n) => n + size), remaining: Math.max(0, total - count) };
}
