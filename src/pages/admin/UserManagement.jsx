import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Shield, UserX, UserCheck, ShieldAlert, Award, Store, Users } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;

    useEffect(() => {
        fetchUsers();
    }, [searchQuery, selectedRole]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/admin/users', {
                params: { search: searchQuery, role: selectedRole }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Gagal mengambil data pengguna');
        } finally {
            setIsLoading(false);
        }
    };


    const handleUpdateStatus = async (userId, newStatus) => {
        try {
            await api.put('/admin/user/status', { userId, is_active: newStatus });
            toast.success(`Status pengguna berhasil diubah`);
            fetchUsers();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Gagal mengubah status pengguna');
        }
    };

    const getRoleBadge = (role) => {
        const styles = {
            admin: 'bg-purple-100 text-purple-700 ring-1 ring-purple-200',
            driver: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200',
            marketplace: 'bg-green-100 text-green-700 ring-1 ring-green-200',
            user: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
        };
        return (
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[role] || 'bg-gray-100 text-gray-700'}`}>
                {role}
            </span>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-brand-dark-blue mb-1">Manajemen Pengguna</h2>
                    <p className="text-gray-500 text-sm font-medium">Kelola akses, role, dan status pengguna sistem JMart</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-50 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 overflow-hidden">
                    <div className="relative w-full xl:max-w-sm flex-shrink-0">
                        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Cari nama atau email pengguna..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm focus:ring-0 focus:border-brand-green/20 focus:bg-white transition-all outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-4 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 custom-scrollbar">
                        <div className="flex items-center gap-2 min-w-max">
                            {['', 'user', 'driver', 'marketplace', 'admin'].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setSelectedRole(role)}
                                    className={`px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                        selectedRole === role 
                                        ? 'bg-brand-dark-blue text-white shadow-lg border-brand-dark-blue shadow-brand-dark-blue/20' 
                                        : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'
                                    }`}
                                >
                                    {role === '' ? 'Semua' : role}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identitas Pengguna</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Role</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tanggal Bergabung</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status Akses</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="4" className="px-8 py-6 h-20">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-gray-50"></div>
                                                <div className="space-y-2 flex-1">
                                                    <div className="h-4 bg-gray-50 rounded w-1/3"></div>
                                                    <div className="h-3 bg-gray-50 rounded w-1/4"></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center text-gray-400 font-bold italic">
                                        Tidak ada pengguna dengan kriteria tersebut
                                    </td>
                                </tr>
                            ) : users.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage).map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-brand-dark-blue/5 flex items-center justify-center text-brand-dark-blue font-black text-lg border border-brand-dark-blue/10 group-hover:scale-110 transition-transform">
                                                {user.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-brand-dark-blue">{user.name}</p>
                                                <p className="text-[11px] text-gray-400 font-bold">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getRoleBadge(user.role)}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-gray-500">
                                        {new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-3">
                                            {user.is_active === 0 || user.is_active === false ? (
                                                <button 
                                                    onClick={() => handleUpdateStatus(user.id, true)}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition-all"
                                                >
                                                    <UserCheck size={14} /> Aktifkan
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleUpdateStatus(user.id, false)}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                                                >
                                                    <UserX size={14} /> Nonaktifkan
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="p-6 border-t border-gray-50 bg-white">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.2em] bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                            Menampilkan <span className="text-brand-dark-blue">{Math.min(currentPage * usersPerPage, users.length)}</span> dari <span className="text-brand-dark-blue">{users.length}</span> Pengguna
                        </p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-6 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-30 active:scale-95"
                            >
                                Sebelumnya
                            </button>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(users.length / usersPerPage), p + 1))}
                                disabled={currentPage >= Math.ceil(users.length / usersPerPage) || users.length === 0}
                                className="px-6 py-2 bg-brand-dark-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-brand-dark-blue/20 disabled:opacity-50 active:scale-95"
                            >
                                Berikutnya
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
