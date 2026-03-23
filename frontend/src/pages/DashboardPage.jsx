import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Camera, TrendingUp, Clock, Star, ChevronRight, Filter, Sparkles, Eye, Heart, BarChart3 } from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';
import { getThumbnailUrl } from '../utils/imageUrl';

function DashboardPage() {
  const [filter, setFilter] = useState('all');

  // 数值安全转换（Sequelize DECIMAL 会以字符串返回）
  const toNumber = (v) => {
    const n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };
  const formatScore = (v, digits = 1) => {
    const n = toNumber(v);
    return n === 0 && (v === null || v === undefined) ? 'N/A' : n.toFixed(digits);
  };

  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['reports', filter],
    queryFn: async () => {
      const params = filter !== 'all' ? { mode: filter } : {};
      const response = await api.get('/reports', { params });
      return response.data;
    }
  });

  // 安全日期解析工具
  const parseDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d;
  };

  const safeCreatedDate = (r) => parseDate(r?.created_at || r?.createdAt || r?.createdAtRaw);

  const reportList = (reports?.reports || []).map(r => ({ ...r, _numeric_total: toNumber(r.total_score) }));
  const totalReports = reportList.length;
  const averageScore = totalReports === 0
    ? 0
    : (reportList.reduce((acc, r) => acc + r._numeric_total, 0) / totalReports);
  const weekAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d; })();
  const thisWeekCount = reportList.filter(r => {
    const d = safeCreatedDate(r);
    return d && d > weekAgo;
  }).length;

  const stats = {
    total: reports?.pagination?.total || totalReports,
    averageScore,
    thisWeek: thisWeekCount
  };

  const getModeColor = (mode) => {
    return mode === 'roast'
      ? 'text-orange-600 bg-gradient-to-r from-orange-100 to-red-100'
      : 'text-blue-600 bg-gradient-to-r from-blue-100 to-purple-100';
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Organic Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-purple-50">
        {/* Organic background shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-16 left-8 w-72 h-72 bg-gradient-to-br from-purple-100/30 to-pink-100/40 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-12 w-96 h-96 bg-gradient-to-br from-blue-100/20 to-cyan-100/30 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '3s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-gradient-to-br from-yellow-100/25 to-orange-100/35 rounded-full blur-2xl animate-ping" style={{ animationDuration: '4s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <div className="mb-8 flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center transform rotate-3">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div className="text-sm font-medium text-purple-600 px-3 py-1 bg-purple-100 rounded-full">
                Data Tracking
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">
              Your
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                Beauty Journey
              </span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed mb-12 max-w-3xl mx-auto">
              Track every improvement and uncover your unique beauty pattern.
            </p>
          </div>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Natural Stats Display */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
            {/* Total Reports Card */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full transform translate-x-6 -translate-y-6 opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center transform -rotate-6 group-hover:rotate-0 transition-transform duration-500">
                    <Camera className="h-7 w-7 text-white" />
                  </div>
                  <span className="text-sm text-gray-500 font-medium">Total Ratings</span>
                </div>
                <div className="text-4xl font-black text-slate-900 mb-2">{stats.total}</div>
                <div className="text-sm text-gray-600">AI rating sessions</div>
              </div>
            </div>

            {/* Average Score Card */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full transform translate-x-8 -translate-y-8 opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                    <Star className="h-7 w-7 text-white" />
                  </div>
                  <span className="text-sm text-gray-500 font-medium">Average Score</span>
                </div>
                <div className="text-4xl font-black text-slate-900 mb-2">{stats.averageScore.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Overall beauty index</div>
              </div>
            </div>

            {/* This Week Card */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full transform translate-x-6 -translate-y-6 opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-400 rounded-2xl flex items-center justify-center transform rotate-6 group-hover:rotate-0 transition-transform duration-500">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                  <span className="text-sm text-gray-500 font-medium">This Week</span>
                </div>
                <div className="text-4xl font-black text-slate-900 mb-2">{stats.thisWeek}</div>
                <div className="text-sm text-gray-600">Ratings this week</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-purple-50 via-white to-pink-50 rounded-3xl p-8 mb-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Ready for your next transformation?</h3>
              <p className="text-lg text-slate-600">Each rating is a chance to discover a better you.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/rate"
                className="group bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center"
              >
                <Camera className="mr-3 h-6 w-6 group-hover:animate-pulse" />
                Start New Rating
              </Link>
              <Link
                to="/profile"
                className="bg-white text-purple-600 px-8 py-4 rounded-2xl font-bold text-lg border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
              >
                <Eye className="mr-3 h-6 w-6" />
                View Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">
                  Recent Rating History
                </h2>
                <p className="text-lg text-slate-600">Track your beauty progress</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="appearance-none bg-gray-50 border border-gray-200 rounded-2xl px-6 py-3 pr-12 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="all">All</option>
                    <option value="normal">Gentle Mode</option>
                    <option value="roast">Roast Mode</option>
                  </select>
                  <Filter className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            {isLoading ? (
              <div className="py-16 text-center">
                <div className="inline-flex items-center justify-center p-6 bg-purple-50 rounded-3xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  <span className="ml-4 text-purple-700 font-semibold">AI is loading your records...</span>
                </div>
              </div>
            ) : error ? (
              <div className="py-16 text-center">
                <div className="inline-block p-6 bg-red-50 rounded-3xl">
                  <p className="text-red-600 font-semibold">Failed to load, please try again later</p>
                </div>
              </div>
            ) : reports?.reports?.length === 0 ? (
              <div className="py-16 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Camera className="h-16 w-16 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Start Your Beauty Journey</h3>
                  <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                    No ratings yet? Upload your first photo and let AI reveal your unique appeal.
                  </p>
                  <Link
                    to="/rate"
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <Camera className="mr-3 h-6 w-6" />
                    Start First Rating
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {reports?.reports?.map((report, index) => (
                  <Link
                    key={report.id}
                    to={`/report/${report.id}`}
                    className="block group"
                  >
                    <div className="bg-gray-50 rounded-2xl p-6 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg border border-gray-100 hover:border-purple-200">
                      <div className="flex items-center justify-between">
                        {/* Photo Thumbnail */}
                        {report.image && (
                          <div className="mr-6 flex-shrink-0">
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border-2 border-white shadow-md">
                              <img
                                src={getThumbnailUrl(report.image)}
                                alt="Photo"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNmI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==';
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex-1 space-y-3">
                          <div className="flex items-center space-x-4">
                            <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center ${
                              report.mode === 'roast'
                                ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                : 'bg-green-100 text-green-700 border border-green-200'
                            }`}>
                              {report.mode === 'roast' ? (
                                <>
                                  <Sparkles className="h-4 w-4 mr-1" />
                                  Roast Mode
                                </>
                              ) : (
                                <>
                                  <Heart className="h-4 w-4 mr-1" />
                                  Gentle Mode
                                </>
                              )}
                            </div>
                            <span className="text-sm text-gray-500 font-medium bg-white px-3 py-1 rounded-full border">
                              {(() => {
                                const d = safeCreatedDate(report);
                                return d ? format(d, 'MMM d HH:mm') : 'Unknown';
                              })()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="flex items-center bg-white rounded-2xl px-4 py-2 border">
                              <Star className="h-5 w-5 text-yellow-500 mr-2" />
                              <span className={`text-xl font-black ${getScoreColor(toNumber(report.total_score))}`}>
                                {formatScore(report.total_score, 1)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 bg-white rounded-xl px-3 py-2 border">
                              Modules: {report.modules?.join(' · ')}
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 p-3 bg-white rounded-full border group-hover:bg-purple-50 group-hover:border-purple-200 transition-colors">
                          <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-purple-500 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {reports?.pagination?.total > reports?.reports?.length && (
            <div className="pt-8 text-center">
              <button className="px-8 py-3 text-purple-600 hover:text-white bg-purple-50 hover:bg-purple-500 font-bold rounded-2xl border-2 border-purple-200 hover:border-purple-500 transition-all duration-300 transform hover:scale-105">
                Load More
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;