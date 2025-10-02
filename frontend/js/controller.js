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
        const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
        if (!loggedInUser) return;
        this.setupEventListeners();
        await this.model.loadInitialData();
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
    handleSubmitTransaction = async (data) => { if (data.id) { await this.model.editTransaction(data.id, data); this.view.showToast('Transação atualizada!'); } else { await this.model.addTransaction(data); this.view.showToast('Transação adicionada!'); } this.onDataChanged(); }
    handleEditTransaction = (id) => { const t = this.model.getTransactionById(id); if (t) this.view.toggleModal(true, t); }
    handleDeleteTransaction = async (id) => { await this.model.deleteTransaction(id); this.view.showToast('Transação excluída.'); this.onDataChanged(); }
    handleThemeToggle = () => { document.body.classList.toggle('dark-mode'); localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light'); }
    handleSaveSettings = (newName) => { /* A lógica de salvar nome do usuário ainda é local */ this.view.showToast('Perfil salvo!'); }
    handleClearAllData = async () => { await this.model.clearAllData(); this.view.showToast('Todas as transações foram apagadas.'); this.onDataChanged(); }
    handleLogout = () => { sessionStorage.clear(); window.location.href = '/login'; }
    handleUpdateBudget = async (category, amount) => { await this.model.updateBudget(category, amount); this.view.showToast('Orçamento salvo!'); this.onDataChanged(); }
    handleDeleteBudget = async (category) => { await this.model.deleteBudget(category); this.view.showToast('Orçamento removido.'); this.onDataChanged(); }
    handleAddRecurring = async (data) => { await this.model.addRecurringTransaction(data); this.view.showToast('Recorrência salva!'); this.onDataChanged(); }
    handleDeleteRecurring = async (id) => { await this.model.deleteRecurringTransaction(id); this.view.showToast('Recorrência removida.'); this.onDataChanged(); }
    handleAddReminder = async (data) => { await this.model.addReminder(data); this.view.showToast('Lembrete adicionado!'); this.onDataChanged(); }
    handleUpdateReminder = async (id, isPaid) => { await this.model.updateReminder(id, isPaid); this.onDataChanged(); }
    handleDeleteReminder = async (id) => { await this.model.deleteReminder(id); this.view.showToast('Lembrete removido.'); this.onDataChanged(); }
}

const applyInitialTheme = () => { if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode'); }
applyInitialTheme();
const app = new Controller(new Model(), new View());

function setFavicon() {
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/svg+xml';
    link.rel = 'shortcut icon';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="#4A69BD" d="M64 32C28.7 32 0 60.7 0 96v320c0 35.3 28.7 64 64 64h448c35.3 0 64-28.7 64-64V192c0-35.3-28.7-64-64-64H80c-8.8 0-16-7.2-16-16s7.2-16 16-16h368c17.7 0 32-14.3 32-32s-14.3-32-32-32H64zM80 256h384c8.8 0 16 7.2 16 16v160c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V272c0-8.8 7.2-16 16-16z"/></svg>`;
    link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    document.head.appendChild(link);
}
setFavicon();