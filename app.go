package main

import (
	"context"
	"fmt"
	"os"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	rt "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) domready(ctx context.Context) {
	rt.EventsEmit(a.ctx, "loaded")
}

func (a *App) shutdown(ctx context.Context) {
	// TODO:
}

func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	// TODO:
	return false
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) ApplicationMenu() *menu.Menu {
	appMenu := menu.NewMenu()

	// if runtime.GOOS == "darwin" {
	// 	appMenu.Append(menu.AppMenu()) // On macOS platform, this must be done right after `NewMenu()`
	// }
	FileMenu := appMenu.AddSubmenu("File")
	FileMenu.AddText("Open", keys.CmdOrCtrl("o"), func(_ *menu.CallbackData) {
		content, err := a.OpenFile()

		if err == nil {
			rt.EventsEmit(a.ctx, "open_file", content)
		}
	})
	// FileMenu.AddText("Save File", keys.CmdOrCtrl("s"), func(_ *menu.CallbackData) {
	// 	a.SaveFile("")
	// })
	FileMenu.AddSeparator()
	FileMenu.AddText("Quit", keys.CmdOrCtrl("q"), func(_ *menu.CallbackData) {
		// `rt` is an alias of "github.com/wailsapp/wails/v2/pkg/runtime" to prevent collision with standard package
		rt.Quit(a.ctx)
	})

	// if runtime.GOOS == "darwin" {
	// 	appMenu.Append(menu.EditMenu()) // On macOS platform, EditMenu should be appended to enable Cmd+C, Cmd+V, Cmd+Z... shortcuts
	// }

	return appMenu
}

// OpenFile opens a file dialog and returns the file content
func (a *App) OpenFile() (string, error) {
	filePath, err := rt.OpenFileDialog(a.ctx, rt.OpenDialogOptions{
		Title: "Open File",
		Filters: []rt.FileFilter{
			{
				DisplayName: "Text Files (*.txt)",
				Pattern:     "*.txt",
			},
			{
				DisplayName: "All Files (*.*)",
				Pattern:     "*.*",
			},
		},
	})

	if err != nil {
		return "", err
	}

	if filePath == "" {
		return "", nil // User cancelled
	}

	content, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}

	return string(content), nil
}

// SaveFile opens a save dialog and saves content to the selected file
func (a *App) SaveFile(content string) error {
	filePath, err := rt.SaveFileDialog(a.ctx, rt.SaveDialogOptions{
		Title:           "Save File",
		DefaultFilename: "untitled.txt",
		Filters: []rt.FileFilter{
			{
				DisplayName: "Text Files (*.txt)",
				Pattern:     "*.txt",
			},
			{
				DisplayName: "All Files (*.*)",
				Pattern:     "*.*",
			},
		},
	})

	if err != nil {
		return err
	}

	if filePath == "" {
		return nil // User cancelled
	}

	return os.WriteFile(filePath, []byte(content), 0644)
}

// SaveToFile saves content to a specific file path
func (a *App) SaveToFile(filePath string, content string) error {
	return os.WriteFile(filePath, []byte(content), 0644)
}
