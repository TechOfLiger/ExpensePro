// ===============================
// SMART EXPENSE TRACKER
// ===============================

let transactions =
    JSON.parse(localStorage.getItem("transactions")) || [];

let budget =
    Number(localStorage.getItem("monthlyBudget")) || 0;

let incomeExpenseChart;
let categoryChart;


// ===============================
// DOM ELEMENTS
// ===============================

const modal = document.getElementById("transactionModal");
const form = document.getElementById("transactionForm");

const description = document.getElementById("description");
const amount = document.getElementById("amount");
const type = document.getElementById("type");
const category = document.getElementById("category");
const date = document.getElementById("date");
const editId = document.getElementById("editId");


// ===============================
// INITIALIZATION
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("todayDate").textContent =
        new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });

    date.valueAsDate = new Date();

    loadTheme();

    updateDashboard();
    updateTransactions();
    updateBudget();
    updateAnalytics();

    populateCategoryFilter();

    createCharts();

});


// ===============================
// NAVIGATION
// ===============================

document.querySelectorAll(".nav-btn").forEach(button => {

    button.addEventListener("click", () => {

        const sectionName = button.dataset.section;

        showSection(sectionName);

    });

});


document.querySelectorAll("[data-go]").forEach(button => {

    button.addEventListener("click", () => {

        showSection(button.dataset.go);

    });

});


function showSection(sectionName) {

    document.querySelectorAll(".section")
        .forEach(section => section.classList.remove("active"));

    document.getElementById(sectionName)
        .classList.add("active");

    document.querySelectorAll(".nav-btn")
        .forEach(button => button.classList.remove("active"));

    const activeButton =
        document.querySelector(`[data-section="${sectionName}"]`);

    if (activeButton) {
        activeButton.classList.add("active");
    }

    const titles = {
        dashboard: "Dashboard",
        transactions: "Transactions",
        budget: "Budget",
        analytics: "Analytics",
        settings: "Settings"
    };

    document.getElementById("pageTitle").textContent =
        titles[sectionName];

}


// ===============================
// MODAL
// ===============================

document.getElementById("openModal")
    .addEventListener("click", openAddModal);

document.getElementById("closeModal")
    .addEventListener("click", closeModal);


modal.addEventListener("click", event => {

    if (event.target === modal) {
        closeModal();
    }

});


function openAddModal() {

    form.reset();

    editId.value = "";

    document.getElementById("modalTitle").textContent =
        "Add Transaction";

    date.valueAsDate = new Date();

    modal.classList.add("show");

}


function closeModal() {

    modal.classList.remove("show");

}


// ===============================
// ADD / EDIT TRANSACTION
// ===============================

form.addEventListener("submit", event => {

    event.preventDefault();

    const transactionData = {

        description: description.value.trim(),

        amount: Number(amount.value),

        type: type.value,

        category: category.value,

        date: date.value

    };


    if (
        !transactionData.description ||
        transactionData.amount <= 0 ||
        !transactionData.date
    ) {

        showToast("Please enter valid details.");

        return;

    }


    // EDIT

    if (editId.value) {

        const index = transactions.findIndex(
            transaction =>
                transaction.id === Number(editId.value)
        );

        if (index !== -1) {

            transactions[index] = {

                ...transactions[index],

                ...transactionData

            };

            showToast("Transaction updated successfully.");

        }

    }

    // ADD

    else {

        const transaction = {

            id: Date.now(),

            ...transactionData

        };

        transactions.push(transaction);

        showToast("Transaction added successfully.");

    }


    saveData();

    updateEverything();

    closeModal();

});


// ===============================
// DELETE
// ===============================

function deleteTransaction(id) {

    const confirmed =
        confirm("Delete this transaction?");

    if (!confirmed) return;

    transactions =
        transactions.filter(
            transaction => transaction.id !== id
        );

    saveData();

    updateEverything();

    showToast("Transaction deleted.");

}


// ===============================
// EDIT
// ===============================

