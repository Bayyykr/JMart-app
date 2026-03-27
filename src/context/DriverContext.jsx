import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './authContext';
import io from 'socket.io-client';

const DriverContext = createContext();
const socket = io('');

export const useDriver = () => {
    const context = useContext(DriverContext);
    if (!context) {
        throw new Error('useDriver must be used within a DriverProvider');
    }
    return context;
};

export const DriverProvider = ({ children }) => {
    const { user } = useAuth();
    const [isOnline, setIsOnline] = useState(false);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState({ lat: null, lng: null });
    const watchIdRef = useRef(null);

    const fetchStatus = async () => {
        try {
            const res = await api.get('/driver/status');
            const prof = res.data.profile;
            setProfile(prof);
            setIsOnline(prof?.is_online || false);
            if (prof?.latitude && prof?.longitude) {
                setLocation({ lat: prof.latitude, lng: prof.longitude });
            }
        } catch (err) {
            console.error("Error fetching driver status:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'driver') {
            fetchStatus();
        }
    }, [user]);

    const reverseGeocode = async (lat, lng) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                { headers: { 'Accept-Language': 'id' } }
            );
            const data = await response.json();
            const addr = data.address;
            const primaryKecamatan = addr.subdistrict || addr.city_district || addr.town || addr.municipality || addr.district || '';
            const fallbackKecamatan = addr.subdivision || addr.village_district || addr.neighbourhood || addr.suburb || addr.village || addr.hamlet || '';
            const kecamatanName = primaryKecamatan || fallbackKecamatan;
            const kabupaten = addr.city || addr.county || addr.regency || addr.state_district || '';
            const kabupatenName = kabupaten.replace(/kabupaten\s*/i, '').trim() || addr.state || '';
            return kecamatanName && kabupatenName ? `${kecamatanName}, ${kabupatenName}` : (kecamatanName || kabupatenName || 'Area Terdeteksi');
        } catch {
            return 'Area Terdeteksi';
        }
    };

    const toggleOnline = async () => {
        try {
            const newStatus = !isOnline;
            setIsOnline(newStatus);

            if (newStatus) {
                // Initial Online Emit
                socket.emit('driver_online', {
                    userId: user.id,
                    name: user.name,
                    vehicle_plate: profile?.vehicle_plate,
                    vehicle_model: profile?.vehicle_model,
                    profile_image: user?.profile_image_url,
                    rating: profile?.rating || 5.0,
                    trips: profile?.total_trips || 0,
                    lat: location.lat || profile?.latitude,
                    lng: location.lng || profile?.longitude,
                    area: profile?.area || 'Area Terdeteksi'
                });

                // Start Geolocation and Sync
                navigator.geolocation.getCurrentPosition(async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    const areaName = await reverseGeocode(latitude, longitude);
                    setLocation({ lat: latitude, lng: longitude });

                    await api.put('/driver/status', { 
                        is_online: true, 
                        area: areaName,
                        latitude,
                        longitude
                    });

                    socket.emit('update_location', {
                        userId: user.id,
                        lat: latitude,
                        lng: longitude,
                        area: areaName
                    });
                });
            } else {
                await api.put('/driver/status', { is_online: false });
                socket.emit('driver_offline', user.id);
                if (watchIdRef.current) {
                    navigator.geolocation.clearWatch(watchIdRef.current);
                    watchIdRef.current = null;
                }
            }
        } catch (err) {
            console.error("Toggle Online Error:", err);
            setIsOnline(!isOnline);
            alert("Gagal memperbarui status");
        }
    };

    useEffect(() => {
        if (isOnline && navigator.geolocation) {
            watchIdRef.current = navigator.geolocation.watchPosition(async (pos) => {
                const { latitude, longitude } = pos.coords;
                setLocation({ lat: latitude, lng: longitude });
                const areaName = await reverseGeocode(latitude, longitude);
                socket.emit('update_location', {
                    userId: user.id,
                    lat: latitude,
                    lng: longitude,
                    area: areaName
                });
            }, (err) => console.error(err), { enableHighAccuracy: true });
        }
        return () => {
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, [isOnline]);

    const value = {
        isOnline,
        profile,
        loading,
        location,
        toggleOnline,
        refreshProfile: fetchStatus,
        socket
    };

    return (
        <DriverContext.Provider value={value}>
            {children}
        </DriverContext.Provider>
    );
};
