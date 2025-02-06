
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

// animation on scrolls 

  document.addEventListener('DOMContentLoaded', function() {
      // Get all elements that need to be animated
      const elements = document.querySelectorAll('.animate-on-scroll');
      
      // Create observer
      const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
              // Add animation classes when element is in view
              if (entry.isIntersecting) {
                  entry.target.classList.add('animate-active');
              } else {
                  // Remove classes when element is out of view - this enables repeat animations
                  entry.target.classList.remove('animate-active');
              }
          });
      }, {
          threshold: 0.1 // Trigger when at least 10% of the element is visible
      });
  
      // Observe all elements
      elements.forEach(element => {
          observer.observe(element);
      });
  });
  
//   2nd 


  document.addEventListener('DOMContentLoaded', function() {
      // Parallax effect on scroll
      window.addEventListener('scroll', function() {
          const scrolled = window.pageYOffset;
          const rightImage = document.querySelector('.elementor_widget_image');
          if (rightImage) {
              rightImage.style.transform = `translateY(${scrolled * 0.1}px)`;
          }
      });
  
      // Optional: Add intersection observer for animations when elements come into view
      const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
              if (entry.isIntersecting) {
                  entry.target.style.animationPlayState = 'running';
              }
          });
      }, {
          threshold: 0.1
      });
  
      // Observe elements
      document.querySelectorAll('.icon-container, .elementor_widget_image, .new_font_edit h2, .tagline')
          .forEach(el => observer.observe(el));
  });
  
//   3rd

document.addEventListener('DOMContentLoaded', function() {
    // Get all elements to animate
    const elements = document.querySelectorAll('.labs-desc');
    
    // Add animation classes
    elements.forEach(section => {
        // Add base animation classes
        section.querySelector('.desc_img')?.classList.add('animate-on-scrolls', 'zoom-in');
        section.querySelector('.desc_img_content')?.classList.add('animate-on-scroll');
        
        // Add directional animations based on layout
        if (section.querySelector('.desc_img')?.nextElementSibling) {
            section.querySelector('.desc_img_content')?.classList.add('slide-left');
        } else {
            section.querySelector('.desc_img_content')?.classList.add('slide-right');
        }
        
        // Add animation classes to content elements
        section.querySelectorAll('.desc_sub_header, .desc_para, .book_a_demo').forEach(el => {
            el.classList.add('animate-on-scroll', 'slide-up');
        });
    });
    
    // Create intersection observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add active class to main section
                entry.target.classList.add('animate-active');
                
                // Add active class to all animated children
                entry.target.querySelectorAll('.animate-on-scroll').forEach(el => {
                    el.classList.add('animate-active');
                });
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    });
    
    // Observe all lab sections
    elements.forEach(section => {
        observer.observe(section);
    });
    
    // Add hover effect for buttons
    document.querySelectorAll('.a_btn').forEach(btn => {
        btn.addEventListener('mouseover', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.style.setProperty('--x', x + 'px');
            this.style.setProperty('--y', y + 'px');
        });
    });
});

