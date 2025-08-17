/**
 * AI Analysis API Routes
 * RESTful endpoints for AI-powered code analysis
 */

import { Router, Request, Response } from 'express';
import { AiAnalysisService } from '../services/ai-analysis.service';
import { authenticateUser } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { CreateAnalysisSessionRequest } from '@codemod/database';

const router = Router();
const aiAnalysisService = new AiAnalysisService();

/**
 * POST /api/ai-analysis/sessions
 * Create a new AI analysis session
 */
router.post('/sessions', 
  authenticateUser,
  validateRequest({
    body: {
      repositoryUrl: { type: 'string', required: true },
      analysisType: { 
        type: 'string', 
        required: true, 
        enum: ['security', 'performance', 'quality', 'maintainability'] 
      },
      metadata: { type: 'object', required: false }
    }
  }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const request: CreateAnalysisSessionRequest = req.body;

      const session = await aiAnalysisService.createAnalysisSession(userId, request);

      res.status(201).json({
        success: true,
        data: session,
        message: 'Analysis session created successfully'
      });
    } catch (error) {
      console.error('Failed to create analysis session:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create analysis session'
      });
    }
  }
);

/**
 * GET /api/ai-analysis/sessions/:sessionId
 * Get analysis session with results
 */
router.get('/sessions/:sessionId',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      const session = await aiAnalysisService.getAnalysisSession(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Analysis session not found'
        });
      }

      // Check if user owns this session
      if (session.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this analysis session'
        });
      }

      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      console.error('Failed to get analysis session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve analysis session'
      });
    }
  }
);

/**
 * GET /api/ai-analysis/sessions
 * List user's analysis sessions with pagination
 */
router.get('/sessions',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 20,
        analysisType,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filters = {
        userId,
        ...(analysisType && { analysisType: analysisType as string }),
        ...(status && { status: status as string })
      };

      const pagination = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const sessions = await aiAnalysisService.getUserSessions(filters, pagination);

      res.json({
        success: true,
        data: sessions,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: sessions.length
        }
      });
    } catch (error) {
      console.error('Failed to list analysis sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve analysis sessions'
      });
    }
  }
);

/**
 * POST /api/ai-analysis/sessions/:sessionId/rerun
 * Rerun analysis for a session
 */
router.post('/sessions/:sessionId/rerun',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      // Verify ownership
      const session = await aiAnalysisService.getAnalysisSession(sessionId);
      if (!session || session.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: 'Analysis session not found'
        });
      }

      // Queue rerun
      await aiAnalysisService.rerunAnalysis(sessionId);

      res.json({
        success: true,
        message: 'Analysis rerun queued successfully'
      });
    } catch (error) {
      console.error('Failed to rerun analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to rerun analysis'
      });
    }
  }
);

/**
 * DELETE /api/ai-analysis/sessions/:sessionId
 * Delete an analysis session
 */
router.delete('/sessions/:sessionId',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      const deleted = await aiAnalysisService.deleteSession(sessionId, userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Analysis session not found'
        });
      }

      res.json({
        success: true,
        message: 'Analysis session deleted successfully'
      });
    } catch (error) {
      console.error('Failed to delete analysis session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete analysis session'
      });
    }
  }
);

/**
 * GET /api/ai-analysis/sessions/:sessionId/export
 * Export analysis results as JSON/CSV
 */
router.get('/sessions/:sessionId/export',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { format = 'json' } = req.query;
      const userId = req.user.id;

      const exportData = await aiAnalysisService.exportSession(
        sessionId, 
        userId, 
        format as string
      );

      if (!exportData) {
        return res.status(404).json({
          success: false,
          error: 'Analysis session not found'
        });
      }

      const contentType = format === 'csv' ? 'text/csv' : 'application/json';
      const filename = `analysis-${sessionId}.${format}`;

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(exportData);
    } catch (error) {
      console.error('Failed to export analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export analysis'
      });
    }
  }
);

export default router;
