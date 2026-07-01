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
    initEmailPopup();
    initLanguage();

    // Register Service Worker
    registerServiceWorker();
});
