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
  const citySelect = document.getElementById('city'); // Nuevo: selector de ciudad
  const errorNombre = document.getElementById('error-nombre');
  const errorServicio = document.getElementById('error-servicio');
  const errorFecha = document.getElementById('error-fecha');
  const errorHora = document.getElementById('error-hora');
  const errorCity = document.getElementById('error-city');

  // Set min date for the date input to today
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  fecha.min = `${year}-${month}-${day}`;

  let allNotionServices = []; // Almacenará todos los servicios de Notion

  function updateServiceOptions(filteredServices) {
    const selectedService = servicio.value;
    servicio.innerHTML = ''; // Clear current options
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "Selecciona un servicio";
    servicio.appendChild(defaultOption);

    filteredServices.forEach(service => {
      // Asumo que el responsable de Coruña es nomomo1602@gmail.com
      // Y el responsable de Madrid es iago.bernardezgomez@gmail.com
      const selectedCity = citySelect.value === 'coruna' ? 'coruna' : 'madrid';
      const isCoruna = selectedCity === 'coruna';
      const isMadrid = selectedCity === 'madrid';

      const responsibleForCoruna = 'nomomo1602@gmail.com';
      const responsibleForMadrid = 'iago.bernardezgomez@gmail.com';

      // Si es Coruña y el servicio es de nomomo, o si es Madrid y el servicio es de iago
      const shouldDisplayService = (
        (isCoruna && service.responsible === responsibleForCoruna) ||
        (isMadrid && service.responsible === responsibleForMadrid)
      );

      if (shouldDisplayService) {
        if (domicilio.checked && service.title === 'Presoterapia') {
          return; // Skip Presoterapia if domicilio is checked
        }
        const option = document.createElement('option');
        option.value = service.title; // Usar el título del servicio como valor
        option.textContent = service.title;
        servicio.appendChild(option);
      }
    });
    // Restore previously selected service if it's still available
    if (Array.from(servicio.options).some(option => option.value === selectedService)) {
      servicio.value = selectedService;
    } else {
      servicio.value = ""; // Reset if the selected service is no longer available
    }
  }

  function filterServicesByCity() {
    const selectedCity = citySelect.value === 'coruna' ? 'coruna' : 'madrid';
    const responsibleForCity = selectedCity === 'coruna' ? 'nomomo1602@gmail.com' : 'iago.bernardezgomez@gmail.com';

    const filteredServices = allNotionServices.filter(service => 
      service.responsible === responsibleForCity
    );
    updateServiceOptions(filteredServices);

    // Lógica para deshabilitar domicilio si es Madrid
    if (selectedCity === 'madrid') {
      domicilio.checked = false; // Desmarcar si estaba marcado
      domicilio.disabled = true; // Deshabilitar el checkbox
    } else {
      domicilio.disabled = false; // Habilitar en Coruña
    }
  }

  if (citySelect) {
    citySelect.addEventListener('change', filterServicesByCity);
  }
  domicilio.addEventListener('change', () => updateServiceOptions(allNotionServices.filter(s => s.responsible === (citySelect.value === 'coruna' ? 'nomomo1602@gmail.com' : 'iago.bernardezgomez@gmail.com'))));

  function clearErrors() {
    errorNombre.textContent = '';
    errorServicio.textContent = '';
    errorFecha.textContent = '';
    errorHora.textContent = '';
    errorCity.textContent = '';
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();
    let valid = true;

    // No necesitamos validar el cityToggle directamente aquí, ya que siempre tiene un valor (checked/unchecked)

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
    const selectedCityName = citySelect.value === 'coruna' ? 'A Coruña' : 'Madrid'; // Nombre de la ciudad para el mensaje
    const whatsappPhoneNumber = selectedCityName === 'A Coruña' ? '34622529042' : '34686886334'; // Número según ciudad
    let message = `¡Hola! Me gustaría reservar un/a ${servicio.value} para el día ${fecha.value} a las ${hora.value} en ${selectedCityName}. Mi nombre es ${nombre.value}.`;
    if (domicilio.checked && !domicilio.disabled) {
      message += ` El servicio es a domicilio.`;
    }
    const whatsappUrl = `https://wa.me/${whatsappPhoneNumber}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');

    // Optionally clear the form after sending WhatsApp
    form.reset();
    success.hidden = true; // Hide success message
  });

  // Cargar servicios de Notion y luego inicializar el formulario
  fetch('/.netlify/functions/get-notion-services')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(services => {
      allNotionServices = services; // Guardar todos los servicios
      filterServicesByCity(); // Inicializar el filtrado de servicios
    })
    .catch(error => console.error('Error loading Notion services:', error));

})();

// Footer year
(function () {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();


