document.addEventListener('DOMContentLoaded', () => {
    // ─── DOM References ───────────────────────────────────────────────────────
    const navLinks        = document.querySelectorAll('.nav-link');
    const views           = document.querySelectorAll('.view-section');
    const mobileMenuBtn   = document.getElementById('mobile-menu-btn');
    const mobileMenu      = document.getElementById('mobile-menu');
    const navbar          = document.getElementById('navbar');
    const navbarNavLinks  = navbar.querySelectorAll('.nav-link[data-target]:not(.nav-logo)');

    // ─── Routing Map ─────────────────────────────────────────────────────────
    const routes = {
        home:      'index.html',
        services:  'services.html',
        portfolio: 'portfolio.html',
        about:     'about.html',
        contact:   'index.html?view=contact'
    };

    const pageToView = {
        'index.html':     'home',
        'services.html':  'services',
        'portfolio.html': 'portfolio',
        'about.html':     'about',
        'privacy.html':   null,
        'tos.html':       null
    };

    // ─── Active Nav Highlight ─────────────────────────────────────────────────
    function syncActiveNav(targetId) {
        navbarNavLinks.forEach((link) => {
            const linkTarget = link.getAttribute('data-target');
            link.classList.toggle('is-active', linkTarget === targetId);
        });
    }

    // ─── View Switcher ────────────────────────────────────────────────────────
    function switchView(targetId, skipScroll = false) {
        views.forEach(view => {
            view.classList.remove('active');
            view.style.display = 'none';
        });

        const targetView = document.getElementById(`view-${targetId}`);
        if (targetView) {
            targetView.style.display = 'block';
            setTimeout(() => targetView.classList.add('active'), 10);
        }

        mobileMenu.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
        syncActiveNav(targetId);
        if (!skipScroll) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // ─── Nav Link Click Handler ───────────────────────────────────────────────
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            if (!target) return;

            // If target view exists on this page, switch locally
            const localView = document.getElementById(`view-${target}`);
            if (localView) {
                switchView(target);
                return;
            }

            // Otherwise navigate to the correct page
            if (routes[target]) {
                syncActiveNav(target);
                mobileMenu.classList.add('hidden');
                document.body.classList.remove('overflow-hidden');
                window.location.href = routes[target];
                return;
            }

            switchView(target);
        });
    });

    // ─── Initial View Detection ───────────────────────────────────────────────
    const params      = new URLSearchParams(window.location.search);
    const requestedView = params.get('view');
    const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const initialView = requestedView || pageToView[currentPage] || 'home';

    if (initialView) {
        switchView(initialView, true);
    }

    // ─── Scroll Reveal + 3D Tilt ─────────────────────────────────────────────
    function initMotionEffects() {
        const revealTargets = document.querySelectorAll(
            'section, .rounded-2xl, .rounded-xl, .rounded-lg, .group'
        );

        revealTargets.forEach((el, index) => {
            el.classList.add('reveal-item');
            if (el.matches('.rounded-2xl, .rounded-xl, .rounded-lg, .group')) {
                el.classList.add('tilt-hover', 'glow-soft');
            }
            el.style.transitionDelay = `${Math.min(index * 40, 380)}ms`;
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });

        revealTargets.forEach((el) => observer.observe(el));
    }

    initMotionEffects();

    // ─── Pricing Cards Auto-Scroll (mobile) ───────────────────────────────────
    function initPricingAutoScroll() {
        const pricingSection = document.getElementById('pricing-preview-section');
        const pricingTrack   = document.getElementById('pricing-cards-track');
        if (!pricingSection || !pricingTrack) return;

        let intervalId  = null;
        let resumeTimer = null;
        let direction   = 1;
        let running     = false;
        const stepSize  = 1;
        const intervalMs = 22;

        function isInViewport(el) {
            const rect = el.getBoundingClientRect();
            const vh   = window.innerHeight || document.documentElement.clientHeight;
            return rect.top < vh * 0.9 && rect.bottom > vh * 0.12;
        }

        function hasOverflow() {
            return pricingTrack.scrollWidth - pricingTrack.clientWidth > 1;
        }

        function isMobileLikeViewport() {
            return window.matchMedia('(max-width: 1024px)').matches ||
                   window.matchMedia('(pointer: coarse)').matches ||
                   navigator.maxTouchPoints > 0;
        }

        function canRun() {
            return isMobileLikeViewport() && hasOverflow() && !document.hidden;
        }

        function tick() {
            if (!running) return;
            const maxScroll = pricingTrack.scrollWidth - pricingTrack.clientWidth;
            if (maxScroll <= 0) { stop(); return; }

            let nextLeft = pricingTrack.scrollLeft + stepSize * direction;
            if (nextLeft >= maxScroll) { nextLeft = maxScroll; direction = -1; }
            if (nextLeft <= 0)         { nextLeft = 0;          direction =  1; }
            pricingTrack.scrollLeft = nextLeft;
        }

        function start() {
            if (running || !canRun()) return;
            running    = true;
            intervalId = setInterval(tick, intervalMs);
        }

        function stop() {
            running = false;
            if (intervalId) { clearInterval(intervalId); intervalId = null; }
        }

        function pauseAndResume(delay = 1200) {
            stop();
            if (resumeTimer) clearTimeout(resumeTimer);
            resumeTimer = setTimeout(() => { if (canRun()) start(); }, delay);
        }

        const syncAutoScrollState = () => { if (canRun()) start(); else stop(); };

        if ('IntersectionObserver' in window) {
            const sectionObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => { if (entry.isIntersecting) syncAutoScrollState(); });
            }, { threshold: 0.01, rootMargin: '80px 0px 80px 0px' });
            sectionObserver.observe(pricingSection);
        }

        window.addEventListener('scroll',           () => { if (isInViewport(pricingSection)) syncAutoScrollState(); }, { passive: true });
        window.addEventListener('resize',           syncAutoScrollState);
        document.addEventListener('visibilitychange', () => { document.hidden ? stop() : syncAutoScrollState(); });

        pricingTrack.addEventListener('touchstart',  () => pauseAndResume(1400), { passive: true });
        pricingTrack.addEventListener('touchmove',   () => pauseAndResume(1400), { passive: true });
        pricingTrack.addEventListener('touchend',    () => pauseAndResume(800),  { passive: true });
        pricingTrack.addEventListener('touchcancel', () => pauseAndResume(800),  { passive: true });

        syncAutoScrollState();
        setTimeout(syncAutoScrollState, 250);
        setTimeout(syncAutoScrollState, 800);
    }

    initPricingAutoScroll();

    // ─── Mobile Menu ──────────────────────────────────────────────────────────
    mobileMenuBtn.addEventListener('click', () => {
        const isHidden = mobileMenu.classList.toggle('hidden');
        document.body.classList.toggle('overflow-hidden', !isHidden);
        mobileMenuBtn.setAttribute('aria-expanded', !isHidden);
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            mobileMenu.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            mobileMenu.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }
    });

    // ─── Navbar Shadow on Scroll ──────────────────────────────────────────────
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('shadow-sm', window.scrollY > 10);
    });

    // ─── Portfolio Filter ─────────────────────────────────────────────────────
    function initPortfolioFilter() {
        const filterBtns = document.querySelectorAll('[data-filter]');
        const portfolioCards = document.querySelectorAll('[data-plan]');
        if (!filterBtns.length || !portfolioCards.length) return;

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');

                // Update active button styles
                filterBtns.forEach(b => {
                    b.classList.remove('bg-brand-dark', 'text-white');
                    b.classList.add('bg-gray-100', 'text-gray-700');
                });
                btn.classList.remove('bg-gray-100', 'text-gray-700');
                btn.classList.add('bg-brand-dark', 'text-white');

                // Filter cards
                portfolioCards.forEach(card => {
                    if (filter === 'all' || card.getAttribute('data-plan') === filter) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    initPortfolioFilter();
});
