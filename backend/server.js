require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db.js');

const JWT_SECRET = process.env.JWT_SECRET || 'segredo-local-para-dev';
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "https://finandash-fullstack.vercel.app" }));
app.use(express.json());

const createTables = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(100) UNIQUE NOT NULL, password VARCHAR(100) NOT NULL);
        CREATE TABLE IF NOT EXISTS transactions (id SERIAL PRIMARY KEY, description VARCHAR(255) NOT NULL, amount NUMERIC(10, 2) NOT NULL, date DATE NOT NULL, type VARCHAR(50) NOT NULL, category VARCHAR(100) NOT NULL, paymentMethod VARCHAR(100), userId INTEGER REFERENCES users(id) ON DELETE CASCADE);
        CREATE TABLE IF NOT EXISTS budgets (id SERIAL PRIMARY KEY, category VARCHAR(100) NOT NULL, amount NUMERIC(10, 2) NOT NULL, userId INTEGER REFERENCES users(id) ON DELETE CASCADE, UNIQUE(category, userId));
        CREATE TABLE IF NOT EXISTS recurring_transactions (id SERIAL PRIMARY KEY, description VARCHAR(255) NOT NULL, amount NUMERIC(10, 2) NOT NULL, dayOfMonth INTEGER NOT NULL, category VARCHAR(100) NOT NULL, type VARCHAR(50) NOT NULL, lastGenerated VARCHAR(7), userId INTEGER REFERENCES users(id) ON DELETE CASCADE);
        CREATE TABLE IF NOT EXISTS reminders (id SERIAL PRIMARY KEY, description VARCHAR(255) NOT NULL, amount NUMERIC(10, 2), dueDate DATE NOT NULL, isPaid BOOLEAN DEFAULT false, userId INTEGER REFERENCES users(id) ON DELETE CASCADE);
    `;
    try { await db.query(query); console.log("Tabelas verificadas/criadas."); } catch (err) { console.error("Erro ao criar tabelas:", err); }
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => { if (err) return res.sendStatus(403); req.user = user; next(); });
};

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        const existingUser = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (existingUser.rows.length > 0) return res.status(400).json({ message: 'Este email já está em uso.' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await db.query("INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email", [name, email, hashedPassword]);
        res.status(201).json(newUser.rows[0]);
    } catch (error) { console.error(error); res.status(500).json({ message: 'Erro interno no servidor.' }); }
});
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = result.rows[0];
        if (!user) return res.status(401).json({ message: 'Credenciais inválidas.' });
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) return res.status(401).json({ message: 'Credenciais inválidas.' });
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
        res.status(200).json({ message: 'Login bem-sucedido!', token, user: { id: user.id, name: user.name, email: user.email }});
    } catch (error) { console.error(error); res.status(500).json({ message: 'Erro interno no servidor.' }); }
});

// --- ROTAS DE TRANSAÇÕES ---
app.get('/api/transactions', authenticateToken, async (req, res) => { try { const r = await db.query("SELECT * FROM transactions WHERE userId = $1 ORDER BY date DESC, id DESC", [req.user.id]); res.json(r.rows); } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao buscar transações.'}); } });
app.post('/api/transactions', authenticateToken, async (req, res) => { try { const { description, amount, date, type, category, paymentMethod } = req.body; const r = await db.query(`INSERT INTO transactions (description, amount, date, type, category, paymentMethod, userId) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [description, amount, date, type, category, paymentMethod, req.user.id]); res.status(201).json(r.rows[0]); } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao adicionar transação.'}); } });
app.put('/api/transactions/:id', authenticateToken, async (req, res) => { try { const { description, amount, date, type, category, paymentMethod } = req.body; const r = await db.query(`UPDATE transactions SET description = $1, amount = $2, date = $3, type = $4, category = $5, paymentMethod = $6 WHERE id = $7 AND userId = $8 RETURNING *`, [description, amount, date, type, category, paymentMethod, req.params.id, req.user.id]); if (r.rows.length === 0) return res.status(404).json({ message: "Transação não encontrada." }); res.json(r.rows[0]); } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao atualizar transação.'}); } });
app.delete('/api/transactions/:id', authenticateToken, async (req, res) => { try { const r = await db.query("DELETE FROM transactions WHERE id = $1 AND userId = $2", [req.params.id, req.user.id]); if (r.rowCount === 0) return res.status(404).json({ message: "Transação não encontrada." }); res.sendStatus(204); } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao excluir transação.'}); } });
app.delete('/api/transactions', authenticateToken, async (req, res) => { try { await db.query("DELETE FROM transactions WHERE userId = $1", [req.user.id]); res.sendStatus(204); } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao limpar transações.'}); } });

// --- ROTAS DE ORÇAMENTOS ---
app.get('/api/budgets', authenticateToken, async (req, res) => { try { const r = await db.query("SELECT category, amount FROM budgets WHERE userId = $1", [req.user.id]); const b = r.rows.reduce((o, i) => ({ ...o, [i.category]: parseFloat(i.amount) }), {}); res.json(b); } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao buscar orçamentos.'}); } });
app.post('/api/budgets', authenticateToken, async (req, res) => { try { const { category, amount } = req.body; if (amount > 0) { await db.query(`INSERT INTO budgets (category, amount, userId) VALUES ($1, $2, $3) ON CONFLICT(category, userId) DO UPDATE SET amount = $2`, [category, amount, req.user.id]); } else { await db.query(`DELETE FROM budgets WHERE category = $1 AND userId = $2`, [category, req.user.id]); } res.sendStatus(200); } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao salvar orçamento.'}); } });

// --- ROTAS DE RECORRENTES ---
app.get('/api/recurring', authenticateToken, async (req, res) => { try { const r = await db.query("SELECT * FROM recurring_transactions WHERE userId = $1", [req.user.id]); res.json(r.rows); } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao buscar recorrentes.'}); } });
app.post('/api/recurring', authenticateToken, async (req, res) => { try { const { description, amount, dayOfMonth, category, type } = req.body; const r = await db.query(`INSERT INTO recurring_transactions (description, amount, dayOfMonth, category, type, userId) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [description, amount, dayOfMonth, category, type, req.user.id]); res.status(201).json(r.rows[0]); } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao salvar recorrente.'}); } });
app.delete('/api/recurring/:id', authenticateToken, async (req, res) => { try { const r = await db.query("DELETE FROM recurring_transactions WHERE id = $1 AND userId = $2", [req.params.id, req.user.id]); if (r.rowCount === 0) return res.status(404).json({ message: "Recorrente não encontrada." }); res.sendStatus(204); } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao excluir recorrente.'}); } });
app.post('/api/recurring/generate', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const result = await db.query("SELECT * FROM recurring_transactions WHERE userId = $1 AND (lastGenerated IS NULL OR lastGenerated != $2)", [userId, currentMonthStr]);
        if (result.rows.length === 0) return res.json({ message: "Nenhuma transação recorrente para gerar." });
        for (const rt of result.rows) {
            const day = Math.min(rt.dayofmonth, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
            const dateStr = `${currentMonthStr}-${String(day).padStart(2, '0')}`;
            const amount = rt.type === 'expense' ? -Math.abs(rt.amount) : Math.abs(rt.amount);
            await db.query(`INSERT INTO transactions (description, amount, date, type, category, userId) VALUES ($1, $2, $3, $4, $5, $6)`, [rt.description, amount, dateStr, rt.type, rt.category, userId]);
            await db.query(`UPDATE recurring_transactions SET lastGenerated = $1 WHERE id = $2`, [currentMonthStr, rt.id]);
        }
        res.status(200).json({ message: `${result.rows.length} transações recorrentes geradas.` });
    } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao gerar recorrentes.'}); }
});

// --- ROTAS DE LEMBRETES ---
app.get('/api/reminders', authenticateToken, async (req, res) => { try { const r = await db.query("SELECT * FROM reminders WHERE userId = $1 ORDER BY dueDate ASC", [req.user.id]); res.json(r.rows); } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao buscar lembretes.'}); } });
app.post('/api/reminders', authenticateToken, async (req, res) => { try { const { description, amount, dueDate } = req.body; const r = await db.query(`INSERT INTO reminders (description, amount, dueDate, userId) VALUES ($1, $2, $3, $4) RETURNING *`, [description, amount, dueDate, req.user.id]); res.status(201).json(r.rows[0]); } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao salvar lembrete.'}); } });
app.put('/api/reminders/:id', authenticateToken, async (req, res) => { try { const { isPaid } = req.body; const r = await db.query(`UPDATE reminders SET isPaid = $1 WHERE id = $2 AND userId = $3 RETURNING *`, [isPaid, req.params.id, req.user.id]); if (r.rows.length === 0) return res.status(404).json({ message: "Lembrete não encontrado." }); res.json(r.rows[0]); } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao atualizar lembrete.'}); } });
app.delete('/api/reminders/:id', authenticateToken, async (req, res) => { try { const r = await db.query("DELETE FROM reminders WHERE id = $1 AND userId = $2", [req.params.id, req.user.id]); if (r.rowCount === 0) return res.status(404).json({ message: "Lembrete não encontrado." }); res.sendStatus(204); } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao excluir lembrete.'}); } });

// --- Inicia o servidor e cria as tabelas ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta http://localhost:${PORT}`);
    createTables();
});