export default function PizzaControls({
  sauceType,
  setSauceType,
  baseType,
  setBaseType,
  baseSize,
  setBaseSize,
  pizzaShape,
   setPizzaShape, 
  cheeseType,
  setCheeseType, 
}) {
  return (
    <div style={{ marginTop: 6 }}>
   
      {/* Sauce */}
      <div>Sauce Type</div>
      <select value={sauceType} onChange={(e) => setSauceType(e.target.value)}>
        <option value="tomate">Tomate</option>
        <option value="carbonara">Carbonara</option>
        <option value="pesto">Pesto</option>
        <option value="barbecue">Barbecue</option>
      </select>

      {/* Base */}
      <div style={{ marginTop: 12 }}>Base Type</div>
      <select value={baseType} onChange={(e) => setBaseType(e.target.value)}>
        <option value="thin">Thin</option>
        <option value="medium">Medium</option>
        <option value="thick">Thick</option>
      </select>

      {/* Size */}
      <div style={{ marginTop: 12 }}>Size</div>
      <select
        value={baseSize}
        onChange={(e) => setBaseSize(parseInt(e.target.value))}
      >
        <option value={28}>28 cm</option>
        <option value={33}>33 cm</option>
        <option value={40}>40 cm</option>
        <option value={58}>58 cm</option>
      </select>

      {/* Size */} 
      <div style={{ marginTop: 12 }}>Forma da Base</div>

    <select value={pizzaShape} onChange={(e) => setPizzaShape(e.target.value)}>
    <option value="circle">Circle</option>
    <option value="square">Square</option>
    <option value="triangle">Triangle</option>
        <option value="diamond">Diamante</option>
    <option value="oval">Oval</option> 
      <option value="star">Star</option>
       <option value="heart">Heart</option>
  </select>

      {/* Cheese Types */}
      <div style={{ marginTop: 10 }}>
        <div>Cheese Type</div>

        <select
          value={cheeseType}
          onChange={(e) => setCheeseType(e.target.value)}
        >
          <option value="none">Sem Queijo</option>
          <option value="mozzarella">Mozzarella</option>
          <option value="cheddar">Cheddar</option>
          <option value="parmesan">Parmesan</option>
          <option value="gorgonzola">Gorgonzola</option>
        </select>
      </div>
 
    
    </div>
  );
}
