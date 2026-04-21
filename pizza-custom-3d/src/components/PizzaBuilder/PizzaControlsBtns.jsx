import React from "react";
import { downloadRecipeAsReceipt } from "../../utils/downloadRecipeAsReceipt.jsx";

export default function PizzaControlsBtns({
  downloadSnapshot,
  handlePublish,
  handleSaveToProfile,
  removeAllToppings,
  baseType,
  baseSize,
  sauceType,
  cheeseType,
  ingredientCounts,
}) {
  // Adapt the individual props into the recipe shape the shared util expects
  const handleDownloadReceipt = () => {
    const toppings = Object.entries(ingredientCounts)
      .filter(([, count]) => count > 0)
      .flatMap(([id, count]) => Array.from({ length: count }, () => ({ id })));

    downloadRecipeAsReceipt({
      id: Date.now(),
      baseType,
      baseSize,
      sauceType,
      cheeseType,
      toppings,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="config-btn-container">
      <div className="config-btn">
        {/* 🧾 Receipt download */}
        <div className="btn-box">
          <button onClick={handleDownloadReceipt}>
            <img src="/icons/Receipt.svg" alt="receipt" />
          </button>
        </div>

        {/* 💾 Save */}
        <div className="btn-box">
          <button onClick={handleSaveToProfile}>
            <img src="/icons/saveit.svg" alt="save" />
          </button>
        </div>

        {/* 🗑 Clear */}
        <div className="btn-box">
          <button onClick={removeAllToppings}>
            <img src="/icons/trash.svg" alt="clear" />
          </button>
        </div>

        {/* 📤 Publish */}
        <div className="btn-box send-btn">
          <button onClick={handlePublish}>
            <p>Publicar</p>
            <img src="/icons/sendit.svg" alt="publish" />
          </button>
        </div>
      </div>
    </div>
  );
}