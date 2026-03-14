export default function PizzaControls({
  sauceType,
  setSauceType,
  baseType,
  setBaseType,
  baseSize,
  setBaseSize,
  hasCheese,
  setHasCheese,
  cheeseType,
  setCheeseType,
  downloadSnapshot,
  handlePublish,
  handleSaveToProfile,
  removeAllToppings
}) {
  return (
    <div style={{ marginTop: 6 }}>

      {/* Sauce */}
      <div>Sauce Type</div>
      <select value={sauceType} onChange={(e)=>setSauceType(e.target.value)}>
        <option value="tomate">Tomate</option>
        <option value="carbonara">Carbonara</option>
        <option value="pesto">Pesto</option>
        <option value="barbecue">Barbecue</option>
      </select>

      {/* Base */}
      <div style={{marginTop:12}}>Base Type</div>
      <select value={baseType} onChange={(e)=>setBaseType(e.target.value)}>
        <option value="thin">Thin</option>
        <option value="medium">Medium</option>
        <option value="thick">Thick</option>
      </select>

      {/* Size */}
      <div style={{marginTop:12}}>Size</div>
      <select value={baseSize} onChange={(e)=>setBaseSize(parseInt(e.target.value))}>
        <option value={28}>28 cm</option>
        <option value={33}>33 cm</option>
        <option value={40}>40 cm</option>
      </select>

      {/* Buttons */}
      <div style={{marginTop:12, display:"flex", flexDirection:"column", gap:6}}>
        <button onClick={()=>downloadSnapshot(true)}>Snapshot</button>
        <button onClick={handlePublish}>Publish</button>
        <button onClick={handleSaveToProfile}>Save</button>
        <button onClick={removeAllToppings}>Clear</button>
      </div>

      {/* Cheese Toggle */}
      <div style={{marginTop:16}}>Cheese</div>

      <button
        onClick={()=>setHasCheese(!hasCheese)}
        style={{
          marginTop:6,
          padding:"6px 10px",
          background: hasCheese ? "#3c7a3c" : "#333",
          color:"#fff",
          border:"none",
          borderRadius:4,
          cursor:"pointer"
        }}
      >
        {hasCheese ? "Cheese ON" : "No Cheese"}
      </button>

      {/* Cheese Types (only if cheese is enabled) */}
      {hasCheese && (
        <div style={{marginTop:10}}>
          <div>Cheese Type</div>

          <select
            value={cheeseType}
            onChange={(e)=>setCheeseType(e.target.value)}
          >
            <option value="mozzarella">Mozzarella</option>
            <option value="cheddar">Cheddar</option>
            <option value="parmesan">Parmesan</option>
            <option value="gorgonzola">Gorgonzola</option>
          </select>
        </div>
      )}

    </div>
  );
}