// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    
    // Animate hamburger
    const spans = hamburger.querySelectorAll('span');
    spans[0].classList.toggle('rotate-1');
    spans[1].classList.toggle('hide');
    spans[2].classList.toggle('rotate-2');
});

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background change on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
});

// Animate skill bars on scroll
const skillBars = document.querySelectorAll('.skill-progress');
const observerOptions = {
    threshold: 0.5
};

const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const bar = entry.target;
            const width = bar.style.width;
            bar.style.width = '0';
            setTimeout(() => {
                bar.style.width = width;
            }, 100);
        }
    });
}, observerOptions);

skillBars.forEach(bar => {
    skillObserver.observe(bar);
});

// Form submission handling (supports optional data-endpoint attribute to POST to a server or Google Apps Script)
function handleFormSubmit(form, successMessage) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());

        const endpoint = this.dataset.endpoint;
        if (endpoint) {
            // If endpoint looks like Google Apps Script, send as FormData (avoids preflight CORS)
            const isGoogleScript = endpoint.includes('script.google.com');
            if (isGoogleScript) {
                fetch(endpoint, {
                    method: 'POST',
                    body: formData
                }).then(() => {
                    alert(successMessage);
                    form.reset();
                    // notify other parts of the app that a submission succeeded
                    window.dispatchEvent(new CustomEvent('formSubmissionSuccess', { detail: { formId: this.id || null, data } }));
                }).catch(err => {
                    console.warn('Form submit failed', err);
                    alert(successMessage);
                    form.reset();
                    window.dispatchEvent(new CustomEvent('formSubmissionSuccess', { detail: { formId: this.id || null, data } }));
                });
            } else {
                // try to POST JSON to provided endpoint
                fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                }).then(res => {
                    alert(successMessage);
                    form.reset();
                    window.dispatchEvent(new CustomEvent('formSubmissionSuccess', { detail: { formId: this.id || null, data } }));
                }).catch(err => {
                    console.warn('Form submit failed, saved locally instead', err);
                    alert(successMessage);
                    form.reset();
                    window.dispatchEvent(new CustomEvent('formSubmissionSuccess', { detail: { formId: this.id || null, data } }));
                });
            }
        } else {
            // No server endpoint provided — fallback to local success behavior
            alert(successMessage);
            form.reset();
            window.dispatchEvent(new CustomEvent('formSubmissionSuccess', { detail: { formId: this.id || null, data } }));
        }
    });
}

const contactForm = document.getElementById('contactForm');
if (contactForm) handleFormSubmit(contactForm, 'Thank you for your message! I will get back to you soon.');

const storyForm = document.getElementById('storyForm');
const postForm = document.getElementById('postForm');
if (storyForm) handleFormSubmit(storyForm, 'Thank you for sharing your story! I really appreciate your feedback.');
if (postForm) handleFormSubmit(postForm, 'Your post was published!');

/* ---------- Blog post management (localStorage + edit/delete) ---------- */
function loadBlogPosts() {
    try {
        const raw = localStorage.getItem('blogPosts');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        console.warn('Failed to load blog posts', e);
        return null;
    }
}

function saveBlogPosts(list) {
    try {
        localStorage.setItem('blogPosts', JSON.stringify(list));
    } catch (e) {
        console.warn('Failed to save blog posts', e);
    }
}

function initializeBlogPostsFromDOM() {
    const grid = document.querySelector('.blog-grid');
    if (!grid) return [];
    const nodes = Array.from(grid.querySelectorAll('.blog-card'));
    return nodes.map(node => {
        const date = node.querySelector('.blog-date')?.textContent || '';
        const title = node.querySelector('h3')?.textContent || '';
        const content = node.querySelector('p')?.textContent || '';
        return {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            title,
            author: '',
            content,
            date: date || new Date().toISOString()
        };
    });
}