function editTransaction(id) {

    const transaction =
        transactions.find(
            transaction => transaction.id === id
        );

    if (!transaction) return;

    editId.value = transaction.id;

    description.value = transaction.description;

    amount.value = transaction.amount;

    type.value = transaction.type;

    category.value = transaction.category;

    date.value = transaction.date;

    document.getElementById("modalTitle").textContent =
        "Edit Transaction";

    modal.classList.add("show");

}


// ===============================
// SAVE DATA
// ===============================

function saveData() {

    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );

    localStorage.setItem(
        "monthlyBudget",
        budget
    );

}


// ===============================
// UPDATE EVERYTHING
// ===============================

function updateEverything() {

    updateDashboard();

    updateTransactions();

    updateBudget();

    updateAnalytics();

    populateCategoryFilter();

    createCharts();

}


// ===============================
// DASHBOARD
// ===============================

function calculateTotals() {

    let income = 0;

    let expense = 0;

    transactions.forEach(transaction => {

        if (transaction.type === "income") {

            income += transaction.amount;

        } else {

            expense += transaction.amount;

        }

    });

    return {

        income,

        expense,

        balance: income - expense

    };

}


function updateDashboard() {

    const totals = calculateTotals();

    document.getElementById("balance").textContent =
        formatCurrency(totals.balance);

    document.getElementById("income").textContent =
        formatCurrency(totals.income);

    document.getElementById("expense").textContent =
        formatCurrency(totals.expense);


    const savingRate =
        totals.income > 0
            ? ((totals.income - totals.expense)
                / totals.income) * 100
            : 0;


    document.getElementById("savingRate").textContent =
        `${Math.max(0, savingRate).toFixed(1)}%`;


    updateRecentTransactions();

}


// ===============================
// RECENT TRANSACTIONS
// ===============================

function updateRecentTransactions() {

    const container =
        document.getElementById("recentTransactions");

    container.innerHTML = "";


    const recent =
        [...transactions]
            .sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            )
            .slice(0, 5);


    if (recent.length === 0) {

        container.innerHTML =
            `<p style="color:var(--muted)">
                No transactions yet.
            </p>`;

        return;

    }


    recent.forEach(transaction => {

        const row =
            document.createElement("div");

        row.className = "stat";

        row.innerHTML = `

            <span>

                ${getCategoryIcon(transaction.category)}

                ${escapeHTML(transaction.description)}

            </span>

            <strong class="${
                transaction.type === "income"
                    ? "type-income"
                    : "type-expense"
            }">

                ${
                    transaction.type === "income"
                        ? "+"
                        : "-"
                }

                ${formatCurrency(transaction.amount)}

            </strong>

        `;

        container.appendChild(row);

    });

}


// ===============================
// TRANSACTION TABLE
// ===============================

