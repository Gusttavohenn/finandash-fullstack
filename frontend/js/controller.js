console.log("Controller.js carregado.");

class Controller {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.init();
    }

    _setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            const tag = document.activeElement?.tagName;
            const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
            const searchOpen = !document.getElementById('global-search-modal')?.classList.contains('page-hidden');
            if (e.key === 'Escape') { this.view.toggleModal(false); this.view.hideSearchModal(); return; }
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); this.view.showSearchModal(); return; }
            if (!inInput && !searchOpen) {
                if (e.key === '/') { e.preventDefault(); this.view.showSearchModal(); }
                if (e.key === 'n' || e.key === 'N') { e.preventDefault(); this.view.toggleModal(true); }
            }
        });
    }
    _setupBeforeUnload() {
        const modal = document.getElementById('transaction-modal');
        window.addEventListener('beforeunload', (e) => {
            if (!modal?.classList.contains('page-hidden')) {
                e.preventDefault(); e.returnValue = '';
            }
        });
    }
    async _setupNotifications() {
        if (!('Notification' in window)) return;
        let permission = Notification.permission;
        if (permission === 'default') permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
        const today = new Date(); today.setHours(0,0,0,0);
        const twoDaysLater = new Date(today); twoDaysLater.setDate(twoDaysLater.getDate() + 2);
        this.model.getReminders().filter(r => !r.ispaid).forEach(r => {
            const due = new Date(r.duedate + 'T00:00:00');
            if (due <= twoDaysLater) {
                const diff = Math.round((due - today) / 86400000);
                const when = diff === 0 ? 'vence hoje' : diff < 0 ? `venceu há ${Math.abs(diff)} dia(s)` : `vence em ${diff} dia(s)`;
                new Notification('NEXO - Lembrete', { body: `${r.description} ${when}${r.amount ? ` • ${parseFloat(r.amount).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}` : ''}`, icon: '/favicon.ico' });
            }
        });
    }
    _scheduleAutoLogout() {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const msUntilExpiry = payload.exp * 1000 - Date.now();
            if (msUntilExpiry <= 0) { this.handleLogout(); return; }
            setTimeout(() => { this.view.showToast('Sua sessão expirou. Faça login novamente.', 'error'); setTimeout(() => this.handleLogout(), 3000); }, msUntilExpiry);
        } catch { /* token inválido, ignora */ }
    }
    async init() {
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        if (!loggedInUser) return;
        this.setupEventListeners();
        this._scheduleAutoLogout();
        this.view.showLoading();
        try {
            if (this.model.isDemo) { this.model.loadDemoData(); document.getElementById('demo-banner')?.classList.remove('hidden'); }
            else { await this.model.loadInitialData(); }
        } catch {
            this.view.hideLoading();
            this.view.showToast('Erro ao conectar com o servidor. Tente recarregar a página.', 'error');
            return;
        }
        this.view.hideLoading();
        this.view.displayUserSettings(this.model.userSettings);
        this.onDataChanged();
        this.view.showPage('dashboard');
        if (!this.model.isDemo) this._setupNotifications();
        this._setupKeyboardShortcuts();
        this._setupBeforeUnload();
    }

    onDataChanged() {
        const allTransactions = this.model.getTransactions();
        const budgets = this.model.getBudgets();
        const recurringTxs = this.model.getRecurringTransactions();
        const reminders = this.model.getReminders();
        const dashboardReminders = this.model.getDashboardReminders();
        const dateRange = this.view.getDashboardDateRange();
        const dashboardTransactions = this.model.getTransactionsByDateRange(dateRange);
        const totals = this.model.calculateTotals(dashboardTransactions);
        const forecast = this.model.getNextMonthForecast();
        const expensesByCategory = this.model.getExpensesByCategory(dashboardTransactions);
        const budgetsStatus = this.model.getBudgetsStatus();
        const monthlySummary = this.model.getMonthlySummary(6);
        const balanceEvolution = this.model.getBalanceEvolution(6);
        const filters = this.view.getFilterValues();
        const filteredTransactions = this.model.getFilteredTransactions(filters);
        const { paginatedItems, totalPages } = this.paginate(filteredTransactions);
        const recentTransactions = allTransactions.slice(0, 5);

        this.view.displayUserSettings(this.model.userSettings);
        this.view.populateMonthFilter(allTransactions);
        this.view.renderCards(totals, forecast);
        this.view.renderChart(expensesByCategory);
        this.view.renderMonthlySummaryChart(monthlySummary);
        this.view.renderBalanceEvolutionChart(balanceEvolution);
        this.view.renderDashboardBudgets(budgetsStatus);
        this.view.renderDashboardReminders(dashboardReminders);
        this.view.renderTransactionsTable(recentTransactions);
        this.view.renderFullTransactionsTable(paginatedItems);
        this.view.renderPagination(this.currentPage, totalPages);
        this.view.renderBudgetsPage(budgets, this.handleDeleteBudget);
        this.view.renderRecurringTransactionsPage(recurringTxs, this.handleDeleteRecurring);
        this.view.renderRemindersPage(reminders, this.handleUpdateReminder, this.handleDeleteReminder);
    }

    paginate(items) {
        const totalItems = items.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;
        if (this.currentPage > totalPages) this.currentPage = totalPages;
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        return { paginatedItems: items.slice(startIndex, startIndex + this.itemsPerPage), totalPages };
    }

    setupEventListeners() {
        this.view.bindThemeToggler(this.handleThemeToggle);
        this.view.bindMenuNavigation(this.handleMenuNavigation);
        this.view.bindModalControls();
        this.view.bindSubmitTransaction(this.handleSubmitTransaction);
        this.view.bindSaveSettings(this.handleSaveSettings);
        this.view.bindClearAllData(this.handleClearAllData);
        this.view.bindLogout(this.handleLogout);
        this.view.bindTransactionTypeChange();
        this.view.bindEditAndDeleteTransaction(this.handleEditTransaction, this.handleDeleteTransaction);
        this.view.bindConfirmationControls();
        this.view.bindFilters(this.handleFilterChange);
        this.view.bindDashboardDateFilter(this.handleDashboardChange);
        this.view.bindPagination(this.handlePrevPage, this.handleNextPage);
        this.view.bindBudgetForm(this.handleUpdateBudget);
        this.view.bindRecurringForm(this.handleAddRecurring);
        this.view.bindReminderForm(this.handleAddReminder);
        this.view.bindExportCSV(this.handleExportCSV);
        this.view.bindImportCSV(this.handleImportCSV);
        this.view.bindPDF(this.handleExportPDF);
        this.view.bindOpenSearch(() => this.view.showSearchModal());
        this.view.bindSearchInput(this.handleGlobalSearch);
        this.view.bindSearchOverlayClose(() => this.view.hideSearchModal());
        this.view.bindBalanceImpact(this.handleBalanceImpact);
    }

    // handle
    handleFilterChange = () => { this.currentPage = 1; this.onDataChanged(); }
    handleDashboardChange = () => { this.onDataChanged(); }
    handlePrevPage = () => { if (this.currentPage > 1) { this.currentPage--; this.onDataChanged(); } }
    handleNextPage = () => {
        const filters = this.view.getFilterValues();
        const filteredTransactions = this.model.getFilteredTransactions(filters);
        const totalPages = Math.ceil(filteredTransactions.length / this.itemsPerPage);
        if (this.currentPage < totalPages) { this.currentPage++; this.onDataChanged(); }
    }
    handleMenuNavigation = (pageId) => { this.view.showPage(pageId); }
    _isUnauthorized(e) { return e?.message === 'UNAUTHORIZED'; }
    handleSubmitTransaction = async (data) => { try { if (data.id) { await this.model.editTransaction(data.id, data); this.view.showToast('Transação atualizada!'); } else { await this.model.addTransaction(data); this.view.showToast('Transação adicionada!'); } this.onDataChanged(); } catch (e) { if (!this._isUnauthorized(e)) this.view.showToast('Erro ao salvar transação. Tente novamente.', 'error'); } }
    handleEditTransaction = (id) => { const t = this.model.getTransactionById(id); if (t) this.view.toggleModal(true, t); }
    handleDeleteTransaction = async (id) => { try { await this.model.deleteTransaction(id); this.view.showToast('Transação excluída.'); this.onDataChanged(); } catch (e) { if (!this._isUnauthorized(e)) this.view.showToast('Erro ao excluir transação.', 'error'); } }
    handleThemeToggle = () => { document.body.classList.toggle('dark-mode'); localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light'); }
    handleSaveSettings = async (newName) => { try { await this.model.updateProfile(newName); this.view.displayUserSettings(this.model.userSettings); this.view.showToast('Perfil salvo!'); } catch (e) { if (!this._isUnauthorized(e)) this.view.showToast('Erro ao salvar perfil.', 'error'); } }
    handleClearAllData = async () => { try { await this.model.clearAllData(); this.view.showToast('Todas as transações foram apagadas.'); this.onDataChanged(); } catch (e) { if (!this._isUnauthorized(e)) this.view.showToast('Erro ao apagar dados.', 'error'); } }
    handleLogout = () => { localStorage.removeItem('loggedInUser'); localStorage.removeItem('authToken'); localStorage.removeItem('demoMode'); window.location.href = '/login'; }
    handleUpdateBudget = async (category, amount) => { try { await this.model.updateBudget(category, amount); this.view.showToast('Orçamento salvo!'); this.onDataChanged(); } catch (e) { if (!this._isUnauthorized(e)) this.view.showToast('Erro ao salvar orçamento.', 'error'); } }
    handleDeleteBudget = async (category) => { try { await this.model.deleteBudget(category); this.view.showToast('Orçamento removido.'); this.onDataChanged(); } catch (e) { if (!this._isUnauthorized(e)) this.view.showToast('Erro ao remover orçamento.', 'error'); } }
    handleAddRecurring = async (data) => { try { await this.model.addRecurringTransaction(data); this.view.showToast('Recorrência salva!'); this.onDataChanged(); } catch (e) { if (!this._isUnauthorized(e)) this.view.showToast('Erro ao salvar recorrência.', 'error'); } }
    handleDeleteRecurring = async (id) => { try { await this.model.deleteRecurringTransaction(id); this.view.showToast('Recorrência removida.'); this.onDataChanged(); } catch (e) { if (!this._isUnauthorized(e)) this.view.showToast('Erro ao remover recorrência.', 'error'); } }
    handleAddReminder = async (data) => { try { await this.model.addReminder(data); this.view.showToast('Lembrete adicionado!'); this.onDataChanged(); } catch (e) { if (!this._isUnauthorized(e)) this.view.showToast('Erro ao adicionar lembrete.', 'error'); } }
    handleUpdateReminder = async (id, isPaid) => { try { await this.model.updateReminder(id, isPaid); this.onDataChanged(); } catch (e) { if (!this._isUnauthorized(e)) this.view.showToast('Erro ao atualizar lembrete.', 'error'); } }
    handleDeleteReminder = async (id) => { try { await this.model.deleteReminder(id); this.view.showToast('Lembrete removido.'); this.onDataChanged(); } catch (e) { if (!this._isUnauthorized(e)) this.view.showToast('Erro ao remover lembrete.', 'error'); } }
    handleGlobalSearch = (term) => {
        const results = this.model.globalSearch(term);
        this.view.renderSearchResults(results, (type, id) => {
            this.view.hideSearchModal();
            this.view.showPage(type === 'transactions' ? 'transactions' : type === 'reminders' ? 'reminders' : 'budgets');
        });
    }
    handleBalanceImpact = (amountStr, type) => {
        const amount = parseFloat(amountStr);
        const currentBalance = this.model.calculateTotals(this.model.getTransactions()).balance;
        this.view.renderBalanceImpact(amount, type, currentBalance);
    }
    handleExportPDF = () => {
        const transactions = this.model.getTransactionsByDateRange('thisMonth');
        const totals = this.model.calculateTotals(transactions);
        const expensesByCategory = this.model.getExpensesByCategory(transactions);
        const userName = this.model.userSettings.name;
        this.view.generatePDF(transactions, totals, expensesByCategory, userName);
        this.view.showToast('PDF gerado com sucesso!');
    }
    handleExportCSV = () => { const transactions = this.model.getTransactions(); if (transactions.length === 0) { this.view.showToast('Nenhuma transação para exportar.', 'error'); return; } this.view.exportToCSV(transactions); this.view.showToast('CSV exportado com sucesso!'); }
    handleImportCSV = async (file) => {
        const text = await file.text();
        const transactions = this.view.parseCSV(text);
        if (transactions.length === 0) { this.view.showToast('Nenhuma transação válida encontrada no CSV.', 'error'); return; }
        this.view.showLoading();
        let imported = 0, errors = 0;
        for (const t of transactions) {
            try { await this.model.addTransaction(t); imported++; } catch { errors++; }
        }
        this.view.hideLoading();
        this.onDataChanged();
        if (errors > 0) this.view.showToast(`${imported} importadas, ${errors} com erro.`, 'error');
        else this.view.showToast(`${imported} transações importadas com sucesso!`);
    }
}

const applyInitialTheme = () => { if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode'); }
applyInitialTheme();
const app = new Controller(new Model(), new View());
