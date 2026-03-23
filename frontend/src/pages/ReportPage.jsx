import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Download, Share2, Camera, Star, TrendingUp, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import api from '../services/api';
import { getOriginalUrl } from '../utils/imageUrl';

function ReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const toNumber = (v) => {
    const n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };
  const formatScore = (v, digits = 1) => {
    if (v === null || v === undefined) return 'N/A';
    const n = toNumber(v);
    return Number.isFinite(n) ? n.toFixed(digits) : 'N/A';
  };

  const { data: report, isLoading, error } = useQuery({
    queryKey: ['report', id],
    queryFn: async () => {
      const response = await api.get(`/reports/${id}`);
      return response.data.report;
    }
  });

  const dimensionNames = {
    face: ['Facial Proportions','Skin Condition','Smile & Expression','Eyes & Aura','Overall Recognition'],
    figure: ['Posture Proportions','Line Sense','Pose Performance','Health Vibe','Clothing Fit'],
    outfit: ['Color Coordination','Item Selection','Layering','Fashionability','Personality Expression'],
    photography: ['Composition','Lighting Use','Clarity','Atmosphere','Creativity'],
    others: ['Personality & Charm','Cultural Vibe','Engagement','Emotion Expression','Social Shareability']
  };

  const prepareRadarData = () => {
    if (!report?.radar_json) return [];
    const modules = ['face','figure','outfit','photography','others'];
    // Use first module's dimension names as axis labels
    const dims = dimensionNames.face;
    return dims.map((dim, idx) => {
      const point = { dimension: dim };
      modules.forEach(m => {
        if (Array.isArray(report.radar_json[m])) {
          point[m] = report.radar_json[m][idx] || 0;
        }
      });
      return point;
    });
  };

  const getModeStyle = (mode) => {
    return mode === 'roast'
      ? 'bg-gradient-to-r from-orange-500 to-red-500'
      : 'bg-gradient-to-r from-blue-500 to-purple-500';
  };

  const handleShare = async () => {
    try {
      const response = await api.post(`/reports/${id}/share-card`);
      const { shareLink, cardUrl, socialMeta } = response.data;

  // Copy share link to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareLink);
        toast.success('Share link copied to clipboard!');
      }

  // Optionally open native share dialog
      if (navigator.share) {
        try {
          await navigator.share({
            title: socialMeta.title,
            text: socialMeta.description,
            url: shareLink
          });
        } catch (err) {
          console.log('User cancelled share');
        }
      }
    } catch (error) {
      toast.error('Failed to generate share link');
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.post(`/reports/${id}/share-card`);
      const { cardUrl, cardType } = response.data;

      const fileResponse = await fetch(cardUrl, { credentials: 'include' });
      if (!fileResponse.ok) throw new Error('Download failed');

      const blob = await fileResponse.blob();
      const url = URL.createObjectURL(blob);

      const extension = cardType || (cardUrl.split('.').pop() || 'png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `seebeauty-report-${id}.${extension}`;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      toast.success('Report card downloaded!');
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this report? This action cannot be undone.')) return;
    try {
      await api.delete(`/reports/${id}`);
      queryClient.invalidateQueries({ queryKey: ['reports'], exact: false });
      queryClient.removeQueries({ queryKey: ['report', id] });
      toast.success('Report deleted');
      navigate('/dashboard');
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">Failed to load report</p>
          <Link to="/dashboard" className="mt-4 text-primary-600 hover:text-primary-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Photo Report</h1>
            <p className="mt-2 text-gray-600">
              {(() => {
                if (!report) return null;
                const dateValue = report.created_at || report.createdAt || report.createdAtRaw;
                if (!dateValue) return 'Unknown date';
                const d = new Date(dateValue);
                if (isNaN(d.getTime())) return 'Unknown date';
                return format(d, 'MMMM d, yyyy h:mm a');
              })()}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleShare}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Mode Badge */}
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-white text-sm font-medium ${getModeStyle(report?.mode)}`}>
          {report?.mode === 'roast' ? '🔥 Roast Mode' : '✨ Normal Mode'}
        </div>
      </div>

      {/* Photo and Overall Score Section */}
      <div className={`grid ${report?.image ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-8 mb-8`}>
        {/* Photo Display */}
        {report?.image && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Analyzed Photo
            </h2>
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={getOriginalUrl(report.image)}
                alt="Analyzed photo"
                className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPg==';
                }}
              />
            </div>
            {report.image.created_at && (
              <p className="mt-3 text-sm text-gray-500 text-center">
                Uploaded: {format(new Date(report.image.created_at), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        )}

        {/* Overall Score */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center h-full flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Overall Score</h2>
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 mx-auto mb-4">
              <span className="text-4xl font-bold text-primary-700">
                {formatScore(report?.total_score, 1)}
              </span>
            </div>
            <div className="flex justify-center space-x-1">
              {[...Array(10)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-6 w-6 ${
                    i < Math.round(toNumber(report?.total_score))
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Based on {report?.modules?.length || 5} evaluation modules
            </p>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Detailed Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 text-sm">
          {dimensionNames.face.map((d,i) => (
            <div key={i} className="bg-gray-50 rounded-md p-2 text-gray-700 font-medium text-center border">
              {d}
            </div>
          ))}
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={prepareRadarData()}>
              <PolarGrid />
              <PolarAngleAxis dataKey="dimension" />
              <PolarRadiusAxis angle={90} domain={[0, 10]} />
              {report?.modules?.map((module, index) => (
                <Radar
                  key={module}
                  name={module}
                  dataKey={module}
                  stroke={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index]}
                  fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index]}
                  fillOpacity={0.3}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {report?.modules?.map((module, index) => (
            <div key={module} className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index] }}
              />
              <span className="text-sm text-gray-600 capitalize">{module}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Evaluation & Recommendations */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Evaluation */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Star className="h-5 w-5 text-yellow-500 mr-2" />
            Evaluation
          </h3>
          <ul className="space-y-3">
            {report?.highlights_json?.map((highlight, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-700">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
            Recommendations
          </h3>
          <ul className="space-y-3">
            {report?.improvements_json?.map((improvement, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2">→</span>
                <span className="text-gray-700">{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Module Detail Tables */}
      {report?.module_details_json && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Module Dimension Details</h2>
          <div className="space-y-10">
            {Object.entries(report.module_details_json).map(([module, rows]) => (
              <div key={module}>
                <div className="flex items-center mb-3">
                  <div className="text-sm uppercase tracking-wide font-semibold text-gray-500 mr-3">{module}</div>
                  {report.mode === 'roast' && report.module_burns_json?.[module] && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">{report.module_burns_json[module]}</span>
                  )}
                </div>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Dimension</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Score</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Comment</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Tip</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(rows) && rows.map((r, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-4 py-2 font-medium text-gray-800 whitespace-nowrap">{r.dimension}</td>
                          <td className="px-4 py-2 text-gray-700">{formatScore(r.score,0)}</td>
                          <td className="px-4 py-2 text-gray-600 max-w-md">{r.comment}</td>
                          <td className="px-4 py-2 text-gray-600 max-w-md">{r.tip}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-8 text-center text-white">
        <h3 className="text-2xl font-bold mb-4">Ready to Try Again?</h3>
        <p className="mb-6">Upload another photo and see your improvement!</p>
        <Link
          to="/rate"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-primary-600 bg-white hover:bg-gray-100"
        >
          <Camera className="mr-2 h-5 w-5" />
          Rate Another Photo
        </Link>
      </div>
    </div>
  );
}

export default ReportPage;