# Quick User Guide: New Layout Features

## Overview
The FIAE Tutor Desktop now has a **2-column layout** designed to give you more space for learning. Controls are on the left, output on the right.

---

## Feature 1: Collapsible Params Editor

### What is it?
The Parameters editor now hides by default to save vertical space.

### How to use:
1. Look for **"Parameters (JSON) ▸ Edit"** in the left panel
2. Click to **expand** the editor (shows ▾ icon)
3. Click again to **collapse** (shows ▸ icon)
4. Your choice is remembered (localStorage)

### When to use:
- **Collapsed:** When using default params (most of the time)
- **Expanded:** When you need to edit array values, targets, etc.

**Example:**
```
Collapsed:  Parameters (JSON) ▸ Edit
                     ↓ click
Expanded:   Parameters (JSON) ▾ Edit
            ┌─────────────────────────┐
            │ {                       │
            │   "arr": [64, 34, 25],  │
            │   "target": 25          │
            │ }                       │
            └─────────────────────────┘
```

---

## Feature 2: Fullscreen Output Mode

### What is it?
Hides the controls panel so output fills the entire window.

### How to use:
1. Click **⛶ Fullscreen** button (top-right of output panel)
2. Controls panel disappears, output expands to full width
3. Press **ESC** key or click **⛶ Exit Fullscreen** to return

### When to use:
- Reading long algorithm explanations (especially Persian/German)
- Viewing step-by-step trace events
- Focusing on pseudocode without distractions
- Presenting on a projector or secondary monitor

**Keyboard shortcut:** ESC to exit

---

## Feature 3: 2-Column Desktop Layout

### What changed?
The layout is now split into two panels:

**Left Panel (Controls):**
- Width: 350px
- Contains: Topic, Mode, Language, Params, Buttons
- Scrollable if content is tall
- Background: Dark gray (#0a0a0a)

**Right Panel (Output):**
- Width: Fills remaining screen space
- Contains: Tabs (Result, Events, Questions, etc.)
- Output content gets 70-80% of screen
- Internal scrolling (panel scrolls, not whole page)

### Benefits:
- **Before:** Controls took ~50% of screen height
- **After:** Output gets 70-80% of screen height
- Less scrolling needed to read content
- Professional appearance

---

## Feature 4: Responsive Mobile Layout

### What happens on small screens?
When screen width is **< 900px** (tablets/phones):
- Layout switches to **vertical stacking**
- Controls panel: 100% width at top
- Output panel: 100% width below controls
- Maintains full functionality

### When you'll see this:
- Using a tablet in portrait mode
- Resizing browser window to narrow width
- Mobile phone (not recommended for serious study)

---

## Feature 5: Improved Typography

### What changed?
Fonts are now larger and easier to read:

| Element | Before | After | Improvement |
|---------|--------|-------|-------------|
| Body text | 14px | 15-16px | +7-14% |
| Headers | 16px | 18px | +12% |
| Code blocks | 13-14px | 15px | +7-15% |
| Line height | 1.5 | 1.6 | +6% |

### Why it matters:
- **Reduced eye strain** during long study sessions
- **Better readability** for Persian/German text
- **Easier code scanning** for pseudocode/algorithms
- **Professional appearance** matches modern standards

---

## Tips for Best Experience

### 1. Collapse Params When Not Editing
Most of the time, you're just selecting Topic/Mode, not editing params.
→ Keep params collapsed to maximize output space.

### 2. Use Fullscreen for Reading
When you get a result with a long explanation:
→ Click Fullscreen to remove left panel and focus on content.

### 3. Mobile: Portrait is Better
If using a tablet:
→ Portrait mode gives you more vertical space for output.

### 4. Resize Your Window
If on desktop with large monitor:
→ Maximize the window to get the most output space.

### 5. Copy to External Editor
For very long outputs (like full trace logs):
→ Use "📋 Copy Result" and paste into a text editor with word wrap.

---

## Common Workflows

### Workflow 1: Quick Pseudocode Lookup
1. Select **Topic** (e.g., Binary Search)
2. Select **Mode** (e.g., Pseudocode)
3. Params already collapsed (default)
4. Click **Run**
5. Result shows instantly in right panel
6. *Optional:* Click Fullscreen for focused reading

### Workflow 2: Trace Execution with Custom Data
1. Select **Topic** (e.g., Bubblesort)
2. Select **Mode** (e.g., Trace)
3. Click **Parameters ▸** to expand
4. Edit array: `{"arr": [64, 34, 25, 12, 22]}`
5. Click **Parameters ▾** to collapse
6. Click **Run**
7. Click **Events** tab to see step-by-step execution
8. Use First/Prev/Next/Last buttons to navigate

### Workflow 3: Quiz Practice
1. Select **Topic** (e.g., Checksum)
2. Select **Mode** (e.g., Quiz)
3. Edit params if needed: `{"numq": 10}`
4. Click **Run**
5. Click **Questions** tab
6. Click **"🔍 Show Answer"** to reveal correct answer
7. *Tip:* Use Fullscreen to focus on one question at a time

---

## Troubleshooting

### "Params editor won't collapse"
→ Make sure you're clicking the header button, not inside the textarea.

### "Fullscreen doesn't exit with ESC"
→ Your cursor might be in an input field. Click on the output area first, then press ESC.

### "Layout looks wrong on mobile"
→ Rotate device to portrait mode for better layout.

### "Text is too small"
→ Use browser zoom (Ctrl+Plus on Windows, Cmd+Plus on Mac).

### "Left panel is too narrow"
→ Current version has fixed 350px width. Future version may allow resizing.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **ESC** | Exit fullscreen mode |
| **Tab** | Navigate between controls |
| **Enter** | Submit focused input |

---

## Future Features (Planned)

1. **Resizable Panels:** Drag divider between left/right panels
2. **More Shortcuts:** F11 for fullscreen, Ctrl+Enter for Run
3. **Theme Options:** Light theme for daytime use
4. **Pop-out Output:** Open output in separate window

---

## Feedback

Found a bug or have a suggestion?
→ Open an issue on GitHub or contact the development team.

Enjoying the new layout?
→ Consider contributing improvements or documentation!

---

**Last Updated:** 2024  
**Version:** 2.0 (2-Column Layout)  
**Git Commit:** 3522229
