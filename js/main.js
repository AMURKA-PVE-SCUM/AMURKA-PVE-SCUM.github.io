/* ═══════════════════════════════════════════════
   AMURKA 2.0 — Main JS
   ═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    // ── AOS ──
    AOS.init({
        duration: 700,
        easing: 'ease-out-cubic',
        once: true,
        offset: 40
    });

    // ── Particles ──
    const particlesEl = document.getElementById('particles');
    if (particlesEl) {
        for (let i = 0; i < 25; i++) {
            const p = document.createElement('div');
            p.classList.add('particle');
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = (10 + Math.random() * 15) + 's';
            p.style.animationDelay = Math.random() * 10 + 's';
            p.style.width = p.style.height = (1.5 + Math.random() * 2) + 'px';
            particlesEl.appendChild(p);
        }
    }

    // ── Navbar Scroll ──
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    // ── Mobile Nav Toggle ──
    const navToggle = document.getElementById('navToggle');
    const navMobile = document.getElementById('navMobile');
    if (navToggle && navMobile) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMobile.classList.toggle('open');
            document.body.style.overflow = navMobile.classList.contains('open') ? 'hidden' : '';
        });
        navMobile.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMobile.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    // ── Animated Counters ──
    const counters = document.querySelectorAll('[data-count]');
    let countersAnimated = false;
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !countersAnimated) {
                countersAnimated = true;
                counters.forEach(counter => {
                    const target = parseFloat(counter.dataset.count);
                    const suffix = counter.dataset.suffix || '';
                    const duration = 2000;
                    const step = target / (duration / 16);
                    let current = 0;
                    const timer = setInterval(() => {
                        current += step;
                        if (current >= target) {
                            current = target;
                            clearInterval(timer);
                        }
                        counter.textContent = Math.floor(current) + suffix;
                    }, 16);
                });
            }
        });
    }, { threshold: 0.5 });
    counters.forEach(c => counterObserver.observe(c));

    // ── Copy IP ──
    const serverIp = 'play.amurkapve.ru:7004';
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

    document.querySelectorAll('#copyIp, #ctaIp, .footer-ip').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.closest('.copy-btn') || el.id === 'copyIp' || el.id === 'ctaIp') {
                copyToClipboard(serverIp);
            }
        });
    });

    document.querySelectorAll('.copy-btn[data-copy]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            copyToClipboard(btn.dataset.copy || serverIp);
        });
    });

    // ── Scroll to Top ──
    const scrollTopBtn = document.getElementById('scrollTop');
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            scrollTopBtn.classList.toggle('visible', window.scrollY > 500);
        });
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ── Server Status ──
    async function fetchServerStatus() {
        const data = await window.AmurkaAPI.getServerStatus();

        // Nav
        const navDot = document.getElementById('navStatusDot');
        const navNum = document.getElementById('navOnlineNum');
        if (navDot) navDot.classList.toggle('online', data.online);
        if (navNum) navNum.textContent = data.players;

        // Hero
        const heroOnline = document.getElementById('heroOnline');
        if (heroOnline) heroOnline.textContent = data.players;

        // Live
        const liveDot = document.getElementById('liveStatusDot');
        const liveOnline = document.getElementById('liveOnline');
        const liveMax = document.getElementById('liveMax');
        const liveVersion = document.getElementById('liveVersion');
        if (liveDot) liveDot.classList.toggle('online', data.online);
        if (liveOnline) liveOnline.textContent = data.players;
        if (liveMax) liveMax.textContent = data.maxPlayers;
        if (liveVersion) liveVersion.textContent = data.source === 'ssm' ? 'SSM' : String(data.version || '').substring(0, 12);

        // Footer
        const footerDot = document.getElementById('footerStatusDot');
        const footerOnline = document.getElementById('footerOnline');
        if (footerDot) footerDot.classList.toggle('online', data.online);
        if (footerOnline) footerOnline.textContent = data.players + '/' + data.maxPlayers;

        // Activity Feed
        updateFeed(data);
    }

    function updateFeed(data) {
        const feedList = document.getElementById('feedList');
        if (!feedList) return;

        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

        const items = [
            { time: timeStr, type: 'server', text: 'Сервер ' + (data.online ? 'онлайн' : 'офлайн') },
            { time: timeStr, type: 'player', text: data.players + ' игроков на сервере' },
            { time: '—', type: 'event', text: 'Роботы активны: D4, B2, A4' },
        ];

        feedList.innerHTML = items.map(item => `
            <li class="feed-item">
                <span class="feed-time">${item.time}</span>
                <span class="feed-type ${item.type}">${item.type.toUpperCase()}</span>
                <span class="feed-text">${item.text}</span>
            </li>
        `).join('');
    }

    fetchServerStatus();
    setInterval(fetchServerStatus, 60000);

    // ── Load News ──
    const newsGrid = document.getElementById('newsGrid');
    if (newsGrid) {
        window.AmurkaAPI.getNews().then(news => {
            if (!news.length) return;
            newsGrid.innerHTML = '';
            news.slice(0, 3).forEach((n, i) => {
                const date = new Date(n.date).toLocaleDateString('ru-RU');
                const card = document.createElement('div');
                card.className = 'news-card';
                card.setAttribute('data-aos', 'fade-up');
                card.setAttribute('data-aos-delay', String(100 + i * 100));
                card.innerHTML = `
                    <div class="news-card-body">
                        <div class="news-card-meta">
                            <span class="tag">${date}</span>
                            <span class="tag tag-muted">Новость</span>
                        </div>
                        <h3>${n.title}</h3>
                        <p>${n.content.replace(/\n/g, '<br>')}</p>
                    </div>
                    <div class="news-card-footer">
                        <span class="btn-ghost">Подробнее</span>
                    </div>
                `;
                newsGrid.appendChild(card);
            });
        }).catch(() => {});
    }

    // ── Load Gallery ──
    const galleryGrid = document.getElementById('galleryGrid');
    if (galleryGrid) {
        window.AmurkaAPI.getScreenshots().then(screenshots => {
            if (!screenshots.length) return;
            galleryGrid.innerHTML = '';
            screenshots.slice(0, 8).forEach((s, i) => {
                const item = document.createElement('div');
                item.className = 'gallery-item';
                item.setAttribute('data-aos', 'zoom-in');
                item.setAttribute('data-aos-delay', String(50 + i * 50));
                item.innerHTML = `
                    <img src="${s.url}" alt="Screenshot by ${s.author}" loading="lazy">
                    <div class="gallery-item-overlay">
                        <i class="fas fa-expand"></i>
                    </div>
                `;
                item.addEventListener('click', () => {
                    window.open(s.url, '_blank');
                });
                galleryGrid.appendChild(item);
            });
        }).catch(() => {});
    }

    // ── Smooth scroll for anchor links ──
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

});
