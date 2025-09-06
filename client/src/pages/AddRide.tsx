import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, Car, MapPin, Clock, DollarSign, Calendar, FileText } from 'lucide-react';

interface RideFormData {
  app_name: 'uber' | 'lyft' | 'didi';
  pickup_location: string;
  destination: string;
  distance_km?: number;
  duration_minutes: number;
  cost_usd?: number;
  cost_clp?: number;
  currency: 'usd' | 'clp';
  ride_date: string;
  notes?: string;
}

const AddRide: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<RideFormData>({
    defaultValues: {
      app_name: 'uber',
      ride_date: new Date().toISOString().split('T')[0],
      currency: 'usd'
    }
  });

  const watchedDistance = watch('distance_km');
  const watchedDuration = watch('duration_minutes');
  const watchedAppName = watch('app_name');
  const watchedCurrency = watch('currency');
  const watchedCostUsd = watch('cost_usd');
  const watchedCostClp = watch('cost_clp');

  // Fetch exchange rate on component mount
  useEffect(() => {
    const fetchExchangeRate = async () => {
      setRateLoading(true);
      try {
        const rateInfo = await api.getExchangeRate();
        setExchangeRate(rateInfo.rate);
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
        // Fallback to approximate rate
        setExchangeRate(900);
      } finally {
        setRateLoading(false);
      }
    };

    fetchExchangeRate();
  }, []);

  const onSubmit = async (data: RideFormData) => {
    setLoading(true);
    setError('');

    try {
      await api.createRide({
        ...data,
        distance_km: data.distance_km || 0,
        ride_date: new Date(data.ride_date).toISOString()
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add ride');
    } finally {
      setLoading(false);
    }
  };

  const appOptions = [
    { value: 'uber', label: 'Uber', color: '#000000' },
    { value: 'lyft', label: 'Lyft', color: '#FF00BF' },
    { value: 'didi', label: 'Didi', color: '#FF6B35' }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Ride</h1>
          <p className="text-gray-600">Record your ride details and expenses</p>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* App Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Car className="inline h-4 w-4 mr-2" />
              Ride Service
            </label>
            <div className="grid grid-cols-3 gap-3">
              {appOptions.map((app) => (
                <label key={app.value} className="relative">
                  <input
                    type="radio"
                    value={app.value}
                    {...register('app_name', { required: 'Please select a ride service' })}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    errors.app_name 
                      ? 'border-red-300 bg-red-50' 
                      : watchedAppName === app.value
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-center space-x-2">
                      <div 
                        className={`w-3 h-3 rounded-full ${watchedAppName === app.value ? 'ring-2 ring-white ring-offset-1' : ''}`}
                        style={{ backgroundColor: app.color }}
                      />
                      <span className={`font-medium ${watchedAppName === app.value ? 'text-primary-700' : 'text-gray-900'}`}>
                        {app.label}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.app_name && (
              <p className="mt-1 text-sm text-red-600">{errors.app_name.message}</p>
            )}
          </div>

          {/* Location Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="pickup_location" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-2" />
                Pickup Location
              </label>
              <input
                type="text"
                id="pickup_location"
                {...register('pickup_location', { 
                  required: 'Pickup location is required',
                  minLength: { value: 2, message: 'Location must be at least 2 characters' }
                })}
                className={`input-field ${errors.pickup_location ? 'border-red-300' : ''}`}
                placeholder="Where did you start?"
              />
              {errors.pickup_location && (
                <p className="mt-1 text-sm text-red-600">{errors.pickup_location.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-2" />
                Destination
              </label>
              <input
                type="text"
                id="destination"
                {...register('destination', { 
                  required: 'Destination is required',
                  minLength: { value: 2, message: 'Destination must be at least 2 characters' }
                })}
                className={`input-field ${errors.destination ? 'border-red-300' : ''}`}
                placeholder="Where did you go?"
              />
              {errors.destination && (
                <p className="mt-1 text-sm text-red-600">{errors.destination.message}</p>
              )}
            </div>
          </div>

          {/* Distance and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="distance_km" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-2" />
                Distance (km) <span className="text-gray-500 text-sm">(Optional)</span>
              </label>
              <input
                type="number"
                id="distance_km"
                step="0.1"
                min="0"
                {...register('distance_km', { 
                  min: { value: 0.1, message: 'Distance must be greater than 0' }
                })}
                className={`input-field ${errors.distance_km ? 'border-red-300' : ''}`}
                placeholder="0.0"
              />
              {errors.distance_km && (
                <p className="mt-1 text-sm text-red-600">{errors.distance_km.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-2" />
                Duration (minutes)
              </label>
              <input
                type="number"
                id="duration_minutes"
                min="1"
                {...register('duration_minutes', { 
                  required: 'Duration is required',
                  min: { value: 1, message: 'Duration must be at least 1 minute' }
                })}
                className={`input-field ${errors.duration_minutes ? 'border-red-300' : ''}`}
                placeholder="0"
              />
              {errors.duration_minutes && (
                <p className="mt-1 text-sm text-red-600">{errors.duration_minutes.message}</p>
              )}
            </div>
          </div>

          {/* Currency Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <DollarSign className="inline h-4 w-4 mr-2" />
              Currency
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="relative">
                <input
                  type="radio"
                  value="usd"
                  {...register('currency', { required: 'Please select a currency' })}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  errors.currency 
                    ? 'border-red-300 bg-red-50' 
                    : watchedCurrency === 'usd'
                      ? 'border-primary-500 bg-primary-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}>
                  <div className="flex items-center justify-center space-x-2">
                    <span className={`font-medium ${watchedCurrency === 'usd' ? 'text-primary-700' : 'text-gray-900'}`}>
                      USD ($)
                    </span>
                  </div>
                </div>
              </label>
              <label className="relative">
                <input
                  type="radio"
                  value="clp"
                  {...register('currency', { required: 'Please select a currency' })}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  errors.currency 
                    ? 'border-red-300 bg-red-50' 
                    : watchedCurrency === 'clp'
                      ? 'border-primary-500 bg-primary-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}>
                  <div className="flex items-center justify-center space-x-2">
                    <span className={`font-medium ${watchedCurrency === 'clp' ? 'text-primary-700' : 'text-gray-900'}`}>
                      CLP ($)
                    </span>
                  </div>
                </div>
              </label>
            </div>
            {errors.currency && (
              <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>
            )}
          </div>

          {/* Cost and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor={watchedCurrency === 'usd' ? 'cost_usd' : 'cost_clp'} className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline h-4 w-4 mr-2" />
                Cost ({watchedCurrency === 'usd' ? 'USD' : 'CLP'})
              </label>
              {watchedCurrency === 'usd' ? (
                <input
                  type="number"
                  id="cost_usd"
                  step="0.01"
                  min="0"
                  {...register('cost_usd', { 
                    required: 'Cost is required',
                    min: { value: 0.01, message: 'Cost must be greater than 0' }
                  })}
                  className={`input-field ${errors.cost_usd ? 'border-red-300' : ''}`}
                  placeholder="0.00"
                />
              ) : (
                <input
                  type="number"
                  id="cost_clp"
                  step="1"
                  min="0"
                  {...register('cost_clp', { 
                    required: 'Cost is required',
                    min: { value: 1, message: 'Cost must be greater than 0' }
                  })}
                  className={`input-field ${errors.cost_clp ? 'border-red-300' : ''}`}
                  placeholder="0"
                />
              )}
              {errors.cost_usd && (
                <p className="mt-1 text-sm text-red-600">{errors.cost_usd.message}</p>
              )}
              {errors.cost_clp && (
                <p className="mt-1 text-sm text-red-600">{errors.cost_clp.message}</p>
              )}
              {/* Show conversion preview */}
              {watchedCurrency === 'clp' && watchedCostClp && exchangeRate && (
                <p className="mt-1 text-sm text-gray-600">
                  ≈ ${(watchedCostClp / exchangeRate).toFixed(2)} USD
                  {rateLoading && <span className="ml-1 text-blue-500">(loading rate...)</span>}
                </p>
              )}
              {watchedCurrency === 'usd' && watchedCostUsd && exchangeRate && (
                <p className="mt-1 text-sm text-gray-600">
                  ≈ ${(watchedCostUsd * exchangeRate).toFixed(0)} CLP
                  {rateLoading && <span className="ml-1 text-blue-500">(loading rate...)</span>}
                </p>
              )}
              {exchangeRate && (
                <p className="mt-1 text-xs text-gray-500">
                  Current rate: 1 USD = {exchangeRate.toFixed(0)} CLP
                </p>
              )}
            </div>

            <div>
              <label htmlFor="ride_date" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-2" />
                Date
              </label>
              <input
                type="date"
                id="ride_date"
                {...register('ride_date', { required: 'Date is required' })}
                className={`input-field ${errors.ride_date ? 'border-red-300' : ''}`}
              />
              {errors.ride_date && (
                <p className="mt-1 text-sm text-red-600">{errors.ride_date.message}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline h-4 w-4 mr-2" />
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              {...register('notes')}
              className="input-field resize-none"
              placeholder="Any additional notes about this ride..."
            />
          </div>

          {/* Estimated Cost Helper */}
          {watchedDuration && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Cost Estimation Helper</h4>
              {watchedDistance ? (
                <p className="text-sm text-blue-700">
                  Based on {watchedDistance} km and {watchedDuration} minutes, typical costs range from:
                </p>
              ) : (
                <p className="text-sm text-blue-700">
                  Based on {watchedDuration} minutes duration, typical costs range from:
                </p>
              )}
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                {watchedDistance ? (
                  <>
                    <li>• Uber: ${(watchedDistance * 1.5 + watchedDuration * 0.3).toFixed(2)} - ${(watchedDistance * 2.5 + watchedDuration * 0.5).toFixed(2)}</li>
                    <li>• Lyft: ${(watchedDistance * 1.4 + watchedDuration * 0.3).toFixed(2)} - ${(watchedDistance * 2.3 + watchedDuration * 0.5).toFixed(2)}</li>
                    <li>• Didi: ${(watchedDistance * 1.2 + watchedDuration * 0.2).toFixed(2)} - ${(watchedDistance * 2.0 + watchedDuration * 0.4).toFixed(2)}</li>
                  </>
                ) : (
                  <>
                    <li>• Uber: ${(watchedDuration * 0.3).toFixed(2)} - ${(watchedDuration * 0.5).toFixed(2)}</li>
                    <li>• Lyft: ${(watchedDuration * 0.3).toFixed(2)} - ${(watchedDuration * 0.5).toFixed(2)}</li>
                    <li>• Didi: ${(watchedDuration * 0.2).toFixed(2)} - ${(watchedDuration * 0.4).toFixed(2)}</li>
                  </>
                )}
              </ul>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 bg-gray-50 p-4 rounded-lg">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-secondary min-w-[80px]"
              style={{
                backgroundColor: '#e5e7eb',
                color: '#374151',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => reset()}
              className="btn-secondary min-w-[80px]"
              style={{
                backgroundColor: '#e5e7eb',
                color: '#374151',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
              style={{
                backgroundColor: loading ? '#9ca3af' : '#2563eb',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Adding Ride...' : 'Add Ride'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRide;
