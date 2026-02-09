import React, { useEffect, useRef, useState } from "react";
import type { SkinConfig } from "../skin/types";
import { useRbmMod } from "../rbm/useRbmMod";

const SECTION_STYLE: React.CSSProperties = {
  padding: 24,
  maxWidth: 960,
  margin: "0 auto",
};

const GRID_STYLE: React.CSSProperties = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
};

export default function ModLoaderLab() {
  const [skinJson, setSkinJson] = useState<SkinConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const modInputRef = useRef<HTMLInputElement | null>(null);
  const { loadRbmFile, bundle, images, missing, loading } = useRbmMod({ skinJson });
  const [previewEntry, setPreviewEntry] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchSkin() {
      try {
        const res = await fetch(`/skins/rbmh/skin.json`);
        if (!res.ok) throw new Error("Failed to fetch skin.json");
        const data: SkinConfig = await res.json();
        if (!cancelled) {
          setSkinJson(data);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "Unable to load skin");
      }
    }
    fetchSkin();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    loadRbmFile(file).catch((err) => setError(err?.message ?? "Failed to load mod"));
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    setError(null);
    loadRbmFile(file).catch((err) => setError(err?.message ?? "Failed to load mod"));
  };

  const imageEntries = Object.entries(images);

  const entryNames = bundle ? Array.from(bundle.entries.keys()) : [];

  return (
    <section style={SECTION_STYLE}>
      <h2>ReBirth .rbm Loader</h2>
      <div
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        style={{
          padding: 18,
          border: "2px dashed #bbb",
          borderRadius: 8,
          textAlign: "center",
          marginBottom: 16,
          background: "#fff",
          cursor: "pointer",
        }}
        onClick={() => modInputRef.current?.click()}
      >
        {loading ? "Loading .rbm..." : "Drop a .rbm file or click to select"}
        <input
          ref={modInputRef}
          type="file"
          accept=".rbm"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>
      <div style={{ fontSize: 13, marginBottom: 8 }}>
        Entries: {bundle?.entries.size ?? 0}
      </div>
      {error && (
        <div style={{ color: "#c00", marginBottom: 8 }}>{error}</div>
      )}
      {missing.length > 0 && (
        <div style={{ fontSize: 12, marginBottom: 8 }}>
          Missing from skin: {missing.join(", ")}
        </div>
      )}
      <h3>Preview</h3>
      {entryNames.length > 0 && (
        <div style={{ fontSize: 12, marginBottom: 12 }}>
          Found: {entryNames.join(", ")}
        </div>
      )}
      <div style={GRID_STYLE}>
        {imageEntries.map(([name, image]) => (
          <figure
            key={name}
            style={{
              margin: 0,
              padding: 8,
              border: "1px solid #ddd",
              borderRadius: 6,
              background: "#fff",
              cursor: "pointer",
            }}
            onClick={() => setPreviewEntry(name)}
          >
            <img
              src={image.src}
              alt={name}
              style={{
                width: "100%",
                height: 90,
                objectFit: "contain",
                imageRendering: "pixelated",
              }}
            />
            <figcaption style={{ fontSize: 11, marginTop: 6 }}>{name}</figcaption>
          </figure>
        ))}
      </div>
      {previewEntry && images[previewEntry] && (
        <div
          role="dialog"
          aria-label={previewEntry}
          onClick={() => setPreviewEntry(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            padding: 24,
          }}
        >
          <img
            src={images[previewEntry].src}
            alt={previewEntry}
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              imageRendering: "pixelated",
              borderRadius: 6,
              boxShadow: "0 0 40px rgba(0,0,0,0.5)",
            }}
          />
        </div>
      )}
    </section>
  );
}
