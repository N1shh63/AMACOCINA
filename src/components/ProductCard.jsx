import { useMemo, useState } from "react";
import { useCart } from "../store/CartContext";

function formatMoney(n) {
  const v = Number(n || 0);
  return v.toLocaleString("es-AR");
}

export default function ProductCard({ product }) {
  const { items, addItem, setQty } = useCart();

  const hasOptions = Array.isArray(product?.options) && product.options.length > 0;

  const [option, setOption] = useState(() => {
    if (hasOptions) return product.options[0];
    return "";
  });

  const safeOption = useMemo(() => {
    if (!hasOptions) return "";
    return product.options.includes(option) ? option : product.options[0];
  }, [hasOptions, product.options, option]);

  const cartId = useMemo(() => {
    return hasOptions ? `${product.id}__${safeOption}` : product.id;
  }, [hasOptions, product.id, safeOption]);

  const cartName = useMemo(() => {
    return hasOptions ? `${product.name} (${safeOption})` : product.name;
  }, [hasOptions, product.name, safeOption]);

  const qty = items.find((i) => i.id === cartId)?.qty ?? 0;

  const handleAdd = () => {
    if (!hasOptions) return addItem(product);

    addItem({
      ...product,
      id: cartId,
      name: cartName,
      selectedOption: safeOption,
      baseId: product.id,
    });
  };

  return (
    <article className="pCard">
      <header className="pCardHead">
        <h3 className="pCardTitle">{product.name}</h3>
        <div className="pCardPrice">${formatMoney(product.price)}</div>
      </header>

      <p className="pCardDesc">
        {product.description ? product.description : "Hecho en el momento · Estilo casero"}
      </p>

      {hasOptions ? (
        <div className="pCardOptions">
          <span className="pCardLabel">{product.optionsLabel || "Elegí una opción"}</span>
          <select
            className="pCardSelect"
            value={safeOption}
            onChange={(e) => setOption(e.target.value)}
          >
            {product.options.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="pCardBottom">
        {qty === 0 ? (
          <button className="btn btnPrimary btnBlock" onClick={handleAdd}>
            Agregar al carrito
          </button>
        ) : (
          <div className="pQty">
            <button className="qtyBtn" onClick={() => setQty(cartId, qty - 1)} aria-label="Restar">
              −
            </button>
            <div className="qtyVal">{qty}</div>
            <button className="qtyBtn" onClick={() => setQty(cartId, qty + 1)} aria-label="Sumar">
              +
            </button>
          </div>
        )}

        <div className="pCardMeta">
          <span>Pedido fácil</span>
          <span>WhatsApp + Pago</span>
        </div>
      </div>
    </article>
  );
}