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
        const { category, lat, lng, regency } = req.query;
        console.log(`[Marketplace] Fetching - Category: ${category}, Lat: ${lat}, Lng: ${lng}, Regency: ${regency}`);

        let query = `
            SELECT p.*, mp.latitude as merchant_lat, mp.longitude as merchant_lng, mp.city
            FROM products p
            JOIN merchant_profiles mp ON p.seller_id = mp.user_id
            WHERE p.is_active = 1 AND mp.status = 'verified'
        `;
        const params = [];

        if (category && category !== 'Semua') {
            query += ' AND p.category = ?';
            params.push(category);
        }

        // Filter by regency (Kabupaten/Kota) if provided
        // We make this STRICT on mp.city to avoid showing products from other regencies
        if (regency && regency.trim() && regency.toLowerCase() !== 'undefined') {
            const cleanRegency = regency.trim();
            query += ' AND (mp.city LIKE ? OR mp.full_address LIKE ?)'; 
            params.push(`%${cleanRegency}%`, `%${cleanRegency}%`);
        }

        const [rows] = await db.query(query, params);
        const productsPoJo = JSON.parse(JSON.stringify(rows));

        const latNum = lat ? parseFloat(lat) : null;
        const lngNum = lng ? parseFloat(lng) : null;

        let productsWithDistance = productsPoJo.map(product => {
            let distance = null;

            // Use the joined static merchant location
            const pLat = parseFloat(product.merchant_lat);
            const pLng = parseFloat(product.merchant_lng);

            if (latNum !== null && lngNum !== null && !isNaN(latNum) && !isNaN(lngNum) &&
                !isNaN(pLat) && !isNaN(pLng)) {

                distance = haversineDistance(latNum, lngNum, pLat, pLng);
                distance = Math.round(distance * 10) / 10;
            }

            return {
                ...product,
                distance,
                debug_marker: 'V2-STRICT'
            };
        });

        // Sort: Distance ASC, then Sold DESC
        productsWithDistance.sort((a, b) => {
            const distA = (a.distance === null || a.distance === undefined) ? 1000000 : a.distance;
            const distB = (b.distance === null || b.distance === undefined) ? 1000000 : b.distance;

            if (distA !== distB) return distA - distB;
            return b.sold - a.sold;
        });

        console.log(`[Marketplace] Returning ${productsWithDistance.length} products`);
        res.json(productsWithDistance);
    } catch (error) {
        console.error('[Marketplace Error]', error);
        res.status(500).json({ message: 'Server error' });
    }
};
