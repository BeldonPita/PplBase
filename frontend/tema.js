document.addEventListener('DOMContentLoaded', () => {
    const raiz = document.documentElement;
    const salvo = localStorage.getItem('pplbase-tema') || 'dark';
    raiz.setAttribute('data-theme', salvo);

    const botao = document.querySelector('.toggle-tema');
    if (botao) {
        botao.addEventListener('click', () => {
            const atual = raiz.getAttribute('data-theme');
            const novo = atual === 'dark' ? 'light' : 'dark';
            raiz.setAttribute('data-theme', novo);
            localStorage.setItem('pplbase-tema', novo);
        });
    }
});
