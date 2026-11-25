// main.js — one job: boot the game, run its loop, and prove it works headless.
// ?shot=cover|rush|serve|end draws one frozen scene for screenshots.
// ?selftest=1 runs the rules headless and writes PASS/FAIL into the title.
(function () {
  'use strict';

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var params = new URLSearchParams(window.location.search);
  var world = window.DAPUR_WORLD.createWorld(20261125);
  var hintText = world.hint;

  function setHint(s) {
    hintText = s;
    world.hint = s;
  }

  var input = window.DAPUR_INPUT.createInput(canvas, world, {
    onInteract: function (st) {
      var res = window.DAPUR_WORLD.interact(world, st);
      var hints = {
        'hands-full': 'Tangan penuh — sajikan atau buang dulu',
        'need-ingredient': 'Ambil bahan mentah dari rak dulu',
        'no-chop': 'Bahan ini tidak perlu dipotong',
        'already-cooked': 'Sudah matang — bawa ke piring saji',
        'not-cooked': 'Masak dulu di wok sebelum dirakit',
        'plate-full': 'Piring penuh (maks 3 bahan)',
        'plate-here': 'Sudah ada piring di meja rakit',
        'hands-empty': 'Tidak ada yang dibuang',
        'empty-plate': 'Meja rakit kosong — bawa bahan matang ke sini',
        'busy': 'Tunggu sebentar…'
      };
      setHint(hints[res] || world.hint);
      if (res === 'served' || res === 'wrong' || res === 'no-order') {
        setTimeout(function () { setHint(world.hint); }, 2500);
      }
    },
    onHint: setHint,
    onRestart: function () {
      world = window.DAPUR_WORLD.createWorld(20261125);
      setHint(world.hint);
    }
  });

  function frame(now) {
    var dt = Math.min(0.05, (now - frame._last) / 1000 || 0.016);
    frame._last = now;
    input.step(world, dt);
    window.DAPUR_WORLD.update(world, dt);
    window.DAPUR_RENDER.drawGame(ctx, world, now / 1000);
    requestAnimationFrame(frame);
  }
  frame._last = 0;

  function selftest() {
    var results = [];
    function check(name, ok) {
      results.push((ok ? 'PASS ' : 'FAIL ') + name);
    }
    try {
      var w = window.DAPUR_WORLD.createWorld(7);
      check('world starts with zero score', w.score === 0);
      check('recipe match nasi-ayam', window.DAPUR_WORLD.recipeForItems(['chicken', 'rice']).id === 'nasi-ayam');
      check('recipe match nasgor', window.DAPUR_WORLD.recipeForItems(['chili', 'rice', 'egg']).id === 'nasgor');
      check('recipe mismatch rejected', window.DAPUR_WORLD.recipeForItems(['rice', 'egg']) === null);
      // Full pipeline: pick rice -> cook -> plate -> pick chicken -> chop -> cook -> plate -> serve.
      var stBinRice = window.DAPUR_WORLD.stationById('bin-rice');
      var stWok = window.DAPUR_WORLD.stationById('wok');
      var stPlate = window.DAPUR_WORLD.stationById('plating');
      var stServe = window.DAPUR_WORLD.stationById('serve');
      var stBoard = window.DAPUR_WORLD.stationById('board');
      var stBinChicken = window.DAPUR_WORLD.stationById('bin-chicken');
      window.DAPUR_WORLD.interact(w, stBinRice);
      check('pick rice', w.chef.carrying && w.chef.carrying.id === 'rice');
      window.DAPUR_WORLD.interact(w, stWok);
      check('cooking starts', !!w.busy);
      window.DAPUR_WORLD.update(w, 3);
      check('rice cooked', w.chef.carrying.stage === 'cooked');
      window.DAPUR_WORLD.interact(w, stPlate);
      check('rice plated', w.plate && w.plate.items.length === 1);
      window.DAPUR_WORLD.interact(w, stBinChicken);
      window.DAPUR_WORLD.interact(w, stBoard);
      window.DAPUR_WORLD.update(w, 3);
      check('chicken chopped', w.chef.carrying.stage === 'chopped');
      window.DAPUR_WORLD.interact(w, stWok);
      window.DAPUR_WORLD.update(w, 3);
      check('chicken cooked', w.chef.carrying.stage === 'cooked');
      window.DAPUR_WORLD.interact(w, stPlate);
      check('plate has two items', w.plate.items.length === 2);
      window.DAPUR_WORLD.interact(w, stPlate);
      check('plate picked up', w.chef.carrying && w.chef.carrying.kind === 'plate');
      w.orders = [{ id: 't1', recipe: window.DAPUR_WORLD.recipeById('nasi-ayam'), patience: 60, maxPatience: 75, born: 0 }];
      var before = w.score;
      var res = window.DAPUR_WORLD.interact(w, stServe);
      check('serve matches order', res === 'served' && w.score > before && w.served === 1);
      check('order removed', w.orders.length === 0);
      // Order expiry.
      var w2 = window.DAPUR_WORLD.createWorld(8);
      window.DAPUR_WORLD.spawnOrder(w2);
      check('order spawns', w2.orders.length === 1);
      window.DAPUR_WORLD.update(w2, 200);
      check('day ends', w2.over === true);
    } catch (e) {
      results.push('FAIL exception: ' + e.message);
    }
    var fails = results.filter(function (r) { return r.indexOf('FAIL') === 0; }).length;
    document.title = (fails === 0 ? 'SELFTEST PASS' : 'SELFTEST FAIL') + ' (' + (results.length - fails) + '/' + results.length + ')';
    var div = document.createElement('div');
    div.id = 'selftest';
    div.textContent = results.join(' | ');
    document.body.appendChild(div);
  }

  var shot = params.get('shot');
  if (params.get('selftest') === '1') {
    selftest();
    window.DAPUR_RENDER.drawGame(ctx, world, 0);
    document.title += ' · ready';
  } else if (shot && window.DAPUR_SHOTS.applyShot(world, shot)) {
    window.DAPUR_RENDER.drawGame(ctx, world, 1.0);
    document.title = 'SHOT ' + shot + ' · ready';
  } else {
    // Live play: seed a couple of orders so the board is never empty at start.
    window.DAPUR_WORLD.spawnOrder(world);
    window.DAPUR_WORLD.spawnOrder(world);
    requestAnimationFrame(frame);
  }
})();
