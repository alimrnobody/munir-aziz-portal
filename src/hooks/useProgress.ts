import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const markLessonComplete = async (lessonId: string) => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error(userError?.message || "Unable to verify user");
  }

  const completedAt = new Date().toISOString();

  const existing = await supabase
    .from("progress")
    .select("lesson_id, completed")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (existing.error) {
    throw new Error(existing.error.message);
  }

  if (!existing.data) {
    const { error } = await supabase.from("progress").insert({
      user_id: user.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: completedAt,
    });

    if (error) throw new Error(error.message);
    return true;
  }

  if (!existing.data.completed) {
    const { error } = await supabase
      .from("progress")
      .update({ completed: true, completed_at: completedAt })
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId);

    if (error) throw new Error(error.message);
  }

  return true;
};

export const useMarkComplete = () =>
  useMutation({
    mutationFn: markLessonComplete,
  });
