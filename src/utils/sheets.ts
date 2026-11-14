import { SHEET_URLS, SheetView } from '../data/catalog';

const sheetCache: Partial<Record<SheetView, Promise<void>>> = {};
const sheetLoaded: Record<SheetView, boolean> = {
  side: false,
  front: false,
  back: false,
};

function loadSheet(view: SheetView): Promise<void> {
  if (sheetCache[view]) return sheetCache[view]!;

  const promise = new Promise<void>((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.crossOrigin = 'anonymous';
    const done = () => {
      sheetLoaded[view] = true;
      resolve();
    };
    img.onload = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(done, done);
      } else {
        done();
      }
    };
    img.onerror = done;
    img.src = SHEET_URLS[view];
  });

  sheetCache[view] = promise;
  return promise;
}

export function preloadAllSheets(): Record<SheetView, Promise<void>> {
  return {
    side: loadSheet('side'),
    front: loadSheet('front'),
    back: loadSheet('back'),
  };
}

export function isSheetLoaded(view: SheetView): boolean {
  return sheetLoaded[view];
}

export function waitForSheet(view: SheetView): Promise<void> {
  return loadSheet(view);
}
