// backend/database.js

const sqlite3 = require('sqlite3').verbose();

// Nome do arquivo do banco de dados
const DBSOURCE = "finandash.db";

// Conecta ao banco de dados (ou cria se não existir)
const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        // Erro fatal: não foi possível conectar ao banco de dados
        console.error(err.message);
        throw err;
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        // db.serialize garante que os comandos sejam executados em ordem
        db.serialize(() => {
            // Cria a tabela de usuários se ela não existir
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )`, (err) => {
                if (err) console.error("Erro ao criar tabela users:", err.message);
            });

            // Cria a tabela de transações
            db.run(`CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                amount REAL NOT NULL,
                date TEXT NOT NULL,
                type TEXT NOT NULL,
                category TEXT NOT NULL,
                paymentMethod TEXT,
                userId INTEGER,
                FOREIGN KEY (userId) REFERENCES users (id)
            )`, (err) => {
                if (err) console.error("Erro ao criar tabela transactions:", err.message);
            });

            // Cria a tabela de orçamentos
            db.run(`CREATE TABLE IF NOT EXISTS budgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                userId INTEGER,
                UNIQUE(category, userId),
                FOREIGN KEY (userId) REFERENCES users (id)
            )`, (err) => {
                if (err) console.error("Erro ao criar tabela budgets:", err.message);
            });

            // Cria a tabela de transações recorrentes
            db.run(`CREATE TABLE IF NOT EXISTS recurring_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                amount REAL NOT NULL,
                dayOfMonth INTEGER NOT NULL,
                category TEXT NOT NULL,
                type TEXT NOT NULL,
                lastGenerated TEXT,
                userId INTEGER,
                FOREIGN KEY (userId) REFERENCES users (id)
            )`, (err) => {
                if (err) console.error("Erro ao criar tabela recurring_transactions:", err.message);
            });
        });
    }
});

// Exporta a conexão com o banco de dados para ser usada em outros arquivos
module.exports = db;