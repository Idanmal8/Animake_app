import { httpClient } from '../httpClient'

export interface Subscription {
    id: number;
    userId: number;
    isActive: boolean;
    cycle: 'monthly' | 'annually';
    startDate: string;
    endDate: string;
    autoRenewal: boolean;
}

export const subscriptionService = {
    getSubscription: (userId: number) => {
        return httpClient.get<Subscription>(`/subscription/${userId}`)
    },
    createSubscription: (data: { userId: number, cycle: 'monthly' | 'annually' }) => {
        return httpClient.post<Subscription>('/subscription', data)
    },
    cancelSubscription: (userId: number) => {
        return httpClient.post<Subscription>('/subscription/cancel', { userId })
    }
}
