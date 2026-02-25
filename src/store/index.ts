import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DayOfWeek,
  TemplateItem,
  WeeklyTemplate,
  Project,
  Task,
  TaskLevel,
  DailyItem,
  AppSettings,
} from '../types';
import {
  generateId,
  getTodayString,
  getDayOfWeek,
  addDays,
} from '../utils/dateUtils';

// ─── Defaults ────────────────────────────────────────────────────────────────

const emptyTemplate = (): WeeklyTemplate => ({
  sunday: [],
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
});

const defaultSettings: AppSettings = {
  theme: 'system',
  clockFormat: '12',
  notificationsEnabled: true,
  dailyReminderTime: '08:00',
};

// ─── State interface ──────────────────────────────────────────────────────────

interface AppState {
  weeklyTemplate: WeeklyTemplate;
  oneTimeItems: TemplateItem[];
  projects: Project[];
  tasks: Task[];
  dailyItems: Record<string, DailyItem[]>;
  settings: AppSettings;
  lastProcessedDate: string | null;

  // ── Template actions ──
  addTemplateItem: (day: DayOfWeek, title: string, time?: string) => void;
  updateTemplateItem: (day: DayOfWeek, id: string, updates: Partial<TemplateItem>) => void;
  deleteTemplateItem: (day: DayOfWeek, id: string) => void;
  skipTemplateItemForDate: (day: DayOfWeek, id: string, date: string) => void;
  reorderTemplateItems: (day: DayOfWeek, items: TemplateItem[]) => void;
  addOneTimeItem: (title: string, dueDate: string, time?: string) => void;
  deleteOneTimeItem: (id: string) => void;

  // ── Project actions ──
  addProject: (title: string, color: string) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  archiveProject: (id: string) => void;
  deleteProject: (id: string) => void;

  // ── Task actions ──
  addTask: (projectId: string, parentId: string | null, title: string) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  assignTaskToDays: (taskId: string, days: DayOfWeek[]) => void;

  // ── Daily actions ──
  generateDailyItems: (date: string) => void;
  toggleDailyItem: (date: string, itemId: string) => void;
  processRollover: (fromDate: string, toDate: string) => void;
  syncTaskCompletionToDailyItems: (taskId: string, completed: boolean, date: string) => void;
  reorderDailyItems: (date: string, orderedIds: string[]) => void;

  // ── Settings ──
  updateSettings: (updates: Partial<AppSettings>) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      weeklyTemplate: emptyTemplate(),
      oneTimeItems: [],
      projects: [],
      tasks: [],
      dailyItems: {},
      settings: defaultSettings,
      lastProcessedDate: null,

      // ── Template ────────────────────────────────────────────────────────────

      addTemplateItem: (day, title, time) => {
        set((s) => {
          const items = s.weeklyTemplate[day];
          const newItem: TemplateItem = {
            id: generateId(),
            title: title.trim(),
            time,
            order: items.length,
          };
          return {
            weeklyTemplate: {
              ...s.weeklyTemplate,
              [day]: [...items, newItem],
            },
          };
        });
      },

      updateTemplateItem: (day, id, updates) => {
        set((s) => ({
          weeklyTemplate: {
            ...s.weeklyTemplate,
            [day]: s.weeklyTemplate[day].map((item) =>
              item.id === id ? { ...item, ...updates } : item
            ),
          },
        }));
      },

      deleteTemplateItem: (day, id) => {
        set((s) => ({
          weeklyTemplate: {
            ...s.weeklyTemplate,
            [day]: s.weeklyTemplate[day]
              .filter((item) => item.id !== id)
              .map((item, i) => ({ ...item, order: i })),
          },
          dailyItems: Object.fromEntries(
            Object.entries(s.dailyItems).map(([date, items]) => [
              date,
              items.filter((it) => it.templateItemId !== id),
            ])
          ),
        }));
      },

