// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerHeight = document.querySelector('header') ? document.querySelector('header').offsetHeight : 0;
            const targetPosition = target.offsetTop - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all sections for animation
document.querySelectorAll('.section').forEach(section => {
    observer.observe(section);
});

// Mobile menu toggle function
function toggleMenu() {
    const menu = document.getElementById('menu');
    if (!menu) return;
    
    if (menu.style.display === 'none' || menu.style.display === '') {
        menu.style.display = 'flex';
        menu.style.flexDirection = 'column';
        menu.style.position = 'absolute';
        menu.style.top = '100%';
        menu.style.left = '0';
        menu.style.width = '100%';
        menu.style.background = 'white';
        menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        menu.style.padding = '20px';
        menu.style.zIndex = '1000';
    } else {
        menu.style.display = '';
        menu.style.position = '';
        menu.style.background = '';
        menu.style.boxShadow = '';
        menu.style.padding = '';
    }
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const menu = document.getElementById('menu');
    const icon = document.querySelector('.icon-placeholder');
    
    if (!menu || !icon) return;
    
    if (!menu.contains(event.target) && !icon.contains(event.target)) {
        if (window.innerWidth <= 768) {
            menu.style.display = '';
            menu.style.position = '';
            menu.style.background = '';
            menu.style.boxShadow = '';
            menu.style.padding = '';
        }
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    const menu = document.getElementById('menu');
    if (!menu) return;
    
    if (window.innerWidth > 768) {
        menu.style.display = '';
        menu.style.position = '';
        menu.style.background = '';
        menu.style.boxShadow = '';
        menu.style.padding = '';
    }
});

// Add active class to current navigation item
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.menu a[href^="#"]');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 220;
        const sectionHeight = section.clientHeight;
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.style.color = '#c89238';
        if (link.getAttribute('href') === `#${current}`) {
            link.style.color = '#bd8a30';
            link.style.fontWeight = 'bold';
        }
    });
});

// Service cards hover effect enhancement
const serviceCards = document.querySelectorAll('.service-card');
serviceCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.borderLeft = '4px solid #d4af37';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.borderLeft = 'none';
    });
});

// Initialize page animations
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.service-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
    
    setTimeout(() => {
        if (document.body) {
            document.body.classList.add('loaded');
        }
    }, 100);

    // Initialize IntersectionObserver for .anim elements (if any)
    const animObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.anim').forEach(section => {
        animObserver.observe(section);
    });
});