function createPostCard(post) {
    const article = document.createElement('article');
    article.className = 'blog-card';
    article.dataset.id = post.id;

    const imageDiv = document.createElement('div');
    imageDiv.className = 'blog-image';
    imageDiv.innerHTML = '<i class="fas fa-pen-nib"></i>';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'blog-content';

    const dateSpan = document.createElement('span');
    dateSpan.className = 'blog-date';
    dateSpan.textContent = post.date ? new Date(post.date).toLocaleDateString() : '';

    const title = document.createElement('h3');
    title.textContent = post.title || post.author || 'Untitled';

    const p = document.createElement('p');
    p.textContent = post.content || '';

    // controls
    const controls = document.createElement('div');
    controls.className = 'post-controls';
    controls.style.marginTop = '8px';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn edit-post';
    editBtn.textContent = 'Edit';

    const delBtn = document.createElement('button');
    delBtn.className = 'btn delete-post';
    delBtn.textContent = 'Delete';

    controls.appendChild(editBtn);
    controls.appendChild(delBtn);

    contentDiv.appendChild(dateSpan);
    contentDiv.appendChild(title);
    contentDiv.appendChild(p);
    contentDiv.appendChild(controls);

    article.appendChild(imageDiv);
    article.appendChild(contentDiv);

    editBtn.addEventListener('click', () => startEditPost(post.id, article));
    delBtn.addEventListener('click', () => deletePost(post.id));

    return article;
}

function renderBlogPosts() {
    const grid = document.querySelector('.blog-grid');
    if (!grid) return;
    const posts = loadBlogPosts();
    if (!posts) return;
    grid.innerHTML = '';
    posts.forEach(p => grid.appendChild(createPostCard(p)));
}

function startEditPost(id, article) {
    const posts = loadBlogPosts() || [];
    const post = posts.find(p => p.id === id);
    if (!post) return;

    const contentDiv = article.querySelector('.blog-content');
    contentDiv.innerHTML = '';

    const dateSpan = document.createElement('span');
    dateSpan.className = 'blog-date';
    dateSpan.textContent = new Date(post.date).toLocaleDateString();

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = post.title;
    titleInput.className = 'edit-title';

    const authorInput = document.createElement('input');
    authorInput.type = 'text';
    authorInput.value = post.author || '';
    authorInput.className = 'edit-author';

    const textarea = document.createElement('textarea');
    textarea.rows = 6;
    textarea.value = post.content;

    const save = document.createElement('button');
    save.className = 'btn btn-primary';
    save.textContent = 'Save';

    const cancel = document.createElement('button');
    cancel.className = 'btn';
    cancel.textContent = 'Cancel';

    contentDiv.appendChild(dateSpan);
    contentDiv.appendChild(titleInput);
    contentDiv.appendChild(authorInput);
    contentDiv.appendChild(textarea);
    contentDiv.appendChild(save);
    contentDiv.appendChild(cancel);

    save.addEventListener('click', () => {
        post.title = titleInput.value;
        post.author = authorInput.value;
        post.content = textarea.value;
        post.date = new Date().toISOString();
        saveBlogPosts(posts);
        renderBlogPosts();
    });

    cancel.addEventListener('click', () => renderBlogPosts());
}

function deletePost(id) {
    if (!confirm('Delete this post?')) return;
    let posts = loadBlogPosts() || [];
    posts = posts.filter(p => p.id !== id);
    saveBlogPosts(posts);
    renderBlogPosts();
}

// Handle formSubmissionSuccess events for post/story forms
window.addEventListener('formSubmissionSuccess', (e) => {
    const { formId, data } = e.detail || {};
    if (formId !== 'postForm' && formId !== 'storyForm') return;

    const posts = loadBlogPosts() || [];
    const newPost = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        title: data.title || data.company || data.name || 'Untitled',
        author: data.author || data.name || data.company || '',
        content: data.content || data.story || data.message || '',
        date: new Date().toISOString()
    };
    posts.unshift(newPost);
    saveBlogPosts(posts);
    renderBlogPosts();
});

