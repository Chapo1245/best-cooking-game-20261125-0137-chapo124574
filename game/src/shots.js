// shots.js — one job: staged, deterministic scenes for the screenshots.
// Each shot builds a fixed kitchen state (no randomness, no clock drift) so a
// screenshot taken twice shows the same game. Real play never uses these.
(function () {
  'use strict';

  var W = window.DAPUR_WORLD;
  var CFG = window.DAPUR_CONFIG;

  function baseWorld(seed) {
    var world = W.createWorld(seed);
    world.orders = [];
    return world;
  }

  function order(recipeId, patience) {
    var recipe = W.recipeById(recipeId);
    return { id: 'shot-' + recipeId, recipe: recipe, patience: patience, maxPatience: 75, born: 0 };
  }

  function applyShot(world, name) {
    world.time = 0;
    if (name === 'cover') {
      // Criterion 1, all six at once: kitchen + order board + ingredients on the
      // counter + a dish mid-assembly + a timer + a plate ready to serve.
      world.dayLeft = 151;
      world.score = 1250;
      world.coins = 84;
      world.combo = 3;
      world.bestCombo = 3;
      world.comboTimer = 20;
      world.orders = [order('nasi-ayam', 62), order('geprek', 48), order('nasgor', 71)];
      world.chef.x = 630;
      world.chef.y = 500;
      world.chef.carrying = W.newItem('chicken', 'cooked');
      var plate = W.newPlate();
      plate.items = [W.newItem('rice', 'cooked'), W.newItem('chicken', 'cooked')];
      world.plate = plate; // complete Nasi Ayam Lada, ready to serve
      world.stationFx.wok = { kind: 'sizzle', t: 0.4 };
      world.stationFx.board = { kind: 'chopping', t: 0.3 };
      W.addPopup(world, 1070, 300, '+120', '#ffd94a');
    } else if (name === 'rush') {
      world.rush = true;
      world.dayLeft = 65;
      world.score = 1980;
      world.coins = 132;
      world.combo = 5;
      world.bestCombo = 5;
      world.comboTimer = 18;
      world.orders = [order('geprek', 18), order('tumis', 24), order('nasgor', 31)];
      world.banner = { text: 'RUSH HOUR! Pesanan datang lebih cepat!', t: 0.5 };
      world.chef.x = 170;
      world.chef.y = 470;
      world.chef.carrying = W.newItem('veg', 'chopped');
      world.busy = { stationId: 'board', label: 'MEMOTONG SAYUR', t: 0.7, dur: 1.2, done: function () {} };
      world.stationFx.wok = { kind: 'sizzle', t: 0.2 };
      W.addPopup(world, 640, 620, 'KOMBO x5!', '#ff8a5c');
    } else if (name === 'serve') {
      world.dayLeft = 98;
      world.score = 2430;
      world.coins = 161;
      world.combo = 4;
      world.bestCombo = 6;
      world.comboTimer = 22;
      world.orders = [order('tumis', 55), order('nasi-ayam', 66)];
      world.chef.x = 1070;
      world.chef.y = 540;
      world.chef.carrying = null;
      world.serveFlash = { text: 'AYAM GEPREK SENJA TERHIDANG!', t: 0.3 };
      W.addPopup(world, 1070, 500, '+180  ·  +17 koin', '#ffd94a');
      W.addPopup(world, 640, 620, 'PESANAN SELESAI!', '#7be495');
    } else if (name === 'end') {
      world.dayLeft = 0;
      world.score = 3120;
      world.coins = 214;
      world.served = 14;
      world.missed = 2;
      world.bestCombo = 6;
      world.combo = 0;
      world.over = true;
      world.won = true;
      world.orders = [];
      world.chef.x = 640;
      world.chef.y = 520;
    } else {
      return false;
    }
    return true;
  }

  window.DAPUR_SHOTS = { applyShot: applyShot };
})();
