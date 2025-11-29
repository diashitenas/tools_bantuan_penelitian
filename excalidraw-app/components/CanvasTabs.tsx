import React, { useCallback, useEffect, useRef } from "react";
import { useAtom, useSetAtom, useAtomValue } from "../app-jotai";
import {
  canvasesAtom,
  activeCanvasIdAtom,
  excalidrawAPIAtom,
  createNewCanvas,
  saveCanvasesToStorage,
  saveActiveCanvasId,
  updateCanvasData,
  getActiveCanvas,
  loadCanvasesFromStorage,
  Canvas,
} from "../canvas-management";
import { CaptureUpdateAction } from "@excalidraw/excalidraw";
import type { ImportedDataState } from "@excalidraw/excalidraw/data/types";
import "./CanvasTabs.scss";

// Generate consistent color based on canvas ID
const getCanvasColor = (canvasId: string, isActive: boolean): string => {
  if (isActive) {
    return "#3B82F6"; // Blue for active
  } else {
    return "#EF4444"; // Red for inactive
  }
};

export const CanvasTabs: React.FC = () => {
  const [canvases, setCanvases] = useAtom(canvasesAtom);
  const [activeCanvasId, setActiveCanvasId] = useAtom(activeCanvasIdAtom);
  const excalidrawAPI = useAtomValue(excalidrawAPIAtom);
  const prevCanvasIdRef = useRef<string | null>(null);

  // Initialize canvases if empty - load from localStorage or create default
  useEffect(() => {
    if (canvases.length === 0) {
      const { canvases: storedCanvases, activeCanvasId: storedActiveId } = loadCanvasesFromStorage();
      
      if (storedCanvases.length > 0) {
        // Load from localStorage
        setCanvases(storedCanvases);
        setActiveCanvasId(storedActiveId || storedCanvases[0].id);
        saveActiveCanvasId(storedActiveId || storedCanvases[0].id);
      } else {
        // Create default canvas
        const initialCanvas = createNewCanvas("Canvas 1");
        setCanvases([initialCanvas]);
        saveCanvasesToStorage([initialCanvas]);
        setActiveCanvasId(initialCanvas.id);
        saveActiveCanvasId(initialCanvas.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save current canvas data before switching
  const saveCurrentCanvasData = useCallback(() => {
    if (excalidrawAPI && activeCanvasId) {
      setCanvases((prevCanvases) => {
        // Get current scene data from Excalidraw
        const elements = excalidrawAPI.getSceneElementsIncludingDeleted();
        const files = excalidrawAPI.getFiles();

        // Create a minimal scene data with just elements and files
        const sceneData: ImportedDataState = {
          elements: elements || [],
          appState: {},  // Let Excalidraw use defaults for appState
          files: files,
        };

        // Update canvas with new data
        const updated = updateCanvasData(prevCanvases, activeCanvasId, sceneData);
        saveCanvasesToStorage(updated);
        console.log("Canvas data saved:", activeCanvasId);
        return updated;
      });
    }
  }, [excalidrawAPI, activeCanvasId, setCanvases]);

  // Load canvas data when switching
  const loadCanvasData = useCallback(
    (canvasId: string) => {
      if (!excalidrawAPI) {
        return;
      }

      const canvas = canvases.find((c) => c.id === canvasId);
      if (!canvas) {
        return;
      }

      // Save current canvas first
      saveCurrentCanvasData();

      // Load the new canvas data
      if (canvas.data && canvas.data.elements && canvas.data.elements.length > 0) {
        console.log("Loading canvas data:", canvasId);
        // Restore files if they exist
        if (canvas.data.files && Object.keys(canvas.data.files).length > 0) {
          excalidrawAPI.addFiles(Object.values(canvas.data.files));
        }
        excalidrawAPI.updateScene({
          elements: canvas.data.elements,
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
      } else {
        // Empty canvas
        console.log("Loading empty canvas:", canvasId);
        excalidrawAPI.updateScene({
          elements: [],
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
      }
    },
    [excalidrawAPI, canvases, saveCurrentCanvasData]
  );

  const handleNewCanvas = useCallback(() => {
    setCanvases((prevCanvases) => {
      const newCanvas = createNewCanvas(`Canvas ${prevCanvases.length + 1}`);
      const updated = [...prevCanvases, newCanvas];
      saveCanvasesToStorage(updated);
      setActiveCanvasId(newCanvas.id);
      saveActiveCanvasId(newCanvas.id);
      return updated;
    });
  }, [setCanvases, setActiveCanvasId]);

  const handleSelectCanvas = useCallback(
    (id: string) => {
      loadCanvasData(id);
      setActiveCanvasId(id);
      saveActiveCanvasId(id);
    },
    [loadCanvasData, setActiveCanvasId]
  );

  const handleDeleteCanvas = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setCanvases((prevCanvases) => {
        if (prevCanvases.length === 1) {
          alert("Cannot delete the last canvas");
          return prevCanvases;
        }
        const updated = prevCanvases.filter((c) => c.id !== id);
        saveCanvasesToStorage(updated);

        if (activeCanvasId === id) {
          const nextCanvas = updated[0];
          setActiveCanvasId(nextCanvas.id);
          saveActiveCanvasId(nextCanvas.id);
        }
        return updated;
      });
    },
    [activeCanvasId, setCanvases, setActiveCanvasId]
  );

  // Listen for new canvas event from menu
  useEffect(() => {
    const handleNewCanvasEvent = () => {
      // Create new canvas
      const newCanvas = createNewCanvas(`Canvas ${canvases.length + 1}`);
      const updated = [...canvases, newCanvas];
      
      // Save to storage
      saveCanvasesToStorage(updated);
      setActiveCanvasId(newCanvas.id);
      saveActiveCanvasId(newCanvas.id);
      
      // Update canvases state
      setCanvases(updated);
      
      // Load empty canvas immediately
      if (excalidrawAPI) {
        console.log("Loading new empty canvas:", newCanvas.id);
        excalidrawAPI.updateScene({
          elements: [],
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
      }
      
      console.log("New canvas created via menu:", newCanvas);
    };

    window.addEventListener("excalidraw:newcanvas", handleNewCanvasEvent);
    console.log("Event listener attached");
    return () => {
      window.removeEventListener("excalidraw:newcanvas", handleNewCanvasEvent);
      console.log("Event listener removed");
    };
  }, [canvases, setCanvases, setActiveCanvasId, excalidrawAPI]);

  // Load canvas data when activeCanvasId changes
  useEffect(() => {
    if (!excalidrawAPI || !activeCanvasId || canvases.length === 0) {
      return;
    }

    // Only load if activeCanvasId actually changed
    if (prevCanvasIdRef.current === activeCanvasId) {
      return;
    }

    const currentCanvas = canvases.find((c) => c.id === activeCanvasId);
    if (!currentCanvas) {
      return;
    }

    // Save previous canvas first
    if (prevCanvasIdRef.current) {
      saveCurrentCanvasData();
    }

    console.log("Loading canvas:", activeCanvasId);
    if (currentCanvas.data && currentCanvas.data.elements && currentCanvas.data.elements.length > 0) {
      // Has content
      if (currentCanvas.data.files && Object.keys(currentCanvas.data.files).length > 0) {
        excalidrawAPI.addFiles(Object.values(currentCanvas.data.files));
      }
      excalidrawAPI.updateScene({
        elements: currentCanvas.data.elements,
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
    } else {
      // Empty canvas
      excalidrawAPI.updateScene({
        elements: [],
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
    }

    prevCanvasIdRef.current = activeCanvasId;
  }, [excalidrawAPI, activeCanvasId, canvases, saveCurrentCanvasData]);

  if (canvases.length === 0) {
    return (
      <div className="canvas-tabs-container">
        <div className="canvas-tabs">
          <button
            className="canvas-tab-new"
            onClick={() => {
              const initialCanvas = createNewCanvas("Canvas 1");
              setCanvases([initialCanvas]);
              saveCanvasesToStorage([initialCanvas]);
              setActiveCanvasId(initialCanvas.id);
              saveActiveCanvasId(initialCanvas.id);
            }}
            title="New canvas"
          >
            +
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="canvas-tabs-container">
      <div className="canvas-tabs">
        {canvases.map((canvas, index) => {
          const elementCount = canvas.data?.elements?.length || 0;
          const isActive = activeCanvasId === canvas.id;
          const canvasColor = getCanvasColor(canvas.id, isActive);
          return (
            <div
              key={canvas.id}
              className={`canvas-tab ${activeCanvasId === canvas.id ? "active" : ""}`}
              onClick={() => handleSelectCanvas(canvas.id)}
              title={`${canvas.name} - ${elementCount} elements`}
              style={{
                "--canvas-color": canvasColor,
              } as React.CSSProperties & { "--canvas-color"?: string }}
            >
              <span className="canvas-tab-icon">
                {elementCount > 0 ? "🎨" : "📄"}
              </span>
              <div className="canvas-tab-info">
                <span className="canvas-tab-name">{canvas.name}</span>
                {elementCount > 0 && (
                  <span className="canvas-tab-subtitle">{elementCount} items</span>
                )}
              </div>
              {elementCount > 0 && (
                <span className="canvas-tab-badge">{elementCount}</span>
              )}
              <button
                className="canvas-tab-close"
                onClick={(e) => handleDeleteCanvas(canvas.id, e)}
                title="Delete canvas"
                aria-label="Close canvas"
              >
                ×
              </button>
            </div>
          );
        })}
        <button
          className="canvas-tab-new"
          onClick={handleNewCanvas}
          title="Create new canvas"
          aria-label="New canvas"
        >
          ✨
        </button>
      </div>
    </div>
  );
};

CanvasTabs.displayName = "CanvasTabs";
