interface AppConfig {
  youtube: {
    videoId: string;
  };
  assistant: {
    url: string;
    maxQuestions: number;
    localStorageKey: string;
  };
}

function getEnvVar(key: string, defaultValue: string): string {
  const value = (import.meta as any).env?.[key];
  return value ?? defaultValue;
}

function getEnvVarAsNumber(key: string, defaultValue: number): number {
  const value = getEnvVar(key, String(defaultValue));
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export const config: AppConfig = {
  youtube: {
    videoId: getEnvVar("COURSE_YOUTUBE_VIDEO_ID", "dQw4w9WgXcQ"),
  },
  assistant: {
    url: getEnvVar("AI_API_URL", "http://localhost:8787"),
    maxQuestions: getEnvVarAsNumber("AI_MAX_QUESTIONS", 10),
    localStorageKey: "ai_credits_used",
  },
};

export default config;
