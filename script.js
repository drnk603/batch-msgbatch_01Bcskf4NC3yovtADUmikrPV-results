(function () {
  'use strict';

  const App = {
    config: {
      headerHeight: 80,
      animationDuration: 600,
      animationEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      debounceDelay: 300,
      throttleDelay: 200
    },

    state: {
      initialized: false,
      menuOpen: false,
      observers: []
    },

    init() {
      if (this.state.initialized) return;
      this.state.initialized = true;

      this.initBurgerMenu();
      this.initSmoothScroll();
      this.initScrollSpy();
      this.initIntersectionObserver();
      this.initFormValidation();
      this.initImageAnimations();
      this.initHoverEffects();
      this.initCounters();
      this.initScrollToTop();
      this.initPrivacyModal();
    },

    initBurgerMenu() {
      const nav = document.querySelector('.c-nav#main-nav');
      const toggle = document.querySelector('.c-nav__toggle');
      const navList = nav?.querySelector('.c-nav__list');

      if (!nav || !toggle || !navList) return;

      const body = document.body;

      const openMenu = () => {
        this.state.menuOpen = true;
        nav.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
        body.classList.add('u-no-scroll');
        navList.style.maxHeight = `calc(100vh - ${this.config.headerHeight}px)`;
      };

      const closeMenu = () => {
        this.state.menuOpen = false;
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        body.classList.remove('u-no-scroll');
        navList.style.maxHeight = '0';
      };

      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.state.menuOpen ? closeMenu() : openMenu();
      });

      document.addEventListener('click', (e) => {
        if (this.state.menuOpen && !nav.contains(e.target)) {
          closeMenu();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.state.menuOpen) {
          closeMenu();
          toggle.focus();
        }
      });

      navList.querySelectorAll('.c-nav__link').forEach(link => {
        link.addEventListener('click', () => {
          if (this.state.menuOpen) closeMenu();
        });
      });

      window.addEventListener('resize', this.throttle(() => {
        if (window.innerWidth >= 1024 && this.state.menuOpen) {
          closeMenu();
        }
      }, this.config.throttleDelay), { passive: true });
    },

    initSmoothScroll() {
      const header = document.querySelector('.l-header');
      const currentPath = window.location.pathname;
      const isHomePage = currentPath === '/' || currentPath === '/index.html' || currentPath === '';

      if (!isHomePage) {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
          const href = link.getAttribute('href');
          if (href && href !== '#' && href !== '#!') {
            link.setAttribute('href', '/' + href);
          }
        });
      }

      document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
          const href = link.getAttribute('href');
          if (!href || href === '#' || href === '#!') return;

          const targetId = href.replace('#', '');
          const targetEl = document.getElementById(targetId);

          if (targetEl) {
            e.preventDefault();
            const offset = header ? header.offsetHeight : this.config.headerHeight;
            const targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - offset;

            window.scrollTo({
              top: targetPos,
              behavior: 'smooth'
            });
          }
        });
      });
    },

    initScrollSpy() {
      const navLinks = document.querySelectorAll('.c-nav__link');
      const sections = [];

      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          const targetId = href.replace('#', '');
          const section = document.getElementById(targetId);
          if (section) {
            sections.push({ link, section });
          }
        }
      });

      if (sections.length === 0) return;

      const updateActiveLink = () => {
        const scrollPos = window.pageYOffset + this.config.headerHeight + 50;

        let currentSection = null;
        sections.forEach(({ section }) => {
          const top = section.offsetTop;
          const bottom = top + section.offsetHeight;
          if (scrollPos >= top && scrollPos < bottom) {
            currentSection = section;
          }
        });

        navLinks.forEach(link => {
          link.removeAttribute('aria-current');
          link.classList.remove('active');
        });

        if (currentSection) {
          const activeLink = sections.find(({ section }) => section === currentSection)?.link;
          if (activeLink) {
            activeLink.setAttribute('aria-current', 'page');
            activeLink.classList.add('active');
          }
        }
      };

      window.addEventListener('scroll', this.throttle(updateActiveLink, this.config.throttleDelay), { passive: true });
      updateActiveLink();
    },

    initIntersectionObserver() {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }
        });
      }, observerOptions);

      const animatedElements = document.querySelectorAll('.c-card, .c-team-card, .c-value-card, .c-location-card, .c-testimonial-card, .c-media-card, .c-achievement, .c-benefit-card, .c-service-card, .c-video-card');

      animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity ${this.config.animationDuration}ms ${this.config.animationEasing}, transform ${this.config.animationDuration}ms ${this.config.animationEasing}`;
        observer.observe(el);
      });

      this.state.observers.push(observer);
    },

    initFormValidation() {
      const form = document.querySelector('.c-form');
      if (!form) return;

      const validators = {
        name: {
          pattern: /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/,
          message: 'Name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes.'
        },
        email: {
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Please enter a valid email address (e.g., example@domain.com).'
        },
        phone: {
          pattern: /^[\d\s+\-()]{10,20}$/,
          message: 'Phone number must be 10-20 characters and contain only digits, spaces, +, -, (, ).'
        },
        message: {
          minLength: 10,
          message: 'Message must be at least 10 characters long.'
        },
        privacy: {
          required: true,
          message: 'You must accept the privacy policy to continue.'
        }
      };

      const validateField = (field, validatorKey) => {
        const value = field.type === 'checkbox' ? field.checked : field.value.trim();
        const errorEl = document.getElementById(`${field.id}-error`);
        const validator = validators[validatorKey];

        let isValid = true;
        let errorMessage = '';

        if (field.type === 'checkbox') {
          if (validator.required && !value) {
            isValid = false;
            errorMessage = validator.message;
          }
        } else {
          if (!value) {
            isValid = false;
            errorMessage = `${field.name.charAt(0).toUpperCase() + field.name.slice(1)} is required.`;
          } else if (validator.pattern && !validator.pattern.test(value)) {
            isValid = false;
            errorMessage = validator.message;
          } else if (validator.minLength && value.length < validator.minLength) {
            isValid = false;
            errorMessage = validator.message;
          }
        }

        if (isValid) {
          field.classList.remove('has-error');
          if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.remove('is-visible');
          }
        } else {
          field.classList.add('has-error');
          if (errorEl) {
            errorEl.textContent = errorMessage;
            errorEl.classList.add('is-visible');
          }
        }

        return isValid;
      };

      const fields = {
        name: form.querySelector('#name'),
        email: form.querySelector('#email'),
        phone: form.querySelector('#phone'),
        message: form.querySelector('#message'),
        privacy: form.querySelector('#privacy')
      };

      Object.keys(fields).forEach(key => {
        const field = fields[key];
        if (field) {
          const eventType = field.type === 'checkbox' ? 'change' : 'blur';
          field.addEventListener(eventType, () => validateField(field, key));
        }
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();

        let isFormValid = true;

        Object.keys(fields).forEach(key => {
          const field = fields[key];
          if (field && !validateField(field, key)) {
            isFormValid = false;
          }
        });

        if (!isFormValid) {
          this.showNotification('Please correct the errors in the form.', 'error');
          return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        if (!submitBtn) return;

        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...';

        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          this.showNotification('Thank you! Your message has been sent successfully.', 'success');
          setTimeout(() => {
            window.location.href = 'thank_you.html';
          }, 1500);
        }, 1500);
      });
    },

    initImageAnimations() {
      const images = document.querySelectorAll('img:not([data-critical])');
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) return;

      images.forEach(img => {
        img.style.opacity = '0';
        img.style.transform = 'scale(0.95)';
        img.style.transition = `opacity ${this.config.animationDuration}ms ${this.config.animationEasing}, transform ${this.config.animationDuration}ms ${this.config.animationEasing}`;

        if (img.complete) {
          img.style.opacity = '1';
          img.style.transform = 'scale(1)';
        } else {
          img.addEventListener('load', () => {
            img.style.opacity = '1';
            img.style.transform = 'scale(1)';
          });
        }
      });
    },

    initHoverEffects() {
      const buttons = document.querySelectorAll('.c-btn, .c-quick-links__link');

      buttons.forEach(btn => {
        btn.addEventListener('mouseenter', function () {
          this.style.transition = `all ${App.config.animationDuration / 2}ms ${App.config.animationEasing}`;
        });

        btn.addEventListener('click', function (e) {
          const ripple = document.createElement('span');
          const rect = this.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height);
          const x = e.clientX - rect.left - size / 2;
          const y = e.clientY - rect.top - size / 2;

          ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
            transform: scale(0);
            opacity: 1;
            transition: transform 0.6s ease-out, opacity 0.6s ease-out;
          `;

          this.style.position = 'relative';
          this.style.overflow = 'hidden';
          this.appendChild(ripple);

          requestAnimationFrame(() => {
            ripple.style.transform = 'scale(4)';
            ripple.style.opacity = '0';
          });

          setTimeout(() => ripple.remove(), 600);
        });
      });
    },

    initCounters() {
      const counters = document.querySelectorAll('.c-achievement__value');
      if (counters.length === 0) return;

      const animateCounter = (el) => {
        const target = parseInt(el.textContent.replace(/[^\d]/g, ''));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
          current += increment;
          if (current < target) {
            el.textContent = Math.floor(current).toLocaleString();
            requestAnimationFrame(updateCounter);
          } else {
            el.textContent = target.toLocaleString();
          }
        };

        updateCounter();
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      counters.forEach(counter => observer.observe(counter));
      this.state.observers.push(observer);
    },

    initScrollToTop() {
      const btn = document.createElement('button');
      btn.innerHTML = '↑';
      btn.className = 'c-scroll-top';
      btn.setAttribute('aria-label', 'Scroll to top');
      btn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: var(--color-secondary);
        color: var(--color-bg);
        border: none;
        font-size: 24px;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: var(--shadow-lg);
      `;

      document.body.appendChild(btn);

      const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
          btn.style.opacity = '1';
          btn.style.visibility = 'visible';
        } else {
          btn.style.opacity = '0';
          btn.style.visibility = 'hidden';
        }
      };

      btn.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });

      window.addEventListener('scroll', this.throttle(toggleVisibility, this.config.throttleDelay), { passive: true });
    },

    initPrivacyModal() {
      const privacyLinks = document.querySelectorAll('a[href*="privacy"]');

      privacyLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          const href = link.getAttribute('href');
          if (href && (href.includes('privacy.html') || href.includes('#privacy'))) {
            e.preventDefault();
            this.showPrivacyModal();
          }
        });
      });
    },

    showPrivacyModal() {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: ${this.config.headerHeight * 25};
        padding: 20px;
        animation: fadeIn 0.3s ease;
      `;

      const content = document.createElement('div');
      content.style.cssText = `
        background: var(--color-bg);
        border-radius: var(--border-radius-lg);
        padding: 40px;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
        box-shadow: var(--shadow-lg);
      `;

      content.innerHTML = `
        <button class="close-modal" style="position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 30px; cursor: pointer; color: var(--color-text-light);">&times;</button>
        <h2 style="color: var(--color-primary); margin-bottom: 20px;">Privacy Policy</h2>
        <p style="color: var(--color-text-light); line-height: 1.8;">
          By using this form, you agree to our data protection policy. Your data will be processed securely and will not be shared with third parties without your consent.
        </p>
        <button class="c-btn c-btn--primary" style="margin-top: 20px;">I Understand</button>
      `;

      modal.appendChild(content);
      document.body.appendChild(modal);
      document.body.classList.add('u-no-scroll');

      const close = () => {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
          modal.remove();
          document.body.classList.remove('u-no-scroll');
        }, 300);
      };

      content.querySelector('.close-modal').addEventListener('click', close);
      content.querySelector('.c-btn').addEventListener('click', close);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
      });
    },

    showNotification(message, type = 'success') {
      const notification = document.createElement('div');
      notification.className = `c-notification c-notification--${type}`;
      notification.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: var(--color-bg);
        border: 1px solid var(--color-border);
        border-left: 4px solid ${type === 'success' ? 'var(--color-success)' : 'var(--color-error)'};
        border-radius: var(--border-radius-md);
        padding: 20px;
        max-width: 400px;
        box-shadow: var(--shadow-lg);
        z-index: ${this.config.headerHeight * 50};
        animation: slideInUp 0.4s ${this.config.animationEasing};
      `;

      notification.innerHTML = `
        <div class="c-notification__title" style="font-weight: bold; margin-bottom: 5px; color: var(--color-primary);">
          ${type === 'success' ? 'Success' : 'Error'}
        </div>
        <div class="c-notification__message" style="font-size: 14px; color: var(--color-text-light);">
          ${message}
        </div>
      `;

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }, 5000);
    },

    throttle(fn, delay) {
      let lastCall = 0;
      return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          fn.apply(this, args);
        }
      };
    },

    debounce(fn, delay) {
      let timer;
      return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
      };
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }

  window.__app = App;
})();