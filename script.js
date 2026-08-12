// =========================================================
// GreyAtom Logistics - Delivery Exception Management Logic
// =========================================================

// ---------------------------------------------------------
// State (In-Memory Storage)
// Filters only hide/show rows in the DOM; data is preserved.
// ---------------------------------------------------------
let exceptions = [
  {
    id: 101,
    deliveryId: 'DEL-90412',
    customerName: 'Ananya Sharma',
    issueType: 'Address Not Found',
    priority: 'High',
    notes: 'Customer provided incomplete street address.',
    status: 'Open'
  },
  {
    id: 102,
    deliveryId: 'DEL-90388',
    customerName: 'Rahul Verma',
    issueType: 'Payment Issue',
    priority: 'Medium',
    notes: 'COD cash not ready, customer requested retry tomorrow.',
    status: 'Resolved'
  }
];

let nextId = 103;

// ---------------------------------------------------------
// DOM References
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
// Initialization
// ---------------------------------------------------------
function init() {
  // Render initial sample records
  exceptions.forEach(function (record) {
    addRowToTable(record);
  });

  updateStats();
  applyFilters();
  setupRealtimeValidation();
}

// ---------------------------------------------------------
// Real-time Form Validation setup
// ---------------------------------------------------------
function setupRealtimeValidation() {
  const deliveryIdInput = document.querySelector('#deliveryId');
  const customerNameInput = document.querySelector('#customerName');
  const issueTypeSelect = document.querySelector('#issueType');
  const priorityRadios = document.querySelectorAll('input[name="priority"]');

  deliveryIdInput.addEventListener('input', function () {
    if (deliveryIdInput.value.trim() !== '') {
      clearFieldError('field-deliveryId');
    }
  });

  customerNameInput.addEventListener('input', function () {
    if (customerNameInput.value.trim() !== '') {
      clearFieldError('field-customerName');
    }
  });

  issueTypeSelect.addEventListener('change', function () {
    if (issueTypeSelect.value !== '') {
      clearFieldError('field-issueType');
    }
  });

  priorityRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      clearFieldError('field-priority');
    });
  });
}

function clearFieldError(fieldId) {
  const container = document.querySelector('#' + fieldId);
  if (container) {
    container.classList.remove('has-error');
  }
}

function clearAllErrors() {
  const fields = document.querySelectorAll('.field');
  fields.forEach(function (field) {
    field.classList.remove('has-error');
  });
}

// ---------------------------------------------------------
// Form Submit Handler
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

  const newRecord = {
    id: nextId,
    deliveryId: deliveryId,
    customerName: customerName,
    issueType: issueType,
    priority: priority,
    notes: notes,
    status: 'Open'
  };
  nextId++;

  exceptions.push(newRecord);
  addRowToTable(newRecord);

  // Reset Form & Clear Errors
  form.reset();
  clearAllErrors();

  // Refresh Table Display & Stats
  applyFilters();
  updateStats();

  document.querySelector('#deliveryId').focus();
});

// ---------------------------------------------------------
// Form Validation Logic
// ---------------------------------------------------------
function validateForm(deliveryId, customerName, issueType, priority) {
  clearAllErrors();
  let valid = true;

  if (deliveryId === '') {
    showFieldError('field-deliveryId');
    valid = false;
  }
  if (customerName === '') {
    showFieldError('field-customerName');
    valid = false;
  }
  if (issueType === '') {
    showFieldError('field-issueType');
    valid = false;
  }
  if (priority === '') {
    showFieldError('field-priority');
    valid = false;
  }

  return valid;
}

function showFieldError(fieldId) {
  const container = document.querySelector('#' + fieldId);
  if (container) {
    container.classList.add('has-error');
  }
}

