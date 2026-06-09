const expenseTableBody = document.getElementById("expense-table");
const totalSpan = document.getElementById("total-expense");
const categoryFilter = document.getElementById("category-filter");
const dateFilterInput = document.getElementById("date-filter");
const clearDateBtn = document.getElementById("clear-date");
const searchInput = document.getElementById("search-input");
const addBtn = document.getElementById("add-expense");
const expenseName = document.getElementById("expense-name");
const expenseAmount = document.getElementById("expense-amount");
const expenseCategory = document.getElementById("expense-category");
const expenseDate = document.getElementById("expense-date");

let allExpenses = JSON.parse(localStorage.getItem("expenses")) || [];

function getTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getFilteredExpenses() {
  const selectedCategory = categoryFilter.value;
  const selectedDate = dateFilterInput.value;
  const searchTerm = searchInput.value.trim().toLowerCase();

  let filtered = [...allExpenses];

  if (selectedCategory !== "all") {
    filtered = filtered.filter((exp) => exp.category === selectedCategory);
  }

  if (selectedDate !== "") {
    filtered = filtered.filter((exp) => exp.date === selectedDate);
  }

  if (searchTerm !== "") {
    filtered = filtered.filter(
      (exp) =>
        exp.name.toLowerCase().includes(searchTerm) ||
        exp.category.toLowerCase().includes(searchTerm),
    );
  }

  return filtered;
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

function capitalize(word) {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function renderExpenses() {
  const filtered = getFilteredExpenses();
  expenseTableBody.innerHTML = "";
  let total = 0;

  if (filtered.length === 0) {
    let message = "";
    const isDateSelected = dateFilterInput.value !== "";
    const hasSearch = searchInput.value.trim() !== "";
    const isCategoryActive = categoryFilter.value !== "all";

    if (isDateSelected && !hasSearch && !isCategoryActive) {
      message = `No records found for selected date (${dateFilterInput.value}).`;
    } else if (isDateSelected && hasSearch) {
      message = `No expenses match "${searchInput.value.trim()}" on ${dateFilterInput.value}.`;
    } else if (hasSearch) {
      message = `No expenses found matching "${searchInput.value.trim()}".`;
    } else if (isCategoryActive) {
      message = `No expenses found in this category.`;
    } else {
      message = "No expenses found. Add your first expense!";
    }

    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td colspan="5" class="empty-table-message">${message}</td>`;
    expenseTableBody.appendChild(emptyRow);
    totalSpan.textContent = "0.00";
    return;
  }

  filtered.forEach((exp) => {
    const row = document.createElement("tr");
    row.innerHTML = `
          <td>${escapeHtml(exp.name)}</td>
          <td>$ ${exp.amount.toFixed(2)}</td>
          <td>${capitalize(exp.category)}</td>
          <td>${exp.date}</td>
          <td class="action">
            <button class='edit-btn' data-id='${exp.id}'>Edit</button>
            <button class='delete-btn' data-id='${exp.id}'>Delete</button>
          </td>
        `;
    expenseTableBody.appendChild(row);
    total += exp.amount;
  });
  totalSpan.textContent = total.toFixed(2);

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.removeEventListener("click", handleEdit);
    btn.addEventListener("click", handleEdit);
  });
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.removeEventListener("click", handleDelete);
    btn.addEventListener("click", handleDelete);
  });
}

function handleEdit(e) {
  const id = parseInt(e.currentTarget.getAttribute("data-id"));
  openEditModal(id);
}
function handleDelete(e) {
  const id = parseInt(e.currentTarget.getAttribute("data-id"));
  openDeleteModal(id);
}

function persistAndRefresh() {
  localStorage.setItem("expenses", JSON.stringify(allExpenses));
  renderExpenses();
}

function checkAddButton() {
  const isValid =
    expenseName.value.trim() !== "" &&
    expenseAmount.value.trim() !== "" &&
    !isNaN(parseFloat(expenseAmount.value)) &&
    expenseCategory.value !== "";
  addBtn.disabled = !isValid;
}

function addExpense() {
  const name = expenseName.value.trim();
  const amount = parseFloat(expenseAmount.value);
  const category = expenseCategory.value;
  let date = expenseDate.value;
  if (!date) {
    date = getTodayDate();
  }

  if (!name || isNaN(amount) || amount <= 0 || !category) {
    alert("Please fill all fields (Name, Amount, Category). Date is optional.");
    return;
  }

  const newExpense = {
    id: Date.now(),
    name: name,
    amount: amount,
    category: category,
    date: date,
  };
  allExpenses.push(newExpense);
  persistAndRefresh();

  expenseName.value = "";
  expenseAmount.value = "";
  expenseCategory.value = "";
  expenseDate.value = "";
  addBtn.disabled = true;
}

let editingId = null;
function openEditModal(id) {
  const expense = allExpenses.find((e) => e.id === id);
  if (!expense) return;
  editingId = id;
  document.getElementById("edit-expense-name").value = expense.name;
  document.getElementById("edit-expense-amount").value = expense.amount;
  document.getElementById("edit-expense-category").value = expense.category;
  document.getElementById("edit-expense-date").value = expense.date;
  openModal("edit-modal");
}

function saveEdit() {
  if (editingId === null) return;
  const newName = document.getElementById("edit-expense-name").value.trim();
  const newAmount = parseFloat(
    document.getElementById("edit-expense-amount").value,
  );
  const newCategory = document.getElementById("edit-expense-category").value;
  const newDate = document.getElementById("edit-expense-date").value;

  if (
    !newName ||
    isNaN(newAmount) ||
    newAmount <= 0 ||
    !newCategory ||
    !newDate
  ) {
    alert("Please fill all fields correctly.");
    return;
  }

  const index = allExpenses.findIndex((e) => e.id === editingId);
  if (index !== -1) {
    allExpenses[index] = {
      ...allExpenses[index],
      name: newName,
      amount: newAmount,
      category: newCategory,
      date: newDate,
    };
    persistAndRefresh();
  }
  closeModal("edit-modal");
  editingId = null;
}

let deletingId = null;
function openDeleteModal(id) {
  deletingId = id;
  openModal("delete-modal");
}

function confirmDelete() {
  if (deletingId !== null) {
    allExpenses = allExpenses.filter((e) => e.id !== deletingId);
    persistAndRefresh();
    closeModal("delete-modal");
    deletingId = null;
  }
}

function openModal(modalId) {
  document.getElementById(modalId).style.display = "flex";
}
window.closeModal = function (modalId) {
  document.getElementById(modalId).style.display = "none";
  if (modalId === "edit-modal") editingId = null;
  if (modalId === "delete-modal") deletingId = null;
};

function bindEvents() {
  addBtn.addEventListener("click", addExpense);
  [expenseName, expenseAmount, expenseCategory, expenseDate].forEach(
    (field) => {
      field.addEventListener("input", checkAddButton);
      field.addEventListener("change", checkAddButton);
    },
  );

  categoryFilter.addEventListener("change", () => renderExpenses());
  dateFilterInput.addEventListener("change", () => renderExpenses());
  searchInput.addEventListener("input", () => renderExpenses());
  clearDateBtn.addEventListener("click", () => {
    dateFilterInput.value = "";
    renderExpenses();
  });

  document.getElementById("confirm-edit").addEventListener("click", saveEdit);
  document
    .getElementById("confirm-delete")
    .addEventListener("click", confirmDelete);
}

function init() {
  bindEvents();
  renderExpenses();
  checkAddButton();
}
init();
