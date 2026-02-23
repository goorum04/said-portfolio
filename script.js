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
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;

        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    // Mobile toggle
    const toggle = document.getElementById('navToggle');
    const navLinks = document.querySelector('.nav-links');

    if (toggle) {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });

        // Close on link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                toggle.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
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
// Init Everything
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    // Init loader (handles scroll lock internally)
    initLoader();
    
    // Pause initial animations
    document.querySelectorAll('.animate-in').forEach(el => {
        el.style.animationPlayState = 'paused';
    });
    
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
    
    // Register Service Worker
    registerServiceWorker();
});
