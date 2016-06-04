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
  rl = readline.createInterface({
  input: fs.createReadStream (name.substr(0,name.lastIndexOf('.mp3'))+'.srt',{encoding: "utf8"})
});
  // TO DO: Find more elegant alternative to using bind!
  rl.on('line',lp.parseLine.bind(lp));
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
		this.eventsList = [];
		this.splitLine =  [];
		this.startTime = 0;
		this.currentTime = function ()
		{
			return Date.now() / 1000 - this.startTime;
		}
	}

	play() 
	{
	  document.getElementById('music').play();
	  this.startTime = Date.now() / 1000;
	  this.i = 0;
	  var thisObj = this;
	  this.playing = setInterval(function(){
		  thisObj.check();
	  },10);
	  timeUpdate = setInterval(updateTime,500);
	}

	parseLine(line)
	{
		this.splitLine = line.split("|");
		
		if (this.eventsList === undefined)
			this.eventsList = [];
		
		console.log(this.eventsList);
		console.log(this == lp);
		
		if (this.splitLine[1] == 'sds') // set display speed
		{
			this.eventsList.push(new LyricsEvent(this.splitLine[0],'sds',this.splitLine[2]));
		}
		else if (this.splitLine[1] == 'shs') // set hide speed
		{
			this.eventsList.push(new LyricsEvent(this.splitLine[0],'shs',this.splitLine[2]));
		}
		else if (this.splitLine[1] == 'flash') // flash
		{
			this.eventsList.push(new LyricsEvent(this.splitLine[0],'flash',this.splitLine[2]));
		}
		else
		{
			this.eventsList.push(new LyricsEvent(this.splitLine[0],'display',this.splitLine[2]));
			this.eventsList.push(new LyricsEvent(this.splitLine[1],'hide'));
		}
	}

	check()
	{	
		if (this.currentTime() > this.eventsList[this.i].time)
		{
			this.emit(this.eventsList[this.i].type,this.eventsList[this.i].text);
			this.i++;
		}
		if (this.i >= this.eventsList.length)
			clearInterval(this.playing);
	}

}

var lp = new LyricsPlayer();
lp.on('display',displayLyric);
lp.on('hide',hideLyric);
lp.on('sds',setDisplaySpeed);
lp.on('shs',setHideSpeed);
lp.on('flash',flash)

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
	$("body").animate({"backgroundColor" : color}, 200, function(){
		$("body").animate({"backgroundColor" : oldColor},50);
	});
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