// 4th 

      document.addEventListener('DOMContentLoaded', function() {
          // Get all elements to animate
          const elements = document.querySelectorAll('.labs-desc');
          
          // Add animation classes
          elements.forEach(section => {
              // Add base animation classes
              section.querySelector('.desc_img')?.classList.add('animate-on-scroll', 'zoom-in');
              section.querySelector('.desc_img_content')?.classList.add('animate-on-scroll');
              
              // Add directional animations based on layout
              if (section.querySelector('.desc_img')?.nextElementSibling) {
                  section.querySelector('.desc_img_content')?.classList.add('slide-left');
              } else {
                  section.querySelector('.desc_img_content')?.classList.add('slide-right');
              }
              
              // Add animation classes to content elements
              section.querySelectorAll('.desc_sub_header, .desc_para, .book_a_demo').forEach(el => {
                  el.classList.add('animate-on-scroll', 'slide-up');
              });
          });
          
          // Create intersection observer
          const observer = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                  if (entry.isIntersecting) {
                      // Add active class to main section
                      entry.target.classList.add('animate-active');
                      
                      // Add active class to all animated children
                      entry.target.querySelectorAll('.animate-on-scroll').forEach(el => {
                          el.classList.add('animate-active');
                      });
                  }
              });
          }, {
              threshold: 0.2,
              rootMargin: '0px 0px -100px 0px'
          });
          
          // Observe all lab sections
          elements.forEach(section => {
              observer.observe(section);
          });
          
          // Add hover effect for buttons
          document.querySelectorAll('.a_btn').forEach(btn => {
              btn.addEventListener('mouseover', function(e) {
                  const rect = this.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  
                  this.style.setProperty('--x', x + 'px');
                  this.style.setProperty('--y', y + 'px');
              });
          });
      });
     
    //   <!-- why choose focalyt  -->
    
        document.addEventListener('DOMContentLoaded', function() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const title = entry.target.querySelector('.whychoosefocal');
                    if (title) {
                        // Split the text while preserving the gradient span
                        const text = title.innerHTML;
                        title.innerHTML = '';
                        
                        // Create a wrapper for the animated text
                        const wrapper = document.createElement('div');
                        wrapper.innerHTML = text;
                        title.appendChild(wrapper);
                        
                        // Add animation classes
                        title.classList.add('animate');
                    }
                } else {
                    // Reset animation
                    const title = entry.target.querySelector('.whychoosefocal');
                    if (title) {
                        title.classList.remove('animate');
                    }
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: '-50px'
        });
    
        // Observe the whychoose section
        const whyChooseSection = document.getElementById('whychoose');
        if (whyChooseSection) {
            observer.observe(whyChooseSection);
        }
    });
     
    document.addEventListener('DOMContentLoaded', function() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Add animate class to each column
                    const columns = entry.target.querySelectorAll('.col-md-4');
                    columns.forEach((column, index) => {
                        const whyChooseSec = column.querySelector('.why_choose_sec');
                        if (whyChooseSec) {
                            setTimeout(() => {
                                whyChooseSec.classList.add('animate');
                            }, index * 200); // Stagger the animation
                        }
                    });
                } else {
                    // Remove animate class when leaving view
                    const columns = entry.target.querySelectorAll('.col-md-4');
                    columns.forEach(column => {
                        const whyChooseSec = column.querySelector('.why_choose_sec');
                        if (whyChooseSec) {
                            whyChooseSec.classList.remove('animate');
                        }
                    });
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '-50px'
        });
    
        // Observe the whychoose section
        const whyChooseSection = document.getElementById('whychoose');
        if (whyChooseSection) {
            observer.observe(whyChooseSection);
        }
    });
    
    // <!-- sills  -->

  document.addEventListener('DOMContentLoaded', () => {
    const roles = document.querySelectorAll('#skills .role');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                setTimeout(() => {
                    entry.target.classList.add('animate');
                }, index * 200);
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of the element is visible
    });

    // Observe each role element
    roles.forEach(role => observer.observe(role));
});

document.addEventListener('DOMContentLoaded', () => {
    const roles = document.querySelectorAll('#skills .role');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of the element is visible
    });

    // Observe each role element
    roles.forEach(role => observer.observe(role));
});

  document.addEventListener('DOMContentLoaded', function() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const title = entry.target.querySelector('.content-title');
                if (title) {
                    // Original text from the title
                    const text = title.textContent.trim();
                    
                    // Clear existing content
                    title.innerHTML = '';
                    
                    text.split('').forEach((char, index) => {
                        const span = document.createElement('span');
                        span.textContent = char === ' ' ? '\u00A0' : char; // Use non-breaking space for spaces
                        span.style.opacity = '0';
                        span.style.display = 'inline-block';
                        span.style.transform = 'translateY(100%)';
                        span.style.animation = `revealText 0.8s ${index * 0.1}s cubic-bezier(0.77, 0, 0.175, 1) forwards`;
                        title.appendChild(span);
                    });
                    
                    title.classList.add('animate');
                }
            } else {
                // Reset animation
                const title = entry.target.querySelector('.content-title');
                if (title) {
                    title.classList.remove('animate');
                    title.innerHTML = text; // Restore original text
                }
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '-50px'
    });

    // Select all new-small-screen sections
    const newSmallScreenSections = document.querySelectorAll('.new-small-screen');
    newSmallScreenSections.forEach(section => observer.observe(section));
});

