import { Apple, BookOpenText, CalendarDays, CircleGauge, Dumbbell, MessageCircle, Ruler } from 'lucide-react';

export const primaryNavigation = [
  { href: '/hoy', label: 'Hoy', icon: CircleGauge },
  { href: '/plan', label: 'Plan', icon: CalendarDays },
  { href: '/actividad', label: 'Actividad', icon: Dumbbell },
  { href: '/alimentacion', label: 'Alimentación', icon: Apple },
  { href: '/guia', label: 'Guía', icon: MessageCircle },
] as const;

export const libraryNavigation = [
  { href: '/ejercicios', label: 'Ejercicios', icon: BookOpenText },
  { href: '/progreso', label: 'Progreso', icon: Ruler },
] as const;

export const navigation = [...primaryNavigation, ...libraryNavigation] as const;

export const goalLabels = {
  body_recomposition: 'Recomposición corporal', fat_loss: 'Pérdida de grasa', muscle_gain: 'Ganancia muscular', fitness: 'Condición física',
} as const;
