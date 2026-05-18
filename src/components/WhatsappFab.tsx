import { useState } from "react";
import whatsappIcon from "@/assets/images/icons/whatsapp.svg";

export function WhatsappFab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="whatsapp"
        type="button"
        aria-label="Abrir atendimento WhatsApp"
        onClick={() => setOpen((o) => !o)}
      >
        <img src={whatsappIcon} alt="WhatsApp" width={28} height={28} loading="lazy" decoding="async" />
      </button>
      {open && (
        <div className="whatsapp-menu" style={{ display: "flex" }}>
          <a href="https://wa.me/5562985388100" target="_blank" rel="noreferrer">
            Compre pelo WhatsApp
          </a>
          <a href="https://wa.me/5562985388100" target="_blank" rel="noreferrer">
            Central de atendimento
          </a>
        </div>
      )}
    </>
  );
}
