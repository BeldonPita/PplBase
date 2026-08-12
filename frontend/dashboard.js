const API_URL = 'https://pplbase.onrender.com';
const token = localStorage.getItem('pplbase_token');

if (!token) window.location.href = '/';

function getHeaders() {
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ===== CARREGAR PERFIL =====
async function carregarPerfil() {
    try {
        const response = await fetch(`${API_URL}/usuarios/me`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Erro');
        const user = await response.json();

        document.getElementById('userName').textContent = `Olá, ${user.nome || 'Usuário'}`;

        document.getElementById('profileInfo').innerHTML = `
            <p><strong>Nome:</strong> ${user.nome || '-'}</p>
            <p><strong>Username:</strong> @${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Localização:</strong> ${user.localizacao || 'Não definida'}</p>
            <p><strong>Bio:</strong> ${user.bio || 'Sem bio'}</p>
        `;

        // Foto
        if (user.foto_url) {
            document.getElementById('avatarPlaceholder').style.display = 'none';
            const img = document.getElementById('avatarImage');
            img.src = user.foto_url;
            img.style.display = 'block';
        }

        // Habilidades
        const habList = document.getElementById('habilidadesList');
        if (user.habilidades?.length) {
            habList.innerHTML = user.habilidades.map(h => `<span class="tag">${h.nome}</span>`).join('');
        } else {
            habList.innerHTML = '<div class="empty">Nenhuma habilidade</div>';
        }

        // Experiências
        const expList = document.getElementById('experienciasList');
        if (user.experiencias?.length) {
            expList.innerHTML = user.experiencias.map(exp => `
                <div class="exp-item">
                    <div><strong>${exp.titulo}</strong> ${exp.empresa ? `- ${exp.empresa}` : ''} ${exp.localizacao ? `📍 ${exp.localizacao}` : ''}</div>
                    <div class="exp-actions">
                        <button onclick="editarExperiencia(${exp.id})">✏️</button>
                        <button onclick="removerExperiencia(${exp.id})">🗑️</button>
                    </div>
                </div>
            `).join('');
        } else {
            expList.innerHTML = '<div class="empty">Nenhuma experiência</div>';
        }

        window.usuarioAtual = user;

    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('profileInfo').innerHTML = '<div class="empty">Erro ao carregar perfil</div>';
    }
}

// ===== EXPERIÊNCIAS =====
document.getElementById('btnAddExperiencia').addEventListener('click', () => {
    document.getElementById('modalExpTitle').textContent = 'Adicionar Experiência';
    document.getElementById('expId').value = '';
    document.getElementById('expTitulo').value = '';
    document.getElementById('expEmpresa').value = '';
    document.getElementById('expDescricao').value = '';
    document.getElementById('expLocalizacao').value = '';
    document.getElementById('modalExperiencia').classList.add('active');
});

document.getElementById('fecharModalExp').addEventListener('click', () => {
    document.getElementById('modalExperiencia').classList.remove('active');
});

window.editarExperiencia = async (id) => {
    try {
        const response = await fetch(`${API_URL}/usuarios/me`, { headers: getHeaders() });
        const user = await response.json();
        const exp = user.experiencias.find(e => e.id === id);
        if (!exp) return;

        document.getElementById('modalExpTitle').textContent = 'Editar Experiência';
        document.getElementById('expId').value = id;
        document.getElementById('expTitulo').value = exp.titulo || '';
        document.getElementById('expEmpresa').value = exp.empresa || '';
        document.getElementById('expDescricao').value = exp.descricao || '';
        document.getElementById('expLocalizacao').value = exp.localizacao || '';
        document.getElementById('modalExperiencia').classList.add('active');
    } catch (error) { console.error('Erro:', error); }
};

window.removerExperiencia = async (id) => {
    if (!confirm('Remover esta experiência?')) return;
    try {
        const response = await fetch(`${API_URL}/usuarios/experiencias/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (response.ok) await carregarPerfil();
    } catch (error) { console.error('Erro:', error); }
};

document.getElementById('formExperiencia').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('expId').value;
    const titulo = document.getElementById('expTitulo').value;
    const empresa = document.getElementById('expEmpresa').value;
    const descricao = document.getElementById('expDescricao').value;
    const localizacao = document.getElementById('expLocalizacao').value;
    const message = document.getElementById('expMessage');

    const url = id ? `${API_URL}/usuarios/experiencias/${id}` : `${API_URL}/usuarios/experiencias`;
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify({ titulo, empresa, descricao, localizacao }) });
        if (response.ok) {
            document.getElementById('modalExperiencia').classList.remove('active');
            await carregarPerfil();
        } else {
            const data = await response.json();
            message.textContent = data.detail || 'Erro';
        }
    } catch (error) { message.textContent = 'Erro de conexão'; }
});

// ===== HABILIDADES =====
document.getElementById('btnAddHabilidade').addEventListener('click', async () => {
    const input = document.getElementById('novaHabilidade');
    const nome = input.value.trim();
    if (!nome) return;

    try {
        const response = await fetch(`${API_URL}/usuarios/habilidades`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ nome })
        });
        if (response.ok) {
            input.value = '';
            await carregarPerfil();
        }
    } catch (error) { console.error('Erro:', error); }
});

// ===== EDITAR PERFIL =====
document.getElementById('btnEditarPerfil').addEventListener('click', () => {
    const user = window.usuarioAtual;
    if (!user) return;
    document.getElementById('editNome').value = user.nome || '';
    document.getElementById('editBio').value = user.bio || '';
    document.getElementById('editLocalizacao').value = user.localizacao || '';
    document.getElementById('modalEditarPerfil').classList.add('active');
});

document.getElementById('fecharModalEditar').addEventListener('click', () => {
    document.getElementById('modalEditarPerfil').classList.remove('active');
});

document.getElementById('formEditarPerfil').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('editNome').value;
    const bio = document.getElementById('editBio').value;
    const localizacao = document.getElementById('editLocalizacao').value;
    const message = document.getElementById('editMessage');

    try {
        const response = await fetch(`${API_URL}/usuarios/me`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ nome, bio, localizacao })
        });
        if (response.ok) {
            document.getElementById('modalEditarPerfil').classList.remove('active');
            await carregarPerfil();
        } else {
            const data = await response.json();
            message.textContent = data.detail || 'Erro';
        }
    } catch (error) { message.textContent = 'Erro de conexão'; }
});

// ===== FOTO PERFIL =====
document.getElementById('avatarUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('foto', file);

    try {
        const response = await fetch(`${API_URL}/usuarios/upload-foto`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (response.ok) await carregarPerfil();
    } catch (error) { console.error('Erro:', error); }
});

// ===== MENU 3 BARRAS =====
document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('menuDropdown').classList.toggle('active');
});

document.getElementById('menuEditarPerfil').addEventListener('click', () => {
    document.getElementById('menuDropdown').classList.remove('active');
    document.getElementById('btnEditarPerfil').click();
});

document.getElementById('menuAtividades').addEventListener('click', () => {
    document.getElementById('menuDropdown').classList.remove('active');
    window.location.href = '/inicio.html';
});

document.getElementById('menuDarkMode').addEventListener('click', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    document.getElementById('menuDropdown').classList.remove('active');
});

document.getElementById('menuLightMode').addEventListener('click', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
    document.getElementById('menuDropdown').classList.remove('active');
});

// ===== LOGOUT =====
document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('pplbase_token');
    window.location.href = '/';
});

// ===== TEMA =====
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// ===== INICIALIZAR =====
carregarPerfil();
