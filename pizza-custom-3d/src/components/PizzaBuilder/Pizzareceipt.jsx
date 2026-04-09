// src/components/PizzaBuilder/PizzaReceipt.jsx
import React, { useState, useRef, useMemo } from "react";

// ── Pricing data ──────────────────────────────────────────────────────────────

const TOPPING_PRICES = {
  pepperoni: 1.8,
  mushroom:  1.2,
  olive:     1.0,
  basil:     0.8,
  ananas:    1.5,
  cebola:    0.9,
};

const BASE_PRICES = {
  thin:   4.5,
  medium: 5.5,
  thick:  6.5,
};

const SIZE_PRICES = {
  28: 0,
  33: 1.5,
  40: 3.0,
};

const SAUCE_PRICES = {
  tomate:    1.0,
  tomato:    1.0,
  carbonara: 1.8,
  pesto:     2.0,
  barbecue:  1.5,
};

const CHEESE_PRICES = {
  mozzarella: 2.0,
  cheddar:    2.2,
  parmesan:   2.5,
  gorgonzola: 2.8,
  none:       0,
};

const SAUCE_NAMES = {
  tomate:    "Salsa di Pomodoro",
  tomato:    "Salsa di Pomodoro",
  carbonara: "Crema Carbonara",
  pesto:     "Pesto alla Genovese",
  barbecue:  "Salsa Barbecue",
};

const CHEESE_NAMES = {
  mozzarella: "Fior di Latte",
  cheddar:    "Cheddar Stagionato",
  parmesan:   "Parmigiano Reggiano",
  gorgonzola: "Gorgonzola DOP",
  none:       null,
};

const TOPPING_NAMES = {
  pepperoni: "Salame Piccante",
  mushroom:  "Funghi Porcini",
  olive:     "Olive Taggiasche",
  basil:     "Basilico Fresco",
  ananas:    "Ananas (con coraggio)",
  cebola:    "Cipolla Caramellata",
};

const BASE_NAMES = {
  thin:   "Impasto Sottile",
  medium: "Impasto Classico",
  thick:  "Impasto Alto",
};

const SIZE_NAMES = {
  28: "Piccola (28cm)",
  33: "Media (33cm)",
  40: "Grande (40cm)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomOrderId() {
  return `#${Math.floor(Math.random() * 9000 + 1000)}`;
}

function formatPrice(n) {
  return `€${n.toFixed(2)}`;
}

function now() {
  return new Date().toLocaleString("it-IT", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Receipt styles (inline so html2canvas captures them) ─────────────────────

const R = {
  wrap: {
    fontFamily: "'Courier New', Courier, monospace",
    background: "#fffdf5",
    color: "#1a1a1a",
    width: 320,
    padding: "28px 24px 20px",
    boxSizing: "border-box",
    borderRadius: 4,
    boxShadow: "0 2px 24px rgba(0,0,0,0.13)",
    position: "relative",
    overflow: "hidden",
  },
  zigzagTop: {
    position: "absolute", top: 0, left: 0, right: 0, height: 12,
    background: "repeating-linear-gradient(90deg, #fffdf5 0 10px, transparent 10px 20px), repeating-linear-gradient(-45deg, #e8e0cc 0 7px, #fffdf5 7px 14px)",
  },
  zigzagBottom: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 12,
    background: "repeating-linear-gradient(90deg, #fffdf5 0 10px, transparent 10px 20px), repeating-linear-gradient(45deg, #e8e0cc 0 7px, #fffdf5 7px 14px)",
  },
  restaurantName: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#888",
    marginBottom: 14,
  },
  divider: {
    borderTop: "1px dashed #ccc",
    margin: "10px 0",
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 10,
    color: "#888",
    marginBottom: 2,
  },
  sectionLabel: {
    fontSize: 9,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "#aaa",
    marginBottom: 4,
    marginTop: 10,
  },
  lineItem: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    marginBottom: 3,
    gap: 8,
  },
  lineItemName: {
    flex: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  lineItemPrice: {
    flexShrink: 0,
    fontVariantNumeric: "tabular-nums",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 15,
    fontWeight: 700,
    marginTop: 4,
  },
  vatRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 10,
    color: "#aaa",
    marginBottom: 2,
  },
  thankYou: {
    textAlign: "center",
    fontSize: 11,
    letterSpacing: "0.1em",
    color: "#888",
    marginTop: 14,
    fontStyle: "italic",
  },
  barcode: {
    textAlign: "center",
    fontSize: 28,
    letterSpacing: "0.05em",
    color: "#222",
    marginTop: 10,
    lineHeight: 1,
  },
};

// ── Receipt content (separate so we can render to DOM for capture) ────────────

