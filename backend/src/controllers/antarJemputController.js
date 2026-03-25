const db = require('../config/db');
const driverStore = require('../utils/driverStore');

// Haversine formula to calculate distance between two coordinates (km)
function haversineDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
}

exports.getDrivers = async (req, res) => {
    try {
        const { lat, lng, area: userArea, regency } = req.query;
        const latNum = lat ? parseFloat(lat) : null;
        const lngNum = lng ? parseFloat(lng) : null;

        // 1. Get Online Drivers (Real-time)
        const onlineDrivers = driverStore.getAll().map(d => {
            const driverArea = (d.area || '').replace(/\s*[,/]\s*/g, ', ');
            const isSameArea = userArea && driverArea.toLowerCase().includes(userArea.toLowerCase().split(',')[0].trim());

            let driverRegency = d.regency || '';
            if (!driverRegency) {
                if (driverArea.toLowerCase().includes('glenmore') || driverArea.toLowerCase().includes('banyuwangi')) driverRegency = 'Banyuwangi';
                else if (driverArea.toLowerCase().includes('jember')) driverRegency = 'Jember';
            }

            const dist = haversineDistance(latNum, lngNum, d.lat, d.lng);

            return {
                ...d,
                distance: dist,
                area: driverArea,
                regency: driverRegency,
                vehicle_info: `${d.vehicle_model} - ${d.vehicle_plate}`
            };
        });

        // 2. Get All Drivers from driver_profiles
        const [rows] = await db.query(`
            SELECT 
                u.name,
                u.profile_image_url as profile_image,
                dp.vehicle_model,
                dp.vehicle_plate,
                dp.rating,
                dp.total_trips as trips,
                dp.status,
                dp.area,
                dp.latitude as lat,
                dp.longitude as lng,
                dp.user_id as id,
                dp.description
            FROM driver_profiles dp 
            JOIN users u ON dp.user_id = u.id 
            WHERE dp.status = 'verified'
        `);

        // 3. Combine & Filter by Regency
        const onlineDriverIdsFromStore = new Set(onlineDrivers.map(d => d.userId || d.id));

        const offlineDrivers = rows
            .filter(dbd => !onlineDriverIdsFromStore.has(dbd.id)) // Filter out drivers already in onlineDrivers
            .map(dbd => {
                const driverArea = (dbd.area || '').replace(/\s*[,/]\s*/g, ', ');
                const isSameArea = userArea && driverArea.toLowerCase().includes(userArea.toLowerCase().split(',')[0].trim());

                // Determine regency from area or description
                let driverRegency = 'Jember';
                if (driverArea.toLowerCase().includes('glenmore') || driverArea.toLowerCase().includes('banyuwangi') || (dbd.description && dbd.description.toLowerCase().includes('banyuwangi'))) {
                    driverRegency = 'Banyuwangi';
                }

                const dist = haversineDistance(latNum, lngNum, dbd.lat, dbd.lng);

                return {
                    ...dbd,
                    id: dbd.id,
                    status: 'Offline',
                    distance: dist,
                    area: driverArea,
                    regency: driverRegency,
                    vehicle_info: `${dbd.vehicle_model} - ${dbd.vehicle_plate}`
                };
            });

        let allDrivers = [...onlineDrivers, ...offlineDrivers];

        // 4. Filtering (Regency + 20km Radius where possible)
        if (latNum && lngNum) {
            allDrivers = allDrivers.filter(d => {
                // If we have distance, use 20km limit
                if (d.distance !== null) return d.distance <= 20;
                
                // If no distance (coords missing), but we have a regency match, keep them
                if (regency && d.regency && d.regency.toLowerCase().includes(regency.toLowerCase())) return true;
                
                // Keep online drivers visible while their async geo finishes fetching to prevent glitch disappearance
                if (d.status === 'Online') return true;
                
                // Otherwise, if no coords and no explicit regency match, hide to avoid cluttering with irrelevant drivers
                return false;
            });
        }

        if (regency) {
            const targetRegency = regency.toLowerCase();
            allDrivers = allDrivers.filter(d =>
                (d.regency && d.regency.toLowerCase().includes(targetRegency)) ||
                (d.area && d.area.toLowerCase().includes(targetRegency))
            );
        }

        // 5. Enhanced Priority Sort
        allDrivers.sort((a, b) => {
            // A. Priority 1: Online Status
            if (a.status === 'Online' && b.status !== 'Online') return -1;
            if (a.status !== 'Online' && b.status === 'Online') return 1;

            // B. Priority 2: Same Area (Sub-district)
            const aSame = userArea && a.area && a.area.toLowerCase().includes(userArea.toLowerCase().split(',')[0].trim());
            const bSame = userArea && b.area && b.area.toLowerCase().includes(userArea.toLowerCase().split(',')[0].trim());
            if (aSame && !bSame) return -1;
            if (!aSame && bSame) return 1;

            // C. Priority 3: Distance
            return a.distance - b.distance;
        });

        res.json({
            success: true,
            drivers: allDrivers
        });
    } catch (error) {
        console.error("GetDrivers Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};
