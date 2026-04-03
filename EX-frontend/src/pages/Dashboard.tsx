import { useState, useEffect } from "react";
import { Mail, CheckCircle2, Clock, AlertCircle, Activity, Settings, Download, Upload } from "lucide-react";

interface CampaignStats {
  totalLeads: number;
  emailsSent: number;
  emailsOpened: number;
  openRate: number;
  averageOpenTime: string;
  pendingEmails: number;
  failedEmails: number;
}

interface RecentActivity {
  id: string;
  type: "sent" | "opened" | "failed" | "queued";
  email: string;
  timestamp: string;
  message: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<CampaignStats>({
    totalLeads: 0,
    emailsSent: 0,
    emailsOpened: 0,
    openRate: 0,
    averageOpenTime: "-",
    pendingEmails: 0,
    failedEmails: 0,
  });

  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isWatching, setIsWatching] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  useEffect(() => {
    // Fetch initial stats
    fetchStats();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setActivities(data.recentActivities || []);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleStartWatching = async () => {
    try {
      const response = await fetch("/api/watch", { method: "POST" });
      if (response.ok) {
        setIsWatching(true);
      }
    } catch (error) {
      console.error("Error starting watch:", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setSelectedFile(null);
        fetchStats();
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      return;
    }

    try {
      setIsSendingBroadcast(true);
      const response = await fetch("/api/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: broadcastSubject,
          message: broadcastMessage,
        }),
      });

      if (response.ok) {
        await fetchStats();
      }
    } catch (error) {
      console.error("Error sending broadcast:", error);
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 text-sm">Monitor your automated campaigns</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleStartWatching}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                isWatching
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30"
              }`}
            >
              <Activity className="w-4 h-4" />
              {isWatching ? "Watching" : "Start Watching"}
            </button>
            <label className="px-4 py-2 rounded-lg font-semibold bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatBox
            icon={<Mail className="w-6 h-6" />}
            label="Total Leads"
            value={stats.totalLeads}
            color="blue"
          />
          <StatBox
            icon={<CheckCircle2 className="w-6 h-6" />}
            label="Emails Sent"
            value={stats.emailsSent}
            color="green"
          />
          <StatBox
            icon={<Activity className="w-6 h-6" />}
            label="Emails Opened"
            value={stats.emailsOpened}
            color="purple"
            subtitle={`${stats.openRate.toFixed(1)}% open rate`}
          />
          <StatBox
            icon={<Clock className="w-6 h-6" />}
            label="Pending"
            value={stats.pendingEmails}
            color="amber"
          />
        </div>

        {/* Error Stats */}
        {stats.failedEmails > 0 && (
          <div className="mb-8 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="text-red-300 font-semibold">{stats.failedEmails} Failed Emails</h3>
              <p className="text-red-400/80 text-sm">Review the activity log below for details</p>
            </div>
          </div>
        )}

        {/* Activity Section */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Recent Activity
            </h2>
            <button className="text-slate-400 hover:text-white transition-colors">
              <Download className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No activities yet. Start watching your Excel file to see updates.</p>
              </div>
            ) : (
              activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            )}
          </div>
        </div>

        {/* Configuration Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <ConfigCard title="AI Configuration">
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-300 block mb-1">AI Model</label>
                <select className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white">
                  <option>OpenAI (GPT-4)</option>
                  <option>OpenAI (GPT-3.5)</option>
                  <option>Ollama (Local)</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 block mb-1">Email Template</label>
                <select className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white">
                  <option>Default Template</option>
                  <option>Sales Template</option>
                  <option>Support Template</option>
                </select>
              </div>
              <button className="w-full bg-blue-500/20 text-blue-300 border border-blue-500/30 py-2 rounded hover:bg-blue-500/30 transition-colors">
                Save Configuration
              </button>
            </div>
          </ConfigCard>

          <ConfigCard title="Email Service">
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-300 block mb-1">Provider</label>
                <select className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white">
                  <option>Gmail API</option>
                  <option>SMTP Server</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 block mb-1">From Email</label>
                <input
                  type="email"
                  placeholder="your-email@example.com"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500"
                />
              </div>
              <button className="w-full bg-blue-500/20 text-blue-300 border border-blue-500/30 py-2 rounded hover:bg-blue-500/30 transition-colors">
                Configure Service
              </button>
            </div>
          </ConfigCard>
        </div>

        <div className="mt-8">
          <ConfigCard title="Manual Broadcast">
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-300 block mb-1">Subject</label>
                <input
                  type="text"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  placeholder="Subject for all recipients"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 block mb-1">Message</label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Type the message to send to all email addresses"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 min-h-[120px] resize-vertical"
                />
              </div>
              <button
                onClick={handleSendBroadcast}
                disabled={
                  isSendingBroadcast || !broadcastSubject.trim() || !broadcastMessage.trim()
                }
                className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isSendingBroadcast || !broadcastSubject.trim() || !broadcastMessage.trim()
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30"
                }`}
              >
                {isSendingBroadcast ? "Sending..." : "Send to All"}
              </button>
            </div>
          </ConfigCard>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  color,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: "blue" | "green" | "purple" | "amber";
  subtitle?: string;
}) {
  const colorClasses = {
    blue: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    green: "bg-green-500/10 border-green-500/30 text-green-400",
    purple: "bg-purple-500/10 border-purple-500/30 text-purple-400",
    amber: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-6`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-slate-400 text-sm font-medium">{label}</p>
        {icon}
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      {subtitle && <p className="text-xs text-slate-400 mt-2">{subtitle}</p>}
    </div>
  );
}

function ActivityItem({ activity }: { activity: RecentActivity }) {
  const icons = {
    sent: <CheckCircle2 className="w-4 h-4 text-green-400" />,
    opened: <Mail className="w-4 h-4 text-blue-400" />,
    failed: <AlertCircle className="w-4 h-4 text-red-400" />,
    queued: <Clock className="w-4 h-4 text-amber-400" />,
  };

  const bgColors = {
    sent: "bg-green-500/10 border-green-500/30",
    opened: "bg-blue-500/10 border-blue-500/30",
    failed: "bg-red-500/10 border-red-500/30",
    queued: "bg-amber-500/10 border-amber-500/30",
  };

  return (
    <div className={`${bgColors[activity.type]} border rounded-lg p-3 flex items-center gap-3`}>
      {icons[activity.type]}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{activity.email}</p>
        <p className="text-slate-400 text-xs">{activity.message}</p>
      </div>
      <p className="text-slate-500 text-xs whitespace-nowrap">{activity.timestamp}</p>
    </div>
  );
}

function ConfigCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5 text-blue-400" />
        {title}
      </h3>
      {children}
    </div>
  );
}
