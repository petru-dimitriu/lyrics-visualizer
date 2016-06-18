'use strict';

const fs = require('fs');
const readline = require('readline');
const EventEmitter = require('events');
require('jquery-ui');
window.$ = window.jQuery = require('jquery');
var remote = require('remote');
var dialog = remote.require('dialog');

var displaySpeed = 100, hideSpeed = 100;
let rl;
let timeUpdate;
let longFlashing = false, fontFlashing = false;
let oldBgColor = "#000";
let oldFont = "arial";
let loadedSongName;

function openSong()
{
	dialog.showOpenDialog(
		function(fileNames)
		{
			if (typeof fileNames === 'undefined')
				return;
			loadSong(fileNames[0]);
		});
}

function loadSong(name)
{
	document.getElementById('music').src = name;
	var start = name.lastIndexOf('\\')+1;
	var stop = name.lastIndexOf('.mp3');
	loadedSongName = name.substr(start,stop);
  rl = readline.createInterface({
  input: fs.createReadStream (name.substr(0,name.lastIndexOf('.mp3'))+'.srt',{encoding: "utf8"})
});
  // TO DO: Find more elegant alternative to using bind!
  rl.on('line',lp.parseLine.bind(lp));
  rl.on('close',lp.sortEvents.bind(lp));
  lp.init();
  displaySpeed = 100, hideSpeed = 100;
}

function LyricsEvent(time, type, text, options)
{
	this.time = time;
	this.type = type;
	this.text = text;
	this.options = options;
}

class LyricsPlayer extends EventEmitter
{
	constructor()
	{
		super();
		this.startTime = 0;
		this.currentTime = function ()
		{
			return Date.now() / 1000 - this.startTime;
		}
	}
	
	init()
	{
		this.eventsList = [];
		this.splitLine =  [];
	}

	play() 
	{
	  $("#music").trigger('play');
	  $("#titlebar").html(loadedSongName);
	  this.startTime = Date.now() / 1000;
	  this.i = 0;
	  var thisObj = this;
	  this.playing = setInterval(function(){
		  thisObj.check();
	  },10);
	  timeUpdate = setInterval(updateTime,500);
	  displaySpeed = 100, hideSpeed = 100;
	}

	parseLine(line)
	{
		this.splitLine = line.split("|");
		
		if (this.eventsList === undefined)
			this.eventsList = [];
		
		console.log(this.splitLine[1]);
		if (['sds', 'shs', 'flash', 'blf', 'elf','bff','eff','belf','eelf'].indexOf(this.splitLine[1]) >= 0)
		{
			console.log('here');
			this.eventsList.push(new LyricsEvent(this.splitLine[0],this.splitLine[1],this.splitLine[2]));
		}
		else
		{
			this.eventsList.push(new LyricsEvent(this.splitLine[0],'display',this.splitLine[2]));
			this.eventsList.push(new LyricsEvent(this.splitLine[1],'hide'));
		}
	}

	check()
	{	
		console.log(this.eventsList[this.i].time);
		if ($("#music").prop('currentTime') > this.eventsList[this.i].time)
		{
			this.emit(this.eventsList[this.i].type,this.eventsList[this.i].text);
			this.i++;
		}
		if (this.i >= this.eventsList.length)
			clearInterval(this.playing);
	}
	
	sortEvents()
	{
		this.eventsList.sort(function (a,b) {
			a.time = parseFloat(a.time+"");
			b.time = parseFloat(b.time+"");
			if (a.time == 0 || b.time == 0)
				return 0;
			return (a.time - b.time);
		});
	}

}

var lp = new LyricsPlayer();
lp.on('display',displayLyric);
lp.on('hide',hideLyric);
lp.on('sds',setDisplaySpeed);
lp.on('shs',setHideSpeed);
lp.on('flash',flash);
lp.on('blf',beginLongFlash);
lp.on('elf',endLongFlash);
lp.on('bff',beginFontFlash);
lp.on('eff',endFontFlash);
lp.on('belf',function(){beginFontFlash(); beginLongFlash();});
lp.on('eelf',function(){endFontFlash(); endLongFlash(); });

function displayLyric(text)
{
	document.getElementById('currentLyric').innerHTML = text;
	$("#currentLyric").animate({opacity:1},displaySpeed);
}

function hideLyric(text)
{
	$("#currentLyric").animate({opacity:0},hideSpeed);
}

function setDisplaySpeed(speed)
{
	displaySpeed = parseInt(speed);
}

function setHideSpeed(speed)
{
	hideSpeed = parseInt(speed);
}

function flash(color)
{
	var oldColor = $("body").css('backgroundColor');
	if (color == 'rand'){
		color = getRandomColor();
	}
	$("body").animate({"backgroundColor" : color}, 200, function(){
		$("body").animate({"backgroundColor" : oldColor},50);
	});
}

function longFlash()
{
	if (longFlashing == false)
	{
		$("body").css('backgroundColor',oldBgColor);
		return;
	}
	$("body").css('backgroundColor',getRandomColor());
	setTimeout(longFlash,50);
}

function beginLongFlash()
{
	longFlashing = true;
	oldBgColor = $("body").css('backgroundColor');
	setTimeout(longFlash,50);
}

function endLongFlash()
{
	longFlashing = false;
}

function fontFlash()
{
	if (fontFlashing == false)
	{
		$("#currentLyric").css('fontFamily',oldFont);
		return;
	}
	$("#currentLyric").css('fontFamily',getRandomFont());
	setTimeout(fontFlash,50);
}

function beginFontFlash()
{
	fontFlashing = true;
	oldFont = $("#currentLyric").css('fontFamily');
	setTimeout(fontFlash,50);
}

function endFontFlash()
{
	fontFlashing = false;
}

function updateTime()
{
	if ($("#music").prop("ended") == true)
		clearInterval(timeUpdate);
	var time = $("#music").prop("currentTime");
	var mins = Math.floor(time / 60);
	var secs = Math.floor(time % 60);
	$("#time").html((mins < 10 ? "0" : "") + mins + ":" + (secs < 10 ? "0" : "") + secs);
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getRandomFont(){
	var fonts = ['arial', 'tahoma', 'comic sans', 'courier new', 'impact','serif','lucida console','gentium'];
	return fonts[Math.floor(Math.random()*7)];
}
