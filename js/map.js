(() => {
  'use strict';

  // ===== Константы мира SCUM =====
  const WORLD = 619200;   // полу-размер мира в игровых единицах
  const MAP_PX = 4096;    // размер картинки в пикселях
  const MAX_COORD = 320;  // как на scum-map.com

  // ===== Фирменная палитра AMURKA =====
  const PALETTE = {
    red:    '#ff3b30',
    orange: '#ff9500',
    yellow: '#ffd60a',
    green:  '#00ff88',
    cyan:   '#00d4ff',
    purple: '#a855f7',
  };

  // Категория -> фирменный цвет
  const COLOR_RULES = [
    [/bunker|hatch/i,                     PALETTE.red],
    [/secret/i,                           PALETTE.yellow],
    [/abandoned|killbox/i,                PALETTE.purple],
    [/ww2/i,                              PALETTE.orange],
    [/gas|fuel|propane/i,                 PALETTE.red],
[/vehicle|motorbike|motorcycle|bike|boat|paddle|rib|aircraft|car |car s|garage|repair|mechanic/i, PALETTE.cyan],
    [/village|outpost/i, PALETTE.green],
    [/points of interest|pois/i, PALETTE.yellow],
    [/police/i,                           PALETTE.cyan],
    [/school/i,                           PALETTE.purple],
    [/hospital|medical|pharmac|first/i,  PALETTE.red],
    [/workshop|warehouse|hangar|military warehouse|armory|toolbox|drill|lathe/i, PALETTE.orange],
    [/shop|general goods|store/i,         PALETTE.cyan],
[/gun|hunting|animal|feeder|grotto/i, PALETTE.orange],
    [/bar|pub|club|restaurant|saloon/i, PALETTE.purple],
    [/fishing|sardine/i, PALETTE.cyan],
    [/well|water|spring|pump|fountain|faucet/i, PALETTE.cyan],
    [/quest|book|board|mailbox/i, PALETTE.yellow],
    [/church/i, PALETTE.yellow],
    [/research|facility/i, PALETTE.green],
    [/cave|mine/i, PALETTE.purple],
    [/lighthouse|shipwreck|ship|docks?/i, PALETTE.cyan],
    [/atm|phone|hairdresser/i, PALETTE.purple],
    [/field|strawberr|corn|potato|cabbage|carrot|broccoli|onion|parsnip|watermelon|sunflower|cucumber/i, PALETTE.green],
    [/apple|cherry|pear|fig|olive|date|grape|rose/i, PALETTE.green],
    [/tree|log|plank|brick|cement|gravel|graphite|shed|silo/i, PALETTE.orange],
    [/locker|lock|suit/i, PALETTE.yellow],
    [/uranium|radiation/i, PALETTE.yellow],
  ];

  function brandColor(name) {
    for (const [re, color] of COLOR_RULES) {
      if (re.test(name)) return color;
    }
    return '#8b94a7';
  }

  // Кастомные SVG-глифы для ключевых категорий
  const GLYPH = svg => `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">${svg}</svg>`;

  const CUSTOM_ICONS = {
    'Bunkers': {
      color: PALETTE.red,
      svg: GLYPH(`<path d="M12 2C7 2 3.2 5.8 3.2 10.4c0 1.9.8 3.6 2.2 4.8.4 2 1.9 2.9 3.5 2.9h.6v-2.7h4.9v2.7h.6c1.6 0 3.1-.9 3.5-2.9 1.4-1.2 2.2-2.9 2.2-4.8C20.8 5.8 17 2 12 2z" fill="#fff"/><circle cx="9" cy="10.3" r="1" fill="#0a0a0f"/><circle cx="15" cy="10.3" r="1" fill="#0a0a0f"/><path d="M10.4 15.3h3.2" stroke="#0a0a0f" stroke-width="1.1" stroke-linecap="round"/>`)
    },
    'Bunker Hatch Doors': {
      color: PALETTE.orange,
      svg: GLYPH(`<rect x="5" y="5" width="14" height="14" rx="2" fill="none" stroke="#fff" stroke-width="1.7"/><rect x="8.5" y="8.5" width="7" height="7" rx="1" fill="none" stroke="#fff" stroke-width="1.4"/><circle cx="12" cy="12" r="1.4" fill="#fff"/>`)
    },
    'Secret Bunkers': {
      color: PALETTE.yellow,
      svg: GLYPH(`<path d="M12 2C7 2 3.2 5.8 3.2 10.4c0 1.9.8 3.6 2.2 4.8.4 2 1.9 2.9 3.5 2.9h.6v-2.7h4.9v2.7h.6c1.6 0 3.1-.9 3.5-2.9 1.4-1.2 2.2-2.9 2.2-4.8C20.8 5.8 17 2 12 2zm-3 8.3a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="#fff"/><circle cx="9" cy="10.3" r="1" fill="#0a0a0f"/><circle cx="15" cy="10.3" r="1" fill="#0a0a0f"/>`)
    },
    'Abandoned bunkers': {
      color: PALETTE.purple,
      svg: GLYPH(`<path d="M12 2C7 2 3.2 5.8 3.2 10.4c0 1.9.8 3.6 2.2 4.8.4 2 1.9 2.9 3.5 2.9h.6v-2.7h4.9v2.7h.6c1.6 0 3.1-.9 3.5-2.9 1.4-1.2 2.2-2.9 2.2-4.8C20.8 5.8 17 2 12 2zm-3 8.3a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="#fff"/><circle cx="9" cy="10.3" r="1" fill="#0a0a0f"/><circle cx="15" cy="10.3" r="1" fill="#0a0a0f"/><path d="M10.4 15.3h3.2" stroke="#0a0a0f" stroke-width="1.1" stroke-linecap="round"/>`)
    },
    'WW2 bunkers': {
      color: PALETTE.orange,
      svg: GLYPH(`<path d="M12 2C7 2 3.2 5.8 3.2 10.4c0 1.9.8 3.6 2.2 4.8.4 2 1.9 2.9 3.5 2.9h.6v-2.7h4.9v2.7h.6c1.6 0 3.1-.9 3.5-2.9 1.4-1.2 2.2-2.9 2.2-4.8C20.8 5.8 17 2 12 2zm-3 8.3a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="#fff"/><circle cx="9" cy="10.3" r="1" fill="#0a0a0f"/><circle cx="15" cy="10.3" r="1" fill="#0a0a0f"/>`)
    },
    'Killboxes': {
      color: PALETTE.purple,
      svg: GLYPH(`<circle cx="12" cy="12" r="8" fill="none" stroke="#fff" stroke-width="1.7"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3M7 7l2 2M15 15l2 2M17 7l-2 2M9 15l-2 2" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="12" r="1.5" fill="#fff"/>`)
    },
    'Gas stations': {
      color: PALETTE.red,
      svg: GLYPH(`<rect x="5.5" y="2.5" width="5" height="13" rx="1.2" fill="#fff"/><rect x="7" y="5" width="2.5" height="2.6" rx="1" fill="#0a0a0f"/><path d="M10.5 6.2l4.6 1.1v5.4l-4.6 1.1" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 21.5c0-2.5 1-3.2 1-5.4h9c0 2.2 1 2.9 1 5.4z" fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/>`)
    },
    'Vehicle spawns': {
      color: PALETTE.cyan,
      svg: GLYPH(`<path d="M3 15.6v-2c0-1 .8-1.8 1.8-1.8h1.2l1.5-3.4c.3-.8 1-1.2 1.7-1.2h5.6c.7 0 1.4.4 1.7 1.2l1.5 3.4h1.2c1 0 1.8.8 1.8 1.8v2l-1 1.6h-2.3l-.8-1.4h-9l-.8 1.4H4z" fill="#fff"/><circle cx="7.4" cy="17.6" r="1.3" fill="#0a0a0f"/><circle cx="16.6" cy="17.6" r="1.3" fill="#0a0a0f"/>`)
    },
    'Motorbike & bicycle spawns': {
      color: PALETTE.cyan,
      svg: GLYPH(`<circle cx="6" cy="16.5" r="2.5" fill="none" stroke="#fff" stroke-width="1.7"/><circle cx="17.5" cy="16.5" r="2.5" fill="none" stroke="#fff" stroke-width="1.7"/><path d="M8.4 16.5h4l3-5.6-2.8-1.3-5 5.4z" fill="#fff"/><path d="M12.4 16.5l1.2-5.6" stroke="#fff" stroke-width="1.3"/>`)
    },
    'Boat spawns': {
      color: PALETTE.cyan,
      svg: GLYPH(`<circle cx="12" cy="5.5" r="1.9" fill="none" stroke="#fff" stroke-width="1.7"/><path d="M12 7.4v9.6M6.2 13.2c.7 2.6 2.9 4.2 5.8 4.2s5.1-1.6 5.8-4.2" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/><path d="M10.5 9.6c1-.8 2-.8 3 0" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>`)
    },
    'Paddle spawns': {
      color: PALETTE.cyan,
      svg: GLYPH(`<rect x="7" y="3" width="2.6" height="18" rx="1.3" fill="#fff" transform="rotate(30 12 12)"/>`)
    },
    'RIB spawns': {
      color: PALETTE.cyan,
      svg: GLYPH(`<path d="M3 9v5c1 2 3 3 9 3s8-1 9-3V9l-4 2-5 1.5L3 9zm5-2l5 1.5L3 7l5 1.5" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`)
    },
    'Aircraft spawns': {
      color: PALETTE.cyan,
      svg: GLYPH(`<path d="M2.5 14.5l6.5-3L18 6.5l-1.2 4.8 2.2-1.1 1 2.3-2.1.9-2.4 3.7-1.4-8L2.5 14.5zm14 4.5l.6-3.2-1.4.5z" fill="#fff"/>`)
    },
    'Car garages': {
      color: PALETTE.cyan,
      svg: GLYPH(`<rect x="3" y="3" width="18" height="18" rx="2" fill="#fff"/><path d="M8 9l4-2 4 2M9 9v2M15 9v2M10.5 12h3v5h-3z" stroke="#0a0a0f" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`)
    },
    'Vehicle repair shops': {
      color: PALETTE.cyan,
      svg: GLYPH(`<path d="M20.1 4.5a5 5 0 0 1-6.6 6.3L6 18.3a1.5 1.5 0 0 1-2.1-2.1l7.5-7.5a5 5 0 0 1 6.3-6.6L15 4.8l2 2z" fill="#fff"/>`)
    },
    'Villages': {
      color: PALETTE.green,
      svg: GLYPH(`<path d="M5 11L12 4l7 7v7.5a1.5 1.5 0 0 1-1.5 1.5h-3.5v-5.5h-4V20H6.5A1.5 1.5 0 0 1 5 18.5z" fill="#fff"/>`)
    },
    'Outposts': {
      color: PALETTE.green,
      svg: GLYPH(`<path d="M5 11L12 4l7 7v7.5a1.5 1.5 0 0 1-1.5 1.5h-3.5v-5.5h-4V20H6.5A1.5 1.5 0 0 1 5 18.5z" fill="#fff"/>`)
    },
    'Points of interest': {
      color: PALETTE.yellow,
      svg: GLYPH(`<path d="M12 2.6l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.5 6.3 20.1l1.1-6.3L2.8 9.3l6.4-.9z" fill="#fff"/>`)
    },
    'Police stations': {
      color: PALETTE.cyan,
      svg: GLYPH(`<path d="M12 3l7 2.5v5.2c0 4.5-3 7.9-7 9.3-4-1.4-7-4.8-7-9.3V5.5z" fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 11.8l2.3 2.3 4-4.1" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`)
    },
    'Schools': {
      color: PALETTE.purple,
      svg: GLYPH(`<path d="M12 3.5L2 8l10 4.5L22 8z" fill="#fff"/><path d="M6 10.2v4.6c0 1 2.7 2.4 6 2.4s6-1.4 6-2.4v-4.6l-6 2.6z" fill="#fff"/><path d="M19.5 8.2v4.8" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>`)
    },
    'Hospital': {
      color: PALETTE.red,
      svg: GLYPH(`<path d="M9.5 3h5v5.5H20v5h-5.5V21h-5v-7.5H4v-5h5.5z" fill="#fff"/>`)
    },
    'Pharmacies': {
      color: PALETTE.red,
      svg: GLYPH(`<path d="M9.5 3h5v5.5H20v5h-5.5V21h-5v-7.5H4v-5h5.5z" fill="#fff"/>`)
    },
    'Medical Containers': {
      color: PALETTE.red,
      svg: GLYPH(`<rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="#fff" stroke-width="1.7"/><path d="M9.5 8.5h5M9.5 12h5M9.5 15.5h3" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>`)
    },
    'Workshops': {
      color: PALETTE.orange,
      svg: GLYPH(`<path d="M20.1 4.5a5 5 0 0 1-6.6 6.3L6 18.3a1.5 1.5 0 0 1-2.1-2.1l7.5-7.5a5 5 0 0 1 6.3-6.6L15 4.8l2 2z" fill="#fff"/>`)
    },
    'Warehouses': {
      color: PALETTE.orange,
      svg: GLYPH(`<rect x="4" y="4" width="16" height="16" rx="2" fill="#fff"/><path d="M8 10h8M8 14h5" stroke="#0a0a0f" stroke-width="1.5" stroke-linecap="round"/>`)
    },
    'Military Hangars': {
      color: PALETTE.green,
      svg: GLYPH(`<path d="M4 8l8-4 8 4v12H4z" fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/><path d="M8.5 20v-6h7v6M6 10l2 1.5M18 10l-2 1.5" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`)
    },
    'Military Warehouses': {
      color: PALETTE.green,
      svg: GLYPH(`<rect x="4" y="4" width="16" height="16" rx="2" fill="#fff"/><path d="M8 10h8M8 14h5M8 18h3" stroke="#0a0a0f" stroke-width="1.5" stroke-linecap="round"/>`)
    },
    'Armory': {
      color: PALETTE.green,
      svg: GLYPH(`<path d="M12 3l7 2.5v5.2c0 4.5-3 7.9-7 9.3-4-1.4-7-4.8-7-9.3V5.5z" fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 11.8l2.3 2.3 4-4.1" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`)
    },
    'Food Shop': {
      color: PALETTE.cyan,
      svg: GLYPH(`<path d="M5 8h14l-1.3 11.2a1.9 1.9 0 0 1-1.9 1.8H8.2a1.9 1.9 0 0 1-1.9-1.8z" fill="#fff"/><path d="M7.5 8V6.2a4.5 4.5 0 0 1 9 0V8" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>`)
    },
    'Gun Shops': {
      color: PALETTE.orange,
      svg: GLYPH(`<path d="M10 21l4-10" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/><path d="M12.5 17L14.5 8 22 5.5" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M7.2 20.5h4M5 17h4" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>`)
    },
    'Bars': {
      color: PALETTE.purple,
      svg: GLYPH(`<path d="M6 4h10v10a4.5 4.5 0 0 1-4.5 4.5h-1A4.5 4.5 0 0 1 6 14z" fill="#fff"/><path d="M16 7.5h1.5a2.8 2.8 0 0 1 0 5.6H16" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>`)
    },
    'Pubs': {
      color: PALETTE.purple,
      svg: GLYPH(`<path d="M6 4h10v10a4.5 4.5 0 0 1-4.5 4.5h-1A4.5 4.5 0 0 1 6 14z" fill="#fff"/><path d="M16 7.5h1.5a2.8 2.8 0 0 1 0 5.6H16" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>`)
    },
    'Clubs': {
      color: PALETTE.purple,
      svg: GLYPH(`<path d="M9 18a5 5 0 1 1 6-4.9A3 3 0 0 1 12 19v1" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/><path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" fill="#fff"/><path d="M12 14a2 2 0 0 1 2 2l-.5 3.5h-3L10 16a2 2 0 0 1 2-2z" fill="#fff"/><path d="M12 20.5V22" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>`)
    },
    'Restaurants': {
      color: PALETTE.purple,
      svg: GLYPH(`<path d="M13 3v7h1.5V3h2v7H18V3h2v7c0 2-1.3 3.2-3 3.4V21h-2v-7.6c-1.7-.2-3-1.4-3-3.4V3z" fill="#fff"/>`)
    },
    'Saloon': {
      color: PALETTE.purple,
      svg: GLYPH(`<rect x="4" y="4" width="16" height="16" fill="none" stroke="#fff" stroke-width="1.7"/><path d="M9 16l3-4 3 4z" fill="none" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>`)
    },
    'Fishing spots': {
      color: PALETTE.cyan,
      svg: GLYPH(`<path d="M4 11.5c2.5-5 8-5 10.5 0-2.5 5-8 5-10.5 0z" fill="#fff"/><path d="M14.5 9.5l4.5-2.5v9l-4.5-2.5" fill="#fff"/><circle cx="6.8" cy="11.5" r=".9" fill="#0a0a0f"/>`)
    },
    'Sardines': {
      color: PALETTE.cyan,
      svg: GLYPH(`<path d="M4 11.5c2.5-5 8-5 10.5 0-2.5 5-8 5-10.5 0z" fill="#fff"/><path d="M14.5 9.5l4.5-2.5v9l-4.5-2.5" fill="#fff"/><circle cx="6.8" cy="11.5" r=".9" fill="#0a0a0f"/>`)
    },
    'Fishing Supplies': {
      color: PALETTE.cyan,
      svg: GLYPH(`<path d="M4 11.5c2.5-5 8-5 10.5 0-2.5 5-8 5-10.5 0z" fill="#fff"/><path d="M14.5 9.5l4.5-2.5v9l-4.5-2.5" fill="#fff"/><circle cx="6.8" cy="11.5" r=".9" fill="#0a0a0f"/>`)
    },
    'Wells': {
      color: PALETTE.cyan,
      svg: GLYPH(`<path d="M12 2.5s6.2 6.6 6.2 10.4a6.2 6.2 0 0 1-12.4 0C5.8 9.1 12 2.5 12 2.5z" fill="#fff"/><circle cx="12" cy="13" r="2.5" fill="#0a0a0f"/>`)
    },
    'Hand water pumps': {
      color: PALETTE.cyan,
      svg: GLYPH(`<path d="M12 2.5s6.2 6.6 6.2 10.4a6.2 6.2 0 0 1-12.4 0C5.8 9.1 12 2.5 12 2.5z" fill="#fff"/><circle cx="12" cy="13" r="2.5" fill="#0a0a0f"/>`)
    },
    'Natural springs': {
      color: PALETTE.cyan,
      svg: GLYPH(`<path d="M12 2.5s6.2 6.6 6.2 10.4a6.2 6.2 0 0 1-12.4 0C5.8 9.1 12 2.5 12 2.5z" fill="#fff"/><circle cx="12" cy="13" r="2.5" fill="#0a0a0f"/>`)
    },
    'Water dispensers': {
      color: PALETTE.cyan,
      svg: GLYPH(`<rect x="7" y="2.5" width="10" height="6" rx="1.5" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M7 8.5h10l-1.5 10a2 2 0 0 1-2 1.8h-3a2 2 0 0 1-2-1.8z" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>`)
    },
    'Fountains': {
      color: PALETTE.cyan,
      svg: GLYPH(`<path d="M6.2 7.5a6 6 0 0 1 11.6 0 5 5 0 0 1-5 5H8a3.5 3.5 0 0 1-3.6-3c0-1.4.9-2 1.8-2z" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 12.5c.7.8.7 1.6 0 2.4M12 14.9v5.6c0 .6-4 .6-4 0" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/>`)
    },
    'Decorative fountains': {
      color: PALETTE.purple,
      svg: GLYPH(`<path d="M6.2 7.5a6 6 0 0 1 11.6 0 5 5 0 0 1-5 5H8a3.5 3.5 0 0 1-3.6-3c0-1.4.9-2 1.8-2z" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 12.5c.7.8.7 1.6 0 2.4M12 14.9v5.6c0 .6-4 .6-4 0" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/>`)
    },
    'Quest books': {
      color: PALETTE.yellow,
      svg: GLYPH(`<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v14H6.5A2.5 2.5 0 0 0 4 19.5z" fill="#fff" opacity=".35"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20v4H6.5a2.5 2.5 0 0 1-2.5-1.5z" fill="#fff"/>`)
    },
    'Quest Boards': {
      color: PALETTE.yellow,
      svg: GLYPH(`<rect x="4" y="4" width="16" height="13" rx="1.5" fill="none" stroke="#fff" stroke-width="1.6"/><rect x="7.5" y="7.5" width="4" height="3" fill="#fff"/><path d="M7 14h10" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`)
    },
    'Quest Mailboxes': {
      color: PALETTE.yellow,
      svg: GLYPH(`<rect x="5" y="9" width="14" height="10" rx="1.5" fill="#fff"/><path d="M9 13h6" stroke="#0a0a0f" stroke-width="1.5" stroke-linecap="round"/><path d="M5 11L12 6l7 5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>`)
    },
    'Churches': {
      color: PALETTE.yellow,
      svg: GLYPH(`<path d="M9.5 2.5h5V6H20v5h-5.5v10h-5V11H4V6h5.5z" fill="#fff"/>`)
    },
    'Hunting Towers': {
      color: PALETTE.orange,
      svg: GLYPH(`<rect x="6" y="4" width="12" height="12" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M6 4l-2-2M18 4l2-2M12 16V11" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><path d="M8 8h8M8 10.5h8" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><path d="M9 20h6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`)
    },
    'Hunting Camps': {
      color: PALETTE.orange,
      svg: GLYPH(`<path d="M12 3.5L4 12a1.5 1.5 0 0 0 1.1 2.5H22a1.5 1.5 0 0 0 1.1-2.6z" fill="#fff"/>`)
    },
    'Hunting Shops': {
      color: PALETTE.orange,
      svg: GLYPH(`<circle cx="12" cy="12" r="6.5" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="12" r="1.3" fill="#fff"/>`)
    },
    'Animal feeders': {
      color: PALETTE.orange,
      svg: GLYPH(`<path d="M12 3l4 13H8z" fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/><path d="M8 16h8l1 4H7z" fill="#fff"/>`)
    },
    'Caves': {
      color: PALETTE.purple,
      svg: GLYPH(`<path d="M3 19a9 9 0 0 1 18 0" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/><path d="M3 19h18" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/><path d="M9 19a4 4 0 1 1 6 0" fill="#fff" opacity=".45"/>`)
    },
    'Underwater Caves': {
      color: PALETTE.purple,
      svg: GLYPH(`<path d="M3 19a9 9 0 0 1 18 0M8.5 16.5a4 4 0 1 1 7 0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><path d="M12 5c1-1.5 2.5-1.5 3.5 0 1 1.5 2.5 1.5 3.5 0" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`)
    },
    'Lighthouses': {
      color: PALETTE.yellow,
      svg: GLYPH(`<rect x="10" y="6.5" width="4" height="13.5" rx="1" fill="#fff"/><path d="M8.5 6.5L12 2l3.5 4.5z" fill="#fff"/><path d="M10 10h4M10 13h4" stroke="#0a0a0f" stroke-width="1.4" stroke-linecap="round"/><circle cx="12" cy="4.5" r=".9" fill="#0a0a0f"/>`)
    },
    'Big Shipwrecks': {
      color: PALETTE.cyan,
      svg: GLYPH(`<path d="M3 19h18l-2.5-4-2 1.5-2-2.5-2.5 2.5-2-2-2.5 2L5 15z" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="M5 19c-1-2.5.5-4 2-5" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/>`)
    },
    'Small Shipwrecks': {
      color: PALETTE.cyan,
      svg: GLYPH(`<path d="M3 19h18l-2-3-2 1.5-2-2-2 2-2-1.5-2 1.5z" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>`)
    },
    'ATM': {
      color: PALETTE.purple,
      svg: GLYPH(`<rect x="6" y="3" width="12" height="18" rx="2" fill="#fff"/><path d="M9.5 6h5" stroke="#0a0a0f" stroke-width="1.4" stroke-linecap="round"/><rect x="9" y="12" width="6" height="5" rx="1" fill="#0a0a0f"/>`)
    },
    'Phone Booths': {
      color: PALETTE.purple,
      svg: GLYPH(`<rect x="6.5" y="2.5" width="11" height="19" rx="1.5" fill="none" stroke="#fff" stroke-width="1.6"/><rect x="9.5" y="5" width="5" height="8" rx="1" fill="#fff"/><path d="M10 14.5H14M11 16.5h2" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`)
    },
    'Research Facilities': {
      color: PALETTE.green,
      svg: GLYPH(`<path d="M10 3.5l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z" fill="#fff"/><path d="M18.5 14l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8z" fill="#fff" opacity=".6"/>`)
    },
    'Mine entrances': {
      color: PALETTE.orange,
      svg: GLYPH(`<path d="M3 19a9 9 0 0 1 18 0M8 19v-3a4 4 0 1 1 8 0v3M9.5 10l1.2 2" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`)
    },
  };

  // Категории с кастомными глифами (для попапа-иконки и маркера)
  const CUSTOM = new Set(Object.keys(CUSTOM_ICONS));

  // ===== Карта =====
  const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -2,
    maxZoom: 4,
    zoomControl: false,
    attributionControl: true,
  });
  L.control.zoom({ position: 'topright' }).addTo(map);

  const bounds = [[0, 0], [MAX_COORD, MAX_COORD]];
  L.imageOverlay('map.jpg', bounds).addTo(map);
  map.fitBounds(bounds);

  // Маркеры собираем в кластеры, чтобы не перекрывались на обзоре
  const cluster = L.markerClusterGroup({
    maxClusterRadius: 46,
    disableClusteringAtZoom: 3,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    iconCreateFunction(c) {
      const n = c.getChildCount();
      const tier = n < 50 ? 'small' : n < 200 ? 'medium' : 'large';
      return L.divIcon({
        html: `<div class="amr-cluster ${tier}"><span>${n}</span></div>`,
        className: 'amr-marker-wrap',
        iconSize: [40, 40],
      });
    },
  });
  cluster.addTo(map);

  function gameToLatLng(x, y) {
    return [(WORLD - y) / (2 * WORLD) * MAX_COORD, (x + WORLD) / (2 * WORLD) * MAX_COORD];
  }
  function latLngToGame(lat, lng) {
    return [lng / MAX_COORD * (2 * WORLD) - WORLD, WORLD - lat / MAX_COORD * (2 * WORLD)];
  }

  const coordsEl = document.getElementById('coords');
  map.on('mousemove', (e) => {
    const [x, y] = latLngToGame(e.latlng.lat, e.latlng.lng);
    coordsEl.textContent = `X: ${Math.round(x)}   Y: ${Math.round(y)}`;
  });

  // ===== Данные =====
  let allPois = [];
  const allMarkers = [];
  const activeCats = new Set();
  let categoryLayers = {};
  const sections = {
    'Бункеры': ['Bunkers', 'Secret Bunkers', 'Abandoned bunkers', 'WW2 bunkers', 'Bunker Hatch Doors', 'Killboxes', 'Hazmat Suit Lockers', 'Depleted Uranium Crates', 'Radiation Equipment Lockers'],
    'Заправки и транспорт': ['Gas stations', 'Propane Tank', 'Vehicle spawns', 'Motorbike & bicycle spawns', 'Boat spawns', 'Paddle spawns', 'RIB spawns', 'Wheelbarrow spawns', 'Aircraft spawns', 'Vehicle repair shops', 'Car garages'],
    'Города и деревни': ['Villages', 'Outposts', 'Krsko POIs', 'Samobor POIs', 'Novigrad POIs', 'Points of interest', 'Police stations', 'Schools', 'Hospital', 'Pharmacies', 'Medical Containers'],
    'Лут и мастерские': ['Workshops', 'Warehouses', 'Military Hangars', 'Military Warehouses', 'Armory', 'Drill press / Lathe', 'Lockers', 'Red Toolboxes', 'Bookshelves', 'Storage shed', 'Log Cabin', 'Pile of planks', 'Bricks', 'Cement bags', 'Gravel bags', 'Graphite', 'Logs', 'Industrial storage silos', 'Mine entrances'],
    'Магазины': ['Food Shop', 'Gun Shops', 'Fishing Supplies', 'General Goods', 'Mechanic', 'Hairdresser', 'Hunter\'s Grotto'],
    'Охота': ['Hunting Towers', 'Hunting Camps', 'Hunting Shops', 'Animal feeders'],
    'Развлечения': ['Bars', 'Pubs', 'Clubs', 'Restaurants', 'Saloon'],
    'Природа': ['Caves', 'Underwater Caves', 'Big Shipwrecks', 'Small Shipwrecks', 'Lighthouses', 'Churches', 'Research Facilities'],
    'Квесты': ['Quest books', 'Quest Boards', 'Quest Mailboxes'],
    'Вода': ['Fishing spots', 'Wells', 'Hand water pumps', 'Natural springs', 'Water dispensers', 'Fountains', 'Decorative fountains', 'Small Docks', 'Sardines'],
    'Инфраструктура': ['ATM', 'Phone Booths'],
    'Растения': ['Apple trees', 'Cherry trees', 'Pear trees', 'Fig trees', 'Olive trees', 'Date palms', 'Rose hip / dog rose', 'Grapevines'],
    'Поля': ['Strawberries', 'Corn fields', 'Potatoes', 'Cabbages', 'Carrots', 'Broccoli', 'Onions', 'Parsnip', 'Watermelons', 'Sunflower fields'],
  };

  Promise.all([
    fetch('pois.json').then(r => r.json()),
    fetch('categories.json').then(r => r.json()),
  ]).then(([pois, cats]) => {
    allPois = pois;
    renderSidebar(cats.map(c => ({ ...c, color: brandColor(c.name) })));
    buildMarkers(pois);
    document.getElementById('status').innerHTML =
      `<i class="fas fa-check-circle"></i> Загружено <b>${pois.length.toLocaleString('ru-RU')}</b> POI в <b>${cats.length}</b> категориях`;
    setAll(false);
  }).catch(err => {
    document.getElementById('status').textContent = '⚠ Ошибка: ' + err.message;
  });

  // ===== Сайдбар =====
  function renderSidebar(cats) {
    const list = document.getElementById('category-list');
    let html = '';
    const covered = new Set();

    for (const [sectionName, sectionCats] of Object.entries(sections)) {
      const ins = sectionCats.map(name => cats.find(c => c.name === name)).filter(Boolean);
      if (!ins.length) continue;
      ins.forEach(c => covered.add(c.name));
      html += `<div class="section">
          <div class="section-header">
            <span>${escapeHtml(sectionName)}</span>
            <i class="fas fa-chevron-down chevron"></i>
          </div>
          <div class="section-content">` + ins.map(c => catRow(c)).join('') + `</div>
        </div>`;
    }
    const others = cats.filter(c => !covered.has(c.name));
    if (others.length) {
      html += `<div class="section">
          <div class="section-header">
            <span>Другое</span>
            <i class="fas fa-chevron-down chevron"></i>
          </div>
          <div class="section-content">` + others.map(c => catRow(c)).join('') + `</div>
        </div>`;
    }
    list.innerHTML = html;
    list.querySelectorAll('.section-header').forEach(h => {
      h.addEventListener('click', () => h.parentElement.classList.toggle('collapsed'));
    });
    list.querySelectorAll('.category-row').forEach(el => {
      el.addEventListener('click', () => toggleCategory(el.dataset.category, el));
    });
  }

  function catRow(c) {
    const icon = CUSTOM.has(c.name)
      ? CUSTOM_ICONS[c.name].svg
      : `<i class="fas ${faClass(c.icon)}"></i>`;
    return `<div class="category-row" data-category="${escapeAttr(c.name)}">
        <span class="category-icon" style="--clr:${c.color}">${icon}</span>
        <span class="category-name">${escapeHtml(c.name)}</span>
        <span class="category-count">${c.count}</span>
      </div>`;
  }

  // ===== Маркеры =====
  function buildMarkers(pois) {
    const byCat = {};
    pois.forEach(p => {
      (byCat[p.c] = byCat[p.c] || []).push(p);
    });

    for (const [cat, items] of Object.entries(byCat)) {
      const layer = L.layerGroup();
      items.forEach(p => {
        const color = brandColor(p.c || cat);
        const glyph = CUSTOM.has(p.c)
          ? CUSTOM_ICONS[p.c].svg
          : `<i class="fas ${faClass(p.i)}"></i>`;
        const icon = L.divIcon({
          className: 'amr-marker-wrap',
          html: `<div class="amr-marker" style="--clr:${color}"><span class="amr-glyph">${glyph}</span></div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });
        const marker = L.marker(gameToLatLng(p.x, p.y), { icon, title: p.n });
        marker.bindPopup(`
          <div class="popup-title">${escapeHtml(p.n)}</div>
          <div class="popup-category">${escapeHtml(p.c)}</div>
          <div class="popup-coords">X: ${p.x.toFixed(0)}   Y: ${p.y.toFixed(0)}</div>
          ${p.d ? `<div class="popup-desc">${escapeHtml(p.d)}</div>` : ''}
          <button class="popup-teleport" data-copy="#Teleport ${p.x.toFixed(0)} ${p.y.toFixed(0)} 0">
            <i class="fas fa-clipboard"></i> Копировать телепорт
          </button>
        `);
        layer.addLayer(marker);
        allMarkers.push(marker);
      });
      categoryLayers[cat] = layer;
    }

    map.on('popupopen', () => {
      document.querySelectorAll('.popup-teleport').forEach(btn => {
        btn.onclick = () => copyText(btn.dataset.copy);
      });
    });
  }

  // ===== Показ/скрытие категорий =====
  function setCatOn(name) {
    if (activeCats.has(name)) return;
    const l = categoryLayers[name];
    if (l) { cluster.addLayers(l.getLayers()); activeCats.add(name); }
  }
  function setCatOff(name) {
    if (!activeCats.has(name)) return;
    const l = categoryLayers[name];
    if (l) { cluster.removeLayers(l.getLayers()); activeCats.delete(name); }
  }

  function toggleCategory(name, el) {
    if (activeCats.has(name)) { setCatOff(name); el.classList.add('disabled'); }
    else { setCatOn(name); el.classList.remove('disabled'); }
    updateStatus();
  }

  function setAll(show) {
    for (const name of Object.keys(categoryLayers)) {
      show ? setCatOn(name) : setCatOff(name);
    }
    document.querySelectorAll('.category-row').forEach(el => {
      el.classList.toggle('disabled', !show);
    });
    updateStatus();
  }

  function showKey() {
    const keep = new Set(['Bunkers', 'Bunker Hatch Doors', 'Secret Bunkers', 'Gas stations']);
    for (const name of Object.keys(categoryLayers)) {
      keep.has(name) ? setCatOn(name) : setCatOff(name);
    }
    document.querySelectorAll('.category-row').forEach(el => {
      el.classList.toggle('disabled', !keep.has(el.dataset.category));
    });
    updateStatus();
  }

  function updateStatus() {
    document.getElementById('status').innerHTML =
      `<i class="fas fa-layer-group"></i> Активно категорий: <b>${activeCats.size}</b> / ${Object.keys(categoryLayers).length}`;
  }

  // ===== Поиск =====
  const searchEl = document.getElementById('search');
  searchEl.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) return;
    const idx = allPois.findIndex(p =>
      p.n.toLowerCase().includes(q) || (p.c && p.c.toLowerCase().includes(q))
    );
    if (idx === -1) return;
    const p = allPois[idx];
    const marker = allMarkers[idx];
    // Включаем категорию, если скрыта
    if (!activeCats.has(p.c)) {
      setCatOn(p.c);
      const row = document.querySelector(`[data-category="${CSS.escape(p.c)}"]`);
      if (row) row.classList.remove('disabled');
      updateStatus();
    }
    if (marker) {
      map.setView(marker.getLatLng(), 3);
      marker.openPopup();
    }
  });

  // ===== Боковая панель =====
  document.getElementById('toggle-sidebar').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
    setTimeout(() => map.invalidateSize(), 350);
  });
  document.getElementById('btnAll').addEventListener('click', () => setAll(true));
  document.getElementById('btnNone').addEventListener('click', () => setAll(false));
  document.getElementById('btnKey').addEventListener('click', showKey);

  // ===== Утилиты =====
  function faClass(faName) {
    if (!faName) return 'fa-circle';
    return faName.replace(/^fa([A-Z])/, (m, c) => 'fa-' + c.toLowerCase())
                 .replace(/([A-Z])/g, (m, c) => '-' + c.toLowerCase());
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  function copyText(text) {
    const done = () => {
      const toast = document.getElementById('toast');
      const tt = document.getElementById('toastText');
      if (tt && toast) { tt.textContent = 'Телепорт скопирован'; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2200); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (_) {}
    document.body.removeChild(ta);
    done();
  }

  // Клик по пустому месту — координаты scum-map
  map.on('click', (e) => {
    const [x, y] = latLngToGame(e.latlng.lat, e.latlng.lng);
    console.log(`https://scum-map.com/en/scum/island/${x.toFixed(1)},${y.toFixed(1)},1.5`);
  });

  // Мобильный бургер
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      navToggle.classList.toggle('active');
    });
    navMenu.addEventListener('click', () => {
      navMenu.classList.remove('active');
      navToggle.classList.remove('active');
    });
  }

  // Navbar scroll
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
})();