# Testing Multiple Canvas Flow

## Test Steps

### 1. Initial Load
- [ ] Open http://localhost:5173
- [ ] Should see 1 canvas tab labeled "Canvas 1"
- [ ] Canvas should be empty with no elements
- [ ] Check localStorage for "excalidraw_canvases" key

### 2. Create New Canvas via Menu
- [ ] Draw something on Canvas 1 (rectangle, line, etc)
- [ ] Click "New Canvas" menu item
- [ ] New tab "Canvas 2" should appear
- [ ] Canvas 2 should be completely EMPTY (no drawing from Canvas 1)
- [ ] Console should show: "New canvas created via menu: {Canvas object}"

### 3. Switch Back to Canvas 1
- [ ] Click "Canvas 1" tab
- [ ] Previous drawing should reappear
- [ ] Console should show: "Canvas data saved" + "Loading canvas data"

### 4. Multiple Canvases
- [ ] Create Canvas 3 - should be empty
- [ ] Draw something different on Canvas 3
- [ ] Create Canvas 4 - should be empty
- [ ] Switch between all tabs - each should show its own content

### 5. Delete Canvas
- [ ] Click close button (✕) on Canvas 2
- [ ] Canvas 2 tab should disappear
- [ ] Should still have Canvas 1, 3, 4
- [ ] Click close on last remaining canvas - should show alert

### 6. Persistence
- [ ] Refresh page (F5)
- [ ] All canvases should still exist with their content
- [ ] Active canvas should be preserved

## Expected Console Logs

```
Event listener attached
New canvas created via menu: {id: '...', name: 'Canvas 2', data: null, createdAt: ...}
Loading new empty canvas: ...
Canvas data saved: Canvas 1 ID
Loading canvas data: Canvas 1 ID
Auto-loading canvas data: Canvas 1 ID
```

## Browser DevTools Check

### Application > localStorage
Key: `excalidraw_canvases`
Value: Array of Canvas objects with elements

Key: `excalidraw_active_canvas`
Value: Current active canvas ID

## Files to Monitor

- `canvas-management.ts` - State management
- `components/CanvasTabs.tsx` - UI and logic
- `App.tsx` - API integration

## Common Issues

### Issue: New canvas shows previous drawing
- **Cause**: loadCanvasData not called or excalidrawAPI not ready
- **Fix**: Check if excalidrawAPI is properly passed via atom

### Issue: Switching canvas doesn't load content
- **Cause**: saveCurrentCanvasData not saving properly
- **Fix**: Check localStorage has correct data

### Issue: Multiple new canvas events
- **Cause**: Event listener re-attaching
- **Fix**: Check dependencies array in useEffect
