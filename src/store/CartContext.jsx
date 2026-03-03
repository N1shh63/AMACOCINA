import { createContext, useContext, useReducer } from "react"
import { cartReducer } from "./cartReducer"

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, [])

  const addItem = (product) => dispatch({ type: "ADD", payload: product })
  const setQty = (id, qty) => dispatch({ type: "SET_QTY", id, qty })
  const removeItem = (id) => dispatch({ type: "REMOVE", id })
  const clear = () => dispatch({ type: "CLEAR" })

  const totalItems = items.reduce((acc, i) => acc + i.qty, 0)
  const totalPrice = items.reduce((acc, i) => acc + i.qty * i.price, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, setQty, removeItem, clear, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>")
  return ctx
}