      skipTemplateItemForDate: (day, id, date) => {
        set((s) => ({
          weeklyTemplate: {
            ...s.weeklyTemplate,
            [day]: s.weeklyTemplate[day].map((item) =>
              item.id === id
                ? { ...item, skippedDates: [...(item.skippedDates ?? []), date] }
                : item
            ),
          },
          // Also remove from dailyItems for that date if already generated
          dailyItems: {
            ...s.dailyItems,
            [date]: (s.dailyItems[date] ?? []).filter((it) => it.templateItemId !== id),
          },
        }));
      },

      reorderTemplateItems: (day, items) => {
        set((s) => ({
          weeklyTemplate: {
            ...s.weeklyTemplate,
            [day]: items.map((item, i) => ({ ...item, order: i })),
          },
        }));
      },

      addOneTimeItem: (title, dueDate, time) => {
        set((s) => {
          const newItem: TemplateItem = {
            id: generateId(),
            title: title.trim(),
            time,
            dueDate,
            order: s.oneTimeItems.length,
          };
          return { oneTimeItems: [...s.oneTimeItems, newItem] };
        });
      },

      deleteOneTimeItem: (id) => {
        set((s) => ({
          oneTimeItems: s.oneTimeItems.filter((item) => item.id !== id),
        }));
      },

      // ── Projects ────────────────────────────────────────────────────────────

