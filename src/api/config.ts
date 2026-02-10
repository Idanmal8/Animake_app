export const API_BASE_URL = import.meta.env.PROD
  ? 'https://animake-api-997459958439.europe-west1.run.app'
  : import.meta.env.VITE_API_BASE_URL || '/api'
