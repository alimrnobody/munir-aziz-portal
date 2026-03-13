export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  video_url: string;
  order_index: number;
  is_locked: boolean;
  completed: boolean;
}

export interface LessonResource {
  id: string;
  lesson_id: string;
  title: string;
  file_url: string;
  file_type: string;
  created_at?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  is_locked: boolean;
  access_locked?: boolean;
  lessons: Lesson[];
  progress: number;
}
