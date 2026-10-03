/**
 * أكاديمية إنسان لبناء القيم — Main JS
 * Cleaned, modular, validated.
 */

(function () {
  "use strict";

  // ==========================================
  // CONFIG
  // ==========================================
  const CONFIG = {
    scrollOffsetExtra: 15,
    counters: { duration: 2000, steps: 60 },
    carousel: { interval: 3600, gap: 24, swipeThreshold: 40 },
    whatssappNumber: "905009477911",
    apiEndpoints: { join: "/api/join", contact: "/api/contact" },
    storageKeys: {
      theme: "insan-theme",
      lang: "insan-language",
      pendingJoins: "insan-pending-joins",
      pendingContacts: "insan-pending-contacts"
    }
  };

  // ==========================================
  // HELPERS
  // ==========================================
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const safeStorage = {
    get(key, fallback = null) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
    set(key, value)          { try { localStorage.setItem(key, value); } catch { /* ignore */ } },
    getJSON(key, fallback = []) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } },
    setJSON(key, value)      { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ } }
  };

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPhone = (v) => /^\+?[\d\s\-()]{8,}$/.test(v);

  // ==========================================
  // 1. THEME + LANGUAGE
  // ==========================================
  const htmlRoot = document.documentElement;
  const themeToggle = $("#themeToggle");
  const languageToggle = $("#languageToggle");

  const i18n = window.INSAN_I18N || { ar: {}, en: {} };

  function t(key, lang) {
    return (i18n[lang] && i18n[lang][key]) || (i18n.ar && i18n.ar[key]) || key;
  }

  function applyTranslationsToNode(node, lang) {
    const key = node.getAttribute("data-i18n");
    if (key) node.textContent = t(key, lang);

    const attrSpec = node.getAttribute("data-i18n-attr");
    if (attrSpec) {
      // Format: "attr1:key1,attr2:key2"
      attrSpec.split(",").forEach(pair => {
        const [attr, k] = pair.split(":").map(s => s.trim());
        if (attr && k) node.setAttribute(attr, t(k, lang));
      });
    }
  }

    function applyLanguage(lang) {
    // Support: ar, en, tr
    const L = (lang === "en" || lang === "tr") ? lang : "ar";
    htmlRoot.lang = L;
    htmlRoot.dir = L === "ar" ? "rtl" : "ltr";
    htmlRoot.dataset.lang = L;

    // Translate all [data-i18n] and [data-i18n-attr] elements
    $$("[data-i18n], [data-i18n-attr]").forEach(el => applyTranslationsToNode(el, L));

    // Update page title
    const titleEl = document.querySelector("title[data-i18n]");
    if (titleEl) titleEl.textContent = t(titleEl.getAttribute("data-i18n"), L);

    // Update language toggle label (cycles AR → EN → TR → AR)
    if (languageToggle) {
      const nextLabels = { ar: "EN", en: "TR", tr: "ع" };
      const nextLangKey = { ar: "controls.lang.aria", en: "controls.lang.aria.tr", tr: "controls.lang.aria.en" };
      languageToggle.textContent = nextLabels[L];
      languageToggle.setAttribute("aria-label", t(nextLangKey[L], L));
      languageToggle.title = { ar: "English", en: "Türkçe", tr: "العربية" }[L];
    }

    // Update theme toggle title
    updateThemeToggleLabel();

    safeStorage.set(CONFIG.storageKeys.lang, L);
  }

  function updateThemeToggleLabel() {
    if (!themeToggle) return;
    const isDark = htmlRoot.dataset.theme === "dark";
    const lang = htmlRoot.dataset.lang || "ar";
    themeToggle.setAttribute("aria-label", t(isDark ? "controls.theme.aria.light" : "controls.theme.aria", lang));
    themeToggle.title = t(isDark ? "controls.theme.title.light" : "controls.theme.title", lang);
  }

  function applyTheme(theme) {
    const isDark = theme === "dark";
    htmlRoot.dataset.theme = isDark ? "dark" : "light";
    document.body.classList.toggle("dark-theme", isDark);
    if (themeToggle) {
      themeToggle.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    }
    updateThemeToggleLabel();
    safeStorage.set(CONFIG.storageKeys.theme, isDark ? "dark" : "light");
  }

  // Init theme + lang BEFORE paint to avoid flash
  const savedLang  = safeStorage.get(CONFIG.storageKeys.lang, "ar");
  const savedTheme = safeStorage.get(CONFIG.storageKeys.theme, "light");
  applyLanguage(savedLang);
  applyTheme(savedTheme);


  languageToggle?.addEventListener("click", () => {
  const current = htmlRoot.dataset.lang || "ar";
  const cycle = { ar: "en", en: "tr", tr: "ar" };
  applyLanguage(cycle[current]);
});
  themeToggle?.addEventListener("click", () => applyTheme(htmlRoot.dataset.theme === "dark" ? "light" : "dark"));

  // Footer year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ==========================================
  // 2. HEADER SCROLL + MOBILE MENU
  // ==========================================
  const header = $("#header");
  const menuBtn = $("#menuBtn");
  const mobileMenu = $("#mobileMenu");

  function updateHeader() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  function closeMobileMenu() {
    if (!mobileMenu || !menuBtn) return;
    mobileMenu.classList.remove("open");
    mobileMenu.setAttribute("aria-hidden", "true");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
  }

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = mobileMenu.classList.toggle("open");
      mobileMenu.setAttribute("aria-hidden", String(!isOpen));
      menuBtn.setAttribute("aria-expanded", String(isOpen));
      menuBtn.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });

    $$("a", mobileMenu).forEach(a => a.addEventListener("click", closeMobileMenu));

    document.addEventListener("click", (e) => {
      if (
        mobileMenu.classList.contains("open") &&
        !mobileMenu.contains(e.target) &&
        !menuBtn.contains(e.target)
      ) closeMobileMenu();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobileMenu.classList.contains("open")) closeMobileMenu();
    });
  }

  // ==========================================
  // 3. SMOOTH SCROLL (CSS handles it via scroll-behavior)
  // ==========================================
  // We removed JS scroll because CSS `scroll-behavior: smooth` on html handles it.
  // This avoids double-smoothing.
  // We only add anchor click handlers for header offset:

  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const headerH = header ? header.offsetHeight : 80;
      const top = target.getBoundingClientRect().top + window.pageYOffset - headerH - CONFIG.scrollOffsetExtra;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  // ==========================================
  // 4. ACTIVE NAV LINK
  // ==========================================
  const navLinks = $$(".desktop-nav .nav-link");
  const trackedSections = $$("section[id]");

  function updateActiveNavLink() {
    let currentId = "";
    const pos = window.scrollY + 180;
    trackedSections.forEach(sec => { if (pos >= sec.offsetTop) currentId = sec.id; });
    navLinks.forEach(link => {
      link.classList.toggle("active", link.getAttribute("href") === "#" + currentId);
    });
  }
  window.addEventListener("scroll", updateActiveNavLink, { passive: true });
  updateActiveNavLink();

  // ==========================================
  // 5. REVEAL ON SCROLL
  // ==========================================
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => obs.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("show"));
  }

  // ==========================================
  // 6. COUNTERS (Western numerals)
  // ==========================================
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10) || 0;
    const steps = CONFIG.counters.steps;
    const stepTime = CONFIG.counters.duration / steps;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      // Use Western numerals for both languages
      el.textContent = Math.floor(current).toLocaleString("en-US");
    }, stepTime);
  }

  if ("IntersectionObserver" in window) {
    const counterObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    $$(".counter[data-target]").forEach(c => counterObs.observe(c));
  }

  // ==========================================
  // 7. PROGRAM CARDS FLIP + SELECT
  // ==========================================
  $$(".prog-box").forEach(box => {
    box.addEventListener("click", function (e) {
      if (e.target.closest(".prog-action-btn")) return;
      this.classList.toggle("flipped");
    });
    box.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.classList.toggle("flipped");
      }
    });
  });

  $$(".prog-action-btn").forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const programName = this.dataset.program;
      const joinSection = $("#join");
      const joinPath = $("#joinPath");

      if (joinPath && programName) {
        // Program names in the select use the exact value strings
        const exists = Array.from(joinPath.options).some(opt => opt.value === programName);
        if (exists) {
          joinPath.value = programName;
          joinPath.classList.remove("field-highlight");
          void joinPath.offsetWidth;
          joinPath.classList.add("field-highlight");
        }
      }
      if (joinSection) {
        const headerH = header ? header.offsetHeight : 80;
        const top = joinSection.getBoundingClientRect().top + window.pageYOffset - headerH - CONFIG.scrollOffsetExtra;
        window.scrollTo({ top, behavior: "smooth" });
      }
    });
  });

  // ==========================================
  // 8. TESTIMONIALS CAROUSEL
  // ==========================================
  const track = $("#testimonialsTrack");
  const prevBtn = $("#prevBtn");
  const nextBtn = $("#nextBtn");
  const dotsContainer = $("#carouselDots");
  const autoIndicatorText = $(".auto-indicator-text");

  if (track) {
    const slides = $$(".testimonial-slide", track);
    const totalSlides = slides.length;
    let currentIndex = 0;
    let autoPlayTimer = null;
    let isPaused = false;
    const GAP = CONFIG.carousel.gap;

    const getVisibleSlidesCount = () => {
      if (window.innerWidth <= 768) return 1;
      if (window.innerWidth <= 1100) return 2;
      return 3;
    };

    const getMaxIndex = () => Math.max(0, totalSlides - getVisibleSlidesCount());

    const isRTL = () => htmlRoot.dir === "rtl";

    function buildDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = "";
      const maxIdx = getMaxIndex();
      for (let i = 0; i <= maxIdx; i++) {
        const dot = document.createElement("button");
        dot.classList.add("carousel-dot");
        dot.type = "button";
        dot.setAttribute("aria-label", `Slide ${i + 1}`);
        if (i === currentIndex) dot.classList.add("active");
        dot.addEventListener("click", () => { goToSlide(i); resetAutoPlay(); });
        dotsContainer.appendChild(dot);
      }
    }

    function updateSliderPosition() {
      if (!slides.length) return;
      const slideWidth = slides[0].offsetWidth || 300;
      const moveStep = slideWidth + GAP;
      const offset = currentIndex * moveStep;
      // In RTL, we shift positively; in LTR, negatively
      const direction = isRTL() ? 1 : -1;
      track.style.transform = `translateX(${direction * offset}px)`;

      if (dotsContainer) {
        const dots = $$(".carousel-dot", dotsContainer);
        dots.forEach((d, i) => d.classList.toggle("active", i === currentIndex));
      }
      if (prevBtn) prevBtn.disabled = currentIndex === 0;
      if (nextBtn) nextBtn.disabled = currentIndex >= getMaxIndex();
    }

    function goToSlide(index) {
      const maxIdx = getMaxIndex();
      currentIndex = Math.max(0, Math.min(index, maxIdx));
      updateSliderPosition();
    }

    function nextSlide() {
      const maxIdx = getMaxIndex();
      goToSlide(currentIndex >= maxIdx ? 0 : currentIndex + 1);
    }

    function prevSlide() {
      goToSlide(currentIndex <= 0 ? getMaxIndex() : currentIndex - 1);
    }

    function startAutoPlay() {
      stopAutoPlay();
      autoPlayTimer = setInterval(() => { if (!isPaused) nextSlide(); }, CONFIG.carousel.interval);
      if (autoIndicatorText) autoIndicatorText.textContent = t("controls.autoplay", htmlRoot.dataset.lang);
    }
    function stopAutoPlay() { if (autoPlayTimer) { clearInterval(autoPlayTimer); autoPlayTimer = null; } }
    function resetAutoPlay() { startAutoPlay(); }

    nextBtn?.addEventListener("click", () => { nextSlide(); resetAutoPlay(); });
    prevBtn?.addEventListener("click", () => { prevSlide(); resetAutoPlay(); });

    const wrapper = $(".testimonials-wrapper");
    wrapper?.addEventListener("mouseenter", () => {
      isPaused = true;
      if (autoIndicatorText) autoIndicatorText.textContent = t("controls.autoplay.paused", htmlRoot.dataset.lang);
    });
    wrapper?.addEventListener("mouseleave", () => {
      isPaused = false;
      if (autoIndicatorText) autoIndicatorText.textContent = t("controls.autoplay", htmlRoot.dataset.lang);
    });

    // Touch
    let touchStartX = 0;
    track.addEventListener("touchstart", (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    track.addEventListener("touchend", (e) => {
      const diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > CONFIG.carousel.swipeThreshold) {
        diff > 0 ? nextSlide() : prevSlide();
        resetAutoPlay();
      }
    }, { passive: true });

    // Resize
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        buildDots();
        goToSlide(Math.min(currentIndex, getMaxIndex()));
      }, 100);
    });

    buildDots();
    updateSliderPosition();
    startAutoPlay();
  }

  // ==========================================
  // 9. FORM HELPERS
  // ==========================================
  function showError(inputId, message) {
    const input = document.getElementById(inputId);
    const err = document.getElementById("error-" + inputId);
    if (!input || !err) return;
    input.classList.add("error");
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", err.id);
    err.textContent = message;
    err.classList.add("show");
  }

  function clearError(inputId) {
    const input = document.getElementById(inputId);
    const err = document.getElementById("error-" + inputId);
    if (!input || !err) return;
    input.classList.remove("error");
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
    err.textContent = "";
    err.classList.remove("show");
  }

  function clearAllErrors(form) {
    if (!form) return;
    $$(".error-msg", form).forEach(el => { el.textContent = ""; el.classList.remove("show"); });
    $$("input, select, textarea", form).forEach(el => {
      el.classList.remove("error");
      el.removeAttribute("aria-invalid");
      el.removeAttribute("aria-describedby");
    });
  }

  const L = () => htmlRoot.dataset.lang === "en";

  // ==========================================
  // 10. JOIN FORM
  // ==========================================
  const joinForm = $("#joinForm");
  const joinSuccess = $("#joinSuccess");
  const joinSubmitBtn = $("#joinSubmitBtn");
  const joinWhatsAppBtn = $("#joinWhatsAppBtn");

  function getJoinData() {
    return {
      name: $("#joinName")?.value.trim() || "",
      age: $("#joinAge")?.value.trim() || "",
      phone: $("#joinPhone")?.value.trim() || "",
      email: $("#joinEmail")?.value.trim() || "",
      path: $("#joinPath")?.value.trim() || "",
      studyMode: $("#joinStudyMode")?.value || "حضوري في إسطنبول",
      nationality: $("#joinNationality")?.value.trim() || "",
      residence: $("#joinResidence")?.value.trim() || "",
      honeypot: $('input[name="website"]', joinForm)?.value || ""
    };
  }

  function validateJoin(data) {
    clearAllErrors(joinForm);
    let ok = true;
    const en = L();

    if (!data.name) { showError("joinName", en ? "Please enter your full name." : "يرجى كتابة الاسم واللقب."); ok = false; }

    const age = Number(data.age);
    if (!data.age) { showError("joinAge", en ? "Please enter your age." : "يرجى كتابة العمر."); ok = false; }
    else if (isNaN(age) || age < 5 || age > 99) { showError("joinAge", en ? "Age must be between 5 and 99." : "العمر يجب أن يكون بين 5 و 99."); ok = false; }

    if (!data.phone) { showError("joinPhone", en ? "Please enter your phone number." : "يرجى كتابة رقم الهاتف."); ok = false; }
    else if (!isPhone(data.phone)) { showError("joinPhone", en ? "Please enter a valid phone number." : "يرجى إدخال رقم هاتف صحيح."); ok = false; }

    if (!data.email) { showError("joinEmail", en ? "Please enter your email." : "يرجى كتابة البريد الإلكتروني."); ok = false; }
    else if (!isEmail(data.email)) { showError("joinEmail", en ? "Please enter a valid email." : "يرجى إدخال بريد إلكتروني صحيح."); ok = false; }

    if (!data.path) { showError("joinPath", en ? "Please choose a program." : "يرجى اختيار المسار أو البرنامج."); ok = false; }
    if (!data.nationality) { showError("joinNationality", en ? "Please enter your nationality." : "يرجى كتابة الجنسية."); ok = false; }
    if (!data.residence) { showError("joinResidence", en ? "Please enter your country of residence." : "يرجى كتابة بلد الإقامة."); ok = false; }

    // Honeypot check
    if (data.honeypot) ok = false;

    return ok;
  }

  joinWhatsAppBtn?.addEventListener("click", () => {
    const data = getJoinData();
    if (!validateJoin(data)) return;
    const msg =
      "🌟 *طلب تسجيل جديد في أكاديمية إنسان لبناء القيم* 🌟\n" +
      "──────────────────\n" +
      "👤 *الاسم واللقب:* " + data.name + "\n" +
      "🎂 *العمر:* " + data.age + "\n" +
      "📞 *رقم الهاتف:* " + data.phone + "\n" +
      "📧 *البريد:* " + data.email + "\n" +
      "📚 *المسار:* " + data.path + "\n" +
      "🏫 *طريقة الحضور:* " + data.studyMode + "\n" +
      "🌍 *الجنسية:* " + data.nationality + "\n" +
      "📍 *بلد الإقامة:* " + data.residence + "\n" +
      "──────────────────\n" +
      "أرجو تزويدي بكافة تفاصيل الحجز والمواعيد.";
    window.open(`https://wa.me/${CONFIG.whatssappNumber}?text=${encodeURIComponent(msg)}`, "_blank");
    if (joinSuccess) {
      joinSuccess.classList.add("show");
      setTimeout(() => joinSuccess.classList.remove("show"), 8000);
    }
  });

  joinForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = getJoinData();
    if (!validateJoin(data)) return;

    const originalHTML = joinSubmitBtn?.innerHTML;
    if (joinSubmitBtn) {
      joinSubmitBtn.disabled = true;
      joinSubmitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>${L() ? "Saving..." : "جاري الحفظ..."}</span>`;
    }

    try {
      const res = await fetch(CONFIG.apiEndpoints.join, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("join failed");
      joinForm.reset();
      if (joinSuccess) {
        joinSuccess.classList.add("show");
        setTimeout(() => joinSuccess.classList.remove("show"), 8000);
      }
    } catch {
      const pending = safeStorage.getJSON(CONFIG.storageKeys.pendingJoins, []);
      pending.push({ ...data, createdAt: new Date().toISOString(), offline: true });
      safeStorage.setJSON(CONFIG.storageKeys.pendingJoins, pending);
      joinForm.reset();
      if (joinSuccess) {
        joinSuccess.querySelector("strong").textContent = L() ? "Saved on this device! ✨" : "تم حفظ طلبك على الجهاز! ✨";
        joinSuccess.querySelector("span").textContent = L() ? "Server unavailable; request stored locally." : "الخادم غير متاح؛ تم حفظ الطلب محلياً.";
        joinSuccess.classList.add("show");
        setTimeout(() => joinSuccess.classList.remove("show"), 8000);
      }
    } finally {
      if (joinSubmitBtn) {
        joinSubmitBtn.disabled = false;
        joinSubmitBtn.innerHTML = originalHTML || `<span>${L() ? "Submit Registration" : "إرسال طلب التسجيل"}</span> <i class="fa-solid fa-arrow-left"></i>`;
      }
    }
  });

  // ==========================================
  // 11. CONTACT FORM
  // ==========================================
  const contactForm = $("#contactForm");
  const formSuccess = $("#formSuccess");
  const contactSubmitBtn = $("#contactSubmitBtn");

  function validateContact() {
    clearAllErrors(contactForm);
    let ok = true;
    const en = L();
    const name = $("#fname")?.value.trim() || "";
    const email = $("#femail")?.value.trim() || "";
    const message = $("#fmessage")?.value.trim() || "";
    const honeypot = $('input[name="website"]', contactForm)?.value || "";

    if (!name) { showError("fname", en ? "Please enter your full name." : "يرجى كتابة الاسم الكامل."); ok = false; }
    if (!email) { showError("femail", en ? "Please enter your email." : "يرجى كتابة البريد الإلكتروني."); ok = false; }
    else if (!isEmail(email)) { showError("femail", en ? "Please enter a valid email." : "يرجى إدخال بريد إلكتروني صحيح."); ok = false; }
    if (!message) { showError("fmessage", en ? "Please enter your message." : "يرجى كتابة نص الرسالة."); ok = false; }
    if (honeypot) ok = false;

    return ok;
  }

  contactForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateContact()) return;

    const payload = {
      name: $("#fname")?.value.trim() || "",
      phone: $("#fphone")?.value.trim() || "",
      email: $("#femail")?.value.trim() || "",
      subject: $("#fsubject")?.value || "",
      message: $("#fmessage")?.value.trim() || ""
    };

    const originalHTML = contactSubmitBtn?.innerHTML;
    if (contactSubmitBtn) {
      contactSubmitBtn.disabled = true;
      contactSubmitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>${L() ? "Sending..." : "جاري الإرسال..."}</span>`;
    }

    try {
      const res = await fetch(CONFIG.apiEndpoints.contact, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("contact failed");
      contactForm.reset();
      if (formSuccess) {
        formSuccess.classList.add("show");
        setTimeout(() => formSuccess.classList.remove("show"), 7000);
      }
    } catch {
      const pending = safeStorage.getJSON(CONFIG.storageKeys.pendingContacts, []);
      pending.push({ ...payload, createdAt: new Date().toISOString(), offline: true });
      safeStorage.setJSON(CONFIG.storageKeys.pendingContacts, pending);
      contactForm.reset();
      if (formSuccess) {
        formSuccess.querySelector("strong").textContent = L() ? "Saved on this device! ✨" : "تم حفظ رسالتك على الجهاز! ✨";
        formSuccess.querySelector("span").textContent = L() ? "Server unavailable; message stored locally." : "الخادم غير متاح؛ تم حفظ الرسالة محلياً.";
        formSuccess.classList.add("show");
        setTimeout(() => formSuccess.classList.remove("show"), 7000);
      }
    } finally {
      if (contactSubmitBtn) {
        contactSubmitBtn.disabled = false;
        contactSubmitBtn.innerHTML = originalHTML || `<span>${L() ? "Send Message" : "إرسال الرسالة"}</span> <i class="fa-solid fa-paper-plane"></i>`;
      }
    }
  });

  // ==========================================
  // 12. SCROLL-TO-TOP BUTTON
  // ==========================================
  const scrollTopBtn = $("#scrollTopBtn");
  if (scrollTopBtn) {
    window.addEventListener("scroll", () => {
      scrollTopBtn.classList.toggle("visible", window.scrollY > 500);
    }, { passive: true });

    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ==========================================
  // Re-apply translations on language toggle for dynamic texts
  // ==========================================
  window.addEventListener("insan:langchange", () => {
    updateThemeToggleLabel();
    if (autoIndicatorText) {
      const txt = isPaused ? "controls.autoplay.paused" : "controls.autoplay";
      autoIndicatorText.textContent = t(txt, htmlRoot.dataset.lang);
    }
  });

})();