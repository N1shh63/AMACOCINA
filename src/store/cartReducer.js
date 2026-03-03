export function cartReducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const existing = state.find((i) => i.id === action.payload.id)
      if (existing) {
        return state.map((i) =>
          i.id === action.payload.id ? { ...i, qty: i.qty + 1 } : i
        )
      }
      return [...state, { ...action.payload, qty: 1 }]
    }

    case "SET_QTY": {
      if (action.qty <= 0) return state.filter((i) => i.id !== action.id)
      return state.map((i) => (i.id === action.id ? { ...i, qty: action.qty } : i))
    }

    case "REMOVE":
      return state.filter((i) => i.id !== action.id)

    case "CLEAR":
      return []

    default:
      return state
  }
}