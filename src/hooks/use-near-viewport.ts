import { useEffect, useRef, useState } from "react";

export function useNearViewport<T extends HTMLElement>(margin = "500px") {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setNear(true);
        observer.disconnect();
      }
    }, { rootMargin: margin });
    observer.observe(element);
    return () => observer.disconnect();
  }, [margin]);
  return { ref, near };
}