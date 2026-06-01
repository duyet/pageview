import crypto from 'crypto'
import { PageViewAdapter, PageViewEvent } from './types'

export class WebhookAdapter implements PageViewAdapter {
  name = 'Webhook'
  enabled = !!process.env.WEBHOOK_URL

  private webhookUrl = process.env.WEBHOOK_URL || ''
  private webhookSecret = process.env.WEBHOOK_SECRET || ''

  async initialize(): Promise<void> {
    if (this.enabled) {
      console.log(
        `Webhook Adapter initialized. Target URL: "${this.webhookUrl}"`
      )
      if (this.webhookSecret) {
        console.log('Webhook payload signing is enabled.')
      }
    }
  }

  async broadcast(event: PageViewEvent): Promise<void> {
    if (!this.enabled) return

    try {
      const bodyString = JSON.stringify(event)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'pageview-analytics-webhook/1.0',
      }

      // If a secret is provided, sign the payload for security verification
      if (this.webhookSecret) {
        const signature = crypto
          .createHmac('sha256', this.webhookSecret)
          .update(bodyString)
          .digest('hex')

        headers['X-Webhook-Signature'] = signature
      }

      // Send the request with a 3-second timeout limit to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers,
        body: bodyString,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(
          `Webhook responded with HTTP status ${response.status}: ${response.statusText}`
        )
      }
    } catch (err) {
      console.error('Webhook broadcast failed:', err)
      throw err
    }
  }
}
