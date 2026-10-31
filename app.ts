interface Station {
    id: string;
    name: string;
    brand: string;
    address: string;
    lat: number;
    lng: number;
    prices: { unleaded: number; premium: number; diesel: number }; // centavos
    previousPrices: { unleaded: number; premium: number; diesel: number };
    updatedAt: string;
}

class Queue<T> {
    private items: T[] = [];
    enqueue(item: T): void { this.items.push(item); }
    dequeue(): T | undefined { return this.items.shift(); }
    isEmpty(): boolean { return this.items.length === 0; }
    toArray(): T[] { return [...this.items]; }
}

const stations: Station[] = [
    {
        id: "s1", name: "Petron Baliwasan", brand: "Petron", address: "Baliwasan, Zamboanga City",
        lat: 6.9088, lng: 122.0672,
        prices: { unleaded: 5850, premium: 6100, diesel: 5450 },
        previousPrices: { unleaded: 5750, premium: 6000, diesel: 5500 },
        updatedAt: "2026-10-24"
    },
    {
        id: "s2", name: "Shell Guiwan", brand: "Shell", address: "Guiwan, Zamboanga City",
        lat: 6.9215, lng: 122.0831,
        prices: { unleaded: 5920, premium: 6180, diesel: 5520 },
        previousPrices: { unleaded: 5900, premium: 6150, diesel: 5480 },
        updatedAt: "2026-10-25"
    },
    {
        id: "s3", name: "Caltex Tetuan", brand: "Caltex", address: "Tetuan, Zamboanga City",
        lat: 6.9172, lng: 122.0910,
        prices: { unleaded: 5800, premium: 6050, diesel: 5400 },
        previousPrices: { unleaded: 5850, premium: 6100, diesel: 5420 },
        updatedAt: "2026-10-26"
    },
    {
        id: "s4", name: "Phoenix Putik", brand: "Phoenix", address: "Putik, Zamboanga City",
        lat: 6.9350, lng: 122.0950,
        prices: { unleaded: 5750, premium: 5980, diesel: 5350 },
        previousPrices: { unleaded: 5700, premium: 5950, diesel: 5300 },
        updatedAt: "2026-10-23"
    }
];

let userLat = 6.9300;
let userLng = 122.1400; // Zone 4, Mercedes, Zamboanga City

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

interface EvaluatedStation {
    station: Station;
    distance: number;
    trueCost: number;
    selectedPrice: number;
    sortValue: number;
}

function radixSortStations(items: EvaluatedStation[]): { sorted: EvaluatedStation[]; passesLog: { pass: number; buckets: string[][] }[] } {
    if (items.length === 0) return { sorted: [], passesLog: [] };
    let maxVal = Math.max(...items.map(i => i.sortValue));
    let maxDigits = maxVal === 0 ? 1 : Math.floor(Math.log10(maxVal)) + 1;
    
    let currentItems = [...items];
    const passesLog: { pass: number; buckets: string[][] }[] = [];
    let divisor = 1;

    for (let pass = 0; pass < Math.max(maxDigits, 4); pass++) {
        const queues: Queue<EvaluatedStation>[] = Array.from({ length: 10 }, () => new Queue<EvaluatedStation>());
        for (const item of currentItems) {
            const digit = Math.floor(item.sortValue / divisor) % 10;
            queues[digit].enqueue(item);
        }
        passesLog.push({ pass: pass + 1, buckets: queues.map(q => q.toArray().map(i => i.station.name.split(' ')[1] || i.station.name)) });
        currentItems = [];
        for (let i = 0; i < 10; i++) {
            while (!queues[i].isEmpty()) {
                const item = queues[i].dequeue();
                if (item) currentItems.push(item);
            }
        }
        divisor *= 10;
    }
    return { sorted: currentItems, passesLog };
}

