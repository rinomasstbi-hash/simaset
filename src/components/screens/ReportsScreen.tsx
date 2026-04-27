import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../store/AppContext';
import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear, 
  isWithinInterval, 
  format,
  subWeeks,
  subMonths,
  subYears
} from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { PieChart as PieChartIcon, BarChart3, TrendingUp, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

type PeriodType = 'week' | 'month' | 'year';

export default function ReportsScreen() {
  const { bookings, resources } = useAppContext();
  const [period, setPeriod] = useState<PeriodType>('month');
  const [dateOffset, setDateOffset] = useState(0);

  const stats = useMemo(() => {
    const now = new Date();
    let start, end;

    if (period === 'week') {
      const targetDate = subWeeks(now, dateOffset);
      start = startOfWeek(targetDate, { weekStartsOn: 1 });
      end = endOfWeek(targetDate, { weekStartsOn: 1 });
    } else if (period === 'month') {
      const targetDate = subMonths(now, dateOffset);
      start = startOfMonth(targetDate);
      end = endOfMonth(targetDate);
    } else {
      const targetDate = subYears(now, dateOffset);
      start = startOfYear(targetDate);
      end = endOfYear(targetDate);
    }

    const filteredBookings = bookings.filter(b => {
      const bDate = new Date(b.date);
      const bookingEnd = new Date(`${b.date}T${b.endTime}`);
      return isWithinInterval(bDate, { start, end }) && 
             b.status === 'approved' && 
             bookingEnd < now;
    });

    // Group by resource
    const resourceUsage: Record<string, number> = {};
    filteredBookings.forEach(b => {
      resourceUsage[b.resourceId] = (resourceUsage[b.resourceId] || 0) + 1;
    });

    const chartData = resources.map(r => ({
      name: r.name,
      count: resourceUsage[r.id] || 0,
      type: r.type
    })).sort((a, b) => b.count - a.count);

    // Filter out zero entries for pie chart
    const pieData = chartData.filter(d => d.count > 0);

    return {
      start,
      end,
      totalBookings: filteredBookings.length,
      chartData,
      pieData
    };
  }, [bookings, resources, period, dateOffset]);

  const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a1efce', '#047857', '#064e3b'];

  const getPeriodLabel = () => {
    if (period === 'week') {
      return `${format(stats.start, 'dd MMM')} - ${format(stats.end, 'dd MMM yyyy')}`;
    } else if (period === 'month') {
      return format(stats.start, 'MMMM yyyy', { locale: id });
    } else {
      return format(stats.start, 'yyyy');
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <div className="bg-white px-5 pt-8 pb-4 border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Rekap Pemakaian Aset</h1>
        
        <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
          <button 
            onClick={() => { setPeriod('week'); setDateOffset(0); }}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
              period === 'week' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500"
            )}
          >
            Mingguan
          </button>
          <button 
            onClick={() => { setPeriod('month'); setDateOffset(0); }}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
              period === 'month' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500"
            )}
          >
            Bulanan
          </button>
          <button 
            onClick={() => { setPeriod('year'); setDateOffset(0); }}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
              period === 'year' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500"
            )}
          >
            Tahunan
          </button>
        </div>

        <div className="flex items-center justify-between">
          <button 
            onClick={() => setDateOffset(prev => prev + 1)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-sm font-bold text-gray-700 capitalize">{getPeriodLabel()}</span>
          <button 
            onClick={() => setDateOffset(prev => Math.max(0, prev - 1))}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            disabled={dateOffset === 0}
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6 overflow-y-auto pb-24">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-100 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-emerald-100 text-xs font-medium mb-1 uppercase tracking-wider">Total Pemakaian</p>
              <h3 className="text-3xl font-bold">{stats.totalBookings}</h3>
              <p className="text-emerald-100/80 text-[10px] mt-2 flex items-center">
                <TrendingUp size={12} className="mr-1" />
                Aset berhasil digunakan dalam periode ini
              </p>
            </div>
            <BarChart3 className="absolute -right-4 -bottom-4 w-32 h-32 text-emerald-500/20 rotate-12" />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-800 flex items-center">
              <BarChart3 size={16} className="mr-2 text-emerald-600" />
              Frekuensi Pemakaian
            </h3>
          </div>
          
          <div className="h-64 w-full">
            {stats.chartData.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData} layout="vertical" margin={{ left: -20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" fontSize={10} stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" fontSize={10} width={80} stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Calendar size={48} strokeWidth={1} className="mb-2 opacity-20" />
                <p className="text-xs font-medium text-gray-400">Belum ada data pemakaian</p>
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart / Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-800 flex items-center">
              <PieChartIcon size={16} className="mr-2 text-emerald-600" />
              Distribusi Tipe Aset
            </h3>
          </div>

          <div className="h-48 w-full">
             {stats.pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {stats.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p className="text-xs font-medium">Belum ada data distribusi</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
            {stats.pieData.slice(0, 6).map((item, index) => (
              <div key={item.name} className="flex items-center text-[10px]">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-gray-500 truncate flex-1">{item.name}</span>
                <span className="font-bold text-gray-900 ml-1">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
