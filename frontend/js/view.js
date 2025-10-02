console.log("View.js carregado.");

class View {
    constructor() {
        // Cards de Métricas
        this.totalRevenueEl = document.getElementById('total-revenue');
        this.totalExpensesEl = document.getElementById('total-expenses');
        this.balanceEl = document.getElementById('balance');
        // Tabela de Transações (Dashboard)
        this.transactionsTableBody = document.querySelector('#transactions-table tbody');
        // Gráficos
        this.chartContext = document.getElementById('expensesChart').getContext('2d');
        this.expensesChart = null;
        this.monthlySummaryChartContext = document.getElementById('monthlySummaryChart').getContext('2d');
        this.monthlySummaryChart = null;
        // Cabeçalho e Tema
        this.themeToggleButton = document.getElementById('theme-toggle');
        this.userNameHeaderEl = document.querySelector('.user-profile span');
        // Páginas e Menu
        this.pages = document.querySelectorAll('.page-content');
        this.menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
        // Página de Transações
        this.fullTransactionsTableBody = document.querySelector('#full-transactions-table tbody');
        this.addTransactionBtn = document.getElementById('add-transaction-btn');
        // Modal e Formulário de Transação
        this.modal = document.getElementById('transaction-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.transactionForm = document.getElementById('transaction-form');
        this.cancelBtn = document.getElementById('cancel-btn');
        this.transactionTypeSelect = document.getElementById('type');
        this.paymentMethodGroup = document.getElementById('payment-method-group');
        this.paymentMethodSelect = document.getElementById('payment-method');
        // Elementos da página de Configurações
        this.userNameInputEl = document.getElementById('user-name');
        this.profileFormEl = document.getElementById('profile-form');
        this.clearDataBtnEl = document.getElementById('clear-data-btn');
        this.logoutBtn = document.querySelector('.sidebar-menu .logout');
        this.logoutBtnPage = document.getElementById('logout-btn-page');
        // Modal de Confirmação
        this.confirmationModal = document.getElementById('confirmation-modal');
        this.confirmationMessage = document.getElementById('confirmation-message');
        this.cancelConfirmationBtn = document.getElementById('cancel-confirmation-btn');
        this.confirmActionBtn = document.getElementById('confirm-action-btn');
        // Filtros da pág. Transações
        this.searchInput = document.getElementById('search-input');
        this.typeFilter = document.getElementById('type-filter');
        this.monthFilter = document.getElementById('month-filter');
        // Filtro de data do Dashboard
        this.dashboardDateFilter = document.getElementById('dashboard-date-filter');
        // Controles de Paginação
        this.paginationControls = document.getElementById('pagination-controls');
        this.prevPageBtn = document.getElementById('prev-page-btn');
        this.nextPageBtn = document.getElementById('next-page-btn');
        this.pageInfo = document.getElementById('page-info');
        // Seletores de Orçamento
        this.budgetForm = document.getElementById('budget-form');
        this.budgetsList = document.getElementById('budgets-list');
        this.dashboardBudgetsContainer = document.getElementById('dashboard-budgets-container');
        // Seletores de Recorrentes
        this.recurringForm = document.getElementById('recurring-form');
        this.recurringList = document.getElementById('recurring-list');
        // Container de Notificações (Toasts)
        this.toastContainer = document.getElementById('toast-container');
    }

    _formatCurrency(value) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

    renderCards(totals) {
        this.totalRevenueEl.textContent = this._formatCurrency(totals.revenue);
        this.totalExpensesEl.textContent = this._formatCurrency(Math.abs(totals.expenses));
        this.balanceEl.textContent = this._formatCurrency(totals.balance);
    }

    renderTransactionsTable(transactions) {
        this.transactionsTableBody.innerHTML = '';
        if (transactions.length === 0) {
            this.transactionsTableBody.insertRow().innerHTML = `<td colspan="5" style="text-align: center;">Nenhuma transação encontrada.</td>`;
            return;
        }
        transactions.forEach(t => {
            const formattedDate = new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            this.transactionsTableBody.insertRow().innerHTML = `<td>${t.description}</td><td>${formattedDate}</td><td class="${t.type}">${this._formatCurrency(t.amount)}</td><td>${t.category}</td><td>${t.paymentMethod || '---'}</td>`;
        });
    }

    renderFullTransactionsTable(transactions) {
        this.fullTransactionsTableBody.innerHTML = '';
        if (transactions.length === 0) {
            this.fullTransactionsTableBody.insertRow().innerHTML = `<td colspan="6" style="text-align: center;">Nenhuma transação encontrada para os filtros selecionados.</td>`;
            return;
        }
        transactions.forEach(t => {
            const formattedDate = new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            this.fullTransactionsTableBody.insertRow().innerHTML = `<td>${t.description}</td><td>${formattedDate}</td><td class="${t.type}">${this._formatCurrency(t.amount)}</td><td>${t.category}</td><td>${t.paymentMethod || '---'}</td><td><button class="action-btn edit" data-id="${t.id}"><i class="fas fa-edit"></i></button><button class="action-btn delete" data-id="${t.id}"><i class="fas fa-trash"></i></button></td>`;
        });
    }

    renderChart(expensesByCategory) {
        const labels = Object.keys(expensesByCategory);
        const data = Object.values(expensesByCategory);
        if (this.expensesChart) {
            this.expensesChart.data.labels = labels;
            this.expensesChart.data.datasets[0].data = data;
            this.expensesChart.update();
        } else {
            this.expensesChart = new Chart(this.chartContext, {
                type: 'doughnut', data: { labels, datasets: [{ label: 'Despesas por Categoria', data, backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'], hoverOffset: 4 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
            });
        }
    }
    
    renderMonthlySummaryChart(summaryData) {
        const datasets = [
            { label: 'Receitas', data: summaryData.incomeData, backgroundColor: 'rgba(40, 167, 69, 0.7)', borderColor: 'rgba(40, 167, 69, 1)', borderWidth: 1 },
            { label: 'Despesas', data: summaryData.expenseData, backgroundColor: 'rgba(220, 53, 69, 0.7)', borderColor: 'rgba(220, 53, 69, 1)', borderWidth: 1 }
        ];
        if (this.monthlySummaryChart) {
            this.monthlySummaryChart.data.labels = summaryData.labels;
            this.monthlySummaryChart.data.datasets = datasets;
            this.monthlySummaryChart.update();
        } else {
            this.monthlySummaryChart = new Chart(this.monthlySummaryChartContext, {
                type: 'bar', data: { labels: summaryData.labels, datasets: datasets },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: 'top' } } }
            });
        }
    }

    populateMonthFilter(transactions) {
        const months = new Set(transactions.map(t => t.date.substring(0, 7)));
        const currentValue = this.monthFilter.value;
        this.monthFilter.innerHTML = '<option value="all">Todos os Meses</option>';
        Array.from(months).sort().reverse().forEach(month => {
            const [year, monthNum] = month.split('-');
            const monthName = new Date(year, monthNum - 1).toLocaleString('pt-BR', { month: 'long' });
            this.monthFilter.innerHTML += `<option value="${month}">${monthName.charAt(0).toUpperCase() + monthName.slice(1)}/${year}</option>`;
        });
        this.monthFilter.value = currentValue;
    }
    
    renderPagination(currentPage, totalPages) {
        if (totalPages <= 1) { this.paginationControls.style.display = 'none'; return; }
        this.paginationControls.style.display = 'flex';
        this.pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        this.prevPageBtn.disabled = currentPage === 1;
        this.nextPageBtn.disabled = currentPage === totalPages;
    }

    renderBudgetsPage(budgets, deleteHandler) {
        this.budgetsList.innerHTML = '';
        if (Object.keys(budgets).length === 0) {
            this.budgetsList.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Nenhum orçamento definido.</p>';
            return;
        }
        Object.entries(budgets).forEach(([category, amount]) => {
            this.budgetsList.innerHTML += `<div class="budget-item"><div class="budget-item-info"><p>${category}</p><span>Limite: ${this._formatCurrency(amount)}</span></div><div class="budget-item-actions"><button data-category="${category}" class="delete-budget-btn"><i class="fas fa-trash"></i></button></div></div>`;
        });
        this.budgetsList.querySelectorAll('.delete-budget-btn').forEach(btn => {
            btn.addEventListener('click', e => deleteHandler(e.currentTarget.dataset.category));
        });
    }

    renderDashboardBudgets(budgetsStatus) {
        this.dashboardBudgetsContainer.innerHTML = '';
        if (budgetsStatus.length === 0) {
            this.dashboardBudgetsContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Defina seus orçamentos na página "Orçamentos" para ver seu progresso aqui.</p>';
            return;
        }
        budgetsStatus.forEach(item => {
            const percentage = Math.min(item.percentage, 100);
            const overBudget = item.percentage > 100;
            this.dashboardBudgetsContainer.innerHTML += `<div class="budget-item-info"><div style="display: flex; justify-content: space-between;"><p>${item.category}</p><span>${this._formatCurrency(item.spent)} / ${this._formatCurrency(item.budget)}</span></div><div class="progress-bar-container"><div class="progress-bar ${overBudget ? 'over-budget' : ''}" style="width: ${percentage}%;"></div></div></div>`;
        });
    }

    renderRecurringTransactionsPage(recurringTxs, deleteHandler) {
        this.recurringList.innerHTML = '';
        if (recurringTxs.length === 0) {
            this.recurringList.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Nenhuma transação recorrente definida.</p>';
            return;
        }
        recurringTxs.forEach(rt => {
            const typeText = rt.type === 'income' ? 'Receita' : 'Despesa';
            this.recurringList.innerHTML += `<div class="recurring-item"><div class="recurring-item-info"><p>${rt.description} (${typeText})</p><span>${this._formatCurrency(rt.amount)} todo dia ${rt.dayOfMonth}</span></div><div class="recurring-item-actions"><button data-id="${rt.id}" class="delete-recurring-btn"><i class="fas fa-trash"></i></button></div></div>`;
        });
        this.recurringList.querySelectorAll('.delete-recurring-btn').forEach(btn => {
            btn.addEventListener('click', e => deleteHandler(parseInt(e.currentTarget.dataset.id)));
        });
    }

    showPage(pageId) {
        this.pages.forEach(page => page.classList.add('page-hidden'));
        document.getElementById(`${pageId}-page`).classList.remove('page-hidden');
        this.updateMenuActiveState(pageId);
    }
    
    updateMenuActiveState(pageId) {
        this.menuItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageId) item.classList.add('active');
        });
    }
    
    toggleModal(show = true, transaction = null) {
        if (show) {
            this.transactionForm.reset();
            if (transaction) {
                this.modalTitle.textContent = 'Editar Transação';
                this.transactionForm['transaction-id'].value = transaction.id;
                this.transactionForm.description.value = transaction.description;
                this.transactionForm.amount.value = Math.abs(transaction.amount);
                this.transactionForm.date.value = transaction.date;
                this.transactionForm.category.value = transaction.category;
                this.transactionForm.type.value = transaction.type;
                this.paymentMethodGroup.style.display = transaction.type === 'expense' ? 'block' : 'none';
                if (transaction.type === 'expense') this.paymentMethodSelect.value = transaction.paymentMethod;
            } else {
                this.modalTitle.textContent = 'Nova Transação';
                this.transactionForm['transaction-id'].value = '';
                this.paymentMethodGroup.style.display = this.transactionTypeSelect.value === 'expense' ? 'block' : 'none';
            }
            this.modal.classList.remove('page-hidden');
        } else { this.modal.classList.add('page-hidden'); }
    }

    displayUserSettings(settings) {
        if (settings.name) {
            this.userNameInputEl.value = settings.name;
            this.userNameHeaderEl.textContent = settings.name;
        }
    }

    hideConfirmationModal() { this.confirmationModal.classList.add('page-hidden'); }
    showConfirmationModal(message, onConfirm) {
        this.confirmationMessage.textContent = message;
        this.confirmationModal.classList.remove('page-hidden');
        this.confirmActionBtn.onclick = () => { onConfirm(); this.hideConfirmationModal(); };
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        this.toastContainer.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 4000);
    }

    getFilterValues() { return { searchTerm: this.searchInput.value, type: this.typeFilter.value, month: this.monthFilter.value }; }
    getDashboardDateRange() { return this.dashboardDateFilter.value; }

    bindThemeToggler(h) { this.themeToggleButton.addEventListener('click', h); }
    bindMenuNavigation(h) { document.querySelector('.sidebar-menu').addEventListener('click', e => { const mi = e.target.closest('.menu-item'); if (mi?.dataset.page) { e.preventDefault(); h(mi.dataset.page); } }); }
    bindModalControls() {
        this.addTransactionBtn.addEventListener('click', () => this.toggleModal(true));
        this.cancelBtn.addEventListener('click', () => this.toggleModal(false));
        this.modal.addEventListener('click', e => { if (e.target === this.modal) this.toggleModal(false); });
    }
    bindSubmitTransaction(h) {
        this.transactionForm.addEventListener('submit', e => {
            e.preventDefault();
            const id = parseInt(this.transactionForm['transaction-id'].value);
            const data = {
                id: id || null, description: this.transactionForm.description.value,
                amount: parseFloat(this.transactionForm.amount.value), date: this.transactionForm.date.value,
                category: this.transactionForm.category.value, type: this.transactionForm.type.value,
                paymentMethod: this.transactionForm.type.value === 'expense' ? this.paymentMethodSelect.value : null
            };
            h(data); this.toggleModal(false);
        });
    }
    bindSaveSettings(h) { this.profileFormEl.addEventListener('submit', e => { e.preventDefault(); const n = this.userNameInputEl.value; if (n) h(n); }); }
    bindClearAllData(h) { this.clearDataBtnEl.addEventListener('click', () => this.showConfirmationModal('Você tem certeza que deseja apagar TODAS as suas transações? Esta ação não pode ser desfeita.', h)); }
    bindLogout(h) {
        this.logoutBtn.addEventListener('click', e => { e.preventDefault(); h(); });
        this.logoutBtnPage.addEventListener('click', e => { e.preventDefault(); h(); });
    }
    bindTransactionTypeChange() { this.transactionTypeSelect.addEventListener('change', () => { this.paymentMethodGroup.style.display = (this.transactionTypeSelect.value === 'expense') ? 'block' : 'none'; }); }
    bindEditAndDeleteTransaction(editH, deleteH) {
        this.fullTransactionsTableBody.addEventListener('click', e => {
            const btn = e.target.closest('.action-btn'); if (!btn) return;
            const id = parseInt(btn.dataset.id);
            if (btn.classList.contains('edit')) editH(id);
            else if (btn.classList.contains('delete')) this.showConfirmationModal('Você tem certeza que deseja excluir esta transação?', () => deleteH(id));
        });
    }
    bindConfirmationControls() {
        this.cancelConfirmationBtn.addEventListener('click', () => this.hideConfirmationModal());
        this.confirmationModal.addEventListener('click', e => { if (e.target === this.confirmationModal) this.hideConfirmationModal(); });
    }
    bindFilters(h) { this.searchInput.addEventListener('input', h); this.typeFilter.addEventListener('change', h); this.monthFilter.addEventListener('change', h); }
    bindDashboardDateFilter(h) { this.dashboardDateFilter.addEventListener('change', h); }
    bindPagination(prevH, nextH) { this.prevPageBtn.addEventListener('click', prevH); this.nextPageBtn.addEventListener('click', nextH); }
    bindBudgetForm(h) {
        this.budgetForm.addEventListener('submit', e => {
            e.preventDefault();
            const category = this.budgetForm['budget-category'].value;
            const amount = parseFloat(this.budgetForm['budget-amount'].value);
            if (category && amount >= 0) { h(category, amount); this.budgetForm.reset(); }
        });
    }
    bindRecurringForm(h) {
        this.recurringForm.addEventListener('submit', e => {
            e.preventDefault();
            const data = {
                description: this.recurringForm['recurring-description'].value,
                amount: parseFloat(this.recurringForm['recurring-amount'].value),
                dayOfMonth: parseInt(this.recurringForm['recurring-day'].value),
                category: this.recurringForm['recurring-category'].value,
                type: this.recurringForm['recurring-type'].value,
            };
            if (data.description && data.amount > 0 && data.dayOfMonth) { h(data); this.recurringForm.reset(); }
        });
    }
}