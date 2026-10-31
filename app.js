let stations = [];

function renderStations() {
    const listContainer = document.getElementById('stationList');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';

    if (stations.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #64748b;">
                <p>⌛ Waiting for live data fetch...</p>
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
                <p class="station-meta" style="margin-top: 0.5rem;"><strong>Station Goods / Perks:</strong> ${station.amenities ? station.amenities.join(', ') : 'Standard Perks'}</p>
            </div>
            <div class="station-cost">
                <span class="badge">Live API</span>
            </div>
        `;
        listContainer.appendChild(card);
    });

    const statusEl = document.getElementById('sortStatus');
    if (statusEl) statusEl.innerText = `Synced ${stations.length} Stations`;
}

async function fetchLivePrices() {
    const statusEl = document.getElementById('sortStatus');
    if (statusEl) statusEl.innerText = "Querying live API endpoint...";

    try {
        const res = await fetch('/api/live-prices');
        const data = await res.json();

        if (data.success && Array.isArray(data.stations)) {
            stations = data.stations;
            renderStations();
            if (statusEl) statusEl.innerText = "Live Sync Active";
        } else {
            if (statusEl) statusEl.innerText = "Sync Notice: " + (data.error || "No data");
        }
    } catch (err) {
        if (statusEl) statusEl.innerText = "Sync Error";
        console.error(err);
    }
}

document.getElementById('liveSyncBtn')?.addEventListener('click', fetchLivePrices);
document.getElementById('sortBtn')?.addEventListener('click', fetchLivePrices);

window.addEventListener('DOMContentLoaded', fetchLivePrices);
