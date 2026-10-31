let commodities = [];

// Helper function: Get maximum centavos value for Radix Sort pass count
function getMaxCentavos(arr) {
    let max = 0;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].priceCentavos > max) max = arr[i].priceCentavos;
    }
    return max;
}

// Counting Sort subroutine by specific digit position (exp = 1, 10, 100, 1000)
function countingSortByDigit(arr, exp) {
    let output = new Array(arr.length);
    let count = new Array(10).fill(0);

    // Store count of occurrences in count[]
    for (let i = 0; i < arr.length; i++) {
        let digit = Math.floor(arr[i].priceCentavos / exp) % 10;
        count[digit]++;
    }

    // Change count[i] so that count[i] contains actual position in output[]
    for (let i = 1; i < 10; i++) {
        count[i] += count[i - 1];
    }

    // Build the output array (stable sort processing backwards)
    for (let i = arr.length - 1; i >= 0; i--) {
        let digit = Math.floor(arr[i].priceCentavos / exp) % 10;
        output[count[digit] - 1] = arr[i];
        count[digit]--;
    }

    // Copy output array back to arr[]
    for (let i = 0; i < arr.length; i++) {
        arr[i] = output[i];
    }
}

// Main LSD Radix Sort Function
function runRadixSort() {
    if (!commodities || commodities.length === 0) return;

    let maxVal = getMaxCentavos(commodities);

    // Run counting sort for every digit position (1s, 10s, 100s, 1000s)
    for (let exp = 1; Math.floor(maxVal / exp) > 0; exp *= 10) {
        countingSortByDigit(commodities, exp);
    }

    renderCommodities();
    
    const statusEl = document.getElementById('sortStatus');
    if (statusEl) statusEl.innerText = `Sorted ${commodities.length} items via Radix Sort (Centavos Key)`;
}

// Render DOM Cards
function renderCommodities() {
    const listContainer = document.getElementById('stationList');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';

    if (!commodities || commodities.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #64748b;">
                <p>⌛ Querying DTI SRP market backend...</p>
            </div>
        `;
        return;
    }

    commodities.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = `station-card ${index === 0 ? 'rank-1' : ''}`;
        card.innerHTML = `
            <div class="station-info">
                <h3>${item.name}</h3>
                <p class="station-meta">Brand: <strong>${item.brand}</strong> | Category: <strong>${item.category}</strong></p>
                <div style="margin-top: 0.5rem; font-size: 1rem;">
                    🏷️ <strong>DTI SRP Price:</strong> ₱${Number(item.pricePHP).toFixed(2)} 
                    <span style="font-size: 0.85rem; color: #64748b;">(${item.priceCentavos} centavos)</span>
                </div>
            </div>
            <div class="station-cost">
                <span class="badge" style="background-color: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">
                    DTI SRP
                </span>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

// Fetch dynamic data from API
async function fetchLivePrices() {
    const statusEl = document.getElementById('sortStatus');
    if (statusEl) statusEl.innerText = "Syncing with backend...";

    try {
        const response = await fetch('/api/live-prices');
        const data = await response.json();

        if (data.success && Array.isArray(data.items) && data.items.length > 0) {
            commodities = data.items;
            renderCommodities();
            if (statusEl) statusEl.innerText = `Live DTI Sync Active (${commodities.length} items loaded)`;
        } else {
            if (statusEl) statusEl.innerText = "Sync Notice: " + (data.error || "No data");
        }
    } catch (err) {
        console.error("Fetch Error:", err);
        if (statusEl) statusEl.innerText = "Network Error";
    }
}

// Event Listeners
document.getElementById('liveSyncBtn')?.addEventListener('click', fetchLivePrices);
document.getElementById('sortBtn')?.addEventListener('click', runRadixSort);

// Initial Execution
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', fetchLivePrices);
} else {
    fetchLivePrices();
}
