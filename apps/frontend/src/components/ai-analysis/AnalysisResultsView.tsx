/**
 * Analysis Results Viewer Component
 * Detailed view of AI analysis results with filtering and export
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Download,
  Filter,
  Code,
  FileText,
  BarChart3
} from 'lucide-react';
import { AiAnalysisResult, AnalysisSessionResponse } from '@codemod/database';
import { useAiAnalysisSession } from '@/hooks/useAiAnalysisSession';

interface AnalysisResultsViewProps {
  sessionId: string;
  onClose: () => void;
}

export const AnalysisResultsView: React.FC<AnalysisResultsViewProps> = ({
  sessionId,
  onClose
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFile, setSelectedFile] = useState<string>('all');

  const {
    session,
    loading,
    error,
    exportSession
  } = useAiAnalysisSession(sessionId);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredResults = session?.results.filter(result => {
    if (selectedSeverity !== 'all' && result.severity !== selectedSeverity) return false;
    if (selectedCategory !== 'all' && result.category !== selectedCategory) return false;
    if (selectedFile !== 'all' && result.filePath !== selectedFile) return false;
    return true;
  }) || [];

  const uniqueCategories = [...new Set(session?.results.map(r => r.category) || [])];
  const uniqueFiles = [...new Set(session?.results.map(r => r.filePath) || [])];

  const severityCounts = {
    critical: session?.results.filter(r => r.severity === 'critical').length || 0,
    high: session?.results.filter(r => r.severity === 'high').length || 0,
    medium: session?.results.filter(r => r.severity === 'medium').length || 0,
    low: session?.results.filter(r => r.severity === 'low').length || 0,
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !session) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center text-red-600 p-8">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load analysis results</p>
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                Analysis Results - {session.analysisType}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                {session.repositoryUrl.replace('https://github.com/', '')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportSession('json')}
              >
                <Download className="h-4 w-4 mr-1" />
                Export JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportSession('csv')}
              >
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="results" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="results" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Results ({session.totalIssues})
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="flex-1 flex flex-col overflow-hidden">
            {/* Filters */}
            <div className="flex gap-4 p-4 bg-gray-50 border-b">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical ({severityCounts.critical})</option>
                  <option value="high">High ({severityCounts.high})</option>
                  <option value="medium">Medium ({severityCounts.medium})</option>
                  <option value="low">Low ({severityCounts.low})</option>
                </select>
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm max-w-xs"
              >
                <option value="all">All Files</option>
                {uniqueFiles.map(file => (
                  <option key={file} value={file}>
                    {file.split('/').pop()}
                  </option>
                ))}
              </select>

              <div className="ml-auto text-sm text-gray-600">
                Showing {filteredResults.length} of {session.totalIssues} results
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredResults.map((result) => (
                <div
                  key={result.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(result.severity)}
                      <Badge className={getSeverityColor(result.severity)}>
                        {result.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {result.category}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      Confidence: {Math.round((result.confidenceScore || 0) * 100)}%
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Code className="h-3 w-3 text-gray-400" />
                      <span className="font-mono text-gray-600">
                        {result.filePath}
                        {result.lineNumber && `:${result.lineNumber}`}
                      </span>
                    </div>

                    <p className="text-gray-900">{result.message}</p>

                    {result.suggestion && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2">
                        <p className="text-sm text-blue-800">
                          <strong>Suggestion:</strong> {result.suggestion}
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 flex items-center gap-4">
                      <span>Model: {result.aiModel}</span>
                      <span>Found: {new Date(result.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}

              {filteredResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Info className="h-8 w-8 mx-auto mb-2" />
                  <p>No results match the current filters</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {session.metrics.map((metric) => (
                <div key={metric.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {metric.metricName}
                  </h3>
                  <div className="text-2xl font-bold text-blue-600">
                    {metric.metricValue}
                    {metric.metricUnit && (
                      <span className="text-sm text-gray-500 ml-1">
                        {metric.metricUnit}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="summary" className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {severityCounts.critical}
                  </div>
                  <div className="text-sm text-gray-600">Critical Issues</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {severityCounts.high}
                  </div>
                  <div className="text-sm text-gray-600">High Issues</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {severityCounts.medium}
                  </div>
                  <div className="text-sm text-gray-600">Medium Issues</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {severityCounts.low}
                  </div>
                  <div className="text-sm text-gray-600">Low Issues</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Analysis Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Issues Found:</span>
                    <span className="font-medium">{session.totalIssues}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Confidence:</span>
                    <span className="font-medium">
                      {Math.round(session.averageConfidence * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Files Analyzed:</span>
                    <span className="font-medium">{uniqueFiles.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Categories Found:</span>
                    <span className="font-medium">{uniqueCategories.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
