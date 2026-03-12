export const CATEGORIES = {
  platos: "Platos principales",
  acompanar: "Guarniciones",
  ensaladas: "Ensaladas",
}

export const sides = [
  "Papas fritas",
  "Papas al horno",
  "Ensalada de lechuga y tomate",
  "Puré de papa",
  "Puré de calabaza",
]

import productImages from "./productImages.js";

// Cada producto tiene imagen desde src/assets/products/{id}.jpg si existe.
const productsBase = [
  // PLATOS PRINCIPALES
  {
    id: "sandwich-milanesa",
    name: "Sándwich de milanesa",
    description: "Carne/pollo al horno",
    price: 8000,
    category: "platos",
  },
  {
    id: "hamburguesa-completa",
    name: "Hamburguesa completa",
    description: "Medallón carne, lechuga, tomate, cheddar",
    price: 8500,
    category: "platos",
  },
  {
    id: "hamburguesa-queso",
    name: "Hamburguesa con queso",
    price: 7500,
    category: "platos",
  },

  // ✅ GUARNICIÓN A ELECCIÓN (options explícitas)
  {
    id: "milanesa-berenjena",
    name: "Milanesa de berenjena al plato",
    description: "Guarnición a elección",
    price: 8000,
    category: "platos",
    optionsLabel: "Guarnición",
    options: sides,
  },
  {
    id: "milanesa-carne-pollo",
    name: "Milanesa carne/pollo al plato",
    description: "Guarnición a elección",
    price: 8000,
    category: "platos",
    optionsLabel: "Guarnición",
    options: sides,
  },

  {
    id: "porcion-tarta",
    name: "Porción de tarta",
    description: "Acelga/zapallo",
    price: 5500,
    category: "platos",
  },

  // ✅ EMPANADAS CON SABOR (options explícitas)
  {
    id: "empanadas-chica",
    name: "Empanadas (Chica)",
    description: "Elegí el sabor",
    price: 1500,
    category: "platos",
    optionsLabel: "Sabor",
    options: ["Carne", "Pollo", "Jamón y queso", "Jamón y roquefort"],
    recommended: true,
  },
  {
    id: "empanadas-grande",
    name: "Empanadas (Grande)",
    description: "Elegí el sabor",
    price: 2000,
    category: "platos",
    optionsLabel: "Sabor",
    options: ["Carne", "Pollo", "Jamón y queso", "Jamón y roquefort"],
    recommended: true,
  },

  {
    id: "tortilla-papa",
    name: "Tortilla de papa y huevo",
    price: 6500,
    category: "platos",
  },
  {
    id: "tortilla-acelga",
    name: "Tortilla de acelga",
    price: 5500,
    category: "platos",
  },
  {
    id: "omelette",
    name: "Omelette",
    price: 3000,
    category: "platos",
  },
  {
    id: "tallarines",
    name: "Tallarines",
    price: 3500,
    category: "platos",
  },

  // PARA ACOMPAÑAR
  {
    id: "ensalada-rusa",
    name: "Ensalada rusa",
    description: "Papa, zanahoria, mayonesa",
    price: 2500,
    category: "acompanar",
  },
  {
    id: "ensalada-mixta",
    name: "Ensalada mixta",
    description: "Lechuga, tomate, zanahoria",
    price: 2500,
    category: "acompanar",
  },
  {
    id: "papas-extra",
    name: "Papas fritas / al horno",
    price: 2500,
    category: "acompanar",
  },

  // ENSALADAS
  {
    id: "ensalada-proteica",
    name: "Ensalada proteica",
    description:
      "Arroz, brócoli, zanahoria, lenteja, arvejas, choclo, huevo, pollo, jamón",
    price: 6500,
    category: "ensaladas",
  },
  {
    id: "ensalada-multicolor",
    name: "Ensalada multicolor",
    description:
      "Zanahoria, arvejas, choclo, huevo, pollo, lechuga, rúcula, repollo, tomate, queso",
    price: 6500,
    category: "ensaladas",
  },
  {
    id: "ensalada-fruta",
    name: "Ensalada de fruta",
    price: 3000,
    category: "ensaladas",
  },
];

export const products = productsBase.map((p) => ({
  ...p,
  image: productImages[p.id] ?? null,
}));