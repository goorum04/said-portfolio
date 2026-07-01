// ===========================
// Loader Animation
// ===========================
// Loader Animation
// ===========================
function initLoader() {
    const loader = document.getElementById('loader');

    if (!loader) {
        document.body.style.overflow = '';
        return;
    }

    document.body.style.overflow = 'hidden';

    setTimeout(() => {
        loader.classList.add('hidden');
        document.body.style.overflow = '';
        document.querySelectorAll('.animate-in').forEach(el => {
            el.style.animationPlayState = 'running';
        });
    }, 1000);
}

// ===========================
// NFC Welcome Experience
// ===========================
function isNFCVisit() {
    const p = new URLSearchParams(window.location.search);
    return p.get('nfc') === '1' || p.get('from') === 'tarjeta';
}

function initNFCWelcome() {
    const overlay  = document.getElementById('nfcOverlay');
    const canvas   = document.getElementById('nfcCanvas');
    const flash    = document.getElementById('nfcFlash');
    const ripple   = document.getElementById('nfcRipple');
    const content  = document.getElementById('nfcContent');
    const divider  = document.getElementById('nfcDivider');
    const cta      = document.getElementById('nfcCta');
    const skip     = document.getElementById('nfcSkip');
    const letters  = document.querySelectorAll('.nfc-letter');

    if (!overlay) return;

    // If GSAP didn't load (CDN blocked/slow), fall back to CSS and dismiss quickly
    if (typeof gsap === 'undefined') {
        overlay.classList.add('nfc-overlay--active');
        overlay.removeAttribute('aria-hidden');
        content.style.opacity = '1';
        letters.forEach((l, i) => {
            l.style.opacity = '1';
            l.style.transition = `opacity 0.4s ease ${0.1 + i * 0.08}s, transform 0.4s ease ${0.1 + i * 0.08}s`;
            l.style.transform = 'translateY(0) scale(1)';
        });
        document.getElementById('nfcRole').style.opacity = '1';
        document.getElementById('nfcMessage').style.opacity = '1';
        cta.style.opacity = '1';
        const fbDismiss = () => {
            overlay.classList.add('nfc-overlay--exit');
            setTimeout(() => {
                overlay.style.display = 'none';
                document.body.style.overflow = '';
                document.querySelectorAll('.animate-in').forEach(el => {
                    el.style.animationPlayState = 'running';
                });
            }, 950);
        };
        cta.addEventListener('click', fbDismiss);
        skip.addEventListener('click', fbDismiss);
        setTimeout(fbDismiss, 8000);
        return;
    }

    const isMobile = window.innerWidth < 768;

    overlay.classList.add('nfc-overlay--active');
    overlay.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';

    // Set initial states for GSAP-controlled elements
    gsap.set(letters, { opacity: 0, y: 50, scale: 1.3 });
    gsap.set([divider], { width: 0, opacity: 0 });
    gsap.set(['#nfcRole', '#nfcMessage', '#nfcCta'], { opacity: 0, y: 24 });

    // ── Canvas with devicePixelRatio ─────────────────────
    const ctx = canvas.getContext('2d');
    let W, H, CX, CY, dpr;

    function resize() {
        dpr = window.devicePixelRatio || 1;
        W   = window.innerWidth;
        H   = window.innerHeight;
        canvas.width  = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width  = W + 'px';
        canvas.style.height = H + 'px';
        ctx.scale(dpr, dpr);
        CX = W / 2;
        CY = H / 2;
        // Re-init star positions on resize
        stars.forEach(s => {
            s.x = Math.random() * W;
            s.y = Math.random() * H;
        });
    }

    const C = {
        cyan:   [0,   212, 255],
        purple: [124, 58,  237],
        pink:   [236, 72,  153],
        white:  [255, 255, 255],
        gold:   [255, 200,  50]
    };
    const PALETTE = Object.values(C);

    // Star field — fewer on mobile for smooth 60fps
    const STAR_COUNT  = isMobile ? 55 : 140;
    const BURST_COUNT = isMobile ? 80 : 200;
    const BURST_BIG   = isMobile ? 110 : 280;

    const stars = Array.from({ length: STAR_COUNT }, () => ({
        x: 0, y: 0,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r:  Math.random() * 1.6 + 0.3,
        op: Math.random() * 0.55 + 0.1,
        rgb: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        phase: Math.random() * Math.PI * 2
    }));

    // Burst / spark pool — elongated rectangles instead of circles
    const sparks = [];

    function spawnBurst(count, speedMult) {
        speedMult = speedMult || 1;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 6 + 2.5) * speedMult;
            const rgb   = PALETTE[Math.floor(Math.random() * PALETTE.length)];
            sparks.push({
                x: CX, y: CY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                w:  Math.random() * 14 + 4,   // length of spark
                h:  Math.random() * 1.8 + 0.8, // thickness
                life: 1,
                decay: Math.random() * 0.013 + 0.005,
                rgb
            });
        }
    }

    // Canvas shockwaves
    const waves = [];
    function spawnShockwave() {
        waves.push({ r: 0, life: 1, rgb: C.cyan, speed: 20 });
        waves.push({ r: 0, life: 0.8, rgb: C.purple, speed: 14, delay: 6 });
    }

    resize();
    window.addEventListener('resize', resize);

    let raf;

    function drawFrame() {
        ctx.clearRect(0, 0, W, H);
        // Trail layer — screen blend so black=transparent
        // Mobile: opaque dark fill (no mix-blend-mode). Desktop: transparent trail
        ctx.fillStyle = isMobile ? 'rgba(5,5,12,0.88)' : 'rgba(0,0,0,0.22)';
        ctx.fillRect(0, 0, W, H);

        // Stars
        stars.forEach(s => {
            s.x = (s.x + s.vx + W) % W;
            s.y = (s.y + s.vy + H) % H;
            s.phase += 0.035;
            const alpha = s.op * (0.55 + 0.45 * Math.sin(s.phase));
            const [r, g, b] = s.rgb;
            const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3.5);
            grd.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
            grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r * 3.5, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();
        });

        // Shockwaves
        for (let i = waves.length - 1; i >= 0; i--) {
            const w = waves[i];
            if (w.delay > 0) { w.delay--; continue; }
            w.r    += w.speed;
            w.life -= 0.03;
            if (w.life <= 0) { waves.splice(i, 1); continue; }
            const [r, g, b] = w.rgb;
            ctx.beginPath();
            ctx.arc(CX, CY, w.r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${r},${g},${b},${w.life * 0.75})`;
            ctx.lineWidth = 2.5 * w.life;
            ctx.stroke();
        }

        // Elongated sparks
        for (let i = sparks.length - 1; i >= 0; i--) {
            const p = sparks[i];
            p.x  += p.vx;
            p.y  += p.vy;
            p.vx *= 0.982;
            p.vy *= 0.982;
            p.vy += 0.07;
            p.life -= p.decay;
            if (p.life <= 0) { sparks.splice(i, 1); continue; }

            const [r, g, b] = p.rgb;
            const angle = Math.atan2(p.vy, p.vx);

            // Glow halo
            const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.w * 1.8);
            grd.addColorStop(0, `rgba(${r},${g},${b},${p.life * 0.7})`);
            grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.w * 1.8, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();

            // Elongated spark body
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(angle);
            ctx.fillStyle = `rgba(${r},${g},${b},${p.life})`;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            // Bright white core
            ctx.fillStyle = `rgba(255,255,255,${p.life * 0.8})`;
            ctx.fillRect(-p.w * 0.3, -p.h * 0.35, p.w * 0.6, p.h * 0.7);
            ctx.restore();
        }

        raf = requestAnimationFrame(drawFrame);
    }
    drawFrame();

    // ── GSAP timeline ────────────────────────────────────
    const tl = gsap.timeline();

    // Phase 1: burst during ripple (t=1s)
    tl.add(() => { spawnBurst(BURST_COUNT); spawnShockwave(); }, 1.0);

    // Phase 2: reveal — flash + burst + letters
    tl.add(() => {
        ripple.classList.add('nfc-ripple-wrap--hide');
        gsap.set(content, { opacity: 1 });
        if (flash) {
            flash.classList.add('nfc-flash--go');
            setTimeout(() => flash.classList.remove('nfc-flash--go'), 600);
        }
        spawnBurst(BURST_BIG);
        spawnShockwave();
    }, 1.6);

    // Letters stagger in — use .to() since gsap.set() already set initial state
    tl.to(letters, {
        opacity: 1, y: 0, scale: 1,
        stagger: 0.08,
        ease: 'back.out(1.8)',
        duration: 0.55
    }, 1.65);

    // Divider line draws itself
    tl.to(divider, {
        width: 'min(300px, 68vw)',
        opacity: 1,
        duration: 0.75,
        ease: 'power3.out'
    }, 2.15);

    // Role
    tl.to('#nfcRole', {
        opacity: 1, y: 0,
        duration: 0.6,
        ease: 'power2.out'
    }, 2.45);

    // Message
    tl.to('#nfcMessage', {
        opacity: 1, y: 0,
        duration: 0.6,
        ease: 'power2.out'
    }, 3.0);

    // CTA
    tl.to('#nfcCta', {
        opacity: 1, y: 0, scale: 1,
        duration: 0.65,
        ease: 'back.out(2)'
    }, 3.7);

    // Auto-dismiss at t=9.5s
    tl.add(dismiss, 9.5);

    // ── Dismiss ───────────────────────────────────────────
    let dismissed = false;
    function dismiss() {
        if (dismissed) return;
        dismissed = true;
        tl.kill();
        spawnBurst(100);
        gsap.to(overlay, {
            opacity: 0,
            duration: 0.95,
            ease: 'power2.inOut',
            onComplete() {
                cancelAnimationFrame(raf);
                overlay.style.display = 'none';
                document.body.style.overflow = '';
                document.querySelectorAll('.animate-in').forEach(el => {
                    el.style.animationPlayState = 'running';
                });
            }
        });
        if (typeof dataLayer !== 'undefined') {
            dataLayer.push({ event: 'nfc_welcome_dismissed' });
        }
    }

    cta.addEventListener('click', dismiss);
    skip.addEventListener('click', dismiss);

    if (typeof dataLayer !== 'undefined') {
        dataLayer.push({ event: 'nfc_card_scan' });
    }
}

// ===========================
// Custom Cursor
// ===========================
function initCursor() {
    const cursor = document.getElementById('cursor');
    const follower = document.getElementById('cursorFollower');

    if (!cursor || !follower) return;

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateCursor() {
        cursorX += (mouseX - cursorX) * 0.2;
        cursorY += (mouseY - cursorY) * 0.2;
        followerX += (mouseX - followerX) * 0.1;
        followerY += (mouseY - followerY) * 0.1;

        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        follower.style.left = followerX + 'px';
        follower.style.top = followerY + 'px';

        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover effects
    const hoverElements = document.querySelectorAll('a, button, .service-card, .portfolio-card, .skill-pill');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hover');
            follower.classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover');
            follower.classList.remove('hover');
        });
    });
}

// ===========================
// Enhanced Particle System
// ===========================
const HEX_RGB = {
    '#00d4ff': [0, 212, 255],
    '#7c3aed': [124, 58, 237],
    '#ec4899': [236, 72, 153],
    '#22c55e': [34, 197, 94]
};

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.trails = [];
        this.mouse = { x: null, y: null, radius: 200 };
        this.connectionDistance = 130;
        this.colors = ['#00d4ff', '#7c3aed', '#ec4899', '#22c55e'];
        this.running = true;

        this.resize();
        this.init();
        this.bindEvents();
        this.animate();
    }

    // Fewer particles on smaller screens — O(n²) connections make this the
    // single biggest CPU cost, so it must scale with the viewport.
    targetCount() {
        const w = window.innerWidth;
        if (w <= 768) return 30;
        if (w <= 1280) return 50;
        return 70;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        this.particles = [];
        const count = this.targetCount();
        for (let i = 0; i < count; i++) {
            const color = this.colors[Math.floor(Math.random() * this.colors.length)];
            const rgb = HEX_RGB[color];
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                radius: Math.random() * 2.5 + 0.5,
                opacity: Math.random() * 0.6 + 0.2,
                color,
                r: rgb[0], g: rgb[1], b: rgb[2],
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: Math.random() * 0.02 + 0.01
            });
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resize();
            this.init();
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;

            // Add trail on mouse move
            if (Math.random() > 0.7) {
                const color = this.colors[Math.floor(Math.random() * this.colors.length)];
                const rgb = HEX_RGB[color];
                this.trails.push({ x: e.clientX, y: e.clientY, life: 1, r: rgb[0], g: rgb[1], b: rgb[2] });
            }
        });

        window.addEventListener('mouseout', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });

        // Pause when the tab is hidden — no point burning CPU off-screen.
        document.addEventListener('visibilitychange', () => {
            this.running = !document.hidden;
            if (this.running) this.animate();
        });

        // Pause when the hero canvas scrolls out of view.
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
                const visible = entries[0].isIntersecting;
                if (visible && !this.running) {
                    this.running = true;
                    this.animate();
                } else if (!visible) {
                    this.running = false;
                }
            }, { threshold: 0 });
            io.observe(this.canvas);
        }
    }

    animate() {
        if (!this.running) return;

        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw and update trails
        this.trails = this.trails.filter(t => {
            t.life -= 0.02;
            if (t.life <= 0) return false;
            ctx.beginPath();
            ctx.arc(t.x, t.y, 3 * t.life, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${t.r}, ${t.g}, ${t.b}, ${t.life * 0.5})`;
            ctx.fill();
            return true;
        });

        const particles = this.particles;
        const connDist = this.connectionDistance;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            // Pulse animation
            p.pulse += p.pulseSpeed;
            const pulseScale = 1 + Math.sin(p.pulse) * 0.3;

            // Move
            p.x += p.vx;
            p.y += p.vy;

            // Bounce with energy
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1.1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1.1;

            // Keep in bounds
            p.x = Math.max(0, Math.min(this.canvas.width, p.x));
            p.y = Math.max(0, Math.min(this.canvas.height, p.y));

            // Mouse interaction with attraction
            if (this.mouse.x !== null) {
                const dx = p.x - this.mouse.x;
                const dy = p.y - this.mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < this.mouse.radius) {
                    const force = (this.mouse.radius - dist) / this.mouse.radius;
                    const angle = Math.atan2(dy, dx);
                    p.vx += Math.cos(angle + Math.PI / 2) * force * 0.02;
                    p.vy += Math.sin(angle + Math.PI / 2) * force * 0.02;
                    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                    if (speed > 3) {
                        p.vx = (p.vx / speed) * 3;
                        p.vy = (p.vy / speed) * 3;
                    }
                }
            }

            // Soft glow halo (single translucent circle — cheaper than a
            // per-frame radial gradient).
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * pulseScale * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.opacity * 0.12})`;
            ctx.fill();

            // Core
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * pulseScale, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.opacity})`;
            ctx.fill();

            // Connect with solid lines (no per-pair gradient allocation)
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < connDist) {
                    const opacity = (1 - dist / connDist) * 0.25;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${opacity})`;
                    ctx.lineWidth = opacity * 2;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(() => this.animate());
    }
}

// ===========================
// Hero Parallax
// ===========================
function initParallax() {
    const heroContent = document.querySelector('.hero-content');
    const hero = document.querySelector('.hero');

    if (!heroContent || !hero) return;

    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        const moveX = x * 0.02;
        const moveY = y * 0.02;

        heroContent.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });

    hero.addEventListener('mouseleave', () => {
        heroContent.style.transform = 'translate(0, 0)';
    });
}

// ===========================
// Magnetic Buttons
// ===========================
function initMagneticButtons() {
    const magneticElements = document.querySelectorAll('.magnetic');

    magneticElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;

            const span = el.querySelector('span');
            if (span) {
                span.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
            }
        });

        el.addEventListener('mouseleave', () => {
            el.style.transform = 'translate(0, 0)';
            const span = el.querySelector('span');
            if (span) {
                span.style.transform = 'translate(0, 0)';
            }
        });
    });
}

// ===========================
// Scroll Reveal Animation
// ===========================
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
    });

    reveals.forEach(el => observer.observe(el));
}

// ===========================
// Counter Animation
// ===========================
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number[data-count]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.count);
                const duration = 2000;
                const start = performance.now();

                function update(now) {
                    const elapsed = now - start;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
                    el.textContent = Math.round(target * eased);

                    if (progress < 1) {
                        requestAnimationFrame(update);
                    }
                }

                requestAnimationFrame(update);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
}

// ===========================
// Navbar Scroll Effect
// ===========================
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const toggle = document.getElementById('navToggle');
    const navLinks = document.querySelector('.nav-links');
    let lastScroll = 0;
    let menuOpen = false;

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;

        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    if (toggle && navLinks) {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            menuOpen = !menuOpen;
            toggle.classList.toggle('active', menuOpen);
            navLinks.classList.toggle('active', menuOpen);
            document.body.style.overflow = menuOpen ? 'hidden' : '';
            document.body.style.position = menuOpen ? 'fixed' : '';
            document.body.style.width = menuOpen ? '100%' : '';
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menuOpen = false;
                toggle.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.width = '';
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menuOpen) {
                menuOpen = false;
                toggle.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.width = '';
            }
        });
    }
}

// ===========================
// Smooth Scroll
// ===========================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80;
                const position = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top: position, behavior: 'smooth' });
            }
        });
    });
}

// ===========================
// FAQ Accordion
// ===========================
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        // Native <details>/<summary> FAQ items (e.g. the home page) have no
        // .faq-question — skip them so this never throws and aborts init.
        if (!question) return;

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                }
            });

            // Toggle current item
            item.classList.toggle('active');
            question.setAttribute('aria-expanded', !isActive);

            // Track FAQ interaction
            if (typeof dataLayer !== 'undefined') {
                dataLayer.push({
                    'event': 'faq_click',
                    'faq_question': question.querySelector('span').textContent
                });
            }
        });
    });
}

// ===========================
// Service Worker Registration
// ===========================
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('SW registered:', registration.scope);
                })
                .catch(error => {
                    console.log('SW registration failed:', error);
                });
        });
    }
}

// ===========================
// Analytics Events
// ===========================
function initAnalytics() {
    // Track CTA clicks
    document.querySelectorAll('.btn-primary, .whatsapp-float').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof dataLayer !== 'undefined') {
                dataLayer.push({
                    'event': 'cta_click',
                    'cta_text': btn.textContent.trim() || 'WhatsApp Float'
                });
            }
        });
    });

    // Track scroll depth
    let maxScroll = 0;
    const scrollMilestones = [25, 50, 75, 100];
    const trackedMilestones = new Set();

    window.addEventListener('scroll', () => {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);

        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;

            scrollMilestones.forEach(milestone => {
                if (scrollPercent >= milestone && !trackedMilestones.has(milestone)) {
                    trackedMilestones.add(milestone);
                    if (typeof dataLayer !== 'undefined') {
                        dataLayer.push({
                            'event': 'scroll_depth',
                            'scroll_percent': milestone
                        });
                    }
                }
            });
        }
    });

    // Track time on page
    let timeOnPage = 0;
    setInterval(() => {
        timeOnPage += 30;
        if ([30, 60, 120, 300].includes(timeOnPage)) {
            if (typeof dataLayer !== 'undefined') {
                dataLayer.push({
                    'event': 'time_on_page',
                    'seconds': timeOnPage
                });
            }
        }
    }, 30000);
}

// ===========================
// Scroll Progress Bar
// ===========================
function initScrollProgress() {
    const progressBar = document.getElementById('scrollProgress');
    if (!progressBar) return;

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    });
}

// ===========================
// Back to Top Button
// ===========================
function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===========================
// Hide floating buttons while the hero is in view
// ===========================
// The hero already has two WhatsApp CTAs (the primary button and the audit
// banner). On mobile, the fixed floating buttons can visually overlap the
// wide audit banner while scrolling past it, covering its arrow/CTA. Hiding
// them while the hero is visible avoids that collision entirely.
function initWhatsAppFloatVisibility() {
    const hero = document.getElementById('hero');
    const floats = document.querySelectorAll('.whatsapp-float, .chat-widget-toggle');
    if (!hero || !floats.length || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver((entries) => {
        floats.forEach(fab => fab.classList.toggle('wf-hidden', entries[0].isIntersecting));
    }, { threshold: 0 });
    io.observe(hero);
}

// ===========================
// AI Chat Widget (live demo)
// ===========================
// Calls a Vercel serverless function that proxies to the Claude API, keeping
// the API key server-side. Update this URL after deploying the /api/chat
// function to Vercel (see api/chat.js).
const CHAT_API_URL = 'https://said-portfolio-ashy.vercel.app/api/chat';

function initChatbot() {
    const t = () => translations[currentLang].chatbot;
    const history = [];

    const toggle = document.createElement('button');
    toggle.className = 'chat-widget-toggle';
    toggle.setAttribute('aria-label', t().label);
    toggle.innerHTML = `
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>`;

    const panel = document.createElement('div');
    panel.className = 'chat-widget-panel';
    panel.innerHTML = `
        <div class="chat-widget-header">
            <div class="chat-widget-header-text">
                <h3 data-i18n="chatbot.title">Asistente IA · SaeTech</h3>
                <p data-i18n="chatbot.subtitle">Ejemplo interactivo de lo que podemos construir para tu negocio.</p>
            </div>
            <button type="button" class="chat-widget-close" aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
        </div>
        <div class="chat-widget-messages"></div>
        <p class="chat-widget-disclaimer" data-i18n="chatbot.disclaimer">Demo funcional con la API de Claude (Anthropic). Las respuestas son generadas por IA.</p>
        <form class="chat-widget-form">
            <input type="text" class="chat-widget-input" data-i18n-placeholder="chatbot.placeholder" placeholder="Escribe tu pregunta..." autocomplete="off">
            <button type="submit" class="chat-widget-send" aria-label="Send">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg>
            </button>
        </form>`;

    document.body.appendChild(toggle);
    document.body.appendChild(panel);

    const messagesEl = panel.querySelector('.chat-widget-messages');
    const form = panel.querySelector('.chat-widget-form');
    const input = panel.querySelector('.chat-widget-input');
    const sendBtn = panel.querySelector('.chat-widget-send');
    const closeBtn = panel.querySelector('.chat-widget-close');

    function addMessage(role, text) {
        const el = document.createElement('div');
        el.className = role === 'user' ? 'chat-msg chat-msg-user' : 'chat-msg chat-msg-assistant';
        el.textContent = text;
        messagesEl.appendChild(el);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return el;
    }

    function showWelcome() {
        messagesEl.innerHTML = '';
        addMessage('assistant', t().welcome);
    }

    let opened = false;
    toggle.addEventListener('click', () => {
        const willOpen = !panel.classList.contains('open');
        panel.classList.toggle('open', willOpen);
        if (willOpen) {
            if (!opened) {
                showWelcome();
                opened = true;
            }
            input.focus();
        }
    });

    closeBtn.addEventListener('click', () => panel.classList.remove('open'));

    // Re-render the welcome message on language switch, as long as the user
    // hasn't started a real conversation yet (avoids wiping their messages).
    document.addEventListener('languagechange-app', () => {
        toggle.setAttribute('aria-label', t().label);
        if (opened && history.length === 0) showWelcome();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text || sendBtn.disabled) return;

        addMessage('user', text);
        history.push({ role: 'user', content: text });
        input.value = '';
        sendBtn.disabled = true;

        const typingEl = document.createElement('div');
        typingEl.className = 'chat-msg-typing';
        typingEl.innerHTML = '<span></span><span></span><span></span>';
        messagesEl.appendChild(typingEl);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        try {
            const res = await fetch(CHAT_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: history.slice(-20) }),
            });
            const data = await res.json();
            typingEl.remove();

            if (!res.ok || !data.reply) throw new Error(data.error || 'error');

            addMessage('assistant', data.reply);
            history.push({ role: 'assistant', content: data.reply });
        } catch (err) {
            typingEl.remove();
            addMessage('assistant', t().error);
        } finally {
            sendBtn.disabled = false;
        }
    });
}

// ===========================
// Email Popup
// ===========================
function initEmailPopup() {
    const popup = document.getElementById('emailPopup');
    const closeBtn = document.getElementById('emailPopupClose');

    if (!popup || !closeBtn) return;

    // Check if already shown in this session
    if (sessionStorage.getItem('emailPopupShown')) return;

    // Show popup after 15 seconds
    setTimeout(() => {
        if (window.scrollY > 300) {
            popup.classList.add('visible');
            sessionStorage.setItem('emailPopupShown', 'true');
        }
    }, 15000);

    // Or show after scrolling 50% of page
    let popupShown = false;
    window.addEventListener('scroll', () => {
        if (popupShown) return;

        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (window.scrollY > docHeight * 0.5) {
            popup.classList.add('visible');
            sessionStorage.setItem('emailPopupShown', 'true');
            popupShown = true;
        }
    });

    closeBtn.addEventListener('click', () => {
        popup.classList.remove('visible');
    });
}

// ===========================
// Price Calculator
// ===========================
function initCalculator() {
    const calcType = document.getElementById('calcType');
    const calcUrgency = document.getElementById('calcUrgency');
    const calcPrice = document.getElementById('calcPrice');

    if (!calcType || !calcUrgency || !calcPrice) return;

    let basePrice = 500;
    let featuresPrice = 0;
    let multiplier = 1;

    function updatePrice() {
        const total = Math.round((basePrice + featuresPrice) * multiplier);
        calcPrice.textContent = total.toLocaleString('es-ES') + '€';
    }

    calcType.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            calcType.querySelectorAll('.calc-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            basePrice = parseInt(btn.dataset.price);
            updatePrice();
        });
    });

    const checkboxes = document.querySelectorAll('.calc-checkbox input');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            featuresPrice = 0;
            checkboxes.forEach(cb => {
                if (cb.checked) {
                    featuresPrice += parseInt(cb.dataset.price);
                }
            });
            updatePrice();
        });
    });

    calcUrgency.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            calcUrgency.querySelectorAll('.calc-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            multiplier = parseFloat(btn.dataset.multiplier);
            updatePrice();
        });
    });
}

// ===========================
// Translations
// ===========================
const translations = {
    es: {
        loader: { tag: 'Desarrollo Digital' },
        nfc: {
            role: 'Freelance Digital Developer&nbsp;·&nbsp;Andorra',
            message: 'Gracias por escanear mi tarjeta —<br><span class="nfc-message-highlight">aquí empieza tu proyecto</span>',
            cta: 'Explorar mi trabajo',
            skip: 'Saltar'
        },
        nav: { services: 'Servicios', portfolio: 'Portfolio', blog: 'Blog', about: 'Sobre mí', contact: 'Contacto' },
        hero: {
            badge: 'Aceptando nuevos proyectos',
            greeting: 'Hola, soy',
            headline: 'Webs, apps y SaaS que <span class="text-gradient">impulsan tu negocio</span>',
            subtitle: 'Somos un estudio digital en Andorra. Diseñamos y desarrollamos productos a medida que hacen crecer tu negocio.',
            description: 'Implementación de IA · Apps · Páginas Web · Automatizaciones · SaaS',
            cta1: 'Pedir Presupuesto',
            cta2: 'Ver Proyectos'
        },
        stats: { projects: 'Proyectos', satisfaction: 'Satisfacción', sectors: 'Sectores' },
        sectors: {
            title: 'Hemos trabajado con negocios de',
            restaurants: '🍽️ Restaurantes',
            realestate: '🏠 Inmobiliarias',
            gyms: '💪 Gimnasios',
            hotels: '🏨 Hoteles'
        },
        servicesHome: {
            tag: '// Servicios',
            title: 'Soluciones <span class="text-gradient">digitales</span>',
            web: { title: 'Desarrollo Web', desc: 'Páginas web modernas, rápidas y responsive.' },
            apps: { title: 'Apps Móviles', desc: 'Aplicaciones iOS y Android nativas.' },
            saas: { title: 'SaaS', desc: 'Plataformas escalables con suscripciones.' },
            auto: { title: 'Automatizaciones', desc: 'Bots, workflows y conexiones.' },
            ai: { title: 'IA Segura', desc: 'Chatbots, automatización e integración de IA protegiendo tus datos.' },
            seo: { title: 'SEO y GEO', desc: 'Aparece en Google y en las búsquedas con IA como ChatGPT, Claude y Perplexity.' },
            link: 'Ver más →',
            cta: 'Ver todos los servicios'
        },
        portfolioHome: {
            tag: '// Portfolio',
            title: 'Proyectos <span class="text-gradient">destacados</span>',
            shop: { badge: 'E-commerce', desc: 'Tienda online de suplementos deportivos con catálogo interactivo y checkout optimizado para conversión.', metric: '+32% conversión en checkout' },
            bot: { badge: 'Bot', desc: 'Bot que genera presupuestos personalizados automáticamente, disponible 24/7 sin intervención humana.', metric: 'Respuestas en segundos, 24/7' },
            cta: 'Ver todos los proyectos'
        },
        testimonialsHome: {
            tag: '// Testimonios',
            title: 'Lo que dicen <span class="text-gradient">mis clientes</span>',
            t1: '"SaeTech desarrolló nuestra web de reservas en tiempo récord. Las reservas aumentaron un 40%."',
            t2: '"Profesional y rápido. Nuestra app inmobiliaria funciona perfectamente."',
            t3: '"La app del gimnasio nos permitió digitalizar todo. ¡Excelente trabajo!"',
            t4: '"Nuestra web de hotel quedó espectacular. Reservas online funcionando perfecto."',
            t5: '"Automatizó todos nuestros procesos. Ahorramos 10 horas semanales."',
            t6: '"El SaaS que creó para nuestra tienda superó todas las expectativas."'
        },
        process: {
            tag: '// Proceso',
            title: 'Cómo <span class="text-gradient">trabajo</span>',
            subtitle: 'Un proceso claro de principio a fin.',
            step1: { title: 'Consulta', desc: 'Analizamos tu idea y objetivos.', time: '1-2 días' },
            step2: { title: 'Propuesta', desc: 'Presupuesto detallado con plazos.', time: '2-3 días' },
            step3: { title: 'Diseño', desc: 'Creo el diseño visual de tu proyecto.', time: '1-2 semanas' },
            step4: { title: 'Desarrollo', desc: 'Programamos con actualizaciones semanales.', time: '2-6 semanas' },
            step5: { title: 'Lanzamiento', desc: 'Ajustes finales y publicación.', time: '1-2 días' }
        },
        trust: {
            tag: 'Garantías',
            title: 'Por qué <span class="text-gradient">confiar en nosotros</span>',
            card1: { title: 'Satisfacción garantizada', desc: 'No pagas hasta que estés 100% satisfecho con el resultado.' },
            card2: { title: 'Entrega rápida', desc: 'Plazos realistas que cumplimos. Sin sorpresas ni retrasos.' },
            card3: { title: 'Soporte incluido', desc: '30 días de soporte gratuito después del lanzamiento.' },
            card4: { title: 'Comunicación directa', desc: 'Hablas directamente con el equipo. Sin intermediarios.' }
        },
        pricing: {
            tag: 'Precios',
            title: 'Inversión <span class="text-gradient">transparente</span>',
            subtitle: 'Precios orientativos. Cada proyecto es único.',
            basic: {
                name: 'Básico', title: 'Landing Page', desc: 'Perfecto para empezar tu presencia digital.',
                f1: 'Diseño responsive', f2: 'SEO básico', f3: 'Formulario de contacto', f4: '1 revisión incluida', f5: 'Entrega en 1-2 semanas',
                action: 'Empezar'
            },
            pro: {
                name: 'Recomendado', title: 'Web Profesional', desc: 'Ideal para negocios que quieren crecer.',
                f1: 'Hasta 5 páginas', f2: 'SEO avanzado', f3: 'Panel de administración', f4: 'Integración redes sociales', f5: '3 revisiones incluidas', f6: 'Entrega en 2-4 semanas',
                action: 'Empezar'
            },
            premium: {
                name: 'Premium', title: 'App / SaaS', desc: 'Soluciones complejas a medida.',
                f1: 'App móvil o plataforma SaaS', f2: 'Backend completo', f3: 'Base de datos', f4: 'APIs y integraciones', f5: 'Revisiones ilimitadas', f6: 'Soporte 3 meses',
                action: 'Consultar'
            }
        },
        cta: { title: '¿Tienes un proyecto en mente?', desc: 'Cuéntame tu idea y te ayudo a hacerla realidad.', btn: 'Hablemos' },
        footer: { tagline: 'Desarrollo digital desde Andorra 🇦🇩', copyright: '&copy; 2026 Said. Todos los derechos reservados.' },
        emailPopup: { title: '🎁 Recibe consejos gratis', desc: 'Trucos de desarrollo web y ofertas exclusivas. Sin spam.', placeholder: 'Tu email', submit: 'Suscribirme' },
        geo: {
            tag: '// Posicionamiento IA',
            title: 'Que la <span class="text-gradient">IA recomiende</span> tu negocio',
            subtitle: 'El 40% de las personas ya pregunta a ChatGPT, Claude o Perplexity antes que a Google. Te posiciono para aparecer en sus respuestas.',
            th: { feature: '&nbsp;', seo: 'SEO tradicional', geo: 'Posicionamiento IA (GEO)' },
            r1: { label: 'Dónde apareces', seo: 'Resultados de Google', geo: 'Respuestas de ChatGPT, Claude, Perplexity y Gemini' },
            r2: { label: 'Competencia', seo: 'Muy alta, miles de webs', geo: 'Baja: solo el 1% de empresas en Andorra lo trabaja' },
            r3: { label: 'Intención de compra', seo: 'Media, el usuario aún compara', geo: 'Alta: la IA ya recomienda una opción concreta' },
            r4: { label: 'Cómo se consigue', seo: 'Keywords y enlaces', geo: 'Contenido optimizado, datos estructurados y llms.txt' },
            cta: 'Auditoría GEO gratis'
        },
        faq: {
            tag: '// FAQ',
            title: 'Preguntas <span class="text-gradient">frecuentes</span>',
            subtitle: 'Lo que más me preguntan antes de empezar un proyecto.',
            q1: { q: '¿Cuánto cuesta un proyecto?', a: 'Una landing desde 500€ y una web profesional o app desde 1.500€. Siempre te doy un presupuesto cerrado por adelantado, sin sorpresas ni costes ocultos.' },
            q2: { q: '¿Cuánto tardas en entregar?', a: 'Una web entre 1 y 4 semanas; apps y plataformas SaaS entre 4 y 8 semanas. Recibes avances cada semana para que veas el progreso en todo momento.' },
            q3: { q: '¿El código y los accesos son míos?', a: 'Sí. Al finalizar te entrego todo el código fuente y los accesos. Sin dependencias ocultas ni lock-in: tu proyecto es 100% tuyo.' },
            q4: { q: '¿Trabajas con clientes fuera de Andorra?', a: 'Sí, trabajo en remoto con clientes de toda Europa. Comunicación directa conmigo por WhatsApp o videollamada, sin intermediarios.' },
            q5: { q: '¿Ofreces soporte después del lanzamiento?', a: 'Incluyo 30 días de soporte gratuito tras la entrega. Después puedes contratar un plan de mantenimiento mensual opcional si lo necesitas.' },
            q6: { q: '¿Qué es el posicionamiento en IA (GEO)?', a: 'Optimizo tu negocio para que ChatGPT, Claude o Perplexity te recomienden, no solo Google. Es un canal con muy poca competencia todavía. Pídeme una auditoría gratis.' }
        },
        audit: { hero: 'Auditoría gratis', banner: 'Auditoría de posicionamiento en IA <strong>gratis</strong> · sin compromiso' },
        ai: {
            tag: '// Inteligencia Artificial',
            title: 'Implementación de IA <span class="text-gradient">segura</span> para tu negocio',
            subtitle: 'Integramos IA donde aporta valor real — y protegiendo siempre tus datos.',
            f1: '<strong>Chatbots y asistentes</strong> que atienden 24/7, entrenados con tu propia información.',
            f2: '<strong>Automatización inteligente</strong> de tareas repetitivas para ahorrar horas de trabajo.',
            f3: '<strong>Integración</strong> con ChatGPT, Claude y las herramientas que ya usas.',
            f4: '<strong>Seguridad y privacidad</strong>: tus datos cifrados, con control de accesos y sin filtrarse a terceros.',
            cta: 'Hablemos de tu proyecto de IA'
        }
    ,
about: {
            cta: {
                button: "Contactar",
                subtitle: "Cuéntame tu proyecto y hagamos realidad tu idea.",
                title: "¿Trabajamos juntos?",
            },
            floatingCards: {
                card1Label: "12+ Proyectos",
                card2Label: "Clientes Felices",
                card3Label: "Pixel Perfect",
            },
            pageHero: {
                subtitle: "Desarrollador digital apasionado por crear productos que marcan la diferencia.",
                tag: "// Sobre mí",
                title: 'Hola, soy <span class="text-gradient">Said</span>',
            },
            skills: {
                backend: "Backend",
                frontend: "Frontend",
                other: "Otros",
                tag: "// Skills",
                title: 'Tecnologías que <span class="text-gradient">domino</span>',
            },
            story: {
                intro: "Soy Said, un desarrollador con pasión por crear productos digitales que generen valor real. Con más de <strong>12 proyectos realizados</strong>, he ayudado a negocios de diversos sectores a digitalizar sus procesos y aumentar su visibilidad online.",
                paragraph2: "He colaborado con <strong>restaurantes, inmobiliarias, gimnasios y hoteles</strong>, creando desde páginas web corporativas hasta aplicaciones móviles completas. Mi enfoque se basa en entender las necesidades de cada cliente y desarrollar soluciones que generen resultados medibles.",
                paragraph3: "Cada proyecto es una oportunidad para superar expectativas. Creo en el código limpio, el diseño centrado en el usuario y la comunicación constante con mis clientes.",
                sectorGyms: "💪 Gimnasios",
                sectorHotels: "🏨 Hoteles",
                sectorRealEstate: "🏠 Inmobiliarias",
                sectorRestaurants: "🍽️ Restaurantes",
                title: 'Mi <span class="text-gradient">historia</span>',
            },
            values: {
                communication: "Comunicación",
                communicationDesc: "Actualizaciones semanales y respuesta rápida a tus dudas.",
                quality: "Calidad",
                qualityDesc: "Código limpio, bien documentado y testeado. Sin atajos.",
                speed: "Velocidad",
                speedDesc: "Plazos realistas que cumplo. Sin sorpresas.",
                support: "Soporte",
                supportDesc: "No desaparezco después del lanzamiento. Siempre disponible.",
                tag: "// Valores",
                title: 'Cómo <span class="text-gradient">trabajo</span>',
            },
        },
        services: {
            tag: "// Servicios",
            title: 'Soluciones digitales <span class="text-gradient">a medida</span>',
            subtitle: "Desarrollo productos digitales que impulsan tu negocio. Cada proyecto se adapta a tus necesidades específicas.",
            tech: "Tecnologías:",
            from: "Desde:",
            viewFull: "Ver página completa →",
            web: {
                title: "Desarrollo Web",
                desc: "Páginas web modernas, rápidas y optimizadas para convertir visitantes en clientes. Desde landing pages hasta tiendas online completas.",
                f1: "Diseño responsive para todos los dispositivos",
                f2: "Optimización SEO y velocidad de carga",
                f3: "Panel de administración fácil de usar",
                f4: "Integración con herramientas de marketing",
            },
            apps: {
                title: "Apps Móviles",
                desc: "Aplicaciones nativas para iOS y Android que ofrecen la mejor experiencia de usuario. Perfectas para fidelizar clientes y mejorar procesos internos.",
                f1: "Publicación en App Store y Google Play",
                f2: "Notificaciones push integradas",
                f3: "Funcionamiento offline",
                f4: "Sincronización en tiempo real",
            },
            saas: {
                title: "Plataformas SaaS",
                desc: "Software como servicio completo con sistema de suscripciones, dashboard de administración y API para integraciones.",
                f1: "Sistema de pagos con Stripe",
                f2: "Dashboard de métricas en tiempo real",
                f3: "Gestión de usuarios y roles",
                f4: "API REST documentada",
            },
            auto: {
                title: "Automatizaciones",
                desc: "Automatiza tareas repetitivas y conecta tus herramientas. Ahorra horas de trabajo manual con workflows inteligentes.",
                f1: "Integración con cualquier API",
                f2: "Bots de WhatsApp y Telegram",
                f3: "Sincronización entre plataformas",
                f4: "Reportes automáticos",
            },
            ai: {
                title: "IA Segura",
                desc: "Implementamos inteligencia artificial donde aporta valor real para tu negocio — chatbots, asistentes y automatización inteligente — protegiendo siempre tus datos.",
                f1: "Chatbots y asistentes 24/7 entrenados con tu información",
                f2: "Automatización inteligente de procesos y atención",
                f3: "Integración con ChatGPT, Claude y tus herramientas",
                f4: "Datos cifrados, control de accesos y privacidad garantizada",
            },
            seo: {
                title: "Posicionamiento SEO y GEO",
                desc: "Optimizamos tu web para que te encuentren: tanto en Google (SEO) como en las nuevas búsquedas con IA como ChatGPT, Claude y Perplexity (GEO).",
                f1: "Auditoría SEO técnica y de contenidos",
                f2: "Velocidad, Core Web Vitals y datos estructurados (schema.org)",
                f3: "Posicionamiento en IA (GEO): aparecer en ChatGPT, Claude y Perplexity",
                f4: "Implementación de llms.txt y seguimiento de resultados",
            },
            cta: {
                title: "¿Listo para empezar?",
                desc: "Cuéntame tu proyecto y te envío un presupuesto personalizado.",
                btn: "Contactar",
            },
        },
        blog: {
            cta: {
                button: "Sugerir tema",
                subtitle: "Dime qué tema te interesa y prepararé un artículo.",
                title: "¿Quieres que escriba sobre algo?",
            },
            pageHero: {
                subtitle: "Tutoriales, consejos y tendencias sobre desarrollo web, apps y SaaS.",
                tag: "// Blog",
                title: 'Consejos de <span class="text-gradient">desarrollo</span>',
            },
            post1: {
                date: "15 Feb 2026",
                excerpt: "Guía completa para desarrollar una aplicación fitness con React Native, desde la idea hasta la publicación en stores.",
                readMore: "Leer más →",
                title: "Cómo crear una app de gimnasio en 2026",
            },
            post2: {
                date: "10 Feb 2026",
                excerpt: "Descubre cómo automatizar tareas repetitivas y ahorrar horas de trabajo con n8n y zapier.",
                readMore: "Leer más →",
                title: "Automatizaciones que todo negocio necesita",
            },
            post3: {
                date: "5 Feb 2026",
                excerpt: "No dependas solo de redes sociales. Una web profesional multiplica las reservas.",
                readMore: "Leer más →",
                title: "Por qué tu restaurante necesita web propia",
            },
            post4: {
                date: "1 Feb 2026",
                excerpt: "Comparativa de las dos tecnologías más populares para desarrollo web en 2026.",
                readMore: "Leer más →",
                title: "React vs Next.js: ¿Cuál elegir?",
            },
            post5: {
                date: "25 Ene 2026",
                excerpt: "Cómo diseñar una web hotelera que aumente las reservas directas.",
                readMore: "Leer más →",
                title: "Webs para hoteles que convierten",
            },
            post6: {
                date: "20 Ene 2026",
                excerpt: "Las herramientas digitales que están revolucionando el sector inmobiliario.",
                readMore: "Leer más →",
                title: "Digitaliza tu inmobiliaria",
            },
        },
        contact: {
            contactInfo: {
                availability: "Disponible para nuevos proyectos",
                description: "La forma más rápida de contactar es por WhatsApp. También puedes escribirme directamente.",
                emailLabel: "Email",
                emailValue: "s91564774@gmail.com",
                locationLabel: "Ubicación",
                locationValue: "Andorra 🇦🇩",
                title: "Información de contacto",
                whatsappLabel: "WhatsApp",
                whatsappValue: "+376 601 249",
            },
            faq: {
                a1: "Depende de la complejidad. Una landing simple desde 500€, una web corporativa desde 1.000€, y un e-commerce desde 2.000€. Te doy presupuesto personalizado sin compromiso.",
                a2: "Normalmente respondo en menos de 24 horas. Si es urgente, escríbeme por WhatsApp y te responderé antes.",
                a3: "Sí, trabajo 100% remoto con clientes de todo el mundo. La comunicación es por videollamada, email y WhatsApp.",
                a4: "Solo un 30-50% para empezar, y el resto al entregar. Acepto transferencia, Bizum y PayPal.",
                q1: "¿Cuánto cuesta una web?",
                q2: "¿Cuánto tardas en responder?",
                q3: "¿Trabajas con clientes fuera de Andorra?",
                q4: "¿Pides pago por adelantado?",
                tag: "// FAQ",
                title: 'Preguntas <span class="text-gradient">frecuentes</span>',
            },
            form: {
                budgetLabel: "Presupuesto orientativo",
                budgetRange1: "Menos de 1.000€",
                budgetRange2: "1.000€ - 2.000€",
                budgetRange3: "2.000€ - 5.000€",
                budgetRange4: "Más de 5.000€",
                budgetSelectOption: "Selecciona un rango",
                emailLabel: "Email",
                emailPlaceholder: "tu@email.com",
                messageLabel: "Cuéntame tu proyecto",
                messagePlaceholder: "Describe brevemente qué necesitas...",
                nameLabel: "Nombre",
                namePlaceholder: "Tu nombre",
                projectApp: "App Móvil",
                projectAutomation: "Automatización",
                projectLabel: "Tipo de proyecto",
                projectOther: "Otro",
                projectSaaS: "Plataforma SaaS",
                projectSelectOption: "Selecciona una opción",
                projectWeb: "Página Web",
                submitButton: "Enviar mensaje",
            },
            pageHero: {
                subtitle: "Cuéntame tu idea y te responderé en menos de 24 horas.",
                tag: "// Contacto",
                title: 'Hablemos de tu <span class="text-gradient">proyecto</span>',
            },
            successModal: {
                closeButton: "Cerrar",
                message: "Te responderé en menos de 24 horas.",
                title: "¡Mensaje enviado!",
            },
        },
        portfolio: {
            pageHero: {
                tag: "// Portfolio",
                title: 'Mis <span class="text-gradient">proyectos</span>',
                subtitle: "Una selección de productos digitales que he desarrollado y lanzado.",
            },
            botPresupuestos: {
                badge: "Bot",
                feature1: "Presupuestos al instante",
                feature2: "Disponible 24/7",
                feature3: "Sin intervención manual",
                name: "Bot Presupuestos",
                problem: "Negocios perdiendo horas respondiendo las mismas preguntas de precio por WhatsApp. Los clientes esperaban horas por un presupuesto que tardaba un día en llegar.",
                solution: "Bot que guía al cliente con preguntas clave y genera un presupuesto personalizado de forma instantánea, sin intervención humana, disponible 24/7.",
            },
            caseStudy: {
                blockChallenge: "📋 El Reto",
                blockProcess: "🛠️ Proceso",
                blockResults: "📊 Resultados",
                blockSolution: "💡 La Solución",
                challengeDesc: "Un negocio de servicios recibía decenas de consultas diarias por WhatsApp preguntando precios. El equipo pasaba horas respondiendo siempre lo mismo: recogiendo datos del cliente, calculando el coste y redactando el presupuesto. A última hora, los clientes ya habían contratado a la competencia.",
                featurConversation: "Conversación guiada",
                featureAutonomous: "Totalmente autónomo",
                featureAutonomousDesc: "Funciona sin supervisión humana, liberando al equipo para lo importante",
                featureCalculation: "Cálculo instantáneo",
                featureCalculationDesc: "Motor de precios configurable que genera el coste al momento",
                featureConversationDesc: "Flujo de preguntas inteligente que extrae la información necesaria",
                featureQuote: "Presupuesto detallado",
                featureQuoteDesc: "Documento personalizado con desglose de servicios y precios",
                heroDesc: "Bot automatizado que genera presupuestos personalizados al instante, sin intervención humana",
                heroTitle: "Bot Presupuestos",
                keyFeaturesTitle: "Funcionalidades clave",
                metricAvailability: "24/7",
                metricAvailabilityLabel: "Disponibilidad",
                metricSpeed: "<30s",
                metricSpeedLabel: "Por presupuesto",
                metricTime: "-90%",
                metricTimeLabel: "Tiempo en presupuestos",
                solutionDesc: "Bot que intercepta los mensajes entrantes, guía al cliente paso a paso con preguntas clave para entender sus necesidades, calcula el coste en función de las respuestas y envía un presupuesto detallado y personalizado en cuestión de segundos, a cualquier hora del día.",
                tag: "// Case Study",
                testimonial: "\"Antes perdíamos clientes porque tardábamos en responder. Ahora el bot responde en segundos a cualquier hora y nosotros nos centramos en cerrar ventas, no en hacer presupuestos.\"",
                testimonialAuthor: "— Cliente, sector servicios",
                title: 'Bot Presupuestos: <span class="text-gradient">De horas a segundos</span>',
                week1: '<strong>Semana 1:</strong> Mapeo de flujos de conversación y lógica de precios',
                week23: '<strong>Semana 2-3:</strong> Desarrollo del bot en TypeScript + integración API',
                week4: '<strong>Semana 4:</strong> Testing con casos reales y afinado de respuestas',
                week5: '<strong>Semana 5:</strong> Despliegue en producción y monitorización',
            },
            cta: {
                button: "Contactar",
                subtitle: "Hablemos sobre tu idea.",
                title: "¿Quieres que tu proyecto sea el siguiente?",
            },
            finFlow: {
                badge: "SaaS",
                feature1: "UX moderna sin curva",
                feature2: "Integraciones nativas",
                feature3: "Precio sin sorpresas",
                name: "FinFlow",
                problem: "Sage domina el mercado de gestión financiera para PYMEs pero acumula los mismos fallos desde hace años: interfaz anticuada y lenta, soporte inaccesible, integraciones rotas con Stripe y bancos, y suscripciones abusivas que suben de precio sin previo aviso.",
                solution: "Alternativa moderna que hace lo mismo que Sage pero sin sus lacras — UX limpia pensada para equipos no técnicos, integraciones nativas con los servicios que ya usas, soporte real en menos de 24h, y precio transparente desde el primer día.",
            },
            jarvis: {
                badge: "IA",
                feature1: "Voz de entrada y salida natural",
                feature2: "Corre en tu propio hardware",
                feature3: "Memoria persistente",
                name: "Jarvis",
                problem: "Los asistentes de voz del mercado son genéricos, viven en el ecosistema de una gran corporación y no saben nada sobre ti. Pedirle algo a Alexa o Siri es útil para encender la luz, no para gestionar tu vida.",
                solution: "Un asistente de IA personal que vive en tu propio ordenador — como el Jarvis de Iron Man. Le hablas desde el teléfono, él te escucha, piensa, y te responde con voz natural. Te conoce, recuerda tus conversaciones anteriores y trabaja solo para ti.",
            },
            nlVip: {
                badge: "App",
                feature1: "Acceso por membresía",
                feature2: "Contenido exclusivo",
                feature3: "Pagos recurrentes",
                name: "NLVip",
                problem: "Entrenador personal con una reputación excepcional y una forma de trabajar muy cercana y personalizada. La demanda creció tanto que no podía atender a todos sin perder la calidad que le hacía diferente — cada cliente nuevo era un cliente al que no podía darle lo que merecía.",
                solution: "App de membresías VIP que le permite gestionar quién accede a sus servicios, publicar contenido exclusivo para sus miembros y mantener esa atención personal que le define, sin colapsar su agenda.",
            },
            nominaPro: {
                badge: "App",
                feature1: "Cálculo automático",
                feature2: "Exportar PDF",
                feature3: "Historial de empleados",
                name: "Nómina Pro",
                problem: "PYMEs con departamentos de RRHH invirtiendo días enteros cada mes en calcular nóminas manualmente en Excel, con riesgo de errores y disputas con empleados.",
                solution: "Sistema de gestión de nóminas que calcula salarios, deducciones y retenciones automáticamente, generando los documentos listos para firmar en segundos.",
            },
            proteinShop: {
                badge: "E-commerce",
                feature1: "Catálogo interactivo",
                feature2: "Carrito dinámico",
                feature3: "Diseño responsivo",
                name: "Protein Shop",
                problem: "Tenía su catálogo en Shopify, lo que le obligaba a pagar cada vez que quería cambiar el diseño o el template — sin poder salirse del molde de Shopify.",
                solution: "Le construimos una web propia con diseño 100% a medida y la conectamos a su cuenta de Shopify vía API, para que siga gestionando sus productos desde allí — pero ahora con control total del diseño y sin pagar por cada cambio.",
            },
            tradingBot: {
                badge: "Bot",
                feature1: "Cripto, forex, metales e índices",
                feature2: "Gestión de riesgo automática",
                feature3: "Estrategias configurables",
                name: "Trading Bot",
                problem: "Operar en múltiples mercados — cripto, forex, metales y índices — requiere monitorizar gráficos 24/7, ejecutar con precisión milimétrica y mantener la cabeza fría. Ningún trader lo consigue a largo plazo: la fatiga y las emociones destruyen la estrategia.",
                solution: "Bot de trading algorítmico multi-mercado que opera en cripto, forex (EUR/USD, GBP/USD…), metales (oro, plata) e índices bursátiles. Analiza indicadores técnicos en tiempo real, ejecuta órdenes automáticamente y gestiona el riesgo por posición — sin intervención humana y sin emociones.",
            },
            visitasVirtuales: {
                badge: "Web",
                demoButton: "Ver demo en vivo",
                feature1: "Tour desde fotos con el móvil",
                feature2: "Catálogo de muebles en 3D colocable",
                feature3: "Inmobiliarias, arquitectos e interiorismo",
                modalUrl: "visitas-virtuales-dgwi.vercel.app/demo — Diseñador 3D interactivo",
                name: "Visitas Virtuales",
                problem: "Inmobiliarias, arquitectos y estudios de interiorismo necesitan mostrar espacios a clientes que no pueden desplazarse — pero contratar fotógrafos especializados en 360° es caro, lento y depende de terceros para cada actualización.",
                solution: "Plataforma que convierte fotos normales de una habitación, tomadas desde distintos ángulos con cualquier móvil, en un tour virtual navegable. Subes las capturas de cada punto del espacio y el sistema las ensambla en una experiencia inmersiva lista para compartir. Los diseñadores de interiores pueden además subir su catálogo de muebles y objetos, colocarlos dentro del espacio en 3D y mostrarle al cliente exactamente cómo quedaría ese sofá, esa lámpara o esa estantería en la habitación real — antes de comprar nada.",
            },
        },
        svc: {
            tag: '// Servicio',
            pricingTag: '// Precios',
            faqTag: '// FAQ',
            faqTitle: 'Preguntas <span class="text-gradient">frecuentes</span>',
            backLink: '← Volver a Servicios',
            perProject: ' / proyecto',
            consult: 'Consultar',
            web: {
                heroTitle: 'Desarrollo <span class="text-gradient">Web</span> a medida',
                heroSubtitle: 'Páginas web modernas, rápidas y pensadas para convertir visitantes en clientes. Desde una landing page hasta una tienda online completa.',
                intro: 'Una web no es una tarjeta de visita digital: es tu vendedor que trabaja 24 horas. Si carga lento, no se ve bien en el móvil o no deja claro qué haces y cómo contactarte, pierdes clientes antes de que lleguen a conocerte. Construimos páginas web que cargan rápido, se ven bien en cualquier dispositivo y guían al visitante hacia una acción concreta: llamar, escribir o comprar.',
                h2Incluye: 'Qué incluye el servicio',
                li1: '<strong>Diseño a medida</strong>, no una plantilla genérica: adaptado a tu marca y a cómo trabaja tu negocio.',
                li2: '<strong>Responsive real</strong>: probado en móvil, tablet y escritorio, no solo redimensionado.',
                li3: '<strong>SEO técnico desde el primer día</strong>: velocidad de carga, metadatos, datos estructurados y una estructura que Google entiende.',
                li4: '<strong>Panel de administración</strong> sencillo para que edites textos, imágenes o precios sin depender de nosotros para cada cambio.',
                li5: '<strong>Formularios e integraciones</strong> con WhatsApp, email, Google Analytics y las herramientas de marketing que ya uses.',
                li6: '<strong>Certificado SSL y buenas prácticas de seguridad</strong> incluidas de serie.',
                h2Tipos: 'Tipos de proyecto',
                tiposIntro: 'Cada negocio necesita algo distinto. Estos son los formatos más habituales:',
                tipo1: '<strong>Landing page:</strong> una sola página enfocada en un objetivo (captar leads, presentar un servicio, lanzar un producto).',
                tipo2: '<strong>Web corporativa:</strong> varias páginas (servicios, sobre nosotros, contacto, blog) para negocios que necesitan presencia completa.',
                tipo3: '<strong>Tienda online:</strong> catálogo, carrito y checkout, con pasarela de pago integrada.',
                tipo4: '<strong>Web con reservas:</strong> calendario de disponibilidad y confirmación automática, ideal para restaurantes, hoteles o servicios con cita previa.',
                h2Tech: 'Tecnologías',
                techP: 'Trabajamos con <strong>React</strong> y <strong>Next.js</strong> para las webs que necesitan velocidad e interactividad, y con <strong>HTML/CSS y Tailwind</strong> para proyectos más sencillos donde no hace falta más. La tecnología se elige según lo que tu proyecto necesita, no al revés.',
                h2Proceso: 'Cómo lo hacemos',
                proc1Title: 'Consulta y objetivos', proc1Desc: 'Entendemos tu negocio, tu público y qué quieres que la web consiga.',
                proc2Title: 'Estructura y contenidos', proc2Desc: 'Definimos las páginas, la navegación y qué información va en cada una.',
                proc3Title: 'Diseño visual', proc3Desc: 'Creamos el diseño de tu marca: colores, tipografía e imágenes.',
                proc4Title: 'Desarrollo y pruebas', proc4Desc: 'Programamos la web y la probamos en distintos dispositivos y navegadores.',
                proc5Title: 'Lanzamiento', proc5Desc: 'Publicamos, conectamos el dominio y verificamos que todo funciona en producción.',
                pricingTitle: 'Inversión <span class="text-gradient">por tipo de web</span>',
                pricingSubtitle: 'Precios orientativos. Cada proyecto se presupuesta a medida.',
                price1Title: 'Landing Page', price1Desc: 'Una página enfocada en un objetivo claro.',
                price1F1: 'Diseño responsive', price1F2: 'SEO básico', price1F3: 'Formulario de contacto', price1F4: 'Entrega en 1-2 semanas',
                price2Title: 'Web Corporativa', price2Desc: 'Hasta 5 páginas con panel de administración.',
                price2F1: 'SEO avanzado', price2F2: 'Panel de administración', price2F3: 'Integraciones (WhatsApp, Analytics)', price2F4: 'Entrega en 2-4 semanas',
                price3Title: 'Tienda Online', price3Desc: 'Catálogo, carrito y pasarela de pago.',
                price3F1: 'Checkout con pago online', price3F2: 'Gestión de productos y pedidos', price3F3: 'Revisiones ilimitadas', price3F4: 'Soporte 3 meses',
                faq1Q: '¿El dominio y el hosting están incluidos?',
                faq1A: 'Te asesoramos y configuramos ambos, pero se contratan a tu nombre para que seas tú quien tenga la propiedad total, sin depender de nadie más.',
                faq2Q: '¿Puedo editar el contenido yo mismo después?',
                faq2A: 'Sí, incluimos un panel de administración sencillo para textos, imágenes y precios sin tocar código.',
                faq3Q: '¿Qué pasa si necesito cambios tras el lanzamiento?',
                faq3A: 'Incluimos 30 días de soporte gratuito. Después puedes contratar un mantenimiento mensual opcional o pedir cambios puntuales.',
                faq4Q: '¿La web estará optimizada para Google desde el inicio?',
                faq4A: 'Sí. Aplicamos SEO técnico de base (velocidad, metadatos, datos estructurados) en todos los proyectos. Si necesitas más, tenemos un <a href="servicio-seo.html">servicio dedicado de SEO y GEO</a>.',
                ctaTitle: '¿Empezamos con tu web?', ctaText: 'Cuéntanos tu proyecto y te enviamos un presupuesto personalizado.', ctaBtn: 'Hablemos'
            },
            apps: {
                heroTitle: 'Apps <span class="text-gradient">Móviles</span> a medida',
                heroSubtitle: 'Aplicaciones nativas para iOS y Android que ofrecen la mejor experiencia de usuario, pensadas para fidelizar clientes o mejorar tus procesos internos.',
                intro: 'Una app tiene sentido cuando tu negocio necesita algo que una web no puede dar: notificaciones que lleguen al móvil del cliente, acceso sin conexión, o una experiencia más rápida y fluida para quien la usa a diario. Antes de programar nada, te ayudamos a decidir si de verdad necesitas una app o si una web bien hecha resuelve lo mismo con menos coste.',
                h2Incluye: 'Qué incluye el servicio',
                li1: '<strong>Diseño UI/UX</strong> pensado para móvil desde el primer boceto, no una web adaptada.',
                li2: '<strong>Desarrollo para iOS y Android</strong> desde una misma base de código, más rápido y económico que programar cada plataforma por separado.',
                li3: '<strong>Notificaciones push</strong> para avisos, promociones o recordatorios.',
                li4: '<strong>Funcionamiento offline</strong> cuando la conexión falla o el usuario está sin datos.',
                li5: '<strong>Backend y sincronización en tiempo real</strong> entre dispositivos.',
                li6: '<strong>Publicación en App Store y Google Play</strong>, incluyendo la gestión de las cuentas de desarrollador.',
                h2Casos: 'Casos de uso habituales',
                caso1: '<strong>Fidelización:</strong> apps de puntos, reservas o pedidos para restaurantes, gimnasios u hoteles.',
                caso2: '<strong>Gestión interna:</strong> herramientas para que tu equipo trabaje desde el móvil (inventario, partes de trabajo, fichajes).',
                caso3: '<strong>Marketplace o delivery:</strong> apps que conectan a tu negocio con tus clientes en tiempo real.',
                h2Tech: 'Tecnologías',
                techP: 'Usamos <strong>React Native</strong> para desarrollar iOS y Android desde un único código, con <strong>Firebase</strong> para autenticación, notificaciones y base de datos en tiempo real, y <strong>Node.js</strong> cuando el proyecto necesita un backend a medida.',
                h2Proceso: 'Cómo lo hacemos',
                proc1Title: 'Consulta y validación', proc1Desc: 'Analizamos si una app es la mejor solución para tu caso concreto.',
                proc2Title: 'Prototipo', proc2Desc: 'Diseñamos las pantallas clave para validar el flujo antes de programar.',
                proc3Title: 'Desarrollo', proc3Desc: 'Programamos con actualizaciones semanales para que veas el avance real.',
                proc4Title: 'Pruebas en dispositivos reales', proc4Desc: 'Probamos en distintos móviles antes de enviar a revisión.',
                proc5Title: 'Publicación', proc5Desc: 'Gestionamos el proceso de revisión y publicación en App Store y Google Play.',
                pricingTitle: 'Inversión <span class="text-gradient">por tipo de app</span>',
                pricingSubtitle: 'Precios orientativos. Cada proyecto se presupuesta a medida.',
                price1Title: 'MVP', price1Desc: 'Versión inicial para validar tu idea con usuarios reales.',
                price1F1: 'Funcionalidades esenciales', price1F2: 'iOS y Android', price1F3: 'Publicación en stores',
                price2Title: 'App Completa', price2Desc: 'Backend propio, notificaciones y sincronización en tiempo real.',
                price2F1: 'Notificaciones push', price2F2: 'Funcionamiento offline', price2F3: 'Panel de administración', price2F4: 'Soporte 3 meses',
                price3Title: 'App + Backend a medida', price3Desc: 'Marketplace, delivery o plataformas con lógica compleja.',
                price3F1: 'Arquitectura escalable', price3F2: 'Integraciones de pago', price3F3: 'Revisiones ilimitadas',
                faq1Q: '¿Necesito cuentas de desarrollador de Apple y Google?',
                faq1A: 'Sí, son necesarias para publicar. Te guiamos en el proceso de creación si no las tienes.',
                faq2Q: '¿Qué pasa si Apple o Google actualizan sus normas?',
                faq2A: 'Mantenemos la app al día con las actualizaciones necesarias durante el periodo de soporte incluido; después puedes contratar mantenimiento continuo.',
                faq3Q: '¿Por qué React Native y no apps nativas separadas?',
                faq3A: 'Con una sola base de código cubrimos iOS y Android, reduciendo tiempo y coste sin sacrificar rendimiento ni acceso a las funciones del móvil.',
                faq4Q: '¿El código y los datos son míos?',
                faq4A: 'Sí. Al finalizar te entregamos todo el código fuente y accesos. Sin dependencias ocultas.',
                ctaTitle: '¿Tienes una idea de app?', ctaText: 'Cuéntanos tu proyecto y valoramos juntos si una app es la mejor opción.', ctaBtn: 'Hablemos'
            },
            saas: {
                heroTitle: 'Plataformas <span class="text-gradient">SaaS</span>',
                heroSubtitle: 'Software como servicio completo, con suscripciones, panel de administración y API, listo para escalar.',
                intro: 'Un SaaS (Software as a Service) es un producto que tus clientes pagan mes a mes para usar: un software vertical para tu sector, una herramienta interna que decides vender a otros negocios, o una idea completamente nueva. A diferencia de una web o una app puntual, un SaaS necesita arquitectura pensada para crecer: múltiples clientes, planes de precio, facturación automática y un panel para que tú controles todo sin tocar código.',
                h2Incluye: 'Qué incluye el servicio',
                li1: '<strong>Sistema de suscripciones con Stripe:</strong> cobros recurrentes, planes, pruebas gratuitas y cancelaciones gestionadas automáticamente.',
                li2: '<strong>Dashboard de administración:</strong> para ti (métricas de negocio) y para tus clientes (su propio panel de uso).',
                li3: '<strong>Gestión de usuarios y roles:</strong> permisos distintos según el tipo de cuenta.',
                li4: '<strong>API REST documentada</strong> para que otros sistemas se conecten a tu plataforma.',
                li5: '<strong>Arquitectura multi-cliente (multi-tenant)</strong> pensada para escalar sin reescribir el sistema cada vez que crece.',
                li6: '<strong>Infraestructura en la nube</strong> con copias de seguridad y monitorización.',
                h2Casos: 'Casos de uso habituales',
                caso1: '<strong>Software vertical:</strong> una herramienta de gestión específica para un sector (gimnasios, clínicas, inmobiliarias) que vendes por suscripción.',
                caso2: '<strong>Producto interno que se convierte en negocio:</strong> automatizaste algo para tu empresa y ves que otros negocios lo necesitan también.',
                caso3: '<strong>Marketplace o plataforma de reservas</strong> con múltiples proveedores y clientes.',
                h2Tech: 'Tecnologías',
                techP: 'Construimos sobre <strong>Next.js</strong> para el frontend y las rutas de API, <strong>PostgreSQL</strong> como base de datos relacional robusta, <strong>Stripe</strong> para todo el ciclo de pagos y <strong>AWS</strong> para una infraestructura que escala según el crecimiento real de usuarios.',
                h2Proceso: 'Cómo lo hacemos',
                proc1Title: 'Validación de la idea', proc1Desc: 'Definimos el modelo de negocio, planes de precio y funcionalidades imprescindibles.',
                proc2Title: 'MVP', proc2Desc: 'Construimos una primera versión funcional para validarla con usuarios reales.',
                proc3Title: 'Iteración', proc3Desc: 'Ajustamos según el feedback real antes de invertir en funcionalidades avanzadas.',
                proc4Title: 'Escalado', proc4Desc: 'Reforzamos la infraestructura y añadimos funcionalidades a medida que creces.',
                pricingTitle: 'Inversión <span class="text-gradient">por fase</span>',
                pricingSubtitle: 'Precios orientativos. Cada SaaS se presupuesta según su complejidad.',
                price1Title: 'MVP', price1Desc: 'Primera versión funcional para validar tu idea.',
                price1F1: 'Funcionalidades esenciales', price1F2: 'Un plan de suscripción', price1F3: 'Panel de administración básico',
                price2Title: 'Plataforma Completa', price2Desc: 'Múltiples planes, roles de usuario y API.',
                price2F1: 'Múltiples planes de precio', price2F2: 'Dashboard de métricas', price2F3: 'API REST documentada', price2F4: 'Soporte 3 meses',
                price3Title: 'A medida', price3Desc: 'Arquitectura compleja, integraciones múltiples o alto volumen.',
                price3F1: 'Arquitectura multi-tenant', price3F2: 'Integraciones a medida', price3F3: 'Soporte continuo',
                faq1Q: '¿El código de mi SaaS es mío?',
                faq1A: 'Sí, al 100%. Te entregamos todo el código fuente y accesos; no hay lock-in con nosotros.',
                faq2Q: '¿Puede crecer si consigo muchos clientes?',
                faq2A: 'Sí, diseñamos la arquitectura desde el principio pensando en escalar, y reforzamos infraestructura según el crecimiento real.',
                faq3Q: '¿Incluye mantenimiento después del lanzamiento?',
                faq3A: 'Incluimos soporte inicial tras la entrega. Para un SaaS en producción recomendamos un plan de mantenimiento mensual que cubra monitorización, seguridad y pequeñas mejoras.',
                faq4Q: '¿Cuánto tarda en estar listo un MVP?',
                faq4A: 'Depende del alcance, pero un MVP funcional suele tardar entre 4 y 8 semanas.',
                ctaTitle: '¿Tienes una idea de SaaS?', ctaText: 'Cuéntanos tu proyecto y te ayudamos a definir el MVP más rápido de validar.', ctaBtn: 'Hablemos'
            },
            auto: {
                heroTitle: '<span class="text-gradient">Automatizaciones</span> de procesos',
                heroSubtitle: 'Automatiza tareas repetitivas y conecta tus herramientas. Ahorra horas de trabajo manual con workflows inteligentes.',
                intro: 'Casi todos los negocios tienen tareas que se repiten cada día y no requieren criterio humano: copiar datos entre sistemas, responder siempre lo mismo, generar el mismo informe cada semana. Cada una de esas tareas es tiempo que no dedicas a lo que hace crecer tu negocio. Automatizamos esos procesos para que se ejecuten solos, de forma fiable, sin que tengas que acordarte de hacerlos.',
                h2Incluye: 'Qué incluye el servicio',
                li1: '<strong>Bots de WhatsApp y Telegram:</strong> responden preguntas frecuentes, generan presupuestos o confirman reservas sin intervención humana.',
                li2: '<strong>Integración con cualquier API:</strong> conectamos las herramientas que ya usas (CRM, hojas de cálculo, facturación, redes sociales) para que se hablen entre ellas.',
                li3: '<strong>Workflows con n8n:</strong> flujos visuales que ejecutan varios pasos en cadena de forma automática y son fáciles de mantener.',
                li4: '<strong>Sincronización entre plataformas:</strong> lo que cambias en un sistema se refleja automáticamente en los demás.',
                li5: '<strong>Reportes automáticos:</strong> informes periódicos generados y enviados sin que nadie tenga que prepararlos a mano.',
                h2Ejemplos: 'Ejemplos reales',
                ej1: '<strong>Presupuestos automáticos:</strong> un cliente escribe por WhatsApp y recibe un presupuesto personalizado al instante, 24/7.',
                ej2: '<strong>Sincronización de reservas:</strong> una reserva en la web actualiza automáticamente el calendario, envía confirmación y notifica al equipo.',
                ej3: '<strong>Alertas y seguimiento:</strong> avisos automáticos cuando ocurre algo relevante (un pedido, un stock bajo, un formulario nuevo).',
                h2Tech: 'Tecnologías',
                techP: 'Usamos <strong>n8n</strong> para diseñar flujos de trabajo visuales y fáciles de mantener, <strong>Python</strong> para lógica más compleja, y trabajamos con <strong>APIs y webhooks</strong> de las herramientas que ya usas para que todo quede conectado.',
                h2Proceso: 'Cómo lo hacemos',
                proc1Title: 'Mapeo del proceso', proc1Desc: 'Analizamos qué tarea repites y dónde se pierde más tiempo exactamente.',
                proc2Title: 'Diseño del flujo', proc2Desc: 'Diseñamos la automatización paso a paso, incluyendo qué hacer si algo falla.',
                proc3Title: 'Implementación', proc3Desc: 'Conectamos las herramientas y probamos con casos reales antes de activarlo.',
                proc4Title: 'Monitorización', proc4Desc: 'Supervisamos que funcione correctamente en las primeras semanas de uso real.',
                pricingTitle: 'Inversión <span class="text-gradient">por complejidad</span>',
                pricingSubtitle: 'Precios orientativos. Cada automatización se presupuesta a medida.',
                price1Title: 'Automatización simple', price1Desc: 'Un proceso, dos herramientas conectadas.',
                price1F1: '1 flujo de trabajo', price1F2: 'Integración con 1-2 APIs', price1F3: 'Entrega en 3-5 días',
                price2Title: 'Bot + Workflow', price2Desc: 'Bot conversacional con lógica y varias integraciones.',
                price2F1: 'Bot de WhatsApp o Telegram', price2F2: 'Varias integraciones conectadas', price2F3: 'Reportes automáticos',
                price3Title: 'Suite de automatización', price3Desc: 'Varios procesos automatizados y monitorización continua.',
                price3F1: 'Múltiples flujos conectados', price3F2: 'Monitorización y alertas', price3F3: 'Soporte continuo',
                faq1Q: '¿Qué pasa si una herramienta externa cambia su API?',
                faq1A: 'Ajustamos la automatización para que siga funcionando. Por eso recomendamos un mantenimiento mensual en automatizaciones críticas para tu negocio.',
                faq2Q: '¿Necesito conocimientos técnicos para usarlo?',
                faq2A: 'No. Una vez implementado, funciona solo. Te explicamos cómo revisar que todo va bien si lo necesitas.',
                faq3Q: '¿Puedo automatizar procesos con IA?',
                faq3A: 'Sí, muchas automatizaciones se combinan con inteligencia artificial (respuestas generadas, clasificación de datos). Mira nuestro <a href="servicio-ia.html">servicio de IA Segura</a>.',
                faq4Q: '¿Cuánto tiempo se suele ahorrar?',
                faq4A: 'Depende del proceso, pero varios clientes nos reportan entre 5 y 10 horas semanales recuperadas tras automatizar tareas repetitivas.',
                ctaTitle: '¿Qué proceso quieres automatizar?', ctaText: 'Cuéntanos qué tarea repites cada semana y te decimos cómo automatizarla.', ctaBtn: 'Hablemos'
            },
            ai: {
                heroTitle: 'Implementación de <span class="text-gradient">IA Segura</span>',
                heroSubtitle: 'Integramos inteligencia artificial donde aporta valor real a tu negocio, protegiendo siempre tus datos y los de tus clientes.',
                intro: 'Implementar IA sin criterio es fácil y peligroso: conectar un chatbot a un modelo genérico sin pensar qué datos ve, quién puede acceder a las conversaciones o qué pasa si el modelo se equivoca. Nuestro enfoque es distinto: primero entendemos qué proceso de tu negocio se beneficia de verdad de la IA, y luego lo implementamos con controles de seguridad desde el diseño, no como un parche posterior.',
                h2Incluye: 'Qué incluye el servicio',
                li1: '<strong>Chatbots y asistentes 24/7</strong> entrenados con tu propia información (productos, precios, políticas), no con respuestas genéricas.',
                li2: '<strong>Automatización inteligente</strong> de tareas que hoy hace una persona: clasificar mensajes, resumir documentos, generar respuestas de primer nivel.',
                li3: '<strong>Integración con ChatGPT, Claude</strong> y las herramientas que ya usa tu equipo, sin reescribir tus procesos desde cero.',
                li4: '<strong>RAG (Retrieval-Augmented Generation):</strong> el asistente consulta tus documentos reales antes de responder, en vez de inventar información.',
                li5: '<strong>Datos cifrados y control de accesos:</strong> defines quién puede ver qué, y tus datos no se usan para entrenar modelos de terceros sin tu consentimiento.',
                h2Casos: 'Casos de uso habituales',
                caso1: '<strong>Atención al cliente 24/7:</strong> un asistente que responde preguntas frecuentes con la información real de tu negocio, escalando a una persona cuando hace falta.',
                caso2: '<strong>Generación de contenido:</strong> borradores de respuestas, descripciones de producto o resúmenes que un humano revisa antes de publicar.',
                caso3: '<strong>Análisis de datos:</strong> extraer información útil de documentos, encuestas o conversaciones que hoy nadie tiene tiempo de leer.',
                h2Seguridad: 'Cómo abordamos la seguridad',
                seguridadIntro: 'La seguridad no es una casilla que marcamos al final, es parte del diseño:',
                seg1: 'Auditamos qué datos va a ver el modelo antes de conectarlo a nada.',
                seg2: 'Usamos proveedores con acuerdos claros de privacidad de datos (no entrenamiento con tus conversaciones sin permiso).',
                seg3: 'Aplicamos control de accesos: cada usuario ve solo lo que le corresponde.',
                seg4: 'Probamos el sistema para reducir "alucinaciones" (respuestas inventadas) antes de ponerlo en producción.',
                h2Proceso: 'Cómo lo hacemos',
                proc1Title: 'Auditoría de datos y procesos', proc1Desc: 'Identificamos qué tarea automatizar y qué datos necesita ver la IA.',
                proc2Title: 'Diseño del asistente', proc2Desc: 'Definimos el comportamiento, los límites y qué hacer cuando no sabe responder.',
                proc3Title: 'Entrenamiento con tus datos', proc3Desc: 'Conectamos tu información real mediante RAG, sin exponerla innecesariamente.',
                proc4Title: 'Pruebas de seguridad', proc4Desc: 'Verificamos accesos, privacidad y respuestas antes de lanzar.',
                proc5Title: 'Despliegue y monitorización', proc5Desc: 'Lanzamos y supervisamos el comportamiento real durante las primeras semanas.',
                pricingTitle: 'Inversión <span class="text-gradient">por alcance</span>',
                pricingSubtitle: 'Precios orientativos. Cada implementación se presupuesta a medida.',
                price1Title: 'Chatbot Simple', price1Desc: 'Asistente con respuestas predefinidas sobre tu negocio.',
                price1F1: 'Integrado en tu web o WhatsApp', price1F2: 'Respuestas basadas en tu información', price1F3: 'Entrega en 1-2 semanas',
                price2Title: 'Asistente con RAG', price2Desc: 'Consulta tus documentos reales antes de responder.',
                price2F1: 'Entrenado con tu documentación', price2F2: 'Control de accesos y privacidad', price2F3: 'Escalado a persona cuando hace falta',
                price3Title: 'Automatización con IA', price3Desc: 'Procesos completos automatizados con IA e integraciones.',
                price3F1: 'Múltiples flujos con IA', price3F2: 'Integraciones a medida', price3F3: 'Monitorización continua',
                faq1Q: '¿Mis datos se usan para entrenar modelos de terceros?',
                faq1A: 'No. Trabajamos con proveedores que ofrecen garantías de que tus conversaciones y documentos no se usan para entrenar sus modelos generales sin tu consentimiento explícito.',
                faq2Q: '¿Puedo controlar qué responde la IA?',
                faq2A: 'Sí. Definimos límites claros: temas que puede tratar, cuándo debe derivar a una persona y qué tono usar, todo revisable por ti.',
                faq3Q: '¿Cómo se evita que la IA invente respuestas?',
                faq3A: 'Usando RAG: el asistente busca en tu documentación real antes de responder, en vez de generar la respuesta solo con su conocimiento general. Además probamos casos límite antes de lanzar.',
                faq4Q: '¿Esto tiene relación con aparecer en ChatGPT o Claude como negocio?',
                faq4A: 'Es un servicio distinto pero complementario: si quieres que la IA <em>te recomiende</em> a terceros, es <a href="servicio-seo.html">posicionamiento SEO y GEO</a>. Esto es implementar IA <em>dentro</em> de tu propio negocio.',
                ctaTitle: '¿Quieres implementar IA en tu negocio?', ctaText: 'Cuéntanos qué proceso te gustaría automatizar y valoramos juntos el enfoque más seguro.', ctaBtn: 'Hablemos'
            },
            seo: {
                heroTitle: 'Posicionamiento <span class="text-gradient">SEO y GEO</span>',
                heroSubtitle: 'Optimizamos tu web para que te encuentren: tanto en Google como en las nuevas búsquedas con IA como ChatGPT, Claude y Perplexity.',
                intro: 'Hoy no basta con posicionarse en Google. El <strong>40% de las búsquedas ya empiezan en una IA</strong> como ChatGPT, Claude o Perplexity, y solo el 1% de las empresas en Andorra optimiza su presencia para ese canal. Trabajamos ambos frentes a la vez: el SEO tradicional que sigue siendo imprescindible para Google, y el GEO (Generative Engine Optimization), el nuevo canal con mucha menos competencia todavía.',
                h2Incluye: 'Qué incluye el servicio',
                li1: '<strong>Auditoría SEO técnica y de contenidos:</strong> revisamos velocidad, estructura, palabras clave y qué le falta a tu web para posicionar mejor.',
                li2: '<strong>Core Web Vitals y velocidad de carga:</strong> optimizamos lo que Google mide para decidir tu posición en el ranking.',
                li3: '<strong>Datos estructurados (schema.org):</strong> para que buscadores y modelos de IA entiendan exactamente qué ofreces.',
                li4: '<strong>Auditoría de visibilidad en IA:</strong> probamos decenas de preguntas reales en ChatGPT, Claude y Perplexity para ver si tu negocio aparece hoy.',
                li5: '<strong>Implementación de <code>llms.txt</code>:</strong> el estándar emergente que da a los rastreadores de IA información ordenada sobre tu negocio.',
                li6: '<strong>Seguimiento de resultados:</strong> monitorización periódica de posiciones en Google y menciones en las respuestas de IA.',
                h2Complementan: 'SEO y GEO no son lo mismo, pero se complementan',
                complementanP: 'El SEO sigue siendo esencial: Google no va a desaparecer y sigue siendo la puerta de entrada de millones de búsquedas. El GEO no lo sustituye, lo complementa: optimiza tu presencia para que los modelos de lenguaje te reconozcan como una fuente fiable y te recomienden cuando alguien les pregunta. Ambos se refuerzan entre sí: el contenido bien estructurado ayuda en los dos frentes a la vez.',
                blogLink: 'Si quieres entender en detalle cómo funciona el GEO, tenemos una <a href="blog-posicionamiento-ia.html">guía completa en el blog</a>.',
                h2Proceso: 'Cómo lo hacemos',
                proc1Title: 'Auditoría inicial', proc1Desc: 'Analizamos tu posición actual en Google y tu visibilidad en las principales IA.',
                proc2Title: 'Plan de acción', proc2Desc: 'Priorizamos las mejoras con más impacto: técnicas, de contenido y de datos estructurados.',
                proc3Title: 'Implementación', proc3Desc: 'Aplicamos las mejoras técnicas, schema.org, llms.txt y contenido optimizado.',
                proc4Title: 'Monitorización', proc4Desc: 'Seguimiento mensual de posiciones en Google y menciones en respuestas de IA.',
                pricingTitle: 'Inversión <span class="text-gradient">en visibilidad</span>',
                pricingSubtitle: 'Precios orientativos. El seguimiento mensual es opcional.',
                perOnce: ' / única vez', perMonth: '/mes',
                price1Title: 'Auditoría SEO + GEO', price1Desc: 'Diagnóstico completo de tu situación actual.',
                price1F1: 'Auditoría técnica y de contenidos', price1F2: 'Test de visibilidad en IA', price1F3: 'Informe con plan de acción',
                price2Title: 'Implementación completa', price2Desc: 'Auditoría + aplicación de todas las mejoras.',
                price2F1: 'Core Web Vitals y schema.org', price2F2: 'Implementación de llms.txt', price2F3: 'Contenido optimizado para IA',
                price3Title: 'Seguimiento mensual', price3Desc: 'Monitorización continua y ajustes cada mes.',
                price3F1: 'Seguimiento de posiciones', price3F2: 'Seguimiento de menciones en IA', price3F3: 'Informe mensual',
                faq1Q: '¿Cuánto se tarda en ver resultados?',
                faq1A: 'En Perplexity y ChatGPT con navegación web, los cambios pueden notarse en semanas. En el conocimiento base de los modelos (sin navegación), depende del ciclo de reentrenamiento y puede tardar meses. El SEO en Google suele tardar entre 1 y 3 meses en notarse.',
                faq2Q: '¿El GEO sustituye al SEO?',
                faq2A: 'No. Se complementan. El SEO sigue siendo clave para Google; el GEO cubre el canal emergente de los asistentes de IA. Trabajar ambos a la vez refuerza tu presencia en los dos.',
                faq3Q: '¿Cómo se mide el éxito en GEO?',
                faq3A: 'Probamos periódicamente preguntas reales de tu sector en ChatGPT, Claude y Perplexity, y medimos si te mencionan, en qué posición y con qué tono.',
                faq4Q: '¿Puedo controlar lo que dice la IA sobre mi negocio?',
                faq4A: 'No de forma directa, pero sí influirlo de forma significativa: una presencia online consistente, positiva y bien estructurada es lo que los modelos reflejan en sus respuestas.',
                ctaTitle: '¿Sabes si la IA ya te recomienda?', ctaText: 'Te hacemos una auditoría de posicionamiento en IA gratis, sin compromiso.', ctaBtn: 'Pedir auditoría gratis'
            }
        },
        chatbot: {
            label: 'Asistente IA',
            title: 'Asistente IA · SaeTech',
            subtitle: 'Pregúntame sobre nuestros servicios y precios.',
            welcome: '¡Hola! Soy el asistente virtual de SaeTech. Pregúntame lo que quieras sobre nuestros servicios, precios o cómo trabajamos.',
            placeholder: 'Escribe tu pregunta...',
            send: 'Enviar',
            error: 'Ups, algo ha fallado. Prueba de nuevo o escríbenos por WhatsApp.',
            typing: 'Escribiendo…',
            disclaimer: 'Asistente con IA (Claude). Las respuestas pueden contener errores.'
        },
    },
    ca: {
        loader: { tag: 'Desenvolupament Digital' },
        nfc: {
            role: 'Freelance Digital Developer&nbsp;·&nbsp;Andorra',
            message: 'Gràcies per escanejar la meva targeta —<br><span class="nfc-message-highlight">aquí comença el teu projecte</span>',
            cta: 'Explorar la meva feina',
            skip: 'Saltar'
        },
        nav: { services: 'Serveis', portfolio: 'Portfolio', blog: 'Blog', about: 'Sobre mi', contact: 'Contacte' },
        hero: {
            badge: 'Acceptant nous projectes',
            greeting: 'Hola, sóc',
            headline: 'Webs, apps i SaaS que <span class="text-gradient">impulsen el teu negoci</span>',
            subtitle: 'Som un estudi digital a Andorra. Dissenyem i desenvolupem productes a mida que fan créixer el teu negoci.',
            description: 'Implementació d\'IA · Apps · Pàgines Web · Automatitzacions · SaaS',
            cta1: 'Demanar Pressupost',
            cta2: 'Veure Projectes'
        },
        stats: { projects: 'Projectes', satisfaction: 'Satisfacció', sectors: 'Sectors' },
        sectors: {
            title: 'Hem treballat amb negocis de',
            restaurants: '🍽️ Restaurants',
            realestate: '🏠 Immobiliàries',
            gyms: '💪 Gimnasos',
            hotels: '🏨 Hotels'
        },
        servicesHome: {
            tag: '// Serveis',
            title: 'Solucions <span class="text-gradient">digitals</span>',
            web: { title: 'Desenvolupament Web', desc: 'Pàgines web modernes, ràpides i responsive.' },
            apps: { title: 'Apps Mòbils', desc: 'Aplicacions iOS i Android natives.' },
            saas: { title: 'SaaS', desc: 'Plataformes escalables amb subscripcions.' },
            auto: { title: 'Automatitzacions', desc: 'Bots, workflows i connexions.' },
            ai: { title: 'IA Segura', desc: 'Chatbots, automatització i integració d\'IA protegint les teves dades.' },
            seo: { title: 'SEO i GEO', desc: 'Apareix a Google i a les cerques amb IA com ChatGPT, Claude i Perplexity.' },
            link: 'Veure més →',
            cta: 'Veure tots els serveis'
        },
        portfolioHome: {
            tag: '// Portfolio',
            title: 'Projectes <span class="text-gradient">destacats</span>',
            shop: { badge: 'E-commerce', desc: 'Botiga online de suplements esportius amb catàleg interactiu i checkout optimitzat per a conversió.', metric: '+32% conversió al checkout' },
            bot: { badge: 'Bot', desc: 'Bot que genera pressupostos personalitzats automàticament, disponible 24/7 sense intervenció humana.', metric: 'Respostes en segons, 24/7' },
            cta: 'Veure tots els projectes'
        },
        testimonialsHome: {
            tag: '// Testimonis',
            title: 'Què diuen <span class="text-gradient">els meus clients</span>',
            t1: '"SaeTech va desenvolupar la nostra web de reserves en temps rècord. Les reserves van augmentar un 40%."',
            t2: '"Professional i ràpid. La nostra app immobiliària funciona perfectament."',
            t3: '"L\'app del gimnàs ens va permetre digitalitzar-ho tot. Excel·lent feina!"',
            t4: '"La nostra web d\'hotel va quedar espectacular. Reserves online funcionant perfecte."',
            t5: '"Va automatitzar tots els nostres processos. Estalviem 10 hores setmanals."',
            t6: '"El SaaS que va crear per a la nostra botiga va superar totes les expectatives."'
        },
        process: {
            tag: '// Procés',
            title: 'Com <span class="text-gradient">treballo</span>',
            subtitle: 'Un procés clar de principi a fi.',
            step1: { title: 'Consulta', desc: 'Analitzem la teva idea i objectius.', time: '1-2 dies' },
            step2: { title: 'Proposta', desc: 'Pressupost detallat amb terminis.', time: '2-3 dies' },
            step3: { title: 'Disseny', desc: 'Creo el disseny visual del teu projecte.', time: '1-2 setmanes' },
            step4: { title: 'Desenvolupament', desc: 'Programem amb actualitzacions setmanals.', time: '2-6 setmanes' },
            step5: { title: 'Llançament', desc: 'Ajustos finals i publicació.', time: '1-2 dies' }
        },
        trust: {
            tag: 'Garanties',
            title: 'Per què <span class="text-gradient">confiar en nosaltres</span>',
            card1: { title: 'Satisfacció garantida', desc: 'No pagues fins que estiguis 100% satisfet amb el resultat.' },
            card2: { title: 'Lliurament ràpid', desc: 'Terminis realistes que complim. Sense sorpreses ni retards.' },
            card3: { title: 'Suport inclòs', desc: '30 dies de suport gratuït després del llançament.' },
            card4: { title: 'Comunicació directa', desc: 'Parles directament amb l\'equip. Sense intermediaris.' }
        },
        pricing: {
            tag: 'Preus',
            title: 'Inversió <span class="text-gradient">transparent</span>',
            subtitle: 'Preus orientatius. Cada projecte és únic.',
            basic: {
                name: 'Bàsic', title: 'Landing Page', desc: 'Perfecte per començar la teva presència digital.',
                f1: 'Disseny responsive', f2: 'SEO bàsic', f3: 'Formulari de contacte', f4: '1 revisió inclosa', f5: 'Lliurament en 1-2 setmanes',
                action: 'Començar'
            },
            pro: {
                name: 'Recomanat', title: 'Web Professional', desc: 'Ideal per a negocis que volen créixer.',
                f1: 'Fins a 5 pàgines', f2: 'SEO avançat', f3: 'Panell d\'administració', f4: 'Integració xarxes socials', f5: '3 revisions incloses', f6: 'Lliurament en 2-4 setmanes',
                action: 'Començar'
            },
            premium: {
                name: 'Premium', title: 'App / SaaS', desc: 'Solucions complexes a mida.',
                f1: 'App mòbil o plataforma SaaS', f2: 'Backend complet', f3: 'Base de dades', f4: 'APIs i integracions', f5: 'Revisions il·limitades', f6: 'Suport 3 mesos',
                action: 'Consultar'
            }
        },
        cta: { title: 'Tens un projecte en ment?', desc: 'Explica\'m la teva idea i t\'ajudo a fer-la realitat.', btn: 'Parlem' },
        footer: { tagline: 'Desenvolupament digital des d\'Andorra 🇦🇩', copyright: '&copy; 2026 Said. Tots els drets reservats.' },
        emailPopup: { title: '🎁 Rep consells gratis', desc: 'Trucs de desenvolupament web i ofertes exclusives. Sense spam.', placeholder: 'El teu email', submit: 'Subscriure\'m' },
        geo: {
            tag: '// Posicionament IA',
            title: 'Que la <span class="text-gradient">IA recomani</span> el teu negoci',
            subtitle: 'El 40% de les persones ja pregunta a ChatGPT, Claude o Perplexity abans que a Google. Et posiciono per aparèixer a les seves respostes.',
            th: { feature: '&nbsp;', seo: 'SEO tradicional', geo: 'Posicionament IA (GEO)' },
            r1: { label: 'On apareixes', seo: 'Resultats de Google', geo: 'Respostes de ChatGPT, Claude, Perplexity i Gemini' },
            r2: { label: 'Competència', seo: 'Molt alta, milers de webs', geo: 'Baixa: només l\'1% d\'empreses a Andorra ho treballa' },
            r3: { label: 'Intenció de compra', seo: 'Mitjana, l\'usuari encara compara', geo: 'Alta: la IA ja recomana una opció concreta' },
            r4: { label: 'Com s\'aconsegueix', seo: 'Keywords i enllaços', geo: 'Contingut optimitzat, dades estructurades i llms.txt' },
            cta: 'Auditoria GEO gratis'
        },
        faq: {
            tag: '// FAQ',
            title: 'Preguntes <span class="text-gradient">freqüents</span>',
            subtitle: 'El que més em pregunten abans de començar un projecte.',
            q1: { q: 'Quant costa un projecte?', a: 'Una landing des de 500€ i una web professional o app des de 1.500€. Sempre et dono un pressupost tancat per endavant, sense sorpreses ni costos ocults.' },
            q2: { q: 'Quant trigues a entregar?', a: 'Una web entre 1 i 4 setmanes; apps i plataformes SaaS entre 4 i 8 setmanes. Reps avenços cada setmana per veure el progrés en tot moment.' },
            q3: { q: 'El codi i els accessos són meus?', a: 'Sí. En finalitzar t\'entrego tot el codi font i els accessos. Sense dependències ocultes ni lock-in: el teu projecte és 100% teu.' },
            q4: { q: 'Treballes amb clients fora d\'Andorra?', a: 'Sí, treballo en remot amb clients de tota Europa. Comunicació directa amb mi per WhatsApp o videotrucada, sense intermediaris.' },
            q5: { q: 'Ofereixes suport després del llançament?', a: 'Incloc 30 dies de suport gratuït després de l\'entrega. Després pots contractar un pla de manteniment mensual opcional si el necessites.' },
            q6: { q: 'Què és el posicionament en IA (GEO)?', a: 'Optimitzo el teu negoci perquè ChatGPT, Claude o Perplexity et recomanin, no només Google. És un canal amb molt poca competència encara. Demana\'m una auditoria gratis.' }
        },
        audit: { hero: 'Auditoria gratis', banner: 'Auditoria de posicionament en IA <strong>gratis</strong> · sense compromís' },
        ai: {
            tag: '// Intel·ligència Artificial',
            title: 'Implementació d\'IA <span class="text-gradient">segura</span> per al teu negoci',
            subtitle: 'Integrem IA on aporta valor real — i protegint sempre les teves dades.',
            f1: '<strong>Chatbots i assistents</strong> que atenen 24/7, entrenats amb la teva pròpia informació.',
            f2: '<strong>Automatització intel·ligent</strong> de tasques repetitives per estalviar hores de feina.',
            f3: '<strong>Integració</strong> amb ChatGPT, Claude i les eines que ja fas servir.',
            f4: '<strong>Seguretat i privadesa</strong>: les teves dades xifrades, amb control d\'accessos i sense filtrar-se a tercers.',
            cta: 'Parlem del teu projecte d\'IA'
        }
    ,
about: {
            cta: {
                button: "Contactar",
                subtitle: "Conta\'m el teu projecte i fem realitat la teva idea.",
                title: "Treballem junts?",
            },
            floatingCards: {
                card1Label: "12+ Projectes",
                card2Label: "Clients Feliços",
                card3Label: "Pixel Perfect",
            },
            pageHero: {
                subtitle: "Desenvolupador digital apasionat per crear productes que marquen la diferència.",
                tag: "// Sobre mi",
                title: 'Hola, soc <span class="text-gradient">Said</span>',
            },
            skills: {
                backend: "Backend",
                frontend: "Frontend",
                other: "Altres",
                tag: "// Skills",
                title: 'Tecnologies que <span class="text-gradient">domino</span>',
            },
            story: {
                intro: "Soc Said, un desenvolupador amb passió per crear productes digitals que generin valor real. Amb més de <strong>12 projectes realitzats</strong>, he ajudat negocis de diversos sectors a digitalitzar els seus processos i augmentar la seva visibilitat online.",
                paragraph2: "He col·laborat amb <strong>restaurants, immobiliàries, gimnàs i hotels</strong>, creant des de pàgines web corporatives fins a aplicacions mòbils completes. El meu enfocament es basa a entendre les necessitats de cada client i desenvolupar solucions que generin resultats mesurables.",
                paragraph3: "Cada projecte és una oportunitat per superar expectatives. Crec en el codi net, el disseny centrat en l\'usuari i la comunicació constant amb els meus clients.",
                sectorGyms: "💪 Gimnàs",
                sectorHotels: "🏨 Hotels",
                sectorRealEstate: "🏠 Immobiliàries",
                sectorRestaurants: "🍽️ Restaurants",
                title: 'La meva <span class="text-gradient">història</span>',
            },
            values: {
                communication: "Comunicació",
                communicationDesc: "Actualitzacions setmanals i resposta ràpida a les teves dubtes.",
                quality: "Qualitat",
                qualityDesc: "Codi net, ben documentat i testat. Sense dreceres.",
                speed: "Velocitat",
                speedDesc: "Terminis realistes que compleixo. Sense sorpreses.",
                support: "Suport",
                supportDesc: "No desapareixo després del llançament. Sempre disponible.",
                tag: "// Valors",
                title: 'Com <span class="text-gradient">treballo</span>',
            },
        },
        services: {
            tag: "// Serveis",
            title: 'Solucions digitals <span class="text-gradient">a mida</span>',
            subtitle: "Desenvolupo productes digitals que impulsen el teu negoci. Cada projecte s'adapta a les teves necessitats específiques.",
            tech: "Tecnologies:",
            from: "Des de:",
            viewFull: "Veure pàgina completa →",
            web: {
                title: "Desenvolupament Web",
                desc: "Pàgines web modernes, ràpides i optimitzades per convertir visitants en clients. Des de landing pages fins a botigues online completes.",
                f1: "Disseny responsive per a tots els dispositius",
                f2: "Optimització SEO i velocitat de càrrega",
                f3: "Panell d'administració fàcil d'usar",
                f4: "Integració amb eines de màrqueting",
            },
            apps: {
                title: "Apps Mòbils",
                desc: "Aplicacions natives per a iOS i Android que ofereixen la millor experiència d'usuari. Perfectes per fidelitzar clients i millorar processos interns.",
                f1: "Publicació a App Store i Google Play",
                f2: "Notificacions push integrades",
                f3: "Funcionament offline",
                f4: "Sincronització en temps real",
            },
            saas: {
                title: "Plataformes SaaS",
                desc: "Programari com a servei complet amb sistema de subscripcions, dashboard d'administració i API per a integracions.",
                f1: "Sistema de pagaments amb Stripe",
                f2: "Dashboard de mètriques en temps real",
                f3: "Gestió d'usuaris i rols",
                f4: "API REST documentada",
            },
            auto: {
                title: "Automatitzacions",
                desc: "Automatitza tasques repetitives i connecta les teves eines. Estalvia hores de feina manual amb workflows intel·ligents.",
                f1: "Integració amb qualsevol API",
                f2: "Bots de WhatsApp i Telegram",
                f3: "Sincronització entre plataformes",
                f4: "Informes automàtics",
            },
            ai: {
                title: "IA Segura",
                desc: "Implementem intel·ligència artificial on aporta valor real per al teu negoci — chatbots, assistents i automatització intel·ligent — protegint sempre les teves dades.",
                f1: "Chatbots i assistents 24/7 entrenats amb la teva informació",
                f2: "Automatització intel·ligent de processos i atenció",
                f3: "Integració amb ChatGPT, Claude i les teves eines",
                f4: "Dades xifrades, control d'accessos i privadesa garantida",
            },
            seo: {
                title: "Posicionament SEO i GEO",
                desc: "Optimitzem la teva web perquè et trobin: tant a Google (SEO) com a les noves cerques amb IA com ChatGPT, Claude i Perplexity (GEO).",
                f1: "Auditoria SEO tècnica i de continguts",
                f2: "Velocitat, Core Web Vitals i dades estructurades (schema.org)",
                f3: "Posicionament en IA (GEO): aparèixer a ChatGPT, Claude i Perplexity",
                f4: "Implementació de llms.txt i seguiment de resultats",
            },
            cta: {
                title: "Llest per començar?",
                desc: "Explica'm el teu projecte i t'envio un pressupost personalitzat.",
                btn: "Contactar",
            },
        },
        blog: {
            cta: {
                button: "Suggerir tema",
                subtitle: "Dime quin tema t\'interessa i prepararé un article.",
                title: "Vols que escrigui sobre alguna cosa?",
            },
            pageHero: {
                subtitle: "Tutorials, consells i tendències sobre desenvolupament web, apps i SaaS.",
                tag: "// Blog",
                title: 'Consells de <span class="text-gradient">desenvolupament</span>',
            },
            post1: {
                date: "15 Feb 2026",
                excerpt: "Guia completa per desenvolupar una aplicació fitness amb React Native, des de la idea fins a la publicació a les botigues.",
                readMore: "Llegir més →",
                title: "Com crear una app de gimnàs en 2026",
            },
            post2: {
                date: "10 Feb 2026",
                excerpt: "Descobreix com automatitzar tasques repetitives i estalviar hores de treball amb n8n i zapier.",
                readMore: "Llegir més →",
                title: "Automatitzacions que tot negoci necessita",
            },
            post3: {
                date: "5 Feb 2026",
                excerpt: "No depenguis només de xarxes socials. Una web professional multiplica les reserves.",
                readMore: "Llegir més →",
                title: "Per què el teu restaurant necessita web pròpia",
            },
            post4: {
                date: "1 Feb 2026",
                excerpt: "Comparativa de les dues tecnologies més populars per a desenvolupament web en 2026.",
                readMore: "Llegir més →",
                title: "React vs Next.js: Quin triar?",
            },
            post5: {
                date: "25 Ene 2026",
                excerpt: "Com dissenyar una web hotelera que augmenti les reserves directes.",
                readMore: "Llegir més →",
                title: "Webs per a hotels que converteixen",
            },
            post6: {
                date: "20 Ene 2026",
                excerpt: "Les eines digitals que estan revolucionant el sector immobiliari.",
                readMore: "Llegir més →",
                title: "Digitalitza la teva immobiliaria",
            },
        },
        contact: {
            contactInfo: {
                availability: "Disponible per a nous projectes",
                description: "La forma més ràpida de contactar és per WhatsApp. También puedes escribirme directamente.",
                emailLabel: "Email",
                emailValue: "s91564774@gmail.com",
                locationLabel: "Ubicació",
                locationValue: "Andorra 🇦🇩",
                title: "Informació de contacte",
                whatsappLabel: "WhatsApp",
                whatsappValue: "+376 601 249",
            },
            faq: {
                a1: "Depèn de la complexitat. Un landing simple des de 500€, una web corporativa des de 1.000€, i un e-commerce des de 2.000€. Et faig pressupost personalitzat sense compromís.",
                a2: "Normalment respondo en menys de 24 hores. Si és urgent, escriu-me per WhatsApp i et respondere abans.",
                a3: "Sí, treballo 100% remot amb clients de tot el món. La comunicació és per videollamada, email i WhatsApp.",
                a4: "Només un 30-50% per començar, i la resta a l\'entregar. Accepto transferència, Bizum i PayPal.",
                q1: "Quant costa una web?",
                q2: "Quant tardas a respondre?",
                q3: "Treballes amb clients fora d\'Andorra?",
                q4: "Demanames pagament per endavant?",
                tag: "// FAQ",
                title: 'Preguntes <span class="text-gradient">freqüents</span>',
            },
            form: {
                budgetLabel: "Pressupost orientatiu",
                budgetRange1: "Menys de 1.000€",
                budgetRange2: "1.000€ - 2.000€",
                budgetRange3: "2.000€ - 5.000€",
                budgetRange4: "Més de 5.000€",
                budgetSelectOption: "Selecciona un rang",
                emailLabel: "Email",
                emailPlaceholder: "tu@email.com",
                messageLabel: "Conta\'m el teu projecte",
                messagePlaceholder: "Descriu breument què necessites...",
                nameLabel: "Nom",
                namePlaceholder: "El teu nom",
                projectApp: "App Mòbil",
                projectAutomation: "Automatització",
                projectLabel: "Tipus de projecte",
                projectOther: "Altre",
                projectSaaS: "Plataforma SaaS",
                projectSelectOption: "Selecciona una opció",
                projectWeb: "Pàgina Web",
                submitButton: "Enviar missatge",
            },
            pageHero: {
                subtitle: "Conta\'m la teva idea i et respondere en menys de 24 hores.",
                tag: "// Contacte",
                title: 'Parlem del teu <span class="text-gradient">projecte</span>',
            },
            successModal: {
                closeButton: "Tancar",
                message: "Et respondere en menys de 24 hores.",
                title: "Missatge enviat!",
            },
        },
        portfolio: {
            botPresupuestos: {
                badge: "Bot",
                feature1: "Pressupostos al instant",
                feature2: "Disponible 24/7",
                feature3: "Sense intervenció manual",
                name: "Bot Pressupostos",
                problem: "Negocis perdent hores responent les mateixes preguntes de preu per WhatsApp. Els clients esperaven hores per un pressupost que tardava un dia a arribar.",
                solution: "Bot que guia al client amb preguntes clau i genera un pressupost personalitzat de forma instantània, sense intervenció humana, disponible 24/7.",
            },
            caseStudy: {
                blockChallenge: "📋 El Repte",
                blockProcess: "🛠️ Procés",
                blockResults: "📊 Resultats",
                blockSolution: "💡 La Solució",
                challengeDesc: "Un negoci de serveis rebia desenes de consultes diàries per WhatsApp preguntant preus. L\'equip passava hores responent sempre el mateix: recollint dades del client, calculant el cost i redactant el pressupost. A última hora, els clients ja havien contractat a la competència.",
                featurConversation: "Conversa guiada",
                featureAutonomous: "Totalment autònom",
                featureAutonomousDesc: "Funciona sense supervisió humana, alliberant l\'equip per a les coses importants",
                featureCalculation: "Càlcul instantani",
                featureCalculationDesc: "Motor de preus configurable que genera el cost al moment",
                featureConversationDesc: "Flux de preguntes intel·ligent que extreu la informació necessària",
                featureQuote: "Pressupost detallat",
                featureQuoteDesc: "Document personalitzat amb desglose de serveis i preus",
                heroDesc: "Bot automatitzat que genera pressupostos personalitzats al instant, sense intervenció humana",
                heroTitle: "Bot Pressupostos",
                keyFeaturesTitle: "Funcionalitats clau",
                metricAvailability: "24/7",
                metricAvailabilityLabel: "Disponibilitat",
                metricSpeed: "<30s",
                metricSpeedLabel: "Per pressupost",
                metricTime: "-90%",
                metricTimeLabel: "Temps en pressupostos",
                solutionDesc: "Bot que intercepta els missatges entrants, guia al client pas a pas amb preguntes clau per entendre les seves necessitats, calcula el cost en funció de les respostes i envia un pressupost detallat i personalitzat en qüestió de segons, a qualsevol hora del dia.",
                tag: "// Cas d\'ús",
                testimonial: "\"Abans perdíem clients perquè tardàvem a respondre. Ara el bot respon en segons a qualsevol hora i nosaltres ens centrem en tancar vendes, no en fer pressupostos.\"",
                testimonialAuthor: "— Client, sector servicis",
                title: 'Bot Pressupostos: <span class="text-gradient">De hores a segons</span>',
                week1: '<strong>Setmana 1:</strong> Mapeig de fluxos de conversació i lògica de preus',
                week23: '<strong>Setmana 2-3:</strong> Desenvolupament del bot en TypeScript + integració API',
                week4: '<strong>Setmana 4:</strong> Testing amb casos reals i ajustament de respostes',
                week5: '<strong>Setmana 5:</strong> Despliegue en producció i monitorització',
            },
            cta: {
                button: "Contactar",
                subtitle: "Parlemos sobre la teva idea.",
                title: "Vols que el teu projecte sigui el següent?",
            },
            finFlow: {
                badge: "SaaS",
                feature1: "UX moderna sense corba",
                feature2: "Integracions natives",
                feature3: "Preu sense sorpreses",
                name: "FinFlow",
                problem: "Sage domina el mercat de gestió financera per a PYMEs però acumula els mateixos fallos des de fa anys: interfície anticuada i lenta, suport inaccesible, integracions trencades amb Stripe i bancs, i subscripcions abusives que pugen de preu sense avís previ.",
                solution: "Alternativa moderna que fa el mateix que Sage però sense les seves llagues — UX neta pensada per a equips no tècnics, integracions natives amb els serveis que ja usas, suport real en menys de 24h, i preu transparent des del primer dia.",
            },
            jarvis: {
                badge: "IA",
                feature1: "Veu d\'entrada i sortida natural",
                feature2: "Corre en el teu propi hardware",
                feature3: "Memòria persistent",
                name: "Jarvis",
                problem: "Els assistents de veu del mercat són genèrics, viuen en l\'ecosistema d\'una gran corporació i no saben res sobre tu. Demanar-li algo a Alexa o Siri és útil per encendre la llum, no per gestionar la teva vida.",
                solution: "Un assistent de IA personal que viu al teu propi ordinador — com el Jarvis de Iron Man. Li parles des del telèfon, ell t\'escolta, pensa, i et respon amb veu natural. Et coneix, recorda les teves converses anteriors i treballa només per a tu.",
            },
            nlVip: {
                badge: "App",
                feature1: "Accés per membresia",
                feature2: "Contingut exclusiu",
                feature3: "Pagaments recurrents",
                name: "NLVip",
                problem: "Entrenador personal amb una reputació excepcional i una forma de treballar molt propera i personalitzada. La demanda creixé tant que no podia atendre a tots sense perdre la qualitat que el feia diferent — cada client nou era un client al qual no podia donar-li el que mereixia.",
                solution: "App de membresies VIP que li permet gestionar qui accedeix als seus serveis, publicar contingut exclusiu pels seus membres i mantenir aquesta atenció personal que el defineix, sense col·lapsar la seva agenda.",
            },
            nominaPro: {
                badge: "App",
                feature1: "Càlcul automàtic",
                feature2: "Exportar PDF",
                feature3: "Historial d\'empleats",
                name: "Nòmina Pro",
                problem: "PYMEs amb departaments de RRHH invertint dies enters cada mes en calcular nòmines manualment en Excel, amb risc d\'errors i disputes amb empleats.",
                solution: "Sistema de gestió de nòmines que calcula salaris, deduccions i retencions automàticament, generant els documents llestos per firmar en segons.",
            },
            pageHero: {
                subtitle: "Una selecció de productes digitals que he desenvolupat i llançat.",
                tag: "// Portafolis",
                title: 'Els meus <span class="text-gradient">projectes</span>',
            },
            proteinShop: {
                badge: "E-commerce",
                feature1: "Catàleg interactiu",
                feature2: "Carret dinàmic",
                feature3: "Disseny responsiu",
                name: "Protein Shop",
                problem: "Tenia el seu catàleg a Shopify, la qual cosa l\'obligava a pagar cada cop que volia canviar el disseny o el template — sense poder sortir del motlle de Shopify.",
                solution: "Li vam construir una web pròpia amb disseny 100% a mida i la vam connectar al seu compte de Shopify via API, perquè pugui seguir gestionant els seus productes des d'allà — però ara amb control total del disseny i sense pagar per cada canvi.",
            },
            tradingBot: {
                badge: "Bot",
                feature1: "Cripto, forex, metalls i índexs",
                feature2: "Gestió de risc automàtica",
                feature3: "Estratègies configurables",
                name: "Trading Bot",
                problem: "Operar en múltiples mercats — cripto, forex, metalls i índexs — requereix monitoritzar gràfics 24/7, executar amb precisió mil·limètrica i mantenir la cap freda. Cap trader ho aconsegueix a llarg termini: la fatiga i les emocions destrueixen l\'estratègia.",
                solution: "Bot de trading algorítmico multi-mercado que opera en cripto, forex (EUR/USD, GBP/USD…), metalls (or, plata) i índexs bursàtils. Analitza indicadors tècnics en temps real, executa ordres automàticament i gestiona el risc per posició — sense intervenció humana i sense emocions.",
            },
            visitasVirtuales: {
                badge: "Web",
                demoButton: "Veure demo en directe",
                feature1: "Tour des de fotos amb el mòbil",
                feature2: "Catàleg de mobles en 3D col·locable",
                feature3: "Immobiliàries, arquitectes i interiorisme",
                modalUrl: "visitas-virtuales-dgwi.vercel.app/demo — Dissenyador 3D interactiu",
                name: "Visites Virtuals",
                problem: "Immobiliàries, arquitectes i estudis d\'interiorisme necessiten mostrar espais a clients que no poden desplaçar-se — però contractar fotògrafs especialitzats en 360° és car, lent i depèn de tercers per a cada actualització.",
                solution: "Plataforma que converteix fotos normals d\'una habitació, preses des de diferents angles amb qualsevol mòbil, en un tour virtual navegable. Puges les captures de cada punt de l\'espai i el sistema les ensambla en una experiència immersiva llesta per compartir. Els dissenyadors d\'interiorisme poden a més pujar el seu catàleg de mobles i objectes, col·locar-los dins de l\'espai en 3D i mostrar-li al client exactament com quedaria aquest sofà, aquesta làmpada o aquesta estanteria a la sala real — abans de comprar res.",
            },
        },
        svc: {
            tag: '// Servei',
            pricingTag: '// Preus',
            faqTag: '// FAQ',
            faqTitle: 'Preguntes <span class="text-gradient">freqüents</span>',
            backLink: '← Tornar a Serveis',
            perProject: ' / projecte',
            consult: 'Consultar',
            web: {
                heroTitle: 'Desenvolupament <span class="text-gradient">Web</span> a mida',
                heroSubtitle: 'Pàgines web modernes, ràpides i pensades per convertir visitants en clients. Des d\'una landing page fins a una botiga online completa.',
                intro: 'Una web no és una targeta de visita digital: és el teu venedor que treballa 24 hores. Si carrega lent, no es veu bé al mòbil o no deixa clar què fas i com contactar-te, perds clients abans que arribin a conèixer-te. Construïm pàgines web que carreguen ràpid, es veuen bé en qualsevol dispositiu i guien el visitant cap a una acció concreta: trucar, escriure o comprar.',
                h2Incluye: 'Què inclou el servei',
                li1: '<strong>Disseny a mida</strong>, no una plantilla genèrica: adaptat a la teva marca i a com treballa el teu negoci.',
                li2: '<strong>Responsive real</strong>: provat en mòbil, tauleta i escriptori, no només redimensionat.',
                li3: '<strong>SEO tècnic des del primer dia</strong>: velocitat de càrrega, metadades, dades estructurades i una estructura que Google entén.',
                li4: '<strong>Panell d\'administració</strong> senzill perquè editis textos, imatges o preus sense dependre de nosaltres per a cada canvi.',
                li5: '<strong>Formularis i integracions</strong> amb WhatsApp, email, Google Analytics i les eines de màrqueting que ja facis servir.',
                li6: '<strong>Certificat SSL i bones pràctiques de seguretat</strong> incloses de sèrie.',
                h2Tipos: 'Tipus de projecte',
                tiposIntro: 'Cada negoci necessita alguna cosa diferent. Aquests són els formats més habituals:',
                tipo1: '<strong>Landing page:</strong> una sola pàgina enfocada en un objectiu (captar leads, presentar un servei, llançar un producte).',
                tipo2: '<strong>Web corporativa:</strong> diverses pàgines (serveis, sobre nosaltres, contacte, blog) per a negocis que necessiten presència completa.',
                tipo3: '<strong>Botiga online:</strong> catàleg, carret i checkout, amb passarel·la de pagament integrada.',
                tipo4: '<strong>Web amb reserves:</strong> calendari de disponibilitat i confirmació automàtica, ideal per a restaurants, hotels o serveis amb cita prèvia.',
                h2Tech: 'Tecnologies',
                techP: 'Treballem amb <strong>React</strong> i <strong>Next.js</strong> per a les webs que necessiten velocitat i interactivitat, i amb <strong>HTML/CSS i Tailwind</strong> per a projectes més senzills on no cal més. La tecnologia s\'escull segons el que el teu projecte necessita, no a l\'inrevés.',
                h2Proceso: 'Com ho fem',
                proc1Title: 'Consulta i objectius', proc1Desc: 'Entenem el teu negoci, el teu públic i què vols que la web aconsegueixi.',
                proc2Title: 'Estructura i continguts', proc2Desc: 'Definim les pàgines, la navegació i quina informació va a cadascuna.',
                proc3Title: 'Disseny visual', proc3Desc: 'Creem el disseny de la teva marca: colors, tipografia i imatges.',
                proc4Title: 'Desenvolupament i proves', proc4Desc: 'Programem la web i la provem en diferents dispositius i navegadors.',
                proc5Title: 'Llançament', proc5Desc: 'Publiquem, connectem el domini i verifiquem que tot funciona en producció.',
                pricingTitle: 'Inversió <span class="text-gradient">per tipus de web</span>',
                pricingSubtitle: 'Preus orientatius. Cada projecte es pressuposta a mida.',
                price1Title: 'Landing Page', price1Desc: 'Una pàgina enfocada en un objectiu clar.',
                price1F1: 'Disseny responsive', price1F2: 'SEO bàsic', price1F3: 'Formulari de contacte', price1F4: 'Entrega en 1-2 setmanes',
                price2Title: 'Web Corporativa', price2Desc: 'Fins a 5 pàgines amb panell d\'administració.',
                price2F1: 'SEO avançat', price2F2: 'Panell d\'administració', price2F3: 'Integracions (WhatsApp, Analytics)', price2F4: 'Entrega en 2-4 setmanes',
                price3Title: 'Botiga Online', price3Desc: 'Catàleg, carret i passarel·la de pagament.',
                price3F1: 'Checkout amb pagament online', price3F2: 'Gestió de productes i comandes', price3F3: 'Revisions il·limitades', price3F4: 'Suport 3 mesos',
                faq1Q: 'El domini i l\'hosting estan inclosos?',
                faq1A: 'T\'assessorem i configurem tots dos, però es contracten a nom teu perquè siguis tu qui tingui la propietat total, sense dependre de ningú més.',
                faq2Q: 'Puc editar el contingut jo mateix després?',
                faq2A: 'Sí, incloem un panell d\'administració senzill per a textos, imatges i preus sense tocar codi.',
                faq3Q: 'Què passa si necessito canvis després del llançament?',
                faq3A: 'Incloem 30 dies de suport gratuït. Després pots contractar un manteniment mensual opcional o demanar canvis puntuals.',
                faq4Q: 'La web estarà optimitzada per a Google des de l\'inici?',
                faq4A: 'Sí. Apliquem SEO tècnic de base (velocitat, metadades, dades estructurades) en tots els projectes. Si necessites més, tenim un <a href="servicio-seo.html">servei dedicat de SEO i GEO</a>.',
                ctaTitle: 'Comencem amb la teva web?', ctaText: 'Explica\'ns el teu projecte i t\'enviem un pressupost personalitzat.', ctaBtn: 'Parlem'
            },
            apps: {
                heroTitle: 'Apps <span class="text-gradient">Mòbils</span> a mida',
                heroSubtitle: 'Aplicacions natives per a iOS i Android que ofereixen la millor experiència d\'usuari, pensades per fidelitzar clients o millorar els teus processos interns.',
                intro: 'Una app té sentit quan el teu negoci necessita alguna cosa que una web no pot donar: notificacions que arribin al mòbil del client, accés sense connexió, o una experiència més ràpida i fluida per a qui la fa servir cada dia. Abans de programar res, t\'ajudem a decidir si de veritat necessites una app o si una web ben feta resol el mateix amb menys cost.',
                h2Incluye: 'Què inclou el servei',
                li1: '<strong>Disseny UI/UX</strong> pensat per a mòbil des del primer esbós, no una web adaptada.',
                li2: '<strong>Desenvolupament per a iOS i Android</strong> des d\'una mateixa base de codi, més ràpid i econòmic que programar cada plataforma per separat.',
                li3: '<strong>Notificacions push</strong> per a avisos, promocions o recordatoris.',
                li4: '<strong>Funcionament offline</strong> quan la connexió falla o l\'usuari està sense dades.',
                li5: '<strong>Backend i sincronització en temps real</strong> entre dispositius.',
                li6: '<strong>Publicació a App Store i Google Play</strong>, incloent la gestió dels comptes de desenvolupador.',
                h2Casos: 'Casos d\'ús habituals',
                caso1: '<strong>Fidelització:</strong> apps de punts, reserves o comandes per a restaurants, gimnasos o hotels.',
                caso2: '<strong>Gestió interna:</strong> eines perquè el teu equip treballi des del mòbil (inventari, parts de treball, fitxatges).',
                caso3: '<strong>Marketplace o delivery:</strong> apps que connecten el teu negoci amb els teus clients en temps real.',
                h2Tech: 'Tecnologies',
                techP: 'Fem servir <strong>React Native</strong> per desenvolupar iOS i Android des d\'un únic codi, amb <strong>Firebase</strong> per a autenticació, notificacions i base de dades en temps real, i <strong>Node.js</strong> quan el projecte necessita un backend a mida.',
                h2Proceso: 'Com ho fem',
                proc1Title: 'Consulta i validació', proc1Desc: 'Analitzem si una app és la millor solució per al teu cas concret.',
                proc2Title: 'Prototip', proc2Desc: 'Dissenyem les pantalles clau per validar el flux abans de programar.',
                proc3Title: 'Desenvolupament', proc3Desc: 'Programem amb actualitzacions setmanals perquè vegis l\'avenç real.',
                proc4Title: 'Proves en dispositius reals', proc4Desc: 'Provem en diferents mòbils abans d\'enviar a revisió.',
                proc5Title: 'Publicació', proc5Desc: 'Gestionem el procés de revisió i publicació a App Store i Google Play.',
                pricingTitle: 'Inversió <span class="text-gradient">per tipus d\'app</span>',
                pricingSubtitle: 'Preus orientatius. Cada projecte es pressuposta a mida.',
                price1Title: 'MVP', price1Desc: 'Versió inicial per validar la teva idea amb usuaris reals.',
                price1F1: 'Funcionalitats essencials', price1F2: 'iOS i Android', price1F3: 'Publicació a les stores',
                price2Title: 'App Completa', price2Desc: 'Backend propi, notificacions i sincronització en temps real.',
                price2F1: 'Notificacions push', price2F2: 'Funcionament offline', price2F3: 'Panell d\'administració', price2F4: 'Suport 3 mesos',
                price3Title: 'App + Backend a mida', price3Desc: 'Marketplace, delivery o plataformes amb lògica complexa.',
                price3F1: 'Arquitectura escalable', price3F2: 'Integracions de pagament', price3F3: 'Revisions il·limitades',
                faq1Q: 'Necessito comptes de desenvolupador d\'Apple i Google?',
                faq1A: 'Sí, són necessaris per publicar. T\'acompanyem en el procés de creació si no els tens.',
                faq2Q: 'Què passa si Apple o Google actualitzen les seves normes?',
                faq2A: 'Mantenim l\'app al dia amb les actualitzacions necessàries durant el període de suport inclòs; després pots contractar manteniment continu.',
                faq3Q: 'Per què React Native i no apps natives separades?',
                faq3A: 'Amb una sola base de codi cobrim iOS i Android, reduint temps i cost sense sacrificar rendiment ni accés a les funcions del mòbil.',
                faq4Q: 'El codi i les dades són meus?',
                faq4A: 'Sí. En finalitzar t\'entreguem tot el codi font i accessos. Sense dependències ocultes.',
                ctaTitle: 'Tens una idea d\'app?', ctaText: 'Explica\'ns el teu projecte i valorem junts si una app és la millor opció.', ctaBtn: 'Parlem'
            },
            saas: {
                heroTitle: 'Plataformes <span class="text-gradient">SaaS</span>',
                heroSubtitle: 'Software com a servei complet, amb subscripcions, panell d\'administració i API, llest per escalar.',
                intro: 'Un SaaS (Software as a Service) és un producte que els teus clients paguen mes a mes per fer servir: un programari vertical per al teu sector, una eina interna que decideixes vendre a altres negocis, o una idea completament nova. A diferència d\'una web o una app puntual, un SaaS necessita arquitectura pensada per créixer: múltiples clients, plans de preu, facturació automàtica i un panell perquè tu controlis tot sense tocar codi.',
                h2Incluye: 'Què inclou el servei',
                li1: '<strong>Sistema de subscripcions amb Stripe:</strong> cobraments recurrents, plans, proves gratuïtes i cancel·lacions gestionades automàticament.',
                li2: '<strong>Dashboard d\'administració:</strong> per a tu (mètriques de negoci) i per als teus clients (el seu propi panell d\'ús).',
                li3: '<strong>Gestió d\'usuaris i rols:</strong> permisos diferents segons el tipus de compte.',
                li4: '<strong>API REST documentada</strong> perquè altres sistemes es connectin a la teva plataforma.',
                li5: '<strong>Arquitectura multi-client (multi-tenant)</strong> pensada per escalar sense reescriure el sistema cada vegada que creix.',
                li6: '<strong>Infraestructura al núvol</strong> amb còpies de seguretat i monitorització.',
                h2Casos: 'Casos d\'ús habituals',
                caso1: '<strong>Software vertical:</strong> una eina de gestió específica per a un sector (gimnasos, clíniques, immobiliàries) que vens per subscripció.',
                caso2: '<strong>Producte intern que es converteix en negoci:</strong> vas automatitzar alguna cosa per a la teva empresa i veus que altres negocis també ho necessiten.',
                caso3: '<strong>Marketplace o plataforma de reserves</strong> amb múltiples proveïdors i clients.',
                h2Tech: 'Tecnologies',
                techP: 'Construïm sobre <strong>Next.js</strong> per al frontend i les rutes d\'API, <strong>PostgreSQL</strong> com a base de dades relacional robusta, <strong>Stripe</strong> per a tot el cicle de pagaments i <strong>AWS</strong> per a una infraestructura que escala segons el creixement real d\'usuaris.',
                h2Proceso: 'Com ho fem',
                proc1Title: 'Validació de la idea', proc1Desc: 'Definim el model de negoci, plans de preu i funcionalitats imprescindibles.',
                proc2Title: 'MVP', proc2Desc: 'Construïm una primera versió funcional per validar-la amb usuaris reals.',
                proc3Title: 'Iteració', proc3Desc: 'Ajustem segons el feedback real abans d\'invertir en funcionalitats avançades.',
                proc4Title: 'Escalat', proc4Desc: 'Reforcem la infraestructura i afegim funcionalitats a mesura que creixes.',
                pricingTitle: 'Inversió <span class="text-gradient">per fase</span>',
                pricingSubtitle: 'Preus orientatius. Cada SaaS es pressuposta segons la seva complexitat.',
                price1Title: 'MVP', price1Desc: 'Primera versió funcional per validar la teva idea.',
                price1F1: 'Funcionalitats essencials', price1F2: 'Un pla de subscripció', price1F3: 'Panell d\'administració bàsic',
                price2Title: 'Plataforma Completa', price2Desc: 'Múltiples plans, rols d\'usuari i API.',
                price2F1: 'Múltiples plans de preu', price2F2: 'Dashboard de mètriques', price2F3: 'API REST documentada', price2F4: 'Suport 3 mesos',
                price3Title: 'A mida', price3Desc: 'Arquitectura complexa, integracions múltiples o alt volum.',
                price3F1: 'Arquitectura multi-tenant', price3F2: 'Integracions a mida', price3F3: 'Suport continu',
                faq1Q: 'El codi del meu SaaS és meu?',
                faq1A: 'Sí, al 100%. T\'entreguem tot el codi font i accessos; no hi ha lock-in amb nosaltres.',
                faq2Q: 'Pot créixer si aconsegueixo molts clients?',
                faq2A: 'Sí, dissenyem l\'arquitectura des del principi pensant en escalar, i reforcem infraestructura segons el creixement real.',
                faq3Q: 'Inclou manteniment després del llançament?',
                faq3A: 'Incloem suport inicial després de l\'entrega. Per a un SaaS en producció recomanem un pla de manteniment mensual que cobreixi monitorització, seguretat i petites millores.',
                faq4Q: 'Quant triga a estar llest un MVP?',
                faq4A: 'Depèn de l\'abast, però un MVP funcional sol trigar entre 4 i 8 setmanes.',
                ctaTitle: 'Tens una idea de SaaS?', ctaText: 'Explica\'ns el teu projecte i t\'ajudem a definir el MVP més ràpid de validar.', ctaBtn: 'Parlem'
            },
            auto: {
                heroTitle: '<span class="text-gradient">Automatitzacions</span> de processos',
                heroSubtitle: 'Automatitza tasques repetitives i connecta les teves eines. Estalvia hores de feina manual amb workflows intel·ligents.',
                intro: 'Gairebé tots els negocis tenen tasques que es repeteixen cada dia i no requereixen criteri humà: copiar dades entre sistemes, respondre sempre el mateix, generar el mateix informe cada setmana. Cadascuna d\'aquestes tasques és temps que no dediques al que fa créixer el teu negoci. Automatitzem aquests processos perquè s\'executin sols, de forma fiable, sense que hagis de recordar-te de fer-los.',
                h2Incluye: 'Què inclou el servei',
                li1: '<strong>Bots de WhatsApp i Telegram:</strong> responen preguntes freqüents, generen pressupostos o confirmen reserves sense intervenció humana.',
                li2: '<strong>Integració amb qualsevol API:</strong> connectem les eines que ja fas servir (CRM, fulls de càlcul, facturació, xarxes socials) perquè es parlin entre elles.',
                li3: '<strong>Workflows amb n8n:</strong> fluxos visuals que executen diversos passos en cadena de forma automàtica i són fàcils de mantenir.',
                li4: '<strong>Sincronització entre plataformes:</strong> el que canvies en un sistema es reflecteix automàticament als altres.',
                li5: '<strong>Informes automàtics:</strong> informes periòdics generats i enviats sense que ningú hagi de preparar-los a mà.',
                h2Ejemplos: 'Exemples reals',
                ej1: '<strong>Pressupostos automàtics:</strong> un client escriu per WhatsApp i rep un pressupost personalitzat a l\'instant, 24/7.',
                ej2: '<strong>Sincronització de reserves:</strong> una reserva a la web actualitza automàticament el calendari, envia confirmació i notifica l\'equip.',
                ej3: '<strong>Alertes i seguiment:</strong> avisos automàtics quan passa alguna cosa rellevant (una comanda, un estoc baix, un formulari nou).',
                h2Tech: 'Tecnologies',
                techP: 'Fem servir <strong>n8n</strong> per dissenyar fluxos de treball visuals i fàcils de mantenir, <strong>Python</strong> per a lògica més complexa, i treballem amb <strong>APIs i webhooks</strong> de les eines que ja fas servir perquè tot quedi connectat.',
                h2Proceso: 'Com ho fem',
                proc1Title: 'Mapeig del procés', proc1Desc: 'Analitzem quina tasca repeteixes i on es perd més temps exactament.',
                proc2Title: 'Disseny del flux', proc2Desc: 'Dissenyem l\'automatització pas a pas, incloent què fer si alguna cosa falla.',
                proc3Title: 'Implementació', proc3Desc: 'Connectem les eines i provem amb casos reals abans d\'activar-ho.',
                proc4Title: 'Monitorització', proc4Desc: 'Supervisem que funcioni correctament les primeres setmanes d\'ús real.',
                pricingTitle: 'Inversió <span class="text-gradient">per complexitat</span>',
                pricingSubtitle: 'Preus orientatius. Cada automatització es pressuposta a mida.',
                price1Title: 'Automatització simple', price1Desc: 'Un procés, dues eines connectades.',
                price1F1: '1 flux de treball', price1F2: 'Integració amb 1-2 APIs', price1F3: 'Entrega en 3-5 dies',
                price2Title: 'Bot + Workflow', price2Desc: 'Bot conversacional amb lògica i diverses integracions.',
                price2F1: 'Bot de WhatsApp o Telegram', price2F2: 'Diverses integracions connectades', price2F3: 'Informes automàtics',
                price3Title: 'Suite d\'automatització', price3Desc: 'Diversos processos automatitzats i monitorització continua.',
                price3F1: 'Múltiples fluxos connectats', price3F2: 'Monitorització i alertes', price3F3: 'Suport continu',
                faq1Q: 'Què passa si una eina externa canvia la seva API?',
                faq1A: 'Ajustem l\'automatització perquè segueixi funcionant. Per això recomanem un manteniment mensual en automatitzacions crítiques per al teu negoci.',
                faq2Q: 'Necessito coneixements tècnics per fer-lo servir?',
                faq2A: 'No. Un cop implementat, funciona sol. T\'expliquem com revisar que tot va bé si ho necessites.',
                faq3Q: 'Puc automatitzar processos amb IA?',
                faq3A: 'Sí, moltes automatitzacions es combinen amb intel·ligència artificial (respostes generades, classificació de dades). Mira el nostre <a href="servicio-ia.html">servei d\'IA Segura</a>.',
                faq4Q: 'Quant de temps se sol estalviar?',
                faq4A: 'Depèn del procés, però diversos clients ens reporten entre 5 i 10 hores setmanals recuperades després d\'automatitzar tasques repetitives.',
                ctaTitle: 'Quin procés vols automatitzar?', ctaText: 'Explica\'ns quina tasca repeteixes cada setmana i et diem com automatitzar-la.', ctaBtn: 'Parlem'
            },
            ai: {
                heroTitle: 'Implementació d\'<span class="text-gradient">IA Segura</span>',
                heroSubtitle: 'Integrem intel·ligència artificial on aporta valor real al teu negoci, protegint sempre les teves dades i les dels teus clients.',
                intro: 'Implementar IA sense criteri és fàcil i perillós: connectar un chatbot a un model genèric sense pensar quines dades veu, qui pot accedir a les converses o què passa si el model s\'equivoca. El nostre enfocament és diferent: primer entenem quin procés del teu negoci es beneficia de veritat de la IA, i després l\'implementem amb controls de seguretat des del disseny, no com un pedaç posterior.',
                h2Incluye: 'Què inclou el servei',
                li1: '<strong>Chatbots i assistents 24/7</strong> entrenats amb la teva pròpia informació (productes, preus, polítiques), no amb respostes genèriques.',
                li2: '<strong>Automatització intel·ligent</strong> de tasques que avui fa una persona: classificar missatges, resumir documents, generar respostes de primer nivell.',
                li3: '<strong>Integració amb ChatGPT, Claude</strong> i les eines que ja fa servir el teu equip, sense reescriure els teus processos des de zero.',
                li4: '<strong>RAG (Retrieval-Augmented Generation):</strong> l\'assistent consulta els teus documents reals abans de respondre, en lloc d\'inventar informació.',
                li5: '<strong>Dades xifrades i control d\'accessos:</strong> defineixes qui pot veure què, i les teves dades no es fan servir per entrenar models de tercers sense el teu consentiment.',
                h2Casos: 'Casos d\'ús habituals',
                caso1: '<strong>Atenció al client 24/7:</strong> un assistent que respon preguntes freqüents amb la informació real del teu negoci, escalant a una persona quan cal.',
                caso2: '<strong>Generació de contingut:</strong> esborranys de respostes, descripcions de producte o resums que un humà revisa abans de publicar.',
                caso3: '<strong>Anàlisi de dades:</strong> extreure informació útil de documents, enquestes o converses que avui ningú té temps de llegir.',
                h2Seguridad: 'Com abordem la seguretat',
                seguridadIntro: 'La seguretat no és una casella que marquem al final, és part del disseny:',
                seg1: 'Auditem quines dades veurà el model abans de connectar-lo a res.',
                seg2: 'Fem servir proveïdors amb acords clars de privadesa de dades (no entrenament amb les teves converses sense permís).',
                seg3: 'Apliquem control d\'accessos: cada usuari veu només el que li correspon.',
                seg4: 'Provem el sistema per reduir "al·lucinacions" (respostes inventades) abans de posar-lo en producció.',
                h2Proceso: 'Com ho fem',
                proc1Title: 'Auditoria de dades i processos', proc1Desc: 'Identifiquem quina tasca automatitzar i quines dades necessita veure la IA.',
                proc2Title: 'Disseny de l\'assistent', proc2Desc: 'Definim el comportament, els límits i què fer quan no sap respondre.',
                proc3Title: 'Entrenament amb les teves dades', proc3Desc: 'Connectem la teva informació real mitjançant RAG, sense exposar-la innecessàriament.',
                proc4Title: 'Proves de seguretat', proc4Desc: 'Verifiquem accessos, privadesa i respostes abans de llançar.',
                proc5Title: 'Desplegament i monitorització', proc5Desc: 'Llancem i supervisem el comportament real durant les primeres setmanes.',
                pricingTitle: 'Inversió <span class="text-gradient">per abast</span>',
                pricingSubtitle: 'Preus orientatius. Cada implementació es pressuposta a mida.',
                price1Title: 'Chatbot Simple', price1Desc: 'Assistent amb respostes predefinides sobre el teu negoci.',
                price1F1: 'Integrat a la teva web o WhatsApp', price1F2: 'Respostes basades en la teva informació', price1F3: 'Entrega en 1-2 setmanes',
                price2Title: 'Assistent amb RAG', price2Desc: 'Consulta els teus documents reals abans de respondre.',
                price2F1: 'Entrenat amb la teva documentació', price2F2: 'Control d\'accessos i privadesa', price2F3: 'Escalat a persona quan cal',
                price3Title: 'Automatització amb IA', price3Desc: 'Processos complets automatitzats amb IA i integracions.',
                price3F1: 'Múltiples fluxos amb IA', price3F2: 'Integracions a mida', price3F3: 'Monitorització contínua',
                faq1Q: 'Les meves dades es fan servir per entrenar models de tercers?',
                faq1A: 'No. Treballem amb proveïdors que ofereixen garanties que les teves converses i documents no es fan servir per entrenar els seus models generals sense el teu consentiment explícit.',
                faq2Q: 'Puc controlar què respon la IA?',
                faq2A: 'Sí. Definim límits clars: temes que pot tractar, quan ha de derivar a una persona i quin to fer servir, tot revisable per tu.',
                faq3Q: 'Com s\'evita que la IA inventi respostes?',
                faq3A: 'Fent servir RAG: l\'assistent busca en la teva documentació real abans de respondre, en lloc de generar la resposta només amb el seu coneixement general. A més provem casos límit abans de llançar.',
                faq4Q: 'Això té relació amb aparèixer a ChatGPT o Claude com a negoci?',
                faq4A: 'És un servei diferent però complementari: si vols que la IA <em>et recomani</em> a tercers, és <a href="servicio-seo.html">posicionament SEO i GEO</a>. Això és implementar IA <em>dins</em> del teu propi negoci.',
                ctaTitle: 'Vols implementar IA al teu negoci?', ctaText: 'Explica\'ns quin procés t\'agradaria automatitzar i valorem junts l\'enfocament més segur.', ctaBtn: 'Parlem'
            },
            seo: {
                heroTitle: 'Posicionament <span class="text-gradient">SEO i GEO</span>',
                heroSubtitle: 'Optimitzem la teva web perquè et trobin: tant a Google com a les noves cerques amb IA com ChatGPT, Claude i Perplexity.',
                intro: 'Avui no n\'hi ha prou amb posicionar-se a Google. El <strong>40% de les cerques ja comencen en una IA</strong> com ChatGPT, Claude o Perplexity, i només l\'1% de les empreses a Andorra optimitza la seva presència per a aquest canal. Treballem tots dos fronts alhora: el SEO tradicional que segueix sent imprescindible per a Google, i el GEO (Generative Engine Optimization), el nou canal amb molta menys competència encara.',
                h2Incluye: 'Què inclou el servei',
                li1: '<strong>Auditoria SEO tècnica i de continguts:</strong> revisem velocitat, estructura, paraules clau i què li falta a la teva web per posicionar millor.',
                li2: '<strong>Core Web Vitals i velocitat de càrrega:</strong> optimitzem el que Google mesura per decidir la teva posició al rànquing.',
                li3: '<strong>Dades estructurades (schema.org):</strong> perquè cercadors i models d\'IA entenguin exactament què ofereixes.',
                li4: '<strong>Auditoria de visibilitat en IA:</strong> provem desenes de preguntes reals a ChatGPT, Claude i Perplexity per veure si el teu negoci apareix avui.',
                li5: '<strong>Implementació de <code>llms.txt</code>:</strong> l\'estàndard emergent que dona als rastrejadors d\'IA informació ordenada sobre el teu negoci.',
                li6: '<strong>Seguiment de resultats:</strong> monitorització periòdica de posicions a Google i mencions a les respostes d\'IA.',
                h2Complementan: 'SEO i GEO no són el mateix, però es complementen',
                complementanP: 'El SEO segueix sent essencial: Google no desapareixerà i segueix sent la porta d\'entrada de milions de cerques. El GEO no el substitueix, el complementa: optimitza la teva presència perquè els models de llenguatge et reconeguin com una font fiable i et recomanin quan algú els pregunta. Tots dos es reforcen entre si: el contingut ben estructurat ajuda en els dos fronts alhora.',
                blogLink: 'Si vols entendre en detall com funciona el GEO, tenim una <a href="blog-posicionamiento-ia.html">guia completa al blog</a>.',
                h2Proceso: 'Com ho fem',
                proc1Title: 'Auditoria inicial', proc1Desc: 'Analitzem la teva posició actual a Google i la teva visibilitat a les principals IA.',
                proc2Title: 'Pla d\'acció', proc2Desc: 'Prioritzem les millores amb més impacte: tècniques, de contingut i de dades estructurades.',
                proc3Title: 'Implementació', proc3Desc: 'Apliquem les millores tècniques, schema.org, llms.txt i contingut optimitzat.',
                proc4Title: 'Monitorització', proc4Desc: 'Seguiment mensual de posicions a Google i mencions en respostes d\'IA.',
                pricingTitle: 'Inversió <span class="text-gradient">en visibilitat</span>',
                pricingSubtitle: 'Preus orientatius. El seguiment mensual és opcional.',
                perOnce: ' / única vegada', perMonth: '/mes',
                price1Title: 'Auditoria SEO + GEO', price1Desc: 'Diagnòstic complet de la teva situació actual.',
                price1F1: 'Auditoria tècnica i de continguts', price1F2: 'Test de visibilitat en IA', price1F3: 'Informe amb pla d\'acció',
                price2Title: 'Implementació completa', price2Desc: 'Auditoria + aplicació de totes les millores.',
                price2F1: 'Core Web Vitals i schema.org', price2F2: 'Implementació de llms.txt', price2F3: 'Contingut optimitzat per a IA',
                price3Title: 'Seguiment mensual', price3Desc: 'Monitorització contínua i ajustos cada mes.',
                price3F1: 'Seguiment de posicions', price3F2: 'Seguiment de mencions en IA', price3F3: 'Informe mensual',
                faq1Q: 'Quant es triga a veure resultats?',
                faq1A: 'A Perplexity i ChatGPT amb navegació web, els canvis poden notar-se en setmanes. En el coneixement base dels models (sense navegació), depèn del cicle de reentrenament i pot trigar mesos. El SEO a Google sol trigar entre 1 i 3 mesos a notar-se.',
                faq2Q: 'El GEO substitueix el SEO?',
                faq2A: 'No. Es complementen. El SEO segueix sent clau per a Google; el GEO cobreix el canal emergent dels assistents d\'IA. Treballar tots dos alhora reforça la teva presència als dos.',
                faq3Q: 'Com es mesura l\'èxit en GEO?',
                faq3A: 'Provem periòdicament preguntes reals del teu sector a ChatGPT, Claude i Perplexity, i mesurem si et mencionen, en quina posició i amb quin to.',
                faq4Q: 'Puc controlar el que diu la IA sobre el meu negoci?',
                faq4A: 'No de forma directa, però sí influir-hi de forma significativa: una presència online consistent, positiva i ben estructurada és el que els models reflecteixen en les seves respostes.',
                ctaTitle: 'Saps si la IA ja et recomana?', ctaText: 'Et fem una auditoria de posicionament en IA gratis, sense compromís.', ctaBtn: 'Demanar auditoria gratis'
            }
        },
        chatbot: {
            label: 'Assistent IA',
            title: 'Assistent IA · SaeTech',
            subtitle: 'Pregunta\'m sobre els nostres serveis i preus.',
            welcome: 'Hola! Sóc l\'assistent virtual de SaeTech. Pregunta\'m el que vulguis sobre els nostres serveis, preus o com treballem.',
            placeholder: 'Escriu la teva pregunta...',
            send: 'Enviar',
            error: 'Vaja, alguna cosa ha fallat. Torna-ho a provar o escriu-nos per WhatsApp.',
            typing: 'Escrivint…',
            disclaimer: 'Assistent amb IA (Claude). Les respostes poden contenir errors.'
        },
    },
    fr: {
        loader: { tag: 'Développement Numérique' },
        nfc: {
            role: 'Freelance Digital Developer&nbsp;·&nbsp;Andorre',
            message: 'Merci d\'avoir scanné ma carte —<br><span class="nfc-message-highlight">ici commence votre projet</span>',
            cta: 'Explorer mon travail',
            skip: 'Passer'
        },
        nav: { services: 'Services', portfolio: 'Portfolio', blog: 'Blog', about: 'À propos', contact: 'Contact' },
        hero: {
            badge: 'Nouveaux projets acceptés',
            greeting: 'Salut, je suis',
            headline: 'Sites web, apps et SaaS qui <span class="text-gradient">boostent votre entreprise</span>',
            subtitle: 'Nous sommes un studio digital en Andorre. Nous concevons et développons des produits sur mesure qui font grandir votre entreprise.',
            description: 'Implémentation d\'IA · Apps · Sites Web · Automatisations · SaaS',
            cta1: 'Demander un devis',
            cta2: 'Voir les projets'
        },
        stats: { projects: 'Projets', satisfaction: 'Satisfaction', sectors: 'Secteurs' },
        sectors: {
            title: 'Nous avons travaillé avec des entreprises de',
            restaurants: '🍽️ Restaurants',
            realestate: '🏠 Agences immobilières',
            gyms: '💪 Salles de sport',
            hotels: '🏨 Hôtels'
        },
        servicesHome: {
            tag: '// Services',
            title: 'Solutions <span class="text-gradient">numériques</span>',
            web: { title: 'Développement Web', desc: 'Sites web modernes, rapides et responsive.' },
            apps: { title: 'Applications Mobiles', desc: 'Applications iOS et Android natives.' },
            saas: { title: 'SaaS', desc: 'Plateformes évolutives avec abonnements.' },
            auto: { title: 'Automatisations', desc: 'Bots, workflows et connexions.' },
            ai: { title: 'IA Sécurisée', desc: 'Chatbots, automatisation et intégration d\'IA en protégeant vos données.' },
            seo: { title: 'SEO et GEO', desc: 'Apparaissez sur Google et sur les recherches par IA comme ChatGPT, Claude et Perplexity.' },
            link: 'Voir plus →',
            cta: 'Voir tous les services'
        },
        portfolioHome: {
            tag: '// Portfolio',
            title: 'Projets <span class="text-gradient">phares</span>',
            shop: { badge: 'E-commerce', desc: 'Boutique en ligne de compléments sportifs avec catalogue interactif et checkout optimisé pour la conversion.', metric: '+32% de conversion au checkout' },
            bot: { badge: 'Bot', desc: 'Bot qui génère des devis personnalisés automatiquement, disponible 24/7 sans intervention humaine.', metric: 'Réponses en quelques secondes, 24/7' },
            cta: 'Voir tous les projets'
        },
        testimonialsHome: {
            tag: '// Témoignages',
            title: 'Ce que disent <span class="text-gradient">mes clients</span>',
            t1: '"SaeTech a développé notre site de réservations en un temps record. Les réservations ont augmenté de 40%."',
            t2: '"Professionnel et rapide. Notre application immobilière fonctionne parfaitement."',
            t3: '"L\'application de la salle de sport nous a permis de tout numériser. Excellent travail!"',
            t4: '"Notre site d\'hôtel est devenu spectaculaire. Les réservations en ligne fonctionnent parfaitement."',
            t5: '"Il a automatisé tous nos processus. Nous économisons 10 heures par semaine."',
            t6: '"Le SaaS qu\'il a créé pour notre boutique a dépassé toutes nos attentes."'
        },
        process: {
            tag: '// Processus',
            title: 'Comment je <span class="text-gradient">travaille</span>',
            subtitle: 'Un processus clair du début à la fin.',
            step1: { title: 'Consultation', desc: 'Nous analysons votre idée et vos objectifs.', time: '1-2 jours' },
            step2: { title: 'Proposition', desc: 'Devis détaillé avec délais.', time: '2-3 jours' },
            step3: { title: 'Design', desc: 'Je crée le design visuel de votre projet.', time: '1-2 semaines' },
            step4: { title: 'Développement', desc: 'Nous développons avec des mises à jour hebdomadaires.', time: '2-6 semaines' },
            step5: { title: 'Lancement', desc: 'Ajustements finaux et publication.', time: '1-2 jours' }
        },
        trust: {
            tag: 'Garanties',
            title: 'Pourquoi <span class="text-gradient">nous faire confiance</span>',
            card1: { title: 'Satisfaction garantie', desc: 'Vous ne payez pas jusqu\'à être 100% satisfait du résultat.' },
            card2: { title: 'Livraison rapide', desc: 'Des délais réalistes que nous respectons. Sans surprises ni retards.' },
            card3: { title: 'Support inclus', desc: '30 jours de support gratuit après le lancement.' },
            card4: { title: 'Communication directe', desc: 'Vous parlez directement avec l\'équipe. Sans intermédiaires.' }
        },
        pricing: {
            tag: 'Prix',
            title: 'Investissement <span class="text-gradient">transparent</span>',
            subtitle: 'Prix indicatifs. Chaque projet est unique.',
            basic: {
                name: 'Basique', title: 'Landing Page', desc: 'Parfait pour commencer votre présence numérique.',
                f1: 'Design responsive', f2: 'SEO basique', f3: 'Formulaire de contact', f4: '1 révision incluse', f5: 'Livraison en 1-2 semaines',
                action: 'Commencer'
            },
            pro: {
                name: 'Recommandé', title: 'Site Professionnel', desc: 'Idéal pour les entreprises qui veulent grandir.',
                f1: 'Jusqu\'à 5 pages', f2: 'SEO avancé', f3: 'Panneau d\'administration', f4: 'Intégration réseaux sociaux', f5: '3 révisions incluses', f6: 'Livraison en 2-4 semaines',
                action: 'Commencer'
            },
            premium: {
                name: 'Premium', title: 'App / SaaS', desc: 'Solutions complexes sur mesure.',
                f1: 'App mobile ou plateforme SaaS', f2: 'Backend complet', f3: 'Base de données', f4: 'APIs et intégrations', f5: 'Révisions illimitées', f6: 'Support 3 mois',
                action: 'Consulter'
            }
        },
        cta: { title: 'Vous avez un projet en tête?', desc: 'Racontez-moi votre idée et je vous aide à la concrétiser.', btn: 'Parlons' },
        footer: { tagline: 'Développement numérique depuis l\'Andorre 🇦🇩', copyright: '&copy; 2026 Said. Tous droits réservés.' },
        emailPopup: { title: '🎁 Recevez des conseils gratuits', desc: 'Astuces de développement web et offres exclusives. Sans spam.', placeholder: 'Votre email', submit: 'M\'abonner' },
        geo: {
            tag: '// Référencement IA',
            title: 'Que l\'<span class="text-gradient">IA recommande</span> votre entreprise',
            subtitle: '40% des personnes interrogent déjà ChatGPT, Claude ou Perplexity avant Google. Je vous positionne pour apparaître dans leurs réponses.',
            th: { feature: '&nbsp;', seo: 'SEO traditionnel', geo: 'Référencement IA (GEO)' },
            r1: { label: 'Où vous apparaissez', seo: 'Résultats de Google', geo: 'Réponses de ChatGPT, Claude, Perplexity et Gemini' },
            r2: { label: 'Concurrence', seo: 'Très forte, des milliers de sites', geo: 'Faible : seul 1% des entreprises en Andorre s\'y consacre' },
            r3: { label: 'Intention d\'achat', seo: 'Moyenne, l\'utilisateur compare encore', geo: 'Élevée : l\'IA recommande déjà une option précise' },
            r4: { label: 'Comment l\'obtenir', seo: 'Mots-clés et liens', geo: 'Contenu optimisé, données structurées et llms.txt' },
            cta: 'Audit GEO gratuit'
        },
        faq: {
            tag: '// FAQ',
            title: 'Questions <span class="text-gradient">fréquentes</span>',
            subtitle: 'Ce qu\'on me demande le plus avant de démarrer un projet.',
            q1: { q: 'Combien coûte un projet ?', a: 'Une landing à partir de 500€ et un site professionnel ou une app à partir de 1.500€. Je vous donne toujours un devis fixe à l\'avance, sans surprises ni frais cachés.' },
            q2: { q: 'Quels sont les délais de livraison ?', a: 'Un site entre 1 et 4 semaines ; apps et plateformes SaaS entre 4 et 8 semaines. Vous recevez des avancées chaque semaine pour suivre le progrès.' },
            q3: { q: 'Le code et les accès sont-ils à moi ?', a: 'Oui. À la fin je vous remets tout le code source et les accès. Sans dépendances cachées ni lock-in : votre projet est 100% à vous.' },
            q4: { q: 'Travaillez-vous avec des clients hors d\'Andorre ?', a: 'Oui, je travaille à distance avec des clients de toute l\'Europe. Communication directe avec moi par WhatsApp ou visioconférence, sans intermédiaires.' },
            q5: { q: 'Proposez-vous un support après le lancement ?', a: 'J\'inclus 30 jours de support gratuit après la livraison. Ensuite, vous pouvez souscrire un forfait de maintenance mensuel optionnel si besoin.' },
            q6: { q: 'Qu\'est-ce que le référencement IA (GEO) ?', a: 'J\'optimise votre entreprise pour que ChatGPT, Claude ou Perplexity vous recommandent, pas seulement Google. C\'est un canal avec très peu de concurrence. Demandez-moi un audit gratuit.' }
        },
        audit: { hero: 'Audit gratuit', banner: 'Audit de référencement IA <strong>gratuit</strong> · sans engagement' },
        ai: {
            tag: '// Intelligence Artificielle',
            title: 'Implémentation d\'IA <span class="text-gradient">sécurisée</span> pour votre entreprise',
            subtitle: 'Nous intégrons l\'IA là où elle apporte une vraie valeur — en protégeant toujours vos données.',
            f1: '<strong>Chatbots et assistants</strong> disponibles 24/7, entraînés avec vos propres informations.',
            f2: '<strong>Automatisation intelligente</strong> des tâches répétitives pour gagner des heures de travail.',
            f3: '<strong>Intégration</strong> avec ChatGPT, Claude et les outils que vous utilisez déjà.',
            f4: '<strong>Sécurité et confidentialité</strong> : vos données chiffrées, avec contrôle d\'accès et sans fuite vers des tiers.',
            cta: 'Parlons de votre projet d\'IA'
        }
    ,
about: {
            cta: {
                button: "Contacter",
                subtitle: "Parlez-moi de votre projet et concrétisons votre idée.",
                title: "Travaillons ensemble?",
            },
            floatingCards: {
                card1Label: "12+ Projets",
                card2Label: "Clients Heureux",
                card3Label: "Pixel Parfait",
            },
            pageHero: {
                subtitle: "Développeur numérique passionné par créer des produits qui font la différence.",
                tag: "// À propos",
                title: 'Bonjour, je m\'appelle <span class="text-gradient">Said</span>',
            },
            skills: {
                backend: "Backend",
                frontend: "Frontend",
                other: "Autres",
                tag: "// Compétences",
                title: 'Technologies que je <span class="text-gradient">maîtrise</span>',
            },
            story: {
                intro: "Je suis Said, un développeur passionné par créer des produits numériques qui génèrent une valeur réelle. Avec plus de <strong>12 projets réalisés</strong>, j\'ai aidé des entreprises de divers secteurs à numériser leurs processus et augmenter leur visibilité en ligne.",
                paragraph2: "J\'ai collaboré avec <strong>des restaurants, des agences immobilières, des salles de sport et des hôtels</strong>, créant des pages web d\'entreprise jusqu\'à des applications mobiles complètes. Mon approche est basée sur la compréhension des besoins de chaque client et le développement de solutions qui génèrent des résultats mesurables.",
                paragraph3: "Chaque projet est une opportunité de dépasser les attentes. Je crois au code propre, à la conception centrée sur l\'utilisateur et à la communication constante avec mes clients.",
                sectorGyms: "💪 Salles de sport",
                sectorHotels: "🏨 Hôtels",
                sectorRealEstate: "🏠 Immobilier",
                sectorRestaurants: "🍽️ Restaurants",
                title: 'Mon <span class="text-gradient">histoire</span>',
            },
            values: {
                communication: "Communication",
                communicationDesc: "Mises à jour hebdomadaires et réponse rapide à vos questions.",
                quality: "Qualité",
                qualityDesc: "Code propre, bien documenté et testé. Pas de raccourcis.",
                speed: "Vitesse",
                speedDesc: "Délais réalistes que je respecte. Pas de surprises.",
                support: "Support",
                supportDesc: "Je ne disparais pas après le lancement. Toujours disponible.",
                tag: "// Valeurs",
                title: 'Comment je <span class="text-gradient">travaille</span>',
            },
        },
        services: {
            tag: "// Services",
            title: 'Solutions numériques <span class="text-gradient">sur mesure</span>',
            subtitle: "Je développe des produits numériques qui boostent votre entreprise. Chaque projet s'adapte à vos besoins spécifiques.",
            tech: "Technologies :",
            from: "À partir de :",
            viewFull: "Voir la page complète →",
            web: {
                title: "Développement Web",
                desc: "Sites web modernes, rapides et optimisés pour convertir les visiteurs en clients. Des landing pages aux boutiques en ligne complètes.",
                f1: "Design responsive pour tous les appareils",
                f2: "Optimisation SEO et vitesse de chargement",
                f3: "Panneau d'administration facile à utiliser",
                f4: "Intégration avec des outils marketing",
            },
            apps: {
                title: "Applications Mobiles",
                desc: "Applications natives pour iOS et Android offrant la meilleure expérience utilisateur. Parfaites pour fidéliser les clients et améliorer les processus internes.",
                f1: "Publication sur App Store et Google Play",
                f2: "Notifications push intégrées",
                f3: "Fonctionnement hors ligne",
                f4: "Synchronisation en temps réel",
            },
            saas: {
                title: "Plateformes SaaS",
                desc: "Logiciel en tant que service complet avec système d'abonnements, tableau de bord d'administration et API pour les intégrations.",
                f1: "Système de paiement avec Stripe",
                f2: "Tableau de bord de métriques en temps réel",
                f3: "Gestion des utilisateurs et des rôles",
                f4: "API REST documentée",
            },
            auto: {
                title: "Automatisations",
                desc: "Automatisez les tâches répétitives et connectez vos outils. Économisez des heures de travail manuel avec des workflows intelligents.",
                f1: "Intégration avec n'importe quelle API",
                f2: "Bots WhatsApp et Telegram",
                f3: "Synchronisation entre plateformes",
                f4: "Rapports automatiques",
            },
            ai: {
                title: "IA Sécurisée",
                desc: "Nous implémentons l'intelligence artificielle là où elle apporte une vraie valeur à votre entreprise — chatbots, assistants et automatisation intelligente — en protégeant toujours vos données.",
                f1: "Chatbots et assistants 24/7 entraînés avec vos informations",
                f2: "Automatisation intelligente des processus et du support",
                f3: "Intégration avec ChatGPT, Claude et vos outils",
                f4: "Données chiffrées, contrôle d'accès et confidentialité garantie",
            },
            seo: {
                title: "Référencement SEO et GEO",
                desc: "Nous optimisons votre site pour qu'on vous trouve : aussi bien sur Google (SEO) que sur les nouvelles recherches par IA comme ChatGPT, Claude et Perplexity (GEO).",
                f1: "Audit SEO technique et de contenu",
                f2: "Vitesse, Core Web Vitals et données structurées (schema.org)",
                f3: "Référencement IA (GEO) : apparaître sur ChatGPT, Claude et Perplexity",
                f4: "Implémentation de llms.txt et suivi des résultats",
            },
            cta: {
                title: "Prêt à commencer ?",
                desc: "Racontez-moi votre projet et je vous envoie un devis personnalisé.",
                btn: "Contacter",
            },
        },
        blog: {
            cta: {
                button: "Suggérer un sujet",
                subtitle: "Dites-moi quel sujet vous intéresse et je préparerai un article.",
                title: "Vous voulez que j\'écrive sur quelque chose?",
            },
            pageHero: {
                subtitle: "Tutoriels, conseils et tendances sur le développement web, les applications et les SaaS.",
                tag: "// Blog",
                title: 'Conseils de <span class="text-gradient">développement</span>',
            },
            post1: {
                date: "15 Feb 2026",
                excerpt: "Guide complet pour développer une application fitness avec React Native, de l\'idée à la publication sur les stores.",
                readMore: "Lire plus →",
                title: "Comment créer une application de gym en 2026",
            },
            post2: {
                date: "10 Feb 2026",
                excerpt: "Découvrez comment automatiser les tâches répétitives et économiser des heures de travail avec n8n et zapier.",
                readMore: "Lire plus →",
                title: "Automatisations que toute entreprise a besoin",
            },
            post3: {
                date: "5 Feb 2026",
                excerpt: "Ne dépendez pas seulement des médias sociaux. Un site professionnel multiplie les réservations.",
                readMore: "Lire plus →",
                title: "Pourquoi votre restaurant a besoin d\'un site web",
            },
            post4: {
                date: "1 Feb 2026",
                excerpt: "Comparaison des deux technologies les plus populaires pour le développement web en 2026.",
                readMore: "Lire plus →",
                title: "React vs Next.js: Lequel choisir?",
            },
            post5: {
                date: "25 Jan 2026",
                excerpt: "Comment concevoir un site web d\'hôtel qui augmente les réservations directes.",
                readMore: "Lire plus →",
                title: "Sites Web d\'hôtel qui convertissent",
            },
            post6: {
                date: "20 Jan 2026",
                excerpt: "Les outils numériques qui révolutionnent le secteur immobilier.",
                readMore: "Lire plus →",
                title: "Numériser votre agence immobilière",
            },
        },
        contact: {
            contactInfo: {
                availability: "Disponible pour de nouveaux projets",
                description: "Le moyen le plus rapide de me contacter est WhatsApp. Vous pouvez aussi m\'écrire directement.",
                emailLabel: "Email",
                emailValue: "s91564774@gmail.com",
                locationLabel: "Localisation",
                locationValue: "Andorra 🇦🇩",
                title: "Coordonnées",
                whatsappLabel: "WhatsApp",
                whatsappValue: "+376 601 249",
            },
            faq: {
                a1: "Cela dépend de la complexité. Un landing simple à partir de 500€, un site d\'entreprise à partir de 1 000€ et un e-commerce à partir de 2 000€. Je vous donne un devis personnalisé sans engagement.",
                a2: "Je réponds généralement en moins de 24 heures. Si c\'est urgent, écrivez-moi sur WhatsApp et je vous répondrai plus tôt.",
                a3: "Oui, je travaille 100% à distance avec des clients du monde entier. La communication se fait par vidéoconférence, email et WhatsApp.",
                a4: "Seulement 30-50% pour commencer, et le reste à la livraison. J\'accepte les virements, Bizum et PayPal.",
                q1: "Combien coûte un site web?",
                q2: "Combien de temps faut-il pour répondre?",
                q3: "Travaillez-vous avec des clients en dehors d\'Andorre?",
                q4: "Demandez-vous un paiement à l\'avance?",
                tag: "// FAQ",
                title: 'Questions <span class="text-gradient">fréquemment posées</span>',
            },
            form: {
                budgetLabel: "Budget estimé",
                budgetRange1: "Moins de 1 000€",
                budgetRange2: "1 000€ - 2 000€",
                budgetRange3: "2 000€ - 5 000€",
                budgetRange4: "Plus de 5 000€",
                budgetSelectOption: "Sélectionnez une plage",
                emailLabel: "Email",
                emailPlaceholder: "votre@email.com",
                messageLabel: "Parlez-moi de votre projet",
                messagePlaceholder: "Décrivez brièvement ce dont vous avez besoin...",
                nameLabel: "Nom",
                namePlaceholder: "Votre nom",
                projectApp: "Application Mobile",
                projectAutomation: "Automatisation",
                projectLabel: "Type de projet",
                projectOther: "Autre",
                projectSaaS: "Plateforme SaaS",
                projectSelectOption: "Sélectionnez une option",
                projectWeb: "Site Web",
                submitButton: "Envoyer le message",
            },
            pageHero: {
                subtitle: "Dites-moi votre idée et je vous répondrai en moins de 24 heures.",
                tag: "// Contact",
                title: 'Parlons de votre <span class="text-gradient">projet</span>',
            },
            successModal: {
                closeButton: "Fermer",
                message: "Je vous répondrai en moins de 24 heures.",
                title: "Message envoyé!",
            },
        },
        portfolio: {
            botPresupuestos: {
                badge: "Bot",
                feature1: "Devis instantanés",
                feature2: "Disponible 24/7",
                feature3: "Sans intervention manuelle",
                name: "Bot Devis",
                problem: "Entreprises perdant des heures à répondre aux mêmes questions de prix sur WhatsApp. Les clients attendaient des heures pour un devis qui prenait un jour à arriver.",
                solution: "Bot qui guide le client avec des questions clés et génère un devis personnalisé instantanément, sans intervention humaine, disponible 24/7.",
            },
            caseStudy: {
                blockChallenge: "📋 Le Défi",
                blockProcess: "🛠️ Processus",
                blockResults: "📊 Résultats",
                blockSolution: "💡 La Solution",
                challengeDesc: "Un entreprise de services recevait des dizaines de demandes quotidiennes par WhatsApp sur les tarifs. L\'équipe passait des heures à répondre toujours la même chose : collecte de données client, calcul des coûts et rédaction des devis. Au final, les clients avaient déjà contacté la concurrence.",
                featurConversation: "Conversation guidée",
                featureAutonomous: "Entièrement autonome",
                featureAutonomousDesc: "Fonctionne sans surveillance humaine, libérant l\'équipe pour ce qui est important",
                featureCalculation: "Calcul instantané",
                featureCalculationDesc: "Moteur de tarification configurable qui génère le coût sur le moment",
                featureConversationDesc: "Flux de questions intelligent qui extrait les informations nécessaires",
                featureQuote: "Devis détaillé",
                featureQuoteDesc: "Document personnalisé avec ventilation des services et prix",
                heroDesc: "Bot automatisé qui génère des devis personnalisés instantanément, sans intervention humaine",
                heroTitle: "Bot Devis",
                keyFeaturesTitle: "Fonctionnalités clés",
                metricAvailability: "24/7",
                metricAvailabilityLabel: "Disponibilité",
                metricSpeed: "<30s",
                metricSpeedLabel: "Par devis",
                metricTime: "-90%",
                metricTimeLabel: "Temps sur les devis",
                solutionDesc: "Bot qui intercepte les messages entrants, guide le client étape par étape avec des questions clés pour comprendre ses besoins, calcule le coût en fonction des réponses et envoie un devis détaillé et personnalisé en quelques secondes, à tout moment.",
                tag: "// Étude de cas",
                testimonial: "\"Avant, nous perdions des clients parce que nous tardions à répondre. Maintenant, le bot répond en quelques secondes à tout moment et nous pouvons nous concentrer sur la fermeture de ventes, pas sur la rédaction de devis.\"",
                testimonialAuthor: "— Client, secteur services",
                title: 'Bot Devis: <span class="text-gradient">Des heures aux secondes</span>',
                week1: '<strong>Semaine 1:</strong> Cartographie des flux de conversation et logique de tarification',
                week23: '<strong>Semaines 2-3:</strong> Développement du bot en TypeScript + intégration API',
                week4: '<strong>Semaine 4:</strong> Tests avec cas réels et fine-tuning des réponses',
                week5: '<strong>Semaine 5:</strong> Déploiement en production et surveillance',
            },
            cta: {
                button: "Contacter",
                subtitle: "Parlons de votre idée.",
                title: "Vous voulez que votre projet soit le suivant?",
            },
            finFlow: {
                badge: "SaaS",
                feature1: "UX moderne sans courbe",
                feature2: "Intégrations natives",
                feature3: "Prix sans surprises",
                name: "FinFlow",
                problem: "Sage domine le marché de la gestion financière pour les PME mais accumule les mêmes failles depuis des années : interface obsolète et lente, support inaccessible, intégrations cassées avec Stripe et les banques, et abonnements abusifs qui augmentent de prix sans préavis.",
                solution: "Alternative moderne qui fait la même chose que Sage mais sans ses lacunes — UX propre pensée pour les équipes non techniques, intégrations natives avec les services que vous utilisez déjà, support réel en moins de 24h, et prix transparent depuis le premier jour.",
            },
            jarvis: {
                badge: "IA",
                feature1: "Voix d\'entrée et de sortie naturelle",
                feature2: "S\'exécute sur votre propre matériel",
                feature3: "Mémoire persistante",
                name: "Jarvis",
                problem: "Les assistants vocaux du marché sont génériques, vivent dans l\'écosystème d\'une grande entreprise et ne savent rien sur vous. Demander à Alexa ou Siri quelque chose est utile pour allumer la lumière, pas pour gérer votre vie.",
                solution: "Un assistant IA personnel qui vit sur votre propre ordinateur — comme le Jarvis d\'Iron Man. Vous lui parlez depuis le téléphone, il vous écoute, réfléchit et vous répond avec une voix naturelle. Il vous connaît, se souvient de vos conversations précédentes et ne travaille que pour vous.",
            },
            nlVip: {
                badge: "App",
                feature1: "Accès par adhésion",
                feature2: "Contenu exclusif",
                feature3: "Paiements récurrents",
                name: "NLVip",
                problem: "Entraîneur personnel avec une réputation exceptionnelle et une façon de travailler très personnalisée. La demande a tellement augmenté qu\'il ne pouvait pas servir tout le monde sans perdre la qualité qui le rendait différent — chaque nouveau client était un client auquel il ne pouvait pas donner ce qu\'il méritait.",
                solution: "Application d\'adhésions VIP qui lui permet de gérer l\'accès à ses services, de publier du contenu exclusif pour ses membres et de maintenir cette attention personnelle qui le définit, sans surcharger son emploi du temps.",
            },
            nominaPro: {
                badge: "App",
                feature1: "Calcul automatique",
                feature2: "Exporter PDF",
                feature3: "Historique des employés",
                name: "Paie Pro",
                problem: "PME avec des services RH passant des jours entiers chaque mois à calculer les salaires manuellement dans Excel, risquant des erreurs et des conflits avec les employés.",
                solution: "Système de gestion de la paie qui calcule automatiquement les salaires, déductions et retenues, générant les documents prêts à signer en quelques secondes.",
            },
            pageHero: {
                subtitle: "Une sélection de produits numériques que j\'ai développés et lancés.",
                tag: "// Portfolio",
                title: 'Mes <span class="text-gradient">projets</span>',
            },
            proteinShop: {
                badge: "E-commerce",
                feature1: "Catalogue interactif",
                feature2: "Panier dynamique",
                feature3: "Design réactif",
                name: "Protein Shop",
                problem: "Son catalogue était sur Shopify, ce qui l\'obligeait à payer à chaque modification de design ou de template — sans pouvoir sortir du cadre imposé par Shopify.",
                solution: "Nous lui avons construit un site sur mesure et l\'avons connecté à son compte Shopify via API, pour qu\'il continue à gérer ses produits depuis là-bas — mais avec un contrôle total du design et sans payer pour chaque modification.",
            },
            tradingBot: {
                badge: "Bot",
                feature1: "Crypto, forex, métaux et indices",
                feature2: "Gestion des risques automatique",
                feature3: "Stratégies configurables",
                name: "Bot Trading",
                problem: "Trader sur plusieurs marchés — crypto, forex, métaux et indices — nécessite de surveiller les graphiques 24/7, d\'exécuter avec une précision millimétrique et de garder la tête froide. Aucun trader n\'y arrive sur le long terme : la fatigue et les émotions détruisent la stratégie.",
                solution: "Bot de trading algorithmique multi-marché qui négocie sur crypto, forex (EUR/USD, GBP/USD…), métaux (or, argent) et indices boursiers. Analyse les indicateurs techniques en temps réel, exécute automatiquement les ordres et gère le risque par position — sans intervention humaine et sans émotions.",
            },
            visitasVirtuales: {
                badge: "Web",
                demoButton: "Voir démo en direct",
                feature1: "Visite virtuelle à partir de photos avec téléphone",
                feature2: "Catalogue de meubles 3D plaçable",
                feature3: "Immobiliers, architectes et design d\'intérieur",
                modalUrl: "visitas-virtuales-dgwi.vercel.app/demo — Concepteur 3D interactif",
                name: "Visites Virtuelles",
                problem: "Immobiliers, architectes et designers d\'intérieur ont besoin de montrer des espaces à des clients qui ne peuvent pas se déplacer — mais engager des photographes spécialisés en 360° est cher, lent et dépend de tiers pour chaque mise à jour.",
                solution: "Plateforme qui convertit les photos ordinaires d\'une pièce, prises sous différents angles avec n\'importe quel téléphone, en une visite virtuelle navigable. Vous téléchargez les captures de chaque point de l\'espace et le système les assemble en une expérience immersive prête à partager. Les designers d\'intérieur peuvent également télécharger leur catalogue de meubles et d\'objets, les placer dans l\'espace en 3D et montrer exactement au client à quoi ressembleraient ce canapé, cette lampe ou cette étagère dans la pièce réelle — avant d\'acheter quoi que ce soit.",
            },
        },
        svc: {
            tag: '// Service',
            pricingTag: '// Tarifs',
            faqTag: '// FAQ',
            faqTitle: 'Questions <span class="text-gradient">fréquentes</span>',
            backLink: '← Retour aux Services',
            perProject: ' / projet',
            consult: 'Consulter',
            web: {
                heroTitle: 'Développement <span class="text-gradient">Web</span> sur mesure',
                heroSubtitle: 'Sites web modernes, rapides et pensés pour convertir les visiteurs en clients. D\'une landing page à une boutique en ligne complète.',
                intro: 'Un site web n\'est pas une carte de visite numérique : c\'est votre vendeur qui travaille 24 heures sur 24. S\'il charge lentement, s\'il n\'est pas adapté au mobile ou s\'il ne dit pas clairement ce que vous faites et comment vous contacter, vous perdez des clients avant même qu\'ils vous connaissent. Nous construisons des sites qui chargent vite, s\'affichent bien sur tout appareil et guident le visiteur vers une action concrète : appeler, écrire ou acheter.',
                h2Incluye: 'Ce que comprend le service',
                li1: '<strong>Design sur mesure</strong>, pas un modèle générique : adapté à votre marque et à votre façon de travailler.',
                li2: '<strong>Responsive réel</strong> : testé sur mobile, tablette et ordinateur, pas seulement redimensionné.',
                li3: '<strong>SEO technique dès le premier jour</strong> : vitesse de chargement, métadonnées, données structurées et une structure que Google comprend.',
                li4: '<strong>Panneau d\'administration</strong> simple pour modifier textes, images ou prix sans dépendre de nous à chaque changement.',
                li5: '<strong>Formulaires et intégrations</strong> avec WhatsApp, email, Google Analytics et vos outils marketing existants.',
                li6: '<strong>Certificat SSL et bonnes pratiques de sécurité</strong> inclus de série.',
                h2Tipos: 'Types de projet',
                tiposIntro: 'Chaque entreprise a besoin de quelque chose de différent. Voici les formats les plus courants :',
                tipo1: '<strong>Landing page :</strong> une seule page centrée sur un objectif (capter des leads, présenter un service, lancer un produit).',
                tipo2: '<strong>Site corporate :</strong> plusieurs pages (services, à propos, contact, blog) pour les entreprises qui ont besoin d\'une présence complète.',
                tipo3: '<strong>Boutique en ligne :</strong> catalogue, panier et checkout, avec passerelle de paiement intégrée.',
                tipo4: '<strong>Site avec réservations :</strong> calendrier de disponibilité et confirmation automatique, idéal pour restaurants, hôtels ou services sur rendez-vous.',
                h2Tech: 'Technologies',
                techP: 'Nous travaillons avec <strong>React</strong> et <strong>Next.js</strong> pour les sites qui ont besoin de rapidité et d\'interactivité, et avec <strong>HTML/CSS et Tailwind</strong> pour les projets plus simples. La technologie est choisie selon les besoins de votre projet, pas l\'inverse.',
                h2Proceso: 'Comment nous travaillons',
                proc1Title: 'Consultation et objectifs', proc1Desc: 'Nous comprenons votre entreprise, votre public et ce que vous attendez du site.',
                proc2Title: 'Structure et contenus', proc2Desc: 'Nous définissons les pages, la navigation et le contenu de chacune.',
                proc3Title: 'Design visuel', proc3Desc: 'Nous créons le design de votre marque : couleurs, typographie et images.',
                proc4Title: 'Développement et tests', proc4Desc: 'Nous développons le site et le testons sur différents appareils et navigateurs.',
                proc5Title: 'Lancement', proc5Desc: 'Nous publions, connectons le domaine et vérifions que tout fonctionne en production.',
                pricingTitle: 'Investissement <span class="text-gradient">par type de site</span>',
                pricingSubtitle: 'Tarifs indicatifs. Chaque projet fait l\'objet d\'un devis sur mesure.',
                price1Title: 'Landing Page', price1Desc: 'Une page centrée sur un objectif clair.',
                price1F1: 'Design responsive', price1F2: 'SEO de base', price1F3: 'Formulaire de contact', price1F4: 'Livraison en 1-2 semaines',
                price2Title: 'Site Corporate', price2Desc: 'Jusqu\'à 5 pages avec panneau d\'administration.',
                price2F1: 'SEO avancé', price2F2: 'Panneau d\'administration', price2F3: 'Intégrations (WhatsApp, Analytics)', price2F4: 'Livraison en 2-4 semaines',
                price3Title: 'Boutique en Ligne', price3Desc: 'Catalogue, panier et passerelle de paiement.',
                price3F1: 'Checkout avec paiement en ligne', price3F2: 'Gestion des produits et commandes', price3F3: 'Révisions illimitées', price3F4: 'Support 3 mois',
                faq1Q: 'Le domaine et l\'hébergement sont-ils inclus ?',
                faq1A: 'Nous vous conseillons et configurons les deux, mais ils sont souscrits à votre nom pour que vous en ayez la pleine propriété, sans dépendre de personne.',
                faq2Q: 'Puis-je modifier le contenu moi-même ensuite ?',
                faq2A: 'Oui, nous incluons un panneau d\'administration simple pour les textes, images et prix sans toucher au code.',
                faq3Q: 'Que se passe-t-il si j\'ai besoin de changements après le lancement ?',
                faq3A: 'Nous incluons 30 jours de support gratuit. Ensuite, vous pouvez souscrire une maintenance mensuelle optionnelle ou demander des modifications ponctuelles.',
                faq4Q: 'Le site sera-t-il optimisé pour Google dès le départ ?',
                faq4A: 'Oui. Nous appliquons un SEO technique de base (vitesse, métadonnées, données structurées) sur tous les projets. Si vous avez besoin de plus, nous avons un <a href="servicio-seo.html">service dédié SEO et GEO</a>.',
                ctaTitle: 'On commence votre site ?', ctaText: 'Parlez-nous de votre projet et nous vous envoyons un devis personnalisé.', ctaBtn: 'Parlons-en'
            },
            apps: {
                heroTitle: 'Apps <span class="text-gradient">Mobiles</span> sur mesure',
                heroSubtitle: 'Applications natives pour iOS et Android offrant la meilleure expérience utilisateur, pensées pour fidéliser vos clients ou améliorer vos processus internes.',
                intro: 'Une app a du sens quand votre entreprise a besoin de quelque chose qu\'un site web ne peut pas offrir : des notifications qui arrivent sur le mobile du client, un accès hors ligne, ou une expérience plus rapide et fluide pour un usage quotidien. Avant de programmer quoi que ce soit, nous vous aidons à décider si vous avez vraiment besoin d\'une app ou si un site bien conçu résout le même problème à moindre coût.',
                h2Incluye: 'Ce que comprend le service',
                li1: '<strong>Design UI/UX</strong> pensé pour le mobile dès la première esquisse, pas un site adapté.',
                li2: '<strong>Développement iOS et Android</strong> à partir d\'une même base de code, plus rapide et économique que de programmer chaque plateforme séparément.',
                li3: '<strong>Notifications push</strong> pour alertes, promotions ou rappels.',
                li4: '<strong>Fonctionnement hors ligne</strong> quand la connexion échoue ou que l\'utilisateur n\'a pas de données.',
                li5: '<strong>Backend et synchronisation en temps réel</strong> entre appareils.',
                li6: '<strong>Publication sur App Store et Google Play</strong>, y compris la gestion des comptes développeur.',
                h2Casos: 'Cas d\'usage courants',
                caso1: '<strong>Fidélisation :</strong> apps de points, réservations ou commandes pour restaurants, salles de sport ou hôtels.',
                caso2: '<strong>Gestion interne :</strong> outils pour que votre équipe travaille depuis le mobile (inventaire, fiches de travail, pointage).',
                caso3: '<strong>Marketplace ou livraison :</strong> apps qui connectent votre entreprise à vos clients en temps réel.',
                h2Tech: 'Technologies',
                techP: 'Nous utilisons <strong>React Native</strong> pour développer iOS et Android à partir d\'un seul code, avec <strong>Firebase</strong> pour l\'authentification, les notifications et la base de données en temps réel, et <strong>Node.js</strong> quand le projet nécessite un backend sur mesure.',
                h2Proceso: 'Comment nous travaillons',
                proc1Title: 'Consultation et validation', proc1Desc: 'Nous analysons si une app est la meilleure solution pour votre cas concret.',
                proc2Title: 'Prototype', proc2Desc: 'Nous concevons les écrans clés pour valider le flux avant de programmer.',
                proc3Title: 'Développement', proc3Desc: 'Nous développons avec des mises à jour hebdomadaires pour que vous suiviez l\'avancement réel.',
                proc4Title: 'Tests sur appareils réels', proc4Desc: 'Nous testons sur différents mobiles avant l\'envoi en révision.',
                proc5Title: 'Publication', proc5Desc: 'Nous gérons le processus de révision et de publication sur App Store et Google Play.',
                pricingTitle: 'Investissement <span class="text-gradient">par type d\'app</span>',
                pricingSubtitle: 'Tarifs indicatifs. Chaque projet fait l\'objet d\'un devis sur mesure.',
                price1Title: 'MVP', price1Desc: 'Version initiale pour valider votre idée avec de vrais utilisateurs.',
                price1F1: 'Fonctionnalités essentielles', price1F2: 'iOS et Android', price1F3: 'Publication sur les stores',
                price2Title: 'App Complète', price2Desc: 'Backend propre, notifications et synchronisation en temps réel.',
                price2F1: 'Notifications push', price2F2: 'Fonctionnement hors ligne', price2F3: 'Panneau d\'administration', price2F4: 'Support 3 mois',
                price3Title: 'App + Backend sur mesure', price3Desc: 'Marketplace, livraison ou plateformes à logique complexe.',
                price3F1: 'Architecture évolutive', price3F2: 'Intégrations de paiement', price3F3: 'Révisions illimitées',
                faq1Q: 'Ai-je besoin de comptes développeur Apple et Google ?',
                faq1A: 'Oui, ils sont nécessaires pour publier. Nous vous accompagnons dans leur création si vous ne les avez pas.',
                faq2Q: 'Que se passe-t-il si Apple ou Google mettent à jour leurs règles ?',
                faq2A: 'Nous maintenons l\'app à jour avec les mises à jour nécessaires pendant la période de support incluse ; ensuite, vous pouvez souscrire une maintenance continue.',
                faq3Q: 'Pourquoi React Native plutôt que des apps natives séparées ?',
                faq3A: 'Avec une seule base de code, nous couvrons iOS et Android, réduisant temps et coût sans sacrifier performance ni accès aux fonctions du mobile.',
                faq4Q: 'Le code et les données m\'appartiennent-ils ?',
                faq4A: 'Oui. À la fin, nous vous remettons tout le code source et les accès. Sans dépendances cachées.',
                ctaTitle: 'Vous avez une idée d\'app ?', ctaText: 'Parlez-nous de votre projet et évaluons ensemble si une app est la meilleure option.', ctaBtn: 'Parlons-en'
            },
            saas: {
                heroTitle: 'Plateformes <span class="text-gradient">SaaS</span>',
                heroSubtitle: 'Logiciel en tant que service complet, avec abonnements, panneau d\'administration et API, prêt à évoluer.',
                intro: 'Un SaaS (Software as a Service) est un produit que vos clients paient chaque mois pour utiliser : un logiciel vertical pour votre secteur, un outil interne que vous décidez de vendre à d\'autres entreprises, ou une idée totalement nouvelle. Contrairement à un site ou une app ponctuelle, un SaaS nécessite une architecture pensée pour grandir : plusieurs clients, plans tarifaires, facturation automatique et un panneau pour tout contrôler sans toucher au code.',
                h2Incluye: 'Ce que comprend le service',
                li1: '<strong>Système d\'abonnement avec Stripe :</strong> paiements récurrents, plans, essais gratuits et annulations gérées automatiquement.',
                li2: '<strong>Dashboard d\'administration :</strong> pour vous (métriques business) et pour vos clients (leur propre panneau d\'utilisation).',
                li3: '<strong>Gestion des utilisateurs et rôles :</strong> permissions différentes selon le type de compte.',
                li4: '<strong>API REST documentée</strong> pour que d\'autres systèmes se connectent à votre plateforme.',
                li5: '<strong>Architecture multi-client (multi-tenant)</strong> pensée pour évoluer sans réécrire le système à chaque croissance.',
                li6: '<strong>Infrastructure cloud</strong> avec sauvegardes et monitorisation.',
                h2Casos: 'Cas d\'usage courants',
                caso1: '<strong>Logiciel vertical :</strong> un outil de gestion spécifique pour un secteur (salles de sport, cliniques, immobilier) que vous vendez par abonnement.',
                caso2: '<strong>Produit interne devenu business :</strong> vous avez automatisé quelque chose pour votre entreprise et voyez que d\'autres en ont besoin aussi.',
                caso3: '<strong>Marketplace ou plateforme de réservation</strong> avec plusieurs prestataires et clients.',
                h2Tech: 'Technologies',
                techP: 'Nous construisons sur <strong>Next.js</strong> pour le frontend et les routes API, <strong>PostgreSQL</strong> comme base de données relationnelle robuste, <strong>Stripe</strong> pour tout le cycle de paiement et <strong>AWS</strong> pour une infrastructure qui évolue selon la croissance réelle des utilisateurs.',
                h2Proceso: 'Comment nous travaillons',
                proc1Title: 'Validation de l\'idée', proc1Desc: 'Nous définissons le modèle économique, les plans tarifaires et les fonctionnalités essentielles.',
                proc2Title: 'MVP', proc2Desc: 'Nous construisons une première version fonctionnelle pour la valider avec de vrais utilisateurs.',
                proc3Title: 'Itération', proc3Desc: 'Nous ajustons selon les retours réels avant d\'investir dans des fonctionnalités avancées.',
                proc4Title: 'Mise à l\'échelle', proc4Desc: 'Nous renforçons l\'infrastructure et ajoutons des fonctionnalités selon votre croissance.',
                pricingTitle: 'Investissement <span class="text-gradient">par phase</span>',
                pricingSubtitle: 'Tarifs indicatifs. Chaque SaaS fait l\'objet d\'un devis selon sa complexité.',
                price1Title: 'MVP', price1Desc: 'Première version fonctionnelle pour valider votre idée.',
                price1F1: 'Fonctionnalités essentielles', price1F2: 'Un plan d\'abonnement', price1F3: 'Panneau d\'administration basique',
                price2Title: 'Plateforme Complète', price2Desc: 'Plusieurs plans, rôles utilisateurs et API.',
                price2F1: 'Plusieurs plans tarifaires', price2F2: 'Dashboard de métriques', price2F3: 'API REST documentée', price2F4: 'Support 3 mois',
                price3Title: 'Sur mesure', price3Desc: 'Architecture complexe, intégrations multiples ou fort volume.',
                price3F1: 'Architecture multi-tenant', price3F2: 'Intégrations sur mesure', price3F3: 'Support continu',
                faq1Q: 'Le code de mon SaaS m\'appartient-il ?',
                faq1A: 'Oui, à 100%. Nous vous remettons tout le code source et les accès ; aucun lock-in avec nous.',
                faq2Q: 'Peut-il évoluer si j\'obtiens beaucoup de clients ?',
                faq2A: 'Oui, nous concevons l\'architecture dès le départ en pensant à l\'évolutivité, et nous renforçons l\'infrastructure selon la croissance réelle.',
                faq3Q: 'La maintenance après le lancement est-elle incluse ?',
                faq3A: 'Nous incluons un support initial après la livraison. Pour un SaaS en production, nous recommandons un plan de maintenance mensuel couvrant monitorisation, sécurité et petites améliorations.',
                faq4Q: 'Combien de temps pour qu\'un MVP soit prêt ?',
                faq4A: 'Cela dépend de la portée, mais un MVP fonctionnel prend généralement entre 4 et 8 semaines.',
                ctaTitle: 'Vous avez une idée de SaaS ?', ctaText: 'Parlez-nous de votre projet et nous vous aidons à définir le MVP le plus rapide à valider.', ctaBtn: 'Parlons-en'
            },
            auto: {
                heroTitle: '<span class="text-gradient">Automatisations</span> de processus',
                heroSubtitle: 'Automatisez les tâches répétitives et connectez vos outils. Économisez des heures de travail manuel avec des workflows intelligents.',
                intro: 'Presque toutes les entreprises ont des tâches qui se répètent chaque jour et ne nécessitent pas de jugement humain : copier des données entre systèmes, répondre toujours la même chose, générer le même rapport chaque semaine. Chacune de ces tâches est du temps que vous ne consacrez pas à faire grandir votre entreprise. Nous automatisons ces processus pour qu\'ils s\'exécutent seuls, de manière fiable, sans que vous ayez à y penser.',
                h2Incluye: 'Ce que comprend le service',
                li1: '<strong>Bots WhatsApp et Telegram :</strong> répondent aux questions fréquentes, génèrent des devis ou confirment des réservations sans intervention humaine.',
                li2: '<strong>Intégration avec n\'importe quelle API :</strong> nous connectons les outils que vous utilisez déjà (CRM, tableurs, facturation, réseaux sociaux) pour qu\'ils communiquent entre eux.',
                li3: '<strong>Workflows avec n8n :</strong> flux visuels qui exécutent plusieurs étapes en chaîne automatiquement et sont faciles à maintenir.',
                li4: '<strong>Synchronisation entre plateformes :</strong> ce que vous changez dans un système se reflète automatiquement dans les autres.',
                li5: '<strong>Rapports automatiques :</strong> rapports périodiques générés et envoyés sans que personne n\'ait à les préparer manuellement.',
                h2Ejemplos: 'Exemples réels',
                ej1: '<strong>Devis automatiques :</strong> un client écrit sur WhatsApp et reçoit un devis personnalisé instantanément, 24/7.',
                ej2: '<strong>Synchronisation des réservations :</strong> une réservation sur le site met à jour automatiquement le calendrier, envoie une confirmation et notifie l\'équipe.',
                ej3: '<strong>Alertes et suivi :</strong> avis automatiques quand quelque chose d\'important survient (une commande, un stock bas, un nouveau formulaire).',
                h2Tech: 'Technologies',
                techP: 'Nous utilisons <strong>n8n</strong> pour concevoir des workflows visuels faciles à maintenir, <strong>Python</strong> pour une logique plus complexe, et nous travaillons avec les <strong>APIs et webhooks</strong> des outils que vous utilisez déjà pour tout connecter.',
                h2Proceso: 'Comment nous travaillons',
                proc1Title: 'Cartographie du processus', proc1Desc: 'Nous analysons quelle tâche vous répétez et où exactement le plus de temps est perdu.',
                proc2Title: 'Conception du flux', proc2Desc: 'Nous concevons l\'automatisation étape par étape, y compris que faire en cas d\'échec.',
                proc3Title: 'Implémentation', proc3Desc: 'Nous connectons les outils et testons avec des cas réels avant activation.',
                proc4Title: 'Monitorisation', proc4Desc: 'Nous supervisons le bon fonctionnement durant les premières semaines d\'utilisation réelle.',
                pricingTitle: 'Investissement <span class="text-gradient">par complexité</span>',
                pricingSubtitle: 'Tarifs indicatifs. Chaque automatisation fait l\'objet d\'un devis sur mesure.',
                price1Title: 'Automatisation simple', price1Desc: 'Un processus, deux outils connectés.',
                price1F1: '1 flux de travail', price1F2: 'Intégration avec 1-2 APIs', price1F3: 'Livraison en 3-5 jours',
                price2Title: 'Bot + Workflow', price2Desc: 'Bot conversationnel avec logique et plusieurs intégrations.',
                price2F1: 'Bot WhatsApp ou Telegram', price2F2: 'Plusieurs intégrations connectées', price2F3: 'Rapports automatiques',
                price3Title: 'Suite d\'automatisation', price3Desc: 'Plusieurs processus automatisés et monitorisation continue.',
                price3F1: 'Multiples flux connectés', price3F2: 'Monitorisation et alertes', price3F3: 'Support continu',
                faq1Q: 'Que se passe-t-il si un outil externe change son API ?',
                faq1A: 'Nous ajustons l\'automatisation pour qu\'elle continue de fonctionner. C\'est pourquoi nous recommandons une maintenance mensuelle pour les automatisations critiques de votre entreprise.',
                faq2Q: 'Ai-je besoin de compétences techniques pour l\'utiliser ?',
                faq2A: 'Non. Une fois implémentée, elle fonctionne seule. Nous vous expliquons comment vérifier que tout va bien si nécessaire.',
                faq3Q: 'Puis-je automatiser des processus avec l\'IA ?',
                faq3A: 'Oui, de nombreuses automatisations se combinent avec l\'intelligence artificielle (réponses générées, classification de données). Découvrez notre <a href="servicio-ia.html">service d\'IA Sécurisée</a>.',
                faq4Q: 'Combien de temps économise-t-on généralement ?',
                faq4A: 'Cela dépend du processus, mais plusieurs clients nous rapportent entre 5 et 10 heures hebdomadaires récupérées après avoir automatisé des tâches répétitives.',
                ctaTitle: 'Quel processus voulez-vous automatiser ?', ctaText: 'Parlez-nous de la tâche que vous répétez chaque semaine et nous vous dirons comment l\'automatiser.', ctaBtn: 'Parlons-en'
            },
            ai: {
                heroTitle: 'Implémentation d\'<span class="text-gradient">IA Sécurisée</span>',
                heroSubtitle: 'Nous intégrons l\'intelligence artificielle là où elle apporte une vraie valeur à votre entreprise, en protégeant toujours vos données et celles de vos clients.',
                intro: 'Implémenter l\'IA sans discernement est facile et dangereux : connecter un chatbot à un modèle générique sans réfléchir aux données qu\'il voit, à qui peut accéder aux conversations ou à ce qui se passe si le modèle se trompe. Notre approche est différente : nous comprenons d\'abord quel processus de votre entreprise bénéficie vraiment de l\'IA, puis nous l\'implémentons avec des contrôles de sécurité dès la conception, pas comme un correctif ultérieur.',
                h2Incluye: 'Ce que comprend le service',
                li1: '<strong>Chatbots et assistants 24/7</strong> entraînés avec vos propres informations (produits, prix, politiques), pas des réponses génériques.',
                li2: '<strong>Automatisation intelligente</strong> de tâches aujourd\'hui effectuées par une personne : classifier des messages, résumer des documents, générer des réponses de premier niveau.',
                li3: '<strong>Intégration avec ChatGPT, Claude</strong> et les outils que votre équipe utilise déjà, sans réécrire vos processus depuis zéro.',
                li4: '<strong>RAG (Retrieval-Augmented Generation) :</strong> l\'assistant consulte vos documents réels avant de répondre, au lieu d\'inventer des informations.',
                li5: '<strong>Données chiffrées et contrôle d\'accès :</strong> vous définissez qui peut voir quoi, et vos données ne servent pas à entraîner des modèles tiers sans votre consentement.',
                h2Casos: 'Cas d\'usage courants',
                caso1: '<strong>Support client 24/7 :</strong> un assistant qui répond aux questions fréquentes avec les informations réelles de votre entreprise, en escaladant vers une personne si besoin.',
                caso2: '<strong>Génération de contenu :</strong> brouillons de réponses, descriptions de produits ou résumés qu\'un humain relit avant publication.',
                caso3: '<strong>Analyse de données :</strong> extraire des informations utiles de documents, enquêtes ou conversations que personne n\'a le temps de lire aujourd\'hui.',
                h2Seguridad: 'Comment nous abordons la sécurité',
                seguridadIntro: 'La sécurité n\'est pas une case à cocher à la fin, elle fait partie de la conception :',
                seg1: 'Nous auditons quelles données le modèle va voir avant de le connecter à quoi que ce soit.',
                seg2: 'Nous utilisons des fournisseurs offrant des garanties claires de confidentialité des données (pas d\'entraînement avec vos conversations sans permission).',
                seg3: 'Nous appliquons un contrôle d\'accès : chaque utilisateur ne voit que ce qui le concerne.',
                seg4: 'Nous testons le système pour réduire les « hallucinations » (réponses inventées) avant sa mise en production.',
                h2Proceso: 'Comment nous travaillons',
                proc1Title: 'Audit des données et processus', proc1Desc: 'Nous identifions quelle tâche automatiser et quelles données l\'IA doit voir.',
                proc2Title: 'Conception de l\'assistant', proc2Desc: 'Nous définissons le comportement, les limites et que faire quand il ne sait pas répondre.',
                proc3Title: 'Entraînement avec vos données', proc3Desc: 'Nous connectons vos informations réelles via RAG, sans les exposer inutilement.',
                proc4Title: 'Tests de sécurité', proc4Desc: 'Nous vérifions accès, confidentialité et réponses avant le lancement.',
                proc5Title: 'Déploiement et monitorisation', proc5Desc: 'Nous lançons et supervisons le comportement réel durant les premières semaines.',
                pricingTitle: 'Investissement <span class="text-gradient">selon la portée</span>',
                pricingSubtitle: 'Tarifs indicatifs. Chaque implémentation fait l\'objet d\'un devis sur mesure.',
                price1Title: 'Chatbot Simple', price1Desc: 'Assistant avec réponses prédéfinies sur votre entreprise.',
                price1F1: 'Intégré à votre site ou WhatsApp', price1F2: 'Réponses basées sur vos informations', price1F3: 'Livraison en 1-2 semaines',
                price2Title: 'Assistant avec RAG', price2Desc: 'Consulte vos documents réels avant de répondre.',
                price2F1: 'Entraîné avec votre documentation', price2F2: 'Contrôle d\'accès et confidentialité', price2F3: 'Escalade vers une personne si besoin',
                price3Title: 'Automatisation avec IA', price3Desc: 'Processus complets automatisés avec IA et intégrations.',
                price3F1: 'Multiples flux avec IA', price3F2: 'Intégrations sur mesure', price3F3: 'Monitorisation continue',
                faq1Q: 'Mes données servent-elles à entraîner des modèles tiers ?',
                faq1A: 'Non. Nous travaillons avec des fournisseurs offrant des garanties que vos conversations et documents ne servent pas à entraîner leurs modèles généraux sans votre consentement explicite.',
                faq2Q: 'Puis-je contrôler ce que répond l\'IA ?',
                faq2A: 'Oui. Nous définissons des limites claires : sujets qu\'elle peut traiter, quand elle doit dériver vers une personne et quel ton utiliser, tout révisable par vous.',
                faq3Q: 'Comment évite-t-on que l\'IA invente des réponses ?',
                faq3A: 'En utilisant RAG : l\'assistant cherche dans votre documentation réelle avant de répondre, au lieu de générer la réponse uniquement avec sa connaissance générale. Nous testons aussi des cas limites avant le lancement.',
                faq4Q: 'Cela a-t-il un rapport avec le fait d\'apparaître sur ChatGPT ou Claude en tant qu\'entreprise ?',
                faq4A: 'C\'est un service différent mais complémentaire : si vous voulez que l\'IA <em>vous recommande</em> à des tiers, c\'est le <a href="servicio-seo.html">référencement SEO et GEO</a>. Ceci consiste à implémenter l\'IA <em>au sein</em> de votre propre entreprise.',
                ctaTitle: 'Vous voulez implémenter l\'IA dans votre entreprise ?', ctaText: 'Parlez-nous du processus que vous aimeriez automatiser et évaluons ensemble l\'approche la plus sûre.', ctaBtn: 'Parlons-en'
            },
            seo: {
                heroTitle: 'Référencement <span class="text-gradient">SEO et GEO</span>',
                heroSubtitle: 'Nous optimisons votre site pour qu\'on vous trouve : aussi bien sur Google que sur les nouvelles recherches par IA comme ChatGPT, Claude et Perplexity.',
                intro: 'Aujourd\'hui, être bien positionné sur Google ne suffit plus. <strong>40% des recherches commencent déjà sur une IA</strong> comme ChatGPT, Claude ou Perplexity, et seulement 1% des entreprises en Andorre optimisent leur présence pour ce canal. Nous travaillons les deux fronts à la fois : le SEO traditionnel qui reste indispensable pour Google, et le GEO (Generative Engine Optimization), le nouveau canal avec beaucoup moins de concurrence pour l\'instant.',
                h2Incluye: 'Ce que comprend le service',
                li1: '<strong>Audit SEO technique et de contenu :</strong> nous vérifions vitesse, structure, mots-clés et ce qui manque à votre site pour mieux se positionner.',
                li2: '<strong>Core Web Vitals et vitesse de chargement :</strong> nous optimisons ce que Google mesure pour décider de votre position dans le classement.',
                li3: '<strong>Données structurées (schema.org) :</strong> pour que moteurs de recherche et modèles d\'IA comprennent exactement ce que vous proposez.',
                li4: '<strong>Audit de visibilité en IA :</strong> nous testons des dizaines de questions réelles sur ChatGPT, Claude et Perplexity pour voir si votre entreprise apparaît aujourd\'hui.',
                li5: '<strong>Implémentation de <code>llms.txt</code> :</strong> la norme émergente qui donne aux robots d\'IA des informations organisées sur votre entreprise.',
                li6: '<strong>Suivi des résultats :</strong> monitorisation périodique des positions sur Google et des mentions dans les réponses d\'IA.',
                h2Complementan: 'SEO et GEO ne sont pas la même chose, mais se complètent',
                complementanP: 'Le SEO reste essentiel : Google ne va pas disparaître et reste la porte d\'entrée de millions de recherches. Le GEO ne le remplace pas, il le complète : il optimise votre présence pour que les modèles de langage vous reconnaissent comme une source fiable et vous recommandent quand on les interroge. Les deux se renforcent mutuellement : un contenu bien structuré aide sur les deux fronts à la fois.',
                blogLink: 'Si vous voulez comprendre en détail comment fonctionne le GEO, nous avons un <a href="blog-posicionamiento-ia.html">guide complet sur le blog</a>.',
                h2Proceso: 'Comment nous travaillons',
                proc1Title: 'Audit initial', proc1Desc: 'Nous analysons votre position actuelle sur Google et votre visibilité sur les principales IA.',
                proc2Title: 'Plan d\'action', proc2Desc: 'Nous priorisons les améliorations à plus fort impact : techniques, de contenu et de données structurées.',
                proc3Title: 'Implémentation', proc3Desc: 'Nous appliquons les améliorations techniques, schema.org, llms.txt et le contenu optimisé.',
                proc4Title: 'Monitorisation', proc4Desc: 'Suivi mensuel des positions sur Google et des mentions dans les réponses d\'IA.',
                pricingTitle: 'Investissement <span class="text-gradient">en visibilité</span>',
                pricingSubtitle: 'Tarifs indicatifs. Le suivi mensuel est optionnel.',
                perOnce: ' / paiement unique', perMonth: '/mois',
                price1Title: 'Audit SEO + GEO', price1Desc: 'Diagnostic complet de votre situation actuelle.',
                price1F1: 'Audit technique et de contenu', price1F2: 'Test de visibilité en IA', price1F3: 'Rapport avec plan d\'action',
                price2Title: 'Implémentation complète', price2Desc: 'Audit + application de toutes les améliorations.',
                price2F1: 'Core Web Vitals et schema.org', price2F2: 'Implémentation de llms.txt', price2F3: 'Contenu optimisé pour l\'IA',
                price3Title: 'Suivi mensuel', price3Desc: 'Monitorisation continue et ajustements chaque mois.',
                price3F1: 'Suivi des positions', price3F2: 'Suivi des mentions en IA', price3F3: 'Rapport mensuel',
                faq1Q: 'Combien de temps faut-il pour voir des résultats ?',
                faq1A: 'Sur Perplexity et ChatGPT avec navigation web, les changements peuvent se voir en quelques semaines. Dans la connaissance de base des modèles (sans navigation), cela dépend du cycle de réentraînement et peut prendre des mois. Le SEO sur Google prend généralement 1 à 3 mois pour se faire sentir.',
                faq2Q: 'Le GEO remplace-t-il le SEO ?',
                faq2A: 'Non. Ils se complètent. Le SEO reste essentiel pour Google ; le GEO couvre le canal émergent des assistants d\'IA. Travailler les deux à la fois renforce votre présence sur les deux.',
                faq3Q: 'Comment mesure-t-on le succès en GEO ?',
                faq3A: 'Nous testons périodiquement des questions réelles de votre secteur sur ChatGPT, Claude et Perplexity, et mesurons si vous êtes mentionné, à quelle position et avec quel ton.',
                faq4Q: 'Puis-je contrôler ce que dit l\'IA sur mon entreprise ?',
                faq4A: 'Pas directement, mais vous pouvez l\'influencer de manière significative : une présence en ligne cohérente, positive et bien structurée est ce que les modèles reflètent dans leurs réponses.',
                ctaTitle: 'Savez-vous si l\'IA vous recommande déjà ?', ctaText: 'Nous vous offrons un audit de référencement IA gratuit, sans engagement.', ctaBtn: 'Demander un audit gratuit'
            }
        },
        chatbot: {
            label: 'Assistant IA',
            title: 'Assistant IA · SaeTech',
            subtitle: 'Posez-moi vos questions sur nos services et nos prix.',
            welcome: 'Bonjour ! Je suis l\'assistant virtuel de SaeTech. Posez-moi vos questions sur nos services, nos prix ou notre façon de travailler.',
            placeholder: 'Écrivez votre question...',
            send: 'Envoyer',
            error: 'Oups, une erreur est survenue. Réessayez ou écrivez-nous sur WhatsApp.',
            typing: 'En train d\'écrire…',
            disclaimer: 'Assistant avec IA (Claude). Les réponses peuvent contenir des erreurs.'
        },
    },
    en: {
        loader: { tag: 'Digital Development' },
        nfc: {
            role: 'Freelance Digital Developer&nbsp;·&nbsp;Andorra',
            message: 'Thanks for scanning my card —<br><span class="nfc-message-highlight">this is where your project begins</span>',
            cta: 'Explore my work',
            skip: 'Skip'
        },
        nav: { services: 'Services', portfolio: 'Portfolio', blog: 'Blog', about: 'About', contact: 'Contact' },
        hero: {
            badge: 'Accepting new projects',
            greeting: 'Hi, I\'m',
            headline: 'Websites, apps & SaaS that <span class="text-gradient">grow your business</span>',
            subtitle: 'We\'re a digital studio in Andorra. We design and build custom products that grow your business.',
            description: 'AI Implementation · Apps · Websites · Automations · SaaS',
            cta1: 'Get a Quote',
            cta2: 'View Projects'
        },
        stats: { projects: 'Projects', satisfaction: 'Satisfaction', sectors: 'Sectors' },
        sectors: {
            title: 'We\'ve worked with businesses in',
            restaurants: '🍽️ Restaurants',
            realestate: '🏠 Real Estate',
            gyms: '💪 Gyms',
            hotels: '🏨 Hotels'
        },
        servicesHome: {
            tag: '// Services',
            title: 'Digital <span class="text-gradient">solutions</span>',
            web: { title: 'Web Development', desc: 'Modern, fast and responsive websites.' },
            apps: { title: 'Mobile Apps', desc: 'Native iOS and Android applications.' },
            saas: { title: 'SaaS', desc: 'Scalable platforms with subscriptions.' },
            auto: { title: 'Automations', desc: 'Bots, workflows and integrations.' },
            ai: { title: 'Secure AI', desc: 'Chatbots, automation and AI integration while protecting your data.' },
            seo: { title: 'SEO & GEO', desc: 'Show up on Google and on AI searches like ChatGPT, Claude and Perplexity.' },
            link: 'See more →',
            cta: 'View all services'
        },
        portfolioHome: {
            tag: '// Portfolio',
            title: 'Featured <span class="text-gradient">projects</span>',
            shop: { badge: 'E-commerce', desc: 'Online store for sports supplements with an interactive catalog and conversion-optimized checkout.', metric: '+32% checkout conversion' },
            bot: { badge: 'Bot', desc: 'Bot that automatically generates personalized quotes, available 24/7 with no human intervention.', metric: 'Replies in seconds, 24/7' },
            cta: 'View all projects'
        },
        testimonialsHome: {
            tag: '// Testimonials',
            title: 'What <span class="text-gradient">my clients say</span>',
            t1: '"SaeTech built our booking site in record time. Bookings increased by 40%."',
            t2: '"Professional and fast. Our real estate app works perfectly."',
            t3: '"The gym app let us digitize everything. Excellent work!"',
            t4: '"Our hotel website turned out spectacular. Online bookings work perfectly."',
            t5: '"He automated all our processes. We save 10 hours a week."',
            t6: '"The SaaS he built for our shop exceeded all expectations."'
        },
        process: {
            tag: '// Process',
            title: 'How I <span class="text-gradient">work</span>',
            subtitle: 'A clear process from start to finish.',
            step1: { title: 'Consultation', desc: 'We analyze your idea and goals.', time: '1-2 days' },
            step2: { title: 'Proposal', desc: 'Detailed quote with timelines.', time: '2-3 days' },
            step3: { title: 'Design', desc: 'I create the visual design of your project.', time: '1-2 weeks' },
            step4: { title: 'Development', desc: 'We build it with weekly updates.', time: '2-6 weeks' },
            step5: { title: 'Launch', desc: 'Final adjustments and publishing.', time: '1-2 days' }
        },
        trust: {
            tag: 'Guarantees',
            title: 'Why <span class="text-gradient">trust us</span>',
            card1: { title: 'Satisfaction guaranteed', desc: 'You don\'t pay until you\'re 100% satisfied with the result.' },
            card2: { title: 'Fast delivery', desc: 'Realistic deadlines that we meet. No surprises or delays.' },
            card3: { title: 'Support included', desc: '30 days of free support after launch.' },
            card4: { title: 'Direct communication', desc: 'You talk directly with the team. No intermediaries.' }
        },
        pricing: {
            tag: 'Pricing',
            title: 'Transparent <span class="text-gradient">investment</span>',
            subtitle: 'Indicative prices. Each project is unique.',
            basic: {
                name: 'Basic', title: 'Landing Page', desc: 'Perfect to start your digital presence.',
                f1: 'Responsive design', f2: 'Basic SEO', f3: 'Contact form', f4: '1 revision included', f5: 'Delivery in 1-2 weeks',
                action: 'Get Started'
            },
            pro: {
                name: 'Recommended', title: 'Professional Website', desc: 'Ideal for businesses that want to grow.',
                f1: 'Up to 5 pages', f2: 'Advanced SEO', f3: 'Admin panel', f4: 'Social media integration', f5: '3 revisions included', f6: 'Delivery in 2-4 weeks',
                action: 'Get Started'
            },
            premium: {
                name: 'Premium', title: 'App / SaaS', desc: 'Complex custom solutions.',
                f1: 'Mobile app or SaaS platform', f2: 'Full backend', f3: 'Database', f4: 'APIs and integrations', f5: 'Unlimited revisions', f6: '3 months of support',
                action: 'Get in Touch'
            }
        },
        cta: { title: 'Have a project in mind?', desc: 'Tell me your idea and I\'ll help you make it happen.', btn: 'Let\'s talk' },
        footer: { tagline: 'Digital development from Andorra 🇦🇩', copyright: '&copy; 2026 Said. All rights reserved.' },
        emailPopup: { title: '🎁 Get free tips', desc: 'Web development tricks and exclusive offers. No spam.', placeholder: 'Your email', submit: 'Subscribe' },
        geo: {
            tag: '// AI Positioning',
            title: 'Get <span class="text-gradient">AI to recommend</span> your business',
            subtitle: '40% of people already ask ChatGPT, Claude or Perplexity before Google. I position you to show up in their answers.',
            th: { feature: '&nbsp;', seo: 'Traditional SEO', geo: 'AI Positioning (GEO)' },
            r1: { label: 'Where you appear', seo: 'Google results', geo: 'Answers from ChatGPT, Claude, Perplexity and Gemini' },
            r2: { label: 'Competition', seo: 'Very high, thousands of sites', geo: 'Low: only 1% of companies in Andorra work on it' },
            r3: { label: 'Purchase intent', seo: 'Medium, the user is still comparing', geo: 'High: AI already recommends a specific option' },
            r4: { label: 'How it\'s achieved', seo: 'Keywords and links', geo: 'Optimized content, structured data and llms.txt' },
            cta: 'Free GEO audit'
        },
        faq: {
            tag: '// FAQ',
            title: 'Frequently asked <span class="text-gradient">questions</span>',
            subtitle: 'What people ask me most before starting a project.',
            q1: { q: 'How much does a project cost?', a: 'A landing page from €500 and a professional website or app from €1,500. I always give you a fixed quote upfront, with no surprises or hidden costs.' },
            q2: { q: 'How long does delivery take?', a: 'A website takes 1 to 4 weeks; apps and SaaS platforms 4 to 8 weeks. You get weekly progress updates so you can follow along at all times.' },
            q3: { q: 'Do I own the code and the accesses?', a: 'Yes. When finished I hand over all the source code and accesses. No hidden dependencies or lock-in: your project is 100% yours.' },
            q4: { q: 'Do you work with clients outside Andorra?', a: 'Yes, I work remotely with clients across Europe. Direct communication with me via WhatsApp or video call, no middlemen.' },
            q5: { q: 'Do you offer support after launch?', a: 'I include 30 days of free support after delivery. After that, you can take an optional monthly maintenance plan if you need it.' },
            q6: { q: 'What is AI positioning (GEO)?', a: 'I optimize your business so ChatGPT, Claude or Perplexity recommend you, not just Google. It\'s a channel with very little competition yet. Ask me for a free audit.' }
        },
        audit: { hero: 'Free audit', banner: 'Free <strong>AI positioning</strong> audit · no commitment' },
        ai: {
            tag: '// Artificial Intelligence',
            title: '<span class="text-gradient">Secure</span> AI implementation for your business',
            subtitle: 'We integrate AI where it adds real value — always protecting your data.',
            f1: '<strong>Chatbots and assistants</strong> available 24/7, trained on your own information.',
            f2: '<strong>Smart automation</strong> of repetitive tasks to save hours of work.',
            f3: '<strong>Integration</strong> with ChatGPT, Claude and the tools you already use.',
            f4: '<strong>Security and privacy</strong>: your data encrypted, with access control and no leaks to third parties.',
            cta: 'Let\'s talk about your AI project'
        }
    ,
about: {
            cta: {
                button: "Contact",
                subtitle: "Tell me about your project and let\'s make your idea a reality.",
                title: "Let\'s work together?",
            },
            floatingCards: {
                card1Label: "12+ Projects",
                card2Label: "Happy Clients",
                card3Label: "Pixel Perfect",
            },
            pageHero: {
                subtitle: "Digital developer passionate about creating products that make a difference.",
                tag: "// About me",
                title: 'Hello, I\'m <span class="text-gradient">Said</span>',
            },
            skills: {
                backend: "Backend",
                frontend: "Frontend",
                other: "Others",
                tag: "// Skills",
                title: 'Technologies I <span class="text-gradient">master</span>',
            },
            story: {
                intro: "I\'m Said, a developer passionate about creating digital products that generate real value. With over <strong>12 projects completed</strong>, I\'ve helped businesses across various sectors digitize their processes and increase their online visibility.",
                paragraph2: "I\'ve collaborated with <strong>restaurants, real estate agencies, gyms, and hotels</strong>, creating everything from corporate websites to complete mobile applications. My approach is based on understanding each client\'s needs and developing solutions that generate measurable results.",
                paragraph3: "Every project is an opportunity to exceed expectations. I believe in clean code, user-centered design, and constant communication with my clients.",
                sectorGyms: "💪 Gyms",
                sectorHotels: "🏨 Hotels",
                sectorRealEstate: "🏠 Real estate",
                sectorRestaurants: "🍽️ Restaurants",
                title: 'My <span class="text-gradient">story</span>',
            },
            values: {
                communication: "Communication",
                communicationDesc: "Weekly updates and quick answers to your questions.",
                quality: "Quality",
                qualityDesc: "Clean, well-documented, and tested code. No shortcuts.",
                speed: "Speed",
                speedDesc: "Realistic timelines I deliver. No surprises.",
                support: "Support",
                supportDesc: "I don\'t disappear after launch. Always available.",
                tag: "// Values",
                title: 'How I <span class="text-gradient">work</span>',
            },
        },
        services: {
            tag: "// Services",
            title: 'Digital solutions <span class="text-gradient">made to measure</span>',
            subtitle: "I build digital products that drive your business forward. Every project is tailored to your specific needs.",
            tech: "Technologies:",
            from: "From:",
            viewFull: "View full page →",
            web: {
                title: "Web Development",
                desc: "Modern, fast websites optimized to convert visitors into customers. From landing pages to full online stores.",
                f1: "Responsive design for all devices",
                f2: "SEO optimization and fast loading speed",
                f3: "Easy-to-use admin panel",
                f4: "Integration with marketing tools",
            },
            apps: {
                title: "Mobile Apps",
                desc: "Native iOS and Android apps that deliver the best user experience. Perfect for building customer loyalty and improving internal processes.",
                f1: "Published on App Store and Google Play",
                f2: "Built-in push notifications",
                f3: "Offline functionality",
                f4: "Real-time sync",
            },
            saas: {
                title: "SaaS Platforms",
                desc: "Complete software-as-a-service with a subscription system, admin dashboard, and API for integrations.",
                f1: "Payment system with Stripe",
                f2: "Real-time metrics dashboard",
                f3: "User and role management",
                f4: "Documented REST API",
            },
            auto: {
                title: "Automation",
                desc: "Automate repetitive tasks and connect your tools. Save hours of manual work with smart workflows.",
                f1: "Integration with any API",
                f2: "WhatsApp and Telegram bots",
                f3: "Cross-platform sync",
                f4: "Automated reports",
            },
            ai: {
                title: "Secure AI",
                desc: "We implement artificial intelligence where it adds real value to your business — chatbots, assistants and smart automation — always protecting your data.",
                f1: "24/7 chatbots and assistants trained on your information",
                f2: "Smart automation of processes and support",
                f3: "Integration with ChatGPT, Claude and your tools",
                f4: "Encrypted data, access control and guaranteed privacy",
            },
            seo: {
                title: "SEO & GEO Positioning",
                desc: "We optimize your site so people find you: both on Google (SEO) and on the new AI searches like ChatGPT, Claude and Perplexity (GEO).",
                f1: "Technical and content SEO audit",
                f2: "Speed, Core Web Vitals and structured data (schema.org)",
                f3: "AI positioning (GEO): show up on ChatGPT, Claude and Perplexity",
                f4: "llms.txt implementation and results tracking",
            },
            cta: {
                title: "Ready to get started?",
                desc: "Tell me about your project and I'll send you a personalized quote.",
                btn: "Contact me",
            },
        },
        blog: {
            cta: {
                button: "Suggest a topic",
                subtitle: "Tell me what topic interests you and I\'ll prepare an article.",
                title: "Want me to write about something?",
            },
            pageHero: {
                subtitle: "Tutorials, tips, and trends on web development, apps, and SaaS.",
                tag: "// Blog",
                title: 'Development <span class="text-gradient">tips</span>',
            },
            post1: {
                date: "15 Feb 2026",
                excerpt: "Complete guide to developing a fitness app with React Native, from idea to store publication.",
                readMore: "Read more →",
                title: "How to create a gym app in 2026",
            },
            post2: {
                date: "10 Feb 2026",
                excerpt: "Discover how to automate repetitive tasks and save hours of work with n8n and zapier.",
                readMore: "Read more →",
                title: "Automations every business needs",
            },
            post3: {
                date: "5 Feb 2026",
                excerpt: "Don\'t rely only on social media. A professional website multiplies reservations.",
                readMore: "Read more →",
                title: "Why your restaurant needs its own website",
            },
            post4: {
                date: "1 Feb 2026",
                excerpt: "Comparison of the two most popular technologies for web development in 2026.",
                readMore: "Read more →",
                title: "React vs Next.js: Which to choose?",
            },
            post5: {
                date: "25 Jan 2026",
                excerpt: "How to design a hotel website that increases direct bookings.",
                readMore: "Read more →",
                title: "Hotel websites that convert",
            },
            post6: {
                date: "20 Jan 2026",
                excerpt: "Digital tools that are revolutionizing the real estate sector.",
                readMore: "Read more →",
                title: "Digitize your real estate agency",
            },
        },
        contact: {
            contactInfo: {
                availability: "Available for new projects",
                description: "The fastest way to contact me is WhatsApp. You can also write me directly.",
                emailLabel: "Email",
                emailValue: "s91564774@gmail.com",
                locationLabel: "Location",
                locationValue: "Andorra 🇦🇩",
                title: "Contact information",
                whatsappLabel: "WhatsApp",
                whatsappValue: "+376 601 249",
            },
            faq: {
                a1: "It depends on complexity. A simple landing from €500, a corporate website from €1,000, and an e-commerce from €2,000. I\'ll give you a personalized quote with no obligation.",
                a2: "I usually respond in less than 24 hours. If it\'s urgent, message me on WhatsApp and I\'ll reply sooner.",
                a3: "Yes, I work 100% remote with clients worldwide. Communication is via video call, email, and WhatsApp.",
                a4: "Just 30-50% to get started, and the rest on delivery. I accept bank transfer, Bizum, and PayPal.",
                q1: "How much does a website cost?",
                q2: "How long do you take to respond?",
                q3: "Do you work with clients outside Andorra?",
                q4: "Do you ask for payment upfront?",
                tag: "// FAQ",
                title: 'Frequently <span class="text-gradient">asked questions</span>',
            },
            form: {
                budgetLabel: "Estimated budget",
                budgetRange1: "Less than €1,000",
                budgetRange2: "€1,000 - €2,000",
                budgetRange3: "€2,000 - €5,000",
                budgetRange4: "More than €5,000",
                budgetSelectOption: "Select a range",
                emailLabel: "Email",
                emailPlaceholder: "your@email.com",
                messageLabel: "Tell me about your project",
                messagePlaceholder: "Briefly describe what you need...",
                nameLabel: "Name",
                namePlaceholder: "Your name",
                projectApp: "Mobile App",
                projectAutomation: "Automation",
                projectLabel: "Project type",
                projectOther: "Other",
                projectSaaS: "SaaS Platform",
                projectSelectOption: "Select an option",
                projectWeb: "Website",
                submitButton: "Send message",
            },
            pageHero: {
                subtitle: "Tell me your idea and I\'ll reply in less than 24 hours.",
                tag: "// Contact",
                title: 'Let\'s talk about your <span class="text-gradient">project</span>',
            },
            successModal: {
                closeButton: "Close",
                message: "I\'ll reply in less than 24 hours.",
                title: "Message sent!",
            },
        },
        portfolio: {
            botPresupuestos: {
                badge: "Bot",
                feature1: "Instant quotes",
                feature2: "Available 24/7",
                feature3: "No manual intervention",
                name: "Quote Bot",
                problem: "Businesses losing hours answering the same price questions on WhatsApp. Customers waited hours for a quote that took a day to arrive.",
                solution: "Bot that guides customers with key questions and generates a personalized quote instantly, without human intervention, available 24/7.",
            },
            caseStudy: {
                blockChallenge: "📋 The Challenge",
                blockProcess: "🛠️ Process",
                blockResults: "📊 Results",
                blockSolution: "💡 The Solution",
                challengeDesc: "A service business received dozens of daily WhatsApp price inquiries. The team spent hours answering the same thing: collecting customer data, calculating costs, and drafting quotes. By the time they responded, customers had already hired competitors.",
                featurConversation: "Guided conversation",
                featureAutonomous: "Fully autonomous",
                featureAutonomousDesc: "Works without human supervision, freeing the team for what matters",
                featureCalculation: "Instant calculation",
                featureCalculationDesc: "Configurable pricing engine that generates cost on the spot",
                featureConversationDesc: "Smart question flow that extracts necessary information",
                featureQuote: "Detailed quote",
                featureQuoteDesc: "Customized document with breakdown of services and prices",
                heroDesc: "Automated bot that generates personalized quotes instantly, without human intervention",
                heroTitle: "Quote Bot",
                keyFeaturesTitle: "Key features",
                metricAvailability: "24/7",
                metricAvailabilityLabel: "Availability",
                metricSpeed: "<30s",
                metricSpeedLabel: "Per quote",
                metricTime: "-90%",
                metricTimeLabel: "Time on quotes",
                solutionDesc: "Bot that intercepts incoming messages, guides customers step-by-step with key questions to understand their needs, calculates cost based on responses, and sends a detailed personalized quote in seconds, any time of day.",
                tag: "// Case Study",
                testimonial: "\"Before we lost customers because we took too long to respond. Now the bot responds in seconds anytime and we focus on closing sales, not writing quotes.\"",
                testimonialAuthor: "— Client, service sector",
                title: 'Quote Bot: <span class="text-gradient">From hours to seconds</span>',
                week1: '<strong>Week 1:</strong> Map conversation flows and pricing logic',
                week23: '<strong>Weeks 2-3:</strong> Develop bot in TypeScript + API integration',
                week4: '<strong>Week 4:</strong> Test with real cases and fine-tune responses',
                week5: '<strong>Week 5:</strong> Deploy to production and monitor',
            },
            cta: {
                button: "Contact",
                subtitle: "Let\'s talk about your idea.",
                title: "Want your project to be next?",
            },
            finFlow: {
                badge: "SaaS",
                feature1: "Modern UX with no learning curve",
                feature2: "Native integrations",
                feature3: "Pricing with no surprises",
                name: "FinFlow",
                problem: "Sage dominates the SME financial management market but accumulates the same flaws for years: outdated and slow interface, inaccessible support, broken integrations with Stripe and banks, and abusive subscriptions that raise prices without notice.",
                solution: "Modern alternative that does the same as Sage but without its flaws — clean UX designed for non-technical teams, native integrations with services you already use, real support in under 24h, and transparent pricing from day one.",
            },
            jarvis: {
                badge: "AI",
                feature1: "Natural input and output voice",
                feature2: "Runs on your own hardware",
                feature3: "Persistent memory",
                name: "Jarvis",
                problem: "Market voice assistants are generic, live in a big corporation\'s ecosystem, and don\'t know anything about you. Asking Alexa or Siri to do something is useful for turning on the light, not for managing your life.",
                solution: "A personal AI assistant that lives on your own computer — like Iron Man\'s Jarvis. You talk to it from your phone, it listens, thinks, and responds with natural voice. It knows you, remembers your previous conversations, and works only for you.",
            },
            nlVip: {
                badge: "App",
                feature1: "Membership access",
                feature2: "Exclusive content",
                feature3: "Recurring payments",
                name: "NLVip",
                problem: "Personal trainer with exceptional reputation and highly personalized working approach. Demand grew so much he couldn\'t serve everyone without losing the quality that made him different — each new client was someone he couldn\'t give what they deserved.",
                solution: "VIP membership app that lets him manage access to his services, publish exclusive content for members, and maintain that personal attention that defines him, without overwhelming his schedule.",
            },
            nominaPro: {
                badge: "App",
                feature1: "Automatic calculation",
                feature2: "Export PDF",
                feature3: "Employee history",
                name: "Payroll Pro",
                problem: "SMEs with HR departments spending entire days each month manually calculating payroll in Excel, risking errors and disputes with employees.",
                solution: "Payroll management system that automatically calculates salaries, deductions, and withholdings, generating documents ready to sign in seconds.",
            },
            pageHero: {
                subtitle: "A selection of digital products I have developed and launched.",
                tag: "// Portfolio",
                title: 'My <span class="text-gradient">projects</span>',
            },
            proteinShop: {
                badge: "E-commerce",
                feature1: "Interactive catalog",
                feature2: "Dynamic cart",
                feature3: "Responsive design",
                name: "Protein Shop",
                problem: "His catalog was on Shopify, which meant paying every time he wanted to change the design or template — with no way to break out of Shopify's constraints.",
                solution: "We built him a fully custom website and connected it to his Shopify account via API, so he can keep managing his products there — but now with complete design freedom and no fees for every change.",
            },
            tradingBot: {
                badge: "Bot",
                feature1: "Crypto, forex, metals, and indices",
                feature2: "Automatic risk management",
                feature3: "Configurable strategies",
                name: "Trading Bot",
                problem: "Trading multiple markets — crypto, forex, metals, and indices — requires monitoring charts 24/7, executing with millimeter precision, and staying level-headed. No trader achieves this long-term: fatigue and emotions destroy the strategy.",
                solution: "Multi-market algorithmic trading bot that operates on crypto, forex (EUR/USD, GBP/USD…), metals (gold, silver), and stock indices. Analyzes technical indicators in real-time, executes orders automatically, and manages risk per position — without human intervention and without emotions.",
            },
            visitasVirtuales: {
                badge: "Web",
                demoButton: "View live demo",
                feature1: "Virtual tour from mobile photos",
                feature2: "Placeable 3D furniture catalog",
                feature3: "Real estate, architects, and interior design",
                modalUrl: "visitas-virtuales-dgwi.vercel.app/demo — Interactive 3D Designer",
                name: "Virtual Tours",
                problem: "Real estate agents, architects, and interior designers need to show spaces to clients who can\'t visit in person — but hiring specialized 360° photographers is expensive, slow, and depends on third parties for each update.",
                solution: "Platform that converts regular photos of a room, taken from different angles with any phone, into a navigable virtual tour. Upload captures of each point in the space and the system assembles them into an immersive experience ready to share. Interior designers can also upload their furniture and object catalog, place them in the 3D space, and show clients exactly how that sofa, lamp, or shelf would look in the real room — before buying anything.",
            },
        },
        svc: {
            tag: '// Service',
            pricingTag: '// Pricing',
            faqTag: '// FAQ',
            faqTitle: 'Frequently asked <span class="text-gradient">questions</span>',
            backLink: '← Back to Services',
            perProject: ' / project',
            consult: 'Contact us',
            web: {
                heroTitle: 'Custom <span class="text-gradient">Web</span> Development',
                heroSubtitle: 'Modern, fast websites designed to convert visitors into customers. From a landing page to a full online store.',
                intro: 'A website isn\'t a digital business card — it\'s your salesperson working 24 hours a day. If it loads slowly, doesn\'t look right on mobile, or doesn\'t make clear what you do and how to contact you, you lose customers before they even get to know you. We build websites that load fast, look great on any device, and guide visitors toward a concrete action: call, write, or buy.',
                h2Incluye: 'What the service includes',
                li1: '<strong>Custom design</strong>, not a generic template: adapted to your brand and how your business works.',
                li2: '<strong>Truly responsive</strong>: tested on mobile, tablet, and desktop, not just resized.',
                li3: '<strong>Technical SEO from day one</strong>: loading speed, metadata, structured data, and a structure Google understands.',
                li4: '<strong>Admin panel</strong> simple enough to edit text, images, or prices without depending on us for every change.',
                li5: '<strong>Forms and integrations</strong> with WhatsApp, email, Google Analytics, and the marketing tools you already use.',
                li6: '<strong>SSL certificate and security best practices</strong> included by default.',
                h2Tipos: 'Project types',
                tiposIntro: 'Every business needs something different. These are the most common formats:',
                tipo1: '<strong>Landing page:</strong> a single page focused on one goal (capture leads, present a service, launch a product).',
                tipo2: '<strong>Corporate website:</strong> several pages (services, about us, contact, blog) for businesses that need a full presence.',
                tipo3: '<strong>Online store:</strong> catalog, cart, and checkout, with integrated payment gateway.',
                tipo4: '<strong>Booking website:</strong> availability calendar and automatic confirmation, ideal for restaurants, hotels, or appointment-based services.',
                h2Tech: 'Technologies',
                techP: 'We work with <strong>React</strong> and <strong>Next.js</strong> for websites that need speed and interactivity, and <strong>HTML/CSS and Tailwind</strong> for simpler projects that don\'t need more. The technology is chosen based on what your project needs, not the other way around.',
                h2Proceso: 'How we work',
                proc1Title: 'Consultation and goals', proc1Desc: 'We understand your business, your audience, and what you want the site to achieve.',
                proc2Title: 'Structure and content', proc2Desc: 'We define the pages, navigation, and what information goes on each one.',
                proc3Title: 'Visual design', proc3Desc: 'We create your brand\'s design: colors, typography, and imagery.',
                proc4Title: 'Development and testing', proc4Desc: 'We build the site and test it across devices and browsers.',
                proc5Title: 'Launch', proc5Desc: 'We publish, connect the domain, and verify everything works in production.',
                pricingTitle: 'Investment <span class="text-gradient">by website type</span>',
                pricingSubtitle: 'Indicative pricing. Every project gets a custom quote.',
                price1Title: 'Landing Page', price1Desc: 'A single page focused on a clear goal.',
                price1F1: 'Responsive design', price1F2: 'Basic SEO', price1F3: 'Contact form', price1F4: 'Delivered in 1-2 weeks',
                price2Title: 'Corporate Website', price2Desc: 'Up to 5 pages with an admin panel.',
                price2F1: 'Advanced SEO', price2F2: 'Admin panel', price2F3: 'Integrations (WhatsApp, Analytics)', price2F4: 'Delivered in 2-4 weeks',
                price3Title: 'Online Store', price3Desc: 'Catalog, cart, and payment gateway.',
                price3F1: 'Online payment checkout', price3F2: 'Product and order management', price3F3: 'Unlimited revisions', price3F4: '3 months of support',
                faq1Q: 'Are the domain and hosting included?',
                faq1A: 'We advise on and set up both, but they\'re registered in your name so you have full ownership, with no dependency on anyone else.',
                faq2Q: 'Can I edit the content myself afterward?',
                faq2A: 'Yes, we include a simple admin panel for text, images, and prices with no code required.',
                faq3Q: 'What if I need changes after launch?',
                faq3A: 'We include 30 days of free support. After that, you can take an optional monthly maintenance plan or request one-off changes.',
                faq4Q: 'Will the site be optimized for Google from the start?',
                faq4A: 'Yes. We apply baseline technical SEO (speed, metadata, structured data) on every project. If you need more, we have a <a href="servicio-seo.html">dedicated SEO and GEO service</a>.',
                ctaTitle: 'Ready to start your website?', ctaText: 'Tell us about your project and we\'ll send you a custom quote.', ctaBtn: 'Let\'s talk'
            },
            apps: {
                heroTitle: 'Custom <span class="text-gradient">Mobile</span> Apps',
                heroSubtitle: 'Native iOS and Android apps that deliver the best user experience, built to build loyalty or improve your internal processes.',
                intro: 'An app makes sense when your business needs something a website can\'t provide: notifications reaching the customer\'s phone, offline access, or a faster, smoother experience for daily use. Before writing any code, we help you decide whether you really need an app or a well-built website solves the same problem for less.',
                h2Incluye: 'What the service includes',
                li1: '<strong>UI/UX design</strong> built for mobile from the first sketch, not an adapted website.',
                li2: '<strong>iOS and Android development</strong> from a single codebase, faster and cheaper than building each platform separately.',
                li3: '<strong>Push notifications</strong> for alerts, promotions, or reminders.',
                li4: '<strong>Offline functionality</strong> when the connection fails or the user has no data.',
                li5: '<strong>Backend and real-time sync</strong> across devices.',
                li6: '<strong>Publishing on the App Store and Google Play</strong>, including managing developer accounts.',
                h2Casos: 'Common use cases',
                caso1: '<strong>Loyalty:</strong> points, booking, or ordering apps for restaurants, gyms, or hotels.',
                caso2: '<strong>Internal management:</strong> tools for your team to work from mobile (inventory, work logs, clock-in).',
                caso3: '<strong>Marketplace or delivery:</strong> apps connecting your business with customers in real time.',
                h2Tech: 'Technologies',
                techP: 'We use <strong>React Native</strong> to build iOS and Android from a single codebase, with <strong>Firebase</strong> for authentication, notifications, and real-time database, and <strong>Node.js</strong> when the project needs a custom backend.',
                h2Proceso: 'How we work',
                proc1Title: 'Consultation and validation', proc1Desc: 'We analyze whether an app is the best solution for your specific case.',
                proc2Title: 'Prototype', proc2Desc: 'We design the key screens to validate the flow before coding.',
                proc3Title: 'Development', proc3Desc: 'We build with weekly updates so you see real progress.',
                proc4Title: 'Testing on real devices', proc4Desc: 'We test on different phones before submitting for review.',
                proc5Title: 'Publishing', proc5Desc: 'We manage the review and publishing process on the App Store and Google Play.',
                pricingTitle: 'Investment <span class="text-gradient">by app type</span>',
                pricingSubtitle: 'Indicative pricing. Every project gets a custom quote.',
                price1Title: 'MVP', price1Desc: 'Initial version to validate your idea with real users.',
                price1F1: 'Essential features', price1F2: 'iOS and Android', price1F3: 'Store publishing',
                price2Title: 'Full App', price2Desc: 'Own backend, notifications, and real-time sync.',
                price2F1: 'Push notifications', price2F2: 'Offline functionality', price2F3: 'Admin panel', price2F4: '3 months of support',
                price3Title: 'Custom App + Backend', price3Desc: 'Marketplace, delivery, or platforms with complex logic.',
                price3F1: 'Scalable architecture', price3F2: 'Payment integrations', price3F3: 'Unlimited revisions',
                faq1Q: 'Do I need Apple and Google developer accounts?',
                faq1A: 'Yes, they\'re required to publish. We guide you through setting them up if you don\'t have them.',
                faq2Q: 'What happens if Apple or Google update their rules?',
                faq2A: 'We keep the app up to date with necessary updates during the included support period; after that, you can hire ongoing maintenance.',
                faq3Q: 'Why React Native instead of separate native apps?',
                faq3A: 'With a single codebase we cover iOS and Android, cutting time and cost without sacrificing performance or access to phone features.',
                faq4Q: 'Do I own the code and data?',
                faq4A: 'Yes. When finished we hand over all the source code and access. No hidden dependencies.',
                ctaTitle: 'Have an app idea?', ctaText: 'Tell us about your project and we\'ll assess together whether an app is the best option.', ctaBtn: 'Let\'s talk'
            },
            saas: {
                heroTitle: '<span class="text-gradient">SaaS</span> Platforms',
                heroSubtitle: 'A complete software-as-a-service product, with subscriptions, admin panel, and API, ready to scale.',
                intro: 'A SaaS (Software as a Service) is a product your customers pay for monthly: vertical software for your sector, an internal tool you decide to sell to other businesses, or a brand-new idea. Unlike a one-off website or app, a SaaS needs architecture built to grow: multiple customers, pricing plans, automatic billing, and a panel for you to control everything without touching code.',
                h2Incluye: 'What the service includes',
                li1: '<strong>Subscription system with Stripe:</strong> recurring billing, plans, free trials, and cancellations handled automatically.',
                li2: '<strong>Admin dashboard:</strong> for you (business metrics) and for your customers (their own usage panel).',
                li3: '<strong>User and role management:</strong> different permissions depending on account type.',
                li4: '<strong>Documented REST API</strong> so other systems can connect to your platform.',
                li5: '<strong>Multi-tenant architecture</strong> built to scale without rewriting the system every time it grows.',
                li6: '<strong>Cloud infrastructure</strong> with backups and monitoring.',
                h2Casos: 'Common use cases',
                caso1: '<strong>Vertical software:</strong> a management tool specific to a sector (gyms, clinics, real estate) that you sell by subscription.',
                caso2: '<strong>Internal product turned business:</strong> you automated something for your company and see other businesses need it too.',
                caso3: '<strong>Marketplace or booking platform</strong> with multiple providers and customers.',
                h2Tech: 'Technologies',
                techP: 'We build on <strong>Next.js</strong> for the frontend and API routes, <strong>PostgreSQL</strong> as a robust relational database, <strong>Stripe</strong> for the entire payment cycle, and <strong>AWS</strong> for infrastructure that scales with real user growth.',
                h2Proceso: 'How we work',
                proc1Title: 'Idea validation', proc1Desc: 'We define the business model, pricing plans, and must-have features.',
                proc2Title: 'MVP', proc2Desc: 'We build a first working version to validate with real users.',
                proc3Title: 'Iteration', proc3Desc: 'We adjust based on real feedback before investing in advanced features.',
                proc4Title: 'Scaling', proc4Desc: 'We reinforce infrastructure and add features as you grow.',
                pricingTitle: 'Investment <span class="text-gradient">by phase</span>',
                pricingSubtitle: 'Indicative pricing. Every SaaS gets a quote based on complexity.',
                price1Title: 'MVP', price1Desc: 'First working version to validate your idea.',
                price1F1: 'Essential features', price1F2: 'One subscription plan', price1F3: 'Basic admin panel',
                price2Title: 'Full Platform', price2Desc: 'Multiple plans, user roles, and API.',
                price2F1: 'Multiple pricing plans', price2F2: 'Metrics dashboard', price2F3: 'Documented REST API', price2F4: '3 months of support',
                price3Title: 'Custom', price3Desc: 'Complex architecture, multiple integrations, or high volume.',
                price3F1: 'Multi-tenant architecture', price3F2: 'Custom integrations', price3F3: 'Ongoing support',
                faq1Q: 'Do I own my SaaS code?',
                faq1A: 'Yes, 100%. We hand over all the source code and access; no lock-in with us.',
                faq2Q: 'Can it grow if I get a lot of customers?',
                faq2A: 'Yes, we design the architecture from the start with scaling in mind, and reinforce infrastructure as real growth demands.',
                faq3Q: 'Is maintenance included after launch?',
                faq3A: 'We include initial support after delivery. For a production SaaS, we recommend a monthly maintenance plan covering monitoring, security, and small improvements.',
                faq4Q: 'How long does it take to get an MVP ready?',
                faq4A: 'It depends on scope, but a working MVP usually takes 4 to 8 weeks.',
                ctaTitle: 'Have a SaaS idea?', ctaText: 'Tell us about your project and we\'ll help you define the fastest MVP to validate.', ctaBtn: 'Let\'s talk'
            },
            auto: {
                heroTitle: 'Process <span class="text-gradient">Automation</span>',
                heroSubtitle: 'Automate repetitive tasks and connect your tools. Save hours of manual work with smart workflows.',
                intro: 'Almost every business has tasks that repeat every day and don\'t require human judgment: copying data between systems, answering the same thing every time, generating the same report every week. Each of those tasks is time not spent growing your business. We automate those processes so they run on their own, reliably, without you having to remember to do them.',
                h2Incluye: 'What the service includes',
                li1: '<strong>WhatsApp and Telegram bots:</strong> answer frequent questions, generate quotes, or confirm bookings with no human involved.',
                li2: '<strong>Integration with any API:</strong> we connect the tools you already use (CRM, spreadsheets, invoicing, social media) so they talk to each other.',
                li3: '<strong>Workflows with n8n:</strong> visual flows that run several steps in a chain automatically and are easy to maintain.',
                li4: '<strong>Cross-platform sync:</strong> what you change in one system is automatically reflected in the others.',
                li5: '<strong>Automated reports:</strong> periodic reports generated and sent without anyone preparing them by hand.',
                h2Ejemplos: 'Real examples',
                ej1: '<strong>Automatic quotes:</strong> a customer writes on WhatsApp and gets a personalized quote instantly, 24/7.',
                ej2: '<strong>Booking sync:</strong> a booking on the website automatically updates the calendar, sends confirmation, and notifies the team.',
                ej3: '<strong>Alerts and tracking:</strong> automatic notices when something relevant happens (an order, low stock, a new form submission).',
                h2Tech: 'Technologies',
                techP: 'We use <strong>n8n</strong> to design visual workflows that are easy to maintain, <strong>Python</strong> for more complex logic, and work with the <strong>APIs and webhooks</strong> of the tools you already use so everything stays connected.',
                h2Proceso: 'How we work',
                proc1Title: 'Process mapping', proc1Desc: 'We analyze exactly which task you repeat and where the most time is lost.',
                proc2Title: 'Flow design', proc2Desc: 'We design the automation step by step, including what to do if something fails.',
                proc3Title: 'Implementation', proc3Desc: 'We connect the tools and test with real cases before turning it on.',
                proc4Title: 'Monitoring', proc4Desc: 'We monitor that it works correctly during the first weeks of real use.',
                pricingTitle: 'Investment <span class="text-gradient">by complexity</span>',
                pricingSubtitle: 'Indicative pricing. Every automation gets a custom quote.',
                price1Title: 'Simple Automation', price1Desc: 'One process, two tools connected.',
                price1F1: '1 workflow', price1F2: 'Integration with 1-2 APIs', price1F3: 'Delivered in 3-5 days',
                price2Title: 'Bot + Workflow', price2Desc: 'Conversational bot with logic and several integrations.',
                price2F1: 'WhatsApp or Telegram bot', price2F2: 'Several connected integrations', price2F3: 'Automated reports',
                price3Title: 'Automation Suite', price3Desc: 'Multiple automated processes and continuous monitoring.',
                price3F1: 'Multiple connected flows', price3F2: 'Monitoring and alerts', price3F3: 'Ongoing support',
                faq1Q: 'What if an external tool changes its API?',
                faq1A: 'We adjust the automation so it keeps working. That\'s why we recommend monthly maintenance for automations critical to your business.',
                faq2Q: 'Do I need technical knowledge to use it?',
                faq2A: 'No. Once implemented, it runs on its own. We explain how to check that everything\'s fine if you want.',
                faq3Q: 'Can I automate processes with AI?',
                faq3A: 'Yes, many automations combine with artificial intelligence (generated responses, data classification). Check out our <a href="servicio-ia.html">Secure AI service</a>.',
                faq4Q: 'How much time is usually saved?',
                faq4A: 'It depends on the process, but several clients report 5 to 10 hours a week recovered after automating repetitive tasks.',
                ctaTitle: 'What process do you want to automate?', ctaText: 'Tell us what task you repeat every week and we\'ll tell you how to automate it.', ctaBtn: 'Let\'s talk'
            },
            ai: {
                heroTitle: 'Secure <span class="text-gradient">AI</span> Implementation',
                heroSubtitle: 'We integrate artificial intelligence where it adds real value to your business, always protecting your data and your customers\' data.',
                intro: 'Implementing AI without care is easy and risky: connecting a chatbot to a generic model without thinking about what data it sees, who can access the conversations, or what happens if the model gets it wrong. Our approach is different: we first understand which process in your business truly benefits from AI, then we implement it with security controls built into the design, not bolted on afterward.',
                h2Incluye: 'What the service includes',
                li1: '<strong>24/7 chatbots and assistants</strong> trained on your own information (products, prices, policies), not generic answers.',
                li2: '<strong>Smart automation</strong> of tasks a person handles today: classifying messages, summarizing documents, drafting first-level replies.',
                li3: '<strong>Integration with ChatGPT, Claude</strong>, and the tools your team already uses, without rewriting your processes from scratch.',
                li4: '<strong>RAG (Retrieval-Augmented Generation):</strong> the assistant checks your real documents before answering, instead of making things up.',
                li5: '<strong>Encrypted data and access control:</strong> you decide who can see what, and your data isn\'t used to train third-party models without your consent.',
                h2Casos: 'Common use cases',
                caso1: '<strong>24/7 customer support:</strong> an assistant that answers frequent questions with your business\'s real information, escalating to a person when needed.',
                caso2: '<strong>Content generation:</strong> draft replies, product descriptions, or summaries a human reviews before publishing.',
                caso3: '<strong>Data analysis:</strong> extracting useful information from documents, surveys, or conversations no one has time to read today.',
                h2Seguridad: 'How we approach security',
                seguridadIntro: 'Security isn\'t a box we check at the end — it\'s part of the design:',
                seg1: 'We audit what data the model will see before connecting it to anything.',
                seg2: 'We use providers with clear data privacy agreements (no training on your conversations without permission).',
                seg3: 'We apply access control: each user only sees what applies to them.',
                seg4: 'We test the system to reduce "hallucinations" (made-up answers) before putting it into production.',
                h2Proceso: 'How we work',
                proc1Title: 'Data and process audit', proc1Desc: 'We identify which task to automate and what data the AI needs to see.',
                proc2Title: 'Assistant design', proc2Desc: 'We define behavior, limits, and what to do when it doesn\'t know how to answer.',
                proc3Title: 'Training on your data', proc3Desc: 'We connect your real information via RAG, without exposing it unnecessarily.',
                proc4Title: 'Security testing', proc4Desc: 'We verify access, privacy, and responses before launch.',
                proc5Title: 'Deployment and monitoring', proc5Desc: 'We launch and monitor real behavior during the first weeks.',
                pricingTitle: 'Investment <span class="text-gradient">by scope</span>',
                pricingSubtitle: 'Indicative pricing. Every implementation gets a custom quote.',
                price1Title: 'Simple Chatbot', price1Desc: 'Assistant with predefined answers about your business.',
                price1F1: 'Integrated into your website or WhatsApp', price1F2: 'Answers based on your information', price1F3: 'Delivered in 1-2 weeks',
                price2Title: 'Assistant with RAG', price2Desc: 'Checks your real documents before answering.',
                price2F1: 'Trained on your documentation', price2F2: 'Access control and privacy', price2F3: 'Escalates to a person when needed',
                price3Title: 'AI Automation', price3Desc: 'Complete processes automated with AI and integrations.',
                price3F1: 'Multiple AI-powered flows', price3F2: 'Custom integrations', price3F3: 'Ongoing monitoring',
                faq1Q: 'Is my data used to train third-party models?',
                faq1A: 'No. We work with providers who guarantee your conversations and documents aren\'t used to train their general models without your explicit consent.',
                faq2Q: 'Can I control what the AI answers?',
                faq2A: 'Yes. We define clear limits: topics it can cover, when it should hand off to a person, and what tone to use — all reviewable by you.',
                faq3Q: 'How do you prevent the AI from making up answers?',
                faq3A: 'By using RAG: the assistant searches your real documentation before answering instead of generating the answer purely from general knowledge. We also test edge cases before launch.',
                faq4Q: 'Is this related to appearing on ChatGPT or Claude as a business?',
                faq4A: 'It\'s a different but complementary service: if you want AI to <em>recommend you</em> to third parties, that\'s <a href="servicio-seo.html">SEO and GEO positioning</a>. This is about implementing AI <em>within</em> your own business.',
                ctaTitle: 'Want to implement AI in your business?', ctaText: 'Tell us what process you\'d like to automate and we\'ll assess the safest approach together.', ctaBtn: 'Let\'s talk'
            },
            seo: {
                heroTitle: 'SEO & GEO <span class="text-gradient">Positioning</span>',
                heroSubtitle: 'We optimize your site so people find you: both on Google and on the new AI searches like ChatGPT, Claude, and Perplexity.',
                intro: 'Ranking on Google isn\'t enough anymore. <strong>40% of searches now start on an AI</strong> like ChatGPT, Claude, or Perplexity, and only 1% of businesses in Andorra optimize their presence for that channel. We work both fronts at once: traditional SEO, still essential for Google, and GEO (Generative Engine Optimization), the new channel with far less competition — for now.',
                h2Incluye: 'What the service includes',
                li1: '<strong>Technical and content SEO audit:</strong> we check speed, structure, keywords, and what\'s missing for your site to rank better.',
                li2: '<strong>Core Web Vitals and loading speed:</strong> we optimize what Google measures to decide your ranking position.',
                li3: '<strong>Structured data (schema.org):</strong> so search engines and AI models understand exactly what you offer.',
                li4: '<strong>AI visibility audit:</strong> we test dozens of real questions on ChatGPT, Claude, and Perplexity to see if your business shows up today.',
                li5: '<strong><code>llms.txt</code> implementation:</strong> the emerging standard that gives AI crawlers organized information about your business.',
                li6: '<strong>Results tracking:</strong> ongoing monitoring of Google rankings and mentions in AI responses.',
                h2Complementan: 'SEO and GEO aren\'t the same thing, but they complement each other',
                complementanP: 'SEO remains essential: Google isn\'t going anywhere and is still the gateway for millions of searches. GEO doesn\'t replace it, it complements it: it optimizes your presence so language models recognize you as a reliable source and recommend you when asked. Both reinforce each other: well-structured content helps on both fronts at once.',
                blogLink: 'If you want to understand GEO in detail, we have a <a href="blog-posicionamiento-ia.html">full guide on the blog</a>.',
                h2Proceso: 'How we work',
                proc1Title: 'Initial audit', proc1Desc: 'We analyze your current Google position and your visibility on the main AIs.',
                proc2Title: 'Action plan', proc2Desc: 'We prioritize the highest-impact improvements: technical, content, and structured data.',
                proc3Title: 'Implementation', proc3Desc: 'We apply the technical fixes, schema.org, llms.txt, and optimized content.',
                proc4Title: 'Monitoring', proc4Desc: 'Monthly tracking of Google rankings and mentions in AI responses.',
                pricingTitle: 'Investment <span class="text-gradient">in visibility</span>',
                pricingSubtitle: 'Indicative pricing. Monthly tracking is optional.',
                perOnce: ' / one-time', perMonth: '/month',
                price1Title: 'SEO + GEO Audit', price1Desc: 'Full diagnosis of your current situation.',
                price1F1: 'Technical and content audit', price1F2: 'AI visibility test', price1F3: 'Report with action plan',
                price2Title: 'Full Implementation', price2Desc: 'Audit + applying all the improvements.',
                price2F1: 'Core Web Vitals and schema.org', price2F2: 'llms.txt implementation', price2F3: 'AI-optimized content',
                price3Title: 'Monthly Tracking', price3Desc: 'Continuous monitoring and monthly adjustments.',
                price3F1: 'Ranking tracking', price3F2: 'AI mention tracking', price3F3: 'Monthly report',
                faq1Q: 'How long does it take to see results?',
                faq1A: 'On Perplexity and ChatGPT with web browsing, changes can show up within weeks. In the models\' base knowledge (no browsing), it depends on the retraining cycle and can take months. Google SEO usually takes 1 to 3 months to show.',
                faq2Q: 'Does GEO replace SEO?',
                faq2A: 'No. They complement each other. SEO remains key for Google; GEO covers the emerging channel of AI assistants. Working on both at once strengthens your presence on each.',
                faq3Q: 'How is GEO success measured?',
                faq3A: 'We periodically test real questions from your sector on ChatGPT, Claude, and Perplexity, and measure whether you\'re mentioned, at what position, and in what tone.',
                faq4Q: 'Can I control what AI says about my business?',
                faq4A: 'Not directly, but you can influence it significantly: a consistent, positive, well-structured online presence is what the models reflect in their answers.',
                ctaTitle: 'Do you know if AI already recommends you?', ctaText: 'We\'ll do a free AI positioning audit, no strings attached.', ctaBtn: 'Request free audit'
            }
        },
        chatbot: {
            label: 'AI Assistant',
            title: 'AI Assistant · SaeTech',
            subtitle: 'Ask me about our services and pricing.',
            welcome: 'Hi! I\'m SaeTech\'s virtual assistant. Ask me anything about our services, pricing, or how we work.',
            placeholder: 'Type your question...',
            send: 'Send',
            error: 'Oops, something went wrong. Try again or message us on WhatsApp.',
            typing: 'Typing…',
            disclaimer: 'AI-powered assistant (Claude). Responses may contain errors.'
        },
        }
};

let currentLang = localStorage.getItem('lang') || 'es';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);

    // Update active state in dropdown
    document.querySelectorAll('.lang-dropdown-content button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Update displayed language code
    const currentLangEl = document.getElementById('currentLang');
    if (currentLangEl) {
        currentLangEl.textContent = lang.toUpperCase();
    }

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const keys = key.split('.');
        let value = translations[lang];
        keys.forEach(k => value = value?.[k]);
        if (value) el.innerHTML = value;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        const keys = key.split('.');
        let value = translations[lang];
        keys.forEach(k => value = value?.[k]);
        if (value) el.placeholder = value;
    });

    document.dispatchEvent(new Event('languagechange-app'));
}

function initLanguage() {
    const dropdown = document.getElementById('langDropdown');
    const dropBtn = document.getElementById('langDropBtn');

    if (dropBtn && dropdown) {
        dropBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            dropdown.classList.remove('active');
        });
    }

    document.querySelectorAll('.lang-dropdown-content button').forEach(btn => {
        btn.addEventListener('click', () => {
            setLanguage(btn.dataset.lang);
            if (dropdown) dropdown.classList.remove('active');
        });
    });

    setLanguage(currentLang);
}

// ===========================
// Init Everything
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');

    // Pause initial animations regardless of path
    document.querySelectorAll('.animate-in').forEach(el => {
        el.style.animationPlayState = 'paused';
    });

    if (isNFCVisit()) {
        // Hide regular loader instantly — no flash
        if (loader) loader.style.display = 'none';
        initNFCWelcome();
    } else {
        if (loader) document.body.style.overflow = 'hidden';
        initLoader();
    }

    // Init cursor
    initCursor();

    // Particles — skip entirely for users who prefer reduced motion.
    const canvas = document.getElementById('particleCanvas');
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (canvas && !reduceMotion) {
        new ParticleSystem(canvas);
    } else if (canvas) {
        canvas.style.display = 'none';
    }

    // Init other effects
    initParallax();
    initMagneticButtons();
    initNavbar();
    initScrollReveal();
    animateCounters();
    initSmoothScroll();
    initFAQ();
    initAnalytics();

    // New features
    initScrollProgress();
    initBackToTop();
    initChatbot();
    initWhatsAppFloatVisibility();
    initEmailPopup();
    initLanguage();

    // Register Service Worker
    registerServiceWorker();
});
