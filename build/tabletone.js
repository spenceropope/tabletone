// Generated by CoffeeScript 1.9.1
(function() {
  var addAudio, addPulseAnalyser, audios, buffercache, clickHandler, ctx, drawAnalyser, maybeFetch, removeAudio;

  ctx = new (window.AudioContext || window.webkitAudioContext);

  audios = [];

  buffercache = {};

  maybeFetch = function(src) {
    if (buffercache[src]) {
      return Promise.resolve(buffercache[src]);
    } else {
      return fetch(src).then(function(response) {
        return response.arrayBuffer();
      }).then(function(audioData) {
        return new Promise(function(accept) {
          return ctx.decodeAudioData(audioData, accept);
        });
      }).then(function(buffer) {
        buffercache[src] = buffer;
        return buffer;
      });
    }
  };

  addAudio = function(src) {
    return maybeFetch(src).then(function(buffer) {
      var node;
      node = ctx.createBufferSource();
      node.buffer = buffer;
      node.loop = true;
      node.connect(ctx.destination);
      audios.push(node);
      node.start(0, ctx.currentTime % buffer.duration, Math.pow(2, 16));
      return node;
    });
  };

  removeAudio = function(audio) {
    var idx;
    idx = audios.indexOf(audio);
    audio.disconnect();
    audio.stop(0);
    if (idx > -1) {
      audios.splice(idx, 1);
    }
    return audio;
  };

  drawAnalyser = function(analyser, pulse) {
    var ary, draw, max, min;
    analyser.fftSize = 512;
    ary = new Float32Array(analyser.fftSize);
    min = null;
    max = null;
    draw = function() {
      return requestAnimationFrame(function() {
        var avg, i, len, val;
        analyser.getFloatTimeDomainData(ary);
        avg = 0;
        for (i = 0, len = ary.length; i < len; i++) {
          val = ary[i];
          avg += Math.abs(val);
        }
        avg /= ary.length;
        if (!min || avg < min) {
          min = avg;
        }
        if (!max || avg > max) {
          max = avg;
        }
        val = Math.round(Math.min((avg - min) / (max - min), 1) * 1000) / 1000;
        pulse.style.opacity = 1 - val;
        if (!analyser.finished) {
          return draw();
        }
      });
    };
    return draw();
  };

  addPulseAnalyser = function(el) {
    var analyser, pulse;
    analyser = ctx.createAnalyser();
    el.audio.connect(analyser);
    el.analyser = analyser;
    el.innerHTML = "";
    pulse = document.createElement('tt-pulse');
    el.appendChild(pulse);
    return drawAnalyser(analyser, pulse);
  };

  clickHandler = function(e) {
    var ref;
    if (this.playing) {
      removeAudio(this.audio);
      this.innerHTML = "";
      if ((ref = this.analyser) != null) {
        ref.finished = true;
      }
      this.playing = false;
      return this.classList.remove('playing');
    } else {
      return addAudio(this.src).then((function(_this) {
        return function(node) {
          _this.classList.add('playing');
          _this.audio = node;
          if (_this.pulse) {
            addPulseAnalyser(_this);
          }
          return _this.playing = true;
        };
      })(this));
    }
  };

  (function() {
    var el, i, len, ref, results;
    ref = document.querySelectorAll('tt-cell');
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      el = ref[i];
      if (el.tabletone) {
        continue;
      }
      el.tabletone = true;
      el.src = el.getAttribute('src');
      el.pulse = el.getAttribute('pulse') != null;
      el.playing = false;
      results.push(el.addEventListener('click', clickHandler));
    }
    return results;
  })();

}).call(this);
