<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BizBooks - Small Business Accounting</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background:#f3f4f6; }
        .fade-in { animation: fadeIn 0.3s ease-in; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useEffect, useReducer, useContext, createContext, useRef } = React;

        // ==================== COMPANY / CONSTANTS ====================
        const COMPANY = { name: 'BizBooks Inc.', address: '123 Business Ave, Suite 100', phone: '(555) 123-4567', email: 'hello@bizbooks.com' };

        const PAYMENT_METHODS = [
            { value: 'CASH', label: 'Cash' },
            { value: 'BANK', label: 'Bank Transfer' },
            { value: 'MOBILE_MONEY', label: 'Mobile Money' },
            { value: 'CHECK', label: 'Check' },
        ];

        // ==================== INITIAL STATE ====================
        const initialState = {
            cashbook: {
                balance: 50000.00,
                transactions: [
                    { id: 'CB001', date: '2026-07-01', type: 'IN', category: 'OPENING_BALANCE', amount: 50000.00, description: 'Opening balance', reference: null, referenceType: null, paymentMethod: 'CASH', runningBalance: 50000.00 }
                ]
            },
            receivables: {
                customers: [
                    { id: 'CUST001', name: 'ABC Corp', phone: '555-0100', email: 'abc@example.com', address: '123 Main St', totalReceivables: 15000.00,
                        invoices: [
                            { id: 'INV001', customerId: 'CUST001', date: '2026-07-05', dueDate: '2026-08-05', status: 'UNPAID',
                                items: [{ productId: 'PROD001', productName: 'Widget A', quantity: 10, unitPrice: 1500.00, total: 15000.00 }],
                                subtotal: 15000.00, tax: 0, total: 15000.00, amountPaid: 0, balance: 15000.00, payments: [] }
                        ],
                        payments: []
                    }
                ]
            },
            inventory: {
                products: [
                    { id: 'PROD001', name: 'Widget A', sku: 'WGT-A-001', category: 'Widgets', costPrice: 800.00, sellingPrice: 1500.00, reorderLevel: 20, unit: 'pieces', description: 'Standard widget',
                        stockByStore: { STORE001: 100 },
                        movements: [{ id: 'MV-INIT-1', date: '2026-07-01', type: 'OPENING', storeId: 'STORE001', quantity: 100, balanceAfter: 100, reference: null, note: 'Opening stock' }] },
                    { id: 'PROD002', name: 'Gadget B', sku: 'GDG-B-002', category: 'Gadgets', costPrice: 1200.00, sellingPrice: 2200.00, reorderLevel: 25, unit: 'pieces', description: 'Premium gadget',
                        stockByStore: { STORE001: 15 },
                        movements: [{ id: 'MV-INIT-2', date: '2026-07-01', type: 'OPENING', storeId: 'STORE001', quantity: 15, balanceAfter: 15, reference: null, note: 'Opening stock' }] }
                ]
            },
            payables: {
                vendors: [
                    { id: 'VEND001', name: 'SupplyPro Ltd', phone: '555-0200', email: 'supply@pro.com', address: '456 Oak Ave', totalPayables: 20000.00,
                        bills: [
                            { id: 'BILL001', vendorId: 'VEND001', date: '2026-07-03', dueDate: '2026-08-03', status: 'UNPAID',
                                items: [{ productId: 'PROD001', productName: 'Widget A', quantity: 25, unitCost: 800.00, total: 20000.00 }],
                                subtotal: 20000.00, tax: 0, total: 20000.00, amountPaid: 0, balance: 20000.00, payments: [] }
                        ],
                        payments: []
                    }
                ]
            },
            stores: [
                { id: 'STORE001', name: 'Main Store', location: 'Head Office' }
            ],
            systemCounters: { lastTransactionId: 1, lastInvoiceId: 1, lastBillId: 1, lastCustomerId: 1, lastVendorId: 1, lastProductId: 2, lastStoreId: 1 }
        };

        // ==================== CONTEXT ====================
        const AccountingContext = createContext();

        const ACTIONS = {
            CREATE_INVOICE: 'CREATE_INVOICE',
            RECORD_INVOICE_PAYMENT: 'RECORD_INVOICE_PAYMENT',
            CUSTOMER_PAYMENT: 'CUSTOMER_PAYMENT',
            CREATE_BILL: 'CREATE_BILL',
            RECORD_BILL_PAYMENT: 'RECORD_BILL_PAYMENT',
            VENDOR_PAYMENT: 'VENDOR_PAYMENT',
            ADD_CASH_TRANSACTION: 'ADD_CASH_TRANSACTION',
            ADD_PRODUCT: 'ADD_PRODUCT',
            UPDATE_PRODUCT: 'UPDATE_PRODUCT',
            ADD_CUSTOMER: 'ADD_CUSTOMER',
            ADD_VENDOR: 'ADD_VENDOR',
            ADD_STORE: 'ADD_STORE',
            TRANSFER_STOCK: 'TRANSFER_STOCK',
            STOCK_ADJUSTMENT: 'STOCK_ADJUSTMENT',
            UPDATE_OVERDUE_STATUS: 'UPDATE_OVERDUE_STATUS',
            RESET_DATA: 'RESET_DATA',
        };

        function generateId(prefix, counter) {
            return `${prefix}${String(counter).padStart(3, '0')}`;
        }
        function uid(prefix) {
            return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        }

        function accountingReducer(state, action) {
            const newState = JSON.parse(JSON.stringify(state));

            switch (action.type) {
                case ACTIONS.CREATE_INVOICE: {
                    const { customerId, items, date, dueDate, storeId } = action.payload;
                    const customer = newState.receivables.customers.find(c => c.id === customerId);
                    if (!customer) { alert('Please select a customer'); return state; }
                    if (!storeId) { alert('Please select a store'); return state; }
                    if (!items.length || items.some(i => !i.productId)) { alert('Please add at least one valid item'); return state; }

                    for (const item of items) {
                        const product = newState.inventory.products.find(p => p.id === item.productId);
                        const storeStock = product ? (product.stockByStore[storeId] || 0) : 0;
                        if (!product || storeStock < item.quantity) {
                            alert(`Insufficient stock for ${item.productName || item.productId} at selected store`);
                            return state;
                        }
                    }

                    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
                    const newInvoiceId = generateId('INV', newState.systemCounters.lastInvoiceId + 1);

                    const newInvoice = {
                        id: newInvoiceId, customerId, date, dueDate: dueDate || date, status: 'UNPAID', storeId,
                        items: items.map(item => ({ ...item, total: item.quantity * item.unitPrice })),
                        subtotal, tax: 0, total: subtotal, amountPaid: 0, balance: subtotal, payments: []
                    };

                    items.forEach(item => {
                        const product = newState.inventory.products.find(p => p.id === item.productId);
                        if (product) {
                            const before = product.stockByStore[storeId] || 0;
                            const after = before - item.quantity;
                            product.stockByStore[storeId] = after;
                            product.movements.push({ id: uid('MV'), date, type: 'SALE', storeId, quantity: -item.quantity, balanceAfter: after, reference: newInvoiceId, note: `Sold on invoice ${newInvoiceId}` });
                        }
                    });

                    customer.invoices.push(newInvoice);
                    customer.totalReceivables += subtotal;
                    newState.systemCounters.lastInvoiceId += 1;
                    return newState;
                }

                case ACTIONS.RECORD_INVOICE_PAYMENT: {
                    const { invoiceId, amount, paymentMethod, date } = action.payload;
                    let targetInvoice = null, targetCustomer = null;

                    for (const customer of newState.receivables.customers) {
                        const invoice = customer.invoices.find(inv => inv.id === invoiceId);
                        if (invoice) { targetInvoice = invoice; targetCustomer = customer; break; }
                    }

                    if (!targetInvoice) { alert('Invoice not found'); return state; }
                    if (!amount || amount <= 0 || amount > targetInvoice.balance) {
                        alert('Invalid payment amount'); return state;
                    }

                    targetInvoice.payments.push({ id: uid('PAY'), date, amount, paymentMethod });
                    targetInvoice.amountPaid += amount;
                    targetInvoice.balance -= amount;
                    targetInvoice.status = targetInvoice.balance === 0 ? 'PAID' : 'PARTIAL';
                    targetCustomer.totalReceivables -= amount;
                    targetCustomer.payments = targetCustomer.payments || [];
                    targetCustomer.payments.push({ id: uid('CPAY'), date, amount, paymentMethod, allocations: [{ invoiceId, amount }] });

                    const newTxnId = generateId('CB', newState.systemCounters.lastTransactionId + 1);
                    newState.cashbook.balance += amount;
                    newState.cashbook.transactions.push({
                        id: newTxnId, date, type: 'IN', category: 'INVOICE_PAYMENT', amount,
                        description: `Payment from ${targetCustomer.name} - Invoice ${invoiceId}`,
                        reference: invoiceId, referenceType: 'INVOICE_PAYMENT', paymentMethod,
                        runningBalance: newState.cashbook.balance
                    });
                    newState.systemCounters.lastTransactionId += 1;
                    return newState;
                }

                case ACTIONS.CUSTOMER_PAYMENT: {
                    const { customerId, amount, paymentMethod, date } = action.payload;
                    const customer = newState.receivables.customers.find(c => c.id === customerId);
                    if (!customer) { alert('Customer not found'); return state; }
                    const amt = parseFloat(amount) || 0;
                    if (amt <= 0) { alert('Enter a valid amount'); return state; }
                    if (amt > customer.totalReceivables) { alert('Amount exceeds total outstanding balance'); return state; }

                    const unpaidInvoices = customer.invoices.filter(inv => inv.status !== 'PAID').sort((a, b) => new Date(a.date) - new Date(b.date));
                    let remaining = amt;
                    const allocations = [];
                    for (const invoice of unpaidInvoices) {
                        if (remaining <= 0) break;
                        const payAmt = Math.min(remaining, invoice.balance);
                        invoice.payments.push({ id: uid('PAY'), date, amount: payAmt, paymentMethod });
                        invoice.amountPaid += payAmt;
                        invoice.balance -= payAmt;
                        invoice.status = invoice.balance === 0 ? 'PAID' : 'PARTIAL';
                        allocations.push({ invoiceId: invoice.id, amount: payAmt });
                        remaining -= payAmt;
                    }
                    const applied = amt - remaining;
                    customer.totalReceivables -= applied;
                    customer.payments = customer.payments || [];
                    customer.payments.push({ id: uid('CPAY'), date, amount: applied, paymentMethod, allocations });

                    const newTxnId = generateId('CB', newState.systemCounters.lastTransactionId + 1);
                    newState.cashbook.balance += applied;
                    newState.cashbook.transactions.push({
                        id: newTxnId, date, type: 'IN', category: 'CUSTOMER_PAYMENT', amount: applied,
                        description: `Payment from ${customer.name} (${allocations.map(a => a.invoiceId).join(', ')})`,
                        reference: customerId, referenceType: 'CUSTOMER_PAYMENT', paymentMethod,
                        runningBalance: newState.cashbook.balance
                    });
                    newState.systemCounters.lastTransactionId += 1;
                    return newState;
                }

                case ACTIONS.CREATE_BILL: {
                    const { vendorId, items, date, dueDate, storeId } = action.payload;
                    const vendor = newState.payables.vendors.find(v => v.id === vendorId);
                    if (!vendor) { alert('Please select a vendor'); return state; }
                    if (!storeId) { alert('Please select a receiving store'); return state; }
                    if (!items.length || items.some(i => !i.productId)) { alert('Please add at least one valid item'); return state; }

                    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
                    const newBillId = generateId('BILL', newState.systemCounters.lastBillId + 1);

                    const newBill = {
                        id: newBillId, vendorId, date, dueDate: dueDate || date, status: 'UNPAID', storeId,
                        items: items.map(item => ({ ...item, total: item.quantity * item.unitCost })),
                        subtotal, tax: 0, total: subtotal, amountPaid: 0, balance: subtotal, payments: []
                    };

                    items.forEach(item => {
                        const product = newState.inventory.products.find(p => p.id === item.productId);
                        if (product) {
                            const before = product.stockByStore[storeId] || 0;
                            const after = before + item.quantity;
                            product.stockByStore[storeId] = after;
                            product.movements.push({ id: uid('MV'), date, type: 'PURCHASE', storeId, quantity: item.quantity, balanceAfter: after, reference: newBillId, note: `Received on bill ${newBillId}` });
                        }
                    });

                    vendor.bills.push(newBill);
                    vendor.totalPayables += subtotal;
                    newState.systemCounters.lastBillId += 1;
                    return newState;
                }

                case ACTIONS.RECORD_BILL_PAYMENT: {
                    const { billId, amount, paymentMethod, date } = action.payload;
                    let targetBill = null, targetVendor = null;

                    for (const vendor of newState.payables.vendors) {
                        const bill = vendor.bills.find(b => b.id === billId);
                        if (bill) { targetBill = bill; targetVendor = vendor; break; }
                    }

                    if (!targetBill) { alert('Bill not found'); return state; }
                    if (!amount || amount <= 0 || amount > targetBill.balance || newState.cashbook.balance < amount) {
                        alert('Invalid payment or insufficient balance'); return state;
                    }

                    targetBill.payments.push({ id: uid('PAY'), date, amount, paymentMethod });
                    targetBill.amountPaid += amount;
                    targetBill.balance -= amount;
                    targetBill.status = targetBill.balance === 0 ? 'PAID' : 'PARTIAL';
                    targetVendor.totalPayables -= amount;
                    targetVendor.payments = targetVendor.payments || [];
                    targetVendor.payments.push({ id: uid('VPAY'), date, amount, paymentMethod, allocations: [{ billId, amount }] });

                    const newTxnId = generateId('CB', newState.systemCounters.lastTransactionId + 1);
                    newState.cashbook.balance -= amount;
                    newState.cashbook.transactions.push({
                        id: newTxnId, date, type: 'OUT', category: 'BILL_PAYMENT', amount,
                        description: `Payment to ${targetVendor.name} - Bill ${billId}`,
                        reference: billId, referenceType: 'BILL_PAYMENT', paymentMethod,
                        runningBalance: newState.cashbook.balance
                    });
                    newState.systemCounters.lastTransactionId += 1;
                    return newState;
                }

                case ACTIONS.VENDOR_PAYMENT: {
                    const { vendorId, amount, paymentMethod, date } = action.payload;
                    const vendor = newState.payables.vendors.find(v => v.id === vendorId);
                    if (!vendor) { alert('Vendor not found'); return state; }
                    const amt = parseFloat(amount) || 0;
                    if (amt <= 0) { alert('Enter a valid amount'); return state; }
                    if (amt > vendor.totalPayables) { alert('Amount exceeds total outstanding balance'); return state; }
                    if (amt > newState.cashbook.balance) { alert('Insufficient cash balance'); return state; }

                    const unpaidBills = vendor.bills.filter(b => b.status !== 'PAID').sort((a, b) => new Date(a.date) - new Date(b.date));
                    let remaining = amt;
                    const allocations = [];
                    for (const bill of unpaidBills) {
                        if (remaining <= 0) break;
                        const payAmt = Math.min(remaining, bill.balance);
                        bill.payments.push({ id: uid('PAY'), date, amount: payAmt, paymentMethod });
                        bill.amountPaid += payAmt;
                        bill.balance -= payAmt;
                        bill.status = bill.balance === 0 ? 'PAID' : 'PARTIAL';
                        allocations.push({ billId: bill.id, amount: payAmt });
                        remaining -= payAmt;
                    }
                    const applied = amt - remaining;
                    vendor.totalPayables -= applied;
                    vendor.payments = vendor.payments || [];
                    vendor.payments.push({ id: uid('VPAY'), date, amount: applied, paymentMethod, allocations });

                    const newTxnId = generateId('CB', newState.systemCounters.lastTransactionId + 1);
                    newState.cashbook.balance -= applied;
                    newState.cashbook.transactions.push({
                        id: newTxnId, date, type: 'OUT', category: 'VENDOR_PAYMENT', amount: applied,
                        description: `Payment to ${vendor.name} (${allocations.map(a => a.billId).join(', ')})`,
                        reference: vendorId, referenceType: 'VENDOR_PAYMENT', paymentMethod,
                        runningBalance: newState.cashbook.balance
                    });
                    newState.systemCounters.lastTransactionId += 1;
                    return newState;
                }

                case ACTIONS.ADD_CASH_TRANSACTION: {
                    const { type, category, amount, description, paymentMethod, date } = action.payload;
                    if (!amount || amount <= 0) { alert('Enter a valid amount'); return state; }
                    if (type === 'OUT' && newState.cashbook.balance < amount) {
                        alert('Insufficient balance'); return state;
                    }

                    const newTxnId = generateId('CB', newState.systemCounters.lastTransactionId + 1);
                    const balanceChange = type === 'IN' ? amount : -amount;
                    newState.cashbook.balance += balanceChange;
                    newState.cashbook.transactions.push({
                        id: newTxnId, date, type, category, amount, description,
                        reference: null, referenceType: 'GENERAL', paymentMethod,
                        runningBalance: newState.cashbook.balance
                    });
                    newState.systemCounters.lastTransactionId += 1;
                    return newState;
                }

                case ACTIONS.ADD_PRODUCT: {
                    const { storeId, quantity, ...fields } = action.payload;
                    const newId = generateId('PROD', newState.systemCounters.lastProductId + 1);
                    const qty = parseInt(quantity) || 0;
                    const stockByStore = {};
                    if (storeId) stockByStore[storeId] = qty;
                    const movements = [];
                    const today = new Date().toISOString().split('T')[0];
                    if (storeId && qty > 0) {
                        movements.push({ id: uid('MV'), date: today, type: 'OPENING', storeId, quantity: qty, balanceAfter: qty, reference: null, note: 'Opening stock' });
                    }
                    newState.inventory.products.push({ ...fields, id: newId, stockByStore, movements });
                    newState.systemCounters.lastProductId += 1;
                    return newState;
                }

                case ACTIONS.UPDATE_PRODUCT: {
                    const index = newState.inventory.products.findIndex(p => p.id === action.payload.id);
                    if (index !== -1) {
                        const existing = newState.inventory.products[index];
                        newState.inventory.products[index] = { ...existing, ...action.payload, stockByStore: existing.stockByStore, movements: existing.movements };
                    }
                    return newState;
                }

                case ACTIONS.ADD_CUSTOMER: {
                    const newId = generateId('CUST', newState.systemCounters.lastCustomerId + 1);
                    newState.receivables.customers.push({ ...action.payload, id: newId, totalReceivables: 0, invoices: [], payments: [] });
                    newState.systemCounters.lastCustomerId += 1;
                    return newState;
                }

                case ACTIONS.ADD_VENDOR: {
                    const newId = generateId('VEND', newState.systemCounters.lastVendorId + 1);
                    newState.payables.vendors.push({ ...action.payload, id: newId, totalPayables: 0, bills: [], payments: [] });
                    newState.systemCounters.lastVendorId += 1;
                    return newState;
                }

                case ACTIONS.ADD_STORE: {
                    const newId = generateId('STORE', newState.systemCounters.lastStoreId + 1);
                    newState.stores.push({ id: newId, name: action.payload.name, location: action.payload.location || '' });
                    newState.systemCounters.lastStoreId += 1;
                    return newState;
                }

                case ACTIONS.TRANSFER_STOCK: {
                    const { productId, fromStoreId, toStoreId, quantity, date, note } = action.payload;
                    const product = newState.inventory.products.find(p => p.id === productId);
                    if (!product) { alert('Product not found'); return state; }
                    if (!fromStoreId || !toStoreId) { alert('Please select both stores'); return state; }
                    if (fromStoreId === toStoreId) { alert('Source and destination stores must differ'); return state; }
                    const qty = parseInt(quantity) || 0;
                    const available = product.stockByStore[fromStoreId] || 0;
                    if (qty <= 0 || qty > available) { alert('Invalid transfer quantity'); return state; }

                    product.stockByStore[fromStoreId] = available - qty;
                    product.stockByStore[toStoreId] = (product.stockByStore[toStoreId] || 0) + qty;
                    const transferId = uid('TRF');
                    product.movements.push({ id: `${transferId}-OUT`, date, type: 'TRANSFER_OUT', storeId: fromStoreId, quantity: -qty, balanceAfter: product.stockByStore[fromStoreId], reference: transferId, note: note || 'Stock transfer out' });
                    product.movements.push({ id: `${transferId}-IN`, date, type: 'TRANSFER_IN', storeId: toStoreId, quantity: qty, balanceAfter: product.stockByStore[toStoreId], reference: transferId, note: note || 'Stock transfer in' });
                    return newState;
                }

                case ACTIONS.STOCK_ADJUSTMENT: {
                    const { productId, storeId, quantity, date, note } = action.payload;
                    const product = newState.inventory.products.find(p => p.id === productId);
                    if (!product) { alert('Product not found'); return state; }
                    if (!storeId) { alert('Please select a store'); return state; }
                    const delta = parseInt(quantity) || 0;
                    if (delta === 0) { alert('Enter a non-zero adjustment quantity'); return state; }
                    const before = product.stockByStore[storeId] || 0;
                    const after = before + delta;
                    if (after < 0) { alert('Adjustment would result in negative stock'); return state; }
                    product.stockByStore[storeId] = after;
                    product.movements.push({ id: uid('MV'), date, type: 'ADJUSTMENT', storeId, quantity: delta, balanceAfter: after, reference: null, note: note || 'Manual adjustment' });
                    return newState;
                }

                case ACTIONS.UPDATE_OVERDUE_STATUS: {
                    const today = new Date();
                    newState.receivables.customers.forEach(c => {
                        c.invoices.forEach(inv => {
                            if ((inv.status === 'UNPAID' || inv.status === 'PARTIAL') && new Date(inv.dueDate) < today)
                                inv.status = 'OVERDUE';
                        });
                    });
                    newState.payables.vendors.forEach(v => {
                        v.bills.forEach(bill => {
                            if ((bill.status === 'UNPAID' || bill.status === 'PARTIAL') && new Date(bill.dueDate) < today)
                                bill.status = 'OVERDUE';
                        });
                    });
                    return newState;
                }

                case ACTIONS.RESET_DATA: {
                    return JSON.parse(JSON.stringify(initialState));
                }

                default: return state;
            }
        }

        function AccountingProvider({ children }) {
            const [state, dispatch] = useReducer(accountingReducer, initialState, () => {
                try {
                    const saved = localStorage.getItem('accountingState');
                    return saved ? JSON.parse(saved) : initialState;
                } catch (e) {
                    return initialState;
                }
            });

            useEffect(() => { localStorage.setItem('accountingState', JSON.stringify(state)); }, [state]);
            useEffect(() => { dispatch({ type: ACTIONS.UPDATE_OVERDUE_STATUS }); }, []);

            return (
                <AccountingContext.Provider value={{ state, dispatch }}>
                    {children}
                </AccountingContext.Provider>
            );
        }

        function useAccounting() {
            return useContext(AccountingContext);
        }

        // ==================== UTILITIES ====================
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
        };

        const formatDate = (date) => {
            if (!date) return '—';
            return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        };

        const getStatusColor = (status) => {
            const colors = { PAID: 'bg-green-100 text-green-800', UNPAID: 'bg-yellow-100 text-yellow-800', OVERDUE: 'bg-red-100 text-red-800', PARTIAL: 'bg-blue-100 text-blue-800' };
            return colors[status] || 'bg-gray-100 text-gray-800';
        };

        const statusBadgeClass = (status) => {
            return { PAID: 'badge-paid', UNPAID: 'badge-unpaid', PARTIAL: 'badge-partial', OVERDUE: 'badge-overdue' }[status] || 'badge-unpaid';
        };

        const getStoreStock = (product, storeId) => (product.stockByStore && product.stockByStore[storeId]) || 0;
        const getTotalStock = (product) => Object.values(product.stockByStore || {}).reduce((a, b) => a + b, 0);

        const paymentMethodLabel = (value) => (PAYMENT_METHODS.find(m => m.value === value) || {}).label || value;

        function computeAgingRows(list, itemsKey) {
            const today = new Date();
            return list.map(entity => {
                const items = entity[itemsKey].filter(x => x.status !== 'PAID');
                const aging = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };
                items.forEach(x => {
                    const daysDiff = Math.floor((today - new Date(x.dueDate)) / (1000 * 60 * 60 * 24));
                    if (daysDiff <= 0) aging.current += x.balance;
                    else if (daysDiff <= 30) aging.days30 += x.balance;
                    else if (daysDiff <= 60) aging.days60 += x.balance;
                    else if (daysDiff <= 90) aging.days90 += x.balance;
                    else aging.over90 += x.balance;
                });
                const total = Object.values(aging).reduce((a, b) => a + b, 0);
                return { name: entity.name, ...aging, total };
            }).filter(r => r.total > 0);
        }

        // ==================== PRINT ENGINE ====================
        function openPrintWindow(title, bodyHtml) {
            const win = window.open('', '_blank', 'width=900,height=1100');
            if (!win) { alert('Please allow pop-ups for this site to print documents.'); return; }
            win.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                <title>${title} - ${COMPANY.name}</title>
                <meta charset="UTF-8">
                <style>
                    * { margin:0; padding:0; box-sizing:border-box; }
                    body { font-family: Georgia, 'Times New Roman', serif; color:#1f2937; padding: 40px; font-size: 13px; }
                    .doc-header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 3px solid #1e3a5f; padding-bottom:16px; margin-bottom:24px; }
                    .company-name { font-size:24px; font-weight:bold; color:#1e3a5f; letter-spacing:0.5px; }
                    .company-sub { font-size:11px; color:#6b7280; margin-top:2px; }
                    .doc-title { text-align:right; }
                    .doc-title h1 { font-size:20px; color:#1e3a5f; text-transform:uppercase; letter-spacing:1px; }
                    .doc-title p { font-size:11px; color:#6b7280; margin-top:4px; }
                    table { width:100%; border-collapse:collapse; margin-top:12px; }
                    th { background:#1e3a5f; color:#fff; text-align:left; padding:8px 10px; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; }
                    td { padding:8px 10px; border-bottom:1px solid #e5e7eb; font-size:12.5px; }
                    tr:last-child td { border-bottom: none; }
                    .text-right { text-align:right; }
                    .text-center { text-align:center; }
                    .totals-table td { border: none; padding: 4px 10px; }
                    .badge { display:inline-block; padding:3px 10px; border-radius:4px; font-size:11px; font-weight:bold; text-transform:uppercase; }
                    .badge-paid { background:#d1fae5; color:#065f46; }
                    .badge-unpaid { background:#fef3c7; color:#92400e; }
                    .badge-partial { background:#dbeafe; color:#1e40af; }
                    .badge-overdue { background:#fee2e2; color:#991b1b; }
                    .section-title { font-size:14px; font-weight:bold; color:#1e3a5f; margin: 24px 0 8px; border-bottom:1px solid #d1d5db; padding-bottom:4px; }
                    .meta-grid { display:flex; justify-content:space-between; margin: 20px 0; gap: 40px; }
                    .meta-block h4 { font-size:10px; text-transform:uppercase; color:#9ca3af; margin-bottom:4px; letter-spacing:0.5px; }
                    .meta-block p { font-size:13px; line-height:1.5; }
                    .footer-note { margin-top: 40px; font-size:11px; color:#9ca3af; text-align:center; border-top:1px solid #e5e7eb; padding-top:12px; }
                    @media print { body { padding: 20px; } }
                </style>
                </head>
                <body>
                    <div class="doc-header">
                        <div>
                            <div class="company-name">${COMPANY.name}</div>
                            <div class="company-sub">${COMPANY.address}</div>
                            <div class="company-sub">${COMPANY.phone} • ${COMPANY.email}</div>
                        </div>
                        <div class="doc-title">
                            <h1>${title}</h1>
                            <p>Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>
                    ${bodyHtml}
                    <div class="footer-note">This is a system-generated document from ${COMPANY.name}.</div>
                </body>
                </html>
            `);
            win.document.close();
            win.focus();
            setTimeout(() => { win.print(); }, 300);
        }

        function buildInvoiceHtml(invoice, customer) {
            const itemsRows = invoice.items.map(item => `
                <tr><td>${item.productName}</td><td class="text-center">${item.quantity}</td><td class="text-right">${formatCurrency(item.unitPrice)}</td><td class="text-right">${formatCurrency(item.total)}</td></tr>
            `).join('');
            const paymentsRows = invoice.payments.length ? invoice.payments.map(p => `
                <tr><td>${formatDate(p.date)}</td><td>${paymentMethodLabel(p.paymentMethod)}</td><td class="text-right">${formatCurrency(p.amount)}</td></tr>
            `).join('') : '<tr><td colspan="3" class="text-center" style="color:#9ca3af;">No payments recorded</td></tr>';

            return `
                <div class="meta-grid">
                    <div class="meta-block">
                        <h4>Bill To</h4>
                        <p><strong>${customer.name}</strong><br/>${customer.address || ''}<br/>${customer.phone || ''} ${customer.email ? '• ' + customer.email : ''}</p>
                    </div>
                    <div class="meta-block" style="text-align:right;">
                        <h4>Invoice Number</h4>
                        <p><strong>${invoice.id}</strong></p>
                        <h4 style="margin-top:10px;">Invoice Date</h4>
                        <p>${formatDate(invoice.date)}</p>
                        <h4 style="margin-top:10px;">Due Date</h4>
                        <p>${formatDate(invoice.dueDate)}</p>
                        <h4 style="margin-top:10px;">Status</h4>
                        <p><span class="badge ${statusBadgeClass(invoice.status)}">${invoice.status}</span></p>
                    </div>
                </div>
                <table><thead><tr><th>Item</th><th class="text-center">Qty</th><th class="text-right">Unit Price</th><th class="text-right">Total</th></tr></thead><tbody>${itemsRows}</tbody></table>
                <table class="totals-table" style="width:300px; margin-left:auto; margin-top:16px;">
                    <tr><td>Subtotal</td><td class="text-right">${formatCurrency(invoice.subtotal)}</td></tr>
                    <tr><td>Tax</td><td class="text-right">${formatCurrency(invoice.tax)}</td></tr>
                    <tr><td><strong>Total</strong></td><td class="text-right"><strong>${formatCurrency(invoice.total)}</strong></td></tr>
                    <tr><td>Amount Paid</td><td class="text-right">${formatCurrency(invoice.amountPaid)}</td></tr>
                    <tr style="border-top:2px solid #1e3a5f;"><td><strong>Balance Due</strong></td><td class="text-right"><strong>${formatCurrency(invoice.balance)}</strong></td></tr>
                </table>
                <div class="section-title">Payment History</div>
                <table><thead><tr><th>Date</th><th>Method</th><th class="text-right">Amount</th></tr></thead><tbody>${paymentsRows}</tbody></table>
            `;
        }

        function buildBillHtml(bill, vendor) {
            const itemsRows = bill.items.map(item => `
                <tr><td>${item.productName}</td><td class="text-center">${item.quantity}</td><td class="text-right">${formatCurrency(item.unitCost)}</td><td class="text-right">${formatCurrency(item.total)}</td></tr>
            `).join('');
            const paymentsRows = bill.payments.length ? bill.payments.map(p => `
                <tr><td>${formatDate(p.date)}</td><td>${paymentMethodLabel(p.paymentMethod)}</td><td class="text-right">${formatCurrency(p.amount)}</td></tr>
            `).join('') : '<tr><td colspan="3" class="text-center" style="color:#9ca3af;">No payments recorded</td></tr>';

            return `
                <div class="meta-grid">
                    <div class="meta-block">
                        <h4>Vendor</h4>
                        <p><strong>${vendor.name}</strong><br/>${vendor.address || ''}<br/>${vendor.phone || ''} ${vendor.email ? '• ' + vendor.email : ''}</p>
                    </div>
                    <div class="meta-block" style="text-align:right;">
                        <h4>Bill Number</h4>
                        <p><strong>${bill.id}</strong></p>
                        <h4 style="margin-top:10px;">Bill Date</h4>
                        <p>${formatDate(bill.date)}</p>
                        <h4 style="margin-top:10px;">Due Date</h4>
                        <p>${formatDate(bill.dueDate)}</p>
                        <h4 style="margin-top:10px;">Status</h4>
                        <p><span class="badge ${statusBadgeClass(bill.status)}">${bill.status}</span></p>
                    </div>
                </div>
                <table><thead><tr><th>Item</th><th class="text-center">Qty</th><th class="text-right">Unit Cost</th><th class="text-right">Total</th></tr></thead><tbody>${itemsRows}</tbody></table>
                <table class="totals-table" style="width:300px; margin-left:auto; margin-top:16px;">
                    <tr><td>Subtotal</td><td class="text-right">${formatCurrency(bill.subtotal)}</td></tr>
                    <tr><td>Tax</td><td class="text-right">${formatCurrency(bill.tax)}</td></tr>
                    <tr><td><strong>Total</strong></td><td class="text-right"><strong>${formatCurrency(bill.total)}</strong></td></tr>
                    <tr><td>Amount Paid</td><td class="text-right">${formatCurrency(bill.amountPaid)}</td></tr>
                    <tr style="border-top:2px solid #1e3a5f;"><td><strong>Balance Due</strong></td><td class="text-right"><strong>${formatCurrency(bill.balance)}</strong></td></tr>
                </table>
                <div class="section-title">Payment History</div>
                <table><thead><tr><th>Date</th><th>Method</th><th class="text-right">Amount</th></tr></thead><tbody>${paymentsRows}</tbody></table>
            `;
        }

        function buildCustomerStatementHtml(customer) {
            const invoiceRows = customer.invoices.slice().sort((a, b) => new Date(a.date) - new Date(b.date)).map(inv => `
                <tr><td>${inv.id}</td><td>${formatDate(inv.date)}</td><td>${formatDate(inv.dueDate)}</td><td><span class="badge ${statusBadgeClass(inv.status)}">${inv.status}</span></td><td class="text-right">${formatCurrency(inv.total)}</td><td class="text-right">${formatCurrency(inv.amountPaid)}</td><td class="text-right">${formatCurrency(inv.balance)}</td></tr>
            `).join('') || '<tr><td colspan="7" class="text-center" style="color:#9ca3af;">No invoices</td></tr>';

            const payments = (customer.payments || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
            const paymentRows = payments.map(p => `
                <tr><td>${formatDate(p.date)}</td><td>${paymentMethodLabel(p.paymentMethod)}</td><td>${p.allocations.map(a => a.invoiceId).join(', ')}</td><td class="text-right">${formatCurrency(p.amount)}</td></tr>
            `).join('') || '<tr><td colspan="4" class="text-center" style="color:#9ca3af;">No payments recorded</td></tr>';

            return `
                <div class="meta-grid">
                    <div class="meta-block"><h4>Customer</h4><p><strong>${customer.name}</strong><br/>${customer.address || ''}<br/>${customer.phone || ''} ${customer.email ? '• ' + customer.email : ''}</p></div>
                    <div class="meta-block" style="text-align:right;"><h4>Outstanding Balance</h4><p style="font-size:20px; font-weight:bold; color:#1e3a5f;">${formatCurrency(customer.totalReceivables)}</p></div>
                </div>
                <div class="section-title">Invoices</div>
                <table><thead><tr><th>Invoice #</th><th>Date</th><th>Due Date</th><th>Status</th><th class="text-right">Total</th><th class="text-right">Paid</th><th class="text-right">Balance</th></tr></thead><tbody>${invoiceRows}</tbody></table>
                <div class="section-title">Payment History</div>
                <table><thead><tr><th>Date</th><th>Method</th><th>Applied To</th><th class="text-right">Amount</th></tr></thead><tbody>${paymentRows}</tbody></table>
            `;
        }

        function buildVendorStatementHtml(vendor) {
            const billRows = vendor.bills.slice().sort((a, b) => new Date(a.date) - new Date(b.date)).map(bill => `
                <tr><td>${bill.id}</td><td>${formatDate(bill.date)}</td><td>${formatDate(bill.dueDate)}</td><td><span class="badge ${statusBadgeClass(bill.status)}">${bill.status}</span></td><td class="text-right">${formatCurrency(bill.total)}</td><td class="text-right">${formatCurrency(bill.amountPaid)}</td><td class="text-right">${formatCurrency(bill.balance)}</td></tr>
            `).join('') || '<tr><td colspan="7" class="text-center" style="color:#9ca3af;">No bills</td></tr>';

            const payments = (vendor.payments || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
            const paymentRows = payments.map(p => `
                <tr><td>${formatDate(p.date)}</td><td>${paymentMethodLabel(p.paymentMethod)}</td><td>${p.allocations.map(a => a.billId).join(', ')}</td><td class="text-right">${formatCurrency(p.amount)}</td></tr>
            `).join('') || '<tr><td colspan="4" class="text-center" style="color:#9ca3af;">No payments recorded</td></tr>';

            return `
                <div class="meta-grid">
                    <div class="meta-block"><h4>Vendor</h4><p><strong>${vendor.name}</strong><br/>${vendor.address || ''}<br/>${vendor.phone || ''} ${vendor.email ? '• ' + vendor.email : ''}</p></div>
                    <div class="meta-block" style="text-align:right;"><h4>Outstanding Balance</h4><p style="font-size:20px; font-weight:bold; color:#1e3a5f;">${formatCurrency(vendor.totalPayables)}</p></div>
                </div>
                <div class="section-title">Bills</div>
                <table><thead><tr><th>Bill #</th><th>Date</th><th>Due Date</th><th>Status</th><th class="text-right">Total</th><th class="text-right">Paid</th><th class="text-right">Balance</th></tr></thead><tbody>${billRows}</tbody></table>
                <div class="section-title">Payment History</div>
                <table><thead><tr><th>Date</th><th>Method</th><th>Applied To</th><th class="text-right">Amount</th></tr></thead><tbody>${paymentRows}</tbody></table>
            `;
        }

        function buildAgingHtml(rows, label) {
            const trs = rows.map(r => `
                <tr><td>${r.name}</td><td class="text-right">${formatCurrency(r.current)}</td><td class="text-right">${formatCurrency(r.days30)}</td><td class="text-right">${formatCurrency(r.days60)}</td><td class="text-right">${formatCurrency(r.days90)}</td><td class="text-right">${formatCurrency(r.over90)}</td></tr>
            `).join('') || `<tr><td colspan="6" class="text-center" style="color:#9ca3af;">No outstanding balances</td></tr>`;
            return `<table><thead><tr><th>${label}</th><th class="text-right">Current</th><th class="text-right">1-30 Days</th><th class="text-right">31-60 Days</th><th class="text-right">61-90 Days</th><th class="text-right">90+ Days</th></tr></thead><tbody>${trs}</tbody></table>`;
        }

        function buildPaymentsListHtml(rows, entityLabel) {
            const trs = rows.map(r => `
                <tr><td>${formatDate(r.date)}</td><td>${r.entityName}</td><td>${paymentMethodLabel(r.paymentMethod)}</td><td>${r.applied}</td><td class="text-right">${formatCurrency(r.amount)}</td></tr>
            `).join('') || `<tr><td colspan="5" class="text-center" style="color:#9ca3af;">No payments recorded</td></tr>`;
            return `<table><thead><tr><th>Date</th><th>${entityLabel}</th><th>Method</th><th>Applied To</th><th class="text-right">Amount</th></tr></thead><tbody>${trs}</tbody></table>`;
        }

        function buildCashbookReportHtml(transactions, balance) {
            const rows = transactions.slice().reverse().map(t => `
                <tr><td>${formatDate(t.date)}</td><td>${t.type}</td><td>${t.description}</td><td>${t.category}</td><td class="text-right">${formatCurrency(t.amount)}</td><td class="text-right">${formatCurrency(t.runningBalance)}</td></tr>
            `).join('');
            return `
                <div class="meta-grid"><div class="meta-block"><h4>Current Balance</h4><p style="font-size:20px;font-weight:bold;color:#1e3a5f;">${formatCurrency(balance)}</p></div></div>
                <table><thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Category</th><th class="text-right">Amount</th><th class="text-right">Balance</th></tr></thead><tbody>${rows}</tbody></table>
            `;
        }

        function buildDashboardReportHtml(state) {
            const totalReceivables = state.receivables.customers.reduce((s, c) => s + c.totalReceivables, 0);
            const totalPayables = state.payables.vendors.reduce((s, v) => s + v.totalPayables, 0);
            const income = state.cashbook.transactions.filter(t => t.type === 'IN' && t.category !== 'OPENING_BALANCE').reduce((s, t) => s + t.amount, 0);
            const expenses = state.cashbook.transactions.filter(t => t.type === 'OUT').reduce((s, t) => s + t.amount, 0);
            const lowStock = state.inventory.products.filter(p => getTotalStock(p) <= p.reorderLevel);
            const lowStockRows = lowStock.map(p => `<tr><td>${p.name}</td><td class="text-right">${getTotalStock(p)} ${p.unit}</td></tr>`).join('') || '<tr><td colspan="2" class="text-center" style="color:#9ca3af;">All products well stocked</td></tr>';
            return `
                <table class="totals-table" style="width:400px;">
                    <tr><td>Cash Balance</td><td class="text-right"><strong>${formatCurrency(state.cashbook.balance)}</strong></td></tr>
                    <tr><td>Total Receivables</td><td class="text-right">${formatCurrency(totalReceivables)}</td></tr>
                    <tr><td>Total Payables</td><td class="text-right">${formatCurrency(totalPayables)}</td></tr>
                    <tr><td>Income</td><td class="text-right">${formatCurrency(income)}</td></tr>
                    <tr><td>Expenses</td><td class="text-right">${formatCurrency(expenses)}</td></tr>
                    <tr style="border-top:2px solid #1e3a5f;"><td><strong>Net Profit</strong></td><td class="text-right"><strong>${formatCurrency(income - expenses)}</strong></td></tr>
                </table>
                <div class="section-title">Low Stock Alerts</div>
                <table><thead><tr><th>Product</th><th class="text-right">Stock</th></tr></thead><tbody>${lowStockRows}</tbody></table>
            `;
        }

        function buildInventoryReportHtml(products, stores) {
            const rows = products.map(p => {
                const total = getTotalStock(p);
                const low = total <= p.reorderLevel;
                return `<tr><td>${p.name}</td><td>${p.sku}</td><td>${p.category || '—'}</td><td class="text-right">${formatCurrency(p.costPrice)}</td><td class="text-right">${formatCurrency(p.sellingPrice)}</td><td class="text-right" style="${low ? 'color:#991b1b;font-weight:bold;' : ''}">${total} ${p.unit}</td><td class="text-right">${p.reorderLevel}</td></tr>`;
            }).join('');
            return `<table><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th class="text-right">Cost</th><th class="text-right">Price</th><th class="text-right">Total Stock</th><th class="text-right">Reorder Level</th></tr></thead><tbody>${rows}</tbody></table>`;
        }

        function buildStockCardHtml(product, stores) {
            const storeName = (id) => (stores.find(s => s.id === id) || {}).name || id;
            const stockRows = stores.map(s => `<tr><td>${s.name}</td><td class="text-right">${getStoreStock(product, s.id)} ${product.unit}</td></tr>`).join('');
            const totalStock = getTotalStock(product);
            const moveRows = product.movements.slice().sort((a, b) => new Date(a.date) - new Date(b.date)).map(m => `
                <tr><td>${formatDate(m.date)}</td><td>${m.type}</td><td>${storeName(m.storeId)}</td><td class="text-right" style="color:${m.quantity < 0 ? '#991b1b' : '#065f46'};">${m.quantity > 0 ? '+' : ''}${m.quantity}</td><td class="text-right">${m.balanceAfter}</td><td>${m.note || m.reference || ''}</td></tr>
            `).join('') || '<tr><td colspan="6" class="text-center" style="color:#9ca3af;">No stock movements</td></tr>';

            return `
                <div class="meta-grid">
                    <div class="meta-block"><h4>Product</h4><p><strong>${product.name}</strong><br/>SKU: ${product.sku}<br/>Category: ${product.category || '—'}</p></div>
                    <div class="meta-block" style="text-align:right;"><h4>Total Stock</h4><p style="font-size:20px; font-weight:bold; color:#1e3a5f;">${totalStock} ${product.unit}</p></div>
                </div>
                <div class="section-title">Stock by Store</div>
                <table><thead><tr><th>Store</th><th class="text-right">Quantity</th></tr></thead><tbody>${stockRows}</tbody></table>
                <div class="section-title">Movement History</div>
                <table><thead><tr><th>Date</th><th>Type</th><th>Store</th><th class="text-right">Qty Change</th><th class="text-right">Balance</th><th>Reference / Note</th></tr></thead><tbody>${moveRows}</tbody></table>
            `;
        }

        // ==================== SHARED COMPONENTS ====================
        function Modal({ isOpen, onClose, title, children, wide }) {
            if (!isOpen) return null;
            return (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
                    <div className={`bg-white rounded-lg shadow-xl ${wide ? 'max-w-4xl' : 'max-w-2xl'} w-full mx-4 max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
                            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>
                        <div className="p-6">{children}</div>
                    </div>
                </div>
            );
        }

        function PrintButton({ onClick, label }) {
            return (
                <button onClick={onClick} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                    <span>🖨️</span><span>{label || 'Print Report'}</span>
                </button>
            );
        }

        function PaymentMethodSelect({ value, onChange }) {
            return (
                <select value={value} onChange={onChange} className="w-full border rounded-lg px-3 py-2">
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
            );
        }

        function ItemsEditor({ items, setItems, products, priceField, costLabel, storeId }) {
            const updateItem = (idx, field, value) => {
                const next = items.slice();
                const product = products.find(p => p.id === value);
                if (field === 'productId') {
                    next[idx] = {
                        ...next[idx],
                        productId: value,
                        productName: product ? product.name : '',
                        [priceField]: product ? product[priceField === 'unitPrice' ? 'sellingPrice' : 'costPrice'] : 0
                    };
                } else {
                    next[idx] = { ...next[idx], [field]: value };
                }
                setItems(next);
            };
            const addRow = () => setItems([...items, { productId: '', quantity: 1, [priceField]: 0 }]);
            const removeRow = (idx) => setItems(items.filter((_, i) => i !== idx));

            const lineTotal = (item) => (parseFloat(item.quantity) || 0) * (parseFloat(item[priceField]) || 0);
            const grandTotal = items.reduce((sum, item) => sum + lineTotal(item), 0);

            return (
                <div className="space-y-3">
                    <label className="block text-sm font-medium mb-1">Items</label>
                    {items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                            <select
                                className="col-span-5 border rounded-lg px-2 py-2 text-sm"
                                value={item.productId}
                                onChange={e => updateItem(idx, 'productId', e.target.value)}
                                required
                            >
                                <option value="">Select product...</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({storeId ? getStoreStock(p, storeId) : getTotalStock(p)} in stock)</option>)}
                            </select>
                            <input
                                type="number" min="1" required placeholder="Qty"
                                className="col-span-2 border rounded-lg px-2 py-2 text-sm"
                                value={item.quantity}
                                onChange={e => updateItem(idx, 'quantity', e.target.value)}
                            />
                            <input
                                type="number" step="0.01" min="0" required placeholder={costLabel}
                                className="col-span-3 border rounded-lg px-2 py-2 text-sm"
                                value={item[priceField]}
                                onChange={e => updateItem(idx, priceField, e.target.value)}
                            />
                            <span className="col-span-1 text-sm text-right">{formatCurrency(lineTotal(item))}</span>
                            <button type="button" onClick={() => removeRow(idx)} className="col-span-1 text-red-500 hover:text-red-700 text-lg">&times;</button>
                        </div>
                    ))}
                    <button type="button" onClick={addRow} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add item</button>
                    <div className="flex justify-end font-semibold pt-2 border-t">
                        <span>Total: {formatCurrency(grandTotal)}</span>
                    </div>
                </div>
            );
        }

        function Sidebar({ activePage, setActivePage }) {
            const navItems = [
                { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                { id: 'cashbook', label: 'Cash Book', icon: '💵' },
                { id: 'receivables', label: 'Receivables', icon: '📥' },
                { id: 'payables', label: 'Payables', icon: '📤' },
                { id: 'inventory', label: 'Inventory', icon: '📦' },
            ];
            return (
                <div className="w-64 bg-white border-r min-h-screen flex-shrink-0">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-bold text-gray-900">📚 BizBooks</h2>
                        <p className="text-xs text-gray-500 mt-1">Small Business Accounting</p>
                    </div>
                    <nav className="p-4 space-y-1">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActivePage(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                    activePage === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            );
        }

        // ==================== DASHBOARD ====================
        function Dashboard() {
            const { state } = useAccounting();
            const totalReceivables = state.receivables.customers.reduce((sum, c) => sum + c.totalReceivables, 0);
            const totalPayables = state.payables.vendors.reduce((sum, v) => sum + v.totalPayables, 0);
            const lowStock = state.inventory.products.filter(p => getTotalStock(p) <= p.reorderLevel);
            const income = state.cashbook.transactions.filter(t => t.type === 'IN' && t.category !== 'OPENING_BALANCE').reduce((s, t) => s + t.amount, 0);
            const expenses = state.cashbook.transactions.filter(t => t.type === 'OUT').reduce((s, t) => s + t.amount, 0);

            return (
                <div className="space-y-6 fade-in">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <PrintButton onClick={() => openPrintWindow('Dashboard Summary', buildDashboardReportHtml(state))} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-sm text-gray-500">Cash Balance</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(state.cashbook.balance)}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-sm text-gray-500">Total Receivables</p>
                            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalReceivables)}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-sm text-gray-500">Total Payables</p>
                            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalPayables)}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-sm text-gray-500">Low Stock Items</p>
                            <p className="text-2xl font-bold text-orange-600">{lowStock.length}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Profit & Loss Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between"><span>Income</span><span className="text-green-600">{formatCurrency(income)}</span></div>
                                <div className="flex justify-between"><span>Expenses</span><span className="text-red-600">{formatCurrency(expenses)}</span></div>
                                <hr/>
                                <div className="flex justify-between font-bold"><span>Net Profit</span><span className={income - expenses >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(income - expenses)}</span></div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Low Stock Alerts</h3>
                            {lowStock.length === 0 ? (
                                <p className="text-gray-500">All products are well stocked.</p>
                            ) : (
                                <div className="space-y-2">
                                    {lowStock.map(product => (
                                        <div key={product.id} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                                            <span>{product.name}</span>
                                            <span className="text-orange-600 font-semibold">{getTotalStock(product)} {product.unit}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        // ==================== CASHBOOK ====================
        function Cashbook() {
            const { state, dispatch } = useAccounting();
            const [showForm, setShowForm] = useState(false);
            const emptyForm = { type: 'IN', category: 'SALES', amount: '', description: '', paymentMethod: 'CASH', date: new Date().toISOString().split('T')[0] };
            const [formData, setFormData] = useState(emptyForm);

            const handleSubmit = (e) => {
                e.preventDefault();
                dispatch({ type: ACTIONS.ADD_CASH_TRANSACTION, payload: { ...formData, amount: parseFloat(formData.amount) } });
                setShowForm(false);
                setFormData(emptyForm);
            };

            return (
                <div className="space-y-6 fade-in">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-900">Cash Book</h1>
                        <div className="space-x-2 flex">
                            <PrintButton onClick={() => openPrintWindow('Cash Book Report', buildCashbookReportHtml(state.cashbook.transactions, state.cashbook.balance))} />
                            <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ New Transaction</button>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 mb-4">
                        <p className="text-sm text-gray-500">Current Balance</p>
                        <p className="text-3xl font-bold text-gray-900">{formatCurrency(state.cashbook.balance)}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th classNam