function updateTransactions() {

    const table =
        document.getElementById("transactionTable");

    table.innerHTML = "";


    const search =
        document.getElementById("searchInput")
            .value
            .toLowerCase();

    const typeFilter =
        document.getElementById("typeFilter").value;

    const categoryFilter =
        document.getElementById("categoryFilter").value;

    const monthFilter =
        document.getElementById("monthFilter").value;


    const filtered =
        transactions.filter(transaction => {

            const matchesSearch =
                transaction.description
                    .toLowerCase()
                    .includes(search);

            const matchesType =
                typeFilter === "all" ||
                transaction.type === typeFilter;

            const matchesCategory =
                categoryFilter === "all" ||
                transaction.category === categoryFilter;

            const matchesMonth =
                !monthFilter ||
                transaction.date.startsWith(monthFilter);

            return (
                matchesSearch &&
                matchesType &&
                matchesCategory &&
                matchesMonth
            );

        });


    filtered
        .sort((a, b) =>
            new Date(b.date) -
            new Date(a.date)
        )
        .forEach(transaction => {

            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td>
                    ${getCategoryIcon(transaction.category)}
                    ${escapeHTML(transaction.description)}
                </td>

                <td>
                    ${transaction.category}
                </td>

                <td>
                    ${formatDate(transaction.date)}
                </td>

                <td class="${
                    transaction.type === "income"
                        ? "type-income"
                        : "type-expense"
                }">

                    ${
                        transaction.type === "income"
                            ? "Income"
                            : "Expense"
                    }

                </td>

                <td class="${
                    transaction.type === "income"
                        ? "type-income"
                        : "type-expense"
                }">

                    ${
                        transaction.type === "income"
                            ? "+"
                            : "-"
                    }

                    ${formatCurrency(transaction.amount)}

                </td>

                <td>

                    <button
                        class="action-btn"
                        onclick="editTransaction(${transaction.id})"
                        title="Edit"
                    >
                        ✏️
                    </button>

                    <button
                        class="action-btn"
                        onclick="deleteTransaction(${transaction.id})"
                        title="Delete"
                    >
                        🗑️
                    </button>

                </td>

            `;

            table.appendChild(row);

        });

}


document.getElementById("searchInput")
    .addEventListener("input", updateTransactions);

document.getElementById("typeFilter")
    .addEventListener("change", updateTransactions);

document.getElementById("categoryFilter")
    .addEventListener("change", updateTransactions);

document.getElementById("monthFilter")
    .addEventListener("change", updateTransactions);


document.getElementById("clearFilters")
    .addEventListener("click", () => {

        document.getElementById("searchInput").value = "";

        document.getElementById("typeFilter").value = "all";

        document.getElementById("categoryFilter").value = "all";

        document.getElementById("monthFilter").value = "";

        updateTransactions();

    });


// ===============================
// CATEGORY FILTER
// ===============================

function populateCategoryFilter() {

    const select =
        document.getElementById("categoryFilter");

    const currentValue = select.value;

    select.innerHTML =
        `<option value="all">
            All Categories
        </option>`;


    const categories =
        [...new Set(
            transactions.map(
                transaction => transaction.category
            )
        )];


    categories.forEach(category => {

        const option =
            document.createElement("option");

        option.value = category;

        option.textContent = category;

        select.appendChild(option);

    });


    select.value = currentValue;

}


// ===============================
// BUDGET
// ===============================

document.getElementById("setBudgetBtn")
    .addEventListener("click", () => {

        const value =
            prompt(
                "Enter your monthly budget:",
                budget || ""
            );

        if (value === null) return;

        const newBudget =
            Number(value);

        if (newBudget <= 0) {

            showToast("Enter a valid budget.");

            return;

        }

        budget = newBudget;

        saveData();

        updateBudget();

        showToast("Budget updated.");

    });


function updateBudget() {

    const currentMonth =
        new Date().toISOString().slice(0, 7);


    const spent =
        transactions

            .filter(transaction =>
                transaction.type === "expense" &&
                transaction.date.startsWith(currentMonth)
            )

            .reduce(
                (sum, transaction) =>
                    sum + transaction.amount,
                0
            );


    const remaining =
        budget - spent;


    document.getElementById("budgetAmount")
        .textContent =
        formatCurrency(budget);


    document.getElementById("budgetSpent")
        .textContent =
        formatCurrency(spent);


    document.getElementById("budgetRemaining")
        .textContent =
        formatCurrency(remaining);


    const percentage =
        budget > 0
            ? Math.min((spent / budget) * 100, 100)
            : 0;


    document.getElementById("budgetProgress")
        .style.width =
        `${percentage}%`;


    const message =
        document.getElementById("budgetMessage");


    if (!budget) {

        message.textContent =
            "Set a monthly budget to start tracking.";

    }

    else if (spent > budget) {

        message.textContent =
            `⚠️ You exceeded your budget by ${
                formatCurrency(spent - budget)
            }.`;

    }

    else {

        message.textContent =
            `You have ${
                formatCurrency(remaining)
            } remaining this month.`;

    }


    updateCategoryBudgets();

}


// ===============================
// CATEGORY BUDGETS
// ===============================

function updateCategoryBudgets() {

    const container =
        document.getElementById("categoryBudgets");

    container.innerHTML = "";


    const expenseMap = {};


    transactions.forEach(transaction => {

        if (transaction.type === "expense") {

            expenseMap[transaction.category] =
                (expenseMap[transaction.category] || 0)
                + transaction.amount;

        }

    });


    Object.entries(expenseMap)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, amount]) => {

            const percentage =
                budget > 0
                    ? Math.min(
                        (amount / (budget / 3)) * 100,
                        100
                    )
                    : 0;


            const div =
                document.createElement("div");

            div.style.margin = "20px 0";

            div.innerHTML = `

                <div style="
                    display:flex;
                    justify-content:space-between;
                    margin-bottom:8px;
                ">

                    <span>
                        ${getCategoryIcon(category)}
                        ${category}
                    </span>

                    <strong>
                        ${formatCurrency(amount)}
                    </strong>

                </div>

                <div class="progress">

                    <div style="
                        width:${percentage}%;
                        height:100%;
                        background:var(--primary);
                    "></div>

                </div>

            `;

            container.appendChild(div);

        });

}


// ===============================
// ANALYTICS
// ===============================

function updateAnalytics() {

    const expenses =
        transactions.filter(
            transaction =>
                transaction.type === "expense"
        );


    const totalExpense =
        expenses.reduce(
            (sum, transaction) =>
                sum + transaction.amount,
            0
        );


    const average =
        expenses.length
            ? totalExpense / expenses.length
            : 0;


    const largest =
        expenses.length
            ? Math.max(
                ...expenses.map(
                    transaction => transaction.amount
                )
            )
            : 0;


    document.getElementById("averageExpense")
        .textContent =
        formatCurrency(average);


    document.getElementById("largestExpense")
        .textContent =
        formatCurrency(largest);


    document.getElementById("transactionCount")
        .textContent =
        transactions.length;


    document.getElementById("expenseCount")
        .textContent =
        expenses.length;


    calculateHealthScore();

}


// ===============================
// FINANCIAL HEALTH
// ===============================

function calculateHealthScore() {

    const totals = calculateTotals();


    let score = 0;


    if (totals.income > 0) {

        const savingRate =
            (totals.income - totals.expense)
            / totals.income;

        score +=
            Math.max(0, Math.min(savingRate * 70, 70));

    }


    if (budget > 0) {

        const currentMonth =
            new Date().toISOString().slice(0, 7);

        const spent =
            transactions

                .filter(transaction =>
                    transaction.type === "expense" &&
                    transaction.date.startsWith(currentMonth)
                )

                .reduce(
                    (sum, transaction) =>
                        sum + transaction.amount,
                    0
                );


        if (spent <= budget) {

            score += 30;

        }

        else {

            score +=
                Math.max(
                    0,
                    30 - ((spent - budget) / budget) * 30
                );

        }

    }


    score = Math.round(
        Math.max(0, Math.min(score, 100))
    );


    document.getElementById("healthScore")
        .textContent =
        score;


    let text = "Start tracking your finances.";

    if (score >= 80) {

        text = "Excellent financial health! 🎉";

    }

    else if (score >= 60) {

        text = "Good financial health 👍";

    }

    else if (score >= 40) {

        text = "Needs some improvement.";

    }

    else if (transactions.length > 0) {

        text = "Try reducing unnecessary expenses.";

    }


    document.getElementById("healthText")
        .textContent =
        text;

}


// ===============================
// CHARTS
// ===============================

function createCharts() {

    const totals =
        calculateTotals();


    if (incomeExpenseChart) {

        incomeExpenseChart.destroy();

    }


    if (categoryChart) {

        categoryChart.destroy();

    }


    const incomeCanvas =
        document.getElementById("incomeExpenseChart");


    const categoryCanvas =
        document.getElementById("categoryChart");


    incomeExpenseChart =
        new Chart(incomeCanvas, {

            type: "bar",

            data: {

                labels: [
                    "Income",
                    "Expense",
                    "Balance"
                ],

                datasets: [{

                    label: "Amount",

                    data: [
                        totals.income,
                        totals.expense,
                        totals.balance
                    ]

                }]

            },

            options: {

                responsive: true,

                plugins: {
                    legend: {
                        display: false
                    }
                }

            }

        });


    const categories = {};

    transactions.forEach(transaction => {

        if (transaction.type === "expense") {

            categories[transaction.category] =
                (categories[transaction.category] || 0)
                + transaction.amount;

        }

    });


    categoryChart =
        new Chart(categoryCanvas, {

            type: "doughnut",

            data: {

                labels: Object.keys(categories),

                datasets: [{

                    data: Object.values(categories)

                }]

            },

            options: {

                responsive: true,

                plugins: {

                    legend: {

                        position: "bottom"

                    }

                }

            }

        });

}


// ===============================
// CSV EXPORT
// ===============================

document.getElementById("exportBtn")
    .addEventListener("click", exportCSV);


function exportCSV() {

    if (!transactions.length) {

        showToast("No data to export.");

        return;

    }


    let csv =
        "Description,Amount,Type,Category,Date\n";


    transactions.forEach(transaction => {

        csv +=
            `"${transaction.description.replace(/"/g, '""')}",` +
            `${transaction.amount},` +
            `${transaction.type},` +
            `${transaction.category},` +
            `${transaction.date}\n`;

    });


    const blob =
        new Blob([csv], {
            type: "text/csv"
        });


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "expense-tracker-data.csv";

    link.click();

    URL.revokeObjectURL(url);

    showToast("CSV exported successfully.");

}


