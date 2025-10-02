// --- MODEL ---
console.log("Model.js carregado.");

class Model {
    constructor() {
        // URL final da sua API na Render
        this.API_URL = 'https://finandash-api-gustavo.onrender.com/api';
        this.transactions = [];
        this.userSettings = { name: 'Usuário' };
        this.budgets = {};
        this.recurringTransactions = [];
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
            // Pede ao backend para gerar transações recorrentes devidas
            await fetch(`${this.API_URL}/recurring/generate`, { method: 'POST', headers: this._getAuthHeaders() });

            // Carrega todos os dados do backend em paralelo para mais performance
            const [transactions, budgets, recurring] = await Promise.all([
                fetch(`${this.API_URL}/transactions`, { headers: this._getAuthHeaders() }).then(res => res.json()),
                fetch(`${this.API_URL}/budgets`, { headers: this._getAuthHeaders() }).then(res => res.json()),
                fetch(`${this.API_URL}/recurring`, { headers: this._getAuthHeaders() }).then(res => res.json())
            ]);
            
            this.transactions = transactions;
            this.budgets = budgets;
            this.recurringTransactions = recurring;

            const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
            this.userSettings.name = loggedInUser.name;

        } catch (error) {
            console.error("Erro ao carregar dados iniciais:", error);
            // Em caso de falha (token expirado, etc.), desloga o usuário
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    }

    // --- MANIPULAÇÃO VIA API ---
    async addTransaction(data) {
        const response = await fetch(`${this.API_URL}/transactions`, { method: 'POST', headers: this._getAuthHeaders(), body: JSON.stringify(data) });
        const newTransaction = await response.json();
        this.transactions.unshift(newTransaction);
    }

    async editTransaction(id, data) {
        const response = await fetch(`${this.API_URL}/transactions/${id}`, { method: 'PUT', headers: this._getAuthHeaders(), body: JSON.stringify(data) });
        const updatedTransaction = await response.json();
        const index = this.transactions.findIndex(t => t.id === id);
        if (index !== -1) this.transactions[index] = updatedTransaction;
    }

    async deleteTransaction(id) {
        await fetch(`${this.API_URL}/transactions/${id}`, { method: 'DELETE', headers: this._getAuthHeaders() });
        this.transactions = this.transactions.filter(t => t.id !== id);
    }

    async clearAllData() {
        await fetch(`${this.API_URL}/transactions`, { method: 'DELETE', headers: this._getAuthHeaders() });
        this.transactions = [];
    }
    
    async updateBudget(category, amount) {
        await fetch(`${this.API_URL}/budgets`, { method: 'POST', headers: this._getAuthHeaders(), body: JSON.stringify({ category, amount }) });
        if (amount > 0) this.budgets[category] = amount;
        else delete this.budgets[category];
    }
    
    async deleteBudget(category) {
        await this.updateBudget(category, 0);
    }
    
    async addRecurringTransaction(data) {
        const response = await fetch(`${this.API_URL}/recurring`, { method: 'POST', headers: this._getAuthHeaders(), body: JSON.stringify(data) });
        const newRecurring = await response.json();
        this.recurringTransactions.push(newRecurring);
    }
    
    async deleteRecurringTransaction(id) {
        await fetch(`${this.API_URL}/recurring/${id}`, { method: 'DELETE', headers: this._getAuthHeaders() });
        this.recurringTransactions = this.recurringTransactions.filter(rt => rt.id !== id);
    }

    // --- MÉTODOS DE GET E CÁLCULO (LOCAIS) ---
    getTransactions() { return this.transactions.sort((a, b) => new Date(b.date) - new Date(a.date)); }
    getBudgets() { return this.budgets; }
    getRecurringTransactions() { return this.recurringTransactions; }
    getTransactionById(id) { return this.transactions.find(t => t.id === id); }
    getFilteredTransactions(filters) {
        let filtered = this.getTransactions();
        if (filters.searchTerm) filtered = filtered.filter(t => t.description.toLowerCase().includes(filters.searchTerm.toLowerCase()));
        if (filters.type && filters.type !== 'all') filtered = filtered.filter(t => t.type === filters.type);
        if (filters.month && filters.month !== 'all') filtered = filtered.filter(t => t.date.startsWith(filters.month));
        return filtered;
    }
    getTransactionsByDateRange(range) {
        const now = new Date();
        switch (range) {
            case 'thisMonth':
                const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                return this.transactions.filter(t => t.date.startsWith(thisMonthStr));
            case 'lastMonth':
                const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
                return this.transactions.filter(t => t.date.startsWith(lastMonthStr));
            case 'thisYear':
                return this.transactions.filter(t => t.date.startsWith(String(now.getFullYear())));
            default: return this.transactions;
        }
    }
    calculateTotals(transactions) {
        const totals = transactions.reduce((acc, t) => {
            if (t.type === 'income') acc.revenue += parseFloat(t.amount); else if (t.type === 'expense') acc.expenses += parseFloat(t.amount);
            return acc;
        }, { revenue: 0, expenses: 0 });
        totals.balance = totals.revenue + totals.expenses;
        return totals;
    }
    getExpensesByCategory(transactions) {
        return transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
            const { category, amount } = t;
            if (!acc[category]) acc[category] = 0;
            acc[category] += Math.abs(parseFloat(amount));
            return acc;
        }, {});
    }
    getMonthlySummary(numberOfMonths) {
        const summary = { labels: [], incomeData: [], expenseData: [] };
        const now = new Date(); now.setDate(15);
        for (let i = 0; i < numberOfMonths; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 15);
            const label = `${date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}/${date.getFullYear()}`;
            summary.labels.push(label.charAt(0).toUpperCase() + label.slice(1));
            const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthTransactions = this.transactions.filter(t => t.date.startsWith(monthStr));
            let totalIncome = 0; let totalExpense = 0;
            monthTransactions.forEach(t => { if (t.type === 'income') totalIncome += parseFloat(t.amount); else totalExpense += Math.abs(parseFloat(t.amount)); });
            summary.incomeData.push(totalIncome);
            summary.expenseData.push(totalExpense);
        }
        summary.labels.reverse(); summary.incomeData.reverse(); summary.expenseData.reverse();
        return summary;
    }
    getBudgetsStatus() {
        const spentByCategory = this.getExpensesByCategory(this.getTransactionsByDateRange('thisMonth'));
        return Object.entries(this.budgets).map(([category, budgetAmount]) => {
            const spent = spentByCategory[category] || 0;
            return { category, budget: parseFloat(budgetAmount), spent, percentage: parseFloat(budgetAmount) > 0 ? (spent / parseFloat(budgetAmount)) * 100 : 0 };
        }).sort((a, b) => b.percentage - a.percentage);
    }
}