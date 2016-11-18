const { ipcRenderer } = require('electron');

window.$ = window.jQuery = require('jquery');
require('jquery-ui');

ipcRenderer.on('setList', (evt, listContents) => { setList(listContents); });
ipcRenderer.on('setTitle', (evt, listTitle) => { setTitle(listTitle); });

function setList(listContents) {
  $('ul').html(listContents);
  $('li').click(
    function () {
      ipcRenderer.send('loadSongFromPlaylist', `${$('h3').html()}/${$(this).html()}`);
    },
    );
}

function setTitle(titleContents) {
  $('h3').html(titleContents);
}

