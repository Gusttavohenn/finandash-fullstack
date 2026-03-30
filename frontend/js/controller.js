console.log("Controller.js carregado.");

class Controller {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.init();
    }

    async init() {
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        if (!loggedInUser) return;
        this.setupEventListeners();
        this.view.showLoading();
        try {
            await this.model.loadInitialData();
        } catch {
            this.view.hideLoading();
            this.view.showToast('Erro ao conectar com o servidor. Tente recarregar a página.', 'error');
            return;
        }
        this.view.hideLoading();
        this.view.displayUserSettings(this.model.userSettings);
        this.onDataChanged();
        this.view.showPage('dashboard');
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
        const expensesByCategory = this.model.getExpensesByCategory(dashboardTransactions);
        const budgetsStatus = this.model.getBudgetsStatus();
        const monthlySummary = this.model.getMonthlySummary(6);
        const filters = this.view.getFilterValues();
        const filteredTransactions = this.model.getFilteredTransactions(filters);
        const { paginatedItems, totalPages } = this.paginate(filteredTransactions);
        const recentTransactions = allTransactions.slice(0, 5);

        this.view.displayUserSettings(this.model.userSettings);
        this.view.populateMonthFilter(allTransactions);
        this.view.renderCards(totals);
        this.view.renderChart(expensesByCategory);
        this.view.renderMonthlySummaryChart(monthlySummary);
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
    handleLogout = () => { localStorage.removeItem('loggedInUser'); localStorage.removeItem('authToken'); window.location.href = '/login'; }
    handleUpdateBudget = async (category, amount) => { try { await this.model.updateBudget(category, amount); this.view.showToast('Orçamento salvo!'); this.onDataChanged(); } catch (e) { if (!this._isUnauthorized(e)) this.view.showToast('Erro ao salvar orçamento.', 'error'); } }
    handleDeleteBudget = async (category) => { try { await this.model.deleteBudget(category); this.view.showToast('Orçamento removido.'); this.onDataChanged(); } catch (e) { if (!this._isUnauthorized(e)) this.view.showToast('Erro ao remover orçamento.', 'error'); } }
    handleAddRecurring = async (data) => { try { await this.model.addRecurringTransaction(data); this.view.showToast('Recorrência salva!'); this.onDataChanged(); } catch (e) { if (!this._isUnauthorized(e)) this.view.showToast('Erro ao salvar recorrência.', 'error'); } }
    handleDeleteRecurring = async (id) => { try { await this.model.deleteRecurringTransaction(id); this.view.showToast('Recorrência removida.'); this.onDataChanged(); } catch (e) { if (!this._isUnauthorized(e)) this.view.showToast('Erro ao remover recorrência.', 'error'); } }
    handleAddReminder = async (data) => { try { await this.model.addReminder(data); this.view.showToast('Lembrete adicionado!'); this.onDataChanged(); } catch (e) { if (!this._isUnauthorized(e)) this.view.showToast('Erro ao adicionar lembrete.', 'error'); } }
    handleUpdateReminder = async (id, isPaid) => { try { await this.model.updateReminder(id, isPaid); this.onDataChanged(); } catch (e) { if (!this._isUnauthorized(e)) this.view.showToast('Erro ao atualizar lembrete.', 'error'); } }
    handleDeleteReminder = async (id) => { try { await this.model.deleteReminder(id); this.view.showToast('Lembrete removido.'); this.onDataChanged(); } catch (e) { if (!this._isUnauthorized(e)) this.view.showToast('Erro ao remover lembrete.', 'error'); } }
    handleExportCSV = () => { const transactions = this.model.getTransactions(); if (transactions.length === 0) { this.view.showToast('Nenhuma transação para exportar.', 'error'); return; } this.view.exportToCSV(transactions); this.view.showToast('CSV exportado com sucesso!'); }
}

const applyInitialTheme = () => { if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode'); }
applyInitialTheme();
const app = new Controller(new Model(), new View());
