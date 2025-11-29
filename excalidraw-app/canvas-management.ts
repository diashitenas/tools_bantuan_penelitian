import { atom } from "./app-jotai";
import type { ImportedDataState } from "@excalidraw/excalidraw/data/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

// Generate UUID using crypto
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export interface Canvas {
  id: string;
  name: string;
  data: ImportedDataState | null;
  createdAt: number;
}

// Atom untuk list semua canvas
export const canvasesAtom = atom<Canvas[]>([]);

// Atom untuk current active canvas ID
export const activeCanvasIdAtom = atom<string>("");

// Atom untuk Excalidraw API reference
export const excalidrawAPIAtom = atom<ExcalidrawImperativeAPI | null>(null);

// Helper function untuk create new canvas
export const createNewCanvas = (name: string = "Untitled"): Canvas => {
  return {
    id: generateId(),
    name,
    data: null,
    createdAt: Date.now(),
  };
};

// Helper function untuk save canvas to localStorage
export const saveCanvasesToStorage = (canvases: Canvas[]) => {
  localStorage.setItem("excalidraw_canvases", JSON.stringify(canvases));
};

// Helper function untuk save active canvas ID
export const saveActiveCanvasId = (id: string) => {
  localStorage.setItem("excalidraw_active_canvas", id);
};

// Helper function untuk update canvas data by ID
export const updateCanvasData = (canvases: Canvas[], canvasId: string, data: ImportedDataState | null): Canvas[] => {
  return canvases.map((canvas) =>
    canvas.id === canvasId ? { ...canvas, data } : canvas
  );
};

// Helper function untuk get active canvas
export const getActiveCanvas = (canvases: Canvas[], activeCanvasId: string): Canvas | null => {
  return canvases.find((c) => c.id === activeCanvasId) || null;
};

// Helper function untuk load canvases from localStorage
export const loadCanvasesFromStorage = (): { canvases: Canvas[]; activeCanvasId: string } => {
  try {
    const stored = localStorage.getItem("excalidraw_canvases");
    const activeId = localStorage.getItem("excalidraw_active_canvas") || "";
    
    if (stored) {
      const parsed = JSON.parse(stored) as Canvas[];
      return {
        canvases: parsed,
        activeCanvasId: activeId,
      };
    }
  } catch (error) {
    console.error("Failed to load canvases from storage:", error);
  }
  
  return {
    canvases: [],
    activeCanvasId: "",
  };
};