// ===============================
// CSV IMPORT
// ===============================

document.getElementById("importFile")
    .addEventListener("change", event => {

        const file =
            event.target.files[0];

        if (!file) return;


        const reader =
            new FileReader();


        reader.onload = event => {

            const lines =
                event.target.result
                    .split("\n")
                    .slice(1);


            let imported = 0;


            lines.forEach(line => {

                if (!line.trim()) return;


                const parts =
                    line.split(",");


                if (parts.length < 5) return;


                const transaction = {

                    id: Date.now() +
                        Math.random(),

                    description:
                        parts[0].replace(/^"|"$/g, ""),

                    amount:
                        Number(parts[1]),

                    type:
                        parts[2],

                    category:
                        parts[3],

                    date:
                        parts[4].trim()

                };


                if (
                    transaction.description &&
                    transaction.amount > 0
                ) {

                    transactions.push(transaction);

                    imported++;

                }

            });


            saveData();

            updateEverything();

            showToast(
                `${imported} transactions imported.`
            );

        };


        reader.readAsText(file);

    });


// ===============================
// RESET DATA
// ===============================

document.getElementById("resetBtn")
    .addEventListener("click", () => {

        const confirmed =
            confirm(
                "Are you sure? All financial data will be deleted."
            );


        if (!confirmed) return;


        transactions = [];

        budget = 0;

        localStorage.removeItem("transactions");

        localStorage.removeItem("monthlyBudget");

        updateEverything();

        showToast("All data has been reset.");

    });


