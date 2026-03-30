console.log("View.js carregado.");

class View {
    constructor() {
        this.totalRevenueEl = document.getElementById('total-revenue');
        this.totalExpensesEl = document.getElementById('total-expenses');
        this.balanceEl = document.getElementById('balance');
        this.transactionsTableBody = document.querySelector('#transactions-table tbody');
        this.chartContext = document.getElementById('expensesChart').getContext('2d');
        this.expensesChart = null;
        this.monthlySummaryChartContext = document.getElementById('monthlySummaryChart').getContext('2d');
        this.monthlySummaryChart = null;
        this.balanceEvolutionChartContext = document.getElementById('balanceEvolutionChart').getContext('2d');
        this.balanceEvolutionChart = null;
        this.themeToggleButton = document.getElementById('theme-toggle');
        this.userNameHeaderEl = document.querySelector('.user-profile span');
        this.pages = document.querySelectorAll('.page-content');
        this.menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
        this.fullTransactionsTableBody = document.querySelector('#full-transactions-table tbody');
        this.addTransactionBtn = document.getElementById('add-transaction-btn');
        this.modal = document.getElementById('transaction-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.transactionForm = document.getElementById('transaction-form');
        this.cancelBtn = document.getElementById('cancel-btn');
        this.transactionTypeSelect = document.getElementById('type');
        this.paymentMethodGroup = document.getElementById('payment-method-group');
        this.paymentMethodSelect = document.getElementById('payment-method');
        this.userNameInputEl = document.getElementById('user-name');
        this.profileFormEl = document.getElementById('profile-form');
        this.clearDataBtnEl = document.getElementById('clear-data-btn');
        this.logoutBtn = document.querySelector('.sidebar-menu .logout');
        this.logoutBtnPage = document.getElementById('logout-btn-page');
        this.confirmationModal = document.getElementById('confirmation-modal');
        this.confirmationMessage = document.getElementById('confirmation-message');
        this.cancelConfirmationBtn = document.getElementById('cancel-confirmation-btn');
        this.confirmActionBtn = document.getElementById('confirm-action-btn');
        this.searchInput = document.getElementById('search-input');
        this.typeFilter = document.getElementById('type-filter');
        this.categoryFilter = document.getElementById('category-filter');
        this.monthFilter = document.getElementById('month-filter');
        this.dashboardDateFilter = document.getElementById('dashboard-date-filter');
        this.paginationControls = document.getElementById('pagination-controls');
        this.prevPageBtn = document.getElementById('prev-page-btn');
        this.nextPageBtn = document.getElementById('next-page-btn');
        this.pageInfo = document.getElementById('page-info');
        this.budgetForm = document.getElementById('budget-form');
        this.budgetsList = document.getElementById('budgets-list');
        this.dashboardBudgetsContainer = document.getElementById('dashboard-budgets-container');
        this.recurringForm = document.getElementById('recurring-form');
        this.recurringList = document.getElementById('recurring-list');
        this.toastContainer = document.getElementById('toast-container');
        this.remindersList = document.getElementById('reminders-list');
        this.reminderForm = document.getElementById('reminder-form');
        this.dashboardRemindersContainer = document.getElementById('dashboard-reminders-container');
        this.exportCsvBtn = document.getElementById('export-csv-btn');
        this.importCsvInput = document.getElementById('import-csv-input');
    }

    _formatCurrency(value) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
    _safe(str) { const d = document.createElement('div'); d.textContent = str ?? ''; return d.innerHTML; }

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
            const d = new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            this.transactionsTableBody.insertRow().innerHTML = `<td>${this._safe(t.description)}</td><td>${d}</td><td class="${t.type}">${this._formatCurrency(t.amount)}</td><td>${this._safe(t.category)}</td><td>${this._safe(t.paymentmethod || '---')}</td>`;
        });
    }

    renderFullTransactionsTable(transactions) {
        this.fullTransactionsTableBody.innerHTML = '';
        if (transactions.length === 0) { 
            this.fullTransactionsTableBody.insertRow().innerHTML = `<td colspan="6" style="text-align: center;">Nenhuma transação encontrada para os filtros selecionados.</td>`; 
            return; 
        }
        transactions.forEach(t => {
            const d = new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            this.fullTransactionsTableBody.insertRow().innerHTML = `<td>${this._safe(t.description)}</td><td>${d}</td><td class="${t.type}">${this._formatCurrency(t.amount)}</td><td>${this._safe(t.category)}</td><td>${this._safe(t.paymentmethod || '---')}</td><td><button class="action-btn edit" data-id="${t.id}"><i class="fas fa-edit"></i></button><button class="action-btn delete" data-id="${t.id}"><i class="fas fa-trash"></i></button></td>`;
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
            type: 'doughnut', 
            data: { 
                labels, 
                datasets: [{ 
                    label: 'Despesas por Categoria', 
                    data, 
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'], 
                    hoverOffset: 4 
                }] 
            }, 
            options: { 
                responsive: true, 
                maintainAspectRatio: true,
                aspectRatio: 2.0,
                layout: {
                    padding: 15
                },
                plugins: { 
                    legend: { 
                        position: 'top',
                        labels: {
                            boxWidth: 12,
                            padding: 10,
                            font: {
                                size: 11
                            }
                        }
                    } 
                } 
            } 
        });
    }
}
    
    renderMonthlySummaryChart(summaryData) {
        const datasets = [{ label: 'Receitas', data: summaryData.incomeData, backgroundColor: 'rgba(40, 167, 69, 0.7)', borderColor: 'rgba(40, 167, 69, 1)', borderWidth: 1 }, { label: 'Despesas', data: summaryData.expenseData, backgroundColor: 'rgba(220, 53, 69, 0.7)', borderColor: 'rgba(220, 53, 69, 1)', borderWidth: 1 }];
        if (this.monthlySummaryChart) { this.monthlySummaryChart.data.labels = summaryData.labels; this.monthlySummaryChart.data.datasets = datasets; this.monthlySummaryChart.update(); } else {
            this.monthlySummaryChart = new Chart(this.monthlySummaryChartContext, { type: 'bar', data: { labels: summaryData.labels, datasets: datasets }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: 'top' } } } });
        }
    }

    renderBalanceEvolutionChart(data) {
        const color = data.balanceData.map(v => v >= 0 ? 'rgba(40,167,69,0.7)' : 'rgba(220,53,69,0.7)');
        const borderColor = data.balanceData.map(v => v >= 0 ? 'rgba(40,167,69,1)' : 'rgba(220,53,69,1)');
        if (this.balanceEvolutionChart) {
            this.balanceEvolutionChart.data.labels = data.labels;
            this.balanceEvolutionChart.data.datasets[0].data = data.balanceData;
            this.balanceEvolutionChart.data.datasets[0].backgroundColor = color;
            this.balanceEvolutionChart.data.datasets[0].borderColor = borderColor;
            this.balanceEvolutionChart.update();
        } else {
            this.balanceEvolutionChart = new Chart(this.balanceEvolutionChartContext, { type: 'bar', data: { labels: data.labels, datasets: [{ label: 'Saldo do Mês', data: data.balanceData, backgroundColor: color, borderColor: borderColor, borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } } });
        }
    }
    populateMonthFilter(transactions) {
        const months = new Set(transactions.map(t => t.date.substring(0, 7))); const currentValue = this.monthFilter.value; this.monthFilter.innerHTML = '<option value="all">Todos os Meses</option>';
        Array.from(months).sort().reverse().forEach(month => {
            const [year, monthNum] = month.split('-'); const monthName = new Date(year, monthNum - 1).toLocaleString('pt-BR', { month: 'long' });
            this.monthFilter.innerHTML += `<option value="${month}">${monthName.charAt(0).toUpperCase() + monthName.slice(1)}/${year}</option>`;
        });
        this.monthFilter.value = currentValue;
    }
    
    renderPagination(currentPage, totalPages) { if (totalPages <= 1) { this.paginationControls.style.display = 'none'; return; } this.paginationControls.style.display = 'flex'; this.pageInfo.textContent = `Página ${currentPage} de ${totalPages}`; this.prevPageBtn.disabled = currentPage === 1; this.nextPageBtn.disabled = currentPage === totalPages; }
    renderBudgetsPage(budgets, deleteHandler) { this.budgetsList.innerHTML = ''; if (Object.keys(budgets).length === 0) { this.budgetsList.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Nenhum orçamento definido.</p>'; return; } Object.entries(budgets).forEach(([category, amount]) => { this.budgetsList.innerHTML += `<div class="budget-item"><div class="budget-item-info"><p>${this._safe(category)}</p><span>Limite: ${this._formatCurrency(amount)}</span></div><div class="budget-item-actions"><button data-category="${this._safe(category)}" class="delete-budget-btn"><i class="fas fa-trash"></i></button></div></div>`; }); this.budgetsList.querySelectorAll('.delete-budget-btn').forEach(btn => btn.addEventListener('click', e => deleteHandler(e.currentTarget.dataset.category))); }
    renderDashboardBudgets(budgetsStatus) { this.dashboardBudgetsContainer.innerHTML = ''; if (budgetsStatus.length === 0) { this.dashboardBudgetsContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Defina orçamentos para ver seu progresso aqui.</p>'; return; } budgetsStatus.forEach(item => { const p = Math.min(item.percentage, 100); const o = item.percentage > 100; this.dashboardBudgetsContainer.innerHTML += `<div class="budget-item-info"><div style="display: flex; justify-content: space-between;"><p>${this._safe(item.category)}</p><span>${this._formatCurrency(item.spent)} / ${this._formatCurrency(item.budget)}</span></div><div class="progress-bar-container"><div class="progress-bar ${o ? 'over-budget' : ''}" style="width: ${p}%;"></div></div></div>`; }); }
    renderRecurringTransactionsPage(recurringTxs, deleteHandler) { this.recurringList.innerHTML = ''; if (recurringTxs.length === 0) { this.recurringList.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Nenhuma transação recorrente definida.</p>'; return; } recurringTxs.forEach(rt => { const t = rt.type === 'income' ? 'Receita' : 'Despesa'; this.recurringList.innerHTML += `<div class="recurring-item"><div class="recurring-item-info"><p>${this._safe(rt.description)} (${t})</p><span>${this._formatCurrency(rt.amount)} todo dia ${rt.dayofmonth}</span></div><div class="recurring-item-actions"><button data-id="${rt.id}" class="delete-recurring-btn"><i class="fas fa-trash"></i></button></div></div>`; }); this.recurringList.querySelectorAll('.delete-recurring-btn').forEach(btn => btn.addEventListener('click', e => deleteHandler(parseInt(e.currentTarget.dataset.id)))); }
    renderRemindersPage(reminders, updateHandler, deleteHandler) {
        this.remindersList.innerHTML = '';
        if (reminders.length === 0) { this.remindersList.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Nenhum lembrete cadastrado.</p>'; return; }
        reminders.forEach(r => {
            const dueDate = new Date(r.duedate); const today = new Date(); today.setHours(0,0,0,0);
            const isOverdue = dueDate < today && !r.ispaid;
            const item = document.createElement('div');
            item.className = `reminder-item ${r.ispaid ? 'is-paid' : ''} ${isOverdue ? 'is-overdue' : ''}`;
            const amountText = r.amount ? ` - ${this._formatCurrency(parseFloat(r.amount))}` : '';
            const dateText = dueDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            item.innerHTML = `<div class="reminder-item-info"><p>${this._safe(r.description)}${amountText}</p><span>Vencimento: ${dateText}</span></div><div class="reminder-item-actions"><i class="toggle-paid-btn fas ${r.ispaid ? 'fa-check-square' : 'fa-square'}" data-id="${r.id}" data-status="${r.ispaid}"></i><button data-id="${r.id}" class="delete-reminder-btn"><i class="fas fa-trash"></i></button></div>`;
            this.remindersList.appendChild(item);
        });
        this.remindersList.querySelectorAll('.toggle-paid-btn').forEach(btn => { btn.addEventListener('click', e => { const id = parseInt(e.currentTarget.dataset.id); const s = e.currentTarget.dataset.status === 'true'; updateHandler(id, !s); }); });
        this.remindersList.querySelectorAll('.delete-reminder-btn').forEach(btn => { btn.addEventListener('click', e => { const id = parseInt(e.currentTarget.dataset.id); this.showConfirmationModal('Deseja excluir este lembrete?', () => deleteHandler(id)); }); });
    }
    renderDashboardReminders(reminders) {
        this.dashboardRemindersContainer.innerHTML = '';
        if (reminders.length === 0) { this.dashboardRemindersContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Você não tem lembretes próximos.</p>'; return; }
        reminders.forEach(r => {
            const dueDate = new Date(r.duedate); const today = new Date(); today.setHours(0,0,0,0);
            const isOverdue = dueDate < today;
            const item = document.createElement('div');
            item.className = `reminder-item ${isOverdue ? 'is-overdue' : ''}`;
            const amountText = r.amount ? ` - ${this._formatCurrency(parseFloat(r.amount))}` : '';
            const dateText = dueDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            item.innerHTML = `<div class="reminder-item-info"><p>${this._safe(r.description)}${amountText}</p><span>Vencimento: ${dateText}</span></div>`;
            this.dashboardRemindersContainer.appendChild(item);
        });
    }

    showPage(pageId) { this.pages.forEach(p => p.classList.add('page-hidden')); document.getElementById(`${pageId}-page`).classList.remove('page-hidden'); this.updateMenuActiveState(pageId); }
    updateMenuActiveState(pageId) { this.menuItems.forEach(i => { i.classList.remove('active'); if (i.dataset.page === pageId) i.classList.add('active'); }); }
    toggleModal(show = true, transaction = null) { 
        if (show) { 
            this.transactionForm.reset(); 
            if (transaction) { 
                this.modalTitle.textContent = 'Editar Transação'; 
                this.transactionForm['transaction-id'].value = transaction.id; 
                this.transactionForm.description.value = transaction.description; 
                this.transactionForm.amount.value = Math.abs(transaction.amount); 
                this.transactionForm.date.value = transaction.date; 
                this.transactionForm.category.value = transaction.category || '';
                this.transactionForm.type.value = transaction.type; 
                this.paymentMethodGroup.style.display = transaction.type === 'expense' ? 'block' : 'none'; 
                if (transaction.type === 'expense') this.paymentMethodSelect.value = transaction.paymentmethod || ''; 
            } else { 
                this.modalTitle.textContent = 'Nova Transação'; 
                this.transactionForm['transaction-id'].value = ''; 
                this.paymentMethodGroup.style.display = this.transactionTypeSelect.value === 'expense' ? 'block' : 'none'; 
            } 
            this.modal.classList.remove('page-hidden'); 
        } else { 
            this.modal.classList.add('page-hidden'); 
        } 
    }
    displayUserSettings(settings) { if (settings.name) { this.userNameInputEl.value = settings.name; this.userNameHeaderEl.textContent = settings.name; } }
    hideConfirmationModal() { this.confirmationModal.classList.add('page-hidden'); }
    showConfirmationModal(message, onConfirm) { this.confirmationMessage.textContent = message; this.confirmationModal.classList.remove('page-hidden'); this.confirmActionBtn.onclick = () => { onConfirm(); this.hideConfirmationModal(); }; }
    showToast(message, type = 'success') { const t = document.createElement('div'); t.className = `toast ${type}`; t.textContent = message; this.toastContainer.appendChild(t); setTimeout(() => { t.remove(); }, 4000); }
    showLoading() { const o = document.getElementById('loading-overlay'); if (o) o.classList.remove('hidden'); }
    hideLoading() { const o = document.getElementById('loading-overlay'); if (o) o.classList.add('hidden'); }
    bindExportCSV(h) { if (this.exportCsvBtn) this.exportCsvBtn.addEventListener('click', h); }
    bindImportCSV(h) { if (this.importCsvInput) this.importCsvInput.addEventListener('change', e => { const file = e.target.files[0]; if (file) { h(file); e.target.value = ''; } }); }
    parseCSV(text) {
        const lines = text.trim().split('\n').filter(l => l.trim());
        if (lines.length < 2) return [];
        const rows = lines.slice(1);
        const transactions = [];
        for (const line of rows) {
            const cols = line.split(';').map(c => c.replace(/^"|"$/g, '').trim());
            if (cols.length < 5) continue;
            const [description, dateRaw, amountRaw, type, category, paymentMethod] = cols;
            const [d, m, y] = dateRaw.split('/');
            const date = `${y}-${m}-${d}`;
            const amount = parseFloat(amountRaw.replace(',', '.'));
            const typeEn = type === 'Receita' ? 'income' : 'expense';
            if (!description || isNaN(amount) || !date || date === 'undefined-undefined-undefined') continue;
            transactions.push({ description, amount, date, type: typeEn, category, paymentMethod: paymentMethod || null });
        }
        return transactions;
    }
    exportToCSV(transactions) {
        const header = ['Descrição', 'Data', 'Valor', 'Tipo', 'Categoria', 'Método de Pagamento'];
        const rows = transactions.map(t => [
            `"${t.description.replace(/"/g, '""')}"`,
            new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
            parseFloat(t.amount).toFixed(2).replace('.', ','),
            t.type === 'income' ? 'Receita' : 'Despesa',
            t.category,
            t.paymentmethod || ''
        ]);
        const csv = [header.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transacoes_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
    getFilterValues() { return { searchTerm: this.searchInput.value, type: this.typeFilter.value, category: this.categoryFilter.value, month: this.monthFilter.value }; }
    getDashboardDateRange() { return this.dashboardDateFilter.value; }
    bindThemeToggler(h) { this.themeToggleButton.addEventListener('click', h); }
    bindMenuNavigation(h) { document.querySelector('.sidebar-menu').addEventListener('click', e => { const mi = e.target.closest('.menu-item'); if (mi?.dataset.page) { e.preventDefault(); h(mi.dataset.page); } }); }
    bindModalControls() { this.addTransactionBtn.addEventListener('click', () => this.toggleModal(true)); this.cancelBtn.addEventListener('click', () => this.toggleModal(false)); this.modal.addEventListener('click', e => { if (e.target === this.modal) this.toggleModal(false); }); }
    bindSubmitTransaction(h) { this.transactionForm.addEventListener('submit', e => { e.preventDefault(); const id = parseInt(this.transactionForm['transaction-id'].value); const d = { id: id || null, description: this.transactionForm.description.value, amount: parseFloat(this.transactionForm.amount.value), date: this.transactionForm.date.value, category: this.transactionForm.category.value, type: this.transactionForm.type.value, paymentMethod: this.transactionForm.type.value === 'expense' ? this.paymentMethodSelect.value : null }; h(d); this.toggleModal(false); }); }
    bindSaveSettings(h) { this.profileFormEl.addEventListener('submit', e => { e.preventDefault(); const n = this.userNameInputEl.value; if (n) h(n); }); }
    bindClearAllData(h) { this.clearDataBtnEl.addEventListener('click', () => this.showConfirmationModal('Você tem certeza que deseja apagar TODAS as suas transações? Esta ação não pode ser desfeita.', h)); }
    bindLogout(h) { if (this.logoutBtn) this.logoutBtn.addEventListener('click', e => { e.preventDefault(); h(); }); if (this.logoutBtnPage) this.logoutBtnPage.addEventListener('click', e => { e.preventDefault(); h(); }); }
    bindTransactionTypeChange() { this.transactionTypeSelect.addEventListener('change', () => { this.paymentMethodGroup.style.display = (this.transactionTypeSelect.value === 'expense') ? 'block' : 'none'; }); }
    bindEditAndDeleteTransaction(editH, deleteH) { this.fullTransactionsTableBody.addEventListener('click', e => { const b = e.target.closest('.action-btn'); if (!b) return; const id = parseInt(b.dataset.id); if (b.classList.contains('edit')) editH(id); else if (b.classList.contains('delete')) this.showConfirmationModal('Você tem certeza que deseja excluir esta transação?', () => deleteH(id)); }); }
    bindConfirmationControls() { this.cancelConfirmationBtn.addEventListener('click', () => this.hideConfirmationModal()); this.confirmationModal.addEventListener('click', e => { if (e.target === this.confirmationModal) this.hideConfirmationModal(); }); }
    bindFilters(h) { this.searchInput.addEventListener('input', h); this.typeFilter.addEventListener('change', h); this.categoryFilter.addEventListener('change', h); this.monthFilter.addEventListener('change', h); }
    bindDashboardDateFilter(h) { this.dashboardDateFilter.addEventListener('change', h); }
    bindPagination(prevH, nextH) { this.prevPageBtn.addEventListener('click', prevH); this.nextPageBtn.addEventListener('click', nextH); }
    bindBudgetForm(h) { this.budgetForm.addEventListener('submit', e => { e.preventDefault(); const c = this.budgetForm['budget-category'].value; const a = parseFloat(this.budgetForm['budget-amount'].value); if (c && a >= 0) { h(c, a); this.budgetForm.reset(); } }); }
    bindRecurringForm(h) { this.recurringForm.addEventListener('submit', e => { e.preventDefault(); const d = { description: this.recurringForm['recurring-description'].value, amount: parseFloat(this.recurringForm['recurring-amount'].value), dayOfMonth: parseInt(this.recurringForm['recurring-day'].value), category: this.recurringForm['recurring-category'].value, type: this.recurringForm['recurring-type'].value }; if (d.description && d.amount > 0 && d.dayOfMonth) { h(d); this.recurringForm.reset(); } }); }
    bindReminderForm(h) { this.reminderForm.addEventListener('submit', e => { e.preventDefault(); const d = { description: this.reminderForm['reminder-description'].value, amount: this.reminderForm['reminder-amount'].value ? parseFloat(this.reminderForm['reminder-amount'].value) : null, dueDate: this.reminderForm['reminder-dueDate'].value }; if (d.description && d.dueDate) { h(d); this.reminderForm.reset(); } }); }
}