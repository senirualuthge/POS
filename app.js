// ---------------------------------------------------------------
// Mini POS - products, cart, checkout and sales history
// Everything is saved in localStorage so the history survives reloads
// ---------------------------------------------------------------

const SALES_KEY = "pos_sales";
const SALE_NO_KEY = "pos_next_sale_no";
const PRODUCT_KEY = "pos_products";

// ---------- product list (same shape as the Day09 productList) ----------
// these defaults are only used the first time, after that the saved list wins
const defaultProducts = [
    { id: 1, name: "Bun", price: 120 },
    { id: 2, name: "Cake", price: 750 },
    { id: 3, name: "Milk", price: 420 },
    { id: 4, name: "Rice 1kg", price: 1280 },
    { id: 5, name: "Sugar 1kg", price: 310 },
    { id: 6, name: "Tea 100g", price: 260 },
    { id: 7, name: "Egg (10)", price: 590 },
    { id: 8, name: "Water 1L", price: 150 },
    { id: 9, name: "Yoghurt", price: 180 },
    { id: 10, name: "Biscuit", price: 240 }
];

let productList = [];
let cart = [];
let sales = [];
let nextSaleNo = 1001;

// ---------- helpers ----------

function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value).replace(/[&<>"']/g, function (ch) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
}

function money(value) {
    return "Rs. " + Number(value).toFixed(2);
}

// ---------- products ----------

function loadProducts() {
    let saved = localStorage.getItem(PRODUCT_KEY);
    productList = saved ? JSON.parse(saved) : defaultProducts;
    renderProducts();
}

function saveProducts() {
    localStorage.setItem(PRODUCT_KEY, JSON.stringify(productList));
}

function renderProducts() {
    let grid = document.getElementById("productGrid");

    if (productList.length === 0) {
        grid.innerHTML = `<p class="empty">No products yet. Add one with the form above.</p>`;
        return;
    }

    let body = "";

    for (let product of productList) {
        body += `
            <div class="product">
                <button class="product-add" onclick="addToCart(${product.id})">
                    <span class="product-name">${escapeHtml(product.name)}</span>
                    <span class="product-price">${money(product.price)}</span>
                </button>
                <button class="product-remove" title="Remove product" onclick="removeProduct(${product.id})">&times;</button>
            </div>
        `;
    }

    grid.innerHTML = body;
}

function addProduct() {
    let nameInput = document.getElementById("txtNewProduct");
    let priceInput = document.getElementById("txtNewPrice");
    let message = document.getElementById("lblProductMessage");

    let name = nameInput.value.trim();
    let price = Number(priceInput.value);

    if (name === "") {
        message.innerText = "Enter a product name.";
        return;
    }

    let exists = productList.find(p => p.name.toLowerCase() === name.toLowerCase());

    if (exists) {
        message.innerText = "That product is already in the list.";
        return;
    }

    if (!(price > 0)) {
        message.innerText = "Enter a price bigger than 0.";
        return;
    }

    let newId = 1;
    for (let product of productList) {
        if (product.id >= newId) {
            newId = product.id + 1;
        }
    }

    productList.push({
        id: newId,
        name: name,
        price: price
    });

    saveProducts();
    renderProducts();

    message.innerText = "";
    nameInput.value = "";
    priceInput.value = "";
    nameInput.focus();
}

function removeProduct(productId) {
    let product = productList.find(p => p.id === productId);
    if (!product) return;

    if (!confirm("Remove " + product.name + " from the product list?")) return;

    productList = productList.filter(p => p.id !== productId);
    saveProducts();
    renderProducts();
}

// ---------- cart ----------

function addToCart(productId) {
    let product = productList.find(p => p.id === productId);
    if (!product) return;

    let line = cart.find(item => item.id === productId);

    if (line) {
        line.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    document.getElementById("lblMessage").innerText = "";
    renderCart();
}

function changeQty(index, amount) {
    let line = cart[index];
    if (!line) return;

    line.quantity += amount;

    if (line.quantity <= 0) {
        cart.splice(index, 1);
    }

    renderCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

function clearCart() {
    cart = [];
    document.getElementById("txtCustomer").value = "";
    document.getElementById("txtCash").value = "";
    document.getElementById("txtDiscount").value = "0";
    document.getElementById("lblMessage").innerText = "";
    renderCart();
}

function getSubtotal() {
    let subtotal = 0;
    for (let line of cart) {
        subtotal += line.price * line.quantity;
    }
    return subtotal;
}

function getDiscountPercent() {
    return Number(document.getElementById("txtDiscount").value) || 0;
}

function getDiscount() {
    return getSubtotal() * getDiscountPercent() / 100;
}

function getTotal() {
    return getSubtotal() - getDiscount();
}

function getItemCount() {
    let count = 0;
    for (let line of cart) {
        count += line.quantity;
    }
    return count;
}

function renderCart() {
    let tbody = document.getElementById("cartBody");

    if (cart.length === 0) {
        tbody.innerHTML = `<tr><td class="empty" colspan="4">Cart is empty. Click a product to add it.</td></tr>`;
    } else {
        let body = "";

        for (let i = 0; i < cart.length; i++) {
            let line = cart[i];

            body += `
                <tr>
                    <td>
                        ${escapeHtml(line.name)}
                        <small class="unit">${money(line.price)}</small>
                    </td>
                    <td class="qty">
                        <button class="step" onclick="changeQty(${i}, -1)">&minus;</button>
                        <span>${line.quantity}</span>
                        <button class="step" onclick="changeQty(${i}, 1)">+</button>
                    </td>
                    <td>${money(line.price * line.quantity)}</td>
                    <td><button class="remove" onclick="removeFromCart(${i})">&times;</button></td>
                </tr>
            `;
        }

        tbody.innerHTML = body;
    }

    let subtotal = getSubtotal();
    let discount = getDiscount();
    let percent = getDiscountPercent();
    let total = getTotal();
    let cash = Number(document.getElementById("txtCash").value) || 0;
    let change = cash - total;

    document.getElementById("lblCount").innerText = getItemCount();
    document.getElementById("lblSubtotal").innerText = money(subtotal);
    document.getElementById("lblDiscountLabel").innerText = "Discount (" + percent + "%)";
    document.getElementById("lblDiscount").innerText = discount > 0 ? "-" + money(discount) : money(0);
    document.getElementById("lblTotal").innerText = money(total);
    document.getElementById("lblChange").innerText = money(change > 0 ? change : 0);
}

// ---------- checkout ----------

function completeSale() {
    let message = document.getElementById("lblMessage");
    let percent = getDiscountPercent();
    let subtotal = getSubtotal();
    let discount = getDiscount();
    let total = getTotal();
    let cash = Number(document.getElementById("txtCash").value) || 0;

    if (cart.length === 0) {
        message.innerText = "Add at least one product before checkout.";
        return;
    }

    if (percent < 0 || percent > 100) {
        message.innerText = "Discount must be between 0% and 100%.";
        return;
    }

    if (cash < total) {
        message.innerText = "Not enough cash. Need " + money(total) + ".";
        return;
    }

    let customer = document.getElementById("txtCustomer").value.trim();

    let sale = {
        no: nextSaleNo,
        date: new Date().toISOString(),
        customer: customer === "" ? "Walk-in" : customer,
        items: cart.map(line => ({
            name: line.name,
            price: line.price,
            quantity: line.quantity
        })),
        subtotal: subtotal,
        discountPercent: percent,
        discount: discount,
        total: total,
        cash: cash,
        change: cash - total
    };

    sales.push(sale);
    nextSaleNo++;
    saveSales();
    renderSales();

    cart = [];
    document.getElementById("txtCustomer").value = "";
    document.getElementById("txtCash").value = "";
    document.getElementById("txtDiscount").value = "0";
    message.innerText = "";
    renderCart();

    showReceipt(sale);
}

// ---------- receipt ----------

function showReceipt(sale) {
    let date = new Date(sale.date).toLocaleString();

    document.getElementById("receiptMeta").innerText =
        "Sale #" + sale.no + "\n" + date + "\nCustomer: " + sale.customer;

    let items = "";
    for (let line of sale.items) {
        items += `
            <div class="receipt-line">
                <span>${line.quantity} x ${escapeHtml(line.name)}</span>
                <span>${money(line.price * line.quantity)}</span>
            </div>
        `;
    }
    document.getElementById("receiptItems").innerHTML = items;

    let discountLine = "";
    if (sale.discount > 0) {
        discountLine = `<div class="receipt-line"><span>Discount (${sale.discountPercent}%)</span><span>-${money(sale.discount)}</span></div>`;
    }

    document.getElementById("receiptTotals").innerHTML = `
        <div class="receipt-line"><span>Subtotal</span><span>${money(sale.subtotal)}</span></div>
        ${discountLine}
        <div class="receipt-line"><span>Total</span><span>${money(sale.total)}</span></div>
        <div class="receipt-line"><span>Cash</span><span>${money(sale.cash)}</span></div>
        <div class="receipt-line"><span>Change</span><span>${money(sale.change)}</span></div>
    `;

    document.getElementById("receiptModal").hidden = false;
}

function printReceipt() {
    window.print();
}

function newSale() {
    document.getElementById("receiptModal").hidden = true;
}

// ---------- sales history ----------

function loadSales() {
    let saved = localStorage.getItem(SALES_KEY);
    sales = saved ? JSON.parse(saved) : [];

    let savedNo = localStorage.getItem(SALE_NO_KEY);
    nextSaleNo = savedNo ? Number(savedNo) : 1001;

    renderSales();
}

function saveSales() {
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));
    localStorage.setItem(SALE_NO_KEY, nextSaleNo);
}

function renderSummary() {
    let today = new Date().toDateString();
    let revenue = 0;
    let saleCount = 0;
    let itemCount = 0;
    let bestSellers = [];

    for (let sale of sales) {
        if (new Date(sale.date).toDateString() !== today) continue;

        saleCount++;
        revenue += sale.total;

        for (let line of sale.items) {
            itemCount += line.quantity;

            let found = bestSellers.find(b => b.name === line.name);

            if (found) {
                found.quantity += line.quantity;
                found.revenue += line.price * line.quantity;
            } else {
                bestSellers.push({
                    name: line.name,
                    quantity: line.quantity,
                    revenue: line.price * line.quantity
                });
            }
        }
    }

    bestSellers.sort((a, b) => b.quantity - a.quantity);

    document.getElementById("lblSummaryDate").innerText = today;
    document.getElementById("statRevenue").innerText = money(revenue);
    document.getElementById("statSales").innerText = saleCount;
    document.getElementById("statItems").innerText = itemCount;

    let tbody = document.getElementById("bestSellersBody");

    if (bestSellers.length === 0) {
        tbody.innerHTML = `<tr><td class="empty" colspan="3">No sales today yet.</td></tr>`;
        return;
    }

    let body = "";
    let limit = Math.min(bestSellers.length, 5);

    for (let i = 0; i < limit; i++) {
        let item = bestSellers[i];

        body += `
            <tr>
                <td>${i + 1}. ${escapeHtml(item.name)}</td>
                <td>${item.quantity}</td>
                <td>${money(item.revenue)}</td>
            </tr>
        `;
    }

    tbody.innerHTML = body;
}

function renderSales() {
    let tbody = document.getElementById("salesBody");

    renderSummary();

    if (sales.length === 0) {
        tbody.innerHTML = `<tr><td class="empty" colspan="5">No sales yet.</td></tr>`;
        return;
    }

    let body = "";

    // newest sale first
    for (let i = sales.length - 1; i >= 0; i--) {
        let sale = sales[i];
        let count = 0;
        for (let line of sale.items) {
            count += line.quantity;
        }

        body += `
            <tr>
                <td>#${sale.no}</td>
                <td>${new Date(sale.date).toLocaleString()}</td>
                <td>${escapeHtml(sale.customer)}</td>
                <td>${count}</td>
                <td>${money(sale.total)}</td>
            </tr>
        `;
    }

    tbody.innerHTML = body;
}

function clearHistory() {
    if (!confirm("Delete all saved sales?")) return;

    sales = [];
    nextSaleNo = 1001;
    saveSales();
    renderSales();
}

// ---------- start ----------

document.getElementById("lblToday").innerText = new Date().toDateString();

loadProducts();
loadSales();
renderCart();
