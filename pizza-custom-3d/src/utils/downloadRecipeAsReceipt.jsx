import React from "react";
import ReactDOM from "react-dom/client";
import { ReceiptContent } from "../components/PizzaBuilder/Pizzareceipt";
import { TOPPING_PRICES, TOPPING_NAMES, BASE_PRICES, SIZE_PRICES, SAUCE_PRICES, CHEESE_PRICES, SHAPE_LABELS } from "../data/ingredientData";

export async function downloadRecipeAsReceipt(recipe) {
  const downloads = JSON.parse(localStorage.getItem("downloads") || "{}");
  downloads[recipe.id] = (downloads[recipe.id] || 0) + 1;
  localStorage.setItem("downloads", JSON.stringify(downloads));

  const ingredientCounts = {};
  (recipe.toppings || []).forEach((t) => {
    if (t.id) ingredientCounts[t.id] = (ingredientCounts[t.id] || 0) + 1;
  });

  const baseKey = (recipe.baseType || "").toLowerCase();
  const sauceKey = (recipe.sauceType || "").toLowerCase();
  const cheeseKey = (recipe.cheeseType || "").toLowerCase();

  const basePrice = BASE_PRICES[baseKey] ?? 5.5;
  const sizePrice = SIZE_PRICES[recipe.baseSize] ?? 0;
  const saucePrice = SAUCE_PRICES[sauceKey] ?? 1.0;
  const cheesePrice = CHEESE_PRICES[cheeseKey] ?? 2.0;

  const toppingLines = Object.entries(ingredientCounts).map(([id, count]) => ({
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

  const shapeLabel =
    SHAPE_LABELS[(recipe.pizzaShape || "").toLowerCase()] ??
    recipe.pizzaShape ??
    "Círculo";

  const data = {
    orderId: `#${recipe.id.toString().slice(-4)}`,
    timestamp: new Date(recipe.createdAt || Date.now()).toLocaleString(
      "pt-PT",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    ),
    baseType: recipe.baseType,
    baseSize: recipe.baseSize,
    pizzaShape: shapeLabel,
    sauceType: recipe.sauceType,
    cheeseType: recipe.cheeseType,
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
    link.download = `Receita${data.orderId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (e) {
    console.error("Download da Receita Falhou:", e);
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}
