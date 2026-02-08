/**
 * User-related API response types (from backend http/api/users.dart).
 */
export interface OnboardingState {
  completed?: boolean;
  acquisition_source?: string;
  display_name?: string | null;
  primary_language?: string | null;
  [key: string]: unknown;
}

/** Acquisition source options for "How did you find us?" */
export const ACQUISITION_SOURCES = ['tiktok', 'youtube', 'instagram', 'x'] as const;
export type AcquisitionSource = (typeof ACQUISITION_SOURCES)[number];

/** Primary language options for onboarding */
export const PRIMARY_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'hi', label: 'Hindi' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
] as const;

export interface UserUsageResponse {
  [key: string]: unknown;
}

export interface DailySummarySettings {
  enabled: boolean;
  hour: number;
}
