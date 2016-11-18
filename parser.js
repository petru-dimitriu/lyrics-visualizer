

// REQUIRES

const fs = require('fs');
const readline = require('readline');
const EventEmitter = require('events');
const { ipcRenderer } = require('electron');
window.$ = window.jQuery = require('jquery');
require('jquery-ui');
const remote = require('electron').remote;
const { dialog } = require('electron').remote;

let displaySpeed = 100,
  hideSpeed = 100;
let lineRead;
let timeUpdate;
let longFlashing = false,
  fontFlashing = false;
let oldBgColor = '#000';
let oldFont = 'arial';
let loadedSongName;

const animationStyle = 'FADE';

function resetDisplay() {
  displaySpeed = 100, hideSpeed = 100;
  longFlashing = false;
  fontFlashing = false;
  oldBgColor = '#000';
  oldFont = 'arial';
  hideLyric();
  $('body').animate({ backgroundColor: oldBgColor }, 50);
}

function displayLoadDirDialog(defaultPath) {
  dialog.showOpenDialog(
		null,
    {
      defaultPath,
      properties: ['openDirectory'],
    },
		(fileNames) => {
  if (typeof fileNames === 'undefined')				{
    return;
  }
  ipcRenderer.send('loadedDir', fileNames[0]);
},
	);
}

function playSong() {
  if (lyricsPlayer.playing) {
    lyricsPlayer.pause();
    lyricsPlayer.playing = false;
    $('#playButton').html('Play');
  } else {
    lyricsPlayer.play();
    lyricsPlayer.playing = true;
    $('#playButton').html('Pause');
  }
}

function loadSong(name) {
  resetDisplay();
  $('#music').prop('src', name);

  let start = name.lastIndexOf('\\') + 1;
  if (start == 0)		{
    start = name.lastIndexOf('/') + 1;
  }

  const stop = name.lastIndexOf('.mp3');
  loadedSongName = name.substr(start, stop);
  lineRead = readline.createInterface({
 			 input: fs.createReadStream(`${name.substr(0, name.lastIndexOf('.mp3'))}.srt`, { encoding: 'utf8' }),
  });
  	// TO DO: Find more elegant alternative to using bind!
  lineRead.on('line', lyricsPlayer.parseLine.bind(lyricsPlayer));
  	lineRead.on('close', lyricsPlayer.sortEvents.bind(lyricsPlayer));
  	lyricsPlayer.init();
  	displaySpeed = 100, hideSpeed = 100;
}

function LyricsEvent(time, type, text, options) {
  this.time = time;
  this.type = type;
  this.text = text;
  this.options = options;
}

class LyricsPlayer extends EventEmitter
{
  constructor()	{
    super();
    this.startTime = 0;
    this.currentTime = function ()		{
      return Date.now() / 1000 - this.startTime;
    };
  }

  init()	{
    this.playingIntervalHandler = false;
    this.eventsList = [];
    this.splitLine = [];
    	slider = new Slider();
    	slider.init(
			'#slider',
			$('#music').prop('duration'),
		);

    $('.upperbar').click((e) => {
      const total = $('#music').prop('duration');
      lyricsPlayer.seek(parseInt(e.pageX / slider.getWidth() * total));
    });
  }

  play()	{
	  $('#music').trigger('play');
	  $('#titlebar').html(loadedSongName);
	  this.startTime = Date.now() / 1000;
	  this.indexOfCurrentEvent = 0;
	  const thisObj = this;
	  this.playingIntervalHandler = setInterval(() => {
		  thisObj.check();
	  }, 10);
	  timeUpdate = setInterval(updateTime, 50);
	  displaySpeed = 100, hideSpeed = 100;
  }

  pause()	{
    $('#music').trigger('pause');
  }

  parseLine(line)	{
    this.splitLine = line.split('|');

    if (this.eventsList === undefined) {
      this.eventsList = [];
    }

    console.log(this.splitLine[1]);
    if (['sds', 'shs', 'flash', 'blf', 'elf', 'bff', 'eff', 'belf', 'eelf', 'chl'].indexOf(this.splitLine[1]) >= 0) {
      this.eventsList.push(new LyricsEvent(this.splitLine[0], this.splitLine[1], this.splitLine[2]));
    } else {
      this.eventsList.push(new LyricsEvent(this.splitLine[0], 'display', this.splitLine[2]));
      this.eventsList.push(new LyricsEvent(this.splitLine[1], 'hide'));
    }
  }

  seek(newTime) {
    let lastEventType;
    $('#music').prop('currentTime', newTime);
    resetDisplay();
    this.indexOfCurrentEvent = 0;
    while (this.indexOfCurrentEvent < this.eventsList.length - 1 && this.eventsList[this.indexOfCurrentEvent + 1].time < newTime) {
      lastEventType = this.eventsList[this.indexOfCurrentEvent].type;

      if (this.eventsList[this.indexOfCurrentEvent].type == 'sds') {
        setDisplaySpeed(this.eventsList[this.indexOfCurrentEvent].text);
      } else if (this.eventsList[this.indexOfCurrentEvent].type == 'shs') {
        setHideSpeed(this.eventsList[this.indexOfCurrentEvent].text);
      }

      this.indexOfCurrentEvent ++;
    }

    if (lastEventType !== undefined && lastEventType.charAt(0) == 'b')			{
      this.emit(lastEventType);
    }
  }

