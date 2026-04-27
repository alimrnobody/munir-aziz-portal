
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileAudio, FileArchive, FileImage, FileText, Plus, Trash2, Upload } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  video_url: string;
  order_index: number;
  is_locked: boolean;
}

interface CourseRow {
  id: string | number;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
}

interface LessonRow {
  id: string | number;
  course_id: string | number;
  title: string | null;
  video_url: string | null;
  order_index: number | null;
  is_locked: boolean | null;
}

interface LessonResource {
  id: string;
  lesson_id: string;
  title: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

interface LessonResourceRow {
  id: string | number;
  lesson_id: string | number;
  title: string | null;
  file_url: string | null;
  file_type: string | null;
  created_at: string | null;
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const getLessonResourceNotice = (error: unknown) => {
  const message = getErrorMessage(error, "Lesson resources are unavailable.");

  if (/lesson_resources/i.test(message) && /(does not exist|not exist|relation)/i.test(message)) {
    return "Lesson resources table is missing in Supabase. Run the lesson_resources migration.";
  }

  if (/bucket/i.test(message) && /(not found|does not exist|missing)/i.test(message)) {
    return 'Supabase Storage bucket "lesson-resources" is missing.';
  }

  if (/(row-level security|permission denied|not allowed|unauthorized|forbidden)/i.test(message)) {
    return "Storage permission is missing for lesson resources. Check Supabase Storage policies.";
  }

  return message;
};

const getResourceIcon = (fileType: string) => {
  if (fileType.startsWith("audio/")) return FileAudio;
  if (fileType === "application/pdf") return FileText;
  if (fileType.includes("zip") || fileType.includes("compressed") || fileType.includes("archive")) return FileArchive;
  if (fileType.startsWith("image/")) return FileImage;
  return FileText;
};

const sanitizeFileName = (fileName: string) => fileName.replace(/[^a-zA-Z0-9._-]/g, "-");

const normalizeLessonVideoUrl = (rawUrl: string) => {
  const url = rawUrl.trim();
  if (!url) return "";

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const videoId = parsed.pathname.split("/").filter(Boolean)[0];
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
  } catch {
    return url;
  }

