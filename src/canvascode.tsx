import * as React from "react";
import { QRCode } from "qrts";
import { CodeStyle } from "./app";
import {
  circles,
  connectedCircles,
  GraphicsContext,
  Neighbor,
  rectangles,
} from "./graphics";

type Props = {
  code: QRCode;
  size: number | string;
  codeStyle: CodeStyle;
  variable: boolean;
  includeQuietZone: boolean;
  color?: string;
};

export function CanvasCode({
  code,
  size,
  codeStyle,
  variable,
  includeQuietZone,
  color,
}: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const pixelSize = React.useMemo(() => {
    const moduleCount = code.size;
    const allModuleCount = moduleCount + (includeQuietZone ? 8 : 0);
    const pixelSize = allModuleCount * (codeStyle.includes("circle") ? 64 : 8);

    return pixelSize;
  }, [code, includeQuietZone, codeStyle]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d")!;
    renderPixelCode(ctx, code, codeStyle, includeQuietZone, color, variable);
  }, [code, codeStyle, includeQuietZone, color]);

  return (
    <canvas
      ref={canvasRef}
      width={pixelSize}
      height={pixelSize}
      style={{ width: size, height: "auto" }}
    />
  );
}

export function renderPixelCode(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  code: QRCode,
  codeStyle: CodeStyle,
  includeQuietZone: boolean,
  color: string,
  variable: boolean
) {
  const moduleCount = code.size;
  const allModuleCount = moduleCount + (includeQuietZone ? 8 : 0);
  const pixelSize = ctx.canvas.width;
  const moduleSize = pixelSize / allModuleCount;
  const radius = Math.sqrt(1 / Math.PI);

  const offset = includeQuietZone ? 4 : 0;

  ctx.clearRect(0, 0, pixelSize, pixelSize);
  if (!codeStyle.endsWith("transparent")) {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, pixelSize, pixelSize);
  }

  ctx.fillStyle = color;

  const pos = { x: 0, y: 0 };

  const graphicsContext: GraphicsContext = {
    fillRect: function (
      x: number,
      y: number,
      width: number,
      height: number
    ): void {
      ctx.fillRect(
        (offset + x) * moduleSize,
        (offset + y) * moduleSize,
        width * moduleSize,
        height * moduleSize
      );
    },
    circle: function (cx: number, cy: number, radius: number): void {
      ctx.beginPath();
      ctx.arc(
        (offset + cx) * moduleSize,
        (offset + cy) * moduleSize,
        radius * moduleSize,
        0,
        2 * Math.PI,
        false
      );
      ctx.fill();
    },
    key: () => {},
    beginPath: function (): void {
      pos.x = 0;
      pos.y = 0;
      ctx.beginPath();
    },
    closePath: function (): void {
      ctx.closePath();
      ctx.fill();
    },
    moveTo: function (x: number, y: number): void {
      pos.x = (offset + x) * moduleSize;
      pos.y = (offset + y) * moduleSize;
      ctx.moveTo(pos.x, pos.y);
    },
    lineTo: function (x: number, y: number): void {
      pos.x += x * moduleSize;
      pos.y += y * moduleSize;
      ctx.lineTo(pos.x, pos.y);
    },
    arcTo: function (
      srcX: number,
      srcY: number,
      destX: number,
      destY: number,
      radius: number
    ): void {
      const sx = pos.x + srcX * moduleSize;
      const sy = pos.y + srcY * moduleSize;
      pos.x += destX * moduleSize;
      pos.y += destY * moduleSize;
      ctx.arcTo(sx, sy, pos.x, pos.y, radius * moduleSize);
    },
    curveTo: function (
      cx1: number,
      cy1: number,
      cx2: number,
      cy2: number,
      x: number,
      y: number
    ): void {
      const px1 = pos.x + cx1 * moduleSize;
      const py1 = pos.y + cy1 * moduleSize;
      const px2 = pos.x + cx2 * moduleSize;
      const py2 = pos.y + cy2 * moduleSize;
      pos.x += x * moduleSize;
      pos.y += y * moduleSize;
      ctx.bezierCurveTo(px1, py1, px2, py2, pos.x, pos.y);
    },
  };

  switch (codeStyle) {
    case "normal": // fallthrough
    case "transparent":
      rectangles(code, graphicsContext);
      break;
    case "circles": // fallthrough
    case "circles-transparent":
      circles(code, graphicsContext, 0.5, variable);
      break;
    case "circles-overlapped": // fallthrough
    case "circles-overlapped-transparent":
      circles(code, graphicsContext, radius, variable);
      break;
    case "connected-circles":
    case "connected-circles-transparent":
      connectedCircles(code, graphicsContext, radius);
  }
}
