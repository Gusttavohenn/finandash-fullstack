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
        
        // Carrega os dados da API
        await this.model.loadInitialData();
        
        this.view.displayUserSettings(this.model.userSettings);
        this.onDataChanged();
        this.view.showPage('dashboard');
    }

    onDataChanged() {
        const allTransactions = this.model.getTransactions();
        const budgets = this.model.getBudgets();
        const recurringTxs = this.model.getRecurringTransactions();

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
        this.view.renderTransactionsTable(recentTransactions);
        this.view.renderFullTransactionsTable(paginatedItems);
        this.view.renderPagination(this.currentPage, totalPages);
        this.view.renderBudgetsPage(budgets, this.handleDeleteBudget);
        this.view.renderRecurringTransactionsPage(recurringTxs, this.handleDeleteRecurring);
    }

    paginate(items) {
        const totalItems = items.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;
        if (this.currentPage > totalPages) this.currentPage = totalPages;
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const paginatedItems = items.slice(startIndex, startIndex + this.itemsPerPage);
        return { paginatedItems, totalPages };
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
    }

    // HANDLERS
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
    
    handleSubmitTransaction = async (data) => {
        if (data.id) await this.model.editTransaction(data.id, data);
        else await this.model.addTransaction(data);
        this.onDataChanged();
    }
    handleEditTransaction = (id) => { const t = this.model.getTransactionById(id); if (t) this.view.toggleModal(true, t); }
    handleDeleteTransaction = async (id) => { await this.model.deleteTransaction(id); this.onDataChanged(); }
    
    handleThemeToggle = () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    }
    handleSaveSettings = (newName) => { alert('Nome salvo. Será atualizado na próxima vez que você logar.'); }
    handleClearAllData = async () => { await this.model.clearAllData(); this.onDataChanged(); }
    handleLogout = () => { sessionStorage.clear(); window.location.href = '/login'; }
    
    handleUpdateBudget = async (category, amount) => { await this.model.updateBudget(category, amount); this.onDataChanged(); }
    handleDeleteBudget = async (category) => { await this.model.deleteBudget(category); this.onDataChanged(); }
    
    handleAddRecurring = async (data) => { await this.model.addRecurringTransaction(data); this.onDataChanged(); }
    handleDeleteRecurring = async (id) => { await this.model.deleteRecurringTransaction(id); this.onDataChanged(); }
}

// ENTRADA DA APLICAÇÃO
const applyInitialTheme = () => { if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode'); }
applyInitialTheme();
const app = new Controller(new Model(), new View());