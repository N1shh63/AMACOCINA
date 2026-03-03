export function buildWhatsAppMessage({ items, totalPrice, customer }) {
  const lines = []

  lines.push("🍽️ *Pedido AmaCocina*")
  lines.push("")
  lines.push(`👤 Nombre: ${customer.name}`)

  if (customer.notes?.trim()) {
    lines.push(`📝 Notas: ${customer.notes.trim()}`)
  }

  lines.push("")
  lines.push("*Detalle:*")

  for (const i of items) {
    lines.push(`- ${i.qty} x ${i.name} ($${i.price}) = $${i.qty * i.price}`)
  }

  lines.push("")
  lines.push(`💰 *Total: $${totalPrice}*`)
  lines.push("")
  lines.push("✅ Confirmo este pedido.")

  return lines.join("\n")
}

export function openWhatsApp({ phoneE164, message }) {
  const url = `https://wa.me/${phoneE164}?text=${encodeURIComponent(message)}`
  window.open(url, "_blank", "noopener,noreferrer")
}