import { ErrorCorrectLevel, generate } from "@pollrobots/qrts";
import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { RenderMode } from "./app";
import { renderPixelCode, CanvasCode } from "./canvascode";
import { SvgCode } from "./svgcode";
import { CodeStyle } from "./graphics";

export function AppCore() {
  const [content, setContent] = React.useState("https://pollrobots.com");
  const [ecl, setEcl] = React.useState(ErrorCorrectLevel.Low);
  const [codeStyle, setCodeStyle] = React.useState<CodeStyle>("normal");
  const [variable, setVariable] = React.useState(false);
  const [includeQuietZone, setIncludeQuietZone] = React.useState(true);
  const [color, setColor] = React.useState("#000000");
  const [renderMode, setRenderMode] = React.useState<RenderMode>("svg");
  const [dataUrl, setDataUrl] = React.useState("");
  const code = React.useMemo(
    () => generate(content || "", { errorCorrectLevel: ecl }),
    [content, ecl]
  );

  const modeId = React.useId();
  const styleId = React.useId();
  const quietZoneId = React.useId();
  const colorId = React.useId();
  const renderModeId = React.useId();
  const variableId = React.useId();

  const generateFile = React.useCallback(() => {
    switch (renderMode) {
      case "svg": {
        const size = 8 * (code.size + (includeQuietZone ? 8 : 0));
        const div = document.createElement("div");
        const root = createRoot(div);
        flushSync(() => {
          root.render(
            <SvgCode
              code={code}
              size={size}
              codeStyle={codeStyle}
              color={color}
              includeQuietZone={includeQuietZone}
              variable={variable}
            />
          );
        });
        const src = div.innerHTML.replace(
          "<svg",
          '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"'
        );
        return Promise.resolve(src);
      }
      case "canvas": {
        const size =
          (codeStyle.includes("circle") ? 64 : 8) *
          (code.size + (includeQuietZone ? 8 : 0));
        const canvas = new OffscreenCanvas(size, size);
        const ctx = canvas.getContext("2d")!;
        renderPixelCode(
          ctx,
          code,
          codeStyle,
          includeQuietZone,
          color,
          variable
        );
        return canvas.convertToBlob({ type: "image/png" });
      }
      case "data-url": {
        const canvas = document.createElement("canvas");
        canvas.setAttribute("width", code.size.toString());
        canvas.setAttribute("height", code.size.toString());
        const ctx = canvas.getContext("2d")!;
        renderPixelCode(ctx, code, "normal", false, color, false);
        const data = canvas.toDataURL("image/png");
        setDataUrl(data);
        return Promise.resolve(data);
      }
    }
  }, [code, codeStyle, color, includeQuietZone, renderMode, variable]);

  const download = React.useCallback(async () => {
    const handle = await window.showSaveFilePicker(
      renderMode === "svg"
        ? {
            suggestedName: "qrcode.svg",
            types: [
              {
                description: "SVG file",
                accept: { "image/svg+xml": [".svg"] },
              },
            ],
          }
        : {
            suggestedName: "qrcode.png",
            types: [
              {
                description: "PNG file",
                accept: { "image/png": [".png"] },
              },
            ],
          }
    );

    const writable = await handle.createWritable();
    await writable.write(await generateFile());
    writable.close();
  }, [generateFile, renderMode]);

  React.useEffect(() => {
    if (renderMode === "data-url") {
      generateFile();
    }
  }, [code, color, generateFile, renderMode]);

  return (
    <>
      <input
        type="text"
        placeholder="content"
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.25rem",
        }}
      >
        <label htmlFor={modeId}>Mode:</label>
        <select
          style={{ marginRight: "0.5rem" }}
          id={modeId}
          value={ecl}
          onChange={(event) => {
            const level = Number(event.target.value);
            if ([0, 1, 2, 3].includes(level)) {
              setEcl(level as 0 | 1 | 2 | 3);
            }
          }}
        >
          <option value={ErrorCorrectLevel.Low}>Low &mdash; 7%</option>
          <option value={ErrorCorrectLevel.Medium}>Medium &mdash; 15%</option>
          <option value={ErrorCorrectLevel.Quartile}>
            Quartile &mdash; 25%
          </option>
          <option value={ErrorCorrectLevel.High}>High &mdash; 30%</option>
        </select>
        <label htmlFor={styleId}>Style:</label>
        <select
          id={styleId}
          style={{ marginRight: "0.5rem" }}
          value={codeStyle}
          disabled={renderMode === "data-url"}
          onChange={(event) => {
            setCodeStyle(event.target.value as CodeStyle);
          }}
        >
          <option value={"normal"}>Normal</option>
          <option value={"transparent"}>Transparent</option>
          <option value={"circles"}>Circles</option>
          <option value={"circles-transparent"}>Circles (transparent)</option>
          <option value={"circles-overlapped"}>Overlapped circles</option>
          <option value={"circles-overlapped-transparent"}>
            Overlapped circles (transparent)
          </option>
          <option value={"connected-circles"}>Connected circles</option>
          <option value={"connected-circles-transparent"}>
            Connected circles (transparent)
          </option>
        </select>
        {codeStyle.startsWith("circles") && (
          <>
            <label htmlFor={variableId}>Variable size:</label>
            <input
              id={variableId}
              style={{ marginRight: "0.5rem" }}
              type="checkbox"
              checked={variable}
              onChange={() => setVariable(!variable)}
            />
          </>
        )}
        <label htmlFor={quietZoneId}>Include quiet zone:</label>
        <input
          id={quietZoneId}
          style={{ marginRight: "0.5rem" }}
          type="checkbox"
          checked={includeQuietZone}
          onChange={() => setIncludeQuietZone(!includeQuietZone)}
        />
        <label htmlFor={colorId}>Color</label>
        <input
          id={colorId}
          style={{ marginRight: "0.5rem" }}
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
        />
        <label htmlFor={renderModeId}>Format</label>
        <select
          id={renderModeId}
          style={{ marginRight: "0.5rem" }}
          value={renderMode}
          onChange={(event) => setRenderMode(event.target.value as RenderMode)}
        >
          <option value={"svg"}>SVG</option>
          <option value={"canvas"}>PNG</option>
          <option value={"data-url"}>data url</option>
        </select>
        {renderMode !== "data-url" && (
          <button
            style={{ padding: "0.25rem 1rem", marginLeft: "auto" }}
            onClick={() => download()}
          >
            Download
          </button>
        )}
      </div>
      {renderMode === "data-url" && <input readOnly value={dataUrl} />}
      <div style={{ padding: "1rem", background: "#eee" }}>
        {code &&
          (renderMode === "svg" ? (
            <SvgCode
              code={code}
              size="min(90vw, 70vh)"
              codeStyle={codeStyle}
              variable={variable}
              includeQuietZone={includeQuietZone}
              color={color}
            />
          ) : (
            <CanvasCode
              code={code}
              size="min(90vw, 70vh)"
              {...(renderMode === "data-url"
                ? {
                    codeStyle: "normal",
                    variable: false,
                    includeQuietZone: false,
                  }
                : {
                    codeStyle,
                    variable,
                    includeQuietZone,
                  })}
              color={color}
            />
          ))}
      </div>
    </>
  );
}
