export interface JaGrowConfig {
  baseUrl: string;
  userId: string;
}

export class JaGrowSDK {
  private baseUrl: string;
  private userId: string | null = null;
  private assignments: Map<string, any> = new Map();

  constructor(config: JaGrowConfig) {
    this.baseUrl = config.baseUrl;
    this.userId = config.userId;
  }

  async getAssignment(experimentId: string): Promise<any> {
    if (this.assignments.has(experimentId)) {
      return this.assignments.get(experimentId);
    }

    try {
      const response = await fetch(`${this.baseUrl}/experiments/${experimentId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: this.userId }),
      });

      if (!response.ok) {
        console.error(`Failed to fetch assignment for ${experimentId}`);
        return null; // Fallback to control
      }

      const variation = await response.json();
      this.assignments.set(experimentId, variation);
      return variation;
    } catch (error) {
      console.error('Error fetching assignment', error);
      return null;
    }
  }

  async track(eventName: string, properties: object = {}) {
    if (!this.userId) {
       console.warn('Cannot track event: userId not set');
       return;
    }

    try {
      await fetch(`${this.baseUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          eventName,
          properties,
        }),
      });
    } catch (error) {
      console.error('Error tracking event', error);
    }
  }
}
