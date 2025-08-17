# AI Analysis Integration Guide

## Overview

The AI Analysis feature provides comprehensive code analysis using multiple AI providers (OpenAI GPT-4, Anthropic Claude, Google Gemini) to identify security vulnerabilities, performance issues, code quality problems, and maintainability concerns.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   API Service   │    │   Database      │
│                 │    │                 │    │                 │
│ - Dashboard     │◄──►│ - Routes        │◄──►│ - Sessions      │
│ - Results View  │    │ - Service       │    │ - Results       │
│ - Filters       │    │ - AI Providers  │    │ - Metrics       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  AI Providers   │
                    │                 │
                    │ - OpenAI GPT-4  │
                    │ - Claude-3      │
                    │ - Gemini Pro    │
                    └─────────────────┘
```

## Stack Dependencies

This feature is built as a stacked development workflow:

1. **Database Layer** (`feature/ai-analysis-database`)
   - Database schema and migrations
   - TypeScript type definitions
   - Core data models

2. **API Layer** (`feature/ai-analysis-api`)
   - RESTful API endpoints
   - Business logic service
   - AI provider integrations
   - Authentication and validation

3. **Frontend Layer** (`feature/ai-analysis-ui`)
   - React components
   - Dashboard interface
   - Results visualization
   - Export functionality

4. **Integration Layer** (`feature/ai-analysis-integration`)
   - Comprehensive test suite
   - Documentation
   - Deployment configuration
   - Performance monitoring

## API Endpoints

### Create Analysis Session
```http
POST /api/ai-analysis/sessions
Content-Type: application/json
Authorization: Bearer <token>

{
  "repositoryUrl": "https://github.com/user/repo",
  "analysisType": "security",
  "metadata": {
    "branch": "main",
    "includeTests": false
  }
}
```

### Get Analysis Results
```http
GET /api/ai-analysis/sessions/{sessionId}
Authorization: Bearer <token>
```

### List User Sessions
```http
GET /api/ai-analysis/sessions?page=1&limit=20&analysisType=security&status=completed
Authorization: Bearer <token>
```

### Export Results
```http
GET /api/ai-analysis/sessions/{sessionId}/export?format=json
Authorization: Bearer <token>
```

## Analysis Types

### Security Analysis
- SQL injection vulnerabilities
- XSS vulnerabilities
- Authentication/authorization issues
- Input validation problems
- Cryptographic issues
- Dependency vulnerabilities

### Performance Analysis
- Inefficient algorithms
- Memory leaks
- Database query optimization
- Blocking operations
- Resource usage patterns

### Code Quality Analysis
- Code complexity metrics
- Naming conventions
- Documentation coverage
- Design patterns usage
- SOLID principles adherence

### Maintainability Analysis
- Technical debt assessment
- Code duplication
- Coupling and cohesion
- Refactoring opportunities
- Architecture compliance

## AI Provider Configuration

### OpenAI GPT-4
```typescript
const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
  maxTokens: 4000,
  temperature: 0.1
};
```

### Anthropic Claude
```typescript
const claudeConfig = {
  apiKey: process.env.CLAUDE_API_KEY,
  model: 'claude-3-sonnet-20240229',
  maxTokens: 4000
};
```

### Google Gemini
```typescript
const geminiConfig = {
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-pro',
  generationConfig: {
    temperature: 0.1,
    maxOutputTokens: 4000
  }
};
```

## Database Schema

### Sessions Table
```sql
CREATE TABLE ai_analysis_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    repository_url VARCHAR(500) NOT NULL,
    analysis_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);