// <!-- focal does  -->

  document.addEventListener('DOMContentLoaded', function() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const title = entry.target.querySelector('.content-title');
                if (title) {
                    // Split text into individual characters
                    const text = title.textContent;
                    title.textContent = '';
                    
                    // Create spans for each character
                    text.split('').forEach((char, index) => {
                        const span = document.createElement('span');
                        span.textContent = char;
                        span.style.opacity = '0';
                        span.style.display = 'inline-block';
                        span.style.transform = 'translateY(100%)';
                        span.style.animation = `revealText 0.8s ${index * 0.05}s cubic-bezier(0.77, 0, 0.175, 1) forwards`;
                        title.appendChild(span);
                    });
                    
                    // Add animation class for underline effect
                    title.classList.add('animate');
                }
            } else {
                const title = entry.target.querySelector('.content-title');
                if (title) {
                    title.classList.remove('animate');
                    title.textContent = 'What Focalyt Does'; // Reset to original text
                }
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '-50px'
    });

    const section = document.getElementById('small-screen');
    if (section) {
        observer.observe(section);
    }
});
 

{/* //  slider  */}

document.addEventListener('DOMContentLoaded', function() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const title = entry.target.querySelector('.content-title');
                if (title) {
                    // Original text with added spacing
                    const text = 'What Focalyt Does';
                    
                    // Clear existing content
                    title.innerHTML = '';
                    
                    text.split('').forEach((char, index) => {
                        const span = document.createElement('span');
                        span.textContent = char === ' ' ? '\u00A0' : char; // Use non-breaking space for spaces
                        span.style.opacity = '0';
                        span.style.display = 'inline-block';
                        span.style.transform = 'translateY(100%)';
                        span.style.animation = `revealText 0.8s ${index * 0.1}s cubic-bezier(0.77, 0, 0.175, 1) forwards`;
                        title.appendChild(span);
                    });
                    
                    title.classList.add('animate');

                    // Calculate total time for title animation
                    const titleAnimationDuration = (text.length * 0.1 + 0.8) * 1000;

                    // Start slider animations after title completes
                    setTimeout(() => {
                        const sliderItems = entry.target.querySelectorAll('#how_sliderdual2 > div');
                        sliderItems.forEach((item, index) => {
                            setTimeout(() => {
                                // Animate the container
                                item.classList.add('animate');
                                
                                // Animate the image
                                const figure = item.querySelector('figure');
                                if (figure) figure.classList.add('animate');
                                
                                // Animate the content
                                const content = item.querySelector('.feature-widget-7');
                                if (content) content.classList.add('animate');
                            }, index * 400); // 400ms delay between each item
                        });
                    }, titleAnimationDuration); // Wait for title animation to complete
                }
            } else {
                // Reset animations
                const title = entry.target.querySelector('.content-title');
                const sliderItems = entry.target.querySelectorAll('#how_sliderdual2 > div');
                const figures = entry.target.querySelectorAll('figure');
                
                if (title) {
                    title.classList.remove('animate');
                    title.innerHTML = 'What Focalyt Does';
                }
                
                sliderItems.forEach(item => item.classList.remove('animate'));
                figures.forEach(figure => figure.classList.remove('animate'));
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '-50px'
    });

    const section = document.getElementsByClassName('small-screen');
    if (section && section.length > 0) {
        observer.observe(section[0]);
    }
}); 
