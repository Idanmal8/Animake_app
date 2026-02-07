import { httpClient } from '../httpClient'
import type { LemonSqueezyProductResponse } from '@/types/lemon-squeezy'
import type { TrialUsageResponse, IncrementTrialUsageRequest } from '@/types/payment'

export const paymentService = {
  getProducts: () => {
    return httpClient.get<LemonSqueezyProductResponse>('/payment/products')
  },
  
  getTrialUsage: (userId: number) => {
    return httpClient.get<TrialUsageResponse>(`/payment/trial-usage/${userId}`)
  },

  incrementTrialUsage: (data: IncrementTrialUsageRequest) => {
    return httpClient.post<TrialUsageResponse>('/payment/trial-usage/increment', data)
  }
}
