import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const LocationContext = createContext();

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};

export const LocationProvider = ({ children }) => {
    const [userLocation, setUserLocation] = useState(null);
    const [userAreaName, setUserAreaName] = useState('');
    const [userRegency, setUserRegency] = useState(''); // Kabupaten
    const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, granted, denied, unavailable
    const [isManual, setIsManual] = useState(false);
    const watchIdRef = useRef(null);

    const reverseGeocode = async (lat, lng) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
                { headers: { 'Accept-Language': 'id' } }
            );
            const data = await response.json();
            const addr = data.address;
            
            const desa = addr.village || addr.suburb || addr.hamlet || addr.neighbourhood || addr.village_district || addr.locality || '';
            const primaryKecamatan = addr.subdistrict || addr.city_district || addr.town || addr.municipality || addr.district || '';
            const fallbackKecamatan = addr.subdivision || addr.village_district || addr.neighbourhood || addr.suburb || addr.village || addr.hamlet || '';
            const kecamatanName = primaryKecamatan || fallbackKecamatan;
            const kabupaten = addr.city || addr.county || addr.regency || addr.state_district || '';
            
            const kabupatenName = kabupaten.replace(/kabupaten\s*/i, '').trim() || addr.state || '';
            
            setUserAreaName(`${kecamatanName}, ${kabupatenName}`);
            setUserRegency(kabupatenName);
            setLocationStatus('granted');
        } catch {
            setUserAreaName('Lokasi Terpilih');
            setLocationStatus('granted'); // Still granted coords, just failed name
        }
    };

    const searchLocation = async (query) => {
        if (!query) return [];
        setLocationStatus('loading');
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
                { headers: { 'Accept-Language': 'id' } }
            );
            const results = await response.json();
            setLocationStatus('idle');
            return results;
        } catch (error) {
            console.error('Search location error:', error);
            setLocationStatus('idle');
            return [];
        }
    };

    const selectLocation = (result) => {
        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        const coords = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        setUserLocation(coords);
        setIsManual(true);
        setLocationStatus('granted');
        
        const addr = result.address;
        const primaryKecamatan = addr.subdistrict || addr.city_district || addr.town || addr.municipality || addr.district || '';
        const fallbackKecamatan = addr.subdivision || addr.village_district || addr.neighbourhood || addr.suburb || addr.village || addr.hamlet || '';
        const kecamatanName = primaryKecamatan || fallbackKecamatan;
        const kabupaten = addr.city || addr.county || addr.regency || addr.state_district || '';

        const kabupatenName = kabupaten.replace(/kabupaten\s*/i, '').trim() || addr.state || '';

        if (kecamatanName && kabupatenName) {
            setUserAreaName(`${kecamatanName}, ${kabupatenName}`);
        } else {
            setUserAreaName(kecamatanName || kabupatenName || 'Area Terpilih');
        }
        setUserRegency(kabupatenName);
    };

    const updateLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setLocationStatus('unavailable');
            return;
        }

        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }

        setIsManual(false);
        setLocationStatus('loading');
        
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
                setUserLocation(coords);
                reverseGeocode(coords.lat, coords.lng);
            },
            (error) => {
                console.warn('Geolocation error:', error.message);
                setLocationStatus('denied');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );

        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const clearWatch = updateLocation();
        return () => {
            if (clearWatch) clearWatch();
        };
    }, [updateLocation]);

    const value = {
        userLocation,
        userAreaName,
        userRegency,
        locationStatus,
        isManual,
        updateLocation,
        searchLocation,
        selectLocation
    };

    return (
        <LocationContext.Provider value={value}>
            {children}
        </LocationContext.Provider>
    );
};
