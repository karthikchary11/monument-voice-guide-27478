import React from "react";

interface Props {
  src: string;
  alt?: string;
  className?: string;
  exposure?: number;
}

const ModelViewer: React.FC<Props> = ({ src, alt = "3D model", className }) => {
  // model-viewer is a web component; TypeScript JSX typing might complain, so ignore types here.
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
