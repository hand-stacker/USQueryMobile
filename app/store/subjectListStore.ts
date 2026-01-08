import { create } from 'zustand';

type SubjectListState = {
  subject_list: number[];
  setSubjectList: (ids: number[]) => void;
  addSubject: (id: number) => void;
  removeSubject: (id: number) => void;
  hasSubject: (id: number) => boolean;
  clear: () => void;
};

export const useSubjectListStore = create<SubjectListState>((set, get) => ({
  subject_list: [],

  setSubjectList: (ids: number[]) =>
    set({ subject_list: Array.isArray(ids) ? ids.map((n) => Number(n)) : [] }),

  addSubject: (id: number) =>
    set((state) => {
      if (state.subject_list.includes(id)) return state;
      return { subject_list: [...state.subject_list, id] } as any;
    }),

  removeSubject: (id: number) =>
    set((state) => ({ subject_list: state.subject_list.filter((s) => s !== id) })),

  hasSubject: (id: number) => get().subject_list.includes(id),

  clear: () => set({ subject_list: [] }),
}));
