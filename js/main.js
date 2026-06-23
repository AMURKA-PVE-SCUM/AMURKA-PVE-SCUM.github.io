document.addEventListener('DOMContentLoaded', () => {

    AOS.init({
        duration: 800,
        easing: 'ease-out-cubic',
        once: true,
        offset: 50
    });

    // ── Streamers ──
    const streamers = [
        { name: 'netrezvbii_kot', slug: 'netrezvbii_kot', title: 'SCUM PVE' },
        { name: 'vita_min_ka', slug: 'vita_min_ka', title: 'SCUM PVE' },
        { name: 'gatu', slug: 'gatu', title: 'SCUM PVE' },
        { name: 'domo', slug: 'domo', title: 'SCUM PVE' },
    ];

    const grid = document.getElementById('streamersGrid');
    if (grid) {
        streamers.forEach((s, i) => {
            const card = document.createElement('div');
            card.className = 'streamer-card';
            card.setAttribute('data-aos', 'fade-up');
            card.setAttribute('data-aos-delay', String(100 + i * 100));
            card.innerHTML = `
                <div class="streamer-embed">
                    <iframe src="https://live.vkvideo.ru/embed/${s.slug}" allow="autoplay; fullscreen" loading="lazy"></iframe>
                </div>
                <div class="streamer-info">
                    <h3>${s.name}</h3>
                    <p>${s.title}</p>
                    <a href="https://live.vkvideo.ru/${s.slug}" class="streamer-link" target="_blank">
                        <i class="fab fa-vk"></i> Открыть на VK Видео
                    </a>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // ── Particles ──
    const particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
        for (let i = 0; i < 30; i++) {
            const p = document.createElement('div');
            p.classList.add('particle');
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = (8 + Math.random() * 12) + 's';
            p.style.animationDelay = Math.random() * 10 + 's';
            p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
            particlesContainer.appendChild(p);
        }
    }

    // ── Navbar scroll ──
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    // ── Active nav link ──
    const sections = document.querySelectorAll('.section, .hero');
    const navLinks = document.querySelectorAll('.nav-link');

    const observerOptions = { rootMargin: '-40% 0px -55% 0px' };
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === '#' + id);
                });
            }
        });
    }, observerOptions);

    sections.forEach(s => sectionObserver.observe(s));

    // ── Mobile nav toggle ──
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    // ── Animated counters ──
    const counters = document.querySelectorAll('.stat-number[data-count]');
    let countersAnimated = false;

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !countersAnimated) {
                countersAnimated = true;
                counters.forEach(counter => {
                    const target = parseFloat(counter.dataset.count);
                    const isDecimal = target % 1 !== 0;
                    const duration = 2000;
                    const step = target / (duration / 16);
                    let current = 0;

                    const timer = setInterval(() => {
                        current += step;
                        if (current >= target) {
                            current = target;
                            clearInterval(timer);
                        }
                        counter.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);
                    }, 16);
                });
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(c => counterObserver.observe(c));

    // ── Copy IP ──
    const serverIp = '85.88.179.207:7004';
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toastText');

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            toastText.textContent = 'IP скопирован: ' + text;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2500);
        }).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            toastText.textContent = 'IP скопирован: ' + text;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2500);
        });
    }

    document.getElementById('copyIp').addEventListener('click', () => {
        copyToClipboard(serverIp);
    });

    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            copyToClipboard(btn.dataset.copy || serverIp);
        });
    });

    // ── Server status from BattleMetrics API ──
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.getElementById('statusText');
    const maxPlayers = document.getElementById('maxPlayers');
    const serverVersion = document.getElementById('serverVersion');
    const serverTime = document.getElementById('serverTime');
    const heroOnline = document.querySelector('.hero-stats .stat-number[data-count]');

    async function fetchServerStatus() {
        try {
            const res = await fetch('https://api.battlemetrics.com/servers/38990087');
            const data = await res.json();
            const attrs = data.data.attributes;

            if (attrs.status === 'online') {
                statusDot.classList.add('online');
                statusText.textContent = 'Онлайн';
            } else {
                statusDot.classList.remove('online');
                statusText.textContent = 'Офлайн';
            }

            if (maxPlayers) maxPlayers.textContent = attrs.maxPlayers;
            if (serverVersion) serverVersion.textContent = attrs.details.version.substring(0, 11);
            if (serverTime) serverTime.textContent = attrs.details.time || '—';

            if (heroOnline) {
                heroOnline.textContent = attrs.players;
            }
        } catch (e) {
            statusDot.classList.remove('online');
            statusText.textContent = 'Ошибка';
        }
    }

    fetchServerStatus();
    setInterval(fetchServerStatus, 30000);

    // ── Load screenshots from bot ──
    const galleryGrid = document.querySelector('.gallery-grid');
    if (galleryGrid) {
        fetch('data/screenshots.json')
            .then(r => r.json())
            .then(screenshots => {
                if (!screenshots.length) return;
                galleryGrid.innerHTML = '';
                screenshots.forEach((s, i) => {
                    const a = document.createElement('a');
                    a.href = s.url;
                    a.className = 'gallery-item glightbox';
                    a.setAttribute('data-aos', 'zoom-in');
                    a.setAttribute('data-aos-delay', String(100 + i * 50));
                    a.innerHTML = `
                        <img src="${s.url}" alt="Screenshot by ${s.author}" loading="lazy">
                        <div class="gallery-overlay">
                            <i class="fas fa-expand"></i>
                        </div>
                    `;
                    galleryGrid.appendChild(a);
                });
            })
            .catch(() => {});
    }

    // ── Load news from bot ──
    const newsGrid = document.querySelector('.news-grid');
    if (newsGrid) {
        fetch('data/news.json')
            .then(r => r.json())
            .then(news => {
                if (!news.length) return;
                newsGrid.innerHTML = '';
                news.forEach((n, i) => {
                    const article = document.createElement('article');
                    article.className = 'news-card' + (i === 0 ? ' featured' : '');
                    article.setAttribute('data-aos', 'fade-up');
                    article.setAttribute('data-aos-delay', String(100 + i * 100));
                    const date = new Date(n.date).toLocaleDateString('ru-RU');
                    article.innerHTML = `
                        <div class="news-content">
                            <span class="news-tag">Новость</span>
                            <span class="news-date-tag">${date}</span>
                            <h3>${n.title}</h3>
                            <p>${n.content.replace(/\n/g, '<br>')}</p>
                            <p class="news-author">— ${n.author}</p>
                        </div>
                    `;
                    newsGrid.appendChild(article);
                });
            })
            .catch(() => {});
    }

    // ── GLightbox ──
    if (typeof GLightbox !== 'undefined') {
        GLightbox({
            selector: '.gallery-item',
            touchNavigation: true,
            loop: true
        });
    }

    // ── Smooth scroll for all anchor links ──
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

});
