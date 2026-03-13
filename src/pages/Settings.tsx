import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeProvider";
import { Eye, EyeOff } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [provider, setProvider] = useState("email");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError("");
      setMessage("");

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
      setEmail(user.email || "");

      const providerName =
        user.app_metadata?.provider ||
        (Array.isArray(user.app_metadata?.providers) ? user.app_metadata.providers[0] : "") ||
        user.identities?.[0]?.provider ||
        "email";
      setProvider(providerName);

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

      setName(profile?.name || user.email?.split("@")[0] || "User");
      setAvatarUrl(profile?.avatar_url || "");
      setLoading(false);
    };

    void loadSettings();
  }, []);

  const handlePasswordChange = async () => {
    if (!password || !confirmPassword) {
      setError("Password and confirm password are required");
      setMessage("");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setMessage("");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setMessage("");
      return;
    }

    setSavingPassword(true);
    setError("");
    setMessage("");

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setSavingPassword(false);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setMessage("Password updated successfully");
    setSavingPassword(false);
  };

  const handleRemoveAvatar = async () => {
    if (!userId) return;

    setRemovingAvatar(true);
    setError("");
    setMessage("");

    const { error: removeError } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", userId);

    if (removeError) {
      setError(removeError.message);
      setRemovingAvatar(false);
      return;
    }

    setAvatarUrl("");
    window.dispatchEvent(
      new CustomEvent("profile-updated", {
        detail: {
          avatarUrl: "",
          name,
        },
      })
    );
    setMessage("Avatar removed");
    setRemovingAvatar(false);
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file || !userId) return;

    setUploadingAvatar(true);
    setError("");
    setMessage("");

    try {
      const uploadedUrl = await uploadToCloudinary(file);
      const { error: saveError } = await supabase
        .from("profiles")
        .update({ avatar_url: uploadedUrl })
        .eq("id", userId);

      if (saveError) {
        setError(saveError.message);
        setUploadingAvatar(false);
        return;
      }

      setAvatarUrl(uploadedUrl);
      window.dispatchEvent(
        new CustomEvent("profile-updated", {
          detail: {
            avatarUrl: uploadedUrl,
            name,
          },
        })
      );
      setMessage("Avatar updated successfully");
    } catch (uploadError: unknown) {
      setError(uploadError instanceof Error ? uploadError.message : "Avatar upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogoutAllSessions = async () => {
    setLoggingOutAll(true);
    setError("");
    setMessage("");

    const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });

    if (signOutError) {
      setError(signOutError.message);
      setLoggingOutAll(false);
      return;
    }

    setMessage("Logged out from all sessions");
    setLoggingOutAll(false);
  };

  const avatarSeed = encodeURIComponent((email || name || "User").trim());
  const fallbackAvatarUrl = `https://ui-avatars.com/api/?name=${avatarSeed}&background=111827&color=ffffff&bold=true`;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl p-6 lg:p-10">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage your account, appearance, and session security.</p>

        {loading && <p className="mt-6 text-sm text-muted-foreground">Loading settings...</p>}
        {error && <p className="mt-6 text-sm text-destructive">{error}</p>}
        {message && <p className="mt-6 text-sm text-emerald-500">{message}</p>}

        {!loading && (
          <div className="mt-6 space-y-6">
            <section className="rounded-2xl border border-border/30 bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Profile</h2>
              <div className="mt-4 flex items-center gap-4">
                <img
                  src={avatarUrl || fallbackAvatarUrl}
                  alt="Profile avatar"
                  className="h-16 w-16 rounded-full border-2 border-[#714AD6] object-cover"
                />
                <div>
                  <p className="text-sm text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">{email}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <label className="inline-flex cursor-pointer items-center rounded-lg border border-border/40 px-4 py-2 text-sm text-foreground">
                  {uploadingAvatar ? "Uploading..." : "Upload Profile Picture"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void handleAvatarUpload(e.target.files?.[0] || null)}
                    disabled={uploadingAvatar}
                  />
                </label>
                <button
                  onClick={() => void handleRemoveAvatar()}
                  disabled={removingAvatar || !avatarUrl}
                  className="rounded-lg px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  {removingAvatar ? "Removing..." : "Remove Avatar"}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-border/30 bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Account</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Name</p>
                  <p className="mt-1 text-sm text-foreground">{name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                  <p className="mt-1 text-sm text-foreground">{email}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full rounded-lg border border-border/40 bg-background px-3 py-2 pr-11 text-sm text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center bg-transparent text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full rounded-lg border border-border/40 bg-background px-3 py-2 pr-11 text-sm text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center bg-transparent text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                onClick={() => void handlePasswordChange()}
                disabled={savingPassword}
                className="mt-4 rounded-lg px-4 py-2 text-sm text-white"
              >
                {savingPassword ? "Updating..." : "Change Password"}
              </button>
            </section>

            <section className="rounded-2xl border border-border/30 bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
              <div className="mt-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-foreground">Theme</p>
                  <p className="text-xs text-muted-foreground">Current mode: {theme}</p>
                </div>
                <button onClick={toggleTheme} className="rounded-lg px-4 py-2 text-sm text-white">
                  Switch to {theme === "dark" ? "Light" : "Dark"} Mode
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-border/30 bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Security</h2>
              <div className="mt-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-foreground">Login Provider</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{provider}</p>
                </div>
                <button
                  onClick={() => void handleLogoutAllSessions()}
                  disabled={loggingOutAll}
                  className="rounded-lg px-4 py-2 text-sm text-white"
                >
                  {loggingOutAll ? "Signing out..." : "Logout All Sessions"}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Settings;
