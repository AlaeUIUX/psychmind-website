// Single-stroke script letters for the founders' signatures, from EMS Allure
// (Sheldon B. Michaels, after Rob Leuschke's Allura; SVG conversion by Windell
// H. Oskay; SIL Open Font License, http://scripts.sil.org/OFL). Each letter is
// one pen stroke, so a signature can be drawn the way a pen signs it, letter
// after letter. Font units: 1000 to the em, y up, as in the font.

type Glyph = { adv: number; d: string };

const GLYPHS: Record<string, Glyph> = {
  B: {
    adv: 860,
    d: "M 94.5 328 L 22 369 L 3.15 419 L 25.2 510 L 117 583 L 328 680 L 548 712 L 696 709 L 781 677 L 819 627 L 816 561 L 788 520 L 737 479 L 598 435 L 529 425 L 469 416 L 428 410 L 542 324 L 633 246 L 668 158 L 652 72.4 L 605 12.6 L 532 -37.8 L 438 -44.1 L 375 -44.1 L 318 -25.2 L 290 31.5 L 277 81.9 L 208 31.5 L 161 0 L 148 25.2 L 186 148 L 324 406 L 372 510 L 419 561 L 479 573 L 517 570",
  },
  D: {
    adv: 1033.2,
    d: "M 652 554 L 545 507 L 472 403 L 454 334 L 387 186 L 350 107 L 302 9.45 L 265 -44.1 L 236 -37.8 L 205 31.5 L 202 113 L 214 208 L 233 145 L 375 34.6 L 510 -9.45 L 728 25.2 L 863 113 L 976 220 L 1033.2 372 L 1020.6 532 L 951 627 L 828 680 L 608 706 L 413 671 L 261 614 L 154 548 L 94.5 460 L 85 384 L 126 321 L 189 293",
  },
  a: {
    adv: 526,
    d: "M 495 183 L 457 132 L 406 78.8 L 331 31.5 L 271 18.9 L 243 63 L 255 142 L 296 274 L 277 243 L 176 145 L 69.3 56.7 L -18.9 18.9 L -63 66.1 L -56.7 154 L 34.6 261 L 148 331 L 230 356 L 312 356 L 324 343",
  },
  d: {
    adv: 381,
    d: "M 328 312 L 302 356 L 258 369 L 151 334 L 47.2 265 L -37.8 176 L -63 107 L -56.7 50.4 L 12.6 15.8 L 78.8 63 L 176 148 L 277 252 L 387 334 L 532 457 L 668 592 L 693 668 L 690 709 L 639 721 L 561 684 L 510 633 L 441 523 L 387 425 L 293 217 L 246 66.1 L 233 -44.1 L 258 -97.6 L 302 -113 L 340 -101",
  },
  e: {
    adv: 346,
    d: "M 66.1 170 L 148 211 L 217 249 L 252 306 L 239 350 L 180 356 L 63 287 L 15.8 252 L -34.6 192 L -66.1 139 L -72.4 88.2 L -50.4 44.1 L 31.5 9.45 L 170 44.1 L 214 81.9 L 277 135 L 315 183",
  },
  n: {
    adv: 580,
    d: "M 148 328 L 41 25.2 L 183 186 L 271 280 L 334 318 L 381 337 L 394 312 L 331 195 L 290 101 L 293 47.2 L 328 15.8 L 387 25.2 L 450 69.3 L 513 132 L 548 183",
  },
  r: {
    adv: 369,
    d: "M -31.5 183 L 34.6 287 L 154 463 L 47.2 391 L 47.2 365 L 59.9 356 L 258 353 L 145 214 L 81.9 101 L 97.6 22 L 186 28.4 L 296 132 L 337 183",
  },
};

/** The ascender and descender lines the letters stay between (font units, y up). */
export const SIGN_TOP = 730;
export const SIGN_BOTTOM = -130;

/** A name as one path per letter, laid out along the baseline; and its width. */
export function signature(name: string) {
  let x = 0;
  const letters = [...name].map((ch) => {
    const g = GLYPHS[ch];
    if (!g) throw new Error(`No signature glyph for "${ch}"`);
    const at = x;
    x += g.adv;
    return { d: g.d, x: at };
  });
  return { letters, width: x };
}
