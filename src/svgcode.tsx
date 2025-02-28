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

const CIRCLE_RADIUS = Math.sqrt(1 / Math.PI);

export function SvgCode({
  code,
  size,
  codeStyle,
  variable,
  includeQuietZone,
  color,
}: Props) {
  const { rows, moduleCount, patterns } = React.useMemo(() => {
    const elements: React.ReactNode[] = [];
    const patterns: React.ReactNode[] = [];
    const context = { key: "", target: [] as React.ReactNode[], path: "" };

    const graphicContext: GraphicsContext = {
      fillRect: function (
        x: number,
        y: number,
        width: number,
        height: number
      ): void {
        context.target.push(
          <rect key={context.key} x={x} y={y} width={width} height={height} />
        );
      },
      circle: function (cx: number, cy: number, radius: number): void {
        context.target.push(
          <circle key={context.key} cx={cx} cy={cy} r={radius} />
        );
      },
      key: function (key: string, pattern: boolean): void {
        context.key = key;
        context.target = pattern ? patterns : elements;
      },
      beginPath: function (): void {
        context.path = "";
      },
      closePath: function (): void {
        context.path += " Z";
        context.target.push(<path key={context.key} d={context.path} />);
        context.path = "";
      },
      moveTo: function (x: number, y: number): void {
        context.path += `M ${x},${y}`;
      },
      lineTo: function (x: number, y: number): void {
        if (x == 0) {
          context.path += ` v ${y}`;
        } else if (y == 0) {
          context.path += ` h ${x}`;
        } else {
          context.path += ` l ${x},${y}`;
        }
      },
      arcTo: function (
        srcX: number,
        srcY: number,
        destX: number,
        destY: number,
        radius: number
      ): void {
        context.path += ` a ${radius},${radius} 0 0 1 ${destX} ${destY}`;
      },
      curveTo: function (
        cx1: number,
        cy1: number,
        cx2: number,
        cy2: number,
        x: number,
        y: number
      ): void {
        context.path += ` c ${cx1},${cy1} ${cx2},${cy2} ${x},${y}`;
      },
    };

    switch (codeStyle) {
      case "normal": // fallthrough
      case "transparent":
        rectangles(code, graphicContext);
        break;
      case "circles": // fallthrough
      case "circles-transparent":
        circles(code, graphicContext, 0.5, variable);
        break;
      case "circles-overlapped": // fallthrough
      case "circles-overlapped-transparent":
        circles(code, graphicContext, Math.sqrt(1 / Math.PI), variable);
        break;
      case "connected-circles": // fallthrough
      case "connected-circles-transparent":
        connectedCircles(code, graphicContext, Math.sqrt(1 / Math.PI));
        break;
    }
    return { rows: elements, moduleCount: code.size, patterns };
  }, [code, codeStyle, variable]);
  return (
    <svg
      width={size}
      height={size}
      viewBox={
        includeQuietZone
          ? `-4 -4 ${moduleCount + 8} ${moduleCount + 8}`
          : `0 0 ${moduleCount} ${moduleCount}`
      }
    >
      {!codeStyle.endsWith("transparent") && (
        <rect
          {...(includeQuietZone
            ? { x: -4, y: -4, width: moduleCount + 8, height: moduleCount + 8 }
            : { x: 0, y: 0, width: moduleCount, height: moduleCount })}
          fill="#fff"
          stroke="none"
        />
      )}
      <g fill={color || "currentColor"} stroke="none">
        <g
          shapeRendering={
            !codeStyle.startsWith("circles") ? "crispEdges" : undefined
          }
        >
          {rows}
        </g>
        <g shapeRendering="crispEdges">{patterns}</g>
      </g>
    </svg>
  );
}
