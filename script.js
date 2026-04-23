const API_BASE_URL = 'https://meu-servidor-p9g9.onrender.com';

const ADMIN_USER = {
    name: 'Administrador',
    email: 'admin@flash.pt',
    password: 'adminflash1234*',
    role: 'admin',
    createdAt: new Date().toISOString()
};

function ensureAdminUser() {
    const users = JSON.parse(localStorage.getItem('flashUsers') || '[]');
    const adminExists = users.some(user => user.email === ADMIN_USER.email);

    if (!adminExists) {
        users.push(ADMIN_USER);
        localStorage.setItem('flashUsers', JSON.stringify(users));
    } else {
        const normalizedUsers = users.map(user => {
            if (user.email === ADMIN_USER.email) {
                return { ...user, ...ADMIN_USER };
            }
            return user;
        });
        localStorage.setItem('flashUsers', JSON.stringify(normalizedUsers));
    }
}

function toggleMenu() {
    const menu = document.getElementById('menu');
    if (menu) menu.classList.toggle('active');
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.toggle('active');
}

document.addEventListener('click', function (event) {
    const avatarMenu = document.getElementById('userAvatarMenu');
    const dropdown = document.getElementById('userDropdown');

    if (avatarMenu && dropdown && !avatarMenu.contains(event.target)) {
        dropdown.classList.remove('active');
    }
});

function showLoginForm() {
    document.getElementById('loginForm')?.classList.remove('hidden');
    document.getElementById('registerForm')?.classList.add('hidden');
    document.getElementById('emailRegisterForm')?.classList.add('hidden');
}

function showRegisterForm() {
    document.getElementById('loginForm')?.classList.add('hidden');
    document.getElementById('registerForm')?.classList.remove('hidden');
    document.getElementById('emailRegisterForm')?.classList.add('hidden');
}

function showEmailRegisterForm() {
    document.getElementById('loginForm')?.classList.add('hidden');
    document.getElementById('registerForm')?.classList.add('hidden');
    document.getElementById('emailRegisterForm')?.classList.remove('hidden');
}

function loginWithGoogle() {
    alert('Login com Google ainda não está configurado.');
}

function loginWithFacebook() {
    alert('Login com Facebook ainda não está configurado.');
}

function handleLogin(event) {
    event.preventDefault();
    ensureAdminUser();

    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    if (email === ADMIN_USER.email && password === ADMIN_USER.password) {
        const adminSession = {
            name: ADMIN_USER.name,
            email: ADMIN_USER.email,
            role: 'admin',
            createdAt: ADMIN_USER.createdAt
        };

        localStorage.setItem('flashUser', JSON.stringify(adminSession));
        alert('Login de administrador efetuado com sucesso.');
        window.location.href = 'admin.html';
        return;
    }

    const users = JSON.parse(localStorage.getItem('flashUsers') || '[]');
    const user = users.find(u => u.email.toLowerCase() === email && u.password === password);

    if (!user) {
        alert('Email ou password inválidos.');
        return;
    }

    localStorage.setItem('flashUser', JSON.stringify({
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        createdAt: user.createdAt || new Date().toISOString()
    }));

    alert('Login efetuado com sucesso.');
    window.location.href = user.role === 'admin' ? 'admin.html' : 'index.html';
}

function handleRegister(event) {
    event.preventDefault();
    ensureAdminUser();

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;

    const users = JSON.parse(localStorage.getItem('flashUsers') || '[]');

    if (email === ADMIN_USER.email) {
        alert('Este email está reservado para a conta administradora.');
        return;
    }

    if (users.some(user => user.email.toLowerCase() === email)) {
        alert('Já existe uma conta com este email.');
        return;
    }

    users.push({
        id: crypto.randomUUID(),
        name,
        email,
        password,
        role: 'user',
        createdAt: new Date().toISOString()
    });

    localStorage.setItem('flashUsers', JSON.stringify(users));

    alert('Conta criada com sucesso.');
    showLoginForm();
}

function logout() {
    localStorage.removeItem('flashUser');
    window.location.href = 'login.html';
}

function updateUserUI() {
    const user = JSON.parse(localStorage.getItem('flashUser') || 'null');

    const avatarMenu = document.getElementById('userAvatarMenu');
    const userInitials = document.getElementById('userInitials');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const adminLink = document.getElementById('adminLink');

    if (!avatarMenu) return;

    if (user) {
        avatarMenu.style.display = 'block';

        if (userInitials) userInitials.textContent = (user.name || 'U').charAt(0).toUpperCase();
        if (userName) userName.textContent = user.name || 'Utilizador';
        if (userEmail) userEmail.textContent = user.email || '';
        if (adminLink) adminLink.style.display = user.role === 'admin' ? 'block' : 'none';
    } else {
        avatarMenu.style.display = 'none';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    ensureAdminUser();
    updateUserUI();
});