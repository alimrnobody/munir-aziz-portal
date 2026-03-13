import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";

type ProfileUpdatedDetail = {
  avatarUrl?: string;
  name?: string;
};

const Profile = () => {
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError(userError?.message || "Unable to verify user");
        setLoading(false);
        return;
      }

      setUserId(user.id);
      const authEmail = user.email || "";
      setEmail(authEmail);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      setName(profile?.name || authEmail.split("@")[0] || "User");
      setAvatarUrl(profile?.avatar_url || "");
      setLoading(false);
    };

    void loadProfile();
  }, []);

  const avatarSeed = encodeURIComponent((email || "user").toLowerCase());
  const initialsAvatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${avatarSeed}`;

  const handleAvatarUpload = async (file: File | null) => {
    if (!file || !userId) return;

    setUploading(true);
    setError("");

    try {
      const uploadedUrl = await uploadToCloudinary(file);
      const { error: saveError } = await supabase
        .from("profiles")
        .update({ avatar_url: uploadedUrl })
        .eq("id", userId);

      if (saveError) {
        setError(saveError.message);
        setUploading(false);
        return;
      }

      setAvatarUrl(uploadedUrl);
      window.dispatchEvent(
        new CustomEvent<ProfileUpdatedDetail>("profile-updated", {
          detail: {
            avatarUrl: uploadedUrl,
            name,
          },
        })
      );
    } catch (uploadError: unknown) {
      setError(uploadError instanceof Error ? uploadError.message : "Avatar upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl p-6 lg:p-10">
        <h1 className="text-2xl font-semibold text-foreground">Profile</h1>

        {loading && <p className="mt-4 text-sm text-muted-foreground">Loading profile...</p>}
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        {!loading && !error && (
          <div className="mt-6 rounded-2xl border border-border/30 bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <img
                src={avatarUrl || initialsAvatarUrl}
                alt="Profile avatar"
                className="h-16 w-16 rounded-full border-2 border-[#714AD6] object-cover"
              />
              <div>
                <p className="text-lg font-semibold text-foreground">{name}</p>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </div>
            <div className="mt-5">
              <label className="inline-flex cursor-pointer items-center rounded-lg border border-border/40 px-4 py-2 text-sm text-foreground">
                {uploading ? "Uploading..." : "Upload Profile Picture"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleAvatarUpload(e.target.files?.[0] || null)}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Profile;
