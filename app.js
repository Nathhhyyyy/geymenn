let stations = [];

function renderStations() {
    const listContainer = document.getElementById('stationList');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';

    if (!stations || stations.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #64748b;">
                <p>⌛ Fetching live station pricing from API backend...</p>
            </div>
        `;
        return;
    }

    stations.forEach((station, index) => {
        const card = document.createElement('div');
        card.className = `station-card ${index === 0 ? 'rank-1' : ''}`;
        card.innerHTML = `
            <div class="station-info">
                <h3>${station.name}</h3>
                <p class="station-meta">${station.address}</p>
                <div style="margin-top: 0.5rem; font-size: 0.9rem;">
                    <div>⛽ <strong>Unleaded:</strong> ₱${Number(station.prices.unleaded).toFixed(2)} / L</div>
                    <div>⛽ <strong>Premium:</strong> ₱${Number(station.prices.premium).toFixed(2)} / L</div>
                    <div>🚛 <strong>Diesel:</strong> ₱${Number(station.prices.diesel).toFixed(2)} / L</div>
                </div>
                <p class="station-meta" style="margin-top: 0.5rem;">
                    <strong>Amenities:</strong> ${station.amenities ? station.amenities.join(', ') : 'Standard Amenities'}
                </p>
            </div>
            <div class="station-cost">
                <span class="badge" style="background-color: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">
                    Live API
                </span>
            </div>
        `;
        listContainer.appendChild(card);
    });

    const statusEl = document.getElementById('sortStatus');
    if (statusEl) statusEl.innerText = `Synced ${stations.length} Zamboanga Stations`;
}

async function fetchLivePrices() {
    const statusEl = document.getElementById('sortStatus');
    if (statusEl) statusEl.innerText = "Syncing with backend...";

    try {
        const response = await fetch('/api/live-prices');
        const data = await response.json();

        if (data.success && Array.isArray(data.stations) && data.stations.length > 0) {
            stations = data.stations;
            renderStations();
            if (statusEl) statusEl.innerText = "Live Sync Active";
        } else {
            console.warn("API Warning:", data.error);
            if (statusEl) statusEl.innerText = "Sync Notice: " + (data.error || "No data");
        }
    } catch (err) {
        console.error("Fetch Error:", err);
        if (statusEl) statusEl.innerText = "Network Error";
    }
}

// Button event listeners
document.getElementById('liveSyncBtn')?.addEventListener('click', fetchLivePrices);
document.getElementById('sortBtn')?.addEventListener('click', () => {
    // Basic price sorting (lowest unleaded price first)
    stations.sort((a, b) => a.prices.unleaded - b.prices.unleaded);
    renderStations();
});

// Run on page load
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', fetchLivePrices);
} else {
    fetchLivePrices();
}
