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

    /* ─── FILM GRAIN + VIGNETTE + SCANLINES ─── */
    function initCinematicOverlays() {
        const grain = document.createElement('div');
        grain.className = 'hf-grain';
        document.body.appendChild(grain);

        const vignette = document.createElement('div');
        vignette.className = 'hf-vignette';
        document.body.appendChild(vignette);

        const scanlines = document.createElement('div');
        scanlines.className = 'hf-scanlines';
        document.body.appendChild(scanlines);
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

    /* ─── DATA STREAM LINES (global fixed background) ─── */
    function initDataStream() {
        const wrap = document.createElement('div');
        wrap.className = 'hf-datastream hf-datastream--global';
        document.body.insertBefore(wrap, document.body.firstChild);

        const count = 18;
        for (let i = 0; i < count; i++) {
            const line = document.createElement('div');
            line.className = 'hf-ds-line';
            const leftPct = 2 + (i / count) * 96;
            const dur = (2.5 + Math.random() * 4).toFixed(2);
            const del = (Math.random() * -8).toFixed(2);
            line.style.cssText = `left:${leftPct}%;--ds-dur:${dur}s;--ds-del:${del}s`;
            wrap.appendChild(line);
        }
    }

    /* ─── GLITCH EFFECT ON HERO TITLE ─── */
    function initGlitch() {
        const title = document.querySelector('.hero-title');
        if (!title) return;
        title.classList.add('hf-glitch');
        title.setAttribute('data-text', title.textContent);
    }

    /* ─── PARTICLE CANVAS (global fixed, neural-net style) ─── */
    function initParticles() {
        /* Hide the hero-embedded canvas — we use a global fixed one instead */
        const heroCanvas = document.getElementById('particleCanvas');
        if (heroCanvas) heroCanvas.style.display = 'none';

        const canvas = document.createElement('canvas');
        canvas.className = 'hf-global-canvas';
        document.body.insertBefore(canvas, document.body.firstChild);

        const ctx = canvas.getContext('2d');
        let W, H, particles;

        const PARTICLE_COUNT  = window.innerWidth < 768 ? 35 : 65;
        const CONNECTION_DIST = 145;
        const SPEED           = 0.32;
        const DOT_COLOR       = '0,212,255';
        const LINE_COLOR      = '0,212,255';

        function resize() {
            W = canvas.width  = window.innerWidth;
            H = canvas.height = window.innerHeight;
        }

        function makeParticle() {
            return {
                x:  Math.random() * W,
                y:  Math.random() * H,
                vx: (Math.random() - 0.5) * SPEED,
                vy: (Math.random() - 0.5) * SPEED,
                r:  1 + Math.random() * 1.4
            };
        }

        resize();
        particles = Array.from({ length: PARTICLE_COUNT }, makeParticle);

        function draw() {
            ctx.clearRect(0, 0, W, H);

            for (let i = 0; i < particles.length; i++) {
                const a = particles[i];
                a.x += a.vx;
                a.y += a.vy;
                if (a.x < 0 || a.x > W) a.vx *= -1;
                if (a.y < 0 || a.y > H) a.vy *= -1;

                ctx.beginPath();
                ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${DOT_COLOR},0.65)`;
                ctx.fill();

                for (let j = i + 1; j < particles.length; j++) {
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < CONNECTION_DIST) {
                        const alpha = (1 - dist / CONNECTION_DIST) * 0.17;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = `rgba(${LINE_COLOR},${alpha})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(draw);
        }

        draw();
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
        initHeroParallax();
        initHeroSpotlight();
        initDataStream();
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
