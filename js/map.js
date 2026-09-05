(() => {
  'use strict';

  const WORLD = 619200;
  const MAX_COORD = 320;

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
  map.setZoom(1);

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

  let allPois = [];
  let categoryLayers = {};

  const sections = {
    'Бункеры': ['Bunkers', 'Secret Bunkers', 'Abandoned bunkers', 'WW2 bunkers', 'Bunker Hatch Doors', 'Killboxes', 'Hazmat Suit Lockers', 'Depleted Uranium Crates', 'Radiation Equipment Lockers'],
    'Заправки и транспорт': ['Gas stations', 'Propane Tank', 'Vehicle spawns', 'Motorbike & bicycle spawns', 'Boat spawns', 'Paddle spawns', 'RIB spawns', 'Wheelbarrow spawns', 'Aircraft spawns', 'Vehicle repair shops', 'Car garages'],
    'Города и деревни': ['Villages', 'Outposts', 'Krsko POIs', 'Samobor POIs', 'Novigrad POIs', 'Points of interest', 'Police stations', 'Schools', 'Hospital', 'Pharmacies', 'Medical Containers'],
    'Лут и мастерские': ['Workshops', 'Warehouses', 'Military Hangars', 'Military Warehouses', 'Armory', 'Drill press / Lathe', 'Lockers', 'Red Toolboxes', 'Bookshelves', 'Storage shed', 'Log Cabin', 'Pile of planks', 'Bricks', 'Cement bags', 'Gravel bags', 'Graphite', 'Logs', 'Industrial storage silos', 'Mine entrances'],
    'Магазины': ['Food Shop', 'Gun Shops', 'Fishing Supplies', 'General Goods', 'Mechanic', 'Hairdresser', "Hunter's Grotto"],
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
    renderSidebar(cats);
    buildMarkers(pois);
    document.getElementById('status').innerHTML =
      `<i class="fas fa-check-circle"></i> Загружено <b>${pois.length.toLocaleString('ru-RU')}</b> POI в <b>${cats.length}</b> категориях`;
    showKey();
  }).catch(err => {
    document.getElementById('status').textContent = '⚠ Ошибка: ' + err.message;
  });

  function renderSidebar(cats) {
    const list = document.getElementById('category-list');
    let html = '';
    const covered = new Set();
    for (const [sectionName, sectionCats] of Object.entries(sections)) {
      const ins = sectionCats.map(name => cats.find(c => c.name === name)).filter(Boolean);
      if (!ins.length) continue;
      ins.forEach(c => covered.add(c.name));
      html += `<div class="section">
        <div class="section-header"><span>${escapeHtml(sectionName)}</span><i class="fas fa-chevron-down chevron"></i></div>
        <div class="section-content">` + ins.map(c => catRow(c)).join('') + `</div></div>`;
    }
    const others = cats.filter(c => !covered.has(c.name));
    if (others.length) {
      html += `<div class="section">
        <div class="section-header"><span>Другое</span><i class="fas fa-chevron-down chevron"></i></div>
        <div class="section-content">` + others.map(c => catRow(c)).join('') + `</div></div>`;
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
    const color = brandColor(c.name);
    return `<div class="category-row" data-category="${escapeAttr(c.name)}">
      <span class="category-icon" style="--clr:${color}"><i class="fas ${faClass(c.icon)}"></i></span>
      <span class="category-name">${escapeHtml(c.name)}</span>
      <span class="category-count">${c.count}</span>
    </div>`;
  }

  function buildMarkers(pois) {
    const byCat = {};
    pois.forEach(p => {
      (byCat[p.c] = byCat[p.c] || []).push(p);
    });
    for (const [cat, items] of Object.entries(byCat)) {
      const layer = L.layerGroup();
      items.forEach(p => {
        const color = brandColor(p.c || cat);
        const icon = L.divIcon({
          className: 'amr-marker-wrap',
          html: `<div class="amr-marker" style="--clr:${color}"><span class="amr-glyph"><i class="fas ${faClass(p.i)}"></i></span></div>`,
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
      });
      categoryLayers[cat] = layer;
    }
    map.on('popupopen', () => {
      document.querySelectorAll('.popup-teleport').forEach(btn => {
        btn.onclick = () => copyText(btn.dataset.copy);
      });
    });
  }

  function toggleCategory(name, el) {
    const layer = categoryLayers[name];
    if (!layer) return;
    if (map.hasLayer(layer)) { map.removeLayer(layer); el.classList.add('disabled'); }
    else { map.addLayer(layer); el.classList.remove('disabled'); }
    updateStatus();
  }

  function setAll(show) {
    for (const [name, layer] of Object.entries(categoryLayers)) {
      if (show && !map.hasLayer(layer)) map.addLayer(layer);
      if (!show && map.hasLayer(layer)) map.removeLayer(layer);
    }
    document.querySelectorAll('.category-row').forEach(el => {
      el.classList.toggle('disabled', !show);
    });
    updateStatus();
  }

  function showKey() {
    const keep = new Set(['Bunkers', 'Bunker Hatch Doors', 'Secret Bunkers', 'Gas stations']);
    for (const [name, layer] of Object.entries(categoryLayers)) {
      if (keep.has(name)) { if (!map.hasLayer(layer)) map.addLayer(layer); }
      else if (map.hasLayer(layer)) map.removeLayer(layer);
    }
    document.querySelectorAll('.category-row').forEach(el => {
      el.classList.toggle('disabled', !keep.has(el.dataset.category));
    });
    updateStatus();
  }

  function updateStatus() {
    let active = 0;
    Object.values(categoryLayers).forEach(l => { if (map.hasLayer(l)) active++; });
    document.getElementById('status').innerHTML =
      `<i class="fas fa-layer-group"></i> Активно категорий: <b>${active}</b> / ${Object.keys(categoryLayers).length}`;
  }

  document.getElementById('search').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll('.amr-marker.highlighted').forEach(el => el.classList.remove('highlighted'));
    if (!q) return;
    const matches = allPois.filter(p =>
      p.n.toLowerCase().includes(q) || (p.c && p.c.toLowerCase().includes(q))
    ).slice(0, 30);
    matches.forEach(p => {
      const layer = categoryLayers[p.c];
      if (!layer || !map.hasLayer(layer)) return;
      layer.eachLayer(m => {
        if (m.options.title === p.n) {
          const el = m.getElement();
          if (el) {
            const icon = el.querySelector('.amr-marker');
            if (icon) icon.classList.add('highlighted');
          }
        }
      });
    });
    if (matches.length) {
      map.setView(gameToLatLng(matches[0].x, matches[0].y), 2);
    }
  });

  document.getElementById('toggle-sidebar').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
    setTimeout(() => map.invalidateSize(), 350);
  });
  document.getElementById('btnAll').addEventListener('click', () => setAll(true));
  document.getElementById('btnNone').addEventListener('click', () => setAll(false));
  document.getElementById('btnKey').addEventListener('click', showKey);

  function faClass(faName) {
    if (!faName) return 'fa-circle';
    return faName.replace(/^fa([A-Z])/, (m, c) => 'fa-' + c.toLowerCase())
                 .replace(/([A-Z])/g, (m, c) => '-' + c.toLowerCase());
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  function brandColor(name) {
    const rules = [
      [/bunker|hatch/i, '#ff3b30'],
      [/secret/i, '#ffd60a'],
      [/gas|fuel|propane/i, '#ff3b30'],
      [/vehicle|motorbike|bike|boat|paddle|rib|aircraft|garage|repair|mechanic/i, '#00d4ff'],
      [/village|outpost/i, '#00ff88'],
      [/police|shop|general/i, '#00d4ff'],
      [/gun|hunting|animal|feeder|grotto/i, '#ff9500'],
      [/bar|pub|club|restaurant|saloon/i, '#a855f7'],
      [/fishing|sardine|well|water|spring|pump|fountain/i, '#00d4ff'],
      [/quest|book|board|mailbox/i, '#ffd60a'],
      [/church/i, '#ffd60a'],
      [/research|facility/i, '#00ff88'],
      [/cave|mine/i, '#a855f7'],
      [/lighthouse|shipwreck|docks?/i, '#00d4ff'],
      [/atm|phone|hairdresser/i, '#a855f7'],
      [/field|strawberr|corn|potato|cabbage|carrot|broccoli|onion|parsnip|watermelon|sunflower/i, '#00ff88'],
      [/apple|cherry|pear|fig|olive|date|grape|rose/i, '#00ff88'],
      [/tree|log|plank|brick|cement|gravel|graphite|shed|silo/i, '#ff9500'],
      [/locker|lock|suit/i, '#ffd60a'],
      [/uranium|radiation/i, '#ffd60a'],
      [/workshop|warehouse|hangar|military|armory|toolbox|drill|lathe/i, '#ff9500'],
    ];
    for (const [re, color] of rules) {
      if (re.test(name)) return color;
    }
    return '#8b94a7';
  }

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

  map.on('click', (e) => {
    const [x, y] = latLngToGame(e.latlng.lat, e.latlng.lng);
    console.log(`https://scum-map.com/en/scum/island/${x.toFixed(1)},${y.toFixed(1)},1.5`);
  });

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
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
  }
})();
