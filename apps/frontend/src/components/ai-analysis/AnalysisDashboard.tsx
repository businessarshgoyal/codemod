/**
 * AI Analysis Dashboard Component
 * Main interface for viewing and managing AI code analysis sessions
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle,
  TrendingUp,
  Shield,
  Zap,
  Code
} from 'lucide-react';
import { AnalysisSessionResponse } from '@codemod/database';
import { useAiAnalysis } from '@/hooks/useAiAnalysis';
import { CreateAnalysisModal } from './CreateAnalysisModal';
import { AnalysisResultsView } from './AnalysisResultsView';
import { AnalysisMetricsChart } from './AnalysisMetricsChart';

interface AnalysisDashboardProps {
  userId: string;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ userId }) => {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<{
    analysisType?: string;
    status?: string;
  }>({});

  const {
    sessions,
    loading,
    error,
    createSession,
    refreshSessions,
    deleteSession
  } = useAiAnalysis(userId, filter);

  useEffect(() => {
    refreshSessions();
  }, [filter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAnalysisTypeIcon = (type: string) => {
    switch (type) {
      case 'security':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'performance':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'quality':
        return <Code className="h-4 w-4 text-blue-500" />;
      case 'maintainability':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      default:
        return <Code className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (criticalIssues: number, totalIssues: number) => {
    if (criticalIssues > 0) return 'text-red-600';
    if (totalIssues > 10) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
        <p>Failed to load analysis sessions: {error}</p>
        <Button onClick={refreshSessions} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Code Analysis</h1>
          <p className="text-gray-600 mt-1">
            Analyze your repositories with AI-powered insights
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          New Analysis
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filter.analysisType || ''}
          onChange={(e) => setFilter({ ...filter, analysisType: e.target.value || undefined })}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Types</option>
          <option value="security">Security</option>
          <option value="performance">Performance</option>
          <option value="quality">Code Quality</option>
          <option value="maintainability">Maintainability</option>
        </select>

        <select
          value={filter.status || ''}
          onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <Card 
            key={session.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedSession(session.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getAnalysisTypeIcon(session.analysisType)}
                  <CardTitle className="text-lg capitalize">
                    {session.analysisType}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(session.status)}
                  <Badge 
                    variant={session.status === 'completed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {session.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 truncate">
                    {session.repositoryUrl.replace('https://github.com/', '')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {session.status === 'completed' && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Issues:</span>
                      <span className={`ml-1 font-semibold ${getSeverityColor(session.criticalIssues, session.totalIssues)}`}>
                        {session.totalIssues}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Critical:</span>
                      <span className="ml-1 font-semibold text-red-600">
                        {session.criticalIssues}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Confidence:</span>
                      <span className="ml-1 font-semibold text-blue-600">
                        {Math.round(session.averageConfidence * 100)}%
                      </span>
                    </div>
                  </div>
                )}

                {session.status === 'processing' && (
                  <div className="text-sm text-blue-600">
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse h-2 bg-blue-200 rounded-full flex-1"></div>
                      <span>Analyzing...</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-12">
          <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No analysis sessions yet
          </h3>
          <p className="text-gray-600 mb-4">
            Start by creating your first AI code analysis session
          </p>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Analysis
          </Button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateAnalysisModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={async (data) => {
            await createSession(data);
            setShowCreateModal(false);
            refreshSessions();
          }}
        />
      )}

      {selectedSession && (
        <AnalysisResultsView
          sessionId={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
};
