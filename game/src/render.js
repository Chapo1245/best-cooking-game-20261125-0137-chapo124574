// render.js — one job: draw the whole kitchen on the canvas, nothing else.
// Every shape is drawn code; no images, no network. Big labels stay readable
// when the screenshot is shrunk to a contact-sheet cell.
(function () {
  'use strict';

  var CFG = window.DAPUR_CONFIG;
  var T = CFG.TUNING;

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function text(ctx, s, x, y, size, color, align, weight) {
    ctx.fillStyle = color || '#fff';
    ctx.font = (weight || 'bold') + ' ' + size + 'px Verdana, sans-serif';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y);
  }

  function fmtTime(sec) {
    var s = Math.max(0, Math.ceil(sec));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  // One ingredient, drawn as a recognisable shape. stage adds cut marks / heat.
  function drawItemIcon(ctx, id, x, y, r, stage) {
    var ing = CFG.INGREDIENTS[id];
    if (!ing) return;
    ctx.save();
    ctx.translate(x, y);
    if (ing.shape === 'grain') {
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.ellipse(0, 2, r, r * 0.75, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ing.dark;
      for (var i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.ellipse(-r * 0.5 + i * r * 0.25, -r * 0.25 + (i % 2) * r * 0.2, r * 0.16, r * 0.1, 0.4, 0, Math.PI * 2); ctx.fill();
      }
    } else if (ing.shape === 'drum') {
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.95, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f7e3c0';
      ctx.beginPath(); ctx.arc(r * 0.55, -r * 0.55, r * 0.42, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ing.dark;
      ctx.beginPath(); ctx.arc(r * 0.55, -r * 0.55, r * 0.18, 0, Math.PI * 2); ctx.fill();
    } else if (ing.shape === 'chili') {
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.moveTo(-r * 0.9, -r * 0.4);
      ctx.quadraticCurveTo(0, r * 1.1, r * 0.9, -r * 0.5);
      ctx.quadraticCurveTo(0, r * 0.35, -r * 0.9, -r * 0.4);
      ctx.fill();
      ctx.strokeStyle = '#2f7d32';
      ctx.lineWidth = r * 0.18;
      ctx.beginPath(); ctx.moveTo(r * 0.7, -r * 0.45); ctx.quadraticCurveTo(r * 1.1, -r * 0.9, r * 0.7, -r * 1.0); ctx.stroke();
    } else if (ing.shape === 'egg') {
      ctx.fillStyle = '#fff8e6';
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.82, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8a91c';
      ctx.beginPath(); ctx.arc(-r * 0.12, -r * 0.12, r * 0.16, 0, Math.PI * 2); ctx.fill();
    } else if (ing.shape === 'leaf') {
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.ellipse(-r * 0.35, 0, r * 0.55, r * 0.75, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(r * 0.35, 0, r * 0.55, r * 0.75, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ing.dark;
      ctx.beginPath(); ctx.ellipse(0, r * 0.15, r * 0.3, r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (stage === 'chopped') {
      ctx.strokeStyle = 'rgba(60,30,10,0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.1); ctx.lineTo(r * 0.5, r * 0.3); ctx.moveTo(-r * 0.4, r * 0.4); ctx.lineTo(r * 0.4, -r * 0.4); ctx.stroke();
      text(ctx, '✂', r * 0.7, -r * 0.7, Math.round(r * 0.9), '#fff', 'center');
    }
    if (stage === 'cooked') {
      ctx.strokeStyle = '#8a5a1d';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.95, -0.6, 1.2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.9, r * 0.16, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.1, -r * 1.15, r * 0.12, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawPlate(ctx, x, y, items, scale) {
    var s = scale || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = '#e8e8e8';
    ctx.beginPath(); ctx.ellipse(0, 0, 46, 34, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(0, 0, 38, 27, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b03060';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 42, 30, 0, 0, Math.PI * 2); ctx.stroke();
    var spots = [[-16, -4], [14, -8], [0, 12]];
    for (var i = 0; i < items.length && i < 3; i++) {
      drawItemIcon(ctx, items[i].id, spots[i][0], spots[i][1], 15, items[i].stage);
    }
    ctx.restore();
  }

  function drawChef(ctx, chef, time) {
    var bob = chef.moving ? Math.sin(time * 14) * 3 : Math.sin(time * 2) * 1;
    ctx.save();
    ctx.translate(chef.x, chef.y + bob * 0.3);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(0, 20, 24, 8, 0, 0, Math.PI * 2); ctx.fill();
    // body (apron)
    ctx.fillStyle = '#f2f2f2';
    rr(ctx, -18, -6, 36, 26, 10); ctx.fill();
    ctx.fillStyle = '#b03060';
    rr(ctx, -18, -6, 36, 10, 8); ctx.fill();
    // head
    ctx.fillStyle = '#f2c79b';
    ctx.beginPath(); ctx.arc(0, -16, 15, 0, Math.PI * 2); ctx.fill();
    // chef hat
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-8, -28, 9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -32, 10, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8, -28, 9, 0, Math.PI * 2); ctx.fill();
    rr(ctx, -14, -28, 28, 7, 3); ctx.fill();
    // eyes
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(-5 * chef.dir, -16, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5 * chef.dir, -16, 2, 0, Math.PI * 2); ctx.fill();
    // carried item above the hat
    var carried = chef.carrying;
    if (carried) {
      if (carried.kind === 'plate') {
        drawPlate(ctx, 0, -58, carried.items, 0.85);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath(); ctx.arc(0, -52, 20, 0, Math.PI * 2); ctx.fill();
        drawItemIcon(ctx, carried.id, 0, -52, 15, carried.stage);
      }
    }
    ctx.restore();
  }

  function drawOrderTicket(ctx, order, x, y, w, h, index) {
    var frac = Math.max(0, order.patience / order.maxPatience);
    var urgent = frac < 0.35;
    ctx.save();
    ctx.fillStyle = urgent ? '#5a1f16' : '#fff8e6';
    rr(ctx, x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = urgent ? '#ff6b5e' : '#d8b25c';
    ctx.lineWidth = 3; rr(ctx, x, y, w, h, 10); ctx.stroke();
    // ticket holes
    ctx.fillStyle = '#2a1a12';
    ctx.beginPath(); ctx.arc(x, y + h / 2, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w, y + h / 2, 6, 0, Math.PI * 2); ctx.fill();
    text(ctx, '#' + (index + 1) + '  ' + order.recipe.name.toUpperCase(), x + 16, y + 24, 19, urgent ? '#ffd9d0' : '#5a3a12', 'left');
    text(ctx, '+' + order.recipe.score + ' pts', x + w - 14, y + 24, 15, urgent ? '#ffb0a5' : '#8a5a1d', 'right');
    // needed ingredients
    var ix = x + 34;
    for (var i = 0; i < order.recipe.needs.length; i++) {
      drawItemIcon(ctx, order.recipe.needs[i], ix, y + 56, 16, 'cooked');
      var ing = CFG.INGREDIENTS[order.recipe.needs[i]];
      text(ctx, ing.short, ix, y + 80, 11, urgent ? '#ffd9d0' : '#6b4a1a', 'center');
      ix += 76;
    }
    // patience bar
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    rr(ctx, x + 16, y + h - 12, w - 32, 10, 5); ctx.fill();
    ctx.fillStyle = urgent ? '#ff6b5e' : (frac < 0.6 ? '#ffb020' : '#4caf50');
    if (w - 32 > 4) { rr(ctx, x + 16, y + h - 12, Math.max(10, (w - 32) * frac), 10, 5); ctx.fill(); }
    text(ctx, fmtTime(order.patience), x + w - 14, y + h - 32, 15, urgent ? '#ff9d8a' : '#8a5a1d', 'right');
    ctx.restore();
  }

  function drawStation(ctx, st, world, time) {
    ctx.save();
    var highlight = false;
    if (!world.over && !world.busy) {
      var near = window.DAPUR_WORLD.nearestStation(world, T.interactRange);
      highlight = near && near.id === st.id;
    }
    // counter body
    ctx.fillStyle = st.kind === 'wok' ? '#3a3f4a' : '#7a5230';
    rr(ctx, st.x, st.y, st.w, st.h, 8); ctx.fill();
    ctx.fillStyle = st.kind === 'wok' ? '#4a505e' : '#9c6b3f';
    rr(ctx, st.x, st.y, st.w, 14, 8); ctx.fill();
    if (highlight) {
      ctx.strokeStyle = '#ffd94a';
      ctx.lineWidth = 4;
      rr(ctx, st.x - 3, st.y - 3, st.w + 6, st.h + 6, 10); ctx.stroke();
    }
    var cx = st.x + st.w / 2;
    var cy = st.y + st.h / 2;
    if (st.kind === 'bin') {
      drawItemIcon(ctx, st.item, cx - 34, cy - 4, 24, 'raw');
      drawItemIcon(ctx, st.item, cx + 8, cy + 6, 20, 'raw');
      drawItemIcon(ctx, st.item, cx + 38, cy - 8, 18, 'raw');
      text(ctx, st.label, cx, st.y + st.h - 12, 15, '#ffe9b8', 'center');
    } else if (st.kind === 'board') {
      ctx.fillStyle = '#e8c890';
      rr(ctx, st.x + 18, st.y + 16, st.w - 36, st.h - 46, 6); ctx.fill();
      ctx.strokeStyle = '#b98d4f';
      ctx.lineWidth = 2;
      rr(ctx, st.x + 18, st.y + 16, st.w - 36, st.h - 46, 6); ctx.stroke();
      if (world.busy && world.busy.stationId === 'board') {
        drawItemIcon(ctx, world.chef.carrying ? world.chef.carrying.id : 'veg', cx, cy - 6, 22, 'chopped');
      } else {
        drawItemIcon(ctx, 'veg', cx - 30, cy - 8, 18, 'chopped');
        drawItemIcon(ctx, 'chicken', cx + 30, cy - 2, 18, 'chopped');
      }
      text(ctx, st.label, cx, st.y + st.h - 12, 15, '#ffe9b8', 'center');
    } else if (st.kind === 'wok') {
      ctx.fillStyle = '#22242c';
      ctx.beginPath(); ctx.ellipse(cx, cy - 2, 92, 34, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c96a1e';
      ctx.beginPath(); ctx.ellipse(cx, cy - 2, 78, 26, 0, 0, Math.PI * 2); ctx.fill();
      if (world.busy && world.busy.stationId === 'wok' && world.chef.carrying) {
        drawItemIcon(ctx, world.chef.carrying.id, cx, cy - 4, 24, 'cooked');
      }
      // flames
      var flick = Math.sin(time * 9) * 3;
      ctx.fillStyle = '#ff9d2e';
      ctx.beginPath(); ctx.moveTo(cx - 60, cy + 34); ctx.quadraticCurveTo(cx - 30, cy + 14 + flick, cx, cy + 34); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx, cy + 34); ctx.quadraticCurveTo(cx + 30, cy + 14 - flick, cx + 60, cy + 34); ctx.fill();
      text(ctx, st.label, cx, st.y + st.h - 12, 15, '#ffe9b8', 'center');
    } else if (st.kind === 'plating') {
      ctx.fillStyle = '#f7f3ea';
      rr(ctx, st.x + 16, st.y + 12, st.w - 32, st.h - 44, 8); ctx.fill();
      if (world.plate) drawPlate(ctx, cx, cy - 6, world.plate.items, 1);
      else {
        ctx.strokeStyle = '#c9b98a';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.ellipse(cx, cy - 6, 46, 30, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        text(ctx, 'letakkan bahan matang di sini', cx, cy - 6, 13, '#8a7a5a', 'center');
      }
      text(ctx, st.label, cx, st.y + st.h - 12, 15, '#ffe9b8', 'center');
    } else if (st.kind === 'serve') {
      ctx.fillStyle = '#2f3a4a';
      rr(ctx, st.x, st.y, st.w, st.h, 8); ctx.fill();
      ctx.fillStyle = '#ffd94a';
      ctx.beginPath(); ctx.arc(cx - 90, cy - 8, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a5a1d';
      ctx.fillRect(cx - 92, cy + 4, 4, 10);
      text(ctx, 'DING!', cx - 90, cy - 38, 13, '#ffd94a', 'center');
      text(ctx, 'SERAHKAN PIRING', cx + 40, cy - 14, 16, '#ffffff', 'center');
      text(ctx, 'DI SINI', cx + 40, cy + 10, 16, '#ffffff', 'center');
      text(ctx, st.label, cx, st.y + st.h - 12, 15, '#ffe9b8', 'center');
    } else if (st.kind === 'trash') {
      ctx.fillStyle = '#4a4a4a';
      rr(ctx, st.x + 30, st.y + 10, st.w - 60, st.h - 40, 6); ctx.fill();
      ctx.fillStyle = '#333';
      rr(ctx, st.x + 24, st.y + 6, st.w - 48, 10, 5); ctx.fill();
      text(ctx, st.label, cx, st.y + st.h - 12, 15, '#ffe9b8', 'center');
    }
    ctx.restore();
  }

  function drawHUD(ctx, world) {
    ctx.save();
    ctx.fillStyle = '#241610';
    ctx.fillRect(0, 0, T.canvasW, 56);
    text(ctx, '🍳 DAPUR SENJA', 18, 30, 24, '#ffd94a', 'left');
    text(ctx, 'Skor ' + world.score, 300, 30, 20, '#ffffff', 'left');
    text(ctx, '🪙 ' + world.coins + ' koin', 470, 30, 20, '#ffd94a', 'left');
    if (world.combo > 1) {
      text(ctx, 'KOMBO x' + world.combo, 640, 30, 20, '#ff8a5c', 'left');
    }
    // day timer
    var frac = Math.max(0, world.dayLeft / T.daySeconds);
    text(ctx, '⏱ ' + fmtTime(world.dayLeft), 900, 30, 20, frac < 0.2 ? '#ff6b5e' : '#ffffff', 'left');
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    rr(ctx, 1000, 20, 180, 14, 7); ctx.fill();
    ctx.fillStyle = frac < 0.2 ? '#ff6b5e' : '#4caf50';
    rr(ctx, 1000, 20, Math.max(8, 180 * frac), 14, 7); ctx.fill();
    text(ctx, 'Shift', 1196, 30, 14, '#c9b8a8', 'left');
    ctx.restore();
  }

  function drawOrders(ctx, world) {
    ctx.save();
    text(ctx, 'PESANAN', 18, 76, 16, '#7a4a12', 'left');
    if (world.orders.length === 0) {
      text(ctx, 'Belum ada pesanan — ambil bahan dulu!', 120, 76, 15, '#c9b8a8', 'left');
    }
    var w = 396;
    var gap = 16;
    for (var i = 0; i < world.orders.length; i++) {
      drawOrderTicket(ctx, world.orders[i], 18 + i * (w + gap), 88, w, 100, i);
    }
    ctx.restore();
  }

  function drawPopups(ctx, world) {
    for (var i = 0; i < world.popups.length; i++) {
      var p = world.popups[i];
      var a = 1 - p.t / 1.4;
      ctx.save();
      ctx.globalAlpha = Math.max(0, a);
      text(ctx, p.text, p.x, p.y - p.t * 34, 20, p.color, 'center');
      ctx.restore();
    }
  }

  function drawProgress(ctx, world) {
    if (!world.busy) return;
    var st = window.DAPUR_WORLD.stationById(world.busy.stationId);
    if (!st) return;
    var cx = st.x + st.w / 2;
    var cy = st.y - 18;
    var frac = Math.min(1, world.busy.t / world.busy.dur);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    rr(ctx, cx - 130, cy - 18, 260, 40, 10); ctx.fill();
    text(ctx, world.busy.label, cx, cy + 2, 15, '#ffffff', 'center');
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    rr(ctx, cx - 110, cy + 12, 220, 6, 3); ctx.fill();
    ctx.fillStyle = '#ffd94a';
    rr(ctx, cx - 110, cy + 12, Math.max(6, 220 * frac), 6, 3); ctx.fill();
    ctx.restore();
  }

  function drawEndScreen(ctx, world) {
    ctx.save();
    ctx.fillStyle = 'rgba(20,10,6,0.82)';
    ctx.fillRect(0, 0, T.canvasW, T.canvasH);
    ctx.fillStyle = '#fff8e6';
    rr(ctx, 340, 130, 600, 430, 16); ctx.fill();
    ctx.strokeStyle = '#d8b25c';
    ctx.lineWidth = 4;
    rr(ctx, 340, 130, 600, 430, 16); ctx.stroke();
    text(ctx, 'SHIFT SELESAI!', 640, 185, 34, '#5a3a12', 'center');
    var stars = world.served >= 12 ? 3 : world.served >= 8 ? 2 : world.served >= 4 ? 1 : 0;
    text(ctx, '★'.repeat(stars) + '☆'.repeat(3 - stars), 640, 235, 36, '#e8a91c', 'center');
    text(ctx, 'Skor akhir: ' + world.score, 640, 300, 24, '#333', 'center');
    text(ctx, 'Hidangan tersaji: ' + world.served + '   ·   Koin: ' + world.coins, 640, 345, 20, '#555', 'center');
    text(ctx, 'Kombo terbaik: x' + world.bestCombo + '   ·   Pesanan hangus: ' + world.missed, 640, 385, 20, '#555', 'center');
    text(ctx, world.won ? 'Dapur Senja ramai malam ini. Kerja bagus, Chef!' : 'Besok coba lagi — dapur menantimu, Chef.', 640, 440, 18, '#8a5a1d', 'center');
    text(ctx, 'Tekan R untuk main lagi', 640, 500, 18, '#b03060', 'center');
    ctx.restore();
  }

  function drawGame(ctx, world, time) {
    // wall + floor
    ctx.fillStyle = '#f3d9a8';
    ctx.fillRect(0, 0, T.canvasW, 196);
    ctx.fillStyle = '#e8c890';
    for (var tx = 0; tx < T.canvasW; tx += 64) {
      ctx.fillRect(tx, 188, 32, 8);
    }
    ctx.fillStyle = '#8a5a3a';
    ctx.fillRect(0, 196, T.canvasW, 524);
    ctx.fillStyle = '#9c6b3f';
    for (var fy = 220; fy < T.canvasH; fy += 52) {
      for (var fx = ((fy / 52) % 2 === 0 ? 0 : 26); fx < T.canvasW; fx += 52) {
        ctx.fillRect(fx, fy, 48, 48);
      }
    }
    // warm wall decor
    drawHUD(ctx, world);
    drawOrders(ctx, world);

    // stations
    for (var i = 0; i < CFG.STATIONS.length; i++) {
      drawStation(ctx, CFG.STATIONS[i], world, time);
    }

    // chef (behind serve window if overlapping)
    drawChef(ctx, world.chef, time);
    drawProgress(ctx, world);
    drawPopups(ctx, world);

    if (world.serveFlash) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - world.serveFlash.t / 1.6);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      rr(ctx, 380, 268, 520, 56, 12); ctx.fill();
      text(ctx, world.serveFlash.text, 640, 297, 26, '#ffd94a', 'center');
      ctx.restore();
    }
    if (world.banner) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - world.banner.t / 3);
      text(ctx, world.banner.text, 640, 305, 30, '#ff8a5c', 'center');
      ctx.restore();
    }
    if (!world.over) {
      text(ctx, world.hint, 640, 706, 14, '#e8dcc8', 'center');
    }
    if (world.over) drawEndScreen(ctx, world);
  }

  window.DAPUR_RENDER = {
    drawGame: drawGame,
    drawItemIcon: drawItemIcon,
    drawPlate: drawPlate,
    drawChef: drawChef,
    drawOrderTicket: drawOrderTicket,
    fmtTime: fmtTime
  };
})();
