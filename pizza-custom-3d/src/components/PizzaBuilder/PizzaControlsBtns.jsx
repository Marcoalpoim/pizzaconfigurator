import React from "react";
import ReactDOM from "react-dom/client";
import { ReceiptContent } from "./Pizzareceipt";


const TOPPING_PRICES = {
  pepperoni: 1.8,
  mushroom: 1.2,
  olive: 1.0,
  basil: 0.8,
  ananas: 1.5,
  cebola: 0.9,
};
const BASE_PRICES = { thin: 4.5, medium: 5.5, thick: 6.5 };
const SIZE_PRICES = { 28: 0, 33: 1.5, 40: 3.0 };
const SAUCE_PRICES = {
  tomate: 1.0,
  tomato: 1.0,
  carbonara: 1.8,
  pesto: 2.0,
  barbecue: 1.5,
};
const CHEESE_PRICES = {
  mozzarella: 2.0,
  cheddar: 2.2,
  parmesan: 2.5,
  gorgonzola: 2.8,
  none: 0,
};
const TOPPING_NAMES = {
  pepperoni: "Salame Piccante",
  mushroom: "Funghi Porcini",
  olive: "Olive Taggiasche",
  basil: "Basilico Fresco",
  ananas: "Ananas (con coraggio)",
  cebola: "Cipolla Caramellata",
};

async function downloadReceipt({
  baseType,
  baseSize,
  sauceType,
  cheeseType,
  ingredientCounts,
}) {
  const basePrice = BASE_PRICES[baseType] ?? 5.5;
  const sizePrice = SIZE_PRICES[baseSize] ?? 0;
  const saucePrice = SAUCE_PRICES[sauceType] ?? 1.0;
  const cheesePrice = CHEESE_PRICES[cheeseType] ?? 2.0;

  const toppingLines = Object.entries(ingredientCounts)
    .filter(([, count]) => count > 0)
    .map(([id, count]) => ({
      id,
      name: TOPPING_NAMES[id] ?? id,
      count,
      price: (TOPPING_PRICES[id] ?? 1.0) * count,
    }));

  const coperto = 2.5;
  const subtotal =
    basePrice +
    sizePrice +
    saucePrice +
    cheesePrice +
    toppingLines.reduce((s, l) => s + l.price, 0) +
    coperto;
  const vat = subtotal * 0.22;
  const total = subtotal + vat;
  const orderId = `#${Math.floor(Math.random() * 9000 + 1000)}`;

  const data = {
    orderId,
    timestamp: new Date().toLocaleString("it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    baseType,
    baseSize,
    sauceType,
    cheeseType,
    ingredientCounts,
    basePrice,
    sizePrice,
    saucePrice,
    cheesePrice,
    toppingLines,
    subtotal,
    vat,
    total,
  };

  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-9999px;top:-9999px;z-index:-1;";
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);
  root.render(<ReceiptContent data={data} />);
  await new Promise((r) => setTimeout(r, 100));

  try {
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(container.firstChild, {
      backgroundColor: "#fffdf5",
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = `ricevuta-${orderId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (e) {
    console.error("Receipt download failed:", e);
    //alert("Make sure html2canvas is installed: npm install html2canvas");
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}

export default function PizzaControlsBtns({
  downloadSnapshot,
  handlePublish,
  handleSaveToProfile,
  removeAllToppings,
  // pizza state needed for the receipt
  baseType,
  baseSize,
  sauceType,
  cheeseType,
  ingredientCounts,
}) {
  return (
    <div className="config-btn-container">
      <div className="config-btn">
        {/* 🧾 Receipt download */}
        <div className="btn-box">
          <button
            onClick={() =>
              downloadReceipt({
                baseType,
                baseSize,
                sauceType,
                cheeseType,
                ingredientCounts,
              })
            }
          >
            <img src="/icons/camera.svg" alt="receipt" /> 
                 {/* <p>Receita</p>*/}
          </button>
        </div>

        {/* 📸 Snapshot    
        <div className="btn-box">
          <button onClick={() => downloadSnapshot(true)}>
            <img src="/icons/camera.svg" alt="printscreen" />
            <p>Print</p>
          </button>
        </div>
       */}
        {/* 💾 Save */}
        <div className="btn-box">
          <button onClick={handleSaveToProfile}>
            <img src="/icons/save.svg" alt="save" /> 
              {/* <p>Guardar</p>*/}
          </button>
        </div>

        {/* 🗑 Clear */}
        <div className="btn-box">
          <button onClick={removeAllToppings}>
            <img src="/icons/delete.svg" alt="clear" />
           {/* <p>Apagar</p>*/}
          </button>
        </div>

        {/* 📤 Publish */}
        <div className="btn-box send-btn">
          <button onClick={handlePublish}>
          <p>Publicar</p> 
            <img src="/icons/send.svg" alt="publish" />
          </button>
        </div>
      </div>
    </div>
  );
}
