/**
 * Aatzy Build Mobile App — Onboarding & Login Controller
 * Handles page navigation, swipe gestures, and login form interactions.
 */

(function () {
    'use strict';

    // ===== DOM REFERENCES =====
    const pagesWrapper = document.getElementById('pagesWrapper');
    const pageIndicators = document.getElementById('pageIndicators');
    const indicators = document.querySelectorAll('.indicator');
    const nextBtn = document.getElementById('nextBtn');
    const skipBtn = document.getElementById('skipBtn');
    const onboardingContainer = document.getElementById('onboardingContainer');
    const loginContainer = document.getElementById('loginContainer');
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const profileContainer = document.getElementById('profileContainer');
    const profileForm = document.getElementById('profileForm');
    const backToLoginBtn = document.getElementById('backToLoginBtn');
    const projectsContainer = document.getElementById('projectsContainer');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarDrawer = document.getElementById('sidebarDrawer');
    const sidebarClose = document.getElementById('sidebarClose');
    const sidebarLogout = document.getElementById('sidebarLogout');

    // ===== STATE =====
    let currentPage = 0;
    const totalPages = 4;
    let touchStartX = 0;
    let touchEndX = 0;
    let isSwiping = false;

    // ===== PAGE NAVIGATION =====
    function goToPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= totalPages) return;
        currentPage = pageIndex;

        // Slide pages
        pagesWrapper.style.transform = `translateX(-${currentPage * 25}%)`;

        // Update indicators
        indicators.forEach((ind, i) => {
            ind.classList.toggle('active', i === currentPage);
        });

        // Update button text
        if (currentPage === totalPages - 1) {
            nextBtn.innerHTML = `
                <span class="btn-text">Get Started</span>
                <svg class="btn-arrow" viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
            `;
            nextBtn.classList.remove('next-btn');
            nextBtn.classList.add('get-started-btn');
            skipBtn.classList.add('hidden');
        } else {
            nextBtn.innerHTML = `
                <span class="btn-text">Next</span>
                <svg class="btn-arrow" viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
            `;
            nextBtn.classList.add('next-btn');
            nextBtn.classList.remove('get-started-btn');
            skipBtn.classList.remove('hidden');
        }

        // Add entering animation class
        const activePage = document.getElementById(`page-${currentPage}`);
        if (activePage) {
            activePage.classList.remove('page-entering');
            void activePage.offsetWidth; // force reflow
            activePage.classList.add('page-entering');
        }
    }

    function nextPage() {
        if (currentPage < totalPages - 1) {
            goToPage(currentPage + 1);
        } else {
            showLogin();
        }
    }

    function showLogin() {
        // Add exit animation to onboarding
        onboardingContainer.classList.add('exit');

        // Show login after a brief delay
        setTimeout(() => {
            loginContainer.classList.add('active');
        }, 200);
    }

    // ===== EVENT LISTENERS =====

    // Next / Get Started button
    nextBtn.addEventListener('click', nextPage);

    // Skip button → go directly to login
    skipBtn.addEventListener('click', showLogin);

    // Indicator click
    indicators.forEach((ind) => {
        ind.addEventListener('click', () => {
            const page = parseInt(ind.getAttribute('data-page'), 10);
            goToPage(page);
        });
    });

    // ===== TOUCH/SWIPE SUPPORT =====
    pagesWrapper.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        isSwiping = true;
    }, { passive: true });

    pagesWrapper.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        touchEndX = e.changedTouches[0].screenX;
    }, { passive: true });

    pagesWrapper.addEventListener('touchend', () => {
        if (!isSwiping) return;
        isSwiping = false;

        const diff = touchStartX - touchEndX;
        const threshold = 50;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                // Swipe left → next page
                if (currentPage < totalPages - 1) {
                    goToPage(currentPage + 1);
                }
            } else {
                // Swipe right → previous page
                if (currentPage > 0) {
                    goToPage(currentPage - 1);
                }
            }
        }

        touchStartX = 0;
        touchEndX = 0;
    }, { passive: true });

    // ===== KEYBOARD NAV (for desktop testing) =====
    document.addEventListener('keydown', (e) => {
        if (loginContainer.classList.contains('active')) return;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            nextPage();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentPage > 0) goToPage(currentPage - 1);
        }
    });

    // ===== LOGIN FORM =====
    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const passwordInput = document.getElementById('password');
            const eyeOpen = togglePassword.querySelector('.eye-open');
            const eyeClosed = togglePassword.querySelector('.eye-closed');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeOpen.style.display = 'none';
                eyeClosed.style.display = 'block';
            } else {
                passwordInput.type = 'password';
                eyeOpen.style.display = 'block';
                eyeClosed.style.display = 'none';
            }
        });
    }

    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const loginBtn = document.getElementById('loginBtn');
            loginBtn.classList.add('loading');

            // Simulate login and transition to profile completion screen
            setTimeout(() => {
                loginBtn.classList.remove('loading');
                loginContainer.classList.remove('active');
                if (profileContainer) {
                    profileContainer.classList.add('active');
                }
            }, 1200);
        });
    }

    // Back to Login button from profile completion
    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', () => {
            if (profileContainer && loginContainer) {
                profileContainer.classList.remove('active');
                loginContainer.classList.add('active');
            }
        });
    }

    // ===== PROFILE FORM → PROJECTS DASHBOARD =====
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const profileSubmitBtn = document.getElementById('profileSubmitBtn');
            if (profileSubmitBtn) {
                profileSubmitBtn.classList.add('loading');
            }

            // Simulate profile save and transition to Projects dashboard
            setTimeout(() => {
                if (profileSubmitBtn) {
                    profileSubmitBtn.classList.remove('loading');
                }
                profileContainer.classList.remove('active');
                if (projectsContainer) {
                    projectsContainer.classList.add('active');
                }
            }, 1200);
        });
    }

    // ===== SIDEBAR DRAWER =====
    function openSidebar() {
        if (sidebarOverlay) sidebarOverlay.classList.add('active');
        if (sidebarDrawer) sidebarDrawer.classList.add('active');
    }

    function closeSidebar() {
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        if (sidebarDrawer) sidebarDrawer.classList.remove('active');
    }

    // Hamburger button opens sidebar
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', openSidebar);
    }

    // Close sidebar via X button
    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }

    // Close sidebar via overlay click
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Logout → go back to login
    if (sidebarLogout) {
        sidebarLogout.addEventListener('click', () => {
            closeSidebar();
            setTimeout(() => {
                if (projectsContainer) projectsContainer.classList.remove('active');
                if (loginContainer) loginContainer.classList.add('active');
            }, 300);
        });
    }

    // ===== INITIALIZE =====
    goToPage(0);

})();
