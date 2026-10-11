// Sample-provider photography from Unsplash's CDN, cropped around the face by
// imgix, and always served through our own image endpoint (selfHosted): a
// visitor's browser never contacts a third-party host, so their IP address
// isn't shared with it (the reasoning behind the Munich Google Fonts ruling,
// LG München I, 3 O 17493/20). The CSP's img-src enforces it. One entry per sample provider
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

/** Face-centred crop at the given size (px), for next/image's <Image>,
 *  which already serves it through /_next/image. `ratio` is width / height. */
export function providerPhotoSource(who: ProviderKey, width: number, ratio = 4 / 5) {
  const height = Math.round(width / ratio);
  return `${base[who]}?auto=format&fit=crop&crop=faces&w=${width}&h=${height}&q=80`;
}

/** The same crop for a plain <img>, through our own image endpoint. */
export function providerPhoto(who: ProviderKey, width: number, ratio = 4 / 5) {
  return selfHosted(providerPhotoSource(who, width, ratio), width);
}

/** Widths /_next/image accepts (Next's default deviceSizes + imageSizes). */
const WIDTHS = [32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];

/** An image from another host (allowed in next.config.ts remotePatterns),
 *  fetched by our server and served from ours. Local paths pass through. */
export function selfHosted(url: string, width = 640) {
  if (!/^https?:\/\//.test(url)) return url;
  const w = WIDTHS.find((x) => x >= width) ?? WIDTHS.at(-1)!;
  return `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=75`;
}
