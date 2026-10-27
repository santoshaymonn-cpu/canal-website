/* O Intervalo — interações sem bibliotecas externas. */
(() => {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.documentElement.classList.add("js-ready");
  document.addEventListener("DOMContentLoaded", () => {
    initMobileNavigation(); initArchive(); initTerritories(); initScrollSpy();
    initReveal(); initImageFallbacks(); initReadingProgress(); initCurrentYear();
  });

  function initMobileNavigation() {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".site-nav");
    if (!toggle || !nav) return;
    const close = () => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menu");
      nav.classList.remove("is-open"); document.body.classList.remove("menu-open");
    };
    const open = () => {
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Fechar menu");
      nav.classList.add("is-open"); document.body.classList.add("menu-open");
    };
    toggle.addEventListener("click", () => toggle.getAttribute("aria-expanded") === "true" ? close() : open());
    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", close));
    document.addEventListener("keydown", event => { if (event.key === "Escape") { close(); toggle.focus(); } });
    document.addEventListener("click", event => {
      if (toggle.getAttribute("aria-expanded") === "true" && !nav.contains(event.target) && !toggle.contains(event.target)) close();
    });
    const desktop = window.matchMedia("(min-width: 761px)");
    const onBreakpoint = event => { if (event.matches) close(); };
    if (desktop.addEventListener) desktop.addEventListener("change", onBreakpoint); else desktop.addListener(onBreakpoint);
  }

  function normalize(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
  }

  function initArchive() {
    const section = document.querySelector("#arquivo");
    const grid = document.querySelector("#essay-grid");
    const search = document.querySelector("#essay-search");
    const status = document.querySelector("#results-status");
    const empty = document.querySelector("#empty-state");
    const reset = document.querySelector("#reset-archive");
    const emptyReset = document.querySelector("#empty-reset");
    if (!section || !grid || !search || !status) return;
    const cards = [...grid.querySelectorAll(".essay-card")];
    const filters = [...section.querySelectorAll("[data-filter]")];
    let activeCategory = "todos", term = "";

    function render() {
      let count = 0;
      cards.forEach(card => {
        const categories = (card.dataset.category || "").split(/\s+/);
        const categoryMatch = activeCategory === "todos" || categories.includes(activeCategory);
        const haystack = normalize([card.dataset.search, card.dataset.category, card.textContent].join(" "));
        const visible = categoryMatch && (!term || haystack.includes(term));
        card.classList.toggle("is-hidden", !visible);
        card.setAttribute("aria-hidden", String(!visible));
        card.querySelectorAll("a").forEach(link => visible ? link.removeAttribute("tabindex") : link.setAttribute("tabindex", "-1"));
        if (visible) count++;
      });
      filters.forEach(button => {
        const active = button.dataset.filter === activeCategory;
        button.classList.toggle("is-active", active); button.setAttribute("aria-pressed", String(active));
      });
      status.textContent = count === 1 ? "1 ensaio encontrado" : `${count} ensaios encontrados`;
      if (empty) empty.hidden = count !== 0;
      if (reset) reset.hidden = activeCategory === "todos" && !term;
    }
    function resetAll() { activeCategory = "todos"; term = ""; search.value = ""; render(); search.focus(); }
    filters.forEach(button => button.addEventListener("click", () => { activeCategory = button.dataset.filter || "todos"; render(); }));
    search.addEventListener("input", () => { term = normalize(search.value); render(); });
    if (reset) reset.addEventListener("click", resetAll);
    if (emptyReset) emptyReset.addEventListener("click", resetAll);
    section.filterByCategory = category => {
      activeCategory = filters.some(button => button.dataset.filter === category) ? category : "todos";
      term = ""; search.value = ""; render();
      section.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
    };
    render();
  }

  function initTerritories() {
    const archive = document.querySelector("#arquivo");
    if (!archive) return;
    document.querySelectorAll("[data-territory]").forEach(button => button.addEventListener("click", () => {
      if (typeof archive.filterByCategory === "function") archive.filterByCategory(button.dataset.territory);
    }));
  }

  function initScrollSpy() {
    const links = [...document.querySelectorAll(".nav-link")];
    const pairs = links.map(link => ({ link, target: document.querySelector(link.getAttribute("href")) })).filter(item => item.target);
    if (!pairs.length || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => {
      const current = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
      if (!current) return;
      const item = pairs.find(pair => pair.target === current.target);
      if (!item) return;
      links.forEach(link => {
        const active = link === item.link; link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "location"); else link.removeAttribute("aria-current");
      });
    }, { rootMargin: "-22% 0px -58% 0px", threshold: [0,.12,.3,.55] });
    pairs.forEach(pair => observer.observe(pair.target));
  }

  function initReveal() {
    const items = [...document.querySelectorAll("[data-reveal]")];
    if (!items.length) return;
    if (reduceMotion.matches || !("IntersectionObserver" in window)) { items.forEach(item => item.classList.add("is-visible")); return; }
    const observer = new IntersectionObserver((entries, currentObserver) => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); currentObserver.unobserve(entry.target); }
    }), { threshold: .08, rootMargin: "0px 0px -28px 0px" });
    items.forEach(item => observer.observe(item));
  }

  function initImageFallbacks() {
    document.querySelectorAll("img[data-fallback]").forEach(img => {
      let shown = false;
      const show = () => {
        if (shown) return; shown = true;
        const host = img.parentElement;
        if (!host || host.querySelector(".image-fallback")) return;
        const fallback = document.createElement("div"); fallback.className = "image-fallback";
        fallback.setAttribute("role", "img"); fallback.setAttribute("aria-label", img.alt || "Imagem indisponível");
        const inner = document.createElement("div"), title = document.createElement("strong"), subtitle = document.createElement("small");
        title.textContent = "O Intervalo"; subtitle.textContent = img.dataset.fallback || "Imagem indisponível";
        inner.append(title, subtitle); fallback.append(inner); img.hidden = true; host.append(fallback);
      };
      img.addEventListener("error", show, { once: true });
      if (img.complete && img.naturalWidth === 0) show();
    });
  }

  function initReadingProgress() {
    const bar = document.querySelector("#reading-progress"); if (!bar) return;
    let queued = false;
    const update = () => {
      const root = document.documentElement, max = root.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0;
      bar.style.width = `${progress}%`; queued = false;
    };
    window.addEventListener("scroll", () => { if (!queued) { queued = true; window.requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update, { passive: true }); update();
  }

  function initCurrentYear() {
    const year = document.querySelector("#current-year"); if (year) year.textContent = String(new Date().getFullYear());
  }
})();