// ===============================
// DARK MODE
// ===============================

document.getElementById("themeBtn")
    .addEventListener("click", () => {

        document.body.classList.toggle("dark");

        const dark =
            document.body.classList.contains("dark");


        localStorage.setItem(
            "darkMode",
            dark
        );


        document.getElementById("themeBtn")
            .textContent =
            dark
                ? "☀️ Light Mode"
                : "🌙 Dark Mode";

    });


function loadTheme() {

    const dark =
        localStorage.getItem("darkMode") === "true";


    if (dark) {

        document.body.classList.add("dark");

        document.getElementById("themeBtn")
            .textContent =
            "☀️ Light Mode";

    }

}


// ===============================
// UTILITY FUNCTIONS
// ===============================

function formatCurrency(value) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(value);

}


function formatDate(dateString) {

    return new Date(dateString)
        .toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

}


function getCategoryIcon(category) {

    const icons = {

        Food: "🍔",

        Shopping: "🛍️",

        Transport: "🚗",

        Entertainment: "🎬",

        Education: "📚",

        Health: "❤️",

        Bills: "💡",

        Salary: "💼",

        Investment: "📈",

        Other: "📦"

    };


    return icons[category] || "📦";

}


function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


// ===============================
// TOAST
// ===============================

function showToast(message) {

    const toast =
        document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");


    setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}