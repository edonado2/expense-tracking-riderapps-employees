import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { 
  Car, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  MapPin,
  Clock,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Ride {
  id: number;
  app_name: string;
  pickup_location: string;
  destination: string;
  distance_km?: number;
  duration_minutes: number;
  cost_usd: number;
  cost_clp?: number;
  currency: 'usd' | 'clp';
  ride_date: string;
  notes?: string;
}

interface Summary {
  total_rides: number;
  total_cost: number;
  avg_cost: number;
  rides_by_app: {
    uber: { count: number; cost: number };
    lyft: { count: number; cost: number };
    didi: { count: number; cost: number };
  };
  monthly_breakdown: Array<{
    month: string;
    rides: number;
    cost: number;
  }>;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentRides, setRecentRides] = useState<Ride[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ridesData, summaryData] = await Promise.all([
          api.getRides(),
          api.getRideSummary()
        ]);
        
        setRecentRides(ridesData.slice(0, 5)); // Show only recent 5 rides
        setSummary(summaryData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number, currency: 'USD' | 'CLP' = 'USD') => {
    if (currency === 'CLP') {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatRideCost = (ride: Ride) => {
    if (ride.currency === 'clp' && ride.cost_clp) {
      return (
        <div>
          <span className="font-medium">{formatCurrency(ride.cost_clp, 'CLP')}</span>
          <span className="text-sm text-gray-500 ml-2">({formatCurrency(ride.cost_usd)})</span>
        </div>
      );
    }
    return (
      <div>
        <span className="font-medium">{formatCurrency(ride.cost_usd)}</span>
        {ride.cost_clp && (
          <span className="text-sm text-gray-500 ml-2">({formatCurrency(ride.cost_clp, 'CLP')})</span>
        )}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getAppColor = (appName: string) => {
    switch (appName) {
      case 'uber': return '#000000';
      case 'lyft': return '#FF00BF';
      case 'didi': return '#FF6B35';
      default: return '#6B7280';
    }
  };

  const getAppName = (appName: string) => {
    return appName.charAt(0).toUpperCase() + appName.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Safe data extraction with comprehensive null checks
  const ridesByApp = summary?.rides_by_app || {
    uber: { count: 0, cost: 0 },
    lyft: { count: 0, cost: 0 },
    didi: { count: 0, cost: 0 }
  };
  
  const pieData = [
    { 
      name: 'Uber', 
      value: ridesByApp.uber?.cost || 0, 
      count: ridesByApp.uber?.count || 0, 
      color: getAppColor('uber') 
    },
    { 
      name: 'Lyft', 
      value: ridesByApp.lyft?.cost || 0, 
      count: ridesByApp.lyft?.count || 0, 
      color: getAppColor('lyft') 
    },
    { 
      name: 'Didi', 
      value: ridesByApp.didi?.cost || 0, 
      count: ridesByApp.didi?.count || 0, 
      color: getAppColor('didi') 
    },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600">Here's your ride spending overview</p>
        </div>
        <button
          onClick={() => navigate('/add-ride')}
          className="btn-primary flex items-center justify-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Ride
        </button>
      </div>

      {/* Stats Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Car className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Rides</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total_rides}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_cost)}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Cost</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.avg_cost)}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.monthly_breakdown && summary.monthly_breakdown.length > 0 
                    ? formatCurrency(summary.monthly_breakdown[0].cost)
                    : '$0.00'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* App Usage Pie Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Spending by App</h3>
            </div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No ride data available
              </div>
            )}
          </div>

          {/* Monthly Spending Bar Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Spending</h3>
            </div>
            {summary.monthly_breakdown && summary.monthly_breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summary.monthly_breakdown.slice(0, 6).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="cost" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No monthly data available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Rides */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Recent Rides</h3>
        </div>
        {recentRides.length > 0 ? (
          <div className="space-y-4">
            {recentRides.map((ride) => (
              <div key={ride.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getAppColor(ride.app_name) }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {getAppName(ride.app_name)} • {formatRideCost(ride)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {ride.pickup_location} → {ride.destination}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      {ride.distance_km && (
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {ride.distance_km.toFixed(1)} km
                        </span>
                      )}
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {ride.duration_minutes} min
                      </span>
                      <span>{formatDate(ride.ride_date)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Car className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No rides yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first ride.</p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/add-ride')}
                className="btn-primary flex items-center justify-center mx-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Ride
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
