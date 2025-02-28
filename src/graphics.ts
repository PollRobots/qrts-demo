import { QRCode } from "qrts";

export interface GraphicsContext {
  fillRect: (x: number, y: number, width: number, height: number) => void;
  circle: (cx: number, cy: number, radius: number) => void;
  key: (key: string, pattern: boolean) => void;

  beginPath: () => void;
  closePath: () => void;
  moveTo: (x: number, y: number) => void;
  lineTo: (x: number, y: number) => void;
  arcTo: (
    srcX: number,
    srcY: number,
    destX: number,
    destY: number,
    radius: number
  ) => void;
  curveTo: (
    cx1: number,
    cy1: number,
    cx2: number,
    cy2: number,
    x: number,
    y: number
  ) => void;
}

export enum Neighbor {
  TL = 0,
  TC = 1,
  TR = 2,
  CL = 3,
  CR = 5,
  BL = 6,
  BC = 7,
  BR = 8,
}

export function rectangles(code: QRCode, ctx: GraphicsContext) {
  for (let row = 0; row < code.size; row++) {
    for (let col = 0; col < code.size; col++) {
      if (code.isDark(row, col)) {
        ctx.key(`${col},${row}`, code.isPatternModule(row, col));
        ctx.fillRect(col, row, 1, 1);
      }
    }
  }
}

export function circles(
  code: QRCode,
  ctx: GraphicsContext,
  radius: number,
  variable: boolean
) {
  for (let row = 0; row < code.size; row++) {
    const rs = Math.sin((2 * (row * Math.PI)) / code.size - Math.PI / 2);
    for (let col = 0; col < code.size; col++) {
      const cs = -1 * Math.sin((3 * col * Math.PI) / code.size);
      if (!code.isDark(row, col)) {
        continue;
      }
      if (code.isPatternModule(row, col)) {
        ctx.key(`${col},${row}`, true);
        ctx.fillRect(col, row, 1, 1);
      } else {
        ctx.key(`${col},${row}`, false);
        ctx.circle(
          col + 0.5,
          row + 0.5,
          radius + (variable ? 0.1 * (rs * cs) : 0)
        );
      }
    }
  }
}

