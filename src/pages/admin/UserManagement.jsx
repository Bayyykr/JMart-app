import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Shield, UserX, UserCheck } from 'lucide-react';
import api from '../../services/api';

const UserManagement = () => {
    const [users, setUsers] = useState([
        { id: 1, name: 'User Satu', email: 'user@jmart.com', role: 'user', createdAt: '2026-03-01' },
        { id: 2, name: 'Driver Satu', email: 'driver@jmart.com', role: 'driver', createdAt: '2026-03-02' },
        { id: 3, name: 'Admin Satu', email: 'admin@jmart.com', role: 'admin', createdAt: '2026-03-03' },
        { id: 4, name: 'Toko Berkah', email: 'berkah@jmart.com', role: 'marketplace', createdAt: '2026-03-10' },
    ]);

    const getRoleBadge = (role) => {
        const styles = {
            admin: 'bg-purple-100 text-purple-700',
            driver: 'bg-orange-100 text-orange-700',
            marketplace: 'bg-green-100 text-green-700',
            user: 'bg-blue-100 text-blue-700'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[role] || 'bg-gray-100 text-gray-700'}`}>
                {role}
            </span>
        );
    };

    return (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Cari nama atau email..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-dark-blue transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-3 bg-gray-50 text-gray-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-100">
                        <Filter size={16} /> Filter
                    </button>
                    <button className="px-6 py-3 bg-brand-dark-blue text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black">
                        Tambah User
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Pengguna</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Role</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Terdaftar</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-brand-dark-blue/5 flex items-center justify-center text-brand-dark-blue font-black">
                                            {user.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-brand-dark-blue">{user.name}</p>
                                            <p className="text-xs text-gray-400">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {getRoleBadge(user.role)}
                                </td>
                                <td className="px-6 py-4 text-xs font-bold text-gray-500">
                                    {user.createdAt}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 text-gray-400 hover:text-brand-dark-blue hover:bg-white rounded-lg transition-all" title="Edit Role">
                                            <Shield size={18} />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all" title="Ban User">
                                            <UserX size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="p-6 border-t border-gray-50">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 font-bold">Menampilkan 1-4 dari 1,540 pengguna</p>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-50 rounded-lg text-xs font-black disabled:opacity-50" disabled>Sebelumnya</button>
                        <button className="px-4 py-2 bg-brand-dark-blue text-white rounded-lg text-xs font-black">Berikutnya</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
