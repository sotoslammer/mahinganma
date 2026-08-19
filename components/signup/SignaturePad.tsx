"use client";

import { useCallback, useEffect, useRef } from "react";

const PAD_HEIGHT = 200;
const STROKE_COLOR = "#111111";
const STROKE_WIDTH = 2.4;

type Props = {
  /** Hidden input name carrying the PNG data URL to the Server Action. */
  name: string;
  label: string;
  /** Empty string when nothing has been drawn yet. */
  value: string;
  onValueChange: (dataUrl: string) => void;
  hint?: string;
  error?: string;
};

/**
 * Canvas signature capture.
 *
 * Pointer events cover mouse, touch and stylus from one code path. The value is
 * lifted into the parent so a failed submission cannot lose the signature: React 19
 * resets uncontrolled fields after an action runs, which would silently clear a
 * ref-managed hidden input and force the signer to draw again.
 *
 * The canvas is filled white rather than left transparent so the exported PNG stays
 * legible everywhere it is embedded, including the waiver PDF.
 */
export function SignaturePad({ name, label, value, onValueChange, hint, error }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const resetContext = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    // Sizing the backing store by DPR keeps strokes sharp on retina and mobile screens.
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(PAD_HEIGHT * ratio);
    ctx.scale(ratio, ratio);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, PAD_HEIGHT);
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return ctx;
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    resetContext(canvas);
    lastPoint.current = null;
    onValueChange("");
  }, [onValueChange, resetContext]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    resetContext(canvas);

    // Resizing the element clears its bitmap, so a signature cannot survive a width
    // change. Reset deliberately instead of leaving a half-erased mark on record.
    let previousWidth = canvas.clientWidth;
    const observer = new ResizeObserver(() => {
      if (canvas.clientWidth === previousWidth) return;
      previousWidth = canvas.clientWidth;
      clear();
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [clear, resetContext]);

  function pointFrom(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    // Capture keeps the stroke attached to this canvas if the pointer drifts off it.
    canvas.setPointerCapture(event.pointerId);
    drawing.current = true;

    const point = pointFrom(event);
    lastPoint.current = point;
    // A tap with no movement should still leave a mark, so start with a dot.
    ctx.beginPath();
    ctx.arc(point.x, point.y, STROKE_WIDTH / 2, 0, Math.PI * 2);
    ctx.fillStyle = STROKE_COLOR;
    ctx.fill();
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    const from = lastPoint.current;
    if (!ctx || !from) return;

    const to = pointFrom(event);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    lastPoint.current = to;
  }

  function endStroke(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    drawing.current = false;
    lastPoint.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    onValueChange(canvas.toDataURL("image/png"));
  }

  const describedBy = [hint ? `${name}-hint` : null, error ? `${name}-error` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-dim">{label}</span>
        <button
          type="button"
          onClick={clear}
          disabled={!value}
          className="text-xs text-dim underline decoration-dimmer underline-offset-[3px] transition hover:text-[#eaeaea] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear
        </button>
      </div>

      <canvas
        ref={canvasRef}
        // touch-none stops the browser scrolling the page while a finger draws.
        className={`w-full cursor-crosshair touch-none rounded-lg border bg-white ${
          error ? "border-red-500/70" : "border-border-strong/40"
        }`}
        style={{ height: PAD_HEIGHT }}
        role="img"
        aria-label={label}
        aria-describedby={describedBy || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
      />

      {/* Only the image travels; its true dimensions are read back out of the PNG header. */}
      <input type="hidden" name={name} value={value} readOnly />

      {hint && (
        <p id={`${name}-hint`} className="mt-1.5 text-xs text-dimmer">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-xs text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
