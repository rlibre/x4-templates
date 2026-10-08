// Entry point: creates the window and gives it the interface built by x4js.
//
// The application is two programs in one executable:
//
//   - the interface, written in TypeScript (src), which runs in the web
//     view of the system and has no access to the machine;
//   - this Go program, which owns the window and does everything the
//     interface cannot do (files, dialogs, network, processes...).
//
// The only door between the two is the list given to Bind below. What the
// interface can ask is therefore decided here and in app.go, nowhere else.

package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

// assets is the interface, as written by `x4js build` in the bin folder.
// The go:embed line makes the compiler copy the whole folder into the
// executable, which is why there is a single file to distribute.
//
// Three rules come with it:
//
//   - The path is relative to this file and cannot go up ("../x" is
//     refused). The built interface has to live in this folder or below.
//   - The folder must contain at least one file when the Go code is
//     compiled, otherwise the compiler stops with "pattern all:bin: no
//     matching files found". The wails command avoids it: when the folder
//     is missing, it creates it with an empty file named gitkeep. A plain
//     `go build` or `go vet` does not.
//   - Without the "all:" prefix, files whose name starts with "." or "_"
//     are left out.
//
// Under `wails dev` the embedded copy is not used: the application reads
// the folder named by assetdir in wails.json from the disk, and Wails
// reloads the window when a file changes in it. A change of the interface
// therefore shows without recompiling the Go code.
//
//go:embed all:bin
var assets embed.FS

func main() {
	// One App for the whole life of the program. It is created before the
	// window: it must not touch the Wails runtime yet (see App.startup).
	app := NewApp()

	// Run creates the application and executes it: it returns when the
	// application ends, or at once with an error if it could not start.
	// Code placed after it does not run at startup.
	err := wails.Run(&options.App{
		Title: project.Name,

		// Size of the window when it opens. MinWidth, MinHeight, MaxWidth
		// and MaxHeight are the other size options.
		Width:  1000,
		Height: 700,

		// Wails looks for index.html in these files and serves the folder
		// that contains it as the root of a site: the page is not opened
		// as a file, and its requests are answered from that folder.
		AssetServer: &assetserver.Options{
			Assets: assets,
		},

		// Default background colour of the window; white when not set.
		// It is the value of --background-primary in src/main.scss, so
		// the window has the colour of the interface before it is drawn.
		BackgroundColour: &options.RGBA{R: 4, G: 49, B: 73, A: 255},

		// Moments of the life of the application. Only the first one is
		// used here. OnDomReady and OnShutdown take a function of the
		// same shape; OnBeforeClose returns a bool.
		//
		//   OnStartup      the window is created, index.html is not
		//                  loaded yet
		//   OnDomReady     index.html and its resources are loaded
		//   OnBeforeClose  the application is about to quit (close button
		//                  or runtime.Quit); returning true prevents it
		//   OnShutdown     the window is destroyed, the program is about
		//                  to end
		OnStartup: app.startup,

		// The door to the interface. Each exported method of each value
		// listed here becomes callable from TypeScript, under
		// window.go.<package>.<type>.<method>: here window.go.main.App.
		// A second type is added by listing a second value.
		Bind: []interface{}{
			app,
		},
	})

	// The application could not start. `wails build` links the Windows
	// executable without console, so this message is not shown there;
	// it is with `wails dev`, and in a build made with -debug or
	// -windowsconsole.
	if err != nil {
		println("Error:", err.Error())
	}
}
