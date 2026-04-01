import Dexie, { Table } from 'dexie';
import { Conversation, Message } from '../types';

class AppDatabase extends Dexie {
  conversations!: Table<Conversation, string>;
  messages!: Table<Message, string>;

  constructor() {
    super('YuJieDatabase');
    this.version(1).stores({
      conversations: 'id, title, model, createdAt, updatedAt',
      messages: 'id, conversationId, role, content, createdAt',
    });
  }
}

export const db = new AppDatabase();
