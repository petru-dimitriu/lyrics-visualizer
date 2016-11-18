
function initAudioVisualization() {
  audioContext = new window.AudioContext();

  mediaSource = document.getElementById('music');
  mediaSource.crossOrigin = 'anonymous';

  audioSource = audioContext.createMediaElementSource(mediaSource);

  analyser = audioContext.createAnalyser();
  analyser.minDecibels = -90;
  analyser.maxDecibels = -10;
  analyser.smoothingTimeConstant = 0.85;

  audioSource.connect(analyser);
  audioSource.connect(audioContext.destination);
}

function visualizeAudio() {
  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);
  analyser.getFloatFrequencyData(dataArray);
  let avg = 0;
  for (let i = 0; i < 2; i++) {
    avg += dataArray[i] / (2);
  }
  avg += 140;
  $('#titlebar').html(Math.floor(avg));
  let beatChangeAux = (avg - 95) / 25;
  if (beatChangeAux < 0.3) {
    beatChangeAux = 0;
  }
  const beatChange = Math.floor(beatChangeAux * 200);
  $('body').css('background-color', `rgb(${0},${0},${beatChange})`);
}
