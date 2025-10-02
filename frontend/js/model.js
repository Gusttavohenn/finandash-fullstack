// --- MODEL ---
console.log("Model.js carregado.");

class Model {
    constructor() {
        this.API_URL = 'https://finandash-api-gustavo.onrender.com/api';
        this.transactions = [];
        this.userSettings = { name: 'Usuário' };
        this.budgets = {};
        this.recurringTransactions = [];
        this.reminders = []; // Propriedade para lembretes
    }

    // --- HELPER DE AUTENTICAÇÃO ---
    _getAuthHeaders() {
        const token = sessionStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    // --- CARREGAMENTO INICIAL DE DADOS ---
    async loadInitialData() {
        try {
            await fetch(`${this.API_URL}/recurring/generate`, { method: 'POST', headers: this._getAuthHeaders() });

            const [transactions, budgets, recurring, reminders] = await Promise.all([
                fetch(`${this.API_URL}/transactions`, { headers: this._getAuthHeaders() }).then(res => res.json()),
                fetch(`${this.API_URL}/budgets`, { headers: this._getAuthHeaders() }).then(res => res.json()),
                fetch(`${this.API_URL}/recurring`, { headers: this._getAuthHeaders() }).then(res => res.json()),
                fetch(`${this.API_URL}/reminders`, { headers: this._getAuthHeaders() }).then(res => res.json())
            ]);
            
            this.transactions = transactions;
            this.budgets = budgets;
            this.recurringTransactions = recurring;
            this.reminders = reminders;

            const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
            this.userSettings.name = loggedInUser.name;

        } catch (error) {
            console.error("Erro ao carregar dados iniciais:", error);
            alert("Houve um erro ao carregar seus dados. O servidor pode estar indisponível. Tente atualizar a página.");
        }
    }

    // --- MANIPULAÇÃO VIA API ---
    async addTransaction(data) { const res = await fetch(`${this.API_URL}/transactions`, { method: 'POST', headers: this._getAuthHeaders(), body: JSON.stringify(data) }); this.transactions.unshift(await res.json()); }
    async editTransaction(id, data) { const res = await fetch(`${this.API_URL}/transactions/${id}`, { method: 'PUT', headers: this._getAuthHeaders(), body: JSON.stringify(data) }); const updated = await res.json(); const index = this.transactions.findIndex(t => t.id === id); if (index !== -1) this.transactions[index] = updated; }
    async deleteTransaction(id) { await fetch(`${this.API_URL}/transactions/${id}`, { method: 'DELETE', headers: this._getAuthHeaders() }); this.transactions = this.transactions.filter(t => t.id !== id); }
    async clearAllData() { await fetch(`${this.API_URL}/transactions`, { method: 'DELETE', headers: this._getAuthHeaders() }); this.transactions = []; }
    async updateBudget(category, amount) { await fetch(`${this.API_URL}/budgets`, { method: 'POST', headers: this._getAuthHeaders(), body: JSON.stringify({ category, amount }) }); if (amount > 0) this.budgets[category] = amount; else delete this.budgets[category]; }
    async deleteBudget(category) { await this.updateBudget(category, 0); }
    async addRecurringTransaction(data) { const res = await fetch(`${this.API_URL}/recurring`, { method: 'POST', headers: this._getAuthHeaders(), body: JSON.stringify(data) }); this.recurringTransactions.push(await res.json()); }
    async deleteRecurringTransaction(id) { await fetch(`${this.API_URL}/recurring/${id}`, { method: 'DELETE', headers: this._getAuthHeaders() }); this.recurringTransactions = this.recurringTransactions.filter(rt => rt.id !== id); }
    async addReminder(data) { const res = await fetch(`${this.API_URL}/reminders`, { method: 'POST', headers: this._getAuthHeaders(), body: JSON.stringify(data) }); this.reminders.push(await res.json()); }
    async updateReminder(id, isPaid) { const res = await fetch(`${this.API_URL}/reminders/${id}`, { method: 'PUT', headers: this._getAuthHeaders(), body: JSON.stringify({ isPaid }) }); const updated = await res.json(); const index = this.reminders.findIndex(r => r.id === id); if (index !== -1) this.reminders[index] = updated; }
    async deleteReminder(id) { await fetch(`${this.API_URL}/reminders/${id}`, { method: 'DELETE', headers: this._getAuthHeaders() }); this.reminders = this.reminders.filter(r => r.id !== id); }

    // --- MÉTODOS DE GET E CÁLCULO (LOCAIS) ---
    getTransactions() { return this.transactions.sort((a, b) => new Date(b.date) - new Date(a.date)); }
    getBudgets() { return this.budgets; }
    getRecurringTransactions() { return this.recurringTransactions; }
    getReminders() { return this.reminders.sort((a, b) => new Date(a.duedate) - new Date(b.duedate)); }
    getDashboardReminders() { return this.getReminders().filter(r => !r.ispaid).slice(0, 3); }
    getTransactionById(id) { return this.transactions.find(t => t.id === id); }
    getFilteredTransactions(filters) { let f = this.getTransactions(); if (filters.searchTerm) f = f.filter(t => t.description.toLowerCase().includes(filters.searchTerm.toLowerCase())); if (filters.type && filters.type !== 'all') f = f.filter(t => t.type === filters.type); if (filters.month && filters.month !== 'all') f = f.filter(t => t.date.startsWith(filters.month)); return f; }
    getTransactionsByDateRange(range) {
        const now = new Date();
        switch (range) {
            case 'thisMonth': const m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; return this.transactions.filter(t => t.date.startsWith(m));
            case 'lastMonth': const d = new Date(now.getFullYear(), now.getMonth() - 1, 1); const lm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; return this.transactions.filter(t => t.date.startsWith(lm));
            case 'thisYear': return this.transactions.filter(t => t.date.startsWith(String(now.getFullYear())));
            default: return this.transactions;
        }
    }
    calculateTotals(transactions) { const t = transactions.reduce((a, t) => { if (t.type === 'income') a.revenue += parseFloat(t.amount); else if (t.type === 'expense') a.expenses += parseFloat(t.amount); return a; }, { revenue: 0, expenses: 0 }); t.balance = t.revenue + t.expenses; return t; }
    getExpensesByCategory(transactions) { return transactions.filter(t => t.type === 'expense').reduce((a, t) => { const { category: c, amount: m } = t; if (!a[c]) a[c] = 0; a[c] += Math.abs(parseFloat(m)); return a; }, {}); }
    getMonthlySummary(numMonths) { const s = { labels: [], incomeData: [], expenseData: [] }; const n = new Date(); n.setDate(15); for (let i = 0; i < numMonths; i++) { const d = new Date(n.getFullYear(), n.getMonth() - i, 15); const l = `${d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}/${d.getFullYear()}`; s.labels.push(l.charAt(0).toUpperCase() + l.slice(1)); const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; const mT = this.transactions.filter(t => t.date.startsWith(m)); let tI = 0; let tE = 0; mT.forEach(t => { if (t.type === 'income') tI += parseFloat(t.amount); else tE += Math.abs(parseFloat(t.amount)); }); s.incomeData.push(tI); s.expenseData.push(tE); } s.labels.reverse(); s.incomeData.reverse(); s.expenseData.reverse(); return s; }
    getBudgetsStatus() { const s = this.getExpensesByCategory(this.getTransactionsByDateRange('thisMonth')); return Object.entries(this.budgets).map(([c, b]) => ({ category: c, budget: parseFloat(b), spent: s[c] || 0, percentage: parseFloat(b) > 0 ? ((s[c] || 0) / parseFloat(b)) * 100 : 0 })).sort((a, b) => b.percentage - a.percentage); }
}