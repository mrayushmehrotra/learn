import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config/index.js';
import { logger } from '../../config/logger.js';
import { ExternalServiceError } from '../../shared/errors/index.js';
import type { AIReviewRequest, AIReviewResult, AIReviewComment } from './claude.types.js';
import { SEVERITY, type Severity } from '../../shared/constants/index.js';

// Re-export types for convenience
export type { AIReviewRequest, AIReviewResult, AIReviewComment } from './claude.types.js';

export interface IClaudeService {
    reviewCode(request: AIReviewRequest): Promise<AIReviewResult>;
}

export class ClaudeService implements IClaudeService {
    private client: Anthropic;

    constructor() {
        this.client = new Anthropic({
            apiKey: config.ANTHROPIC_API_KEY,
        });
    }

    async reviewCode(request: AIReviewRequest): Promise<AIReviewResult> {
        try {
            const systemPrompt = this.buildSystemPrompt();
            const userPrompt = this.buildUserPrompt(request);

            logger.info('Sending code review request to Claude', {
                prTitle: request.prTitle,
                diffLength: request.diff.length,
            });

            const response = await this.client.messages.create({
                model: config.CLAUDE_MODEL,
                max_tokens: config.CLAUDE_MAX_TOKENS,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: userPrompt,
                    },
                ],
            });

            // Extract text content
            const textContent = response.content.find((c) => c.type === 'text');
            if (!textContent || textContent.type !== 'text') {
                throw new Error('No text response from Claude');
            }

            // Parse JSON response
            const result = this.parseResponse(textContent.text);

            logger.info('Code review completed', {
                commentsCount: result.comments.length,
                overallRating: result.overallRating,
            });

            return result;
        } catch (error) {
            logger.error('Claude API error:', error);
            if (error instanceof Anthropic.APIError) {
                throw new ExternalServiceError('Claude', error.message);
            }
            throw new ExternalServiceError('Claude', 'Failed to analyze code');
        }
    }

    private buildSystemPrompt(): string {
        return `You are an expert code reviewer. Analyze the provided code diff and provide actionable feedback.

Rules:
1. Be concise and specific - reference exact file paths and line numbers when possible
2. Categorize issues into: security, performance, bugs, code-quality, best-practices, maintainability
3. Assign severity: critical (must fix - bugs, security issues), warning (should fix - code quality), info (informational), suggestion (optional improvements)
4. Don't comment on style preferences unless they impact readability significantly
5. Acknowledge good patterns when present in the summary
6. Never hallucinate - only comment on code that is visible in the diff
7. Focus on the changed lines (lines starting with + or -)
8. For critical issues, explain WHY it's a problem and HOW to fix it

Format your response as valid JSON matching this structure:
{
  "summary": "Brief overview of the PR quality and main findings",
  "overallRating": "approve" | "request_changes" | "comment",
  "comments": [
    {
      "filePath": "path/to/file.ts",
      "lineNumber": 42,
      "severity": "critical" | "warning" | "info" | "suggestion",
      "category": "security" | "performance" | "bugs" | "code-quality" | "best-practices" | "maintainability",
      "message": "Clear, actionable feedback",
      "codeSnippet": "relevant code if helpful"
    }
  ]
}

IMPORTANT: Return ONLY valid JSON, no markdown code blocks or additional text.`;
    }

    private buildUserPrompt(request: AIReviewRequest): string {
        // Truncate diff if too long (to stay within token limits)
        const maxDiffLength = 15000;
        let diff = request.diff;
        if (diff.length > maxDiffLength) {
            diff = diff.substring(0, maxDiffLength) + '\n\n... [diff truncated due to length]';
        }

        return `Review this pull request:

**Title:** ${request.prTitle}
**Description:** ${request.prDescription || 'No description provided'}
**Base Branch:** ${request.baseBranch} ← **Head Branch:** ${request.headBranch}

**Diff:**
\`\`\`diff
${diff}
\`\`\`

Analyze the code changes and provide your review as JSON.`;
    }

    private parseResponse(text: string): AIReviewResult {
        try {
            // Try to extract JSON from the response
            let jsonText = text.trim();

            // Remove markdown code blocks if present
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.slice(7);
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.slice(3);
            }
            if (jsonText.endsWith('```')) {
                jsonText = jsonText.slice(0, -3);
            }
            jsonText = jsonText.trim();

            const parsed = JSON.parse(jsonText) as {
                summary?: string;
                overallRating?: string;
                comments?: Array<{
                    filePath?: string;
                    lineNumber?: number | null;
                    severity?: string;
                    category?: string;
                    message?: string;
                    codeSnippet?: string | null;
                }>;
            };

            // Validate and normalize the response
            const validRatings = ['approve', 'request_changes', 'comment'];
            const overallRating = validRatings.includes(parsed.overallRating ?? '')
                ? (parsed.overallRating as 'approve' | 'request_changes' | 'comment')
                : 'comment';

            const comments: AIReviewComment[] = (parsed.comments ?? []).map((c) => ({
                filePath: c.filePath ?? 'unknown',
                lineNumber: typeof c.lineNumber === 'number' ? c.lineNumber : null,
                severity: this.validateSeverity(c.severity),
                category: c.category ?? 'code-quality',
                message: c.message ?? 'No message provided',
                codeSnippet: c.codeSnippet ?? null,
            }));

            return {
                summary: parsed.summary ?? 'No summary provided',
                overallRating,
                comments,
            };
        } catch (error) {
            logger.error('Failed to parse Claude response:', { text, error });

            // Return a fallback response
            return {
                summary: 'Failed to parse AI review. Please check the PR manually.',
                overallRating: 'comment',
                comments: [],
            };
        }
    }

    private validateSeverity(severity: string | undefined): Severity {
        const validSeverities = Object.values(SEVERITY);
        if (severity && validSeverities.includes(severity as Severity)) {
            return severity as Severity;
        }
        return SEVERITY.INFO;
    }
}

// Export singleton instance
export const claudeService = new ClaudeService();
