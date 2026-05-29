/* =============================================================================
   Klar Clinic — site interactions
   Modular, dependency-free vanilla JavaScript. Each module is guarded so the
   file can be loaded on every page without errors when a feature is absent.
   ============================================================================= */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------------
     1. Mobile navigation toggle
     ------------------------------------------------------------------------- */
  function initMobileMenu() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (!toggle || !menu) return;

    function setOpen(open) {
      menu.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    toggle.addEventListener("click", function () {
      setOpen(!menu.classList.contains("is-open"));
    });

    // Close when a link inside the menu is tapped.
    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    // Close on resize to desktop.
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024) setOpen(false);
    });
  }

  /* ---------------------------------------------------------------------------
     2. Sticky navbar elevation on scroll
     ------------------------------------------------------------------------- */
  function initStickyHeader() {
    var header = document.querySelector("[data-site-header]");
    if (!header) return;

    function onScroll() {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------------------------------------------------------------------
     3. FAQ accordion
     ------------------------------------------------------------------------- */
  function initAccordion() {
    var items = document.querySelectorAll("[data-accordion-item]");
    if (!items.length) return;

    items.forEach(function (item, index) {
      var trigger = item.querySelector(".accordion-trigger");
      var panel = item.querySelector(".accordion-panel");
      if (!trigger || !panel) return;

      // Expose the trigger→panel relationship and hide collapsed content from
      // assistive tech (overflow:hidden alone leaves it in the a11y tree).
      if (!panel.id) panel.id = "klar-accordion-panel-" + index;
      trigger.setAttribute("aria-controls", panel.id);
      var startOpen = item.classList.contains("is-open");
      panel.setAttribute("aria-hidden", String(!startOpen));
      // Prime an initially-open panel to its true height so the first close
      // animates from the content height, not the CSS max-height cap.
      if (startOpen) panel.style.maxHeight = panel.scrollHeight + "px";

      trigger.addEventListener("click", function () {
        var isOpen = item.classList.contains("is-open");

        // Close siblings within the same accordion (single-open behavior).
        var group = item.closest(".accordion");
        if (group) {
          group.querySelectorAll("[data-accordion-item].is-open").forEach(function (other) {
            if (other !== item) {
              other.classList.remove("is-open");
              var otherPanel = other.querySelector(".accordion-panel");
              other.querySelector(".accordion-trigger").setAttribute("aria-expanded", "false");
              otherPanel.setAttribute("aria-hidden", "true");
              otherPanel.style.maxHeight = null;
            }
          });
        }

        item.classList.toggle("is-open", !isOpen);
        trigger.setAttribute("aria-expanded", String(!isOpen));
        panel.setAttribute("aria-hidden", String(isOpen));
        panel.style.maxHeight = !isOpen ? panel.scrollHeight + "px" : null;
      });
    });
  }

  /* ---------------------------------------------------------------------------
     4. Scroll-reveal animations (IntersectionObserver)
     ------------------------------------------------------------------------- */
  function initScrollReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;

    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    els.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------------------------------
     5. Active navigation highlighting
     ------------------------------------------------------------------------- */
  function initActiveNav() {
    var path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("[data-nav] a[href]").forEach(function (link) {
      var href = link.getAttribute("href").split("/").pop();
      if (href === path) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  /* ---------------------------------------------------------------------------
     6. Theme toggle (light / dark) — persisted in localStorage
     ------------------------------------------------------------------------- */
  function initThemeToggle() {
    var toggles = document.querySelectorAll('[aria-label="Toggle theme"]');
    var stored = null;
    try { stored = localStorage.getItem("klar-theme"); } catch (e) {}
    if (stored === "dark") document.documentElement.classList.add("dark");

    toggles.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var isDark = document.documentElement.classList.toggle("dark");
        try { localStorage.setItem("klar-theme", isDark ? "dark" : "light"); } catch (e) {}
      });
    });
  }

  /* ---------------------------------------------------------------------------
     7. Contact form validation (frontend only)
     ------------------------------------------------------------------------- */
  function initFormValidation() {
    var form = document.querySelector("[data-validate]");
    if (!form) return;

    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var phoneRe = /^[0-9+()\s-]{6,}$/;

    function fieldOf(input) {
      return input.closest(".field");
    }
    function setError(input, message) {
      var field = fieldOf(input);
      if (!field) return;
      field.classList.toggle("is-invalid", Boolean(message));
      var slot = field.querySelector(".field-error");
      if (slot) {
        slot.textContent = message || "";
        if (!slot.id) slot.id = (input.id || input.name || "field") + "-error";
      }
      if (message) {
        input.setAttribute("aria-invalid", "true");
        if (slot) input.setAttribute("aria-describedby", slot.id);
      } else {
        input.removeAttribute("aria-invalid");
        input.removeAttribute("aria-describedby");
      }
    }

    function validateField(input) {
      var value = (input.value || "").trim();
      var type = input.getAttribute("type");
      var required = input.hasAttribute("required");

      if (required && !value) {
        setError(input, "This field is required.");
        return false;
      }
      if (value && (type === "email" || input.name === "email") && !emailRe.test(value)) {
        setError(input, "Please enter a valid email address.");
        return false;
      }
      if (value && (type === "tel" || input.name === "phone") && !phoneRe.test(value)) {
        setError(input, "Please enter a valid phone number.");
        return false;
      }
      setError(input, "");
      return true;
    }

    var inputs = form.querySelectorAll("input, textarea, select");
    inputs.forEach(function (input) {
      input.addEventListener("blur", function () { validateField(input); });
      input.addEventListener("input", function () {
        if (fieldOf(input) && fieldOf(input).classList.contains("is-invalid")) {
          validateField(input);
        }
      });
    });

    form.addEventListener("submit", function (event) {
      var valid = true;
      inputs.forEach(function (input) {
        if (!validateField(input)) valid = false;
      });

      if (!valid) {
        event.preventDefault();
        var firstInvalid = form.querySelector(".is-invalid input, .is-invalid textarea, .is-invalid select");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // No backend in this static build — show an inline confirmation.
      event.preventDefault();
      var status = form.querySelector("[data-form-status]");
      if (status) {
        status.hidden = false;
        status.textContent =
          "Thank you — your request has been received. Our care team will be in touch within one business day.";
        status.focus();
      }
      form.reset();
    });
  }

  /* ---------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------- */
  function init() {
    initMobileMenu();
    initStickyHeader();
    initAccordion();
    initScrollReveal();
    initActiveNav();
    initThemeToggle();
    initFormValidation();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
