"use client";

import { LoaderCircleIcon, ZoomInIcon, ZoomOutIcon } from "@/components/ui/hugeicons";
import { useEffect, useId, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

/** Longest side of the uploaded photo; the profile never shows it larger. */
const MAX_SIDE = 800;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode"));
    img.src = src;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Draws the chosen square onto a canvas (at most 800×800) and encodes it as
 *  WebP, or JPEG where the browser can't encode WebP. */
async function cropToFile(src: string, area: Area, originalName: string): Promise<File> {
  const img = await loadImage(src);
  const side = Math.max(1, Math.min(MAX_SIDE, Math.round(area.width)));
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  // White under transparent PNGs, so JPEG output doesn't turn them black.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, side, side);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, side, side);

  let blob = await toBlob(canvas, "image/webp", 0.9);
  if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", 0.9);
  if (!blob) throw new Error("encode");
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const base = originalName.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${base}.${ext}`, { type: blob.type });
}

// Opens when a provider picks a profile picture: drag (or arrow keys) to
// reposition, zoom with the slider, and "Use photo" uploads the cropped square.
// The crop frame has the profile avatar's rounded corners (rounded-4xl).
// TODO(client): title, description, error and button copy.
export function PhotoCropDialog({
  file,
  onCancel,
  onConfirm,
}: {
  /** The picked file; the dialog is open while it's set. */
  file: File | null;
  onCancel: () => void;
  onConfirm: (cropped: File) => void;
}) {
  const descriptionId = useId();
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A reset crop for each picked file, then read it in (a data: URL, so
  // nothing needs revoking).
  const [seenFile, setSeenFile] = useState<File | null>(null);
  if (seenFile !== file) {
    setSeenFile(file);
    setSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(MIN_ZOOM);
    setArea(null);
    setBusy(false);
    setError(null);
  }
  useEffect(() => {
    if (!file) return;
    let live = true;
    const reader = new FileReader();
    reader.onload = () => live && setSrc(reader.result as string);
    reader.onerror = () => live && setError("We couldn't open that picture. Try a different file.");
    reader.readAsDataURL(file);
    return () => {
      live = false;
      reader.abort();
    };
  }, [file]);

  const confirm = async () => {
    if (!file || !src || !area) return;
    setBusy(true);
    try {
      onConfirm(await cropToFile(src, area, file.name));
    } catch {
      setError("We couldn't crop that picture. Try a different file.");
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && !busy && onCancel()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-warm-950/35 backdrop-blur-md motion-reduce:animate-none"
        className="app-ui gap-5 p-5 motion-reduce:animate-none sm:max-w-md sm:p-6"
        onEscapeKeyDown={(e) => busy && e.preventDefault()}
      >
        <DialogHeader className="text-left">
          <DialogTitle className="type-ui-heading text-warm-900">Crop your picture</DialogTitle>
          <DialogDescription id={descriptionId} className="type-ui-caption text-warm-500">
            Drag or use the arrow keys to reposition, and zoom with the slider.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-4/3 w-full overflow-hidden rounded-field bg-warm-900">
          {src && !error && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              aspect={1}
              cropShape="rect"
              objectFit="cover"
              showGrid={false}
              keyboardStep={10}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setArea(pixels)}
              classes={{ cropAreaClassName: "rounded-4xl outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" }}
              mediaProps={{ alt: "", onError: () => setError("We couldn't open that picture. Try a different file.") } as React.ImgHTMLAttributes<HTMLElement>}
              cropperProps={{ role: "group", "aria-label": "Crop area", "aria-describedby": descriptionId }}
            />
          )}
          {!src && !error && (
            <span className="absolute inset-0 flex items-center justify-center text-warm-300">
              <LoaderCircleIcon aria-hidden className="size-5 animate-spin motion-reduce:animate-none" />
            </span>
          )}
          {error && (
            <p role="alert" className="absolute inset-0 flex items-center justify-center p-6 text-center type-small text-warm-100">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ZoomOutIcon aria-hidden className="size-4 shrink-0 text-warm-500" />
          <Slider
            aria-label="Zoom"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.05}
            value={[zoom]}
            onValueChange={([z]) => setZoom(z)}
            disabled={!src || !!error || busy}
          />
          <ZoomInIcon aria-hidden className="size-4 shrink-0 text-warm-500" />
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" className="shadow-none" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={confirm} disabled={!area || !!error || busy} aria-busy={busy || undefined}>
            {busy && <LoaderCircleIcon aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />}
            Use photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
