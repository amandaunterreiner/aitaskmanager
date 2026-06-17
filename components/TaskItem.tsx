'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task } from '@/lib/types'

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 text-sm text-zinc-800 dark:border-zinc-800 dark:text-zinc-200"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400"
        aria-label="Drag to reorder"
      >
        ⠿
      </button>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        className="h-4 w-4 cursor-pointer accent-zinc-900 dark:accent-zinc-100"
      />
      <span className={`flex-1 ${task.completed ? 'line-through text-zinc-400' : ''}`}>
        {task.title}
      </span>
      <button
        onClick={() => onDelete(task.id)}
        className="text-zinc-300 transition-colors hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400"
        aria-label="Delete task"
      >
        ✕
      </button>
    </li>
  )
}
