import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LemonSqueezyProductData } from '@/types/lemon-squeezy'
import { paymentService } from '@/api/services/payment'

export const useProductStore = defineStore('products', () => {
  const products = ref<LemonSqueezyProductData[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchProducts = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await paymentService.getProducts()
      if (response && response.data) {
        products.value = response.data
      }
    } catch (err: any) {
      console.error('Failed to fetch products:', err)
      error.value = err.message || 'Failed to fetch products'
    } finally {
      isLoading.value = false
    }
  }

  return {
    products,
    isLoading,
    error,
    fetchProducts
  }
})
