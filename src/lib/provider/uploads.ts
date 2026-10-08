// Upload rules shared by the browser (pre-checks) and /api/uploads (enforcement).
// Figma P6: license documents "PDF, JPG or PNG · Max 10MB". Photo limits aren't
// in Figma; JPG, PNG or WebP up to 5 MB.
export const UPLOAD_RULES = {
  photo: { types: ["image/jpeg", "image/png", "image/webp"], maxBytes: 5 * 1024 * 1024 },
  license: { types: ["application/pdf", "image/jpeg", "image/png"], maxBytes: 10 * 1024 * 1024 },
} as const;

export type UploadKind = keyof typeof UPLOAD_RULES;