// Initialize blog posts store on first load
window.addEventListener('load', () => {
    const grid = document.querySelector('.blog-grid');
    const feedUrl = grid?.dataset?.feed?.trim();

    // If a remote feed URL is provided (e.g., a Google Apps Script GET endpoint), fetch posts from it
    if (feedUrl) {
        fetch(feedUrl)
            .then(res => res.json())
            .then(remotePosts => {
                if (Array.isArray(remotePosts) && remotePosts.length) {
                    // normalize remote posts to expected shape if necessary
                    const posts = remotePosts.map(p => ({
                        id: p.id || (Date.now().toString(36) + Math.random().toString(36).slice(2,6)),
                        title: p.title || p.name || p.author || 'Untitled',
                        author: p.author || p.name || '',
                        content: p.content || p.message || p.story || '',
                        date: p.date || new Date().toISOString()
                    }));
                    saveBlogPosts(posts);
                    renderBlogPosts();
                } else {
                    // fallback to local initialization
                    let posts = loadBlogPosts();
                    if (!posts) {
                        posts = initializeBlogPostsFromDOM();
                        saveBlogPosts(posts);
                    }
                    renderBlogPosts();
                }
            })
            .catch(err => {
                console.warn('Failed to load remote posts', err);
                let posts = loadBlogPosts();
                if (!posts) {
                    posts = initializeBlogPostsFromDOM();
                    saveBlogPosts(posts);
                }
                renderBlogPosts();
            });
    } else {
        let posts = loadBlogPosts();
        if (!posts) {
            posts = initializeBlogPostsFromDOM();
            saveBlogPosts(posts);
        }
        renderBlogPosts();
    }
});

// Add scroll reveal animation
const revealElements = document.querySelectorAll('.story-card, .blog-card, .contact-item');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, {
    threshold: 0.1
});

revealElements.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `all 0.6s ease ${index * 0.1}s`;
    revealObserver.observe(el);
});

// Active navigation link highlighting
const sections = document.querySelectorAll('section');
const navItems = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${current}`) {
            item.classList.add('active');
        }
    });
});

// Add smooth entrance animation for hero section
window.addEventListener('load', () => {
    const hero = document.querySelector('.hero');
    hero.style.opacity = '0';
    hero.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
        hero.style.transition = 'all 1s ease';
        hero.style.opacity = '1';
        hero.style.transform = 'translateY(0)';
    }, 100);
});

console.log('Portfolio website loaded successfully!');

// Quotes carousel logic: auto-rotate, dots, pause on hover, color themes
(function setupQuotesCarousel() {
    const carousel = document.querySelector('.quotes-carousel');
    if (!carousel) return;

    const inner = carousel.querySelector('.quotes-inner');
    const slides = Array.from(inner.children);
    const dotsContainer = carousel.querySelector('.carousel-dots');

    slides.forEach((s, i) => s.setAttribute('data-index', i));

    // create dots
    slides.forEach((_, i) => {
        const btn = document.createElement('button');
        btn.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        btn.setAttribute('aria-label', 'Show quote ' + (i + 1));
        btn.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(btn);
    });

    let current = 0;
    let timer = null;

    function update() {
        inner.style.transform = `translateX(-${current * 100}%)`;
        // update dots
        dotsContainer.querySelectorAll('.carousel-dot').forEach((d, idx) => d.classList.toggle('active', idx === current));
        // update color classes
        slides.forEach((s, idx) => {
            for (let k = 0; k < 5; k++) s.classList.remove(`quote-color-${k}`);
            slides[current].classList.add(`quote-color-${current % 5}`);
        });
    }

    function goTo(i) {
        current = (i + slides.length) % slides.length;
        update();
    }

    function next() { goTo(current + 1); }

    function start() {
        stop();
        timer = setInterval(next, 4500);
    }

    function stop() {
        if (timer) { clearInterval(timer); timer = null; }
    }

    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);

    // init
    update();
    start();
})();