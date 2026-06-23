import { ProgressChart } from '@/components/charts/progress-chart';
import { Card } from '@/components/ui/card';
export default function EstadisticasPage() { return <section className="space-y-6"><div><p className="text-sm font-medium text-primary">Progreso visual</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Estadísticas</h1><p className="mt-3 text-muted-foreground">Gráficas para identificar tendencias y ajustar entrenamiento, hábitos y recuperación.</p></div><Card><h2 className="mb-4 text-xl font-semibold">Tendencia de peso</h2><ProgressChart/></Card></section>; }
