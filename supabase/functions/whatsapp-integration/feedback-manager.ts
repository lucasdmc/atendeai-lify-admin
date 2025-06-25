
import { ConversationFeedbackManager } from './conversation-feedback.ts';

export class FeedbackManager {
  static processFeedback(phoneNumber: string, message: string): boolean {
    return ConversationFeedbackManager.processFeedback(phoneNumber, message);
  }

  static generateFeedbackResponse(rating: number): string {
    return ConversationFeedbackManager.generateFeedbackResponse(rating);
  }

  static shouldRequestFeedback(phoneNumber: string, messageCount: number): boolean {
    return ConversationFeedbackManager.shouldRequestFeedback(phoneNumber, messageCount);
  }

  static requestFeedback(phoneNumber: string): string {
    return ConversationFeedbackManager.requestFeedback(phoneNumber);
  }

  static addFeedbackToResponse(responseToSend: string, phoneNumber: string, messageCount: number): string {
    // Sistema de feedback inteligente - menos intrusivo
    if (this.shouldRequestFeedback(phoneNumber, messageCount) && Math.random() < 0.3) {
      const feedbackRequest = this.requestFeedback(phoneNumber);
      return `${responseToSend}\n\n${feedbackRequest}`;
    }
    return responseToSend;
  }
}