export function ReceiptContent({ data }) {
  const {
    orderId, timestamp, baseType, baseSize, sauceType,
    cheeseType, ingredientCounts,
    basePrice, sizePrice, saucePrice, cheesePrice,
    toppingLines, subtotal, vat, total,
  } = data;

  return (
    <div style={R.wrap}>
      <div style={R.zigzagTop} />

      {/* Header */}
      <div style={{ paddingTop: 8 }}>
        <div style={R.restaurantName}>La Pizzeria Digitale</div>
        <div style={R.subtitle}>Ristorante & Pizzeria — Dal 2025</div>
        <div style={R.subtitle}>Via dell'Algoritmo, 42 · Milano</div>
      </div>

      <div style={R.divider} />

      {/* Meta */}
      <div style={R.metaRow}>
        <span>Ordine {orderId}</span>
        <span>{timestamp}</span>
      </div>
      <div style={R.metaRow}>
        <span>Tavolo 7</span>
        <span>Coperto: €2.50</span>
      </div>

      <div style={R.divider} />

      {/* Base */}
      <div style={R.sectionLabel}>Impasto</div>
      <div style={R.lineItem}>
        <span style={R.lineItemName}>{BASE_NAMES[baseType] ?? baseType} · {SIZE_NAMES[baseSize]}</span>
        <span style={R.lineItemPrice}>{formatPrice(basePrice + sizePrice)}</span>
      </div>

      {/* Sauce */}
      <div style={R.sectionLabel}>Salsa</div>
      <div style={R.lineItem}>
        <span style={R.lineItemName}>{SAUCE_NAMES[sauceType] ?? sauceType}</span>
        <span style={R.lineItemPrice}>{formatPrice(saucePrice)}</span>
      </div>

      {/* Cheese */}
      {CHEESE_NAMES[cheeseType] && (
        <>
          <div style={R.sectionLabel}>Formaggio</div>
          <div style={R.lineItem}>
            <span style={R.lineItemName}>{CHEESE_NAMES[cheeseType]}</span>
            <span style={R.lineItemPrice}>{formatPrice(cheesePrice)}</span>
          </div>
        </>
      )}

      {/* Toppings */}
      {toppingLines.length > 0 && (
        <>
          <div style={R.sectionLabel}>Ingredienti</div>
          {toppingLines.map(({ id, name, count, price }) => (
            <div key={id} style={R.lineItem}>
              <span style={R.lineItemName}>{name}{count > 1 ? ` ×${count}` : ""}</span>
              <span style={R.lineItemPrice}>{formatPrice(price)}</span>
            </div>
          ))}
        </>
      )}

      {/* Coperto */}
      <div style={{ ...R.lineItem, marginTop: 6 }}>
        <span style={R.lineItemName}>Coperto</span>
        <span style={R.lineItemPrice}>€2.50</span>
      </div>

      <div style={R.divider} />

      {/* Totals */}
      <div style={R.vatRow}>
        <span>Subtotale</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div style={R.vatRow}>
        <span>IVA (22%)</span>
        <span>{formatPrice(vat)}</span>
      </div>
      <div style={R.totalRow}>
        <span>TOTALE</span>
        <span>{formatPrice(total)}</span>
      </div>

      <div style={R.divider} />

      {/* Footer */}
      <div style={R.thankYou}>Grazie per la sua visita!</div>
      <div style={R.thankYou}>Arrivederci e buon appetito 🍕</div>
      <div style={R.barcode}>||| || ||| | || ||| || | |||</div>
      <div style={{ textAlign: "center", fontSize: 9, color: "#bbb", marginTop: 4 }}>
        {orderId} · pizzeria-digitale.it
      </div>

      <div style={R.zigzagBottom} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PizzaReceipt({
  ingredientCounts,
  baseType,
  baseSize,
  sauceType,
  cheeseType,
}) {
  const [open, setOpen] = useState(false);
  const receiptRef = useRef(null);

  const data = useMemo(() => {
    const basePrice   = BASE_PRICES[baseType]    ?? 5.5;
    const sizePrice   = SIZE_PRICES[baseSize]    ?? 0;
    const saucePrice  = SAUCE_PRICES[sauceType]  ?? 1.0;
    const cheesePrice = CHEESE_PRICES[cheeseType] ?? 2.0;

    const toppingLines = Object.entries(ingredientCounts)
      .filter(([, count]) => count > 0)
      .map(([id, count]) => ({
        id,
        name: TOPPING_NAMES[id] ?? id,
        count,
        price: (TOPPING_PRICES[id] ?? 1.0) * count,
      }));

    const toppingsTotal = toppingLines.reduce((s, l) => s + l.price, 0);
    const coperto = 2.5;
    const subtotal = basePrice + sizePrice + saucePrice + cheesePrice + toppingsTotal + coperto;
    const vat = subtotal * 0.22;
    const total = subtotal + vat;

    return {
      orderId: randomOrderId(),
      timestamp: now(),
      baseType, baseSize, sauceType, cheeseType, ingredientCounts,
      basePrice, sizePrice, saucePrice, cheesePrice,
      toppingLines, subtotal, vat, total,
    };
  }, [ingredientCounts, baseType, baseSize, sauceType, cheeseType]);

  async function handleDownload() {
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: "#fffdf5",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `ricevuta-${data.orderId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Download failed:", e);
      //alert("Install html2canvas: npm install html2canvas");
    }
  }

  function handlePrint() {
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Ricevuta ${data.orderId}</title>
      <style>body{margin:0;display:flex;justify-content:center;padding:20px;background:#eee;}
      @media print{body{background:white;}}</style>
      </head><body>${receiptRef.current.outerHTML}
      <script>window.onload=()=>{window.print();window.close();}<\/script>
      </body></html>
    `);
    win.document.close();
  }

  return (
    <div style={{ borderTop: "1px solid #eee", padding: "12px" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{ width: "100%", padding: "10px" }}
      >
        {open ? "✖ Close receipt" : "🧾 Get the bill"}
      </button>

      {open && (
        <div style={{ marginTop: 12 }}>
          {/* Scrollable receipt preview */}
          <div style={{ overflowX: "auto", paddingBottom: 4 }}>
            <div ref={receiptRef}>
              <ReceiptContent data={data} />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={handleDownload} style={{ flex: 1, padding: "8px" }}>
              ⬇ Download
            </button>
            <button onClick={handlePrint} style={{ flex: 1, padding: "8px" }}>
              🖨 Print
            </button>
          </div>
        </div>
      )}
    </div>
  );
}