// ---------------------------------------------------------
// Table Row Creation (DOM Manipulation)
// ---------------------------------------------------------
function addRowToTable(record) {
  const row = document.createElement('tr');
  row.setAttribute('data-id', record.id);

  if (record.priority === 'High') {
    row.classList.add('row-high-priority');
  }

  if (record.notes) {
    row.setAttribute('title', 'Notes: ' + record.notes);
  }

  // Delivery ID
  const idCell = document.createElement('td');
  idCell.textContent = record.deliveryId;
  row.appendChild(idCell);

  // Customer Name
  const nameCell = document.createElement('td');
  nameCell.textContent = record.customerName;
  row.appendChild(nameCell);

  // Issue Type
  const typeCell = document.createElement('td');
  typeCell.textContent = record.issueType;
  row.appendChild(typeCell);

  // Priority Badge
  const priorityCell = document.createElement('td');
  const priorityBadge = document.createElement('span');
  priorityBadge.classList.add('badge', 'badge-prio-' + record.priority.toLowerCase());
  priorityBadge.textContent = record.priority;
  priorityCell.appendChild(priorityBadge);
  row.appendChild(priorityCell);

  // Status Badge
  const statusCell = document.createElement('td');
  const statusBadge = document.createElement('span');
  statusBadge.classList.add('badge', 'status-badge');
  statusCell.appendChild(statusBadge);
  row.appendChild(statusCell);

  // Action Buttons
  const actionsCell = document.createElement('td');
  const actionsWrap = document.createElement('div');
  actionsWrap.classList.add('action-buttons');

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

  // Apply initial status styling
  renderRowStatus(row, record.status);
}

function renderRowStatus(row, status) {
  const statusBadge = row.querySelector('.status-badge');
  const resolveBtn = row.querySelector('[data-action="resolve"]');

  if (status === 'Resolved') {
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
// Event Delegation for Row Actions (Resolve / Delete)
// ---------------------------------------------------------
tableBody.addEventListener('click', function (event) {
  const button = event.target.closest('button');
  if (!button) return;

  const row = button.closest('tr');
  if (!row) return;

  const id = Number(row.getAttribute('data-id'));
  const action = button.getAttribute('data-action');

  const record = exceptions.find(function (item) {
    return item.id === id;
  });

  if (!record) return;

  if (action === 'resolve') {
    record.status = 'Resolved';
    renderRowStatus(row, record.status);
    updateStats();
    applyFilters();
  }

  if (action === 'delete') {
    const confirmed = window.confirm(
      'Are you sure you want to delete delivery exception "' + record.deliveryId + '"? This action cannot be undone.'
    );
    if (confirmed) {
      // Remove from memory array
      exceptions = exceptions.filter(function (item) {
        return item.id !== id;
      });

      // Remove row from DOM
      row.remove();

      updateStats();
      applyFilters();
    }
  }
});

// ---------------------------------------------------------
// Filters (DOM manipulation show/hide without memory removal)
// ---------------------------------------------------------
filterType.addEventListener('change', applyFilters);
filterStatus.addEventListener('change', applyFilters);

function applyFilters() {
  const selectedType = filterType.value;
  const selectedStatus = filterStatus.value;
  let visibleCount = 0;

  exceptions.forEach(function (record) {
    const row = tableBody.querySelector('tr[data-id="' + record.id + '"]');
    if (!row) return;

    const matchesType = selectedType === 'all' || record.issueType === selectedType;
    const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus;

    if (matchesType && matchesStatus) {
      row.style.display = '';
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });

  updateEmptyStateVisibility(visibleCount);
}

// ---------------------------------------------------------
// Stats Calculation (Bonus Feature)
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
// Empty State Visibility
// ---------------------------------------------------------
function updateEmptyStateVisibility(visibleCount) {
  const hasData = exceptions.length > 0;

  if (!hasData) {
    table.style.display = 'none';
    emptyState.hidden = false;
    noMatchState.hidden = true;
    return;
  }

  table.style.display = '';
  emptyState.hidden = true;

  if (visibleCount === 0) {
    noMatchState.hidden = false;
  } else {
    noMatchState.hidden = true;
  }
}

// Start application
init();