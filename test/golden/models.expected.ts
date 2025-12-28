// Generated: model interfaces
export interface User {
  email: string;
  name: string;
  isActive: boolean;
}

export interface Post {
  title: string;
  content: string;
  published: boolean;
  viewCount: number;
  authorId: string;
}

export interface Comment {
  text: string;
  postId: string;
  userId: string;
}
