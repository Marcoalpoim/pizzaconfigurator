// src/data/ingredientData.js
// Single source of truth for all ingredient metadata

export const TOPPING_PRICES = {
  pepperoni:          1.8,
  cogumelos:          1.2,
  azeitona:           1.0,
  basil:              0.8,
  ananas:             1.5,
  cebola:             0.9,
  frango:             2.0,
  carne:              2.5,
  pancetta:           1.8,
  bacon:              1.8,
  chourico:           1.7,
  fiambre:            1.4,
  pimento:            1.0,
  tomate_cherry:      1.1,
  cebola_caramelizada:1.2,
  camarao:            2.8,
  atum:               2.2,
};

export const TOPPING_NAMES = {
  pepperoni:           "Pepperoni",
  cogumelos:           "Cogumelos",
  azeitona:            "Azeitona",
  basil:               "Manjericão",
  ananas:              "Ananás",
  cebola:              "Cebola",
  frango:              "Frango Marinado",
  carne:               "Carne de Vaca",
  pancetta:            "Pancetta",
  bacon:               "Bacon",
  chourico:            "Chouriço",
  fiambre:             "Fiambre",
  pimento:             "Pimento Verde",
  tomate_cherry:       "Tomate Cherry",
  cebola_caramelizada: "Cebola Caramelizada",
  camarao:             "Camarão",
  atum:                "Atum",
};

export const TOPPING_CALORIES = {
  pepperoni:           55,
  cogumelos:            4,
  azeitona:             8,
  basil:                1,
  ananas:              10,
  cebola:               7,
  frango:              30,
  carne:               45,
  pancetta:            50,
  bacon:               50,
  chourico:            48,
  fiambre:             20,
  pimento:              5,
  tomate_cherry:        6,
  cebola_caramelizada: 18,
  camarao:             25,
  atum:                28,
};

export const BASE_PRICES   = { fina: 4.5, média: 5.5, "alta e fofa": 6.5 };
export const BASE_CALORIES = { fina: 180, média: 260, "alta e fofa": 380 };
export const BASE_NAMES    = { fina: "Fina e Crocante", média: "Clássica", "alta e fofa": "Alta e Fofa" };

export const SIZE_PRICES     = { 28: 0, 33: 1.5, 40: 3.0 };
export const SIZE_MULTIPLIER = { 28: 0.8, 33: 1.0, 40: 1.35 };
export const SIZE_NAMES      = { 28: "Individual (28cm)", 33: "Média (33cm)", 40: "Grande (40cm)" };

export const SAUCE_PRICES   = { tomate: 1.0, "tomate e oregãos": 1.0, carbonara: 1.8, pesto: 2.0, barbecue: 1.5 };
export const SAUCE_CALORIES = { tomate: 45, "tomate e oregãos": 45, carbonara: 110, pesto: 130, barbecue: 90 };
export const SAUCE_NAMES    = {
  tomate:           "Molho de Tomate",
  "tomate e oregãos": "Molho de Tomate e Orégãos",
  carbonara:        "Molho Carbonara",
  pesto:            "Molho Pesto",
  barbecue:         "Molho Barbecue",
};

export const CHEESE_PRICES   = { mozzarella: 2.0, cheddar: 2.2, parmesan: 2.5, gorgonzola: 2.8, none: 0 };
export const CHEESE_CALORIES = { mozzarella: 170, cheddar: 200, parmesan: 160, gorgonzola: 190, none: 0 };
export const CHEESE_NAMES    = {
  mozzarella: "Queijo Mozzarella",
  cheddar:    "Queijo Cheddar",
  parmesan:   "Queijo Parmesão",
  gorgonzola: "Queijo Gorgonzola",
  none:       null,
};

export const SHAPE_LABELS = {
  circulo:   "Círculo",
  quadrado:  "Quadrado",
  triangulo: "Triângulo",
  diamante:  "Diamante",
  oval:      "Oval",
  estrela:   "Estrela",
  coração:   "Coração",
};