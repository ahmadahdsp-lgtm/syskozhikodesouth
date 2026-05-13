document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    const navCollapseEl = document.getElementById('navbarNav');

    // Sticky Navbar on Scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Smooth scrolling for navigation links + close mobile menu
    document.querySelectorAll('.navbar .nav-link[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            document.querySelectorAll('.navbar .nav-link').forEach(link => {
                link.classList.remove('active');
                link.removeAttribute('aria-current');
            });
            this.classList.add('active');
            this.setAttribute('aria-current', 'page');

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }

            if (navCollapseEl && window.bootstrap?.Collapse) {
                const { Collapse } = window.bootstrap;
                let collapse = Collapse.getInstance(navCollapseEl);
                if (!collapse) {
                    collapse = new Collapse(navCollapseEl, { toggle: false });
                }
                if (navCollapseEl.classList.contains('show')) {
                    collapse.hide();
                }
            }
        });
    });
});
