'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Task, Category } from '@/lib/types'
import TaskInput from '@/components/TaskInput'
import TaskItem from '@/components/TaskItem'
import DeleteConfirmModal from '@/components/DeleteConfirmModal'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'

const DEFAULT_CATEGORIES = ['Personal', 'Networking & Jobs', 'Via Terra']

export default function Home() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const tasksFirstRender = useRef(true)
  const categoriesFirstRender = useRef(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tasks')
      if (stored) setTasks(JSON.parse(stored))
    } catch {}
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('categories')
      if (stored) setCategories(JSON.parse(stored))
    } catch {}
  }, [])

  useEffect(() => {
    if (tasksFirstRender.current) {
      tasksFirstRender.current = false
      return
    }
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    if (categoriesFirstRender.current) {
      categoriesFirstRender.current = false
      return
    }
    localStorage.setItem('categories', JSON.stringify(categories))
  }, [categories])

  function handleAdd(title: string, category: Category) {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      category,
    }
    setTasks([...tasks, newTask])
  }

  function handleEditTitle(id: string, newTitle: string) {
    setTasks(tasks.map((task) => task.id === id ? { ...task, title: newTitle } : task))
  }

  function handleToggle(id: string) {
    setTasks(tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  function handleDelete(id: string) {
    setTaskToDelete(id)
  }

  function handleConfirmDelete() {
    setTasks(tasks.filter((task) => task.id !== taskToDelete))
    setTaskToDelete(null)
  }

  function handleCancelDelete() {
    setTaskToDelete(null)
  }

  function handleReorder(category: Category, activeId: string, overId: string) {
    setTasks((prev) => {
      const categoryTasks = prev.filter((t) => t.category === category)
      const otherTasks = prev.filter((t) => t.category !== category)
      const oldIndex = categoryTasks.findIndex((t) => t.id === activeId)
      const newIndex = categoryTasks.findIndex((t) => t.id === overId)
      return [...otherTasks, ...arrayMove(categoryTasks, oldIndex, newIndex)]
    })
  }

  function handleRenameCategory(oldName: string, newName: string) {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === oldName) return
    setCategories(categories.map((c) => (c === oldName ? trimmed : c)))
    setTasks(tasks.map((t) => (t.category === oldName ? { ...t, category: trimmed } : t)))
  }

  function commitEdit(original: string) {
    handleRenameCategory(original, editValue)
    setEditingCategory(null)
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Amanda's AI Task Manager
        </h1>
        <div className="flex items-center gap-3">
          {session?.user?.name && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {session.user.name}
            </span>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </div>
      </div>
      <TaskInput categories={categories} onAdd={handleAdd} />
      <div className="mt-8 grid grid-cols-3 gap-6">
        {categories.map((category) => {
          const categoryTasks = tasks.filter((t) => t.category === category)
          return (
            <div key={category}>
              {editingCategory === category ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => commitEdit(category)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit(category)
                    if (e.key === 'Escape') setEditingCategory(null)
                  }}
                  className="mb-3 w-full rounded border border-zinc-300 bg-transparent px-1 text-sm font-semibold uppercase tracking-wide text-zinc-600 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:text-zinc-300"
                />
              ) : (
                <h2
                  onClick={() => { setEditingCategory(category); setEditValue(category) }}
                  className="mb-3 cursor-pointer text-sm font-semibold uppercase tracking-wide text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  title="Click to rename"
                >
                  {category}
                </h2>
              )}
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={(event: DragEndEvent) => {
                  const { active, over } = event
                  if (!over || active.id === over.id) return
                  handleReorder(category, String(active.id), String(over.id))
                }}
              >
                <SortableContext items={categoryTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <ul className="space-y-2">
                    {categoryTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        onEdit={handleEditTitle}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
              {categoryTasks.length === 0 && (
                <p className="text-sm text-zinc-400 dark:text-zinc-600">
                  No tasks yet.
                </p>
              )}
            </div>
          )
        })}
      </div>
      {taskToDelete && (
        <DeleteConfirmModal
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </main>
  )
}
