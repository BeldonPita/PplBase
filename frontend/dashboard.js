if (!token) {
    window.location.href = '/';
}

document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('pplbase_token');
    window.location.href = '/';
});

async function carregarPerfil() {
    try {
        const response = await fetch(`${API_URL}/usuarios/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('pplbase_token');
                window.location.href = '/';
            }
            throw new Error('Erro ao carregar perfil');
        }

        const user = await response.json();
        
        document.getElementById('profileInfo').innerHTML = `
            <div class="row"><span class="label">ðŸ‘¤ Nome</span><span class="value">${user.nome}</span></div>
            <div class="row"><span class="label">ðŸ“› Username</span><span class="value">@${user.username}</span></div>
            <div class="row"><span class="label">ðŸ“§ Email</span><span class="value">${user.email}</span></div>
            <div class="row"><span class="label">ðŸ“ LocalizaÃ§Ã£o</span><span class="value">${user.localizacao || 'NÃ£o definida'}</span></div>
            <div class="row"><span class="label">ðŸ“ Bio</span><span class="value">${user.bio || 'Sem bio cadastrada'}</span></div>
        `;

        window.usuarioAtual = user;

    } catch (error) {
        console.error('Erro:', error);
    }
}

carregarPerfil();
// =========================================================
// UPLOAD DE FOTO DE PERFIL
// =========================================================

document.getElementById('avatarUpload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert('A imagem nao pode ter mais de 5MB');
        return;
    }

    const formData = new FormData();
    formData.append('foto', file);

    try {
        const response = await fetch(`${API_URL}/usuarios/upload-foto`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            alert('Foto atualizada com sucesso!');
            await carregarPerfil();
        } else {
            const data = await response.json();
            alert(data.detail || 'Erro ao enviar foto');
        }
    } catch (error) {
        alert('Erro de conexao');
    }
});

// =========================================================
// EDITAR EXPERIENCIA
// =========================================================

window.editarExperiencia = async (id) => {
    try {
        const response = await fetch(`${API_URL}/usuarios/me`, { headers: getHeaders() });
        const user = await response.json();
        const exp = user.experiencias.find(e => e.id === id);
        if (!exp) return;

        document.getElementById('editExpId').value = id;
        document.getElementById('editExpTitulo').value = exp.titulo || '';
        document.getElementById('editExpEmpresa').value = exp.empresa || '';
        document.getElementById('editExpDescricao').value = exp.descricao || '';
        document.getElementById('editExpLocalizacao').value = exp.localizacao || '';
        document.getElementById('modalEditarExperiencia').classList.add('active');
    } catch (error) {
        console.error('Erro:', error);
    }
};

document.getElementById('fecharModalEditarExp')?.addEventListener('click', () => {
    document.getElementById('modalEditarExperiencia').classList.remove('active');
});

document.getElementById('formEditarExperiencia')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editExpId').value;
    const titulo = document.getElementById('editExpTitulo').value;
    const empresa = document.getElementById('editExpEmpresa').value;
    const descricao = document.getElementById('editExpDescricao').value;
    const localizacao = document.getElementById('editExpLocalizacao').value;
    const message = document.getElementById('editExpMessage');

    try {
        const response = await fetch(`${API_URL}/usuarios/experiencias/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ titulo, empresa, descricao, localizacao })
        });

        if (response.ok) {
            document.getElementById('modalEditarExperiencia').classList.remove('active');
            await carregarPerfil();
        } else {
            const data = await response.json();
            message.textContent = data.detail || 'Erro ao editar';
        }
    } catch (error) {
        message.textContent = 'Erro de conexao';
    }
});

