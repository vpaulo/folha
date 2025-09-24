# Folha

A modern, canvas-based text editor built with Wails, Go, and vanilla JavaScript.

## Features

### Core Editor Functionality
- **Canvas-based rendering** for high performance and precise text display
- **Intelligent text wrapping** with word-boundary detection
- **Responsive design** that adapts to window resizing
- **Monospace font rendering** with configurable spacing and size
- **Line-based editing** with support for multi-line documents

### Text Selection
- **Mouse selection**: Click and drag to select text across multiple lines
- **Keyboard selection**: Use Shift + Arrow keys to extend selections
- **Multi-line support**: Seamless selection across wrapped and logical lines
- **Visual feedback**: Blue highlighting for selected text regions
- **Smart positioning**: Handles both logical and visual text coordinates

### Cursor Navigation
- **Arrow key navigation**: Move cursor in all directions
- **Word wrapping awareness**: Cursor movement respects wrapped lines
- **Line jumping**: Navigate between logical lines and visual wrapped lines
- **Precise positioning**: Accurate cursor placement in wrapped text

### Keyboard Shortcuts
- **Ctrl + A**: Select all text
- **Ctrl + C**: Copy selected text to clipboard
- **Ctrl + X**: Cut selected text to clipboard
- **Ctrl + V**: Paste text from clipboard
- **Ctrl + O**: Opens file dialog to load file
- **Ctrl + S**: Opens save dialog to save current content
- **Shift + Arrows**: Extend text selection
- **Backspace/Delete**: Remove characters or selected text
- **Enter**: Create new lines
- **Tab**: Insert spaces (2-space indentation)

### Text Editing
- **Character insertion**: Type to add text at cursor position
- **Text deletion**: Backspace and Delete key support
- **Selection replacement**: Typing replaces selected text
- **Multi-line editing**: Full support for paragraphs and line breaks
- **Unicode support**: Handle international characters and emojis

### Cross-Platform
- **Desktop application**: Native performance with web technologies
- **Windows, macOS, Linux**: Full cross-platform support via Wails
- **System integration**: Native clipboard access and file operations

## Technical Architecture

### Frontend (JavaScript)
- **Editor Class**: Core text editing engine with canvas rendering
- **Cursor Class**: Intelligent cursor positioning and movement
- **KeyPressMonitor**: Comprehensive keyboard and mouse input handling
- **Selection System**: Advanced text selection with visual feedback

### Backend (Go)
- **Wails framework**: Go backend with JavaScript frontend
- **Native OS integration**: Clipboard access and system operations
- **Hot reload**: Fast development with live code updates

## Getting Started

### Prerequisites
- Go 1.18 or later
- Node.js 16 or later
- Wails CLI tool

### Installation
```bash
# Install Wails CLI
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# Clone the repository
git clone <repository-url>
cd folha

# Install dependencies
wails build
```

### Development
```bash
# Run in development mode with hot reload
wails dev
```

This starts a development server with hot reload. Access the browser version at http://localhost:34115 for debugging.

### Building
```bash
# Build for production
wails build
```

Creates a distributable application in the `build/` directory.

## Configuration

Configure the project by editing `wails.json`. See the [Wails documentation](https://wails.io/docs/reference/project-config) for all available options.

## Architecture Details

The editor uses a sophisticated coordinate system that handles both:
- **Logical positions**: Actual character positions in the document
- **Visual positions**: Positions in wrapped/displayed lines

This dual-coordinate system ensures accurate cursor placement and text selection even when lines wrap to multiple visual lines.

## Future Enhancements

- Syntax highlighting
- Multiple cursors
- Find and replace
- Undo/redo system
- File operations (open, save)
- Themes and customization
- Plugin system
