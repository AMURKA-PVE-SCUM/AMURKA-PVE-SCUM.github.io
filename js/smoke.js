(function () {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'smokeCanvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let W, H, dpr;
    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = canvas.width = Math.floor(innerWidth * dpr);
        H = canvas.height = Math.floor(innerHeight * dpr);
        canvas.style.width = innerWidth + 'px';
        canvas.style.height = innerHeight + 'px';
    }
    resize();
    window.addEventListener('resize', resize);

    const MAX_PARTICLES = 110;
    const parts = [];
    let lastX = -1, lastY = -1;

    function spawn(x, y, big) {
        if (parts.length >= MAX_PARTICLES) parts.shift();
        parts.push({
            x: x * dpr + (Math.random() - 0.5) * 16,
            y: y * dpr + (Math.random() - 0.5) * 16,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.65) * 0.4,
            r: (big ? 14 : 8) + Math.random() * 14,
            vr: 0.3 + Math.random() * 0.4,
            life: 1,
            decay: 0.007 + Math.random() * 0.011,
            green: Math.random() < 0.28
        });
    }

    window.addEventListener('mousemove', function (e) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        if (lastX < 0 || dx * dx + dy * dy > 60) {
            lastX = e.clientX;
            lastY = e.clientY;
            spawn(e.clientX, e.clientY, false);
            if (Math.random() < 0.55) {
                spawn(e.clientX + (Math.random() - 0.5) * 34, e.clientY + (Math.random() - 0.5) * 34, true);
            }
        }
    }, { passive: true });

    function tick() {
        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';

        for (let i = parts.length - 1; i >= 0; i--) {
            const p = parts[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy -= 0.012;
            p.vx *= 0.995;
            p.r += p.vr;
            p.life -= p.decay;

            if (p.life <= 0 || p.r > 130) {
                parts.splice(i, 1);
                continue;
            }

            const a = p.life * p.life * 0.15;
            const g = ctx.createRadialGradient(p.x, p.y, p.r * 0.12, p.x, p.y, p.r);
            if (p.green) {
                g.addColorStop(0, 'rgba(0, 255, 136, ' + a.toFixed(3) + ')');
                g.addColorStop(0.55, 'rgba(0, 200, 120, ' + (a * 0.35).toFixed(3) + ')');
                g.addColorStop(1, 'rgba(0, 255, 136, 0)');
            } else {
                g.addColorStop(0, 'rgba(185, 195, 205, ' + (a * 0.85).toFixed(3) + ')');
                g.addColorStop(0.6, 'rgba(150, 160, 170, ' + (a * 0.25).toFixed(3) + ')');
                g.addColorStop(1, 'rgba(150, 160, 170, 0)');
            }

            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }

        requestAnimationFrame(tick);
    }

    tick();
})();
