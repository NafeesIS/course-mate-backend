export interface FeedbackDocument {
  overall: number;
  website: number;
  recommend: number;
  support: number;
  feedback?: string;
  userType: 'guest' | 'registered';
  userEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}
