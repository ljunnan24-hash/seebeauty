import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Upload, Camera, X, Loader, AlertCircle, Sparkles, Heart, Flame, Eye, Palette, Star } from 'lucide-react';
import api from '../services/api';

function RatingPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mode, setMode] = useState('normal');
  const [selectedModule, setSelectedModule] = useState('face');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024
  });

  const selectModule = (moduleId) => {
    setSelectedModule(moduleId);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please select an image');
      return;
    }

    setIsUploading(true);
    // Debug log
    if (import.meta.env.DEV) console.log('[RatingPage] Start upload', { mode, selectedModule });
    const formData = new FormData();
    formData.append('image', file);
    formData.append('mode', mode);
    formData.append('modules', JSON.stringify([selectedModule]));
    if (description) {
      formData.append('description', description);
    }

    try {
      const response = await api.post('/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (import.meta.env.DEV) console.log('[RatingPage] Upload response', response.data);

      if (!response.data.taskId) {
        toast.error('No task ID returned. Please try again.');
        setIsUploading(false);
        return;
      }

      setTaskId(response.data.taskId);

      // 生成20-60秒的随机预计时间
      const randomEstimatedTime = Math.floor(Math.random() * (60 - 20 + 1)) + 20;
      setEstimatedTime(randomEstimatedTime);

      toast.success('Image uploaded! Processing your report...');

      // Start polling for task status only if taskId exists
      pollTaskStatus(response.data.taskId);
    } catch (error) {
      if (import.meta.env.DEV) console.error('[RatingPage] Upload failed', error);
      toast.error(error.response?.data?.message || 'Upload failed');
      setIsUploading(false);
    }
  };

  const pollTaskStatus = async (taskId) => {
    if (!taskId) {
      toast.error('Missing task ID. Please re-upload.');
      setIsUploading(false);
      return;
    }
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/tasks/${taskId}/status`);
        setTaskStatus(response.data);
        if (import.meta.env.DEV) console.log('[RatingPage] Task status', response.data);

        if (response.data.status === 'completed' && response.data.reportId) {
          clearInterval(interval);
          setEstimatedTime(null);
          toast.success('Report ready!');
          if (import.meta.env.DEV) console.log('[RatingPage] Navigate to report', response.data.reportId);
          navigate(`/report/${response.data.reportId}`);
        } else if (response.data.status === 'failed') {
          if (import.meta.env.DEV) console.warn('[RatingPage] Task failed', response.data);
          clearInterval(interval);
          setEstimatedTime(null);
          toast.error('Processing failed: ' + (response.data.errorCode || 'Unknown error'));
          setIsUploading(false);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('[RatingPage] Status check failed', error);
        clearInterval(interval);
        setEstimatedTime(null);
        toast.error('Failed to check status');
        setIsUploading(false);
      }
    }, 2000); // Poll every 2 seconds

    // Stop polling after 2 minutes
    setTimeout(() => {
      clearInterval(interval);
      if (isUploading) {
        setEstimatedTime(null);
        toast.error('Processing timeout. Please try again.');
        setIsUploading(false);
      }
    }, 120000);
  };

  const computeProgress = () => {
    if (!taskStatus) return 0;
    const map = {
      pending: 5,
      extracting_features: 25,
      generating_score: 65,
      saving_report: 90,
      completed: 100,
      failed: 100
    };
    return map[taskStatus.status] ?? 10;
  };

  const moduleOptions = [
    {
      id: 'face',
      label: 'Face',
      description: 'Facial features and expression',
      icon: Heart,
      color: 'rose'
    },
    {
      id: 'figure',
      label: 'Figure',
      description: 'Posture and body language',
      icon: Star,
      color: 'purple'
    },
    {
      id: 'outfit',
      label: 'Outfit',
      description: 'Style and fashion choices',
      icon: Palette,
      color: 'blue'
    },
    {
      id: 'photography',
      label: 'Photography',
      description: 'Technical photo quality',
      icon: Camera,
      color: 'green'
    },
    {
      id: 'others',
      label: 'Others',
      description: 'Overall impression and vibe',
      icon: Sparkles,
      color: 'yellow'
    }
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Upload Section */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center transform rotate-6">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Step 1: Choose Photo</h2>
                  <p className="text-sm text-gray-600">Upload a photo you like best</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div
                {...getRootProps()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
                  ${isDragActive
                    ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg scale-[1.02]'
                    : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/30 hover:scale-[1.01]'
                  }
                  ${preview ? 'bg-gray-50' : 'bg-white'}`}
              >
                <input {...getInputProps()} />
                {preview ? (
                  <div className="relative group">
                    <div className="relative inline-block">
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-h-80 mx-auto rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 rounded-2xl"></div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          setPreview(null);
                        }}
                        className="absolute -top-3 -right-3 w-10 h-10 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center transform hover:scale-110 transition-all duration-200 shadow-lg"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-600 bg-white rounded-2xl px-4 py-2 inline-block border">
                        Click to replace photo
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative inline-block">
                      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mb-6 transform rotate-3">
                        <Upload className="h-12 w-12 text-purple-600" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-bounce">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">
                        {isDragActive ? 'Release to upload' : 'Drag & drop or click to select'}
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Supports JPEG / PNG / WebP up to 6MB
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                          <Eye className="h-6 w-6 text-purple-500" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium">AI Analysis</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                          <Star className="h-6 w-6 text-yellow-500" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium">Accurate Scores</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                          <Heart className="h-6 w-6 text-pink-500" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium">Pro Tips</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mt-8 bg-gradient-to-r from-gray-50 to-purple-50 rounded-2xl p-6 border border-gray-100">
                <label className="block text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell the AI the context or what feedback you want..."
                  className="w-full px-6 py-4 border-0 bg-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm transition-all duration-200 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Options Section */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-2xl flex items-center justify-center transform -rotate-6">
                  <Palette className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Step 2: Rating Settings</h2>
                  <p className="text-sm text-gray-600">Choose feedback style and focus area</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-10">

              {/* Mode Selection */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-red-400 rounded-xl flex items-center justify-center mr-3">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                  Choose Feedback Style
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    onClick={() => setMode('normal')}
                    className={`group p-8 border-2 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
                      mode === 'normal'
                        ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl ring-2 ring-green-200'
                        : 'border-gray-200 hover:border-green-300 hover:shadow-lg bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transform transition-transform duration-300 ${
                        mode === 'normal' ? 'bg-green-100 scale-110' : 'bg-gray-100 group-hover:bg-green-50 group-hover:scale-105'
                      }`}>
                        <Heart className={`h-8 w-8 ${
                          mode === 'normal' ? 'text-green-600' : 'text-gray-400 group-hover:text-green-500'
                        }`} />
                      </div>
                    </div>
                    <div className={`font-black text-xl mb-3 ${
                      mode === 'normal' ? 'text-green-700' : 'text-gray-700'
                    }`}>Gentle Mode</div>
                    <div className={`text-base ${
                      mode === 'normal' ? 'text-green-600' : 'text-gray-500'
                    }`}>Friendly, constructive professional feedback</div>
                  </button>
                  <button
                    onClick={() => setMode('roast')}
                    className={`group p-8 border-2 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
                      mode === 'roast'
                        ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-red-50 shadow-xl ring-2 ring-orange-200'
                        : 'border-gray-200 hover:border-orange-300 hover:shadow-lg bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transform transition-transform duration-300 ${
                        mode === 'roast' ? 'bg-orange-100 scale-110' : 'bg-gray-100 group-hover:bg-orange-50 group-hover:scale-105'
                      }`}>
                        <Flame className={`h-8 w-8 ${
                          mode === 'roast' ? 'text-orange-600' : 'text-gray-400 group-hover:text-orange-500'
                        }`} />
                      </div>
                    </div>
                    <div className={`font-black text-xl mb-3 ${
                      mode === 'roast' ? 'text-orange-700' : 'text-gray-700'
                    }`}>Roast Mode</div>
                    <div className={`text-base ${
                      mode === 'roast' ? 'text-orange-600' : 'text-gray-500'
                    }`}>Humorous, direct and edgy perspective</div>
                  </button>
                </div>
              </div>

              {/* Module Selection */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center mr-3">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  Select Focus Area
                </h3>
                <p className="text-gray-600 mb-6">Pick the dimension you want AI to focus on</p>
                <div className="space-y-4">
                  {moduleOptions.map((module) => {
                    const IconComponent = module.icon;
                    const isSelected = selectedModule === module.id;
                    const colorClasses = {
                      rose: isSelected ? 'border-rose-400 bg-gradient-to-br from-rose-50 to-pink-50 ring-2 ring-rose-200' : 'hover:border-rose-300',
                      purple: isSelected ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-violet-50 ring-2 ring-purple-200' : 'hover:border-purple-300',
                      blue: isSelected ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 ring-2 ring-blue-200' : 'hover:border-blue-300',
                      green: isSelected ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 ring-2 ring-green-200' : 'hover:border-green-300',
                      yellow: isSelected ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 ring-2 ring-yellow-200' : 'hover:border-yellow-300'
                    };
                    const iconColorClasses = {
                      rose: isSelected ? 'text-rose-600' : 'text-gray-400 group-hover:text-rose-500',
                      purple: isSelected ? 'text-purple-600' : 'text-gray-400 group-hover:text-purple-500',
                      blue: isSelected ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500',
                      green: isSelected ? 'text-green-600' : 'text-gray-400 group-hover:text-green-500',
                      yellow: isSelected ? 'text-yellow-600' : 'text-gray-400 group-hover:text-yellow-500'
                    };

                    return (
                      <label
                        key={module.id}
                        className={`group relative flex items-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                          isSelected
                            ? colorClasses[module.color]
                            : `border-gray-200 hover:shadow-lg bg-white ${colorClasses[module.color]}`
                        }`}
                      >
                        <input
                          type="radio"
                          name="module"
                          value={module.id}
                          checked={isSelected}
                          onChange={() => selectModule(module.id)}
                          className="sr-only"
                        />
                        <div className={`flex-shrink-0 w-14 h-14 rounded-2xl mr-4 flex items-center justify-center transform transition-transform duration-300 ${
                          isSelected ? `bg-${module.color}-100 scale-110` : 'bg-gray-100 group-hover:scale-105'
                        }`}>
                          <IconComponent className={`h-7 w-7 ${iconColorClasses[module.color]}`} />
                        </div>
                        <div className="flex-1">
                          <div className={`font-bold text-lg mb-1 ${
                            isSelected ? `text-${module.color}-700` : 'text-gray-700'
                          }`}>
                            {module.label}
                          </div>
                          <div className={`text-sm ${
                            isSelected ? `text-${module.color}-600` : 'text-gray-500'
                          }`}>
                            {module.description}
                          </div>
                        </div>
                        {isSelected && (
                          <div className={`absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-${module.color}-500 to-${module.color}-600 rounded-full flex items-center justify-center shadow-lg animate-pulse`}>
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="space-y-6">
                <button
                  onClick={handleSubmit}
                  disabled={!file || isUploading}
                  className={`w-full py-6 px-8 rounded-2xl text-xl font-black transition-all duration-300 transform ${
                    !file || isUploading
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:scale-[1.02] shadow-xl hover:shadow-2xl'
                  }`}
                >
                  {isUploading ? (
                    <span className="flex items-center justify-center">
                      <Loader className="animate-spin h-7 w-7 mr-3" />
                      AI is working its magic...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Sparkles className="h-7 w-7 mr-3 animate-pulse" />
                      Start AI Beauty Rating
                    </span>
                  )}
                </button>

                {/* Status Display */}
                {taskStatus && (
                  <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 rounded-2xl p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-2xl flex items-center justify-center mr-4">
                        <AlertCircle className="h-6 w-6 text-white animate-pulse" />
                      </div>
                      <div>
                        <div className="font-bold text-lg text-blue-800 mb-1">
                          AI engine is analyzing...
                        </div>
                        <div className="text-blue-600">
                          Please wait while we generate your personalized report
                        </div>
                        {estimatedTime && (
                          <div className="text-sm text-purple-600 mt-1 font-medium">
                            Estimated time: {estimatedTime} seconds
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-white rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: computeProgress() + '%'}}
                      ></div>
                    </div>
                    <div className="mt-2 text-right text-xs text-blue-500 font-medium tracking-wide">{computeProgress()}%</div>
                  </div>
                )}

                {/* Tips */}
                {!file && (
                  <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 border-2 border-yellow-200 rounded-2xl p-6">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center mr-4 flex-shrink-0 transform rotate-6">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-lg text-yellow-800 mb-3">💡 Tips For Better Scores</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-white rounded-xl p-3 border">
                            <p className="text-sm text-yellow-700 font-medium">• Use good lighting and avoid harsh shadows</p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border">
                            <p className="text-sm text-yellow-700 font-medium">• Choose a clean background</p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border">
                            <p className="text-sm text-yellow-700 font-medium">• Frontal or 3/4 angles work best</p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border">
                            <p className="text-sm text-yellow-700 font-medium">• Keep a natural expression and bright eyes</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Encouragement */}
        <div className="max-w-4xl mx-auto mt-16 text-center">
          <div className="bg-gradient-to-r from-purple-50 via-white to-pink-50 rounded-3xl p-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Beauty is an attitude—and a choice
            </h3>
            <p className="text-lg text-slate-600 leading-relaxed">
              Everyone has a unique beauty. Let AI help you discover and enhance it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RatingPage;