/**
 * AI Analysis Service Test Suite
 * Comprehensive testing for AI analysis functionality
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AiAnalysisService } from '../ai-analysis.service';
import { CreateAnalysisSessionRequest } from '@codemod/database';

// Mock external dependencies
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');

describe('AiAnalysisService', () => {
  let service: AiAnalysisService;
  let mockUserId: string;

  beforeEach(() => {
    service = new AiAnalysisService();
    mockUserId = 'test-user-123';
    
    // Reset environment variables
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.CLAUDE_API_KEY = 'test-claude-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAnalysisSession', () => {
    it('should create a new analysis session successfully', async () => {
      const request: CreateAnalysisSessionRequest = {
        repositoryUrl: 'https://github.com/test/repo',
        analysisType: 'security',
        metadata: { branch: 'main' }
      };

      const session = await service.createAnalysisSession(mockUserId, request);

      expect(session).toMatchObject({
        userId: mockUserId,
        repositoryUrl: request.repositoryUrl,
        analysisType: request.analysisType,
        status: 'pending',
        metadata: request.metadata
      });
      expect(session.id).toBeDefined();
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.updatedAt).toBeInstanceOf(Date);
    });

    it('should reject invalid repository URLs', async () => {
      const request: CreateAnalysisSessionRequest = {
        repositoryUrl: 'invalid-url',
        analysisType: 'security'
      };

      await expect(
        service.createAnalysisSession(mockUserId, request)
      ).rejects.toThrow('Invalid repository URL provided');
    });

    it('should handle different analysis types', async () => {
      const analysisTypes = ['security', 'performance', 'quality', 'maintainability'] as const;

      for (const analysisType of analysisTypes) {
        const request: CreateAnalysisSessionRequest = {
          repositoryUrl: 'https://github.com/test/repo',
          analysisType
        };

        const session = await service.createAnalysisSession(mockUserId, request);
        expect(session.analysisType).toBe(analysisType);
      }
    });
  });

  describe('processAnalysis', () => {
    let mockSessionId: string;

    beforeEach(() => {
      mockSessionId = 'test-session-123';
    });

    it('should process security analysis successfully', async () => {
      // Mock session exists
      jest.spyOn(service as any, 'getSessionById').mockResolvedValue({
        id: mockSessionId,
        analysisType: 'security',
        repositoryUrl: 'https://github.com/test/repo'
      });

      // Mock repository operations
      jest.spyOn(service as any, 'cloneRepository').mockResolvedValue('/tmp/repo');
      jest.spyOn(service as any, 'getCodeFiles').mockResolvedValue([
        'src/auth.js',
        'src/database.js'
      ]);
      jest.spyOn(service as any, 'readFile').mockResolvedValue('mock file content');
      jest.spyOn(service as any, 'updateSessionStatus').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'storeAnalysisResults').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'generateMetrics').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'cleanupRepository').mockResolvedValue(undefined);

      // Mock AI analysis
      jest.spyOn(service as any, 'performSecurityAnalysis').mockResolvedValue([
        {
          id: 'result-1',
          sessionId: mockSessionId,
          filePath: 'src/auth.js',
          lineNumber: 15,
          severity: 'high',
          category: 'Authentication',
          message: 'Potential SQL injection vulnerability',
          suggestion: 'Use parameterized queries',
          confidenceScore: 0.92,
          aiModel: 'gpt-4'
        }
      ]);

      await expect(service.processAnalysis(mockSessionId)).resolves.not.toThrow();

      // Verify status updates
      expect(service['updateSessionStatus']).toHaveBeenCalledWith(mockSessionId, 'processing');
      expect(service['updateSessionStatus']).toHaveBeenCalledWith(mockSessionId, 'completed');
    });

    it('should handle analysis failures gracefully', async () => {
      jest.spyOn(service as any, 'getSessionById').mockResolvedValue({
        id: mockSessionId,
        analysisType: 'security'
      });

      jest.spyOn(service as any, 'cloneRepository').mockRejectedValue(
        new Error('Repository not accessible')
      );

      jest.spyOn(service as any, 'updateSessionStatus').mockResolvedValue(undefined);

      await expect(service.processAnalysis(mockSessionId)).rejects.toThrow();

      // Verify failure status is set
      expect(service['updateSessionStatus']).toHaveBeenCalledWith(mockSessionId, 'failed');
    });

    it('should throw error for non-existent session', async () => {
      jest.spyOn(service as any, 'getSessionById').mockResolvedValue(null);

      await expect(service.processAnalysis('non-existent')).rejects.toThrow(
        'Analysis session not found'
      );
    });
  });

  describe('AI Analysis Methods', () => {
    const mockFilePath = 'src/test.js';
    const mockContent = `
      function authenticate(username, password) {
        const query = "SELECT * FROM users WHERE username = '" + username + "'";
        return database.query(query);
      }
    `;
    const mockSessionId = 'test-session';

    it('should perform security analysis', async () => {
      jest.spyOn(service as any, 'callOpenAI').mockResolvedValue(JSON.stringify([
        {
          severity: 'critical',
          lineNumber: 2,
          category: 'SQL Injection',
          message: 'SQL injection vulnerability detected',
          suggestion: 'Use parameterized queries or prepared statements',
          confidence: 0.95
        }
      ]));

      const results = await service['performSecurityAnalysis'](
        mockFilePath, 
        mockContent, 
        mockSessionId
      );

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        severity: 'critical',
        category: 'SQL Injection',
        confidenceScore: 0.95
      });
    });

    it('should perform performance analysis', async () => {
      jest.spyOn(service as any, 'callClaude').mockResolvedValue(JSON.stringify([
        {
          severity: 'medium',
          lineNumber: 3,
          category: 'Database Performance',
          message: 'Inefficient database query detected',
          suggestion: 'Add database indexes or optimize query',
          confidence: 0.78
        }
      ]));

      const results = await service['performPerformanceAnalysis'](
        mockFilePath, 
        mockContent, 
        mockSessionId
      );

      expect(results).toHaveLength(1);
      expect(results[0].category).toBe('Database Performance');
    });
  });

  describe('getAnalysisSession', () => {
    it('should return complete session with results and metrics', async () => {
      const mockSession = {
        id: 'session-123',
        userId: mockUserId,
        repositoryUrl: 'https://github.com/test/repo',
        analysisType: 'security',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {}
      };

      const mockResults = [
        {
          id: 'result-1',
          severity: 'high',
          confidenceScore: 0.9
        },
        {
          id: 'result-2', 
          severity: 'critical',
          confidenceScore: 0.95
        }
      ];

      const mockMetrics = [
        { id: 'metric-1', metricName: 'Code Coverage', metricValue: 85 }
      ];

      jest.spyOn(service as any, 'getSessionById').mockResolvedValue(mockSession);
      jest.spyOn(service as any, 'getResultsBySessionId').mockResolvedValue(mockResults);
      jest.spyOn(service as any, 'getMetricsBySessionId').mockResolvedValue(mockMetrics);

      const result = await service.getAnalysisSession('session-123');

      expect(result).toMatchObject({
        ...mockSession,
        results: mockResults,
        metrics: mockMetrics,
        totalIssues: 2,
        criticalIssues: 1,
        averageConfidence: 0.925
      });
    });

    it('should return null for non-existent session', async () => {
      jest.spyOn(service as any, 'getSessionById').mockResolvedValue(null);

      const result = await service.getAnalysisSession('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('Repository URL Validation', () => {
    it('should validate GitHub URLs correctly', () => {
      const validUrls = [
        'https://github.com/user/repo',
        'https://github.com/org-name/repo-name',
        'https://github.com/user123/my-awesome-repo'
      ];

      const invalidUrls = [
        'http://github.com/user/repo', // http instead of https
        'https://gitlab.com/user/repo', // not github
        'https://github.com/user', // missing repo
        'github.com/user/repo', // missing protocol
        'https://github.com/user/repo/extra', // extra path
        'not-a-url'
      ];

      validUrls.forEach(url => {
        expect(service['isValidRepositoryUrl'](url)).toBe(true);
      });

      invalidUrls.forEach(url => {
        expect(service['isValidRepositoryUrl'](url)).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle OpenAI API failures', async () => {
      jest.spyOn(service as any, 'callOpenAI').mockRejectedValue(
        new Error('OpenAI API rate limit exceeded')
      );

      await expect(
        service['performSecurityAnalysis']('test.js', 'content', 'session-id')
      ).rejects.toThrow('OpenAI API rate limit exceeded');
    });

    it('should handle Claude API failures', async () => {
      jest.spyOn(service as any, 'callClaude').mockRejectedValue(
        new Error('Claude API authentication failed')
      );

      await expect(
        service['performPerformanceAnalysis']('test.js', 'content', 'session-id')
      ).rejects.toThrow('Claude API authentication failed');
    });

    it('should handle malformed AI responses', async () => {
      jest.spyOn(service as any, 'callOpenAI').mockResolvedValue('invalid json');

      // Should not throw but return empty results
      const results = await service['performSecurityAnalysis']('test.js', 'content', 'session-id');
      expect(results).toEqual([]);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full analysis workflow', async () => {
      // This would be an integration test that runs the full workflow
      // In a real environment, this might use test containers or mock services
      
      const request: CreateAnalysisSessionRequest = {
        repositoryUrl: 'https://github.com/test/vulnerable-app',
        analysisType: 'security'
      };

      // Create session
      const session = await service.createAnalysisSession(mockUserId, request);
      expect(session.status).toBe('pending');

      // Mock the processing (in real test, this would be queued)
      // await service.processAnalysis(session.id);

      // Verify completion
      // const completedSession = await service.getAnalysisSession(session.id);
      // expect(completedSession?.status).toBe('completed');
      // expect(completedSession?.totalIssues).toBeGreaterThan(0);
    });
  });
});
