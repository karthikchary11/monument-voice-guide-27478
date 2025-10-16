import React from "react";

interface Props {
  src: string;
  alt?: string;
  className?: string;
  exposure?: number;
}

// Build a Sketchfab embed URL while hiding only the info ribbon (title/author)
const toSketchfabEmbed = (url: string): string => {
  try {
    const u = new URL(url, window.location.origin);
    if (!u.hostname.includes("sketchfab.com")) return url;
    if (!u.pathname.includes("/embed")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const modelIdIndex = parts.findIndex((p) => p === "models");
      const modelId = modelIdIndex >= 0 ? parts[modelIdIndex + 1] : parts[0];
      u.pathname = `/models/${modelId}/embed`;
    }
    u.searchParams.set("ui_infos", "0");
    u.searchParams.set("ui_help", "0");
    u.searchParams.set("ui_stop", "0");
    return u.toString();
  } catch {
    return url;
  }
};

const ModelViewer: React.FC<Props> = ({ src, alt = "3D model", className }) => {
  const isSketchfab = src.includes("sketchfab.com");

  if (isSketchfab) {
    const embedUrl = toSketchfabEmbed(src);
    return (
      <iframe
        src={embedUrl}
        title={alt}
        className={className}
        style={{ width: "100%", height: "100%", border: "none", borderRadius: "8px" }}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
      />
    );
  }

  // Default: local/web-hosted GLB via <model-viewer>
  // @ts-ignore
  return (
    // @ts-ignore
    <model-viewer
      src={src}
      alt={alt}
      camera-controls
      interaction-prompt="auto"
      auto-rotate
      shadow-intensity="0.5"
      class={className}
      style={{ width: "100%", height: "100%", background: "transparent" }}
    />
  );
};

export default ModelViewer;
