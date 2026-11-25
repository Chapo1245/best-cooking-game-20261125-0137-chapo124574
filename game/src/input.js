// input.js — one job: keyboard + mouse control of the chef.
// WASD/arrows move, E/Space interacts, click walks to a station and uses it,
// M mutes, R restarts after the shift ends.
(function () {
  'use strict';

  var CFG = window.DAPUR_CONFIG;
  var T = CFG.TUNING;

  function createInput(canvas, world, callbacks) {
    var keys = {};
    var target = null; // {x, y, stationId} click-to-move destination

    function keyOf(e) {
      return (e.key || '').toLowerCase();
    }

    function onKeyDown(e) {
      var k = keyOf(e);
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].indexOf(k) >= 0) e.preventDefault();
      if (e.repeat) return;
      keys[k] = true;
      window.DAPUR_AUDIO.unlock();
      if (k === 'e' || k === ' ') {
        target = null;
        var st = window.DAPUR_WORLD.nearestStation(world, T.interactRange);
        if (st) callbacks.onInteract(st);
      }
      if (k === 'm') {
        var muted = window.DAPUR_AUDIO.toggleMute();
        callbacks.onHint(muted ? 'Suara mati (M untuk hidupkan)' : 'Suara hidup');
      }
      if (k === 'r' && world.over) callbacks.onRestart();
    }

    function onKeyUp(e) {
      keys[keyOf(e)] = false;
    }

    function canvasPos(e) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
      };
    }

    function onClick(e) {
      window.DAPUR_AUDIO.unlock();
      var p = canvasPos(e);
      var st = null;
      for (var i = 0; i < CFG.STATIONS.length; i++) {
        var s = CFG.STATIONS[i];
        if (p.x >= s.x - 6 && p.x <= s.x + s.w + 6 && p.y >= s.y - 6 && p.y <= s.y + s.h + 6) { st = s; break; }
      }
      if (st) {
        var c = window.DAPUR_WORLD.stationCenter(st);
        // Walk to a spot just in front of the station, then use it.
        var approachY = c.y + st.h / 2 + T.chefRadius + 8;
        if (approachY > T.canvasH - 30) approachY = c.y - st.h / 2 - T.chefRadius - 8;
        target = { x: c.x, y: approachY, stationId: st.id };
      } else {
        target = { x: Math.max(30, Math.min(T.canvasW - 30, p.x)), y: Math.max(300, Math.min(T.canvasH - 30, p.y)) };
      }
    }

    function step(world, dt) {
      if (world.over || world.busy) return;
      var chef = world.chef;
      var dx = 0;
      var dy = 0;
      if (keys['w'] || keys['arrowup']) dy -= 1;
      if (keys['s'] || keys['arrowdown']) dy += 1;
      if (keys['a'] || keys['arrowleft']) dx -= 1;
      if (keys['d'] || keys['arrowright']) dx += 1;
      if (dx !== 0 || dy !== 0) {
        target = null;
        step._pendingStation = null;
        var len = Math.sqrt(dx * dx + dy * dy);
        chef.x += (dx / len) * T.chefSpeed * dt;
        chef.y += (dy / len) * T.chefSpeed * dt;
        chef.dir = dx !== 0 ? (dx > 0 ? 1 : -1) : chef.dir;
        chef.moving = true;
      } else if (target) {
        var tx = target.x - chef.x;
        var ty = target.y - chef.y;
        var dist = Math.sqrt(tx * tx + ty * ty);
        if (dist < 6) {
          target = null;
          chef.moving = false;
        } else {
          chef.x += (tx / dist) * T.chefSpeed * dt;
          chef.y += (ty / dist) * T.chefSpeed * dt;
          chef.dir = tx !== 0 ? (tx > 0 ? 1 : -1) : chef.dir;
          chef.moving = true;
        }
      } else {
        chef.moving = false;
      }
      // Keep the chef on the floor, out of the counters and the order board.
      chef.x = Math.max(28, Math.min(T.canvasW - 28, chef.x));
      chef.y = Math.max(292, Math.min(T.canvasH - 28, chef.y));
      // Arrived: if we just cleared a station target, interact.
      if (!target && step._pendingStation) {
        var stId = step._pendingStation;
        step._pendingStation = null;
        var st = window.DAPUR_WORLD.stationById(stId);
        if (st) callbacks.onInteract(st);
      }
    }

    // Wrap: remember which station a click target belongs to.
    var rawOnClick = onClick;
    onClick = function (e) {
      var before = target;
      rawOnClick(e);
      if (target && target.stationId) step._pendingStation = target.stationId;
      else step._pendingStation = null;
    };

    canvas.addEventListener('click', onClick);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return { step: step, keys: keys };
  }

  window.DAPUR_INPUT = { createInput: createInput };
})();
