import { BiConversation, BiMessage } from './biTypes';

export class BiConversationManager {
  private static conversations: Map<string, BiConversation> = new Map();
  private static messages: Map<string, BiMessage[]> = new Map();

  static {
    // Seed default starter conversation thread
    const defaultId = 'conv_general_today';
    this.conversations.set(defaultId, {
      id: defaultId,
      title: 'Executive Store Intelligence',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessageSnippet: 'How can I assist your showroom management today?',
      messageCount: 1,
    });

    this.messages.set(defaultId, [
      {
        id: 'msg_welcome',
        conversationId: defaultId,
        role: 'assistant',
        content: `👋 **வணக்கம்! Welcome to ரத்னா விலாஸ் Business AI!**\n\nநான் உங்கள் ஸ்டோர் அசிஸ்டன்ட். விற்பனை நிலவரம் (**Sales performance**), குறைந்த இருப்பு (**Inventory restocking**), தேவை முன்னறிவிப்பு (**Demand forecasts**), அல்லது இடர் எச்சரிக்கைகள் (**Operational risk alerts**) பற்றி என்னிடம் தமிழில் அல்லது ஆங்கிலத்தில் கேட்கலாம்.\n\nTry asking:\n• *"How are sales today compared to yesterday?"*\n• *"Which fast-moving products have less than 10 days of stock?"*\n• *"Show sales trend for the last 7 days"*\n• *"இன்னைக்கு sales எப்படி இருக்கு?"*`,
        timestamp: new Date().toISOString(),
        suggestedFollowUps: [
          'How much did we sell today?',
          'Which products need restocking?',
          'Show 7-day sales trend',
          'Is there anything unusual today?',
        ],
      },
    ]);
  }

  public static getConversations(userId?: number): BiConversation[] {
    const list = Array.from(this.conversations.values());
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public static getOrCreateConversation(id?: string, userId?: number): BiConversation {
    if (id && this.conversations.has(id)) {
      return this.conversations.get(id)!;
    }

    const newId = id || `conv_${Date.now()}`;
    const newConv: BiConversation = {
      id: newId,
      title: 'New Discussion',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId,
      messageCount: 0,
    };
    this.conversations.set(newId, newConv);
    this.messages.set(newId, []);
    return newConv;
  }

  public static getMessages(conversationId: string): BiMessage[] {
    return this.messages.get(conversationId) || [];
  }

  public static getRecentContext(conversationId: string, limit = 6): BiMessage[] {
    const msgs = this.messages.get(conversationId) || [];
    return msgs.slice(-limit);
  }

  public static addMessage(conversationId: string, message: BiMessage): void {
    if (!this.messages.has(conversationId)) {
      this.messages.set(conversationId, []);
    }
    const thread = this.messages.get(conversationId)!;
    thread.push(message);

    const conv = this.conversations.get(conversationId);
    if (conv) {
      conv.updatedAt = new Date().toISOString();
      conv.messageCount = thread.length;
      conv.lastMessageSnippet = message.content.slice(0, 75).replace(/\n/g, ' ');
      if (conv.title === 'New Discussion' && message.role === 'user') {
        conv.title = message.content.slice(0, 32) + (message.content.length > 32 ? '...' : '');
      }
    }
  }

  public static clearConversation(conversationId: string): boolean {
    this.messages.set(conversationId, []);
    const conv = this.conversations.get(conversationId);
    if (conv) {
      conv.messageCount = 0;
      conv.lastMessageSnippet = 'Conversation cleared.';
    }
    return true;
  }

  public static deleteConversation(conversationId: string): boolean {
    this.conversations.delete(conversationId);
    this.messages.delete(conversationId);
    return true;
  }
}
