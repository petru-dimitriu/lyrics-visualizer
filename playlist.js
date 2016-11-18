/* eslint-env node, jquery, browser */

const { ipcRenderer } = require('electron');

window.$ = window.jQuery = require('jquery');
require('jquery-ui');

function setList(listContents) {
  $('ul').html(listContents);
  $('li').click(
    function () {
      ipcRenderer.send('loadSongFromPlaylist', `${$('h3').html()}/${$(this).html()}`);
    });
}

function setTitle(titleContents) {
  $('h3').html(titleContents);
}

ipcRenderer.on('setList', (evt, listContents) => { setList(listContents); });
ipcRenderer.on('setTitle', (evt, listTitle) => { setTitle(listTitle); });
