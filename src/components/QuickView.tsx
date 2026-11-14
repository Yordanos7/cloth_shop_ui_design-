import React, { useEffect, useRef, useState } from 'react';
import {
  GARMENTS,
  SIZES,
  SizeOption,
  formatMoney,
  getCropStyle,
} from '../data/catalog';
import { waitForSheet } from '../utils/sheets';

export interface QuickViewLayout {
  hookX: number;
  hookY: number;
  scale: number;
}

interface QuickViewProps {
  piece: { index: number; k: number } | null;
  isOpen: boolean;
  view: 'front' | 'back';
  size: SizeOption;
  adding: boolean;
  layout: QuickViewLayout;
  qvImgRef: React.RefObject<HTMLDivElement | null>;
  qvFrontFaceRef: React.RefObject<HTMLDivElement | null>;
  qvBackFaceRef: React.RefObject<HTMLDivElement | null>;
  qvInfoRef: React.RefObject<HTMLDivElement | null>;
  onChangeView: (v: 'front' | 'back') => void;
  onChangeSize: (s: SizeOption) => void;
  onAddToCart: () => void;
  onClose: () => void;
}

export const QuickView: React.FC<QuickViewProps> = ({
  piece,
  isOpen,
  view,
  size,
  adding,
  layout,
  qvImgRef,
  qvFrontFaceRef,
  qvBackFaceRef,
  qvInfoRef,
  onChangeView,
  onChangeSize,
  onAddToCart,
  onClose,
}) => {
  const [showProductNote, setShowProductNote] = useState(false);
  const viewReqRef = useRef(0);

  useEffect(() => {
    setShowProductNote(false);
  }, [piece?.index, piece?.k]);

  const handleSelectView = (targetView: 'front' | 'back') => {
    if (targetView === view) return;
    const reqId = ++viewReqRef.current;
    waitForSheet(targetView).then(() => {
      if (viewReqRef.current === reqId) {
        onChangeView(targetView);
      }
    });
  };

  const garment = piece ? GARMENTS[piece.k] : null;
  const frontStyle = piece ? getCropStyle(piece.k, 'front', layout.scale) : {};
  const backStyle = piece ? getCropStyle(piece.k, 'back', layout.scale) : {};

  return (
    <div
      className={`qv${isOpen ? ' is-open' : ''}`}
      style={{
        opacity: piece ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
      aria-hidden={!isOpen}
      role="dialog"
      aria-modal="true"
      aria-label={garment ? `${garment.name} quick view` : 'Product quick view'}
    >
      {piece && garment && (
        <>
          <div
            className="qv-rod"
            style={{
              left: `${layout.hookX}px`,
              height: `${layout.hookY}px`,
            }}
          />

          <div
            ref={qvImgRef}
            className="qv-img"
            style={{
              left: `${layout.hookX}px`,
              top: `${layout.hookY}px`,
            }}
          >
            <div
              ref={qvFrontFaceRef}
              className="qv-face"
              style={{
                ...frontStyle,
                opacity: view === 'front' ? 1 : 0,
              }}
            />
            <div
              ref={qvBackFaceRef}
              className="qv-face"
              style={{
                ...backStyle,
                opacity: view === 'back' ? 1 : 0,
              }}
            />
          </div>

          <button
            type="button"
            className="qv-close"
            onClick={onClose}
            aria-label="Close quick view"
          >
            <span>Close</span>
            <span aria-hidden="true">×</span>
          </button>

          <div ref={qvInfoRef} className="qv-info">
            <div
              className="qv-item qv-counter"
              style={{ '--j': 0 } as React.CSSProperties}
            >
              {piece.index + 1} / 20
            </div>
            <h2
              className="qv-item qv-name"
              style={{ '--j': 1 } as React.CSSProperties}
            >
              {garment.name}
            </h2>
            <div
              className="qv-item qv-price"
              style={{ '--j': 2 } as React.CSSProperties}
            >
              {formatMoney(garment.price)}
            </div>

            <div
              className="qv-item qv-tabs"
              style={{ '--j': 3 } as React.CSSProperties}
              role="tablist"
              aria-label="Garment view"
            >
              <button
                type="button"
                role="tab"
                aria-selected={view === 'front'}
                className={`qv-tab${view === 'front' ? ' is-active' : ''}`}
                onClick={() => handleSelectView('front')}
              >
                Front
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === 'back'}
                className={`qv-tab${view === 'back' ? ' is-active' : ''}`}
                onClick={() => handleSelectView('back')}
              >
                Back
              </button>
            </div>

            <div
              className="qv-item qv-size-label"
              style={{ '--j': 4 } as React.CSSProperties}
            >
              SIZE
            </div>

            <div
              className="qv-item qv-sizes"
              style={{ '--j': 5 } as React.CSSProperties}
              role="radiogroup"
              aria-label="Select size"
            >
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={size === s}
                  className={`qv-size-btn${size === s ? ' is-selected' : ''}`}
                  onClick={() => onChangeSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={`qv-item qv-add-btn${adding ? ' is-adding' : ''}`}
              style={{ '--j': 6 } as React.CSSProperties}
              disabled={adding}
              onClick={onAddToCart}
            >
              {adding ? (
                <>
                  <span className="qv-spinner" aria-hidden="true" />
                  <span>Adding…</span>
                </>
              ) : (
                'Add to cart'
              )}
            </button>

            <div
              className="qv-item qv-meta"
              style={{ '--j': 7 } as React.CSSProperties}
            >
              <span>{garment.name}</span>
              <button
                type="button"
                className="qv-meta-link"
                onClick={() => setShowProductNote((prev) => !prev)}
              >
                View product page
              </button>
            </div>
            {showProductNote && (
              <div className="qv-product-note">{garment.fabricNote}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