export function connectedCircles(
  code: QRCode,
  ctx: GraphicsContext,
  radius: number
) {
  const theta = Math.atan2(Math.sqrt(radius * radius - 0.25), 0.5);
  const foo = 0.25 * (1 + Math.sin(theta));
  const b_circle = 0.55 * 0.5;

  for (let row = 0; row < code.size; row++) {
    for (let col = 0; col < code.size; col++) {
      if (!code.isDark(row, col)) {
        continue;
      }
      if (code.isPatternModule(row, col)) {
        ctx.key(`${col},${row}`, true);
        ctx.fillRect(col, row, 1, 1);
      } else {
        ctx.key(`${col},${row}`, false);
        // corners:
        // (top-left, but others are reflections)
        // o o    o X    X X    o X    X X    X o    X o    o o
        // o X    o X    o X    X X    X X    o X    X X    X X
        //
        const neighbors = [];
        for (let r = -1; r <= 1; r++) {
          for (let c = -1; c <= 1; c++) {
            neighbors.push(
              !code.isPatternModule(row + r, col + c) &&
                code.isDarkSafe(row + r, col + c)
            );
          }
        }
        const neighborCount = neighbors.reduce(
          (accum, n) => accum + (n ? 1 : 0),
          0
        );
        if (neighborCount === 1) {
          ctx.circle(col + 0.5, row + 0.5, radius);
        } else if (
          neighborCount >= 5 &&
          neighbors[Neighbor.TC] &&
          neighbors[Neighbor.CL] &&
          neighbors[Neighbor.CR] &&
          neighbors[Neighbor.BC]
        ) {
          ctx.fillRect(col, row, 1, 1);
        } else {
          ctx.beginPath();
          ctx.moveTo(
            col - (neighbors[Neighbor.CL] ? 0 : radius - 0.5),
            row + 0.5
          );
          // TOP LEFT
          // o o    o X    X X    o X    X X    X o    X o    o o
          // o C    o C    o C    X C    X C    o C    X C    X C
          if (!neighbors[Neighbor.CL] && !neighbors[Neighbor.TC]) {
            // o o   X o
            // o C   o C
            ctx.arcTo(0, -radius, radius, -radius, radius);
          } else if (neighbors[Neighbor.CL] && neighbors[Neighbor.TC]) {
            // X X    o X
            // X C    X C
            ctx.lineTo(0, -0.5);
            ctx.lineTo(0.5, 0);
          } else if (neighbors[Neighbor.TC]) {
            // o X    X X
            // o C    o C
            if (neighbors[Neighbor.TL]) {
              // X X
              // o C
              ctx.curveTo(0, -b_circle, 0.1, -foo, 0, -0.5);
              ctx.lineTo(radius, 0);
            } else {
              // o X
              // o C
              ctx.curveTo(
                0,
                -b_circle,
                radius - foo,
                -(0.5 - b_circle),
                radius - foo,
                -0.5
              );
              ctx.lineTo(foo, 0);
            }
          } else {
            // X o    o o
            // X C    X C
            if (neighbors[Neighbor.TL]) {
              // X o
              // X C
              ctx.lineTo(0, -radius);
              ctx.curveTo(0.1, 0.1, 0.5 - b_circle, 0, 0.5, 0);
            } else {
              // o o
              // X C
              ctx.lineTo(0, -foo);
              ctx.curveTo(
                b_circle,
                0,
                0.5 - b_circle,
                -(radius - foo),
                0.5,
                -(radius - foo)
              );
            }
          }

          // TOP RIGHT
          // o o    o o    X o    X o    o X    o X   X X    X X
          // C o    C X    C o    C X    C o    C X   C o    C X
          if (!neighbors[Neighbor.TC] && !neighbors[Neighbor.CR]) {
            // arc
            // o o    o X
            // C o    C o
            ctx.arcTo(radius, 0, radius, radius, radius);
          } else if (neighbors[Neighbor.TC] && neighbors[Neighbor.CR]) {
            // square
            // X o    X X
            // C X    C X
            ctx.lineTo(0.5, 0);
            ctx.lineTo(0, 0.5);
          } else if (neighbors[Neighbor.TC]) {
            // X o    X X
            // C o    C o
            if (neighbors[Neighbor.TR]) {
              // X X
              // C o
              ctx.lineTo(radius, 0);
              ctx.curveTo(-0.1, 0.1, 0, 0.5 - b_circle, 0, 0.5);
            } else {
              // X o
              // C o
              ctx.lineTo(foo, 0);
              ctx.curveTo(
                0,
                b_circle,
                radius - foo,
                0.5 - b_circle,
                radius - foo,
                0.5
              );
            }
          } else {
            // o o    o X
            // C X    C X
            if (neighbors[Neighbor.TR]) {
              // o X
              // C X
              ctx.curveTo(b_circle, 0, foo, 0.1, 0.5, 0);
              ctx.lineTo(0, radius);
            } else {
              // o o
              // C X
              ctx.curveTo(
                b_circle,
                0,
                0.5 - b_circle,
                radius - foo,
                0.5,
                radius - foo
              );
              ctx.lineTo(0, foo);
            }
          }

          // BOTTOM RIGHT
          // C o    C X    C o    C X    C o    C X    C o   C X
          // o o    o o    X o    X o    o X    o X    X X   X X
          if (!neighbors[Neighbor.CR] && !neighbors[Neighbor.BC]) {
            // C o    C o
            // o o    o X
            // arc
            ctx.arcTo(0, radius, -radius, radius, radius);
          } else if (neighbors[Neighbor.CR] && neighbors[Neighbor.BC]) {
            // C X    C X
            // X o    X X
            // rect
            ctx.lineTo(0, 0.5);
            ctx.lineTo(-0.5, 0);
          } else if (neighbors[Neighbor.CR]) {
            // C X    C X
            // o o    o X
            if (neighbors[Neighbor.BR]) {
              // C X
              // o X
              ctx.lineTo(0, radius);
              ctx.curveTo(-0.1, -0.1, -(0.5 - b_circle), 0, -0.5, 0);
            } else {
              // C X
              // o o
              ctx.lineTo(0, foo);
              ctx.curveTo(
                -b_circle,
                0,
                -(0.5 - b_circle),
                radius - foo,
                -0.5,
                radius - foo
              );
            }
          } else {
            // C o    C o
            // X o    X X
            if (neighbors[Neighbor.BR]) {
              // C o
              // X X
              ctx.curveTo(0, b_circle, -0.1, foo, 0, 0.5);
              ctx.lineTo(-radius, 0);
            } else {
              // C o
              // X o
              ctx.curveTo(
                0,
                b_circle,
                -(radius - foo),
                0.5 - b_circle,
                -(radius - foo),
                0.5
              );
              ctx.lineTo(-foo, 0);
            }
          }
          // BOTTOM LEFT
          // o C    X C    o C    X C    o C    X C    o C    X C
          // o o    o o    X o    X o    o X    o X    X X    X X
          if (!neighbors[Neighbor.CL] && !neighbors[Neighbor.BC]) {
            // o C    o C
            // o o    X o
            // arc
            ctx.arcTo(-radius, 0, -radius, -radius, radius);
          } else if (neighbors[Neighbor.CL] && neighbors[Neighbor.BC]) {
            // X C    X C
            // o X    X X
            // rect
            ctx.lineTo(-0.5, 0);
            ctx.lineTo(0, -0.5);
          } else if (neighbors[Neighbor.CL]) {
            // X C    X C
            // o o    X o
            if (neighbors[Neighbor.BL]) {
              // X C
              // X o
              ctx.curveTo(-b_circle, 0, -foo, -0.1, -0.5, 0);
              ctx.lineTo(0, -radius);
            } else {
              // X C
              // o o
              ctx.curveTo(
                -b_circle,
                0,
                -(0.5 - b_circle),
                -(radius - foo),
                -0.5,
                -(radius - foo)
              );
              ctx.lineTo(0, -foo);
            }
          } else {
            // o C    o C
            // o X    X X
            if (neighbors[Neighbor.BL]) {
              // o C
              // X X
              ctx.lineTo(-radius, 0);
              ctx.curveTo(0.1, -0.1, 0, -(0.5 - b_circle), 0, -0.5);
            } else {
              // o C
              // o X
              ctx.lineTo(-foo, 0);
              ctx.curveTo(
                0,
                -b_circle,
                -(radius - foo),
                -(0.5 - b_circle),
                -(radius - foo),
                -0.5
              );
            }
          }
          ctx.closePath();
        }
      }
    }
  }
}
