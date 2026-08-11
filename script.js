// ---------------------------------------------------------
// State
// Data lives in memory only. Filters never remove data from
// this array - they only hide/show rows in the DOM.
// ---------------------------------------------------------
let exceptions = [];
let nextId = 1;

// ---------------------------------------------------------
// Element references
// ---------------------------------------------------------
const form = document.querySelector('#exceptionForm');
const tableBody = document.querySelector('#exceptionsTableBody');
const table = document.querySelector('#exceptionsTable');
const emptyState = document.querySelector('#emptyState');
const noMatchState = document.querySelector('#noMatchState');

const filterType = document.querySelector('#filterType');
const filterStatus = document.querySelector('#filterStatus');

const statTotal = document.querySelector('#statTotal');
const statOpen = document.querySelector('#statOpen');
const statResolved = document.querySelector('#statResolved');

// ---------------------------------------------------------
// Form submission
// ---------------------------------------------------------
form.addEventListener('submit', function (event) {
  event.preventDefault();

  const deliveryId = document.querySelector('#deliveryId').value.trim();
  const customerName = document.querySelector('#customerName').value.trim();
  const issueType = document.querySelector('#issueType').value;
  const priorityInput = document.querySelector('input[name="priority"]:checked');
  const priority = priorityInput ? priorityInput.value : '';
  const notes = document.querySelector('#notes').value.trim();

  const isValid = validateForm(deliveryId, customerName, issueType, priority);
  if (!isValid) {
    return;
  }

  const record = {
    id: nextId,
    deliveryId: deliveryId,
    customerName: customerName,
    issueType: issueType,
    priority: priority,
    notes: notes,
    status: 'Open'
  };
  nextId = nextId + 1;

  exceptions.push(record);
  addRowToTable(record);
  applyFilters();
  updateStats();
  updateEmptyState();

  form.reset();
  clearAllErrors();
  document.querySelector('#deliveryId').focus();
});

function validateForm(deliveryId, customerName, issueType, priority) {
  clearAllErrors();
  let valid = true;

  if (deliveryId === '') {
    showError('deliveryId');
    valid = false;
  }
  if (customerName === '') {
    showError('customerName');
    valid = false;
  }
  if (issueType === '') {
    showError('issueType');
    valid = false;
  }
  if (priority === '') {
    showError('priority');
    valid = false;
  }

  return valid;
}

function showError(fieldName) {
  const field = document.querySelector('#' + fieldName);
  const container = field ? field.closest('.field') : document.querySelector('fieldset.field');
  if (fieldName === 'priority') {
    document.querySelector('fieldset.field').classList.add('has-error');
  } else if (container) {
    container.classList.add('has-error');
  }
}

function clearAllErrors() {
  const fields = document.querySelectorAll('.field');
  fields.forEach(function (field) {
    field.classList.remove('has-error');
  });
}

// ---------------------------------------------------------
// Table rendering
// ---------------------------------------------------------
function addRowToTable(record) {
  const row = document.createElement('tr');
  row.setAttribute('data-id', record.id);

  if (record.priority === 'High') {
    row.classList.add('row-high-priority');
  }

  const idCell = document.createElement('td');
  idCell.textContent = record.deliveryId;
  row.appendChild(idCell);

  const nameCell = document.createElement('td');
  nameCell.textContent = record.customerName;
  row.appendChild(nameCell);

  const typeCell = document.createElement('td');
  typeCell.textContent = record.issueType;
  row.appendChild(typeCell);

  const priorityCell = document.createElement('td');
  const priorityBadge = document.createElement('span');
  priorityBadge.classList.add('badge', 'badge-priority-' + record.priority.toLowerCase());
  priorityBadge.textContent = record.priority;
  priorityCell.appendChild(priorityBadge);
  row.appendChild(priorityCell);

  const statusCell = document.createElement('td');
  const statusBadge = document.createElement('span');
  statusBadge.classList.add('badge', 'status-badge');
  row.appendChild(statusCell);
  statusCell.appendChild(statusBadge);

  const actionsCell = document.createElement('td');
  const actionsWrap = document.createElement('div');
  actionsWrap.classList.add('row-actions');

  const resolveBtn = document.createElement('button');
  resolveBtn.type = 'button';
  resolveBtn.classList.add('btn', 'btn-sm', 'btn-resolve');
  resolveBtn.setAttribute('data-action', 'resolve');
  resolveBtn.textContent = 'Resolve';

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.classList.add('btn', 'btn-sm', 'btn-delete');
  deleteBtn.setAttribute('data-action', 'delete');
  deleteBtn.textContent = 'Delete';

  actionsWrap.appendChild(resolveBtn);
  actionsWrap.appendChild(deleteBtn);
  actionsCell.appendChild(actionsWrap);
  row.appendChild(actionsCell);

  tableBody.appendChild(row);
  refreshRowStatusDisplay(record);
}

