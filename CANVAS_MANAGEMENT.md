# Multiple Canvas Management System

## Deskripsi
Sistem ini memungkinkan pengguna untuk membuat dan mengelola multiple canvas terpisah dalam satu instance Excalidraw, masing-masing dengan data drawing yang independent.

## Fitur Utama

### 1. **Multiple Canvas Tabs**
- Setiap canvas ditampilkan sebagai tab terpisah di bagian atas editor
- Tab menampilkan nama canvas dan tombol close untuk delete
- Tombol `+` untuk membuat canvas baru

### 2. **Independent Canvas Data**
- Setiap canvas menyimpan drawing elements yang terpisah
- Data di-save otomatis ke localStorage saat switching atau delete
- Saat ganti canvas, drawing dari canvas sebelumnya di-save terlebih dahulu

### 3. **Canvas Persistence**
- Data canvas tersimpan di localStorage dengan keys:
  - `excalidraw_canvases` - Array of all canvases
  - `excalidraw_active_canvas` - ID of currently active canvas
- Data di-load otomatis saat app start

## File-File yang Dibuat/Dimodifikasi

### Core Files

#### `canvas-management.ts` (Baru)
Mengelola state dan logika canvas:
- **canvasesAtom** - Jotai atom untuk list semua canvas
- **activeCanvasIdAtom** - Jotai atom untuk active canvas ID
- **excalidrawAPIAtom** - Jotai atom untuk Excalidraw API reference
- Helper functions:
  - `createNewCanvas()` - Buat canvas baru
  - `saveCanvasesToStorage()` - Simpan ke localStorage
  - `updateCanvasData()` - Update canvas data by ID
  - `getActiveCanvas()` - Get current active canvas
  - `loadCanvasesFromStorage()` - Load canvas dari localStorage

#### `components/CanvasTabs.tsx` (Baru)
UI component untuk canvas tabs management:
- Menampilkan tab untuk setiap canvas
- Handle switching antar canvas
- Handle delete canvas (minimum 1 canvas harus ada)
- Save/load canvas data saat switching
- Listen to "excalidraw:newcanvas" event dari menu

#### `components/CanvasTabs.scss` (Baru)
Styling untuk canvas tabs UI dengan light/dark mode support

### Modified Files

#### `App.tsx`
- Import `excalidrawAPIAtom` dari canvas-management
- Add `setExcalidrawAPI` untuk update atom dengan API reference
- Add useEffect untuk sync API ke atom
- Render `<CanvasTabs />` component

#### `DefaultItems.tsx`
- Add `NewCanvas` menu item yang dispatch event "excalidraw:newcanvas"

#### `WelcomeScreen.Center.tsx`
- Add `MenuItemNewCanvas` ke welcome screen

## Alur Kerja

### Membuat Canvas Baru
1. User klik "New Canvas" di menu
2. Event "excalidraw:newcanvas" di-dispatch
3. CanvasTabs event listener menangkap event
4. Canvas baru dibuat dan di-add ke canvasesAtom
5. New canvas menjadi active
6. Data di-save ke localStorage

### Switching Canvas
1. User klik canvas tab
2. `handleSelectCanvas()` terpanggil
3. Current canvas data di-save via `saveCurrentCanvasData()`
4. New canvas data di-load via `loadCanvasData()`
5. Excalidraw scene di-update dengan elements dari new canvas
6. activeCanvasId di-update dan di-save

### Delete Canvas
1. User klik tombol close (✕) di tab
2. Jika canvas terakhir, show alert
3. Canvas di-remove dari list
4. Jika active canvas, switch ke canvas lain
5. Data di-save ke localStorage

## Data Structure

```typescript
interface Canvas {
  id: string;           // Unique ID (timestamp + random)
  name: string;         // Display name ("Canvas 1", etc)
  data: ImportedDataState | null;  // Drawing data
  createdAt: number;    // Creation timestamp
}

interface ImportedDataState {
  elements: ExcalidrawElement[];
  appState?: AppState;
  files?: BinaryFiles;
}
```

## Storage Schema

### localStorage Keys
- `excalidraw_canvases` - JSON array of Canvas objects
- `excalidraw_active_canvas` - ID string of active canvas

### Example
```json
{
  "excalidraw_canvases": [
    {
      "id": "1764385462532-8etc3e4qg",
      "name": "Canvas 1",
      "data": { "elements": [...], "appState": {...}, "files": {...} },
      "createdAt": 1764385462532
    },
    {
      "id": "1764385462600-abc123xyz",
      "name": "Canvas 2",
      "data": null,
      "createdAt": 1764385462600
    }
  ],
  "excalidraw_active_canvas": "1764385462532-8etc3e4qg"
}
```

## Limitations & Future Improvements

### Current Limitations
- appState tidak di-save penuh (hanya elements dan files)
- Zoom/scroll position di-reset saat ganti canvas
- File images di-share antar canvas

### Potential Improvements
1. Save full appState per canvas
2. Preserve zoom/scroll position per canvas
3. Isolate files per canvas
4. Add canvas renaming
5. Add canvas reordering
6. Add canvas export/import
7. Cloud sync untuk multiple canvas

## Testing

Untuk test functionality:

1. **Create New Canvas**
   - Click "New Canvas" menu
   - Baru canvas tab should appear
   - Canvas should be empty

2. **Draw & Switch**
   - Draw something di Canvas 1
   - Click Canvas 2 tab
   - Canvas 1 drawing should persist
   - Switch back to Canvas 1
   - Drawing should appear intact

3. **Delete Canvas**
   - Click close button (✕) pada tab
   - Canvas should be removed
   - Last canvas tidak bisa di-delete

4. **Persistence**
   - Refresh page
   - All canvas harus ter-load dari localStorage
   - Active canvas harus same seperti sebelum refresh

## Console Logging

Debug info dapat dilihat di browser console:
- "Event listener attached" - CanvasTabs listener aktif
- "Event listener removed" - CanvasTabs listener cleanup
- "New canvas created via menu: {Canvas object}" - Canvas baru dibuat
- "Canvas data saved: {canvasId}" - Data di-save saat switching
- "Loading canvas data: {canvasId}" - Canvas data di-load
- "Auto-loading canvas data: {canvasId}" - Auto-load saat API ready
