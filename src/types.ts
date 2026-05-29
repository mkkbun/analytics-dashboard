/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TelemetryEvent {
  id: string;
  type: 'pageview' | 'custom';
  name: string;
  url: string;
  path: string;
  referrer: string;
  userId: string;
  sessionId: string;
  screen: string;
  lang: string;
  utm: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
  browser: string;
  device: string;
  country: string;
  timestamp: number;
  data?: Record<string, any>;
}

export interface AnalyticsOverview {
  totalPageviews: number;
  uniqueVisitors: number;
  bounceRate: number; // percentage (0-100)
  avgSessionDuration: number; // seconds
  deviceDistribution: { name: string; value: number }[];
  browserDistribution: { name: string; value: number }[];
  countryDistribution: { name: string; value: number }[];
  timeSeries: {
    date: string;
    views: number;
    uniques: number;
    bounceRate: number;
  }[];
}

export interface PageStat {
  path: string;
  views: number;
  uniques: number;
  avgTime: number; // seconds
  exitRate: number; // percentage
}

export interface FunnelStep {
  name: string;
  target: string; // e.g., "/" or "Purchase Event"
  type: 'path' | 'event';
}

export interface FunnelResultStep {
  stepIndex: number;
  name: string;
  target: string;
  count: number;
  conversionRate: number; // conversion from previous step (0-100)
  overallConversionRate: number; // conversion from step 0 (0-100)
  dropCount: number;
  dropRate: number;
}

export interface UserProfile {
  userId: string;
  firstSeen: number;
  lastSeen: number;
  totalPageviews: number;
  totalEvents: number;
  browser: string;
  device: string;
  country: string;
  sessionsCount: number;
  lastPath: string;
  events: TelemetryEvent[];
}
