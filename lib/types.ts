export type Category = string

export interface Task {
  id: string
  title: string
  completed: boolean
  category: Category
}
