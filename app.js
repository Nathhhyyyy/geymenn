let stations = [
    {
        id: "s1", name: "Petron Baliwasan", brand: "Petron", address: "Baliwasan, Zamboanga City",
        prices: { unleaded: 98.50, premium: 104.20, diesel: 88.50 },
        amenities: ["Air & Water", "Convenience Store (Treats)"],
        updatedAt: "2026-10-31"
    },
    {
        id: "s2", name: "Shell Guiwan", brand: "Shell", address: "Guiwan, Zamboanga City",
        prices: { unleaded: 99.80, premium: 106.00, diesel: 89.90 },
        amenities: ["Shell Select", "ATM", "Restrooms"],
        updatedAt: "2026-10-31"
    },
    {
        id: "s3", name: "Caltex Tetuan", brand: "Caltex", address: "Tetuan, Zamboanga City",
        prices: { unleaded: 97.90, premium: 103.50, diesel: 87.80 },
        amenities: ["Star Mart", "Lube Change Bay"],
        updatedAt: "2026-10-31"
    },
    {
        id: "s4", name: "Phoenix Putik", brand: "Phoenix", address: "Putik, Zamboanga City",
        prices: { unleaded: 96.50, premium: 102.00, diesel: 86.50 },
        amenities: ["FamilyMart Express", "Air Pump"],
        updatedAt: "2026-10-31"
    }
];

function renderStations() {
    const listContainer = document.getElementById('stationList');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';

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
                <span class="badge">Updated: ${station.updatedAt || 'Live'}</span>
            </div>
        `;
        listContainer.appendChild(card);
    });

    const statusEl = document.getElementById('sortStatus');
    if (statusEl) statusEl.innerText = `Showing ${stations.length} Zamboanga Stations`;
}

async function fetchLivePrices() {
    const statusEl = document.getElementById('sortStatus');
    if (statusEl) statusEl.innerText = "Querying live backend API...";

    try {
        const response = await fetch('/api/live-prices');
        const data = await response.json();

        if (data.success && Array.isArray(data.stations) && data.stations.length > 0) {
            stations = data.stations;
            renderStations();
            if (statusEl) statusEl.innerText = "Live Sync Active";
        } else {
            console.warn("Live API Notice:", data.error);
            if (statusEl) statusEl.innerText = "DOE Cache Active";
            renderStations();
        }
    } catch (err) {
        console.error("Network fetch error:", err);
        if (statusEl) statusEl.innerText = "Local Dataset Active";
        renderStations();
    }
}

// Event Listeners
document.getElementById('liveSyncBtn')?.addEventListener('click', fetchLivePrices);
document.getElementById('sortBtn')?.addEventListener('click', renderStations);

// Initial Load
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
        renderStations();
        fetchLivePrices();
    });
} else {
    renderStations();
    fetchLivePrices();
}
