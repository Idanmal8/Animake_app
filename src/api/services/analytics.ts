import posthog from 'posthog-js'

class AnalyticsService {
  private initialized = false

  init() {
    if (typeof window !== 'undefined' && !this.initialized) {
      // PLACEHOLDER: Replace with actual API key
      const apiKey = import.meta.env.VITE_POSTHOG_KEY || ''

      posthog.init(apiKey, {
        api_host: 'https://eu.i.posthog.com', // or 'https://app.posthog.com' depending on region, default to US
        person_profiles: 'identified_only',
        capture_pageview: true,
        autocapture: true, // Enable autocapture for clicks etc.
      })
      this.initialized = true
    }
  }

  identify(userId: string | number, email: string, name?: string) {
    if (!this.initialized) return
    posthog.identify(String(userId), {
      email,
      name,
    })
  }

  reset() {
    if (!this.initialized) return
    posthog.reset()
  }

  track(eventName: string, properties?: Record<string, any>) {
    if (!this.initialized) return
    posthog.capture(eventName, properties)
  }
}

export const analyticsService = new AnalyticsService()
