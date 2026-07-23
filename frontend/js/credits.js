// Initialize Dark Mode theme from localStorage
(function() {
    if (localStorage.getItem("dark_theme") === "true") {
        document.body.classList.add("dark-theme");
    }
})();

// Mock Transaction Log Data
const mockTransactions = [];

document.addEventListener("DOMContentLoaded", () => {
    // 1. Sync User Header info and Fetch wallet details from db
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('headerUserName').textContent = user.firstName;
        document.getElementById('headerUserRole').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        document.getElementById('headerUserAvatar').textContent = (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
        
        fetchWalletDetails(user.id);
    }

    // 2. Render Transaction logs
    renderTransactions();
});

// Fetch active profile metrics to keep wallet balances in sync with SQLite
async function fetchWalletDetails(userId) {
    try {
        const response = await fetch('/api/profile', {
            method: 'GET',
            headers: {
                'X-User-Id': userId
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            const p = data.profile;
            // Update balance indicators
            document.getElementById('walletBalance').textContent = p.creditsEarned;
            document.getElementById('earnedCredits').textContent = p.creditsEarned;
            document.getElementById('spentCredits').textContent = 0;
        }
    } catch (error) {
        console.error('Fetch wallet metrics error:', error);
    }
}

// Render Transaction table rows
function renderTransactions() {
    const tbody = document.getElementById("transactionLogBody");
    tbody.innerHTML = "";

    if (mockTransactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-light); font-style: italic;">
                    No transactions recorded yet.
                </td>
            </tr>
        `;
        return;
    }

    mockTransactions.forEach(tx => {
        const row = document.createElement("tr");

        const dateObj = new Date(tx.date);
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        const formattedDate = dateObj.toLocaleDateString('en-US', options);

        const typeLabel = tx.type === "earned" ? "🟢 Earned" : "🔴 Spent";
        const typeClass = tx.type === "earned" ? "type-cell earned" : "type-cell spent";

        const amountText = tx.amount > 0 ? `+${tx.amount}` : `${tx.amount}`;
        const amountClass = tx.amount > 0 ? "amount-val plus" : "amount-val minus";

        row.innerHTML = `
            <td>
                <span class="${typeClass}">
                    ${typeLabel}
                </span>
            </td>
            <td>${tx.partner}</td>
            <td>${tx.skill}</td>
            <td>${formattedDate}</td>
            <td>
                <span class="${amountClass}">
                    ${amountText}
                </span>
            </td>
        `;

        tbody.appendChild(row);
    });
}
