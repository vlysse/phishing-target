import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Tabs } from "../components/ui/Tabs";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../lib/auth-context";

type SettingsTab = "profile" | "preferences" | "security";

interface Preferences {
  language: string;
  theme: "light" | "dark" | "system";
  emailNotifications: boolean;
}

function SavedNote({ show }: { show: boolean }) {
  if (!show) return null;
  return <p className="text-sm text-[var(--color-good)]">Saved.</p>;
}

function ProfileTab() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    await api.patch("/settings/profile", { name, email });
    await refresh();
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <div className="flex items-center gap-3">
        <Button type="submit">Save changes</Button>
        <SavedNote show={saved} />
      </div>
    </form>
  );
}

function PreferencesTab() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<Preferences>("/settings/preferences").then(setPrefs);
  }, []);

  async function update(next: Partial<Preferences>) {
    if (!prefs) return;
    setSaved(false);
    const updated = await api.patch<Preferences>("/settings/preferences", next);
    setPrefs(updated);
    setSaved(true);
  }

  if (!prefs) return null;

  return (
    <div className="flex max-w-md flex-col gap-4">
      <Select
        label="Language"
        value={prefs.language}
        onChange={(v) => update({ language: v })}
        options={[
          { value: "en", label: "English" },
          { value: "fr", label: "Français" },
        ]}
      />

      <Select
        label="Theme"
        value={prefs.theme}
        onChange={(v) => update({ theme: v as Preferences["theme"] })}
        options={[
          { value: "system", label: "System" },
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ]}
      />

      <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <input
          type="checkbox"
          checked={prefs.emailNotifications}
          onChange={(e) => update({ emailNotifications: e.target.checked })}
        />
        Email me about account activity
      </label>

      <SavedNote show={saved} />
    </div>
  );
}

function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await api.post("/settings/security/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? "Current password is incorrect." : "Could not update password.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <Input
        label="Current password"
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        required
      />
      <Input
        label="New password"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        minLength={8}
        required
      />
      {error && <p className="text-sm text-[var(--color-critical)]">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit">Update password</Button>
        <SavedNote show={saved} />
      </div>
    </form>
  );
}

export function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("profile");

  return (
    <AppShell title="Settings">
      <Card>
        <div className="mb-6">
          <Tabs
            tabs={[
              { value: "profile", label: "Edit Profile" },
              { value: "preferences", label: "Preferences" },
              { value: "security", label: "Security" },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>
        {tab === "profile" && <ProfileTab />}
        {tab === "preferences" && <PreferencesTab />}
        {tab === "security" && <SecurityTab />}
      </Card>
    </AppShell>
  );
}
