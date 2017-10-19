/* eslint-env node, jquery, browser */

const electron = require('electron');
// Module to control application life.
const { ipcMain } = require('electron');

const fs = require('fs');

const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let playlistWindow;
let currentSongName;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 800, height: 100, frame: false, alwaysOnTop: true });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  mainWindow.setAlwaysOnTop(true);

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    playlistWindow = null;
  });

  playlistWindow = new BrowserWindow({ width: 400, height: 300, parent: mainWindow, visible: false, frame: false });
  let playListHtmlContent = "<!DOCTYPE html>\n<html>\n<header><meta charset = 'UTF-8'>\n<link rel='stylesheet' href='style.css'></header>\n<script>\nvar remote = require('remote');\n</script>\n<body>\n";
  playListHtmlContent += '<h3>Playlist</h3><ul></ul>';
  playListHtmlContent += "<script src='playlist.js'></script>" + '</body></html>';
  fs.writeFileSync(`${__dirname}/playlist.html`, playListHtmlContent);
  playlistWindow.loadURL(`file://${__dirname}/playlist.html`);

  ipcMain.on('loadedDir', (event, arg) => {
    currentSongName = arg.substr(arg.lastIndexOf('/') + 1);
    console.log(arg);
    createPlaylistWindow(arg);
  });

  ipcMain.on('loadSongFromPlaylist', (event, arg) => {
    mainWindow.webContents.send('loadSong', arg.toString());
  });

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

function createPlaylistWindow(arg) {
  const list = fs.readdirSync(arg);

  let listContent = '';
  for (let i = 0; i < list.length; i += 1) {
    if (list[i].lastIndexOf('.mp3') >= 0) {
      if (list[i].indexOf(currentSongName) !== -1) {
        listContent += `<li class="playing">${list[i]}</li>\n`;
      } else {
        listContent += `<li>${list[i]}</li>\n`;
      }
    }
  }

  playlistWindow.webContents.send('setList', listContent);
  playlistWindow.webContents.send('setTitle', arg);
  playlistWindow.show();
}
