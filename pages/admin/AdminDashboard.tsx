import React, { useState, useEffect } from 'react';
import { storage } from '../../services/storage';
import { Order, OrderStatus } from '../../types';
import { Clock, CheckCircle, Package, Truck } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  const loadOrders = () => {
      setOrders(storage.getOrders());
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = (orderId: string, status: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = status;
        storage.saveOrder(order);
        loadOrders();
    }
  };

  const StatusBadge = ({ status }: { status: OrderStatus }) => {
    const colors = {
        [OrderStatus.PLACED]: 'bg-blue-500/20 text-blue-400',
        [OrderStatus.ACCEPTED]: 'bg-yellow-500/20 text-yellow-400',
        [OrderStatus.READY]: 'bg-cannabis-500/20 text-cannabis-400',
        [OrderStatus.PICKED_UP]: 'bg-gray-700 text-gray-400',
        [OrderStatus.CANCELLED]: 'bg-red-500/20 text-red-400',
    };
    return <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${colors[status]}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Orders</h1>
      
      {/* Kanban-ish List for Mobile/Desktop */}
      <div className="space-y-4">
        {orders.map(order => (
            <div key={order.id} className="bg-dark-800 border border-gray-700 rounded-xl p-4 shadow-sm hover:border-gray-600 transition-colors">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-lg">#{order.id}</span>
                            <StatusBadge status={order.status} />
                        </div>
                        <p className="text-gray-400 text-sm mt-1">{order.customerName} • {order.customerPhone}</p>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-white">${order.total}</div>
                        <div className="text-xs text-gray-500">{new Date(order.timestamp).toLocaleTimeString()}</div>
                    </div>
                </div>

                <div className="border-t border-gray-700 my-3 pt-3 space-y-2">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-gray-300">
                            <span>{item.quantity}x {item.flavor} ({item.selectedWeight.label})</span>
                        </div>
                    ))}
                </div>

                <div className="flex gap-2 mt-4">
                    {order.status === OrderStatus.PLACED && (
                        <button onClick={() => updateStatus(order.id, OrderStatus.ACCEPTED)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium text-sm">
                            Accept Order
                        </button>
                    )}
                    {order.status === OrderStatus.ACCEPTED && (
                        <button onClick={() => updateStatus(order.id, OrderStatus.READY)} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded-lg font-medium text-sm">
                            Mark Ready
                        </button>
                    )}
                    {order.status === OrderStatus.READY && (
                        <button onClick={() => updateStatus(order.id, OrderStatus.PICKED_UP)} className="flex-1 bg-cannabis-600 hover:bg-cannabis-500 text-white py-2 rounded-lg font-medium text-sm">
                            Complete (Picked Up)
                        </button>
                    )}
                     {order.status !== OrderStatus.PICKED_UP && order.status !== OrderStatus.CANCELLED && (
                         <button onClick={() => updateStatus(order.id, OrderStatus.CANCELLED)} className="px-3 py-2 bg-dark-700 text-red-400 rounded-lg hover:bg-dark-600 text-sm">X</button>
                     )}
                </div>
            </div>
        ))}

        {orders.length === 0 && (
            <div className="text-center py-20 text-gray-500">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No active orders.</p>
            </div>
        )}
      </div>
    </div>
  );
};