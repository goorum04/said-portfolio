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

    /* ─── INIT ON DOM READY ─── */
    function init() {
        initTilt();
        initOrbParallax();
        initBadgePulse();
        initRevealEnhancement();
        initCtaSpotlight();
        initNavHighlight();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
