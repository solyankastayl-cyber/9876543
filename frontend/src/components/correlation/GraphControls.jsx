import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

export const GraphControls = ({ onZoomIn, onZoomOut, onReset, onFullscreen }) => (
  <div className="absolute top-2 right-2 flex flex-col gap-0.5 bg-white rounded-lg shadow border border-gray-200 p-0.5 z-50">
    <button
      onClick={onZoomIn}
      className="p-1.5 hover:bg-gray-100 rounded"
      title="Zoom In"
      data-testid="graph-zoom-in"
    >
      <ZoomIn className="w-3.5 h-3.5 text-gray-600" />
    </button>
    <button
      onClick={onZoomOut}
      className="p-1.5 hover:bg-gray-100 rounded"
      title="Zoom Out"
      data-testid="graph-zoom-out"
    >
      <ZoomOut className="w-3.5 h-3.5 text-gray-600" />
    </button>
    <div className="h-px bg-gray-200" />
    <button
      onClick={onReset}
      className="p-1.5 hover:bg-gray-100 rounded"
      title="Reset"
      data-testid="graph-reset"
    >
      <RotateCcw className="w-3.5 h-3.5 text-gray-600" />
    </button>
    <button
      onClick={onFullscreen}
      className="p-1.5 hover:bg-gray-100 rounded"
      title="Fullscreen"
      data-testid="graph-fullscreen"
    >
      <Maximize2 className="w-3.5 h-3.5 text-gray-600" />
    </button>
  </div>
);

export default GraphControls;