  return url;
};

const AdminCourseDetail = () => {
  const navigate = useNavigate();
  const { courseId = "" } = useParams<{ courseId: string }>();
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [courseDraft, setCourseDraft] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonDrafts, setLessonDrafts] = useState<Record<string, Lesson>>({});
  const [lessonResourcesByLesson, setLessonResourcesByLesson] = useState<Record<string, LessonResource[]>>({});
  const [newLesson, setNewLesson] = useState({ title: "", video_url: "", order_index: "", is_locked: false });
  const [uploadingResourceLessonId, setUploadingResourceLessonId] = useState<string | null>(null);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);
  const [dragActiveLessonId, setDragActiveLessonId] = useState<string | null>(null);
  const [resourcePanelOpenByLesson, setResourcePanelOpenByLesson] = useState<Record<string, boolean>>({});

  const showError = (text: string) => setNotice({ type: "error", text });
  const showSuccess = (text: string) => setNotice({ type: "success", text });

  const loadCourse = useCallback(async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, description, thumbnail")
      .eq("id", courseId)
      .single();

    if (error) throw error;

    const nextCourse = {
      id: String((data as CourseRow).id),
      title: (data as CourseRow).title || "",
      description: (data as CourseRow).description || "",
      thumbnail: (data as CourseRow).thumbnail || "",
    };

    setCourse(nextCourse);
    setCourseDraft(nextCourse);
  }, [courseId]);

  const loadLessons = useCallback(async () => {
    const { data, error } = await supabase
      .from("lessons")
      .select("id, course_id, title, video_url, order_index, is_locked")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (error) throw error;

    const rows = ((data || []) as LessonRow[]).map((item) => ({
      id: String(item.id),
      course_id: String(item.course_id),
      title: item.title || "",
      video_url: item.video_url || "",
      order_index: item.order_index || 0,
      is_locked: Boolean(item.is_locked),
    }));

    setLessons(rows);
    const draftMap: Record<string, Lesson> = {};
    rows.forEach((lesson) => {
      draftMap[lesson.id] = { ...lesson };
    });
    setLessonDrafts(draftMap);
    return rows;
  }, [courseId]);

  const loadLessonResources = useCallback(async (lessonIds: string[]) => {
    if (lessonIds.length === 0) {
      setLessonResourcesByLesson({});
      return true;
    }

    const { data, error } = await supabase
      .from("lesson_resources")
      .select("id, lesson_id, title, file_url, file_type, created_at")
      .in("lesson_id", lessonIds)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load lesson resources:", error);
      setLessonResourcesByLesson({});
      setNotice({ type: "error", text: getLessonResourceNotice(error) });
      return false;
    }

    const groupedResources: Record<string, LessonResource[]> = {};

    ((data || []) as LessonResourceRow[]).forEach((item) => {
      const lessonId = String(item.lesson_id);
      if (!groupedResources[lessonId]) groupedResources[lessonId] = [];
      groupedResources[lessonId].push({
        id: String(item.id),
        lesson_id: lessonId,
        title: item.title || "Untitled resource",
        file_url: item.file_url || "",
        file_type: item.file_type || "",
        created_at: item.created_at || "",
      });
    });

    setLessonResourcesByLesson(groupedResources);
    return true;
  }, []);

  const loadAll = useCallback(async () => {
    if (!courseId) return;

    setLoading(true);
    setNotice(null);
    try {
      await loadCourse();
      const loadedLessons = await loadLessons();
      const resourcesLoaded = await loadLessonResources(loadedLessons.map((lesson) => lesson.id));
      if (resourcesLoaded === false) {
        setNotice({
          type: "error",
          text: "Lesson resources are unavailable right now. Course and lessons are still loaded.",
        });
      }
    } catch (error: unknown) {
      console.error("Failed to load admin course detail page:", error);
      showError(getErrorMessage(error, "Unable to load course data"));
    } finally {
      setLoading(false);
    }
  }, [courseId, loadCourse, loadLessonResources, loadLessons]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const uploadLessonResource = async (lessonId: string, file: File | null) => {
    if (!file) return;

    setUploadingResourceLessonId(lessonId);
    try {
      const storagePath = `${lessonId}/${Date.now()}-${sanitizeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("lesson-resources")
        .upload(storagePath, file, { upsert: false });

      if (uploadError) {
        console.error("Failed to upload lesson resource:", uploadError);
        showError(getLessonResourceNotice(uploadError));
        return;
      }

      const { error: insertError } = await supabase.from("lesson_resources").insert({
        lesson_id: lessonId,
        title: file.name,
        file_url: storagePath,
        file_type: file.type || "application/octet-stream",
      });

      if (insertError) {
        await supabase.storage.from("lesson-resources").remove([storagePath]);
        console.error("Failed to save lesson resource record:", insertError);
        showError(getLessonResourceNotice(insertError));
        return;
      }

      showSuccess("Resource uploaded");
      await loadLessonResources(lessons.map((lesson) => lesson.id));
    } catch (error: unknown) {
      console.error("Unexpected lesson resource upload failure:", error);
      showError(getLessonResourceNotice(error));
    } finally {
      setUploadingResourceLessonId(null);
    }
  };

  const handleResourceDrop = async (lessonId: string, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActiveLessonId(null);

    const file = event.dataTransfer.files?.[0] || null;
    await uploadLessonResource(lessonId, file);
  };

  const deleteLessonResource = async (resource: LessonResource) => {
    setDeletingResourceId(resource.id);

    try {
      const { error: storageError } = await supabase.storage.from("lesson-resources").remove([resource.file_url]);

      if (storageError) {
        console.error("Failed to delete lesson resource file:", storageError);
        showError(getLessonResourceNotice(storageError));
        return;
      }

      const { error: deleteError } = await supabase.from("lesson_resources").delete().eq("id", resource.id);

      if (deleteError) {
        console.error("Failed to delete lesson resource record:", deleteError);
        showError(getLessonResourceNotice(deleteError));
        return;
      }

      showSuccess("Resource deleted");
      await loadLessonResources(lessons.map((lesson) => lesson.id));
    } finally {
      setDeletingResourceId(null);
    }
  };

  const lessonsByCourse = useMemo(() => {
    const map: Record<string, Lesson[]> = {};
    lessons.forEach((lesson) => {
      if (!map[lesson.course_id]) map[lesson.course_id] = [];
      map[lesson.course_id].push(lesson);
    });
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => a.order_index - b.order_index);
    });
    return map;
  }, [lessons]);

  const saveCourse = async () => {
    if (!courseDraft) return;

    const { error } = await supabase
      .from("courses")
      .update({
        title: courseDraft.title.trim(),
        description: courseDraft.description.trim(),
        thumbnail: courseDraft.thumbnail.trim(),
      })
      .eq("id", courseId);

    if (error) return showError(error.message);
    showSuccess("Course updated");
    await loadCourse();
  };

  const deleteCourse = async () => {
    const { error } = await supabase.from("courses").delete().eq("id", courseId);
    if (error) return showError(error.message);
    showSuccess("Course deleted");
    navigate("/admin/courses");
  };

  const uploadCourseThumbnail = async (file: File | null) => {
    if (!file) return;
    let publicUrl = "";
    try {
      publicUrl = await uploadToCloudinary(file);
    } catch (error: unknown) {
      return showError(getErrorMessage(error, "Thumbnail upload failed"));
    }

    const { error } = await supabase.from("courses").update({ thumbnail: publicUrl }).eq("id", courseId);
    if (error) return showError(error.message);

    showSuccess("Thumbnail uploaded");
    await loadCourse();
  };

  const addLesson = async () => {
    const title = newLesson.title.trim();
    if (!title) return;
    const normalizedVideoUrl = normalizeLessonVideoUrl(newLesson.video_url);

    const orderFromInput = Number(newLesson.order_index);
    const maxOrder = Math.max(0, ...lessons.map((lesson) => lesson.order_index));
    const nextOrder = Number.isFinite(orderFromInput) && orderFromInput > 0 ? orderFromInput : maxOrder + 1;

    const { error } = await supabase.from("lessons").insert({
      course_id: courseId,
      title,
      video_url: normalizedVideoUrl,
      order_index: nextOrder,
      is_locked: newLesson.is_locked,
    });

    if (error) return showError(error.message);

    setNewLesson({ title: "", video_url: "", order_index: "", is_locked: false });
    showSuccess("Lesson added");
    const loadedLessons = await loadLessons();
    await loadLessonResources(loadedLessons.map((lesson) => lesson.id));
  };

  const saveLesson = async (lessonId: string) => {
    const draft = lessonDrafts[lessonId];
    if (!draft) return;
    const normalizedVideoUrl = normalizeLessonVideoUrl(draft.video_url);

    const { error } = await supabase
      .from("lessons")
      .update({
        title: draft.title.trim(),
        video_url: normalizedVideoUrl,
        order_index: draft.order_index,
        is_locked: draft.is_locked,
      })
      .eq("id", lessonId);

    if (error) return showError(error.message);
    showSuccess("Lesson updated");
    await loadLessons();
  };

  const deleteLesson = async (lessonId: string) => {
    const relatedResources = lessonResourcesByLesson[lessonId] || [];

    if (relatedResources.length > 0) {
      const resourcePaths = relatedResources.map((resource) => resource.file_url).filter(Boolean);
      if (resourcePaths.length > 0) {
        const { error: storageError } = await supabase.storage.from("lesson-resources").remove(resourcePaths);

        if (storageError) {
          console.error("Failed to delete lesson resource files during lesson delete:", storageError);
          return showError(getLessonResourceNotice(storageError));
        }
      }
    }

    const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
    if (error) return showError(error.message);
    showSuccess("Lesson deleted");
    const loadedLessons = await loadLessons();
    await loadLessonResources(loadedLessons.map((lesson) => lesson.id));
  };

  const toggleLessonLock = async (lesson: Lesson) => {
    const { error } = await supabase.from("lessons").update({ is_locked: !lesson.is_locked }).eq("id", lesson.id);

    if (error) return showError(error.message);
    showSuccess(lesson.is_locked ? "Lesson unlocked" : "Lesson locked");
    await loadLessons();
  };

  const toggleResourcePanel = (lessonId: string) => {
    setResourcePanelOpenByLesson((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }));
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => navigate("/admin/courses")}
          className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#111827] dark:text-white/80 dark:hover:bg-white/5"
        >
          <span>Back to Courses</span>
        </button>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F172A] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] sm:p-6">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Manage Course</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
            Edit course details, thumbnail, lessons, and lesson resources for one course.
          </p>
        </div>

        {notice && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {notice.text}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600 dark:border-white/10 dark:bg-[#0F172A] dark:text-white/70 dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
            Loading course...
          </div>
        ) : !course || !courseDraft ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600 dark:border-white/10 dark:bg-[#0F172A] dark:text-white/70 dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
            Course not found.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F172A] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] sm:p-6">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={courseDraft.title}
                  onChange={(e) => setCourseDraft((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/10 dark:bg-[#111827] dark:text-white"
                />
                <input
                  value={courseDraft.description}
                  onChange={(e) => setCourseDraft((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/10 dark:bg-[#111827] dark:text-white"
                />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                <input
                  value={courseDraft.thumbnail}
                  onChange={(e) => setCourseDraft((prev) => (prev ? { ...prev, thumbnail: e.target.value } : prev))}
                  placeholder="Thumbnail URL"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/10 dark:bg-[#111827] dark:text-white placeholder:dark:text-white/40"
                />
                <label className="inline-flex w-full cursor-pointer items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-[#111827] dark:text-white/80 md:w-auto">
                  Upload Thumbnail
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void uploadCourseThumbnail(e.target.files?.[0] || null)}
                  />
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() => void saveCourse()}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-[#111827] dark:text-white/80 sm:w-auto"
                  >
                    Save Course
                  </button>
                  <button
                    onClick={() => void deleteCourse()}
                    className="w-full rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white sm:w-auto"
                  >
                    Delete Course
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F172A] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Lessons</h2>
              <div className="mt-4 grid items-center gap-2 md:grid-cols-[1.7fr_2fr_110px_160px_140px]">
                <input
                  value={newLesson.title}
                  onChange={(e) => setNewLesson((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Lesson title"
                  className="h-10 rounded-lg border border-slate-300 px-3 text-sm dark:border-white/10 dark:bg-[#111827] dark:text-white placeholder:dark:text-white/40"
                />
                <input
                  value={newLesson.video_url}
                  onChange={(e) => setNewLesson((prev) => ({ ...prev, video_url: e.target.value }))}
                  placeholder="Video URL"
                  className="h-10 rounded-lg border border-slate-300 px-3 text-sm dark:border-white/10 dark:bg-[#111827] dark:text-white placeholder:dark:text-white/40"
                />
                <input
                  value={newLesson.order_index}
                  onChange={(e) => setNewLesson((prev) => ({ ...prev, order_index: e.target.value }))}
                  placeholder="Order"
                  className="h-10 rounded-lg border border-slate-300 px-3 text-sm dark:border-white/10 dark:bg-[#111827] dark:text-white placeholder:dark:text-white/40"
                />
                <div className="flex h-10 items-center justify-center gap-3 rounded-lg border border-slate-300 px-3 text-sm text-slate-700 dark:border-white/10 dark:bg-[#111827] dark:text-white/80">
                  <span>{newLesson.is_locked ? "Locked" : "Unlocked"}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={newLesson.is_locked}
                    onClick={() => setNewLesson((prev) => ({ ...prev, is_locked: !prev.is_locked }))}
                    className={`relative inline-flex h-[26px] w-12 overflow-hidden rounded-full transition-all duration-200 ${
                      newLesson.is_locked ? "bg-[#ef4444]" : "bg-[#22c55e]"
                    }`}
                  >
                    <span
                      className={`absolute top-[3px] inline-block h-5 w-5 rounded-full bg-white transition-all duration-200 ${
                        newLesson.is_locked ? "left-[3px]" : "left-[25px]"
                      }`}
                    />
                  </button>
                </div>
                <button onClick={() => void addLesson()} className="h-10 rounded-lg bg-slate-900 px-3 text-sm text-white">
                  Add Lesson
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {(lessonsByCourse[courseId] || []).map((lesson) => (
                  <div key={lesson.id} className="rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10">
                    <div className="grid items-center gap-2 lg:grid-cols-[1.3fr_1.7fr_90px_180px_minmax(220px,1.2fr)_70px_82px]">
                      <input
                        value={lessonDrafts[lesson.id]?.title || ""}
                        onChange={(e) =>
                          setLessonDrafts((prev) => ({
                            ...prev,
                            [lesson.id]: { ...(prev[lesson.id] || lesson), title: e.target.value },
                          }))
                        }
                        className="h-9 rounded-lg border border-slate-300 px-3 text-sm dark:border-white/10 dark:bg-[#111827] dark:text-white"
                      />
                      <input
                        value={lessonDrafts[lesson.id]?.video_url || ""}
                        onChange={(e) =>
                          setLessonDrafts((prev) => ({
                            ...prev,
                            [lesson.id]: { ...(prev[lesson.id] || lesson), video_url: e.target.value },
                          }))
                        }
                        placeholder="Video URL"
                        className="h-9 rounded-lg border border-slate-300 px-3 text-sm dark:border-white/10 dark:bg-[#111827] dark:text-white"
                      />
                      <input
                        value={lessonDrafts[lesson.id]?.order_index ?? 0}
                        onChange={(e) =>
                          setLessonDrafts((prev) => ({
                            ...prev,
                            [lesson.id]: {
                              ...(prev[lesson.id] || lesson),
                              order_index: Number(e.target.value) || 0,
                            },
                          }))
                        }
                        className="h-9 rounded-lg border border-slate-300 px-3 text-sm dark:border-white/10 dark:bg-[#111827] dark:text-white"
                      />
                      <div className="flex h-9 items-center justify-between gap-2 rounded-lg border border-slate-300 px-3 text-sm text-slate-700 dark:border-white/10 dark:bg-[#111827] dark:text-white/80">
                        <span>{lesson.is_locked ? "Locked" : "Unlocked"}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={lesson.is_locked}
                          onClick={() => void toggleLessonLock(lesson)}
                          className={`relative inline-flex h-[22px] w-11 overflow-hidden rounded-full transition-all duration-200 ${
                            lesson.is_locked ? "bg-[#ef4444]" : "bg-[#22c55e]"
                          }`}
                        >
                          <span
                            className={`absolute top-[2px] inline-block h-[18px] w-[18px] rounded-full bg-white transition-all duration-200 ${
                              lesson.is_locked ? "left-[2px]" : "left-[24px]"
                            }`}
                          />
                        </button>
                      </div>
                      <div className="min-w-0">
                        <div className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-300 px-2.5 py-1 dark:border-white/10 dark:bg-[#111827]">
                          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleResourcePanel(lesson.id)}
                              className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-slate-300 px-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#0F172A] dark:text-white/80 dark:hover:bg-white/5"
                            >
                              <Plus size={11} />
                              <span>{uploadingResourceLessonId === lesson.id ? "Adding..." : "Resource"}</span>
                            </button>
                            {(lessonResourcesByLesson[lesson.id] || []).length > 0 ? (
                              (lessonResourcesByLesson[lesson.id] || []).slice(0, 2).map((resource) => {
                                const ResourceIcon = getResourceIcon(resource.file_type);
                                return (
                                  <span
                                    key={resource.id}
                                    className="inline-flex max-w-[110px] items-center gap-1 rounded-full border border-slate-300 px-2 py-0.5 text-[11px] text-slate-700 dark:border-white/10 dark:text-white/75"
                                  >
                                    <ResourceIcon size={11} className="shrink-0" />
                                    <span className="truncate">{resource.title}</span>
                                    <button
                                      type="button"
                                      onClick={() => void deleteLessonResource(resource)}
                                      disabled={deletingResourceId === resource.id}
                                      className="shrink-0 text-rose-600 dark:text-rose-300"
                                      aria-label={`Delete ${resource.title}`}
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  </span>
                                );
                              })
                            ) : (
                              <span className="truncate text-xs text-slate-500 dark:text-white/50">No resources</span>
                            )}
                            {(lessonResourcesByLesson[lesson.id] || []).length > 2 && (
                              <span className="shrink-0 text-[11px] text-slate-500 dark:text-white/50">
                                +{(lessonResourcesByLesson[lesson.id] || []).length - 2} more
                              </span>
                            )}
                          </div>
                          <span className="shrink-0 rounded-full border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:border-white/10 dark:text-white/50">
                            {(lessonResourcesByLesson[lesson.id] || []).length}
                          </span>
                        </div>

                        {resourcePanelOpenByLesson[lesson.id] && (
                          <div
                            className={`mt-2 rounded-lg border border-dashed px-3 py-2 text-xs transition dark:bg-[#111827] ${
                              dragActiveLessonId === lesson.id
                                ? "border-[#714AD6] bg-[#714AD6]/5 dark:border-[#714AD6]"
                                : "border-slate-300 text-slate-500 dark:border-white/10 dark:text-white/45"
                            }`}
                            onDragOver={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setDragActiveLessonId(lesson.id);
                            }}
                            onDragEnter={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setDragActiveLessonId(lesson.id);
                            }}
                            onDragLeave={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              if (event.currentTarget.contains(event.relatedTarget as Node)) return;
                              setDragActiveLessonId((current) => (current === lesson.id ? null : current));
                            }}
                            onDrop={(event) => void handleResourceDrop(lesson.id, event)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Upload size={12} className="shrink-0" />
                                <span>{dragActiveLessonId === lesson.id ? "Drop file to upload" : "Drag file here"}</span>
                              </div>
                              <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#0F172A] dark:text-white/80 dark:hover:bg-white/5">
                                <Plus size={10} />
                                <span>Add</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => void uploadLessonResource(lesson.id, e.target.files?.[0] || null)}
                                />
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => void saveLesson(lesson.id)}
                        className="flex h-9 items-center justify-center rounded-lg border border-slate-300 px-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#111827] dark:text-white/80 dark:hover:bg-white/5"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => void deleteLesson(lesson.id)}
                        className="flex h-9 items-center justify-center rounded-lg border border-slate-300 px-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#111827] dark:text-white/80 dark:hover:bg-white/5"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {(lessonsByCourse[courseId] || []).length === 0 && (
                  <p className="text-sm text-slate-600 dark:text-white/70">No lessons in this course yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminCourseDetail;
