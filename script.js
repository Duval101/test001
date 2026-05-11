/* ============================================================
   script.js — David Atwood Portfolio
   Plain JS, no frameworks, no dependencies.
============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     1. NAV — SCROLL STATE & ACTIVE LINK HIGHLIGHTING
  ---------------------------------------------------------- */
  const navbar   = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-links a');

  // Add "scrolled" class to navbar after user scrolls past hero
  function handleNavScroll() {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  // Determine which section is currently in view and mark its nav link active
  function updateActiveNavLink() {
    // Collect all sections that have a matching nav link
    const sections = Array.from(navLinks)
      .map(link => {
        const id = link.getAttribute('href').replace('#', '');
        return document.getElementById(id);
      })
      .filter(Boolean);

    let currentId = '';
    const scrollMid = window.scrollY + window.innerHeight * 0.4;

    sections.forEach(section => {
      if (section.offsetTop <= scrollMid) {
        currentId = section.id;
      }
    });

    navLinks.forEach(link => {
      const linkTarget = link.getAttribute('href').replace('#', '');
      if (linkTarget === currentId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', () => {
    handleNavScroll();
    updateActiveNavLink();
  }, { passive: true });

  // Run once on load to initialise correct state
  handleNavScroll();
  updateActiveNavLink();


  /* ----------------------------------------------------------
     2. MOBILE NAV TOGGLE
  ---------------------------------------------------------- */
  const navToggleBtn  = document.getElementById('navToggle');
  const navLinksMenu  = document.getElementById('navLinks');

  navToggleBtn.addEventListener('click', () => {
    const isOpen = navLinksMenu.classList.toggle('open');
    navToggleBtn.classList.toggle('open', isOpen);
    navToggleBtn.setAttribute('aria-expanded', isOpen);
  });

  // Close mobile menu when a link is clicked
  navLinksMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinksMenu.classList.remove('open');
      navToggleBtn.classList.remove('open');
      navToggleBtn.setAttribute('aria-expanded', 'false');
    });
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (
      navLinksMenu.classList.contains('open') &&
      !navLinksMenu.contains(e.target) &&
      !navToggleBtn.contains(e.target)
    ) {
      navLinksMenu.classList.remove('open');
      navToggleBtn.classList.remove('open');
      navToggleBtn.setAttribute('aria-expanded', 'false');
    }
  });


  /* ----------------------------------------------------------
     3. SCROLL-REVEAL (IntersectionObserver)
  ---------------------------------------------------------- */
  const revealElements = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            // Stagger sibling reveals that fire at the same time
            const siblings = Array.from(
              entry.target.parentElement.querySelectorAll('.reveal:not(.visible)')
            );
            const siblingIndex = siblings.indexOf(entry.target);
            const delay = siblingIndex >= 0 ? Math.min(siblingIndex * 80, 400) : 0;

            setTimeout(() => {
              entry.target.classList.add('visible');
            }, delay);

            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -60px 0px', // trigger slightly before element fully enters viewport
        threshold: 0.08
      }
    );

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback: just show everything immediately if IntersectionObserver not supported
    revealElements.forEach(el => el.classList.add('visible'));
  }


  /* ----------------------------------------------------------
     4. HERO — IMMEDIATE REVEAL (no delay for above-the-fold)
  ---------------------------------------------------------- */
  const heroReveal = document.querySelector('#hero .reveal');
  if (heroReveal) {
    // Fire after a short mount delay so the CSS transition is visible
    setTimeout(() => {
      heroReveal.classList.add('visible');
    }, 150);
  }


  /* ----------------------------------------------------------
     5. SMOOTH SCROLL — polyfill for older browsers (fallback)
     Modern browsers respect `scroll-behavior: smooth` in CSS.
     This JS version handles edge cases and ensures consistent
     behaviour when clicking nav links.
  ---------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const navH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-height'),
        10
      ) || 68;

      const targetTop = target.getBoundingClientRect().top + window.scrollY - navH;

      window.scrollTo({
        top: targetTop,
        behavior: 'smooth'
      });
    });
  });


  /* ----------------------------------------------------------
     6. OPTIONAL: TYPING / CURSOR EFFECT ON HERO TITLE
     Adds a subtle blinking cursor after the hero tagline to
     give the hero section a bit of extra life.
  ---------------------------------------------------------- */
  const tagline = document.querySelector('.hero-tagline');
  if (tagline) {
    const cursor = document.createElement('span');
    cursor.textContent = '|';
    cursor.style.cssText = [
      'display:inline-block',
      'margin-left:2px',
      'color:#a855f7',
      'font-weight:300',
      'animation:blink 1.1s step-end infinite',
      'opacity:0.7'
    ].join(';');

    // Inject keyframe if not already present
    if (!document.getElementById('blinkKeyframes')) {
      const style = document.createElement('style');
      style.id = 'blinkKeyframes';
      style.textContent = '@keyframes blink { 0%,100%{opacity:0.7} 50%{opacity:0} }';
      document.head.appendChild(style);
    }

    tagline.appendChild(cursor);

    // Remove cursor after 6 seconds — it's done its job
    setTimeout(() => {
      cursor.style.transition = 'opacity 1s ease';
      cursor.style.opacity = '0';
      setTimeout(() => cursor.remove(), 1000);
    }, 6000);
  }


  /* ----------------------------------------------------------
     7. STAT COUNTER ANIMATION
     Animates the number inside .stat-number when it scrolls
     into view. Numbers are extracted from the DOM text.
  ---------------------------------------------------------- */
  const statNumbers = document.querySelectorAll('.stat-number');

  function animateCounter(el) {
    const rawText = el.textContent.trim();
    // Extract numeric value and any suffix (e.g. "10+" -> 10, "+")
    const match = rawText.match(/^(\d+)(.*)$/);
    if (!match) return;

    const target   = parseInt(match[1], 10);
    const suffix   = match[2] || '';
    const duration = 1200; // ms
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed  = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = Math.round(eased * target);

      el.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    statNumbers.forEach(el => counterObserver.observe(el));
  }


  /* ----------------------------------------------------------
     8. ACTIVE SECTION INDICATOR — progress bar
     A thin gradient progress bar at the top of the viewport
     shows how far down the page the user has scrolled.
  ---------------------------------------------------------- */
  const progressBar = document.createElement('div');
  progressBar.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'width:0%',
    'height:2px',
    'z-index:9999',
    'background:linear-gradient(90deg,#00b4ff,#a855f7,#f72585)',
    'transition:width 0.1s linear',
    'pointer-events:none'
  ].join(';');
  document.body.prepend(progressBar);

  function updateProgressBar() {
    const scrollTop    = window.scrollY;
    const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = scrollPercent.toFixed(2) + '%';
  }

  window.addEventListener('scroll', updateProgressBar, { passive: true });
  updateProgressBar();


  /* ----------------------------------------------------------
     9. EXTRON CERTIFICATIONS MODAL
  ---------------------------------------------------------- */
  const extronCard   = document.getElementById('extronCard');
  const extronModal  = document.getElementById('extronModal');
  const extronClose  = document.getElementById('extronModalClose');

  function openExtronModal() {
    extronModal.removeAttribute('hidden');
    extronModal.offsetHeight; // force reflow so opacity:0 is painted before transitioning
    extronModal.classList.add('modal-visible');
    extronClose.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeExtronModal() {
    extronModal.classList.remove('modal-visible');
    extronModal.addEventListener('transitionend', () => {
      extronModal.setAttribute('hidden', '');
      document.body.style.overflow = '';
    }, { once: true });
    extronCard.focus();
  }

  extronCard.addEventListener('click', openExtronModal);
  extronCard.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openExtronModal(); }
  });

  extronClose.addEventListener('click', closeExtronModal);

  extronModal.addEventListener('click', e => {
    if (e.target === extronModal) closeExtronModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !extronModal.hasAttribute('hidden')) closeExtronModal();
  });

})();
