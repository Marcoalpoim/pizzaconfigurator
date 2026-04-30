import { useState, useRef, useEffect } from "react";

function AccordionSelect({ label, value, onChange, options, scrollContainerRef }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const bodyRef = useRef(null);
  const [height, setHeight] = useState(0);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  useEffect(() => {
    function handleClickOutside(e) {
      if (!containerRef.current || containerRef.current.contains(e.target)) return;

   
      const scrollEl = scrollContainerRef?.current;
      if (!scrollEl || !scrollEl.contains(e.target)) return;

      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

useEffect(() => {
  if (bodyRef.current) {
    setHeight(open ? bodyRef.current.scrollHeight : 0);
  }

  if (open && containerRef.current && scrollContainerRef?.current) {
    const body = bodyRef.current;

    const handleTransitionEnd = () => {
      const scrollEl = scrollContainerRef.current;
      const isMobile = window.innerWidth < 768;

      scrollEl.scrollTo({
        top: containerRef.current.offsetTop - (isMobile ? 100 : 80),
        behavior: 'smooth',
      });

      body.removeEventListener('transitionend', handleTransitionEnd);
    };

    body.addEventListener('transitionend', handleTransitionEnd);

    // Fallback in case transitionend doesn't fire
    return () => body.removeEventListener('transitionend', handleTransitionEnd);
  }
}, [open]);

  return (
    <div ref={containerRef} className="pizza-controls-item">
      <div onClick={() => setOpen((o) => !o)} className="pizza-controls-item-content">
        <span style={{ fontSize: 13, fontWeight: 400, color: "#fff" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{selectedLabel}</span>
          <svg
            width="14" height="14" viewBox="0 0 16 16" fill="none"
            stroke="currentColor" strokeWidth="1.5"
            style={{
              color: "#fff",
              transition: "transform 0.25s ease",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </div>
      </div>

      <div
        ref={bodyRef}
        style={{
          height,
          overflow: "hidden",
          transition: "height 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
          borderTop: height > 0 ? "0.5px solid #ddd" : "none",
        }}
      >
        <div style={{ padding: 6 }}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  textAlign: "left",
                  padding: "9px 10px",
                  fontSize: 14,
                  borderRadius: 6,
                  cursor: "pointer",
                  color: "#fff",
                  background: "transparent",
                  border: isSelected ? "2px dashed #ddd" : "1px dashed transparent",
                  fontWeight: isSelected ? 500 : 400,
                  fontFamily: "inherit",
                  transition: "background 0.15s ease",
                }}
              >
                {opt.label}
                {isSelected && (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                    stroke="currentColor" strokeWidth="2">
                    <path d="M3 8l3.5 3.5L13 5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
const BASE_TYPES = [
  { value: "fina", label: "Fina" },
  { value: "média", label: "Média" },
  { value: "alta", label: "Alta e Fofa" },
];
 
const BASE_SIZES = [
  { value: 28, label: "28 cm" },
  { value: 33, label: "33 cm" },
  { value: 40, label: "40 cm" },
  { value: 58, label: "58 cm" },
];
 
const SHAPES = [
  { value: "círculo", label: "Círculo" },
  { value: "quadrado", label: "Quadrado" },
  { value: "triangulo", label: "Triângulo" },
  { value: "diamante", label: "Diamante" },
  { value: "oval", label: "Oval" },
  { value: "estrela", label: "Estrela" },
  { value: "coração", label: "Coração" },
];
 
const SAUCES = [
  { value: "tomate", label: "Tomate" },
  { value: "carbonara", label: "Carbonara" },
  { value: "pesto", label: "Pesto" },
  { value: "barbecue", label: "Barbecue" },
];
 
const CHEESES = [
  { value: "none", label: "Sem Queijo" },
  { value: "mozzarella", label: "Mozzarella" },
  { value: "cheddar", label: "Cheddar" },
  { value: "parmesan", label: "Parmesan" },
  { value: "gorgonzola", label: "Gorgonzola" },
];
export default function PizzaControls({
  sauceType, setSauceType,
  baseType, setBaseType,
  baseSize, setBaseSize,
  pizzaShape, setPizzaShape,
  cheeseType, setCheeseType,
  scrollContainerRef, // ✅ pass this in from PizzaBuilder
}) {
  return (
    <div className="pizza-controls">
      <AccordionSelect label="Tipo de Base"    value={baseType}   onChange={setBaseType}   options={BASE_TYPES} scrollContainerRef={scrollContainerRef} />
      <AccordionSelect label="Tamanho da Base" value={baseSize}   onChange={setBaseSize}   options={BASE_SIZES} scrollContainerRef={scrollContainerRef} />
      <AccordionSelect label="Forma da Base"   value={pizzaShape} onChange={setPizzaShape} options={SHAPES}     scrollContainerRef={scrollContainerRef} />
      <AccordionSelect label="Tipo de Molho"   value={sauceType}  onChange={setSauceType}  options={SAUCES}     scrollContainerRef={scrollContainerRef} />
      <AccordionSelect label="Tipo de Queijo"  value={cheeseType} onChange={setCheeseType} options={CHEESES}    scrollContainerRef={scrollContainerRef} />
    </div>
  );
}