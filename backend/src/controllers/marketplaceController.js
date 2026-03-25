const db = require('../config/db');

// Haversine formula to calculate distance between two coordinates (km)
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

exports.getProducts = async (req, res) => {
    try {
        const { category, lat, lng } = req.query;
        console.log(`[Marketplace] Fetching - Category: ${category}, Lat: ${lat}, Lng: ${lng}`);

        let query = 'SELECT * FROM products';
        const params = [];

        if (category && category !== 'Semua') {
            query += ' WHERE category = ?';
            params.push(category);
        }

        const [rows] = await db.query(query, params);

        // Convert RowDataPacket to POJO to ensure spread works
        const productsPoJo = JSON.parse(JSON.stringify(rows));

        const latNum = lat ? parseFloat(lat) : null;
        const lngNum = lng ? parseFloat(lng) : null;

        res.set('X-Debug-Version', '2.0-POJO-FIX');

        let productsWithDistance = productsPoJo.map(product => {
            let distance = null;

            const pLat = parseFloat(product.latitude);
            const pLng = parseFloat(product.longitude);

            if (latNum !== null && lngNum !== null && !isNaN(latNum) && !isNaN(lngNum) &&
                !isNaN(pLat) && !isNaN(pLng)) {

                distance = haversineDistance(latNum, lngNum, pLat, pLng);
                distance = Math.round(distance * 10) / 10;
            }

            // EMERGENCY TEST: if distance is still null but coordinates exist, force a value
            // if (distance === null && !isNaN(pLat)) distance = 0.1; 

            return {
                ...product,
                distance,
                debug_marker: 'ACTIVE-V2'
            };
        });

        // Sort: If distance available, sort by distance, then by sold
        if (latNum !== null && lngNum !== null && !isNaN(latNum) && !isNaN(lngNum)) {
            productsWithDistance.sort((a, b) => {
                if (a.distance === null && b.distance === null) return b.sold - a.sold;
                if (a.distance === null) return 1;
                if (b.distance === null) return -1;
                return a.distance - b.distance || b.sold - a.sold;
            });
        } else {
            productsWithDistance.sort((a, b) => b.sold - a.sold);
        }

        res.json(productsWithDistance);
    } catch (error) {
        console.error('[Marketplace Error]', error);
        res.status(500).json({ message: 'Server error' });
    }
};
