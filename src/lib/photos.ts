// Sample-provider photography, hotlinked from Unsplash's CDN (as Unsplash
// asks) and cropped around the face by imgix. One entry per sample provider
// so the same person appears everywhere they're shown.
// All three are free-license Unsplash photos (not Unsplash+):
//   Sara Oliisi      — Carlos Sabillon   https://unsplash.com/photos/1Fkfk-HU0kw
//   Shatiria Johnson — Christina @ wocintechchat.com   https://unsplash.com/photos/S3GrMiUhpNU
//   Monica Rios      — Compagnons        https://unsplash.com/photos/jzz_3jWMzHA
// TODO(client): replace with real, consented provider photos before launch.

const base = {
  sara: "https://images.unsplash.com/photo-1734365294784-00255163b97d",
  shatiria: "https://images.unsplash.com/photo-1573497019418-b400bb3ab074",
  monica: "https://images.unsplash.com/photo-1607746882042-944635dfe10e",
} as const;

export type ProviderKey = keyof typeof base;

/** Face-centred crop at the given size (px). `ratio` is width / height. */
export function providerPhoto(who: ProviderKey, width: number, ratio = 4 / 5) {
  const height = Math.round(width / ratio);
  return `${base[who]}?auto=format&fit=crop&crop=faces&w=${width}&h=${height}&q=80`;
}
