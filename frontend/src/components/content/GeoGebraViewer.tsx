interface GeoGebraViewerProps {
  materialId?: string;
  params?: Record<string, unknown>;
}

export function GeoGebraViewer({ materialId, params: _params }: GeoGebraViewerProps) {
  return (
    <div className="geogebra-viewer">
      {materialId ? (
        <p>GeoGebra applet: {materialId}</p>
      ) : (
        <p>No GeoGebra material configured</p>
      )}
    </div>
  );
}