function runSimulation() {
    const fuelType = (document.getElementById('fuelType') as HTMLSelectElement).value as 'unleaded' | 'premium' | 'diesel';
    const liters = parseFloat((document.getElementById('liters') as HTMLInputElement).value) || 10;
    const vehicleType = (document.getElementById('vehicleType') as HTMLSelectElement).value;
    const radiusFilter = (document.getElementById('radius') as HTMLSelectElement).value;
    const sortMode = (document.getElementById('sortMode') as HTMLSelectElement).value;

    const efficiency = ({ motorcycle: 45, tricycle: 25, car: 12 })[vehicleType] || 12;

    let evaluated: EvaluatedStation[] = stations.map(station => {
        const distance = calculateDistance(userLat, userLng, station.lat, station.lng);
        const pricePerLiterCentavos = station.prices[fuelType];
        const trueCost = Math.round((pricePerLiterCentavos * liters) + (((distance * 2) / efficiency) * pricePerLiterCentavos));
        let sortValue = trueCost;
        if (sortMode === 'price') sortValue = pricePerLiterCentavos;
        if (sortMode === 'distance') sortValue = Math.round(distance * 1000);
        return { station, distance, trueCost, selectedPrice: pricePerLiterCentavos, sortValue };
    });

    if (radiusFilter !== 'all') {
        evaluated = evaluated.filter(item => item.distance <= parseFloat(radiusFilter));
    }

    const { sorted, passesLog } = radixSortStations(evaluated);
    const listContainer = document.getElementById('stationList')!;
    listContainer.innerHTML = '';

    if (sorted.length === 0) {
        listContainer.innerHTML = `<p class="placeholder-text">No stations found within the selected radius.</p>`;
        return;
    }

    sorted.forEach((item, index) => {
        const diff = item.selectedPrice - item.station.previousPrices[fuelType];
        const trendHTML = diff > 0 ? `<span class="trend-up">▲ +₱${(diff/100).toFixed(2)}</span>` : diff < 0 ? `<span class="trend-down">▼ -₱${(Math.abs(diff)/100).toFixed(2)}</span>` : `<span style="color:gray;">• No change</span>`;
        
        const card = document.createElement('div');
        card.className = `station-card ${index === 0 ? 'rank-1' : ''}`;
        card.innerHTML = `
            <div class="station-info">
                <h3>#${index + 1} ${item.station.name}</h3>
                <p class="station-meta">${item.station.address} • <strong>${item.distance.toFixed(2)} km</strong></p>
                <p class="station-meta">Price: ₱${(item.selectedPrice/100).toFixed(2)}/L | ${trendHTML}</p>
            </div>
            <div class="station-cost">
                <div class="cost-val">₱${(item.trueCost/100).toFixed(2)}</div>
                <small style="color:gray;">True Cost (${liters}L)</small>
            </div>
        `;
        listContainer.appendChild(card);
    });

    const visContainer = document.getElementById('visualizerPasses')!;
    visContainer.innerHTML = '';
    passesLog.forEach(p => {
        let gridHTML = `<div class="buckets-grid">`;
        p.buckets.forEach((b, bIdx) => { gridHTML += `<div class="bucket"><div class="bucket-title">${bIdx}</div><div style="font-size:10px;">${b.join(', ') || '-'}</div></div>`; });
        gridHTML += `</div>`;
        const passDiv = document.createElement('div');
        passDiv.className = 'pass-box';
        passDiv.innerHTML = `<strong>Pass ${p.pass}</strong>` + gridHTML;
        visContainer.appendChild(passDiv);
    });

    document.getElementById('sortStatus')!.innerText = `Sorted via Radix (${sorted.length} stations)`;
}

document.getElementById('sortBtn')?.addEventListener('click', runSimulation);
document.getElementById('locBtn')?.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            userLat = pos.coords.latitude;
            userLng = pos.coords.longitude;
            alert("Location updated to your current browser position!");
            runSimulation();
        }, () => alert("Location denied. Using default Mercedes location."));
    }
});
window.addEventListener('DOMContentLoaded', runSimulation);
