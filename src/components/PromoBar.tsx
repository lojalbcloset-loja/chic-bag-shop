import { useEffect, useState } from "react";
import { promoMessages } from "@/lib/catalog";

export function PromoBar() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % promoMessages.length), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="promo-bar" aria-label="Promoções">
      <button
        className="promo-arrow"
        type="button"
        aria-label="Promoção anterior"
        onClick={() => setIdx((i) => (i - 1 + promoMessages.length) % promoMessages.length)}
      >
        ‹
      </button>
      <p>{promoMessages[idx]}</p>
      <button
        className="promo-arrow"
        type="button"
        aria-label="Próxima promoção"
        onClick={() => setIdx((i) => (i + 1) % promoMessages.length)}
      >
        ›
      </button>
    </div>
  );
}
