import { Link } from "react-router-dom"

export default function Checkout() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Checkout</h1>
      <p>Por ahora el pedido se envía desde el carrito por WhatsApp.</p>
      <Link to="/cart">Volver al carrito</Link>
    </div>
  )
}