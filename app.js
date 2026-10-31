// --- ZAMBOANGA CITY STATION DATA & GOODS ---
const stations = [
    {
        id: "s1", name: "Petron Baliwasan", brand: "Petron", address: "Baliwasan, Zamboanga City",
        prices: { unleaded: 58.50, premium: 61.00, diesel: 54.50 },
        amenities: ["Air & Water", "Convenience Store (Treats)"],
        updatedAt: "2026-10-24"
    },
    {
        id: "s2", name: "Shell Guiwan", brand: "Shell", address: "Guiwan, Zamboanga City",
        prices: { unleaded: 59.20, premium: 61.80, diesel: 55.20 },
        amenities: ["Shell Select", "ATM", "Restrooms"],
        updatedAt: "2026-10-25"
    },
    {
        id: "s3", name: "Caltex Tetuan", brand: "Caltex", address: "Tetuan, Zamboanga City",
        prices: { unleaded: 58.00, premium: 60.50, diesel: 54.00 },
        amenities: ["Star Mart", "Lube Change Bay"],
        updatedAt: "2026-10-26"
    },
    {
        id: "s4", name: "Phoenix Putik", brand: "Phoenix", address: "Putik, Zamboanga City",
        prices: { unleaded: 57.50, premium: 59.80, diesel: 53.50 },
        amenities: ["FamilyMart Express", "Air Pump"],
        updatedAt: "2026-10-23"
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
                    <div>⛽ <strong>Unleaded:</strong> ₱${station.prices.unleaded.toFixed(2)} / L</div>
                    <div>⛽ <strong>Premium:</strong> ₱${station.prices.premium.toFixed(2)} / L</div>
                    <div>🚛 <strong>Diesel:</strong> ₱${station.prices.diesel.toFixed(2)} / L</div>
                </div>
                <p class="station-meta" style="margin-top: 0.5rem;"><strong>Station Goods / Perks:</strong> ${station.amenities.join(', ')}</p>
            </div>
            <div class="station-cost">
                <span class="badge">Updated: ${station.updatedAt}</span>
            </div>
        `;
        listContainer.appendChild(card);
    });

    const statusEl = document.getElementById('sortStatus');
    if (statusEl) statusEl.innerText = `Showing ${stations.length} Zamboanga Stations`;
}

// Run on load
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', renderStations);
} else {
    renderStations();
}

async function loadLiveStationPrices() {
    try {
        const statusEl = document.getElementById('sortStatus');
        if (statusEl) statusEl.innerText = "Fetching live prices from server...";

        const response = await fetch('/api/live-prices');
        const data = await response.json();

        if (data.success && data.stations) {
            // Overwrite or update your local stations array with the live data fetched from your API
            stations = data.stations;
            renderStations(); // Re-render your UI cards with the new live values
            
            if (statusEl) statusEl.innerText = `Live data synced (${data.stations.length} stations)`;
        }
    } catch (error) {
        console.error("Error fetching live prices, falling back to cache:", error);
        renderStations(); // Fallback to default local dataset
    }
}

// Call this function when your app initializes
loadLiveStationPrices();
