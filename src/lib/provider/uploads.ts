// Upload rules shared by the browser (pre-checks) and /api/uploads (enforcement).
// License documents: PDF, JPG or PNG up to 4 MB. Figma P6 says "Max 10MB", but
// files reach /api/uploads as the request body, and Vercel Functions refuse
// bodies over 4.5 MB (owner's call, 2026-10-30). Photo limits aren't in Figma;
// JPG, PNG or WebP up to 5 MB, the same for the optional banner: both are
// cropped to a small WebP in the browser before upload, so they stay well under.
export const UPLOAD_RULES = {
  photo: { types: ["image/jpeg", "image/png", "image/webp"], maxBytes: 5 * 1024 * 1024 },
  banner: { types: ["image/jpeg", "image/png", "image/webp"], maxBytes: 5 * 1024 * 1024 },
  license: { types: ["application/pdf", "image/jpeg", "image/png"], maxBytes: 4 * 1024 * 1024 },
} as const;

export type UploadKind = keyof typeof UPLOAD_RULES;

/** A limit as people read it: "4 MB". */
export const sizeLabel = (bytes: number) => `${bytes / 1024 / 1024} MB`;
