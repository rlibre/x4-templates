// What the interface can ask the Go side.
//
// Every exported method of App is callable from the interface; an
// unexported one (lower-case first letter) is not. To add a function:
// write the method here, then declare and forward it in src/host.ts.
//
// # Rules of a call
//
// The interface gets a promise for each call. What a method returns
// decides how the promise ends:
//
//	func (a *App) F()                 resolves with nothing
//	func (a *App) F() T               resolves with the value
//	func (a *App) F() error           rejects if the error is not nil
//	func (a *App) F() (T, error)      one or the other
//
// A rejected promise carries the text of the error (err.Error()): write
// messages that can be shown to the user as they are. With Wails 2.16
// the interface receives an Error whose message is that text; older
// versions, 2.10 for one, pass the text itself, as a string.
//
// # What crosses the boundary
//
// Arguments and results are converted with encoding/json, in both
// directions. In practice:
//
//   - only the exported fields of a struct are sent. Their name is the
//     one of the json tag; without tag it is the Go name, capital
//     included. Always write the tag: it is the name TypeScript sees;
//   - a nil pointer, slice or map arrives as null;
//   - encoding/json cannot convert a function or a channel. For anything
//     tied to this process (an open file, a connection), send an
//     identifier and keep the value here;
//   - everything is copied: changing an object on one side changes
//     nothing on the other.
//
// # Several calls at once
//
// Wails runs each call in its own goroutine. A slow method does not
// freeze the window, and the interface can start a second call before
// the first one has answered: two methods, or twice the same one, may
// then run at the same time. Whatever they share in App needs a
// sync.Mutex.
//
// # Speaking first
//
// A method only answers a question of the interface. To tell it something
// it did not ask (progress of a long task, a file that changed), send an
// event with runtime.EventsEmit(a.ctx, "name", data): the interface
// receives it with window.runtime.EventsOn("name", callback).

package main

import (
	"context"
	_ "embed"
	"encoding/json"
	"os"
	goruntime "runtime"
	"runtime/debug"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// projectFile is wails.json, copied into the executable at compile time.
// It is the one place where the name and the version of the application
// are written: Wails reads the file to name the executable and to fill
// its version information, this program for the title of the window and
// for GetInfo. A change in wails.json therefore needs a rebuild to be
// seen here.
//
//go:embed wails.json
var projectFile []byte

// project is read once, before main starts.
var project = readProject()

// projectConfig names the few keys of wails.json this program uses.
// Keys that are not listed are ignored: add a field to read another one.
type projectConfig struct {
	Name string `json:"name"`
	Info struct {
		ProductVersion string `json:"productVersion"`
	} `json:"info"`
}

// readProject stops the program on a malformed wails.json. The copy read
// is the one compiled in: such an error shows at the first start after
// the build, never later on the machine of a user.
func readProject() projectConfig {
	var config projectConfig
	if err := json.Unmarshal(projectFile, &config); err != nil {
		panic("wails.json: " + err.Error())
	}
	return config
}

// wailsVersion returns the version of the Wails module the application
// was built with ("v2.16.0"). The Go compiler records the modules of a
// build in the executable: nothing has to be kept in sync by hand. It
// returns an empty text if that record is missing.
func wailsVersion() string {
	info, ok := debug.ReadBuildInfo()
	if !ok {
		return ""
	}
	for _, dep := range info.Deps {
		if dep.Path == "github.com/wailsapp/wails/v2" {
			return dep.Version
		}
	}
	return ""
}

// App is the value bound to the interface in main.go. There is one for
// the whole program: its fields are the state of the Go side, kept from
// one call to the next.
type App struct {
	// ctx identifies the running application to the Wails runtime.
	// It is nil until startup has been called.
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

// startup is called by Wails after the window has been created, before
// index.html is loaded.
//
// Every function of the runtime package (dialogs, events, Quit...)
// takes this context as first argument, and only this one:
// with nil, context.Background() or a context of your own, the function
// stops the program ("An invalid context was passed"). Nothing of the
// runtime can therefore be used before this call, in particular not in
// NewApp.
//
// It is lower-case on purpose: an exported Startup would be callable by
// the interface.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// HostInfo is the answer of GetInfo. Its shape is repeated by hand in
// src/host.ts: a field added here must be added there.
type HostInfo struct {
	Name     string `json:"name"`
	Version  string `json:"version"`
	Runtime  string `json:"runtime"`
	Platform string `json:"platform"`
}

// GetInfo describes the application and what it runs on.
// Platform is the name Go gives to the system: "windows", "darwin"
// (macOS) or "linux".
func (a *App) GetInfo() HostInfo {
	return HostInfo{
		Name:     project.Name,
		Version:  project.Info.ProductVersion,
		Runtime:  "Wails " + wailsVersion(),
		Platform: goruntime.GOOS,
	}
}

// TextFile is a file read by OpenTextFile: where it is, and its content.
type TextFile struct {
	Path string `json:"path"`
	Text string `json:"text"`
}

// OpenTextFile asks the user for a file with the dialog of the system,
// and returns its content. Dialogs only exist on the Go side: the
// JavaScript runtime of Wails has none.
//
// It shows the three possible ends of a call:
//
//   - the user cancels: nil without error, the interface receives null;
//   - the file cannot be read: an error, the promise is rejected;
//   - otherwise the file.
//
// The dialog is opened without options. OpenDialogOptions has, among
// others, Title, DefaultDirectory, DefaultFilename and Filters:
//
//	Filters: []runtime.FileFilter{
//		{DisplayName: "Text (*.txt, *.md)", Pattern: "*.txt;*.md"},
//	}
//
// The file is read whole into memory and sent as one text: fine for
// documents, not for a file of several hundred megabytes. Its bytes are
// taken as UTF-8; those that are not arrive as the replacement character.
func (a *App) OpenTextFile() (*TextFile, error) {
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{})
	if err != nil {
		return nil, err
	}

	// an empty path without error is how the dialog reports a cancellation
	if path == "" {
		return nil, nil
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	return &TextFile{Path: path, Text: string(data)}, nil
}
