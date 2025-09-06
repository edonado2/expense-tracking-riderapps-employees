import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  DollarSign, 
  Car, 
  TrendingUp, 
  Building,
  Eye,
  BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SpendingSummary {
  user_id: number;
  name: string;
  email: string;
  department?: string;
  total_rides: number;
  total_cost: number;
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

const AdminSpending: React.FC = () => {
  const navigate = useNavigate();
  const [spendingData, setSpendingData] = useState<SpendingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<SpendingSummary | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  useEffect(() => {
    fetchSpendingData();
  }, []);

  const fetchSpendingData = async () => {
    try {
      const data = await api.getSpendingData();
      setSpendingData(data);
    } catch (error) {
      console.error('Error fetching spending data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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

  const handleViewDetails = (user: SpendingSummary) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const handleViewMonthlySpending = (userId: number) => {
    navigate(`/admin/spending/${userId}/monthly`);
  };

  const handleCloseDetails = () => {
    setShowUserDetails(false);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Calculate totals
  const totalSpending = spendingData.reduce((sum, user) => sum + user.total_cost, 0);
  const totalRides = spendingData.reduce((sum, user) => sum + user.total_rides, 0);
  const avgSpendingPerUser = spendingData.length > 0 ? totalSpending / spendingData.length : 0;

  // Prepare chart data
  const userSpendingChart = spendingData
    .sort((a, b) => b.total_cost - a.total_cost)
    .slice(0, 10)
    .map(user => ({
      name: user.name || 'Unknown User',
      cost: user.total_cost,
      rides: user.total_rides
    }));

  const departmentData = spendingData.reduce((acc, user) => {
    const dept = user.department || 'No Department';
    if (!acc[dept]) {
      acc[dept] = { cost: 0, rides: 0, users: 0 };
    }
    acc[dept].cost += user.total_cost;
    acc[dept].rides += user.total_rides;
    acc[dept].users += 1;
    return acc;
  }, {} as Record<string, { cost: number; rides: number; users: number }>);

  const departmentChart = Object.entries(departmentData).map(([dept, data]) => ({
    name: dept,
    cost: data.cost,
    rides: data.rides,
    users: data.users
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Spending Reports</h1>
        <p className="text-gray-600">Detailed analysis of employee ride spending</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Company Spending</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpending)}</p>
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
              <p className="text-2xl font-bold text-gray-900">{totalRides.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. per Employee</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(avgSpendingPerUser)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Spenders */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Top Spenders</h3>
          </div>
          {userSpendingChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userSpendingChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="cost" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No spending data available
            </div>
          )}
        </div>

        {/* Department Spending */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Department Spending</h3>
          </div>
          {departmentChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="cost"
                >
                  {departmentChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No department data available
            </div>
          )}
        </div>
      </div>

      {/* Employee Spending Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Employee Spending Details</h3>
        </div>
        {spendingData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Rides
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spending
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
                {spendingData
                  .sort((a, b) => b.total_cost - a.total_cost)
                  .map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Building className="h-3 w-3 mr-1 text-gray-400" />
                        {user.department || 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.total_rides.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(user.total_cost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-1">
                        {Object.entries(user.rides_by_app).map(([app, data]) => (
                          data.count > 0 && (
                            <div key={app} className="flex items-center">
                              <div 
                                className="w-2 h-2 rounded-full mr-1"
                                style={{ backgroundColor: getAppColor(app) }}
                              />
                              <span className="text-xs text-gray-600">
                                {data.count}
                              </span>
                            </div>
                          )
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="text-primary-600 hover:text-primary-900 flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </button>
                        <button
                          onClick={() => handleViewMonthlySpending(user.user_id)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Monthly
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No spending data</h3>
            <p className="mt-1 text-sm text-gray-500">Spending data will appear here once employees start adding rides.</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCloseDetails} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedUser.name} - Spending Details
                  </h3>
                  <button
                    onClick={handleCloseDetails}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedUser.total_cost)}</p>
                    <p className="text-sm text-gray-600">Total Spending</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Car className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{selectedUser.total_rides.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total Rides</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Building className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-lg font-bold text-gray-900">{selectedUser.department || 'No Department'}</p>
                    <p className="text-sm text-gray-600">Department</p>
                  </div>
                </div>

                {/* App Usage Breakdown */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">App Usage Breakdown</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(selectedUser.rides_by_app).map(([app, data]) => (
                      <div key={app} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center mb-2">
                          <div 
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: getAppColor(app) }}
                          />
                          <h5 className="font-medium text-gray-900">{getAppName(app)}</h5>
                        </div>
                        <p className="text-sm text-gray-600">Rides: {data.count}</p>
                        <p className="text-sm text-gray-600">Cost: {formatCurrency(data.cost)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monthly Breakdown */}
                {selectedUser.monthly_breakdown.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Monthly Spending</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={selectedUser.monthly_breakdown.slice(0, 6).reverse()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="cost" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSpending;
