/**
 * Tipos globales para el módulo de feedback
 */

export interface FeedbackRequest {
  name?: string;
  email?: string;
  subject: string;
  message: string;
  isAnonymous: boolean;
}

export interface FeedbackResponse {
  success: boolean;
  message?: string;
  feedbackId?: number;
  createdAt?: string;
  error?: string;
}

