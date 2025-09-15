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

// Add/remove 'scrolled' class to header on scroll
(function () {
  const header = document.querySelector('.header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) { // Adjust this threshold as needed
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
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
  const hora = document.getElementById('hora');
  const domicilio = document.getElementById('domicilio');
  const errorNombre = document.getElementById('error-nombre');
  const errorServicio = document.getElementById('error-servicio');
  const errorFecha = document.getElementById('error-fecha');
  const errorHora = document.getElementById('error-hora');

  // Set min date for the date input to today
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  fecha.min = `${year}-${month}-${day}`;

  const allServices = Array.from(servicio.options).map(option => ({ value: option.value, text: option.textContent }));

  function updateServiceOptions() {
    const selectedService = servicio.value;
    servicio.innerHTML = ''; // Clear current options
    allServices.forEach(service => {
      if (domicilio.checked && service.value === 'Presoterapia') {
        return; // Skip Presoterapia if domicilio is checked
      }
      const option = document.createElement('option');
      option.value = service.value;
      option.textContent = service.text;
      servicio.appendChild(option);
    });
    // Restore previously selected service if it's still available
    if (Array.from(servicio.options).some(option => option.value === selectedService)) {
      servicio.value = selectedService;
    } else {
      servicio.value = ""; // Reset if the selected service is no longer available
    }
  }

  domicilio.addEventListener('change', updateServiceOptions);
  updateServiceOptions(); // Initial call to set options based on initial checkbox state

  function clearErrors() {
    errorNombre.textContent = '';
    errorServicio.textContent = '';
    errorFecha.textContent = '';
    errorHora.textContent = '';
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
    if (!hora.value) {
      errorHora.textContent = 'Selecciona una hora.';
      valid = false;
    }

    if (!valid) return;

    // Construct WhatsApp message
    const whatsappPhoneNumber = '34625081739'; // Phone number without + or spaces
    let message = `¡Hola! Me gustaría reservar un/a ${servicio.value} para el día ${fecha.value} a las ${hora.value}. Mi nombre es ${nombre.value}.`;
    if (domicilio.checked) {
      message += ` El servicio es a domicilio.`;
    }
    const whatsappUrl = `https://wa.me/${whatsappPhoneNumber}?text=${encodeURIComponent(message)}`;

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


