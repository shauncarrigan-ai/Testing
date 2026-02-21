export type DayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

export interface TemplateItem {
  id: string;
  title: string;
  time?: string; // "HH:MM" – optional per-item reminder
  order: number;
  dueDate?: string; // "YYYY-MM-DD" – if set, this is a one-time item (not recurring)
}

export type WeeklyTemplate = Record<DayOfWeek, TemplateItem[]>;

export interface Project {
  id: string;
  title: string;
  color: string; // hex
  archived: boolean;
  order: number;
  createdAt: string; // ISO
}

/** 0 = root task, 1 = subtask, 2 = sub-subtask */
export type TaskLevel = 0 | 1 | 2;

export interface Task {
  id: string;
  projectId: string;
  parentId: string | null;
  level: TaskLevel;
  title: string;
  notes?: string;
  completed: boolean;
  completedAt?: string;
  assignedDays: DayOfWeek[];
  order: number;
  createdAt: string;
}

export type DailyItemSource = 'template' | 'project_task' | 'rollover';

export interface DailyItem {
  id: string;
  date: string; // "YYYY-MM-DD"
  source: DailyItemSource;
  templateItemId?: string;
  taskId?: string;
  projectId?: string;
  title: string;
  completed: boolean;
  rolledOverFromDate?: string;
  time?: string;
  order: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  dailyReminderTime: string; // "HH:MM"
  userId?: string;
}

export type RootStackParamList = {
  Main: undefined;
  TemplateEdit: { day: DayOfWeek };
  ProjectDetail: { projectId: string };
  Stats: undefined;
};

export type MainTabParamList = {
  Today: undefined;
  Calendar: undefined;
  Templates: undefined;
  Projects: undefined;
  Settings: undefined;
};
