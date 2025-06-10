export interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface Board {
  _id: string;
  title: string;
  description?: string;
  color: string;
  owner: User;
  collaborators: BoardMember[];
  lists: List[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardMember {
  user: User;
  role: "owner" | "collaborator";
  joinedAt: string;
}

export interface List {
  _id: string;
  title: string;
  boardId: string;
  position: number;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  _id: string;
  title: string;
  description?: string;
  listId: string;
  boardId: string;
  position: number;
  labels: Label[];
  assignees: User[];
  dueDate?: string;
  comments: Comment[];
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface Label {
  _id: string;
  name: string;
  color: string;
}

export interface Comment {
  _id: string;
  content: string;
  cardId: string;
  author: User;
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  _id: string;
  boardId: string;
  email: string;
  role: "collaborator";
  token: string;
  status: "pending" | "accepted" | "expired";
  invitedBy: User;
  createdAt: string;
  expiresAt: string;
}

export interface AuditLog {
  _id: string;
  action: string;
  user: User;
  board: string;
  details: string;
  timestamp: string;
}

// Socket event types
export interface SocketEvents {
  // Board events
  "board.update": (board: Board) => void;
  "board.member.join": (member: BoardMember) => void;
  "board.member.leave": (userId: string) => void;

  // List events
  "list.create": (list: List) => void;
  "list.update": (list: List) => void;
  "list.delete": (listId: string) => void;
  "list.reorder": (lists: List[]) => void;

  // Card events
  "card.create": (card: Card) => void;
  "card.update": (card: Card) => void;
  "card.delete": (cardId: string) => void;
  "card.move": (cardId: string, listId: string, position: number) => void;
  "card.reorder": (cards: Card[]) => void;

  // Comment events
  "comment.create": (comment: Comment) => void;
  "comment.update": (comment: Comment) => void;
  "comment.delete": (commentId: string) => void;

  // User presence
  "user.join": (user: User) => void;
  "user.leave": (userId: string) => void;
  "user.cursor": (userId: string, x: number, y: number) => void;
}