      addProject: (title, color) => {
        const project: Project = {
          id: generateId(),
          title: title.trim(),
          color,
          archived: false,
          order: get().projects.length,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ projects: [...s.projects, project] }));
        return project;
      },

      updateProject: (id, updates) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      archiveProject: (id) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, archived: true } : p
          ),
        }));
      },

      deleteProject: (id) => {
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          tasks: s.tasks.filter((t) => t.projectId !== id),
        }));
      },

      // ── Tasks ───────────────────────────────────────────────────────────────

      addTask: (projectId, parentId, title) => {
        const state = get();
        const parent = parentId
          ? state.tasks.find((t) => t.id === parentId) ?? null
          : null;
        const level: TaskLevel =
          parent !== null
            ? (Math.min(parent.level + 1, 2) as TaskLevel)
            : 0;
        const siblings = state.tasks.filter(
          (t) => t.projectId === projectId && t.parentId === parentId
        );
        const task: Task = {
          id: generateId(),
          projectId,
          parentId,
          level,
          title: title.trim(),
          completed: false,
          assignedDays: [],
          order: siblings.length,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        return task;
      },

      updateTask: (id, updates) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteTask: (id) => {
        const allTasks = get().tasks;
        const toDelete = new Set<string>([id]);
        const collectDescendants = (parentId: string) => {
          allTasks
            .filter((t) => t.parentId === parentId)
            .forEach((t) => {
              toDelete.add(t.id);
              collectDescendants(t.id);
            });
        };
        collectDescendants(id);
        set((s) => ({ tasks: s.tasks.filter((t) => !toDelete.has(t.id)) }));
      },

      toggleTask: (id) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: !t.completed
                    ? new Date().toISOString()
                    : undefined,
                }
              : t
          ),
        }));
      },

      assignTaskToDays: (taskId, days) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, assignedDays: days } : t
          ),
        }));
      },

      // ── Daily ───────────────────────────────────────────────────────────────

      generateDailyItems: (date) => {
        const s = get();
        const existing = s.dailyItems[date] ?? [];
        const dow = getDayOfWeek(date);
        const templateItems = s.weeklyTemplate[dow];
        const oneTimeForDate = s.oneTimeItems.filter((ti) => ti.dueDate === date);
        const assignedTasks = s.tasks.filter(
          (t) => t.assignedDays.includes(dow) && !t.completed
        );

        const newItems: DailyItem[] = [];
        let order = existing.length;

        // Add recurring template items not already present
        templateItems.forEach((ti) => {
          const alreadyExists = existing.some(
            (it) => it.templateItemId === ti.id && it.source === 'template'
          );
          if (!alreadyExists) {
            newItems.push({
              id: generateId(),
              date,
              source: 'template',
              templateItemId: ti.id,
              title: ti.title,
              completed: false,
              time: ti.time,
              order: order++,
            });
          }
        });

        // Add one-time items due on this date
        oneTimeForDate.forEach((ti) => {
          const alreadyExists = existing.some(
            (it) => it.templateItemId === ti.id && it.source === 'template'
          );
          if (!alreadyExists) {
            newItems.push({
              id: generateId(),
              date,
              source: 'template',
              templateItemId: ti.id,
              title: ti.title,
              completed: false,
              time: ti.time,
              order: order++,
            });
          }
        });

        // Add project task items not already present
        assignedTasks.forEach((task) => {
          const alreadyExists = existing.some(
            (it) => it.taskId === task.id && it.source === 'project_task'
          );
          if (!alreadyExists) {
            newItems.push({
              id: generateId(),
              date,
              source: 'project_task',
              taskId: task.id,
              projectId: task.projectId,
              title: task.title,
              completed: false,
              order: order++,
            });
          }
        });

        if (newItems.length > 0) {
          set((state) => ({
            dailyItems: {
              ...state.dailyItems,
              [date]: [...(state.dailyItems[date] ?? []), ...newItems],
            },
          }));
        }
      },

      toggleDailyItem: (date, itemId) => {
        set((s) => ({
          dailyItems: {
            ...s.dailyItems,
            [date]: (s.dailyItems[date] ?? []).map((it) =>
              it.id === itemId ? { ...it, completed: !it.completed } : it
            ),
          },
        }));
      },

      processRollover: (fromDate, toDate) => {
        const s = get();
        if (s.lastProcessedDate === fromDate) return; // already done
        const fromItems = s.dailyItems[fromDate] ?? [];
        const incomplete = fromItems.filter((it) => !it.completed);
        if (incomplete.length === 0) {
          set({ lastProcessedDate: fromDate });
          return;
        }
        const toItems = s.dailyItems[toDate] ?? [];
        const rolledItems: DailyItem[] = [];
        incomplete.forEach((it, idx) => {
          // Avoid duplicating project task items that are already in tomorrow
          if (
            it.source === 'project_task' &&
            toItems.some((ex) => ex.taskId === it.taskId)
          ) {
            return;
          }
          // Avoid duplicating template items that are already in tomorrow
          if (
            it.source === 'template' &&
            toItems.some((ex) => ex.templateItemId === it.templateItemId)
          ) {
            return;
          }
          rolledItems.push({
            ...it,
            id: generateId(),
            date: toDate,
            source: 'rollover',
            rolledOverFromDate: fromDate,
            completed: false,
            order: -(incomplete.length - idx), // negative = float to top
          });
        });

        set((state) => ({
          dailyItems: {
            ...state.dailyItems,
            [toDate]: [...rolledItems, ...(state.dailyItems[toDate] ?? [])],
          },
          lastProcessedDate: fromDate,
        }));
      },

      syncTaskCompletionToDailyItems: (taskId, completed, date) => {
        set((s) => {
          const items = s.dailyItems[date];
          if (!items) return {};
          return {
            dailyItems: {
              ...s.dailyItems,
              [date]: items.map((it) =>
                it.taskId === taskId ? { ...it, completed } : it
              ),
            },
          };
        });
      },

      reorderDailyItems: (date, orderedIds) => {
        set((s) => {
          const items = s.dailyItems[date] ?? [];
          const idToItem = new Map(items.map((it) => [it.id, it]));
          const reordered = orderedIds
            .map((id, i) => {
              const it = idToItem.get(id);
              return it ? { ...it, order: i } : null;
            })
            .filter(Boolean) as DailyItem[];
          const rest = items
            .filter((it) => !orderedIds.includes(it.id))
            .map((it, i) => ({ ...it, order: orderedIds.length + i }));
          return {
            dailyItems: { ...s.dailyItems, [date]: [...reordered, ...rest] },
          };
        });
      },

      // ── Settings ────────────────────────────────────────────────────────────

      updateSettings: (updates) => {
        set((s) => ({ settings: { ...s.settings, ...updates } }));
      },
    }),
    {
      name: 'dailydo-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
