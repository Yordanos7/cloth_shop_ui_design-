import React, { useEffect, useState } from 'react';
import {
  CartItem,
  GARMENTS,
  formatMoney,
  getCropStyle,
} from '../data/catalog';

interface CartDrawerProps {
  open: boolean;
  u: number;
  items: CartItem[];
  onClose: () => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onCompleteOrder: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  open,
  u,
  items,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onCompleteOrder,
}) => {
  const [orderConfirmed, setOrderConfirmed] = useState<{
    ref: string;
    total: number;
    count: number;
  } | null>(null);

  useEffect(() => {
    if (!open && orderConfirmed) {
      const t = window.setTimeout(() => setOrderConfirmed(null), 600);
      return () => window.clearTimeout(t);
    }
  }, [open, orderConfirmed]);

  const totalCount = items.reduce((sum, item) => sum + item.qty, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + GARMENTS[item.k].price * item.qty,
    0,
  );

  const handleCheckout = () => {
    if (items.length === 0) return;
    const ref = `MV-${new Date().getFullYear()}-${String(
      Math.floor(1000 + Math.random() * 9000),
    )}`;
    setOrderConfirmed({
      ref,
      total: totalAmount,
      count: totalCount,
    });
    onCompleteOrder();
  };

  return (
    <aside
      className="drawer"
      aria-label="Shopping cart"
      aria-hidden={!open}
    >
      <div className="drawer-head">
        <div className="drawer-title-wrap">
          <h2 className="drawer-title">Cart</h2>
          <span className="drawer-chip">
            {orderConfirmed ? orderConfirmed.count : totalCount}
          </span>
        </div>
        <button
          type="button"
          className="drawer-close"
          onClick={onClose}
          aria-label="Close cart"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="drawer-body">
        {orderConfirmed ? (
          <div
            style={{
              padding: `${28 * u}px 0`,
              display: 'flex',
              flexDirection: 'column',
              gap: `${14 * u}px`,
            }}
          >
            <div
              style={{
                fontSize: `${11 * u}px`,
                letterSpacing: '0.14em',
                color: '#8A7F72',
                fontWeight: 600,
              }}
            >
              ATELIER ORDER CONFIRMED
            </div>
            <div
              style={{
                fontSize: `${21 * u}px`,
                fontWeight: 600,
                color: '#1A1716',
                letterSpacing: '-0.01em',
              }}
            >
              Thank you for your commission.
            </div>
            <p
              style={{
                margin: 0,
                fontSize: `${14 * u}px`,
                lineHeight: 1.55,
                color: '#6F665C',
              }}
            >
              Reference{' '}
              <strong style={{ color: '#1A1716', fontWeight: 600 }}>
                {orderConfirmed.ref}
              </strong>{' '}
              has been registered with our Milan tailoring studio. {orderConfirmed.count}{' '}
              {orderConfirmed.count === 1 ? 'piece' : 'pieces'} totaling{' '}
              <span style={{ fontVariantNumeric: 'tabular-nums', color: '#1A1716', fontWeight: 600 }}>
                {formatMoney(orderConfirmed.total)}
              </span>{' '}
              will be prepared to order.
            </p>
            <button
              type="button"
              onClick={() => {
                setOrderConfirmed(null);
                onClose();
              }}
              style={{
                marginTop: `${10 * u}px`,
                alignSelf: 'flex-start',
                fontSize: `${13.5 * u}px`,
                fontWeight: 500,
                color: '#1A1716',
                borderBottom: '1px solid #1A1716',
                paddingBottom: `${4 * u}px`,
              }}
            >
              Continue browsing
            </button>
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              padding: `${48 * u}px 0`,
              color: '#746A5E',
              fontSize: `${15 * u}px`,
              lineHeight: 1.5,
            }}
          >
            Your bag is empty. Select a garment from the rail to add a piece.
          </div>
        ) : (
          items.map((item) => {
            const garment = GARMENTS[item.k];
            const crop = garment.crops.front;
            const thumbScale = Math.min(
              (76 * u) / 235,
              (90 * u) / (crop.h + 6),
            );
            const cropStyle = getCropStyle(item.k, 'front', thumbScale);
            const cropH = (crop.h + 6) * thumbScale;

            return (
              <div
                key={item.id}
                className={`drawer-row${item.isNew ? ' is-new' : ''}`}
              >
                <div className="drawer-thumb">
                  <div
                    style={{
                      ...cropStyle,
                      position: 'absolute',
                      left: '50%',
                      marginLeft: `${-170 * thumbScale}px`,
                      top: '50%',
                      marginTop: `${-cropH / 2}px`,
                    }}
                  />
                </div>

                <div>
                  <div className="drawer-row-name">{garment.name}</div>
                  <div className="drawer-row-meta">
                    Size: {item.size}
                    <br />
                    {formatMoney(garment.price)}
                  </div>
                  <div className="drawer-row-controls">
                    <div className="qty-stepper" aria-label="Quantity">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${garment.name}`}
                        onClick={() => onUpdateQty(item.id, -1)}
                      >
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${garment.name}`}
                        onClick={() => onUpdateQty(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="trash-btn"
                      aria-label={`Remove ${garment.name}`}
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 18 18"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M3.5 4.5H14.5M7 4.5V3C7 2.45 7.45 2 8 2H10C10.55 2 11 2.45 11 3V4.5M5 4.5L5.6 14.2C5.65 14.9 6.23 15.5 6.95 15.5H11.05C11.77 15.5 12.35 14.9 12.4 14.2L13 4.5"
                          stroke="currentColor"
                          strokeWidth="1.35"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="drawer-row-total">
                  {formatMoney(garment.price * item.qty)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {!orderConfirmed && (
        <div className="drawer-footer">
          <div className="drawer-total-row">
            <span className="drawer-total-label">Estimated total</span>
            <span className="drawer-total-val">{formatMoney(totalAmount)}</span>
          </div>
          <div className="drawer-note">
            Taxes and shipping calculated at checkout.
          </div>
          <button
            type="button"
            className="drawer-checkout"
            disabled={items.length === 0}
            onClick={handleCheckout}
          >
            Checkout
          </button>
        </div>
      )}
    </aside>
  );
};
