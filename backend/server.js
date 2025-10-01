// backend/server.js

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database.js');

const JWT_SECRET = 'seu-segredo-super-secreto-que-ninguem-deve-saber';
const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// --- Middleware de Autenticação ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    const sqlSelect = "SELECT * FROM users WHERE email = ?";
    db.get(sqlSelect, [email], async (err, row) => {
        if (err) return res.status(500).json({ message: 'Erro ao consultar o banco de dados.' });
        if (row) return res.status(400).json({ message: 'Este email já está em uso.' });
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const sqlInsert = 'INSERT INTO users (name, email, password) VALUES (?,?,?)';
            db.run(sqlInsert, [name, email, hashedPassword], function(err) {
                if (err) return res.status(500).json({ message: 'Erro ao registrar o usuário.' });
                res.status(201).json({ id: this.lastID, name: name, email: email });
            });
        } catch (error) { res.status(500).json({ message: 'Erro interno no servidor.' }); }
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    const sql = "SELECT * FROM users WHERE email = ?";
    db.get(sql, [email], async (err, user) => {
        if (err) return res.status(500).json({ message: 'Erro ao consultar o banco de dados.' });
        if (!user) return res.status(401).json({ message: 'Credenciais inválidas.' });
        try {
            const isPasswordMatch = await bcrypt.compare(password, user.password);
            if (!isPasswordMatch) return res.status(401).json({ message: 'Credenciais inválidas.' });
            const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
            res.status(200).json({ message: 'Login bem-sucedido!', token, user: { id: user.id, name: user.name, email: user.email }});
        } catch (error) { res.status(500).json({ message: 'Erro interno no servidor.' }); }
    });
});

// --- ROTAS DE TRANSAÇÕES ---
app.get('/api/transactions', authenticateToken, (req, res) => {
    db.all("SELECT * FROM transactions WHERE userId = ? ORDER BY date DESC, id DESC", [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ message: "Erro ao buscar transações." });
        res.json(rows);
    });
});
app.post('/api/transactions', authenticateToken, (req, res) => {
    const { description, amount, date, type, category, paymentMethod } = req.body;
    const sql = `INSERT INTO transactions (description, amount, date, type, category, paymentMethod, userId) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [description, amount, date, type, category, paymentMethod, req.user.id], function(err) {
        if (err) return res.status(500).json({ message: "Erro ao adicionar transação." });
        res.status(201).json({ id: this.lastID, ...req.body });
    });
});
app.put('/api/transactions/:id', authenticateToken, (req, res) => {
    const { description, amount, date, type, category, paymentMethod } = req.body;
    const sql = `UPDATE transactions SET description = ?, amount = ?, date = ?, type = ?, category = ?, paymentMethod = ? WHERE id = ? AND userId = ?`;
    db.run(sql, [description, amount, date, type, category, paymentMethod, req.params.id, req.user.id], function(err) {
        if (err) return res.status(500).json({ message: "Erro ao atualizar transação." });
        if (this.changes === 0) return res.status(404).json({ message: "Transação não encontrada." });
        res.json({ id: req.params.id, ...req.body });
    });
});
app.delete('/api/transactions/:id', authenticateToken, (req, res) => {
    const sql = 'DELETE FROM transactions WHERE id = ? AND userId = ?';
    db.run(sql, [req.params.id, req.user.id], function(err) {
        if (err) return res.status(500).json({ message: "Erro ao excluir transação." });
        if (this.changes === 0) return res.status(404).json({ message: "Transação não encontrada." });
        res.sendStatus(204);
    });
});
app.delete('/api/transactions', authenticateToken, (req, res) => {
    db.run('DELETE FROM transactions WHERE userId = ?', [req.user.id], (err) => {
        if (err) return res.status(500).json({ message: "Erro ao limpar transações." });
        res.sendStatus(204);
    });
});

// --- ROTAS DE ORÇAMENTOS ---
app.get('/api/budgets', authenticateToken, (req, res) => {
    db.all("SELECT category, amount FROM budgets WHERE userId = ?", [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ message: "Erro ao buscar orçamentos." });
        const budgetsObject = rows.reduce((obj, item) => {
            obj[item.category] = item.amount;
            return obj;
        }, {});
        res.json(budgetsObject);
    });
});
app.post('/api/budgets', authenticateToken, (req, res) => {
    const { category, amount } = req.body;
    const sql = `INSERT INTO budgets (category, amount, userId) VALUES (?, ?, ?)
                 ON CONFLICT(category, userId) DO UPDATE SET amount = excluded.amount`;
    db.run(sql, [category, amount, req.user.id], function(err) {
        if (err) return res.status(500).json({ message: "Erro ao salvar orçamento." });
        res.sendStatus(200);
    });
});

// --- ROTAS DE TRANSAÇÕES RECORRENTES ---
app.get('/api/recurring', authenticateToken, (req, res) => {
    db.all("SELECT * FROM recurring_transactions WHERE userId = ?", [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ message: "Erro ao buscar transações recorrentes." });
        res.json(rows);
    });
});
app.post('/api/recurring', authenticateToken, (req, res) => {
    const { description, amount, dayOfMonth, category, type } = req.body;
    const sql = `INSERT INTO recurring_transactions (description, amount, dayOfMonth, category, type, userId) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [description, amount, dayOfMonth, category, type, req.user.id], function(err) {
        if (err) return res.status(500).json({ message: "Erro ao salvar transação recorrente." });
        res.status(201).json({ id: this.lastID, ...req.body });
    });
});
app.delete('/api/recurring/:id', authenticateToken, (req, res) => {
    const sql = 'DELETE FROM recurring_transactions WHERE id = ? AND userId = ?';
    db.run(sql, [req.params.id, req.user.id], function(err) {
        if (err) return res.status(500).json({ message: "Erro ao excluir transação recorrente." });
        if (this.changes === 0) return res.status(404).json({ message: "Transação recorrente não encontrada." });
        res.sendStatus(204);
    });
});

app.post('/api/recurring/generate', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    db.all("SELECT * FROM recurring_transactions WHERE userId = ? AND (lastGenerated IS NULL OR lastGenerated != ?)", [userId, currentMonthStr], (err, rows) => {
        if (err) return res.status(500).json({ message: "Erro ao buscar recorrências." });
        if (rows.length === 0) return res.status(200).json({ message: "Nenhuma transação recorrente para gerar." });

        let generatedCount = 0;
        db.serialize(() => {
            rows.forEach(rt => {
                const day = Math.min(rt.dayOfMonth, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
                const dateStr = `${currentMonthStr}-${String(day).padStart(2, '0')}`;
                
                const insertSql = `INSERT INTO transactions (description, amount, date, type, category, userId) VALUES (?, ?, ?, ?, ?, ?)`;
                const amount = rt.type === 'expense' ? -Math.abs(rt.amount) : Math.abs(rt.amount);
                db.run(insertSql, [rt.description, amount, dateStr, rt.type, rt.category, userId]);

                const updateSql = `UPDATE recurring_transactions SET lastGenerated = ? WHERE id = ?`;
                db.run(updateSql, [currentMonthStr, rt.id]);
                generatedCount++;
            });
        });
        res.status(200).json({ message: `${generatedCount} transações recorrentes geradas.` });
    });
});

// --- Inicia o servidor ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta http://localhost:${PORT}`);
});