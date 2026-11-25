// config.js — Dapur Senja: recipes, ingredients, stations and tuning.
// One job: every constant the kitchen runs on, so balancing never touches logic.
(function () {
  'use strict';

  var INGREDIENTS = {
    rice:    { id: 'rice',    name: 'Nasi',   short: 'NASI',  color: '#f3ead2', dark: '#c9b98a', chop: 0,   cook: 2.0, shape: 'grain' },
    chicken: { id: 'chicken', name: 'Ayam',   short: 'AYAM',  color: '#e8a34c', dark: '#a86f24', chop: 1.5, cook: 2.5, shape: 'drum' },
    chili:   { id: 'chili',   name: 'Cabai',  short: 'CABAI', color: '#d9392b', dark: '#8f1d14', chop: 1.0, cook: 1.5, shape: 'chili' },
    egg:     { id: 'egg',     name: 'Telur',  short: 'TELUR', color: '#ffe08a', dark: '#c99a2e', chop: 0,   cook: 2.0, shape: 'egg' },
    veg:     { id: 'veg',     name: 'Sayur',  short: 'SAYUR', color: '#5da24a', dark: '#33591f', chop: 1.2, cook: 2.0, shape: 'leaf' }
  };

  var RECIPES = [
    { id: 'nasi-ayam', name: 'Nasi Ayam Lada',    needs: ['rice', 'chicken'],       coins: 14, score: 120 },
    { id: 'geprek',    name: 'Ayam Geprek Senja', needs: ['chicken', 'chili'],      coins: 16, score: 140 },
    { id: 'tumis',     name: 'Tumis Sayur Telur', needs: ['veg', 'egg'],            coins: 12, score: 110 },
    { id: 'nasgor',    name: 'Nasi Goreng Senja', needs: ['rice', 'egg', 'chili'],  coins: 20, score: 180 }
  ];

  var STATIONS = [
    { id: 'bin-rice',    kind: 'bin',   item: 'rice',    x: 30,  y: 196, w: 150, h: 76, label: 'NASI' },
    { id: 'bin-chicken', kind: 'bin',   item: 'chicken', x: 196, y: 196, w: 150, h: 76, label: 'AYAM' },
    { id: 'bin-chili',   kind: 'bin',   item: 'chili',   x: 362, y: 196, w: 150, h: 76, label: 'CABAI' },
    { id: 'bin-egg',     kind: 'bin',   item: 'egg',     x: 528, y: 196, w: 150, h: 76, label: 'TELUR' },
    { id: 'bin-veg',     kind: 'bin',   item: 'veg',     x: 694, y: 196, w: 150, h: 76, label: 'SAYUR' },
    { id: 'board',       kind: 'board',                 x: 60,  y: 330, w: 220, h: 130, label: 'TALENAN' },
    { id: 'wok',         kind: 'wok',                   x: 500, y: 330, w: 260, h: 130, label: 'WOK · KOMPOR' },
    { id: 'plating',     kind: 'plating',               x: 920, y: 330, w: 300, h: 130, label: 'PIRING SAJI' },
    { id: 'serve',       kind: 'serve',                 x: 920, y: 560, w: 300, h: 110, label: 'JENDELA SAJI' },
    { id: 'trash',       kind: 'trash',                 x: 60,  y: 560, w: 180, h: 110, label: 'TEMPAT SAMPAH' }
  ];

  var TUNING = {
    canvasW: 1280,
    canvasH: 720,
    daySeconds: 180,
    maxOrders: 3,
    orderPatience: 75,
    orderPatienceRush: 55,
    spawnEvery: 13,
    spawnEveryRush: 8,
    rushAt: 90,
    chefSpeed: 260,
    chefRadius: 22,
    interactRange: 105,
    comboWindow: 25,
    wrongServePenalty: 40,
    expirePenalty: 50
  };

  window.DAPUR_CONFIG = { INGREDIENTS: INGREDIENTS, RECIPES: RECIPES, STATIONS: STATIONS, TUNING: TUNING };
})();
