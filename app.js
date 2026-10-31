// Dynamic Station Store (Starts empty - populated solely via live serverless API)
let stations = [];

/**
 * Render station cards based on retrieved API data
 */
function renderStations() {
    const listContainer = document.getElementById('stationList');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';

    if (stations.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #64748b;">
                <p style="font-size: 1.1rem;">⏳ Loading live fuel prices from Zamboanga City stations...</p>
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
                <p class="station-meta" style="margin-top: 0.5rem;"><strong>Station Goods / Perks:</strong> ${station.amenities ? station.amenities.join(', ') : 'Standard Amenities'}</p>
            </div>
            <div class="station-cost">
                <span class="badge">Updated: ${station.updatedAt || 'Live'}</span>
            </div>
        `;
        listContainer.appendChild(card);
    });

    const statusEl = document.getElementById('sortStatus');
    if (statusEl) statusEl.innerText = `Synced ${stations.length} Zamboanga Stations`;
}

/**
 * Fetch live data from serverless API endpoint (/api/live-prices)
 */
async function fetchLivePrices() {
    const statusEl = document.getElementById('sortStatus');
    if (statusEl) statusEl.innerText = "Querying live DOE market data...";
    
    try {
        const response = await fetch('/api/live-prices');
        const data = await response.json();

        if (data.success && Array.isArray(data.stations) && data.stations.length > 0) {
            stations = data.stations;
            renderStations();
            if (statusEl) statusEl.innerText = `Live sync successful`;
        } else {
            throw new Error(data.error || "Invalid response structure from serverless API");
        }
    } catch (err) {
        console.error("Live fetch failed:", err);
        const listContainer = document.getElementById('stationList');
        if (listContainer) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #ef4444;">
                    <p style="font-weight: bold;">⚠️ Unable to retrieve live pricing data.</p>
                    <small>Please verify that your Vercel deployment has <code>GROQ_API_KEY</code> set in Environment Variables.</small>
                </div>
            `;
        }
        if (statusEl) statusEl.innerText = `Sync Failed`;
    }
}

// Event Listeners for manual triggers
document.getElementById('liveSyncBtn')?.addEventListener('click', fetchLivePrices);
document.getElementById('sortBtn')?.addEventListener('click', fetchLivePrices);

// Initial execution on document load
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
        renderStations();
        fetchLivePrices();
    });
} else {
    renderStations();
    fetchLivePrices();
}
