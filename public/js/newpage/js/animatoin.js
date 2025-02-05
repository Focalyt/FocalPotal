
document.addEventListener('DOMContentLoaded', function() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Animate title first
                const title = entry.target.querySelector('.primary-gradient');
                if (title) title.classList.add('animate');
                
                // Then animate tech items with a slight initial delay
                setTimeout(() => {
                    const items = entry.target.querySelectorAll('.tech_area_img');
                    items.forEach(item => {
                        item.classList.add('animate');
                    });
                }, 200);
            } else {
                // Reset animations when completely out of view
                const title = entry.target.querySelector('.primary-gradient');
                const items = entry.target.querySelectorAll('.tech_area_img');
                
                // Small delay before removing classes to ensure smooth reset
                setTimeout(() => {
                    if (title) title.classList.remove('animate');
                    items.forEach(item => {
                        item.classList.remove('animate');
                    });
                }, 150);
            }
        });
    }, {
        threshold: 0.15 // Triggers slightly earlier
    });

    // Start observing the section
    const section = document.getElementById('new');
    if (section) {
        observer.observe(section);
    }
});

// next

document.addEventListener('DOMContentLoaded', function() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Reset and replay animations
                const section = entry.target;
                section.style.opacity = "0";
                void section.offsetWidth; // Trigger reflow
                section.style.opacity = "1";
                
                // Find and reset all animated elements
                const animatedElements = section.querySelectorAll('.nav-item, .how_focal, figure img');
                animatedElements.forEach(el => {
                    el.style.animation = 'none';
                    void el.offsetWidth; // Trigger reflow
                    el.style.animation = null;
                });
            }
        });
    }, {
        threshold: 0.2
    });

    // Start observing the section
    const section = document.getElementById('main-screen');
    if (section) {
        observer.observe(section);
    }

    // Add animation when changing tabs
    const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabButtons.forEach(button => {
        button.addEventListener('shown.bs.tab', (e) => {
            const targetPane = document.querySelector(e.target.dataset.bsTarget);
            if (targetPane) {
                const img = targetPane.querySelector('img');
                if (img) {
                    img.style.animation = 'none';
                    void img.offsetWidth; // Trigger reflow
                    img.style.animation = 'scaleIn 0.8s ease-out forwards';
                }
            }
        });
    });
});