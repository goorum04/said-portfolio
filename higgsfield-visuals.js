/* ================================================================
   HIGGSFIELD VISUAL LAYER — Interactive JS effects
   3D card tilt, orb mouse tracking, ambient interactions
   ================================================================ */

(function () {
    'use strict';

    /* ─── 3D CARD TILT ─── */
    function initTilt() {
        const cards = document.querySelectorAll(
            '.service-card, .pricing-card, .trust-card, .portfolio-card'
        );

        cards.forEach(card => {
            card.classList.add('hf-tilt');

            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = (e.clientX - cx) / (rect.width / 2);
                const dy = (e.clientY - cy) / (rect.height / 2);
                const rotX = -dy * 6;
                const rotY = dx * 6;
                card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.015)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
            });
        });
    }

    /* ─── ORB SUBTLE MOUSE PARALLAX ─── */
    function initOrbParallax() {
        const orbs = document.querySelectorAll('.hf-orb');
        if (!orbs.length) return;

        let ticking = false;
        const factors = [0.018, 0.012, 0.022];

        document.addEventListener('mousemove', e => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const cx = window.innerWidth / 2;
                const cy = window.innerHeight / 2;
                const dx = e.clientX - cx;
                const dy = e.clientY - cy;

                orbs.forEach((orb, i) => {
                    const f = factors[i] || 0.015;
                    const tx = dx * f;
                    const ty = dy * f;
                    orb.style.transform = `translate(${tx}px, ${ty}px)`;
                });
                ticking = false;
            });
        });
    }

    /* ─── HERO BADGE TYPING CURSOR ─── */
    function initBadgePulse() {
        const dot = document.querySelector('.badge-dot');
        if (!dot) return;
        dot.style.boxShadow = '0 0 0 0 rgba(0,212,255,0.5)';
        dot.style.animation = 'pulse-dot 2s ease-out infinite';
    }

    /* ─── SECTION REVEAL ENHANCEMENT ─── */
    function initRevealEnhancement() {
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach((entry, i) => {
                    if (entry.isIntersecting) {
                        entry.target.style.transitionDelay = `${i * 40}ms`;
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
        );

        document.querySelectorAll('.hf-t-card').forEach(el => observer.observe(el));
    }

    /* ─── CTA SECTION SPOTLIGHT FOLLOW ─── */
    function initCtaSpotlight() {
        const cta = document.querySelector('.cta-section');
        if (!cta) return;

        cta.addEventListener('mousemove', e => {
            const rect = cta.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            cta.style.setProperty('--hf-mx', `${x}%`);
            cta.style.setProperty('--hf-my', `${y}%`);
        });
    }

    /* ─── NAV ACTIVE LINK GLOW ─── */
    function initNavHighlight() {
        const current = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-links a').forEach(a => {
            const href = a.getAttribute('href');
            if (href && href.includes(current) && current !== '') {
                a.style.color = 'var(--accent-cyan)';
                a.style.textShadow = '0 0 20px rgba(0,212,255,0.4)';
            }
        });
    }

    /* ─── VIGNETTE (grain y scanlines retirados: restaban sobriedad y GPU) ─── */
    function initCinematicOverlays() {
        const vignette = document.createElement('div');
        vignette.className = 'hf-vignette';
        document.body.appendChild(vignette);
    }

    /* ─── HERO PARALLAX ON SCROLL ─── */
    function initHeroParallax() {
        const heroContent = document.querySelector('.hero-content');
        const heroAmbient = document.querySelector('.hf-hero-ambient');
        if (!heroContent) return;

        const hero = document.querySelector('.hero');
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                const heroH = hero ? hero.offsetHeight : window.innerHeight;
                if (scrollY < heroH) {
                    const p = scrollY / heroH;
                    heroContent.style.transform = `translateY(${scrollY * 0.28}px)`;
                    heroContent.style.opacity   = Math.max(0, 1 - p * 1.6);
                    if (heroAmbient) {
                        heroAmbient.style.transform = `translateY(${scrollY * 0.12}px)`;
                    }
                }
                ticking = false;
            });
        });
    }

    /* ─── HERO SPOTLIGHT (mouse follow) ─── */
    function initHeroSpotlight() {
        const hero = document.querySelector('.hero');
        if (!hero || window.matchMedia('(pointer: coarse)').matches) return;

        const spot = document.createElement('div');
        spot.className = 'hf-spotlight';
        hero.appendChild(spot);

        let rafId;
        hero.addEventListener('mousemove', e => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                const rect = hero.getBoundingClientRect();
                spot.style.left = (e.clientX - rect.left) + 'px';
                spot.style.top  = (e.clientY - rect.top)  + 'px';
            });
        });
        hero.addEventListener('mouseleave', () => { spot.style.opacity = '0'; });
        hero.addEventListener('mouseenter', () => { spot.style.opacity = '1'; });
    }

    /* ─── DATA STREAM LINES — REMOVED (replaced by aurora + hex grid) ─── */
    function initDataStream() { /* no-op */ }

    /* ─── GLITCH EFFECT — retirado (restaba sobriedad al titular) ─── */
    function initGlitch() { /* no-op */ }

    /* ─── AURORA BANDS (CSS-injected, drift across full page) ─── */
    function initAurora() {
        if (window.innerWidth < 768) return; // blur a pantalla completa: solo escritorio
        const wrap = document.createElement('div');
        wrap.className = 'hf-aurora';
        document.body.insertBefore(wrap, document.body.firstChild);
        for (let i = 0; i < 3; i++) {
            const band = document.createElement('div');
            band.className = `hf-aurora-band hf-aurora-band--${i + 1}`;
            wrap.appendChild(band);
        }
    }

    /* ─── HEX GRID CANVAS ─── */
    function initHexGrid() {
        if (window.innerWidth < 768) return; // skip on mobile for perf
        const canvas = document.createElement('canvas');
        canvas.className = 'hf-hex-canvas';
        document.body.insertBefore(canvas, document.body.firstChild);

        const ctx = canvas.getContext('2d');
        const SIZE = 38; // circumradius
        const W = canvas.width  = window.innerWidth;
        const H = canvas.height = window.innerHeight;
        const hw = Math.sqrt(3) * SIZE;
        const hh = 2 * SIZE;
        const hexes = [];

        function hex(cx, cy) {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = Math.PI / 3 * i - Math.PI / 6;
                const px = cx + SIZE * Math.cos(a);
                const py = cy + SIZE * Math.sin(a);
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.closePath();
        }

        // Build grid positions
        for (let row = -1; row * hh * 0.75 < H + hh; row++) {
            for (let col = -1; col * hw < W + hw; col++) {
                const cx = col * hw + (row % 2 === 0 ? hw / 2 : 0);
                const cy = row * hh * 0.75;
                hexes.push({ cx, cy, glow: 0, glowDir: 0, timer: Math.random() * 400 | 0 });
            }
        }

        // 30fps es indistinguible para un brillo tan lento y reduce el coste a la mitad
        let last = 0;
        function draw(now) {
            requestAnimationFrame(draw);
            if (now - last < 33) return;
            last = now;
            ctx.clearRect(0, 0, W, H);

            hexes.forEach(h => {
                // Randomly trigger glow
                h.timer--;
                if (h.timer <= 0 && h.glowDir === 0) {
                    h.glowDir = 1;
                    h.timer = 600 + Math.random() * 1200 | 0;
                }
                if (h.glowDir === 1) {
                    h.glow = Math.min(1, h.glow + 0.025);
                    if (h.glow >= 1) h.glowDir = -1;
                } else if (h.glowDir === -1) {
                    h.glow = Math.max(0, h.glow - 0.018);
                    if (h.glow <= 0) h.glowDir = 0;
                }

                const baseAlpha = 0.045;
                const glowAlpha = baseAlpha + h.glow * 0.18;
                const isCyan = (hexes.indexOf(h) % 3 !== 0);
                const col = isCyan ? '0,212,255' : '124,58,237';

                ctx.strokeStyle = `rgba(${col},${glowAlpha})`;
                ctx.lineWidth = h.glow > 0 ? 1.2 : 0.6;
                hex(h.cx, h.cy);
                ctx.stroke();

                if (h.glow > 0.3) {
                    ctx.fillStyle = `rgba(${col},${h.glow * 0.025})`;
                    hex(h.cx, h.cy);
                    ctx.fill();
                }
            });
        }

        requestAnimationFrame(draw);
    }

    /* ─── PARTICLE CANVAS — enhanced with cyan+purple mix and hub pulses ─── */
    function initParticles() {
        const heroCanvas = document.getElementById('particleCanvas');
        if (heroCanvas) heroCanvas.style.display = 'none';

        // En móvil y con reduced-motion no compensa un canvas animado a pantalla
        // completa: los orbes y el resto de la ambientación ya dan la atmósfera.
        if (window.innerWidth < 768) return;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const canvas = document.createElement('canvas');
        canvas.className = 'hf-global-canvas';
        document.body.insertBefore(canvas, document.body.firstChild);

        const ctx    = canvas.getContext('2d');
        const mobile = window.innerWidth < 768;
        const COUNT  = mobile ? 28 : 60;
        const CDIST  = 140;
        const SPEED  = 0.3;
        const CYAN   = [0, 212, 255];
        const PURPLE = [124, 58, 237];
        let W, H, particles, pulses = [];

        function resize() {
            W = canvas.width  = window.innerWidth;
            H = canvas.height = window.innerHeight;
        }

        function mkParticle(i) {
            const isHub  = i < COUNT * 0.15;
            const isCyan = Math.random() > 0.35;
            return {
                x: Math.random() * W,  y: Math.random() * H,
                vx: (Math.random() - 0.5) * SPEED,
                vy: (Math.random() - 0.5) * SPEED,
                r: isHub ? 2.8 + Math.random() * 0.8 : 1 + Math.random() * 1.2,
                isHub,
                c: isCyan ? CYAN : PURPLE,
                pt: isHub ? (Math.random() * 300 | 0) : Infinity
            };
        }

        resize();
        particles = Array.from({ length: COUNT }, (_, i) => mkParticle(i));

        // Cap a 30fps: a estas velocidades de deriva no se aprecia y el bucle de
        // conexiones O(n²) es el mayor coste de CPU de toda la página.
        let last = 0;
        function draw(now) {
            requestAnimationFrame(draw);
            if (now - last < 33) return;
            last = now;
            ctx.clearRect(0, 0, W, H);

            // Connections
            for (let i = 0; i < particles.length; i++) {
                const a = particles[i];
                a.x += a.vx; a.y += a.vy;
                if (a.x < 0 || a.x > W) a.vx *= -1;
                if (a.y < 0 || a.y > H) a.vy *= -1;

                if (a.isHub && --a.pt <= 0) {
                    pulses.push({ x: a.x, y: a.y, r: 0, maxR: CDIST * 0.85, c: a.c, alpha: 0.55 });
                    a.pt = 220 + Math.random() * 380 | 0;
                }

                for (let j = i + 1; j < particles.length; j++) {
                    const b = particles[j];
                    const dx = a.x - b.x, dy = a.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < CDIST) {
                        const t = 1 - dist / CDIST;
                        const r = ((a.c[0] + b.c[0]) / 2) | 0;
                        const g = ((a.c[1] + b.c[1]) / 2) | 0;
                        const bl = ((a.c[2] + b.c[2]) / 2) | 0;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = `rgba(${r},${g},${bl},${t * 0.16})`;
                        ctx.lineWidth = 0.75;
                        ctx.stroke();
                    }
                }
            }

            // Pulses
            for (let i = pulses.length - 1; i >= 0; i--) {
                const p = pulses[i];
                p.r += 1.8; p.alpha *= 0.968;
                if (p.alpha < 0.015 || p.r > p.maxR) { pulses.splice(i, 1); continue; }
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(${p.c.join(',')},${p.alpha})`;
                ctx.lineWidth = 1.1;
                ctx.stroke();
            }

            // Dots
            particles.forEach(a => {
                if (a.isHub) {
                    const g = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.r * 3.5);
                    g.addColorStop(0, `rgba(${a.c.join(',')},0.95)`);
                    g.addColorStop(1, `rgba(${a.c.join(',')},0)`);
                    ctx.beginPath();
                    ctx.arc(a.x, a.y, a.r * 3.5, 0, Math.PI * 2);
                    ctx.fillStyle = g;
                    ctx.fill();
                }
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${a.c.join(',')},0.7)`;
                ctx.fill();
            });
        }

        requestAnimationFrame(draw);
        window.addEventListener('resize', resize);
    }

    /* ─── CINEMATIC SECTION REVEALS ─── */
    function initCinematicReveals() {
        const targets = document.querySelectorAll(
            '.service-card, .portfolio-card, .pricing-card, .trust-card, ' +
            '.process-step, .sector-item, .stat-card, .section-header'
        );

        const obs = new IntersectionObserver(entries => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    const delay = (i % 6) * 70;
                    setTimeout(() => {
                        entry.target.classList.add('hf-visible');
                    }, delay);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

        targets.forEach(el => {
            el.classList.add('hf-reveal');
            obs.observe(el);
        });
    }

    /* ─── INIT ON DOM READY ─── */
    function init() {
        initTilt();
        initOrbParallax();
        initBadgePulse();
        initRevealEnhancement();
        initCtaSpotlight();
        initNavHighlight();
        initCinematicOverlays();
        initAurora();
        initHexGrid();
        initHeroParallax();
        initHeroSpotlight();
        initGlitch();
        initParticles();
        initCinematicReveals();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
