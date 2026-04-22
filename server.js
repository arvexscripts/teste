const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const app = express();
const prisma = new PrismaClient();

// Config basicona de segurança
app.use(helmet());
app.use(express.json());
app.use(cors({ 
    origin: process.env.FRONTEND_URL, // Teu link do GitHub Pages
    credentials: true 
}));

// Simulando um usuário logado (depois vc coloca um JWT real aqui)
const userIdMock = "user-id-aleatorio";

// Endpoint pra dar o start na tarefa
app.post('/api/start', async (req, res) => {
    try {
        // Pega o passo atual do banco pra não gerar token de etapa errada
        const user = await prisma.user.findUnique({ where: { id: userIdMock } });
        
        const novoToken = await prisma.stepToken.create({
            data: { 
                userId: userIdMock, 
                stepNumber: user.currentStep 
            }
        });

        res.json({ token: novoToken.id });
    } catch (e) {
        res.status(500).json({ error: "Erro ao iniciar" });
    }
});

// Endpoint que valida se o cara não tá roubando no tempo
app.post('/api/complete', async (req, res) => {
    try {
        const { token } = z.object({ token: z.string().uuid() }).parse(req.body);

        const dbToken = await prisma.stepToken.findUnique({ where: { id: token } });

        if (!dbToken || dbToken.used || dbToken.userId !== userIdMock) {
            return res.status(403).json({ error: "Token inválido ou já foi usado." });
        }

        // Validação real de tempo: compara o agora com o momento que o token foi criado
        const tempoPassado = (new Date() - dbToken.createdAt) / 1000;
        
        if (tempoPassado < 15) {
            return res.status(400).json({ error: "Calma aí, apressadinho. Mal começou a tarefa." });
        }

        // Se passou de 5 min, o token morre
        if (tempoPassado > 300) {
            return res.status(400).json({ error: "Tempo expirado. Comece de novo." });
        }

        // Atualiza tudo num "tapa" só (Transação)
        await prisma.$transaction([
            prisma.stepToken.update({ where: { id: token }, data: { used: true } }),
            prisma.user.update({ where: { id: userIdMock }, data: { currentStep: { increment: 1 } } })
        ]);

        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: "Dados inválidos." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));

