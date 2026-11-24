export type UserRole = 'admin' | 'member' | 'viewer';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: UserRole;
  created_at: string;
}

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  budget: number;
  progress: number;
  owner_id: string;
  created_at: string;
  color: string;
}

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string;
  due_date: string;
  created_at: string;
}

export interface StorageFile {
  id: string;
  name: string;
  bucket: string;
  size: number;
  type: string;
  url: string;
  created_at: string;
  owner_email: string;
}

export interface ActivityLog {
  id: string;
  user_email: string;
  action: string;
  target: string;
  created_at: string;
}

export interface SqlTableSchema {
  tableName: string;
  columns: { name: string; type: string; constraints: string }[];
  rowCount: number;
}
