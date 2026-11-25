// world.js — one job: the kitchen state and every rule that changes it.
// The chef, the plate, the orders, the clock. Rendering never mutates state.
(function () {
  'use strict';

  var CFG = window.DAPUR_CONFIG;
  var T = CFG.TUNING;

  function newItem(id, stage) {
    return { id: id, stage: stage || 'raw' }; // stage: raw | chopped | cooked
  }

  function newPlate() {
    return { kind: 'plate', items: [] };
  }

  function recipeById(id) {
    for (var i = 0; i < CFG.RECIPES.length; i++) {
      if (CFG.RECIPES[i].id === id) return CFG.RECIPES[i];
    }
    return null;
  }

  function recipeForItems(itemIds) {
    var sorted = itemIds.slice().sort();
    for (var i = 0; i < CFG.RECIPES.length; i++) {
      var needs = CFG.RECIPES[i].needs.slice().sort();
      if (needs.length !== sorted.length) continue;
      var match = true;
      for (var j = 0; j < needs.length; j++) {
        if (needs[j] !== sorted[j]) { match = false; break; }
      }
      if (match) return CFG.RECIPES[i];
    }
    return null;
  }

  function createWorld(seed) {
    var rng = window.DAPUR_RANDOM.mulberry32(seed || 20261125);
    return {
      rng: rng,
      time: 0,
      dayLeft: T.daySeconds,
      score: 0,
      coins: 0,
      served: 0,
      missed: 0,
      combo: 0,
      bestCombo: 0,
      comboTimer: 0,
      rush: false,
      over: false,
      won: false,
      orders: [],
      spawnTimer: 4,
      chef: { x: 640, y: 520, dir: 1, moving: false, carrying: null },
      busy: null, // {stationId, label, t, dur, done}
      plate: null, // plate resting on the plating counter
      serveFlash: null, // {text, t}
      popups: [], // {x, y, text, color, t}
      stationFx: {}, // stationId -> {kind, t}
      banner: null, // {text, t}
      hint: 'WASD / panah gerak · E / Spasi aksi · klik station untuk jalan ke sana'
    };
  }

  function stationById(id) {
    for (var i = 0; i < CFG.STATIONS.length; i++) {
      if (CFG.STATIONS[i].id === id) return CFG.STATIONS[i];
    }
    return null;
  }

  function stationCenter(st) {
    return { x: st.x + st.w / 2, y: st.y + st.h / 2 };
  }

  function nearestStation(world, maxDist) {
    var best = null;
    var bestD = maxDist;
    for (var i = 0; i < CFG.STATIONS.length; i++) {
      var st = CFG.STATIONS[i];
      var c = stationCenter(st);
      var dx = world.chef.x - c.x;
      var dy = world.chef.y - c.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestD) { bestD = d; best = st; }
    }
    return best;
  }

  function addPopup(world, x, y, text, color) {
    world.popups.push({ x: x, y: y, text: text, color: color || '#fff', t: 0 });
    if (world.popups.length > 8) world.popups.shift();
  }

  function spawnOrder(world) {
    if (world.orders.length >= T.maxOrders) return;
    var recipe = window.DAPUR_RANDOM.pick(world.rng, CFG.RECIPES);
    var patience = world.rush ? T.orderPatienceRush : T.orderPatience;
    world.orders.push({
      id: 'o' + Math.floor(world.time * 1000) + '-' + world.orders.length,
      recipe: recipe,
      patience: patience,
      maxPatience: patience,
      born: world.time
    });
    window.DAPUR_AUDIO.play('order');
  }

  function servePlate(world) {
    var carried = world.chef.carrying;
    if (!carried || carried.kind !== 'plate') return 'no-plate';
    var ids = carried.items.map(function (it) { return it.id; });
    var recipe = recipeForItems(ids);
    if (!recipe) {
      world.combo = 0;
      world.score = Math.max(0, world.score - T.wrongServePenalty);
      addPopup(world, 1070, 540, 'BUKAN RESEP! -' + T.wrongServePenalty, '#ff6b5e');
      window.DAPUR_AUDIO.play('bad');
      return 'wrong';
    }
    var orderIdx = -1;
    for (var i = 0; i < world.orders.length; i++) {
      if (world.orders[i].recipe.id === recipe.id) { orderIdx = i; break; }
    }
    if (orderIdx < 0) {
      world.combo = 0;
      world.score = Math.max(0, world.score - T.wrongServePenalty);
      addPopup(world, 1070, 540, 'TAK ADA YANG PESAN! -' + T.wrongServePenalty, '#ff6b5e');
      window.DAPUR_AUDIO.play('bad');
      return 'no-order';
    }
    var order = world.orders[orderIdx];
    world.orders.splice(orderIdx, 1);
    world.combo += 1;
    world.bestCombo = Math.max(world.bestCombo, world.combo);
    world.comboTimer = T.comboWindow;
    var patienceBonus = Math.round(60 * (order.patience / order.maxPatience));
    var gain = recipe.score + patienceBonus + (world.combo - 1) * 25;
    var coinGain = recipe.coins + Math.min(world.combo - 1, 5);
    world.score += gain;
    world.coins += coinGain;
    world.served += 1;
    world.serveFlash = { text: recipe.name.toUpperCase() + ' TERHIDANG!', t: 0 };
    addPopup(world, 1070, 520, '+' + gain + '  ·  +' + coinGain + ' koin', '#ffd94a');
    window.DAPUR_AUDIO.play('serve');
    world.chef.carrying = null;
    return 'served';
  }

  // What E/Space does at a station. Returns a short status string for the HUD hint.
  function interact(world, st) {
    if (!st || world.busy || world.over) return 'busy';
    var chef = world.chef;
    var carried = chef.carrying;

    if (st.kind === 'bin') {
      if (carried) return 'hands-full';
      chef.carrying = newItem(st.item, 'raw');
      window.DAPUR_AUDIO.play('pickup');
      return 'picked-' + st.item;
    }

    if (st.kind === 'board') {
      if (!carried || carried.kind === 'plate') return 'need-ingredient';
      var ing = CFG.INGREDIENTS[carried.id];
      if (carried.stage !== 'raw' || !ing.chop) return 'no-chop';
      world.busy = { stationId: st.id, label: 'MEMOTONG ' + ing.name.toUpperCase(), t: 0, dur: ing.chop,
        done: function () { chef.carrying.stage = 'chopped'; window.DAPUR_AUDIO.play('chop'); } };
      return 'chopping';
    }

    if (st.kind === 'wok') {
      if (!carried || carried.kind === 'plate') return 'need-ingredient';
      var ing2 = CFG.INGREDIENTS[carried.id];
      var canCook = carried.stage === 'raw' ? !ing2.chop : carried.stage === 'chopped';
      if (!canCook) return 'already-cooked';
      world.busy = { stationId: st.id, label: 'MEMASAK ' + ing2.name.toUpperCase(), t: 0, dur: ing2.cook,
        done: function () { chef.carrying.stage = 'cooked'; window.DAPUR_AUDIO.play('sizzle'); } };
      world.stationFx.wok = { kind: 'sizzle', t: 0 };
      window.DAPUR_AUDIO.play('sizzle');
      return 'cooking';
    }

    if (st.kind === 'plating') {
      if (carried && carried.kind === 'plate') {
        if (world.plate) return 'plate-here';
        world.plate = carried;
        chef.carrying = null;
        window.DAPUR_AUDIO.play('pickup');
        return 'plate-down';
      }
      if (carried) {
        if (carried.stage !== 'cooked') return 'not-cooked';
        if (!world.plate) world.plate = newPlate();
        if (world.plate.items.length >= 3) return 'plate-full';
        world.plate.items.push(carried);
        chef.carrying = null;
        window.DAPUR_AUDIO.play('ding');
        return 'plated';
      }
      if (world.plate) {
        chef.carrying = world.plate;
        world.plate = null;
        window.DAPUR_AUDIO.play('pickup');
        return 'plate-up';
      }
      return 'empty-plate';
    }

    if (st.kind === 'serve') {
      return servePlate(world);
    }

    if (st.kind === 'trash') {
      if (!carried) return 'hands-empty';
      chef.carrying = null;
      window.DAPUR_AUDIO.play('bad');
      return 'trashed';
    }
    return 'nothing';
  }

  function update(world, dt) {
    if (world.over) return;
    world.time += dt;
    world.dayLeft -= dt;

    if (!world.rush && world.time >= T.rushAt) {
      world.rush = true;
      world.banner = { text: 'RUSH HOUR! Pesanan datang lebih cepat!', t: 0 };
      window.DAPUR_AUDIO.play('rush');
    }
    if (world.banner) {
      world.banner.t += dt;
      if (world.banner.t > 3) world.banner = null;
    }
    if (world.serveFlash) {
      world.serveFlash.t += dt;
      if (world.serveFlash.t > 1.6) world.serveFlash = null;
    }
    if (world.comboTimer > 0) {
      world.comboTimer -= dt;
      if (world.comboTimer <= 0) world.combo = 0;
    }
    for (var k in world.stationFx) {
      world.stationFx[k].t += dt;
      if (world.stationFx[k].t > 2.5) delete world.stationFx[k];
    }
    for (var p = world.popups.length - 1; p >= 0; p--) {
      world.popups[p].t += dt;
      if (world.popups[p].t > 1.4) world.popups.splice(p, 1);
    }

    if (world.busy) {
      world.busy.t += dt;
      if (world.busy.t >= world.busy.dur) {
        var done = world.busy.done;
        world.busy = null;
        done();
      }
    }

    world.spawnTimer -= dt;
    if (world.spawnTimer <= 0) {
      spawnOrder(world);
      world.spawnTimer = world.rush ? T.spawnEveryRush : T.spawnEvery;
    }

    for (var i = world.orders.length - 1; i >= 0; i--) {
      var o = world.orders[i];
      o.patience -= dt;
      if (o.patience <= 0) {
        world.orders.splice(i, 1);
        world.missed += 1;
        world.combo = 0;
        world.score = Math.max(0, world.score - T.expirePenalty);
        addPopup(world, 640, 120, 'PESANAN ' + o.recipe.name.toUpperCase() + ' KADALUWARSA -' + T.expirePenalty, '#ff6b5e');
        window.DAPUR_AUDIO.play('bad');
      }
    }

    if (world.dayLeft <= 0) {
      world.dayLeft = 0;
      world.over = true;
      world.won = world.served >= 8;
    }
  }

  window.DAPUR_WORLD = {
    createWorld: createWorld,
    stationById: stationById,
    stationCenter: stationCenter,
    nearestStation: nearestStation,
    interact: interact,
    update: update,
    spawnOrder: spawnOrder,
    recipeById: recipeById,
    recipeForItems: recipeForItems,
    newItem: newItem,
    newPlate: newPlate,
    addPopup: addPopup
  };
})();
