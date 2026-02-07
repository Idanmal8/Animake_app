export interface TrialUsageResponse {
  numberOfGenerations: number;
  remaining: number;
}
export interface IncrementTrialUsageRequest {
  userId: number;
  userEmail: string;
}