function refreshRowStatusDisplay(record) {
  const row = tableBody.querySelector('tr[data-id="' + record.id + '"]');
  if (!row) return;

  const statusBadge = row.querySelector('.status-badge');
  const resolveBtn = row.querySelector('[data-action="resolve"]');

  if (record.status === 'Resolved') {
    statusBadge.textContent = 'Resolved';
    statusBadge.classList.remove('badge-open');
    statusBadge.classList.add('badge-resolved');
    row.classList.add('row-resolved');
    resolveBtn.disabled = true;
  } else {
    statusBadge.textContent = 'Open';
    statusBadge.classList.remove('badge-resolved');
    statusBadge.classList.add('badge-open');
    row.classList.remove('row-resolved');
    resolveBtn.disabled = false;
  }
}

// ---------------------------------------------------------
// Row actions (event delegation on the table body)
// ---------------------------------------------------------
tableBody.addEventListener('click', function (event) {
  const button = event.target.closest('button');
  if (!button) return;

  const row = button.closest('tr');
  const id = Number(row.getAttribute('data-id'));
  const action = button.getAttribute('data-action');

  const record = exceptions.find(function (item) {
    return item.id === id;
  });
  if (!record) return;

  if (action === 'resolve') {
    record.status = 'Resolved';
    refreshRowStatusDisplay(record);
    updateStats();
    applyFilters();
  }

  if (action === 'delete') {
    const confirmed = window.confirm(
      'Delete exception for Delivery ID "' + record.deliveryId + '"? This cannot be undone.'
    );
    if (confirmed) {
      exceptions = exceptions.filter(function (item) {
        return item.id !== id;
      });
      row.remove();
      updateStats();
      updateEmptyState();
      applyFilters();
    }
  }
});

// ---------------------------------------------------------
// Filters (show/hide rows only - data stays in memory)
// ---------------------------------------------------------
filterType.addEventListener('change', applyFilters);
filterStatus.addEventListener('change', applyFilters);

function applyFilters() {
  const typeValue = filterType.value;
  const statusValue = filterStatus.value;
  let visibleCount = 0;

  exceptions.forEach(function (record) {
    const row = tableBody.querySelector('tr[data-id="' + record.id + '"]');
    if (!row) return;

    const matchesType = typeValue === 'all' || record.issueType === typeValue;
    const matchesStatus = statusValue === 'all' || record.status === statusValue;

    if (matchesType && matchesStatus) {
      row.classList.remove('is-hidden-by-filter');
      row.style.display = '';
      visibleCount = visibleCount + 1;
    } else {
      row.style.display = 'none';
    }
  });

  updateEmptyState(visibleCount);
}

// ---------------------------------------------------------
// Stats
// ---------------------------------------------------------
function updateStats() {
  const total = exceptions.length;
  const openCount = exceptions.filter(function (item) {
    return item.status === 'Open';
  }).length;
  const resolvedCount = total - openCount;

  statTotal.textContent = total;
  statOpen.textContent = openCount;
  statResolved.textContent = resolvedCount;
}

// ---------------------------------------------------------
// Empty states
// ---------------------------------------------------------
function updateEmptyState(visibleCount) {
  const hasAnyData = exceptions.length > 0;

  if (!hasAnyData) {
    table.style.display = 'none';
    emptyState.hidden = false;
    noMatchState.hidden = true;
    return;
  }

  table.style.display = '';
  emptyState.hidden = true;

  const visible = typeof visibleCount === 'number' ? visibleCount : countVisibleRows();
  noMatchState.hidden = visible !== 0;
}

function countVisibleRows() {
  let count = 0;
  const rows = tableBody.querySelectorAll('tr');
  rows.forEach(function (row) {
    if (row.style.display !== 'none') {
      count = count + 1;
    }
  });
  return count;
}

// ---------------------------------------------------------
// Init
// ---------------------------------------------------------
updateStats();
updateEmptyState();