/**
 * Aatzy Build — App Controller v3 (Sidebar + Flow Fix)
 */
(function () {
  'use strict';

  const appShell = document.getElementById('appShell');
  const navStack = [];
  let currentScreen = 'onboardingContainer';

  // ─────────────────────────────────────────
  // AUTH STATE — sidebar only after this
  // ─────────────────────────────────────────
  function setAuthenticated() {
    appShell.classList.add('authenticated');
  }
  function clearAuthenticated() {
    appShell.classList.remove('authenticated');
  }

  function getUserRole() {
    var phone = localStorage.getItem('aatzy_active_user');
    if (!phone) return 'admin';
    var profiles = JSON.parse(localStorage.getItem('aatzy_profiles') || '{}');
    return (profiles[phone] && profiles[phone].role) || 'admin';
  }

  function applySidebarGating() {
    var role = getUserRole();
    var items = document.querySelectorAll('[data-roles]');
    for (var i = 0; i < items.length; i++) {
      var allowed = items[i].getAttribute('data-roles').split(',');
      items[i].style.display = allowed.indexOf(role) !== -1 ? '' : 'none';
    }
  }

  // ─────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────
  window.navigateTo = function (screenId, addToStack) {
    if (addToStack === undefined) addToStack = true;
    const prevEl = document.getElementById(currentScreen);
    if (prevEl) prevEl.classList.remove('active');
    const nextEl = document.getElementById(screenId);
    if (!nextEl) { console.warn('Screen not found:', screenId); return; }
    nextEl.classList.add('active');
    const body = nextEl.querySelector('.screen-body');
    if (body) body.scrollTop = 0;
    if (screenId === 'profileViewScreen' && window.populateProfileView) {
      window.populateProfileView();
    }
    if (screenId === 'markAttendanceScreen') {
      var activeUser = localStorage.getItem('aatzy_active_user');
      if (activeUser) {
        var profiles = JSON.parse(localStorage.getItem('aatzy_profiles') || '{}');
        var profile = profiles[activeUser];
        if (profile && profile.fullName) {
          var firstName = profile.fullName.split(' ')[0];
          var attGreeting = document.getElementById('attGreetingHi');
          if (attGreeting) {
            attGreeting.textContent = 'Good Morning, ' + firstName + ' 👋';
          }
        }
      }
    }
    if (screenId === 'leaveScreen' && window.populateLeaveManagement) {
      window.populateLeaveManagement();
    }
    if (addToStack) navStack.push(screenId);
    currentScreen = screenId;
  };

  window.goBack = function () {
    if (navStack.length <= 1) return;
    navStack.pop();
    const prev = navStack[navStack.length - 1];
    navigateTo(prev, false);
  };

  // ─────────────────────────────────────────
  // ONBOARDING
  // ─────────────────────────────────────────
  let currentPage = 0;
  const totalPages = 4;
  let touchStartX = 0, touchEndX = 0, isSwiping = false;
  const pagesWrapper = document.getElementById('pagesWrapper');
  const indicators = document.querySelectorAll('.indicator');
  const nextBtn = document.getElementById('nextBtn');
  const skipBtn = document.getElementById('skipBtn');

  function goToPage(idx) {
    if (idx < 0 || idx >= totalPages) return;
    currentPage = idx;
    if (pagesWrapper) pagesWrapper.style.transform = 'translateX(-' + (currentPage * 25) + '%)';
    indicators.forEach(function (ind, i) { ind.classList.toggle('active', i === currentPage); });
    if (nextBtn) {
      if (currentPage === totalPages - 1) {
        nextBtn.innerHTML = '<span class="btn-text">Get Started</span>';
        nextBtn.className = 'nav-btn get-started-btn';
        if (skipBtn) skipBtn.classList.add('hidden');
      } else {
        nextBtn.innerHTML = '<span class="btn-text">Next</span><svg class="btn-arrow" viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>';
        nextBtn.className = 'nav-btn next-btn';
        if (skipBtn) skipBtn.classList.remove('hidden');
      }
    }
  }

  function showLogin() { navigateTo('loginContainer'); }

  if (nextBtn) nextBtn.addEventListener('click', function () {
    if (currentPage < totalPages - 1) goToPage(currentPage + 1);
    else showLogin();
  });
  if (skipBtn) skipBtn.addEventListener('click', showLogin);
  indicators.forEach(function (ind) {
    ind.addEventListener('click', function () {
      goToPage(parseInt(ind.getAttribute('data-page') || '0', 10));
    });
  });

  // Touch swipe
  if (pagesWrapper) {
    pagesWrapper.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX; isSwiping = true;
    }, { passive: true });
    pagesWrapper.addEventListener('touchmove', function (e) {
      if (isSwiping) touchEndX = e.changedTouches[0].screenX;
    }, { passive: true });
    pagesWrapper.addEventListener('touchend', function () {
      if (!isSwiping) return; isSwiping = false;
      var diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0 && currentPage < totalPages - 1) goToPage(currentPage + 1);
        else if (diff < 0 && currentPage > 0) goToPage(currentPage - 1);
      }
      touchStartX = 0; touchEndX = 0;
    }, { passive: true });
  }

  // Init
  appShell.classList.remove('authenticated');
  var initOverlay = document.getElementById('sidebarOverlay');
  var initDrawer = document.getElementById('sidebarDrawer');
  if (initOverlay) initOverlay.classList.remove('active');
  if (initDrawer) initDrawer.classList.remove('active');

  goToPage(0);
  navStack.push('onboardingContainer');
  document.getElementById('onboardingContainer').classList.add('active');

  // ─────────────────────────────────────────
  // LOGIN & AUTH
  // ─────────────────────────────────────────
  var getOtpBtn = document.getElementById('getOtpBtn');
  var loginBtn = document.getElementById('loginBtn');
  var otpGroup = document.getElementById('otpGroup');
  var loginPhone = document.getElementById('loginPhone');
  var loginOtp = document.getElementById('loginOtp');
  var loginForm = document.getElementById('loginForm');

  if (getOtpBtn) {
    getOtpBtn.addEventListener('click', function () {
      if (!loginPhone.value || loginPhone.value.length < 10) {
        showToast('Please enter a valid phone number');
        return;
      }
      getOtpBtn.innerHTML = '<span>Sending...</span>';
      getOtpBtn.disabled = true;
      setTimeout(function () {
        getOtpBtn.style.display = 'none';
        otpGroup.style.display = 'block';
        loginBtn.style.display = 'flex';
        showToast('OTP sent to ' + loginPhone.value);
      }, 800);
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var phone = loginPhone.value;
      if (!loginOtp.value) {
        showToast('Please enter OTP');
        return;
      }
      loginBtn.innerHTML = '<span>Verifying...</span>';
      loginBtn.disabled = true;
      setTimeout(function () {
        loginBtn.innerHTML = '<span>Sign In</span><svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>';
        loginBtn.disabled = false;
        
        var profiles = JSON.parse(localStorage.getItem('aatzy_profiles') || '{}');
        if (profiles[phone]) {
          localStorage.setItem('aatzy_active_user', phone);
          setAuthenticated();
          var role = profiles[phone].role || 'admin';
          applySidebarGating();
          if (role === 'admin' || role === 'project_manager') {
            navigateTo('projectsScreen');
          } else if (role === 'client') {
            navigateTo('projectDetailScreen');
          } else {
            // Site Engineer & Supervisor go here
            populateWorkerDashboard(profiles[phone], phone);
            navigateTo('workerDashboardScreen');
          }
          showToast('Welcome back, ' + profiles[phone].fullName + '!');
        } else {
          // Check if this phone was pre-assigned by admin
          var assignments = JSON.parse(localStorage.getItem('aatzy_assignments') || '{}');
          var assignedRole = null;
          var assignedName = '';
          for (var projId in assignments) {
            var members = assignments[projId].members || [];
            for (var m = 0; m < members.length; m++) {
              if (members[m].phone === phone) {
                assignedRole = members[m].role;
                assignedName = members[m].name;
                break;
              }
            }
            if (assignedRole) break;
          }
          var profPhone = document.getElementById('phoneNumber');
          if (profPhone) {
            profPhone.value = phone;
            profPhone.readOnly = true;
          }
          if (assignedRole) {
            // Pre-fill name from assignment
            var fnInput = document.getElementById('fullName');
            if (fnInput && assignedName) fnInput.value = assignedName;
            // Store temp role for profile save
            localStorage.setItem('aatzy_pending_role', assignedRole);
          }
          navigateTo('profileContainer');
        }
      }, 1100);
    });
  }

  // ─────────────────────────────────────────
  // PROFILE SETUP
  // ─────────────────────────────────────────
  var backToLoginBtn = document.getElementById('backToLoginBtn');
  if (backToLoginBtn) {
    backToLoginBtn.addEventListener('click', function () { goBack(); });
  }

  var profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = document.getElementById('profileSubmitBtn');
      btn.innerHTML = '<span>Saving...</span>';
      btn.disabled = true;
      
      var phone = document.getElementById('phoneNumber').value;
      var fullName = document.getElementById('fullName').value;
      var email = document.getElementById('profileEmail').value;
      var username = document.getElementById('username').value;
      var companyName = document.getElementById('companyName').value;
      var pendingRole = localStorage.getItem('aatzy_pending_role') || 'admin';
      localStorage.removeItem('aatzy_pending_role');

      setTimeout(function () {
        btn.innerHTML = '<span>Continue</span>';
        btn.disabled = false;
        
        var profiles = JSON.parse(localStorage.getItem('aatzy_profiles') || '{}');
        profiles[phone] = {
          fullName: fullName,
          email: email,
          username: username,
          companyName: companyName,
          role: pendingRole
        };
        localStorage.setItem('aatzy_profiles', JSON.stringify(profiles));
        localStorage.setItem('aatzy_active_user', phone);
        
        setAuthenticated();
        applySidebarGating();
        if (pendingRole === 'admin' || pendingRole === 'project_manager') {
          navigateTo('projectsScreen');
        } else if (pendingRole === 'client') {
          navigateTo('projectDetailScreen');
        } else {
          // Site Engineer & Supervisor
          populateWorkerDashboard(profiles[phone], phone);
          navigateTo('workerDashboardScreen');
        }
        showToast('Profile created successfully!');
      }, 900);
    });
  }

  window.populateProfileView = function() {
    var activeUser = localStorage.getItem('aatzy_active_user');
    if (!activeUser) return;
    var profiles = JSON.parse(localStorage.getItem('aatzy_profiles') || '{}');
    var profile = profiles[activeUser];
    if (profile) {
      var avEl = document.getElementById('pvAvatar');
      if (avEl && profile.fullName) {
        var parts = profile.fullName.trim().split(' ');
        var initials = parts.length > 1 ? parts[0][0] + parts[parts.length-1][0] : profile.fullName.substring(0, 2);
        avEl.textContent = initials.toUpperCase();
      }
      var fnEl = document.getElementById('pvFullName'); if (fnEl) fnEl.textContent = profile.fullName || '';
      var emEl = document.getElementById('pvEmail'); if (emEl) emEl.textContent = profile.email || '';
      var unEl = document.getElementById('pvUsername'); if (unEl) unEl.textContent = profile.username || '';
      var phEl = document.getElementById('pvPhone'); if (phEl) phEl.textContent = activeUser;
      var coEl = document.getElementById('pvCompany'); if (coEl) coEl.textContent = profile.companyName || '';
    }
  };

  function populateWorkerDashboard(profile, phone) {
    var roleLabels = { project_manager: 'Project Manager', site_engineer: 'Site Engineer', supervisor: 'Supervisor', labour: 'Labour' };
    var firstName = (profile.fullName || 'Worker').split(' ')[0];
    var avEl = document.getElementById('wdAvatar');
    if (avEl && profile.fullName) {
      var parts = profile.fullName.trim().split(' ');
      var initials = parts.length > 1 ? parts[0][0] + parts[parts.length-1][0] : profile.fullName.substring(0, 2);
      avEl.textContent = initials.toUpperCase();
    }
    var greetEl = document.getElementById('wdGreeting');
    if (greetEl) greetEl.textContent = 'Hello, ' + firstName + '!';
    var badgeEl = document.getElementById('wdRoleBadge');
    if (badgeEl) {
      badgeEl.textContent = roleLabels[profile.role] || profile.role;
      var badgeColors = { project_manager: '#4A9EFF', site_engineer: '#10B981', supervisor: '#F5A623', labour: '#8B5CF6' };
      badgeEl.style.background = (badgeColors[profile.role] || '#8B5CF6') + '22';
      badgeEl.style.color = badgeColors[profile.role] || '#8B5CF6';
    }
    // Show/hide quick actions based on role
    var actions = document.querySelectorAll('#wdQuickActions .wq-action');
    for (var i = 0; i < actions.length; i++) {
      var action = actions[i].getAttribute('data-action');
      if (profile.role === 'labour') {
        // Labour can only see tasks
        if (action === 'photos' || action === 'indent') actions[i].style.display = 'none';
        if (!action) actions[i].style.display = 'none'; // hide attendance
      } else if (profile.role === 'supervisor') {
        // Supervisor: attendance + tasks, no indent/photos
        if (action === 'indent' || action === 'photos') actions[i].style.display = 'none';
      }
      // site_engineer and PM see everything
    }
  }
  window.populateWorkerDashboard = populateWorkerDashboard;

  // ─────────────────────────────────────────
  // SIDEBAR — only works when authenticated
  // ─────────────────────────────────────────
  window.openSidebar = function () {
    if (!appShell.classList.contains('authenticated')) return;
    var overlay = document.getElementById('sidebarOverlay');
    var drawer = document.getElementById('sidebarDrawer');
    if (overlay) overlay.classList.add('active');
    if (drawer) drawer.classList.add('active');
  };

  window.closeSidebar = function () {
    var overlay = document.getElementById('sidebarOverlay');
    var drawer = document.getElementById('sidebarDrawer');
    if (overlay) overlay.classList.remove('active');
    if (drawer) drawer.classList.remove('active');
  };

  window.sidebarGo = function (screenId) {
    closeSidebar();
    setTimeout(function () { navigateTo(screenId); }, 280);
  };

  // ─────────────────────────────────────────
  // BOTTOM SHEETS
  // ─────────────────────────────────────────
  window.openSheet = function (sheetId) {
    var s = document.getElementById(sheetId);
    var o = document.getElementById(sheetId + 'Overlay');
    if (s) s.classList.add('active');
    if (o) o.classList.add('active');
  };

  window.openCrmAdd = function(type) {
    var titleEl = document.getElementById('crmAddTitle');
    if (titleEl) titleEl.innerText = 'Add ' + type;
    window.openSheet('addCrmItemSheet');
  };
  window.closeSheet = function (sheetId) {
    var s = document.getElementById(sheetId);
    var o = document.getElementById(sheetId + 'Overlay');
    if (s) s.classList.remove('active');
    if (o) o.classList.remove('active');
  };

  // ─────────────────────────────────────────
  // TABS
  // ─────────────────────────────────────────
  window.switchTab = function (btn, paneId, barId) {
    var bar = document.getElementById(barId);
    if (bar) {
      var btns = bar.querySelectorAll('.tab-btn, .sub-tab');
      for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
    }
    btn.classList.add('active');
    var pane = document.getElementById(paneId);
    if (!pane) return;
    var parent = pane.parentElement;
    for (var j = 0; j < parent.children.length; j++) {
      var child = parent.children[j];
      if (child.classList.contains('tab-pane') || child.classList.contains('sub-pane')) {
        child.classList.remove('active');
      }
    }
    pane.classList.add('active');
  };

  // ─────────────────────────────────────────
  // TOGGLES / CHIPS / SWITCHES
  // ─────────────────────────────────────────
  window.selectToggle = function (btn) {
    var group = btn.closest('.toggle-group');
    if (!group) return;
    var opts = group.querySelectorAll('.toggle-opt');
    for (var i = 0; i < opts.length; i++) opts[i].classList.remove('active');
    btn.classList.add('active');
  };

  window.filterChip = function (btn) {
    var parent = btn.closest('.chip-filters');
    if (!parent) return;
    var chips = parent.querySelectorAll('.chip');
    for (var i = 0; i < chips.length; i++) chips[i].classList.remove('active');
    btn.classList.add('active');
  };

  window.toggleSwitch = function (el) { el.classList.toggle('on'); };

  // ─────────────────────────────────────────
  // GPS LOCATION
  // ─────────────────────────────────────────
  window.getLocation = function (latId, lngId) {
    var latEl = document.getElementById(latId);
    var lngEl = lngId ? document.getElementById(lngId) : null;
    if (!latEl) return;
    latEl.placeholder = 'Fetching…';
    var fallback = function () { latEl.value = '13.082700'; if (lngEl) lngEl.value = '80.270700'; };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (pos) { latEl.value = pos.coords.latitude.toFixed(6); if (lngEl) lngEl.value = pos.coords.longitude.toFixed(6); },
        fallback, { timeout: 5000 }
      );
    } else { setTimeout(fallback, 600); }
  };

  // ─────────────────────────────────────────
  // MARK ATTENDANCE
  // ─────────────────────────────────────────
  var attLocFetched = false, attPhotoTaken = false;

  function tickClock() {
    var el = document.getElementById('attTimeBadge');
    if (el) el.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    var de = document.getElementById('attDateDisplay');
    if (de) de.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  setInterval(tickClock, 1000); tickClock();

  window.fetchLocation = function () {
    var btn = document.getElementById('getLocationBtn');
    if (!btn) return;
    btn.innerHTML = 'Fetching…'; btn.disabled = true;
    var done = function (lat, lng) {
      attLocFetched = true;
      var box = document.getElementById('locationCaptureBox');
      if (box) box.style.display = 'none';
      var suc = document.getElementById('locationSuccess');
      if (suc) { suc.classList.remove('hidden'); }
      var txt = document.getElementById('locationText');
      if (txt) txt.textContent = lat + '° N, ' + lng + '° E';
      updateMarkBtn();
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (p) { done(p.coords.latitude.toFixed(4), p.coords.longitude.toFixed(4)); },
        function () { done('13.0827', '80.2707'); },
        { timeout: 6000 }
      );
    } else { setTimeout(function () { done('13.0827', '80.2707'); }, 600); }
  };

  window.capturePhoto = function () {
    var inp = document.getElementById('selfieInput');
    if (inp) inp.click();
  };

  window.showSelfiePreview = function (input) {
    if (!input.files || !input.files[0]) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      attPhotoTaken = true;
      var box = document.getElementById('cameraCaptureBox');
      if (box) box.style.display = 'none';
      var suc = document.getElementById('cameraSuccess');
      if (suc) suc.classList.remove('hidden');
      var img = document.getElementById('selfiePreview');
      if (img) img.src = e.target.result;
      updateMarkBtn();
    };
    reader.readAsDataURL(input.files[0]);
  };

  function updateMarkBtn() {
    var btn = document.getElementById('markAttBtn');
    var err = document.getElementById('attErrorBox');
    if (!btn) return;
    var ready = attLocFetched && attPhotoTaken;
    btn.disabled = !ready;
    if (err) {
      if (!ready) {
        err.classList.remove('hidden');
        var missing = [];
        if (!attLocFetched) missing.push('location');
        if (!attPhotoTaken) missing.push('selfie photo');
        var txt = document.getElementById('attErrorText');
        if (txt) txt.textContent = 'Please capture ' + missing.join(' and ') + ' to mark attendance.';
      } else {
        err.classList.add('hidden');
      }
    }
  }

  window.markAttendance = function () {
    if (!attLocFetched || !attPhotoTaken) { updateMarkBtn(); return; }
    var btn = document.getElementById('markAttBtn');
    btn.innerHTML = '✔ Attendance Marked!';
    btn.style.background = 'var(--green)';
    btn.disabled = true;
    showToast('Attendance marked successfully! ✅');
    setTimeout(function () {
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Mark Attendance';
      btn.style.background = '';
      btn.disabled = true;
      attLocFetched = false; attPhotoTaken = false;
      var lBox = document.getElementById('locationCaptureBox'); if (lBox) lBox.style.display = '';
      var cBox = document.getElementById('cameraCaptureBox'); if (cBox) cBox.style.display = '';
      var lSuc = document.getElementById('locationSuccess'); if (lSuc) lSuc.classList.add('hidden');
      var cSuc = document.getElementById('cameraSuccess'); if (cSuc) cSuc.classList.add('hidden');
      var locBtn = document.getElementById('getLocationBtn');
      if (locBtn) { locBtn.disabled = false; locBtn.textContent = 'Get Location'; }
    }, 3000);
  };

  // ─────────────────────────────────────────
  // APP LOCK / PIN
  // ─────────────────────────────────────────
  window.toggleAppLock = function (el) {
    el.classList.toggle('on');
    if (el.classList.contains('on')) {
      var modal = document.getElementById('pinModalOverlay');
      if (modal) { modal.classList.remove('hidden'); setTimeout(function () { var pi = document.querySelector('.pin-input'); if (pi) pi.focus(); }, 100); }
    }
  };

  var pinInputs = document.querySelectorAll('.pin-input');
  for (var pi = 0; pi < pinInputs.length; pi++) {
    (function (idx) {
      pinInputs[idx].addEventListener('input', function () {
        if (pinInputs[idx].value.length === 1 && pinInputs[idx + 1]) pinInputs[idx + 1].focus();
      });
      pinInputs[idx].addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !pinInputs[idx].value && pinInputs[idx - 1]) pinInputs[idx - 1].focus();
      });
    })(pi);
  }

  window.cancelPIN = function () {
    var m = document.getElementById('pinModalOverlay'); if (m) m.classList.add('hidden');
    var t = document.getElementById('appLockToggle'); if (t) t.classList.remove('on');
    for (var i = 0; i < pinInputs.length; i++) pinInputs[i].value = '';
  };

  window.confirmPIN = function () {
    var pin = '';
    for (var i = 0; i < pinInputs.length; i++) pin += pinInputs[i].value;
    if (pin.length < 4) { if (pinInputs[0]) pinInputs[0].focus(); return; }
    var m = document.getElementById('pinModalOverlay'); if (m) m.classList.add('hidden');
    for (var j = 0; j < pinInputs.length; j++) pinInputs[j].value = '';
    showToast('App Lock enabled 🔐');
  };

  // ─────────────────────────────────────────
  // MISC
  // ─────────────────────────────────────────
  window.toggleCustomVendor = function (cb) {
    var f = document.getElementById('customVendorField');
    if (f) f.classList.toggle('hidden', !cb.checked);
  };
  window.refreshDashboard = function () { showToast('Dashboard refreshed ✓'); };
  
  window.saveEditedProject = function () {
    var cPhone = document.getElementById('epClientPhone');
    var cName = document.getElementById('epClientName');
    
    if (cPhone && cPhone.value) {
      var profiles = JSON.parse(localStorage.getItem('aatzy_profiles') || '{}');
      if (!profiles[cPhone.value]) {
        profiles[cPhone.value] = {
          fullName: cName && cName.value ? cName.value : 'Client',
          role: 'client'
        };
      } else {
        profiles[cPhone.value].role = 'client';
        if (cName && cName.value) profiles[cPhone.value].fullName = cName.value;
      }
      localStorage.setItem('aatzy_profiles', JSON.stringify(profiles));
    }
    
    closeSheet('editProjectSheet');
    showToast('Project & Client Details Saved ✓');
  };
  window.assignTeamMember = function () {
    var phone = document.getElementById('assignPhone');
    var name = document.getElementById('assignName');
    var role = document.getElementById('assignRole');
    var payType = document.getElementById('assignPayType');
    var wage = document.getElementById('assignWage');
    
    if (!phone || !name || !phone.value || !name.value) {
      showToast('Please fill in phone and name');
      return;
    }
    
    var roleLabels = { project_manager: 'Project Manager', site_engineer: 'Site Engineer', supervisor: 'Supervisor', labour: 'Labour / Worker' };
    var roleBadgeClass = { project_manager: 'pm', site_engineer: 'eng', supervisor: 'sup', labour: 'lh' };
    var colors = ['#4A9EFF', '#10B981', '#F5A623', '#8B5CF6', '#EF4444', '#FE8E48'];
    var initials = name.value.split(' ').map(function(w){ return w[0]; }).join('').substring(0,2).toUpperCase();
    var col = colors[Math.floor(Math.random() * colors.length)];
    var roleVal = role ? role.value : 'labour';
    var payValStr = (payType && payType.value === 'daily') ? 'Daily Wage' : 'Monthly Salary';
    var wageValStr = (wage && wage.value) ? '₹' + wage.value : '-';

    var addProjScreen = document.getElementById('addProjectScreen');
    if (addProjScreen && addProjScreen.classList.contains('active')) {
      // In Create Project Wizard
      var cpTeamList = document.getElementById('cpTeamList');
      if (cpTeamList) {
        if (cpTeamList.querySelector('.info-box')) cpTeamList.innerHTML = '';
        var card = document.createElement('div');
        card.className = 'team-member-card';
        card.style.cssText = 'display:flex;flex-direction:column;align-items:flex-start;padding:12px;gap:8px;position:relative;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:12px;';
        card.innerHTML = '<div style="display:flex;align-items:center;width:100%;gap:12px;"><div class="avatar-md" style="background:' + col + '">' + initials + '</div><div class="tm-info"><p class="tm-name" style="font-size:14px;font-weight:600;margin:0 0 2px;color:var(--text);">' + name.value + '</p><p class="tm-role" style="font-size:12px;color:var(--text2);margin:0;">' + (roleLabels[roleVal] || roleVal) + '</p></div><button type="button" class="icon-btn" onclick="this.closest(\'.team-member-card\').remove()" style="margin-left:auto;padding:4px;"><svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" width="18" height="18"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button></div><div style="font-size:12px;color:var(--text2);display:flex;justify-content:space-between;width:100%;border-top:1px solid rgba(255,255,255,0.05);padding-top:8px;margin-top:4px;"><span>📞 +91 ' + phone.value + '</span><span>' + payValStr + ': ' + wageValStr + '</span></div>';
        cpTeamList.appendChild(card);
      }
    } else {
      // In Project Detail Dashboard
      // Save to assignments
      var assignments = JSON.parse(localStorage.getItem('aatzy_assignments') || '{}');
      var projKey = 'proj_current';
      if (!assignments[projKey]) assignments[projKey] = { name: 'Metro Towers Phase 2', members: [] };
      assignments[projKey].members.push({ phone: phone.value, name: name.value, role: roleVal });
      localStorage.setItem('aatzy_assignments', JSON.stringify(assignments));

      // Add card visually
      var teamList = document.querySelector('#tabOverview .screen-body.pad');
      if (teamList) {
        var dCard = document.createElement('div');
        dCard.className = 'team-member-card';
        dCard.innerHTML = '<div class="avatar-md" style="background:' + col + '">' + initials + '</div><div class="tm-info"><p class="tm-name">' + name.value + '</p><p class="tm-role">' + (roleLabels[roleVal] || roleVal) + '</p></div><span class="role-badge ' + (roleBadgeClass[roleVal] || 'lh') + '">' + (roleLabels[roleVal] || roleVal) + '</span>';
        teamList.appendChild(dCard);
      }
    }

    // Pre-register in profiles if not exists
    var profiles = JSON.parse(localStorage.getItem('aatzy_profiles') || '{}');
    if (!profiles[phone.value]) {
      profiles[phone.value] = { fullName: name.value, role: roleVal, assignedBy: localStorage.getItem('aatzy_active_user') || '' };
      localStorage.setItem('aatzy_profiles', JSON.stringify(profiles));
    }

    // Clear & close
    phone.value = ''; name.value = ''; if(wage) wage.value = '';
    closeSheet('assignTeamSheet');
    showToast('Team member assigned successfully! 👷');
  };
  window.toggleSortMenu = function () { showToast('Sort: Name / Quantity'); };
  window.toggleEditCompany = function () { showToast('Edit mode — coming soon'); };
  window.toggleEditProfile = function () { showToast('Edit mode — coming soon'); };

  window.addIndentItem = function () {
    var list = document.getElementById('indentItemsList');
    if (!list) return;
    var div = document.createElement('div');
    div.className = 'indent-item-row';
    div.innerHTML = '<div class="field-row" style="gap:8px"><div class="field-group" style="flex:1.2"><label class="field-label">Category</label><input class="field-input" type="text" placeholder="e.g. Steel"></div><div class="field-group" style="flex:1.5"><label class="field-label">Material Name</label><input class="field-input" type="text" placeholder="e.g. TMT 8mm"></div><div class="field-group" style="flex:0.8"><label class="field-label">Qty</label><input class="field-input" type="text" placeholder="50T"></div></div><div class="field-group"><label class="field-label">Description</label><input class="field-input" type="text" placeholder="Notes"></div>';
    list.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth' });
  };

  window.showUploadPreview = function (input, previewId) {
    var preview = document.getElementById(previewId);
    if (!preview || !input.files) return;
    preview.innerHTML = '';
    for (var i = 0; i < input.files.length; i++) {
      if (!input.files[i].type.startsWith('image/')) continue;
      (function (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
          var img = document.createElement('img');
          img.src = e.target.result; img.className = 'preview-thumb';
          preview.appendChild(img);
        };
        reader.readAsDataURL(file);
      })(input.files[i]);
    }
  };

  // ─────────────────────────────────────────
  // TASK STATUS MANAGEMENT
  // ─────────────────────────────────────────
  window.toggleTaskStatusFields = function() {
    var status = document.querySelector('input[name="taskStatus"]:checked').value;
    document.getElementById('taskCompletedFields').style.display = (status === 'completed') ? 'block' : 'none';
    document.getElementById('taskBlockedFields').style.display = (status === 'blocked') ? 'block' : 'none';
  };

  window.submitTaskStatus = function() {
    var status = document.querySelector('input[name="taskStatus"]:checked').value;
    if (window.activeTaskBtn) {
      if (status === 'completed') {
        window.activeTaskBtn.classList.add('done');
        window.activeTaskBtn.classList.remove('blocked');
        window.activeTaskBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>';
      } else {
        window.activeTaskBtn.classList.add('blocked');
        window.activeTaskBtn.classList.remove('done');
        window.activeTaskBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
        window.activeTaskBtn.style.color = '#EF4444';
        window.activeTaskBtn.style.borderColor = '#EF4444';
      }
      window.activeTaskBtn = null;
    }
    closeSheet('completeTaskSheet');
    showToast('Task status updated! ✓');
  };

  window.handleFileUpload = function(input) {
    if (input.files && input.files.length > 0) {
      var container = document.getElementById('filesListContainer');
      if (container) {
        for (var i = 0; i < input.files.length; i++) {
          var file = input.files[i];
          var ext = file.name.split('.').pop().toLowerCase();
          var typeClass = 'doc';
          var iconSvg = '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>';
          
          if (['png','jpg','jpeg','gif'].indexOf(ext) > -1) {
            typeClass = 'img';
            iconSvg = '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>';
          } else if (ext === 'pdf') {
            typeClass = 'pdf';
            iconSvg = '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>';
          }
          
          var sizeMB = (file.size / (1024*1024)).toFixed(2) + ' MB';
          var d = new Date();
          var dateStr = d.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
          
          var el = document.createElement('div');
          el.className = 'file-item';
          el.innerHTML = '<div class="file-icon ' + typeClass + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">' + iconSvg + '</svg></div><div class="file-info"><p class="file-name">' + file.name + '</p><p class="file-meta">' + sizeMB + ' &middot; ' + dateStr + '</p></div>';
          
          container.insertBefore(el, container.firstChild);
        }
        showToast('File(s) uploaded successfully!');
      }
    }
  };

  window.approveIndent = function() {
    var statusBadge = document.getElementById('indentDetailStatus');
    if(statusBadge) {
      statusBadge.className = 'status-badge approved';
      statusBadge.textContent = 'Approved';
    }
    var actions = document.getElementById('indentApprovalActions');
    if(actions) actions.style.display = 'none';
    
    closeSheet('indentDetailSheet');
    showToast('Indent Approved & Sent to PO processing ✓');
  };

  window.rejectIndent = function() {
    var statusBadge = document.getElementById('indentDetailStatus');
    if(statusBadge) {
      statusBadge.className = 'status-badge blocked';
      statusBadge.textContent = 'Rejected';
    }
    var actions = document.getElementById('indentApprovalActions');
    if(actions) actions.style.display = 'none';
    
    closeSheet('indentDetailSheet');
    showToast('Indent has been rejected.');
  };

  // ─────────────────────────────────────────
  // ADD PROJECT FORM
  // ─────────────────────────────────────────
  var addProjectForm = document.getElementById('addProjectForm');
  if (addProjectForm) {
    addProjectForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = addProjectForm.querySelector('.btn-primary');
      btn.textContent = 'Creating…'; btn.disabled = true;
      setTimeout(function () {
        // Save Client Profile if available
        var cpPhone = document.getElementById('cpClientPhone');
        var cpName = document.getElementById('cpClientName');
        if (cpPhone && cpPhone.value) {
          var profiles = JSON.parse(localStorage.getItem('aatzy_profiles') || '{}');
          if (!profiles[cpPhone.value]) {
            profiles[cpPhone.value] = {
              fullName: cpName && cpName.value ? cpName.value : 'Client',
              role: 'client'
            };
          } else {
            profiles[cpPhone.value].role = 'client';
            if (cpName && cpName.value) profiles[cpPhone.value].fullName = cpName.value;
          }
          localStorage.setItem('aatzy_profiles', JSON.stringify(profiles));
        }

        btn.textContent = 'Create Project'; btn.disabled = false;
        showToast('Project created! 🏗️');
        goBack();
      }, 900);
    });
  }

  // ─────────────────────────────────────────
  // LOGOUT — clear auth state
  // ─────────────────────────────────────────
  window.doLogout = function () {
    closeSidebar();
    setTimeout(function () {
      clearAuthenticated();
      localStorage.removeItem('aatzy_active_user');
      var screens = document.querySelectorAll('.screen');
      for (var i = 0; i < screens.length; i++) screens[i].classList.remove('active');
      navStack.length = 0;
      attLocFetched = false; attPhotoTaken = false;
      // Reset login form
      var lp = document.getElementById('loginPhone'); if (lp) lp.value = '';
      var lo = document.getElementById('loginOtp'); if (lo) lo.value = '';
      var og = document.getElementById('otpGroup'); if (og) og.style.display = 'none';
      var gb = document.getElementById('getOtpBtn'); if (gb) { gb.style.display = ''; gb.disabled = false; gb.innerHTML = '<span>Get OTP</span>'; }
      var lb = document.getElementById('loginBtn'); if (lb) lb.style.display = 'none';
      navigateTo('loginContainer');
    }, 300);
  };

  // ─────────────────────────────────────────
  // TOAST
  // ─────────────────────────────────────────
  var toastTimer;
  function showToast(msg) {
    var t = document.getElementById('_toast');
    if (!t) {
      t = document.createElement('div');
      t.id = '_toast';
      t.style.cssText = 'position:fixed;bottom:88px;left:50%;transform:translateX(-50%) translateY(20px);background:#1C1F35;border:1px solid rgba(255,255,255,0.12);color:#F0F0F5;padding:11px 20px;border-radius:12px;font-size:13px;font-weight:500;font-family:Inter,sans-serif;z-index:9999;opacity:0;transition:all 0.25s;box-shadow:0 8px 24px rgba(0,0,0,0.5);white-space:nowrap;pointer-events:none;max-width:320px';
      document.body.appendChild(t);
    }
    clearTimeout(toastTimer);
    t.textContent = msg;
    t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)';
    toastTimer = setTimeout(function () { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(20px)'; }, 2500);
  }
  window.showToast = showToast;

  // ─────────────────────────────────────────
  // ANIMATION INJECTION
  // ─────────────────────────────────────────
  var s = document.createElement('style');
  s.textContent = '@keyframes fadeSlide{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}.screen.active{animation:fadeSlide .25s ease forwards}.onb-wrap.active,.login-container.active,.profile-container.active{animation:none}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';
  document.head.appendChild(s);

  // ─────────────────────────────────────────
  // DATE DEFAULTS
  // ─────────────────────────────────────────
  var today = new Date().toISOString().split('T')[0];
  var dashFrom = document.getElementById('dashFrom');
  var dashTo = document.getElementById('dashTo');
  if (dashFrom) { var d = new Date(); d.setMonth(d.getMonth() - 1); dashFrom.value = d.toISOString().split('T')[0]; }
  if (dashTo) dashTo.value = today;

  // ─────────────────────────────────────────
  // LEAVE MANAGEMENT
  // ─────────────────────────────────────────
  window.populateLeaveManagement = function() {
    var activeUser = localStorage.getItem('aatzy_active_user');
    var role = getUserRole();
    var userProject = '';
    
    // Get user's assigned project if they are a worker
    if (['site_engineer', 'supervisor', 'labour'].indexOf(role) !== -1) {
      var assignments = JSON.parse(localStorage.getItem('aatzy_assignments') || '[]');
      for (var i = 0; i < assignments.length; i++) {
        if (assignments[i].phone === activeUser) {
          userProject = assignments[i].project;
          break;
        }
      }
    }

    // Dummy leave data (normally fetched from backend)
    var allLeaves = [
      { id: 1, name: 'Raj Kumar', role: 'Supervisor', initials: 'RK', color: '#F5A623', type: 'Sick Leave', dates: 'Jun 5, 2025 - Jun 7, 2025 (3 days)', reason: 'Not feeling well, fever.', status: 'pending', project: 'Metro Towers Phase 2' },
      { id: 2, name: 'Muthu Kumar', role: 'Labour', initials: 'MK', color: '#8B5CF6', type: 'Annual Leave', dates: 'Jun 14, 2025 - Jun 15, 2025 (2 days)', reason: 'Family function at hometown.', status: 'pending', project: 'Metro Towers Phase 2' },
      { id: 3, name: 'Priya Suresh', role: 'Site Engineer', initials: 'PS', color: '#10B981', type: 'Casual Leave', dates: 'Jun 10, 2025 - Jun 11, 2025 (2 days)', reason: '', status: 'approved', project: 'Sunrise Villa Phase 3' },
      { id: 4, name: 'Anand Vel', role: 'Labour', initials: 'AV', color: '#EF4444', type: 'Emergency Leave', dates: 'Jun 1, 2025 (1 day)', reason: '', status: 'rejected', project: 'Metro Towers Phase 2' },
    ];

    var pendingHtml = '';
    var approvedHtml = '';
    var rejectedHtml = '';

    for (var j = 0; j < allLeaves.length; j++) {
      var leave = allLeaves[j];
      
      // Filter logic: if user has a specific project, only show leaves for that project
      if (userProject && leave.project !== userProject) continue;

      if (leave.status === 'pending') {
        pendingHtml += '<div class="leave-req-card"><div class="leave-req-top"><div class="avatar-sm" style="background:'+leave.color+'">'+leave.initials+'</div><div><p class="leave-req-name">'+leave.name+' <span style="font-size: 11px; font-weight: 500; color: var(--text2);">('+leave.role+')</span></p><p class="leave-req-type">'+leave.type+'</p></div></div><p class="leave-req-dates">'+leave.dates+'</p><p class="leave-req-reason">"'+leave.reason+'"</p><div class="leave-req-actions"><button class="btn-reject-sm">Reject</button><button class="btn-approve-sm">Approve</button></div></div>';
      } else if (leave.status === 'approved') {
        approvedHtml += '<div class="leave-req-card approved-leave"><div class="leave-req-top"><div class="avatar-sm" style="background:'+leave.color+'">'+leave.initials+'</div><div><p class="leave-req-name">'+leave.name+' <span style="font-size: 11px; font-weight: 500; color: var(--text2);">('+leave.role+')</span></p><p class="leave-req-type">'+leave.type+'</p></div></div><p class="leave-req-dates">'+leave.dates+'</p><span class="status-badge approved">Approved</span></div>';
      } else if (leave.status === 'rejected') {
        rejectedHtml += '<div class="leave-req-card rejected-leave"><div class="leave-req-top"><div class="avatar-sm" style="background:'+leave.color+'">'+leave.initials+'</div><div><p class="leave-req-name">'+leave.name+' <span style="font-size: 11px; font-weight: 500; color: var(--text2);">('+leave.role+')</span></p><p class="leave-req-type">'+leave.type+'</p></div></div><p class="leave-req-dates">'+leave.dates+'</p><span class="status-badge rejected">Rejected</span></div>';
      }
    }

    if (!pendingHtml) pendingHtml = '<p style="color:var(--text2);font-size:13px;text-align:center;padding:20px;">No pending leave requests.</p>';
    if (!approvedHtml) approvedHtml = '<p style="color:var(--text2);font-size:13px;text-align:center;padding:20px;">No approved leaves.</p>';
    if (!rejectedHtml) rejectedHtml = '<p style="color:var(--text2);font-size:13px;text-align:center;padding:20px;">No rejected leaves.</p>';

    document.getElementById('leavePending').innerHTML = pendingHtml;
    document.getElementById('leaveApproved').innerHTML = approvedHtml;
    document.getElementById('leaveRejected').innerHTML = rejectedHtml;
  };

  // ─────────────────────────────────────────
  // CREATE PROJECT - MULTI-STEP WIZARD
  // ─────────────────────────────────────────
  var currentProjStep = 1;
  var totalProjSteps = 6;
  
  window.updateProjStepper = function() {
    for(var i=1; i<=totalProjSteps; i++) {
      var pane = document.getElementById('step-' + i);
      var indicator = document.getElementById('si-' + i);
      if(pane) pane.style.display = (i === currentProjStep) ? 'block' : 'none';
      if(indicator) {
        if(i < currentProjStep) {
          indicator.style.opacity = '1';
          indicator.querySelector('.step-circle').style.background = '#10B981'; // completed green
        } else if(i === currentProjStep) {
          indicator.style.opacity = '1';
          indicator.querySelector('.step-circle').style.background = 'var(--primary)'; // active
        } else {
          indicator.style.opacity = '0.5';
          indicator.querySelector('.step-circle').style.background = 'rgba(255,255,255,0.1)';
        }
      }
    }
    
    var btnBack = document.getElementById('cpBtnBack');
    var btnNext = document.getElementById('cpBtnNext');
    if(btnBack) btnBack.style.display = (currentProjStep === 1) ? 'none' : 'block';
    if(btnNext) btnNext.textContent = (currentProjStep === totalProjSteps) ? 'Publish Project' : 'Next';
    
    if(currentProjStep === totalProjSteps) {
      generateProjPreview();
    }
  };

  window.nextProjStep = function() {
    if(currentProjStep < totalProjSteps) {
      // Basic validation for Step 1
      if(currentProjStep === 1) {
        var name = document.getElementById('cpName');
        if(name && !name.value) { showToast('Project Name is required'); return; }
      }
      currentProjStep++;
      updateProjStepper();
      var wrap = document.querySelector('.stepper-wrap');
      if(wrap) wrap.scrollIntoView({behavior: 'smooth'});
    } else {
      // Publish
      showToast('Project Published Successfully! 🚀');
      setTimeout(function() { 
        goBack(); 
        currentProjStep = 1; 
        updateProjStepper(); 
        var form = document.getElementById('addProjectForm');
        if (form) form.reset();
        var teamList = document.getElementById('cpTeamList');
        if (teamList) teamList.innerHTML = '<div class="info-box" style="padding:16px; background:rgba(255,255,255,0.03); border:1px dashed rgba(255,255,255,0.1); border-radius:12px; text-align:center; color:var(--text2); font-size:13px;">Click "+ Assign" to add team members to this project.</div>';
        var instList = document.getElementById('cpInstallmentList');
        if (instList) instList.innerHTML = '<div class="field-row" style="margin-bottom:12px;"><input class="field-input" type="text" placeholder="Stage Name (e.g. Plinth)" style="flex:1"><input class="field-input" type="number" placeholder="₹ Amt" style="width:100px"></div>';
      }, 1500);
    }
  };

  window.prevProjStep = function() {
    if(currentProjStep > 1) {
      currentProjStep--;
      updateProjStepper();
      var wrap = document.querySelector('.stepper-wrap');
      if(wrap) wrap.scrollIntoView({behavior: 'smooth'});
    }
  };

  window.addTempTeamMember = function() {
    var list = document.getElementById('cpTeamList');
    if(!list) return;
    var row = document.createElement('div');
    row.className = 'field-row';
    row.style.marginBottom = '12px';
    row.innerHTML = '<input class="field-input" type="text" placeholder="Name" style="flex:1"><div class="sel-wrap" style="flex:1"><select class="field-select"><option value="PM">Project Mgr</option><option value="SE">Site Eng</option><option value="Sup">Supervisor</option></select><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="6 9 12 15 18 9"/></svg></div><button type="button" class="icon-btn" onclick="this.parentElement.remove()" style="padding:0;width:32px"><svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" width="18" height="18"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>';
    if(list.querySelector('.info-box')) list.innerHTML = '';
    list.appendChild(row);
  };

  window.addTempInstallment = function() {
    var list = document.getElementById('cpInstallmentList');
    if(!list) return;
    var row = document.createElement('div');
    row.className = 'field-row';
    row.style.marginBottom = '12px';
    row.innerHTML = '<input class="field-input" type="text" placeholder="Stage Name" style="flex:1"><input class="field-input" type="number" placeholder="₹ Amt" style="width:100px"><button type="button" class="icon-btn" onclick="this.parentElement.remove()" style="padding:0;width:32px"><svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" width="18" height="18"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>';
    list.appendChild(row);
  };

  function generateProjPreview() {
    var pName = document.getElementById('cpName') ? document.getElementById('cpName').value : '';
    var pType = document.getElementById('cpType') ? document.getElementById('cpType').value : '-';
    var pClient = document.getElementById('cpClientName') ? document.getElementById('cpClientName').value : '';
    var pBudget = document.getElementById('cpTotalValue') ? document.getElementById('cpTotalValue').value : '';
    
    if(!pName) pName = 'Untitled Project';
    if(!pClient) pClient = '-';
    if(!pBudget) pBudget = '0';
    
    var html = '<h3 style="margin:0 0 16px;font-size:16px;">' + pName + '</h3>';
    html += '<p style="font-size:13px;color:var(--text2);margin-bottom:8px"><strong>Project Type:</strong> ' + pType + '</p>';
    html += '<p style="font-size:13px;color:var(--text2);margin-bottom:8px"><strong>Client:</strong> ' + pClient + '</p>';
    html += '<p style="font-size:13px;color:var(--text2);margin-bottom:8px"><strong>Budget:</strong> ₹' + pBudget + '</p>';
    html += '<p style="font-size:13px;color:var(--text2);margin-top:16px;border-top:1px solid var(--border);padding-top:12px">Please review the details above. Click Publish Project to submit.</p>';
    
    var area = document.getElementById('cpPreviewArea');
    if(area) area.innerHTML = html;
  }

  var addProjectForm = document.getElementById('addProjectForm');
  if(addProjectForm) {
    addProjectForm.addEventListener('submit', function(e) {
      e.preventDefault(); // Prevent accidental enter-key submits
    });
  }

  // Purchase Orders Logic
  window.addPOItem = function() {
    var list = document.getElementById('poItemsList');
    if(!list) return;
    var row = document.createElement('div');
    row.className = 'po-item-row';
    row.style.display = 'flex';
    row.style.gap = '8px';
    row.innerHTML = '<input class="field-input" type="text" placeholder="Item name" style="flex:2"><input class="field-input po-price-input" type="number" placeholder="Price" style="flex:1" oninput="calcPOTotal()"><input class="field-input po-qty-input" type="number" placeholder="Qty" style="flex:0.8" oninput="calcPOTotal()">';
    list.appendChild(row);
  };

  window.calcPOTotal = function() {
    var prices = document.querySelectorAll('.po-price-input');
    var qtys = document.querySelectorAll('.po-qty-input');
    var total = 0;
    for(var i=0; i<prices.length; i++) {
      var p = parseFloat(prices[i].value) || 0;
      var q = parseFloat(qtys[i].value) || 0;
      total += (p * q);
    }
    var totalEl = document.getElementById('poTotalVal');
    if(totalEl) {
      totalEl.textContent = '₹' + total.toLocaleString('en-IN');
    }
  };

  window.createPO = function() {
    closeSheet('createPOSheet');
    showToast('Purchase Order Created Successfully! ✓');
    // Optionally reset form here
  };

  console.log('✅ Aatzy Build v3 — Sidebar fix, Auth gating');
})();
