'use strict';

const electron = require('electron');
// Module to control application life.
const {ipcMain} = require('electron');

const fs = require('fs');

const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, mainWindow2, playlistWindow;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 100});

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  
ipcMain.on('loadedSong', (event, arg) => {
  arg = arg.substr(0,arg.lastIndexOf('/'));
  createPlaylistWindow(arg);
});

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
    
});

function createPlaylistWindow (arg) {
    playlistWindow = new BrowserWindow({width: 500, height: 500, parent: mainWindow});
    var list = fs.readdirSync(arg);
    var playListHtmlContent = "<!DOCTYPE html>\n<html>\n<header><meta charset = 'UTF-8'>\n<link rel='stylesheet' href='style.css'></header>\n<script>\nvar remote = require('remote');\n</script>\n<body>\n<ul>";

    playListHtmlContent += "<h3>Title</h3>";
    for (var i = 0; i<list.length; i++) {
        if (list[i].lastIndexOf('.mp3') >= 0)
            playListHtmlContent += '<li>' + list[i] + '</li>\n';
    }
    playListHtmlContent += "</ul></body></html>";
    fs.writeFileSync(__dirname + "/playlist.html",playListHtmlContent);
    playlistWindow.loadURL('file://' + __dirname + '/playlist.html');
    playlistWindow.on('closed', function() {
    playlistWindow = null;
  });
}