  check()	{
    if ($('#music').prop('currentTime') > this.eventsList[this.indexOfCurrentEvent].time)		{
      this.emit(this.eventsList[this.indexOfCurrentEvent].type, this.eventsList[this.indexOfCurrentEvent].text);
      this.indexOfCurrentEvent++;
    }
    if (this.indexOfCurrentEvent >= this.eventsList.length)			{ clearInterval(this.playingIntervalHandler); }
  }

  sortEvents()	{
    this.eventsList.sort((a, b) => {
      a.time = parseFloat(`${a.time}`);
      b.time = parseFloat(`${b.time}`);
      if (a.time == 0 || b.time == 0)				{
        return 0;
      }
      return (a.time - b.time);
    });
  }
}

let lyricsPlayer = new LyricsPlayer();
lyricsPlayer.on('display', displayLyric);
lyricsPlayer.on('hide', hideLyric);
lyricsPlayer.on('sds', setDisplaySpeed);
lyricsPlayer.on('shs', setHideSpeed);
lyricsPlayer.on('flash', flash);
lyricsPlayer.on('blf', beginLongFlash);
lyricsPlayer.on('elf', endLongFlash);
lyricsPlayer.on('bff', beginFontFlash);
lyricsPlayer.on('eff', endFontFlash);
lyricsPlayer.on('belf', () => { beginFontFlash(); beginLongFlash(); });
lyricsPlayer.on('eelf', () => { endFontFlash(); endLongFlash(); });
lyricsPlayer.on('chl', changeLyric);

ipcRenderer.on('loadSong', (evt, songName) => {
  loadSong(songName);
  lyricsPlayer.pause();
  lyricsPlayer.play();
});

function changeLyric(text) {
  if (text.trim() == '') {
    hideLyric();
  } else if ($('#currentLyric').html() == '')		{ displayLyric(text); } else {
    animateChange(text);
  }
}

function displayLyric(text) {
  $('#currentLyric').html(text);
  animateIn();
}

function hideLyric(text) {
  animateOut();
}

function setDisplaySpeed(speed) {
  displaySpeed = parseInt(speed);
}

function setHideSpeed(speed) {
  hideSpeed = parseInt(speed);
}

function flash(color) {
  const oldColor = $('body').css('backgroundColor');
  if (color == 'rand') {
    color = getRandomColor();
  }
  $('body').animate({ backgroundColor: color }, 200, () => {
    $('body').animate({ backgroundColor: oldColor }, 50);
  });
}

function longFlash() {
  if (longFlashing == false) {
    $('body').css('backgroundColor', oldBgColor);
    return;
  }
  $('body').css('backgroundColor', getRandomColor());
  setTimeout(longFlash, 50);
}

function beginLongFlash() {
  longFlashing = true;
  oldBgColor = $('body').css('backgroundColor');
  setTimeout(longFlash, 50);
}

function endLongFlash() {
  longFlashing = false;
}

function fontFlash() {
  if (fontFlashing == false)	{
    $('#currentLyric').css('fontFamily', oldFont);
    return;
  }
  $('#currentLyric').css('fontFamily', getRandomFont());
  setTimeout(fontFlash, 50);
}

function beginFontFlash() {
  fontFlashing = true;
  setTimeout(fontFlash, 50);
}

function endFontFlash() {
  fontFlashing = false;
}

function updateTime() {
  if ($('#music').prop('ended') == true) {
    clearInterval(timeUpdate);
  }
  const time = $('#music').prop('currentTime');
  const total = $('#music').prop('duration');
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  $('#time').html(`${(mins < 10 ? '0' : '') + mins}:${secs < 10 ? '0' : ''}${secs}`);
  slider.setValue(time, total);
  visualizeAudio();
}

function getRandomColor() {
  const letters = '0123456789ABCDEF'.split('');
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function getRandomFont() {
  const fonts = ['arial', 'tahoma', 'comic sans', 'courier new', 'impact', 'serif', 'lucida console', 'gentium'];
  return fonts[Math.floor(Math.random() * 7)];
}


function animateIn() {
  if (animationStyle == 'FADE')		{ $('#currentLyric').animate({ opacity: 1 }, displaySpeed); } else if (animationStyle == 'ROLL') {
    $('#currentLyric').css('top', '100vh');
    $('#currentLyric').animate({ top: '30vh' }, displaySpeed);
  }
}

function animateOut() {
  if (animationStyle == 'FADE')		{
    $('#currentLyric').animate({ opacity: 0 }, hideSpeed, emptyLyricText);
  } else if (animationStyle == 'ROLL') {
    $('#currentLyric').animate({ top: '-30vh' }, hideSpeed, emptyLyricText);
  }
}

function animateChange(text) {
  if (animationStyle == 'FADE') {
    $('#currentLyric').animate({ opacity: 0 }, 100,
			() => {
  $('#currentLyric').html(text);
  $('#currentLyric').animate({ opacity: 1 }, 100);
});
  } else if (animationStyle == 'ROLL') {
    $('#currentLyric').animate({ top: '-30vh' }, 70,
			() => {
  $('#currentLyric').html(text);
  $('#currentLyric').css('top', '100vh');
  $('#currentLyric').animate({ top: '30vh', opacity: 1 }, 70);
});
  }
}

function emptyLyricText() {
  $('#currentLyric').html('');
}
