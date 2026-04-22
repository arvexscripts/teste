const API = "https://seu-backend.render.com/api"; // Muda pro teu link do Render depois
let tokenAtivo = null;

const btnStart = document.getElementById('start');
const btnFinish = document.getElementById('finish');
const timerText = document.getElementById('display-timer');

// Função pra gerenciar o timer visual (só pra interface)
const rodaTimer = (segundos) => {
    let tempo = segundos;
    btnStart.disabled = true;
    
    const contagem = setInterval(() => {
        tempo--;
        timerText.innerText = `Segure as pontas: ${tempo}s`;
        
        if (tempo <= 0) {
            clearInterval(contagem);
            timerText.innerText = "Tudo pronto! Pode finalizar.";
            btnFinish.disabled = false;
        }
    }, 1000);
};

btnStart.onclick = async () => {
    try {
        const res = await fetch(`${API}/start`, { method: 'POST', credentials: 'include' });
        const data = await res.json();
        
        if (data.token) {
            tokenAtivo = data.token;
            rodaTimer(15); // O backend vai validar esses 15s tb
        }
    } catch (err) {
        alert("Erro ao conectar com o servidor.");
    }
};

btnFinish.onclick = async () => {
    try {
        const res = await fetch(`${API}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: tokenAtivo }),
            credentials: 'include'
        });
        
        const resultado = await res.json();
        
        if (resultado.success) {
            alert("Boa! Próxima etapa liberada.");
            window.location.reload(); 
        } else {
            alert("Ops: " + resultado.error);
        }
    } catch (err) {
        console.error("Falha na requisição", err);
    }
};
