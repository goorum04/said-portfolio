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

        document.querySelectorAll('.animate-in').forEach((el, i) => {
            el.style.animationPlayState = 'running';
        });
    }, 2500);
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
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.trails = [];
        this.mouse = { x: null, y: null, radius: 200 };
        this.particleCount = 100;
        this.connectionDistance = 150;
        this.colors = ['#00d4ff', '#7c3aed', '#ec4899', '#22c55e'];

        this.resize();
        this.init();
        this.bindEvents();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                radius: Math.random() * 2.5 + 0.5,
                opacity: Math.random() * 0.6 + 0.2,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
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
                this.trails.push({
                    x: e.clientX,
                    y: e.clientY,
                    life: 1,
                    color: this.colors[Math.floor(Math.random() * this.colors.length)]
                });
            }
        });

        window.addEventListener('mouseout', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    animate() {
        this.ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw and update trails
        this.trails = this.trails.filter(t => {
            t.life -= 0.02;
            if (t.life <= 0) return false;

            this.ctx.beginPath();
            this.ctx.arc(t.x, t.y, 3 * t.life, 0, Math.PI * 2);
            this.ctx.fillStyle = t.color.replace(')', `, ${t.life * 0.5})`).replace('rgb', 'rgba').replace('#', 'rgba(');

            // Convert hex to rgba
            const hex = t.color;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${t.life * 0.5})`;
            this.ctx.fill();

            return true;
        });

        this.particles.forEach((p, i) => {
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

                    // Create swirl effect
                    p.vx += Math.cos(angle + Math.PI / 2) * force * 0.02;
                    p.vy += Math.sin(angle + Math.PI / 2) * force * 0.02;

                    // Limit velocity
                    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                    if (speed > 3) {
                        p.vx = (p.vx / speed) * 3;
                        p.vy = (p.vy / speed) * 3;
                    }
                }
            }

            // Draw particle with glow
            const hex = p.color;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);

            // Glow effect
            const gradient = this.ctx.createRadialGradient(
                p.x, p.y, 0,
                p.x, p.y, p.radius * pulseScale * 3
            );
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${p.opacity})`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius * pulseScale * 3, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // Core
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius * pulseScale, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity})`;
            this.ctx.fill();

            // Connect with gradient lines
            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.connectionDistance) {
                    const opacity = (1 - dist / this.connectionDistance) * 0.25;

                    // Create gradient line
                    const lineGradient = this.ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
                    lineGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacity})`);

                    const hex2 = p2.color;
                    const r2 = parseInt(hex2.slice(1, 3), 16);
                    const g2 = parseInt(hex2.slice(3, 5), 16);
                    const b2 = parseInt(hex2.slice(5, 7), 16);
                    lineGradient.addColorStop(1, `rgba(${r2}, ${g2}, ${b2}, ${opacity})`);

                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = lineGradient;
                    this.ctx.lineWidth = opacity * 2;
                    this.ctx.stroke();
                }
            }
        });

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
            navigator.serviceWorker.register('/sw.js')
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
        nav: { services: 'Servicios', portfolio: 'Portfolio', blog: 'Blog', about: 'Sobre mí', contact: 'Contacto' },
        hero: {
            badge: 'Disponible para proyectos',
            greeting: 'Hola, soy',
            subtitle: 'Transformo ideas en <span class="text-gradient">experiencias digitales</span> que impulsan tu negocio.',
            description: 'Desarrollo de Apps · Páginas Web · Automatizaciones · SaaS',
            cta1: 'Pedir Presupuesto',
            cta2: 'Ver Proyectos'
        },
        stats: { projects: 'Proyectos', satisfaction: 'Satisfacción', sectors: 'Sectores' },
        trust: {
            tag: 'Garantías',
            title: 'Por qué <span class="text-gradient">confiar en mí</span>',
            card1: { title: 'Satisfacción garantizada', desc: 'No pagas hasta que estés 100% satisfecho con el resultado.' },
            card2: { title: 'Entrega rápida', desc: 'Plazos realistas que cumplo. Sin sorpresas ni retrasos.' },
            card3: { title: 'Soporte incluido', desc: '30 días de soporte gratuito después del lanzamiento.' },
            card4: { title: 'Comunicación directa', desc: 'Hablo contigo directamente. Sin intermediarios.' }
        },
        pricing: {
            tag: 'Precios',
            title: 'Inversión <span class="text-gradient">transparente</span>',
            subtitle: 'Precios orientativos. Cada proyecto es único.',
            basic: { name: 'Básico', title: 'Landing Page', price: '500€', desc: 'Perfecto para empezar tu presencia digital.' },
            pro: { name: 'Profesional', title: 'Web / App', price: '1.500€', desc: 'Para negocios que necesitan más funcionalidades.' },
            premium: { name: 'Premium', title: 'SaaS / Plataforma', price: '2.000€', desc: 'Soluciones completas a medida.' },
            cta: 'Solicitar presupuesto'
        },
        cta: { title: '¿Tienes un proyecto en mente?', desc: 'Cuéntame tu idea y te ayudo a hacerla realidad.', btn: 'Hablemos' }
    },
    ca: {
        nav: { services: 'Serveis', portfolio: 'Portfolio', blog: 'Blog', about: 'Sobre mi', contact: 'Contacte' },
        hero: {
            badge: 'Disponible per a projectes',
            greeting: 'Hola, sóc',
            subtitle: 'Transformo idees en <span class="text-gradient">experiències digitals</span> que impulsen el teu negoci.',
            description: 'Desenvolupament d\'Apps · Pàgines Web · Automatitzacions · SaaS',
            cta1: 'Demanar Pressupost',
            cta2: 'Veure Projectes'
        },
        stats: { projects: 'Projectes', satisfaction: 'Satisfacció', sectors: 'Sectors' },
        trust: {
            tag: 'Garanties',
            title: 'Per què <span class="text-gradient">confiar en mi</span>',
            card1: { title: 'Satisfacció garantida', desc: 'No pagues fins que estiguis 100% satisfet amb el resultat.' },
            card2: { title: 'Lliurament ràpid', desc: 'Terminis realistes que compleixo. Sense sorpreses ni retards.' },
            card3: { title: 'Suport inclòs', desc: '30 dies de suport gratuït després del llançament.' },
            card4: { title: 'Comunicació directa', desc: 'Parlo amb tu directament. Sense intermediaris.' }
        },
        pricing: {
            tag: 'Preus',
            title: 'Inversió <span class="text-gradient">transparent</span>',
            subtitle: 'Preus orientatius. Cada projecte és únic.',
            basic: { name: 'Bàsic', title: 'Landing Page', price: '500€', desc: 'Perfecte per començar la teva presència digital.' },
            pro: { name: 'Professional', title: 'Web / App', price: '1.500€', desc: 'Per a negocis que necessiten més funcionalitats.' },
            premium: { name: 'Premium', title: 'SaaS / Plataforma', price: '2.000€', desc: 'Solucions completes a mida.' },
            cta: 'Sol·licitar pressupost'
        },
        cta: { title: 'Tens un projecte en ment?', desc: 'Explica\'m la teva idea i t\'ajudo a fer-la realitat.', btn: 'Parlem' }
    },
    fr: {
        nav: { services: 'Services', portfolio: 'Portfolio', blog: 'Blog', about: 'À propos', contact: 'Contact' },
        hero: {
            badge: 'Disponible pour projets',
            greeting: 'Salut, je suis',
            subtitle: 'Je transforme les idées en <span class="text-gradient">expériences numériques</span> qui boostent votre entreprise.',
            description: 'Développement d\'Apps · Sites Web · Automatisations · SaaS',
            cta1: 'Demander un devis',
            cta2: 'Voir les projets'
        },
        stats: { projects: 'Projets', satisfaction: 'Satisfaction', sectors: 'Secteurs' },
        trust: {
            tag: 'Garanties',
            title: 'Pourquoi <span class="text-gradient">me faire confiance</span>',
            card1: { title: 'Satisfaction garantie', desc: 'Vous ne payez pas jusqu\'à être 100% satisfait du résultat.' },
            card2: { title: 'Livraison rapide', desc: 'Des délais réalistes que je respecte. Sans surprises ni retards.' },
            card3: { title: 'Support inclus', desc: '30 jours de support gratuit après le lancement.' },
            card4: { title: 'Communication directe', desc: 'Je vous parle directement. Sans intermédiaires.' }
        },
        pricing: {
            tag: 'Prix',
            title: 'Investissement <span class="text-gradient">transparent</span>',
            subtitle: 'Prix indicatifs. Chaque projet est unique.',
            basic: { name: 'Basique', title: 'Landing Page', price: '500€', desc: 'Parfait pour commencer votre présence numérique.' },
            pro: { name: 'Professionnel', title: 'Web / App', price: '1.500€', desc: 'Pour les entreprises qui ont besoin de plus de fonctionnalités.' },
            premium: { name: 'Premium', title: 'SaaS / Plateforme', price: '2.000€', desc: 'Solutions complètes sur mesure.' },
            cta: 'Demander un devis'
        },
        cta: { title: 'Vous avez un projet en tête?', desc: 'Racontez-moi votre idée et je vous aide à la concrétiser.', btn: 'Parlons' }
    },
    en: {
        nav: { services: 'Services', portfolio: 'Portfolio', blog: 'Blog', about: 'About', contact: 'Contact' },
        hero: {
            badge: 'Available for projects',
            greeting: 'Hi, I\'m',
            subtitle: 'I transform ideas into <span class="text-gradient">digital experiences</span> that boost your business.',
            description: 'App Development · Websites · Automations · SaaS',
            cta1: 'Get a Quote',
            cta2: 'View Projects'
        },
        stats: { projects: 'Projects', satisfaction: 'Satisfaction', sectors: 'Sectors' },
        trust: {
            tag: 'Guarantees',
            title: 'Why <span class="text-gradient">trust me</span>',
            card1: { title: 'Satisfaction guaranteed', desc: 'You don\'t pay until you\'re 100% satisfied with the result.' },
            card2: { title: 'Fast delivery', desc: 'Realistic deadlines that I meet. No surprises or delays.' },
            card3: { title: 'Support included', desc: '30 days of free support after launch.' },
            card4: { title: 'Direct communication', desc: 'I speak with you directly. No intermediaries.' }
        },
        pricing: {
            tag: 'Pricing',
            title: 'Transparent <span class="text-gradient">investment</span>',
            subtitle: 'Indicative prices. Each project is unique.',
            basic: { name: 'Basic', title: 'Landing Page', price: '500€', desc: 'Perfect to start your digital presence.' },
            pro: { name: 'Professional', title: 'Web / App', price: '1.500€', desc: 'For businesses that need more features.' },
            premium: { name: 'Premium', title: 'SaaS / Platform', price: '2.000€', desc: 'Complete custom solutions.' },
            cta: 'Request quote'
        },
        cta: { title: 'Have a project in mind?', desc: 'Tell me your idea and I\'ll help you make it happen.', btn: 'Let\'s talk' }
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

    // Particles
    const canvas = document.getElementById('particleCanvas');
    if (canvas) {
        new ParticleSystem(canvas);
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