```

### Results Table
```sql
CREATE TABLE ai_analysis_results (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES ai_analysis_sessions(id),
    file_path VARCHAR(1000) NOT NULL,
    line_number INTEGER,
    severity VARCHAR(20) NOT NULL,
    category VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    suggestion TEXT,
    confidence_score DECIMAL(3,2),
    ai_model VARCHAR(100) NOT NULL
);
```

## Frontend Components

### AnalysisDashboard
Main dashboard component for managing analysis sessions:
- Session creation
- Status monitoring
- Results overview
- Filtering and sorting

### AnalysisResultsView
Detailed results viewer with:
- Issue categorization
- Severity filtering
- Code location mapping
- Export functionality

### Key Features
- Real-time status updates
- Responsive design
- Accessibility compliance
- Progressive loading
- Error boundary handling

## Testing Strategy

### Unit Tests
- Service method testing
- API endpoint testing
- Component rendering tests
- Utility function tests

### Integration Tests
- Full workflow testing
- Database integration
- AI provider mocking
- Error scenario testing

### End-to-End Tests
- User journey testing
- Cross-browser compatibility
- Performance testing
- Security testing

## Deployment Configuration

### Environment Variables
```bash
# AI Provider Keys
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-...
GEMINI_API_KEY=AI...

# Database
DATABASE_URL=postgresql://...

# Redis (for job queue)
REDIS_URL=redis://...

# Application
NODE_ENV=production
API_BASE_URL=https://api.codemod.com
```

### Docker Configuration
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-analysis-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-analysis-service
  template:
    metadata:
      labels:
        app: ai-analysis-service
    spec:
      containers:
      - name: ai-analysis
        image: codemod/ai-analysis:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

## Performance Considerations

### Caching Strategy
- Redis for session caching
- CDN for static assets
- Database query optimization
- AI response caching

### Scaling
- Horizontal pod autoscaling
- Database connection pooling
- Queue-based processing
- Load balancing

### Monitoring
- Application metrics
- AI provider usage tracking
- Error rate monitoring
- Performance profiling

## Security Measures

### Authentication
- JWT token validation
- Role-based access control
- Session management
- API rate limiting

### Data Protection
- Encryption at rest
- Secure API communication
- PII data handling
- Audit logging

### AI Provider Security
- API key rotation
- Request sanitization
- Response validation
- Usage monitoring

## Usage Examples

### Basic Security Analysis
```typescript
const session = await aiAnalysisService.createAnalysisSession(userId, {
  repositoryUrl: 'https://github.com/myorg/myapp',
  analysisType: 'security',
  metadata: { branch: 'main' }
});

// Monitor progress
const results = await aiAnalysisService.getAnalysisSession(session.id);
console.log(`Found ${results.totalIssues} issues, ${results.criticalIssues} critical`);
```

### Batch Analysis
```typescript
const analysisTypes = ['security', 'performance', 'quality'];
const sessions = await Promise.all(
  analysisTypes.map(type => 
    aiAnalysisService.createAnalysisSession(userId, {
      repositoryUrl: 'https://github.com/myorg/myapp',
      analysisType: type
    })
  )
);
```

## Troubleshooting

### Common Issues
1. **AI Provider Rate Limits**: Implement exponential backoff
2. **Large Repository Timeouts**: Add chunked processing
3. **Memory Issues**: Optimize file processing
4. **Database Locks**: Use connection pooling

### Debug Mode
```bash
DEBUG=ai-analysis:* npm start
```

### Health Checks
```http
GET /api/health/ai-analysis
```

## Future Enhancements

### Planned Features
- Custom rule definitions
- Team collaboration features
- Integration with CI/CD pipelines
- Advanced reporting and analytics
- Multi-language support
- Real-time collaboration

### AI Model Improvements
- Fine-tuned models for specific languages
- Custom training on codebase patterns
- Ensemble model predictions
- Confidence score calibration

## Contributing

### Development Setup
```bash
git checkout feature/ai-analysis-integration
npm install
npm run dev
```

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Jest testing framework

### Pull Request Process
1. Create feature branch from current stack
2. Implement changes with tests
3. Update documentation
4. Submit PR with detailed description
5. Code review and approval
6. Merge to stack

This integration guide provides comprehensive documentation for the AI Analysis feature implementation across the entire stack.
