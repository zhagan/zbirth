import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ControlDef, SkinConfig } from "../types";
import { loadImagesByKey } from "../assetLoader";
import { renderSkin } from "../renderer";
import { useRbmMod } from "../../rbm/useRbmMod";

const PANEL_STYLE: React.CSSProperties = {
  width: 320,
  padding: 12,
  borderLeft: "1px solid #e0e0e0",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 12,
  background: "#fafafa",
};

const CANVAS_WRAP_STYLE: React.CSSProperties = {
  flex: 1,
  padding: 12,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
};

const ROOT_STYLE: React.CSSProperties = {
  display: "flex",
  minHeight: "100vh",
  color: "#222",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  marginTop: 4,
  marginBottom: 8,
  padding: "4px 6px",
  fontFamily: "inherit",
  fontSize: 12,
};

const BUTTON_STYLE: React.CSSProperties = {
  marginTop: 8,
  padding: "6px 10px",
  fontSize: 12,
};

const LIST_BUTTON_STYLE: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: "4px 6px",
  marginBottom: 4,
  fontSize: 12,
};

export function CanvasSkinEditor({ skinName }: { skinName: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [skinConfig, setSkinConfig] = useState<SkinConfig | null>(null);
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showBackground, setShowBackground] = useState(true);
  const [renameValue, setRenameValue] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const modInputRef = useRef<HTMLInputElement | null>(null);

  const { loadRbmFile, bundle, images: rbmImages, missing } = useRbmMod({
    skinJson: skinConfig ?? undefined,
  });

  const skinConfigRef = useRef<SkinConfig | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const needsRenderRef = useRef(true);
  const draggingRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    skinConfigRef.current = skinConfig;
    if (skinConfig) {
      needsRenderRef.current = true;
    }
  }, [skinConfig]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
    needsRenderRef.current = true;
  }, [selectedId]);

  useEffect(() => {
    let cancelled = false;
    async function loadSkin() {
      const res = await fetch(`/skins/${skinName}/skin.json`);
      if (!res.ok) {
        throw new Error(`Failed to load skin.json for ${skinName}`);
      }
      const data: SkinConfig = await res.json();
      if (!cancelled) {
        setSkinConfig(data);
      }
    }

    loadSkin().catch((err) => console.error(err));

    return () => {
      cancelled = true;
    };
  }, [skinName]);

  useEffect(() => {
    if (!skinConfig) return;
    const base = `/skins/${skinName}/`;
    const sources: Record<string, string> = {};

    if (skinConfig.canvas.background) {
      sources[skinConfig.canvas.background] = `${base}${skinConfig.canvas.background}`;
    }

    for (const sprite of Object.values(skinConfig.sprites)) {
      if (!sources[sprite.image]) {
        sources[sprite.image] = `${base}${sprite.image}`;
      }
    }

    loadImagesByKey(sources)
      .then((imgs) => {
        setImages(imgs);
        needsRenderRef.current = true;
      })
      .catch((err) => console.error(err));
  }, [skinConfig, skinName]);

  useEffect(() => {
    let rafId = 0;
    const draw = () => {
      const shouldRender = needsRenderRef.current || Boolean(draggingRef.current);
      if (shouldRender) {
        const canvas = canvasRef.current;
        const config = skinConfigRef.current;
        if (canvas && config) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            if (canvas.width !== config.canvas.width) canvas.width = config.canvas.width;
            if (canvas.height !== config.canvas.height) canvas.height = config.canvas.height;

            const renderConfig =
              showBackground || !config.canvas.background
                ? config
                : {
                    ...config,
                    canvas: { ...config.canvas, background: undefined },
                  };
            const effectiveImages = { ...images, ...rbmImages };
            renderSkin(ctx, renderConfig, effectiveImages, { smoothing: false });

            const selected = selectedIdRef.current;
            if (selected) {
              const control = config.controls.find((c) => c.id === selected);
              if (control) {
                const scale = control.scale ?? 1;
                ctx.save();
                ctx.strokeStyle = "#ff5f1f";
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 3]);
                ctx.strokeRect(
                  control.x,
                  control.y,
                  control.w * scale,
                  control.h * scale
                );
                ctx.restore();
              }
            }
          }
        }
        needsRenderRef.current = false;
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [images, rbmImages, showBackground]);

  useEffect(() => {
    needsRenderRef.current = true;
  }, [rbmImages]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const selected = selectedIdRef.current;
      if (!selected) return;

      const step = event.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;

      if (event.key === "ArrowUp") dy = -step;
      if (event.key === "ArrowDown") dy = step;
      if (event.key === "ArrowLeft") dx = -step;
      if (event.key === "ArrowRight") dx = step;

      if (dx === 0 && dy === 0) return;
      event.preventDefault();

      setSkinConfig((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          controls: prev.controls.map((control) =>
            control.id === selected
              ? { ...control, x: control.x + dx, y: control.y + dy }
              : control
          ),
        };
      });
      needsRenderRef.current = true;
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const selectedControl = useMemo(() => {
    if (!skinConfig || !selectedId) return null;
    return skinConfig.controls.find((control) => control.id === selectedId) ?? null;
  }, [skinConfig, selectedId]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!skinConfig) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const hit = [...skinConfig.controls]
      .reverse()
      .find((control) => {
        const scale = control.scale ?? 1;
        const w = control.w * scale;
        const h = control.h * scale;
        return x >= control.x && x <= control.x + w && y >= control.y && y <= control.y + h;
      });

    if (hit) {
      setSelectedId(hit.id);
      draggingRef.current = { id: hit.id, offsetX: x - hit.x, offsetY: y - hit.y };
      event.currentTarget.setPointerCapture(event.pointerId);
      needsRenderRef.current = true;
    } else {
      setSelectedId(null);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = draggingRef.current;
    if (!drag) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setSkinConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        controls: prev.controls.map((control) =>
          control.id === drag.id
            ? { ...control, x: Math.round(x - drag.offsetX), y: Math.round(y - drag.offsetY) }
            : control
        ),
      };
    });
    needsRenderRef.current = true;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingRef.current) {
      draggingRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
      needsRenderRef.current = true;
    }
  };

  const updateSelectedControl = (partial: Partial<ControlDef>) => {
    const selected = selectedIdRef.current;
    if (!selected) return;

    setSkinConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        controls: prev.controls.map((control) =>
          control.id === selected ? { ...control, ...partial } : control
        ),
      };
    });
    needsRenderRef.current = true;
  };

  const commitSelectedId = (nextId: string) => {
    const selected = selectedIdRef.current;
    const config = skinConfigRef.current;
    const trimmed = nextId.trim();
    if (!selected || !config) return false;
    if (!trimmed || trimmed === selected) return false;
    if (config.controls.some((control) => control.id === trimmed)) return false;

    setSkinConfig({
      ...config,
      controls: config.controls.map((control) =>
        control.id === selected ? { ...control, id: trimmed } : control
      ),
    });
    setSelectedId(trimmed);
    needsRenderRef.current = true;
    return true;
  };

  const handleExport = async () => {
    if (!skinConfigRef.current) return;
    const json = JSON.stringify(skinConfigRef.current, null, 2);
    try {
      await navigator.clipboard.writeText(json);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = () => {
    const selected = selectedIdRef.current;
    const config = skinConfigRef.current;
    if (!selected || !config) return;
    const original = config.controls.find((control) => control.id === selected);
    if (!original) return;

    const candidate = `${original.id}_`;
    let index = 1;
    const existing = new Set(config.controls.map((control) => control.id));
    while (existing.has(`${candidate}${index}`)) {
      index += 1;
    }
    const nextId = `${candidate}${index}`;

    const duplicated = { ...original, id: nextId, x: original.x + 10, y: original.y + 10 };
    setSkinConfig((prev) => (prev ? { ...prev, controls: [...prev.controls, duplicated] } : prev));
    setSelectedId(nextId);
    needsRenderRef.current = true;
  };

  const handleModDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      loadRbmFile(file).catch((err) => console.error(err));
    }
  };

  const handleModSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      loadRbmFile(file).catch((err) => console.error(err));
    }
    if (event.target) {
      event.target.value = "";
    }
  };

  if (!skinConfig) {
    return <div style={{ padding: 16 }}>Loading skin...</div>;
  }

  return (
    <div style={ROOT_STYLE}>
      <div style={CANVAS_WRAP_STYLE}>
        <canvas
          ref={canvasRef}
          width={skinConfig.canvas.width}
          height={skinConfig.canvas.height}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            border: "1px solid #ddd",
            background: "#111",
            touchAction: "none",
          }}
        />
      </div>
      <aside style={PANEL_STYLE}>
        <label style={{ display: "block", marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={showBackground}
            onChange={(e) => setShowBackground(e.target.checked)}
            style={{ marginRight: 6 }}
          />
          Show Background
        </label>
        <div
          onDrop={handleModDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => modInputRef.current?.click()}
          style={{
            marginBottom: 12,
            padding: 10,
            border: "1px dashed #bbb",
            borderRadius: 6,
            textAlign: "center",
            cursor: "pointer",
            background: "#fff",
          }}
        >
          Drop or click to load .rbm
          <input
            type="file"
            accept=".rbm"
            ref={modInputRef}
            onChange={handleModSelect}
            style={{ display: "none" }}
          />
        </div>
        {bundle && (
          <div style={{ marginBottom: 6, fontSize: 11, color: "#555" }}>
            Entries: {bundle.entries.size}
          </div>
        )}
        {missing.length > 0 && (
          <div style={{ marginBottom: 8, fontSize: 11, color: "#c00" }}>
            Missing: {missing.join(", ")}
          </div>
        )}
        <div style={{ marginBottom: 8, fontWeight: 600 }}>Controls (Back to Front)</div>
        <div
          style={{
            marginBottom: 12,
            maxHeight: skinConfig.canvas.height,
            overflowY: "auto",
            border: "1px solid #eee",
            padding: 6,
            background: "#fff",
          }}
        >
          {skinConfig.controls.map((control) => (
            <button
              key={control.id}
              type="button"
              draggable
              onDragStart={() => setDragId(control.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragId) {
                  setSkinConfig((prev) => {
                    if (!prev) return prev;
                    const controls = [...prev.controls];
                    const fromIndex = controls.findIndex((c) => c.id === dragId);
                    const toIndex = controls.findIndex((c) => c.id === control.id);
                    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
                      return prev;
                    }
                    const next = [...controls];
                    const [moved] = next.splice(fromIndex, 1);
                    next.splice(toIndex, 0, moved);
                    return { ...prev, controls: next };
                  });
                }
                setDragId(null);
              }}
              onClick={() => setSelectedId(control.id)}
              style={{
                ...LIST_BUTTON_STYLE,
                background: control.id === selectedId ? "#ffd9c8" : "#fff",
                border: "1px solid #ddd",
                opacity: dragId && dragId !== control.id ? 0.9 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={!control.hidden}
                onChange={(e) => {
                  e.stopPropagation();
                  setSkinConfig((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      controls: prev.controls.map((item) =>
                        item.id === control.id ? { ...item, hidden: !e.target.checked } : item
                      ),
                    };
                  });
                  needsRenderRef.current = true;
                }}
                style={{ marginRight: 6 }}
              />
              {control.id}
            </button>
          ))}
        </div>

        {selectedControl ? (
          <div>
            <label>
              ID
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => {
                  const ok = commitSelectedId(renameValue);
                  if (!ok) {
                    setRenameValue(selectedControl.id);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const ok = commitSelectedId(renameValue);
                    if (!ok) {
                      setRenameValue(selectedControl.id);
                    }
                  }
                }}
                style={INPUT_STYLE}
              />
            </label>
            <label>
              X
              <input
                type="number"
                value={selectedControl.x}
                onChange={(e) => updateSelectedControl({ x: Number(e.target.value) })}
                style={INPUT_STYLE}
              />
            </label>
            <label>
              Y
              <input
                type="number"
                value={selectedControl.y}
                onChange={(e) => updateSelectedControl({ y: Number(e.target.value) })}
                style={INPUT_STYLE}
              />
            </label>
            <label>
              Sprite
              <select
                value={selectedControl.spriteKey}
                onChange={(e) => updateSelectedControl({ spriteKey: e.target.value })}
                style={INPUT_STYLE}
              >
                {Object.keys(skinConfig.sprites).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Frame Index
              <input
                type="number"
                value={selectedControl.frameIndex ?? 0}
                onChange={(e) =>
                  updateSelectedControl({ frameIndex: Number(e.target.value) })
                }
                style={INPUT_STYLE}
              />
            </label>
            <label>
              Scale
              <input
                type="number"
                step="0.1"
                value={selectedControl.scale ?? 1}
                onChange={(e) => updateSelectedControl({ scale: Number(e.target.value) })}
                style={INPUT_STYLE}
              />
            </label>
            <label style={{ display: "block", marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={!selectedControl.hidden}
                onChange={(e) => updateSelectedControl({ hidden: !e.target.checked })}
                style={{ marginRight: 6 }}
              />
              Visible
            </label>
          </div>
        ) : (
          <div style={{ marginBottom: 12 }}>Select a control to edit.</div>
        )}

        <button type="button" onClick={handleDuplicate} style={BUTTON_STYLE}>
          Duplicate Control
        </button>
        <button type="button" onClick={handleExport} style={BUTTON_STYLE}>
          Export JSON
        </button>
      </aside>
    </div>
  );
}
