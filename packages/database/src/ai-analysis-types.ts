/**
 * AI Analysis Database Types and Interfaces
 * Foundation for AI-powered code analysis features
 */

export interface AiAnalysisSession {
  id: string;
  userId: string;
  repositoryUrl: string;
  analysisType: 'security' | 'performance' | 'quality' | 'maintainability';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface AiAnalysisResult {
  id: string;
  sessionId: string;
  filePath: string;
  lineNumber?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  message: string;
  suggestion?: string;
  confidenceScore?: number; // 0.00 to 1.00
  createdAt: Date;
  aiModel: 'gpt-4' | 'claude-3' | 'gemini-pro' | 'custom';
}

export interface AiAnalysisMetric {
  id: string;
  sessionId: string;
  metricName: string;
  metricValue: number;
  metricUnit?: string;
  createdAt: Date;
}

export interface CreateAnalysisSessionRequest {
  repositoryUrl: string;
  analysisType: AiAnalysisSession['analysisType'];
  metadata?: Record<string, any>;
}

export interface AnalysisSessionResponse extends AiAnalysisSession {
  results: AiAnalysisResult[];
  metrics: AiAnalysisMetric[];
  totalIssues: number;
  criticalIssues: number;
  averageConfidence: number;
}

// Database query helpers
export interface AnalysisFilters {
  userId?: string;
  analysisType?: AiAnalysisSession['analysisType'];
  status?: AiAnalysisSession['status'];
  severity?: AiAnalysisResult['severity'];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface AnalysisPagination {
  page: number;
  limit: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'severity';
  sortOrder?: 'asc' | 'desc';
}
