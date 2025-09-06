import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  ArrowLeft,
  Calendar,
  DollarSign,
  Car,
  TrendingUp,
  TrendingDown,
  BarChart3,
  MapPin,
  Clock
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

interface MonthlyData {
  month: string;
  year: string;
  month_num: string;
  total_rides: number;
  total_cost: number;
  avg_cost_per_ride: number;
  uber_rides: number;
  uber_cost: number;
  lyft_rides: number;
  lyft_cost: number;
  didi_rides: number;
  didi_cost: number;
}

interface RecentRide {
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
  month: string;
}

interface UserMonthlySpendingData {
  user: {
    id: number;
    name: string;
    department: string;
  };
  monthly_breakdown: MonthlyData[];
  recent_rides: RecentRide[];
}

const UserMonthlySpending: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<UserMonthlySpendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const fetchMonthlySpendingData = useCallback(async () => {
    try {
      const response = await api.getUserMonthlySpending(parseInt(userId!));
      setData(response);
      if (response.monthly_breakdown.length > 0) {
        setSelectedMonth(response.monthly_breakdown[0].month);
      }
    } catch (error) {
      console.error('Error fetching monthly spending data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchMonthlySpendingData();
    }
  }, [userId, fetchMonthlySpendingData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString + '-01').toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return dateString;
    }
  };

  const formatRideDate = (dateString: string) => {
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

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const { user, monthly_breakdown, recent_rides } = data;

  // Calculate trends
  const currentMonth = monthly_breakdown[0];
  const previousMonth = monthly_breakdown[1];
  const costTrend = previousMonth ? 
    ((currentMonth.total_cost - previousMonth.total_cost) / previousMonth.total_cost * 100) : 0;
  const ridesTrend = previousMonth ? 
    ((currentMonth.total_rides - previousMonth.total_rides) / previousMonth.total_rides * 100) : 0;

  // Prepare chart data
  const monthlyChartData = monthly_breakdown.slice(0, 12).reverse().map(month => ({
    month: formatDate(month.month),
    cost: month.total_cost,
    rides: month.total_rides,
    avgCost: month.avg_cost_per_ride
  }));

  const appUsageData = [
    { name: 'Uber', value: currentMonth.uber_cost, rides: currentMonth.uber_rides, color: getAppColor('uber') },
    { name: 'Lyft', value: currentMonth.lyft_cost, rides: currentMonth.lyft_rides, color: getAppColor('lyft') },
    { name: 'Didi', value: currentMonth.didi_cost, rides: currentMonth.didi_rides, color: getAppColor('didi') }
  ].filter(app => app.value > 0);

  const selectedMonthData = selectedMonth ? 
    monthly_breakdown.find(m => m.month === selectedMonth) : null;

  const selectedMonthRides = selectedMonth ? 
    recent_rides.filter(ride => ride.month === selectedMonth) : [];



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/spending')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Spending Reports
          </button>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-gray-600">{user.department}</p>
        </div>
      </div>

      {/* Current Month Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentMonth.total_cost)}</p>
              {costTrend !== 0 && (
                <div className={`flex items-center text-sm ${costTrend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {costTrend > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {Math.abs(costTrend).toFixed(1)}% vs last month
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Car className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Rides</p>
              <p className="text-2xl font-bold text-gray-900">{currentMonth.total_rides.toLocaleString()}</p>
              {ridesTrend !== 0 && (
                <div className={`flex items-center text-sm ${ridesTrend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {ridesTrend > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {Math.abs(ridesTrend).toFixed(1)}% vs last month
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Cost/Ride</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentMonth.avg_cost_per_ride)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Months Tracked</p>
              <p className="text-2xl font-bold text-gray-900">{monthly_breakdown.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spending Trend */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Spending Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Line type="monotone" dataKey="cost" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* App Usage This Month */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">App Usage This Month</h3>
          </div>
          {appUsageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={appUsageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {appUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </RechartsPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No app usage data for this month
            </div>
          )}
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Rides
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Cost/Ride
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  App Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthly_breakdown.map((month) => (
                <tr key={month.month} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatDate(month.month)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {month.total_rides}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(month.total_cost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(month.avg_cost_per_ride)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {month.uber_rides > 0 && (
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-black mr-1" />
                          <span className="text-xs text-gray-600">{month.uber_rides}</span>
                        </div>
                      )}
                      {month.lyft_rides > 0 && (
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-pink-500 mr-1" />
                          <span className="text-xs text-gray-600">{month.lyft_rides}</span>
                        </div>
                      )}
                      {month.didi_rides > 0 && (
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-orange-500 mr-1" />
                          <span className="text-xs text-gray-600">{month.didi_rides}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedMonth(month.month)}
                      className={`px-3 py-1 rounded-full text-xs ${
                        selectedMonth === month.month
                          ? 'bg-primary-100 text-primary-800'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>



      {/* Selected Month Details */}
      {selectedMonth && selectedMonthData && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">
              {formatDate(selectedMonth)} - Detailed Breakdown
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{selectedMonthData ? formatCurrency(selectedMonthData.total_cost) : 'N/A'}</p>
              <p className="text-sm text-gray-600">Total Spending</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Car className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{selectedMonthData ? selectedMonthData.total_rides : 'N/A'}</p>
              <p className="text-sm text-gray-600">Total Rides</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{selectedMonthData ? formatCurrency(selectedMonthData.avg_cost_per_ride) : 'N/A'}</p>
              <p className="text-sm text-gray-600">Avg. Cost/Ride</p>
            </div>
          </div>

          {/* App Breakdown for Selected Month */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">App Usage Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedMonthData ? [
                { name: 'Uber', rides: selectedMonthData.uber_rides, cost: selectedMonthData.uber_cost, color: '#000000' },
                { name: 'Lyft', rides: selectedMonthData.lyft_rides, cost: selectedMonthData.lyft_cost, color: '#FF00BF' },
                { name: 'Didi', rides: selectedMonthData.didi_rides, cost: selectedMonthData.didi_cost, color: '#FF6B35' }
              ].filter(app => app.rides > 0).map((app) => (
                <div key={app.name} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div 
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: app.color }}
                    />
                    <h5 className="font-medium text-gray-900">{app.name}</h5>
                  </div>
                  <p className="text-sm text-gray-600">Rides: {app.rides}</p>
                  <p className="text-sm text-gray-600">Cost: {formatCurrency(app.cost)}</p>
                </div>
              )) : (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  No app usage data available
                </div>
              )}
            </div>
          </div>

          {/* Individual Rides for Selected Month */}
          {selectedMonthRides && selectedMonthRides.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Individual Rides</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        App
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Route
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Distance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedMonthRides.map((ride) => (
                      <tr key={ride.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatRideDate(ride.ride_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: getAppColor(ride.app_name) }}
                            />
                            <span className="text-sm text-gray-900">{getAppName(ride.app_name)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="truncate max-w-xs">
                              {ride.pickup_location} → {ride.destination}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ride.distance_km ? `${ride.distance_km} km` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-gray-400" />
                            {ride.duration_minutes} min
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(ride.cost_usd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}


    </div>
  );
};

export default UserMonthlySpending;
