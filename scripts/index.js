(() => {
  'use strict';

  const themeToggle = document.querySelector('.theme-toggle');
  const backToTop = document.getElementById('back-to-top');
  const revealTargets = document.querySelectorAll('.reveal-on-scroll');

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌗';
    });
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        entry.target.classList.add('reveal');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    revealTargets.forEach((target) => observer.observe(target));
  } else {
    revealTargets.forEach((target) => target.classList.add('reveal'));
  }

  if (backToTop) {
    const toggleBackToTop = () => {
      backToTop.style.display = window.scrollY > 200 ? 'flex' : 'none';
    };

    window.addEventListener('scroll', toggleBackToTop, { passive: true });
    toggleBackToTop();

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.error('Service worker registration failed:', err);
      });
    });
  }
})();
