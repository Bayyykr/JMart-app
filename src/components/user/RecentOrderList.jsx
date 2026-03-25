import React, { useState, useEffect } from 'react';
import { Car, ShoppingBag, Store, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const getOrderIcon = (type) => {
  switch (type) {
    case 'Antar Jemput': return <Car size={20} />;
    case 'Jasa Titip': return <ShoppingBag size={20} />;
    case 'Marketplace': return <Store size={20} />;
    default: return <Package size={20} />;
  }
};

const RecentOrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        const response = await api.get('/user/dashboard/recent-orders');
        setOrders(response.data);
      } catch (error) {
        console.error("Error fetching recent orders:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecentOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Selesai': return 'bg-green-50 text-green-600';
      case 'Dalam Perjalanan': return 'bg-blue-50 text-blue-600';
      case 'Diproses': return 'bg-orange-50 text-orange-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-gray-800">Order Terbaru</h2>
        <button
          onClick={() => navigate('/user/order')}
          className="text-gray-500 font-semibold hover:text-gray-800 transition-colors"
        >
          Lihat Semua
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between py-4 border-b border-gray-100 px-2 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-gray-200 rounded-xl"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : orders.length > 0 ? (
          orders.map((order, index) => {
            const dateStr = order.orderDate ? new Date(order.orderDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Hari ini';
            return (
              <div key={index} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors px-2 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl text-gray-500">
                    {getOrderIcon(order.type)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{order.id} — {order.type}</h4>
                    <p className="text-xs text-gray-400 font-medium">{dateStr}</p>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                  {order.status}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 text-sm py-4">Belum ada order terbaru.</p>
        )}
      </div>
    </div>
  );
};

export default RecentOrderList;
