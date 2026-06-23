'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type HealthState = { selectedDate: string; setSelectedDate: (date: string) => void; hydrationGoal: number; proteinGoal: number; stepsGoal: number };
export const useHealthStore = create<HealthState>()(persist((set) => ({ selectedDate: new Date().toISOString().slice(0, 10), setSelectedDate: (selectedDate) => set({ selectedDate }), hydrationGoal: 3, proteinGoal: 160, stepsGoal: 10000 }), { name: 'glm-health-store' }));
