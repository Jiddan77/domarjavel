type TelemetryEvent = {
  id: string;
  type: 'filter_change' | 'drill_down' | 'vote' | 'page_view' | 'team_select' | 'ranking_view';
  timestamp: number;
  data: any;
  sessionId: string;
};

class TelemetryManager {
  private events: TelemetryEvent[] = [];
  private sessionId: string;
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadFromStorage();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('dommarjavel_telemetry');
      if (stored) {
        const data = JSON.parse(stored);
        this.events = data.events || [];
        // Keep only last 1000 events to prevent storage bloat
        if (this.events.length > 1000) {
          this.events = this.events.slice(-1000);
        }
      }
    } catch (error) {
      console.warn('Failed to load telemetry data:', error);
      this.events = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('dommarjavel_telemetry', JSON.stringify({
        events: this.events,
        sessionId: this.sessionId
      }));
    } catch (error) {
      console.warn('Failed to save telemetry data:', error);
    }
  }

  track(type: TelemetryEvent['type'], data: any = {}) {
    if (!this.isEnabled) return;

    const event: TelemetryEvent = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      data,
      sessionId: this.sessionId
    };

    this.events.push(event);
    this.saveToStorage();

    // Optional: Send to analytics service
    // this.sendToAnalytics(event);
  }

  getEvents(type?: TelemetryEvent['type'], limit?: number): TelemetryEvent[] {
    let filtered = type ? this.events.filter(e => e.type === type) : this.events;
    return limit ? filtered.slice(-limit) : filtered;
  }

  getSummary() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    const recentEvents = this.events.filter(e => now - e.timestamp < oneDay);
    const hourlyEvents = this.events.filter(e => now - e.timestamp < oneHour);

    const eventCounts = this.events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents: this.events.length,
      recentEvents: recentEvents.length,
      hourlyEvents: hourlyEvents.length,
      eventTypes: eventCounts,
      sessionId: this.sessionId,
      firstEvent: this.events[0]?.timestamp,
      lastEvent: this.events[this.events.length - 1]?.timestamp
    };
  }

  clearData() {
    this.events = [];
    this.sessionId = this.generateSessionId();
    localStorage.removeItem('dommarjavel_telemetry');
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
}

// Global telemetry instance
export const telemetry = new TelemetryManager();

// Convenience functions
export const trackFilterChange = (filters: any) => 
  telemetry.track('filter_change', filters);

export const trackDrillDown = (type: string, target: string) => 
  telemetry.track('drill_down', { type, target });

export const trackVote = (referee: string, vote: 'up' | 'down', team?: string) => 
  telemetry.track('vote', { referee, vote, team });

export const trackPageView = (page: string) => 
  telemetry.track('page_view', { page });

export const trackTeamSelect = (team: string) => 
  telemetry.track('team_select', { team });

export const trackRankingView = (rankingType: string, sortOrder: string) => 
  telemetry.track('ranking_view', { rankingType, sortOrder });