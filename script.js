// Smooth scroll with offset for sticky header
(function () {
  const header = document.querySelector('.header');
  const headerHeight = () => (header ? header.offsetHeight : 0);

  function smoothScrollTo(targetId) {
    const el = document.querySelector(targetId);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - headerHeight() - 8;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#' || href.length < 2) return;
      const targetId = href;
      const isSamePageAnchor = targetId.startsWith('#');
      if (isSamePageAnchor) {
        e.preventDefault();
        smoothScrollTo(targetId);
      }
    });
  });
})();

// Mobile nav toggle accessibility
(function () {
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.getElementById('primary-menu');
  if (!toggle || !menu) return;

  function setExpanded(expanded) {
    toggle.setAttribute('aria-expanded', String(expanded));
    menu.setAttribute('aria-expanded', String(expanded));
  }

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    setExpanded(!expanded);
  });

  // Close menu on link click (mobile)
  menu.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => setExpanded(false))
  );
})();

// Booking form validation and confirmation
(function () {
  const form = document.getElementById('booking-form');
  const success = document.getElementById('booking-success');
  if (!form || !success) return;

  const nombre = document.getElementById('nombre');
  const servicio = document.getElementById('servicio');
  const fecha = document.getElementById('fecha');
  const errorNombre = document.getElementById('error-nombre');
  const errorServicio = document.getElementById('error-servicio');
  const errorFecha = document.getElementById('error-fecha');

  function clearErrors() {
    errorNombre.textContent = '';
    errorServicio.textContent = '';
    errorFecha.textContent = '';
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();
    let valid = true;

    if (!nombre.value.trim()) {
      errorNombre.textContent = 'Por favor, escribe tu nombre.';
      valid = false;
    }
    if (!servicio.value) {
      errorServicio.textContent = 'Selecciona un servicio.';
      valid = false;
    }
    if (!fecha.value) {
      errorFecha.textContent = 'Elige una fecha.';
      valid = false;
    }

    if (!valid) return;

    // Construct WhatsApp message
    const phoneNumber = '34600123456'; // Phone number without + or spaces
    const message = encodeURIComponent(
      `¡Hola! Me gustaría reservar un/a ${servicio.value} para el día ${fecha.value}. Mi nombre es ${nombre.value}.`
    );
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');

    // Optionally clear the form after sending WhatsApp
    form.reset();
    success.hidden = true; // Hide success message
  });
})();

// Footer year
(function () {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();


