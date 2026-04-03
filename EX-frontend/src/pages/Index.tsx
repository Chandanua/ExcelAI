import { Link } from "react-router-dom";
import { ArrowRight, Zap, Mail, BarChart3, Shield, Workflow, CheckCircle2, Clock } from "lucide-react";

export default function Index() {
  const scrollToDocs = () => {
    const el = document.getElementById("documentation");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="ExcelAI logo" className="h-8 w-8 rounded-md object-cover" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              ExcelAI
            </span>
          </div>
          <div className="flex gap-6 items-center">
            <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link
              to="/dashboard"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/30">
            <span className="text-blue-300 text-sm font-semibold">✨ AI-Powered Automation</span>
          </div>
          
          <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
            Excel → AI → Email Automation
          </h1>
          
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Watch your Excel spreadsheets, generate personalized emails with AI, and track opens—all in real-time. The complete automation system you've been waiting for.
          </p>

          <div className="flex gap-4 justify-center mb-16">
            <Link
              to="/dashboard"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/50 transition-all"
            >
              Launch Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
            <button
              onClick={scrollToDocs}
              className="bg-slate-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-slate-600 transition-colors"
            >
              View Documentation
            </button>
          </div>

          {/* Process Flow */}
          <div className="bg-gradient-to-b from-slate-800/50 to-slate-700/50 rounded-2xl border border-slate-700/50 p-8 mb-20">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-3 border border-blue-500/50">
                  <Mail className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-sm font-semibold text-slate-300">Watch Excel</p>
              </div>
              
              <div className="hidden md:flex justify-center">
                <ArrowRight className="w-6 h-6 text-slate-500" />
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-3 border border-purple-500/50">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-sm font-semibold text-slate-300">Generate with AI</p>
              </div>

              <div className="hidden md:flex justify-center">
                <ArrowRight className="w-6 h-6 text-slate-500" />
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mb-3 border border-cyan-500/50">
                  <Mail className="w-6 h-6 text-cyan-400" />
                </div>
                <p className="text-sm font-semibold text-slate-300">Send & Track</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-4">Powerful Features</h2>
          <p className="text-slate-300 text-center mb-16 max-w-2xl mx-auto">
            Everything you need to automate your email campaigns with intelligence
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureCard
              icon={<Workflow className="w-6 h-6" />}
              title="Real-Time Excel Watching"
              description="Automatically detect new and updated rows in your Excel files. No manual uploads or delays."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="AI-Powered Email Generation"
              description="Generate personalized emails using OpenAI or local Ollama. Customizable templates and variables."
            />
            <FeatureCard
              icon={<Mail className="w-6 h-6" />}
              title="Multi-Channel Sending"
              description="Send via Gmail API or SMTP. Support for attachments, HTML templates, and batch processing."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Email Open Tracking"
              description="Track when recipients open your emails with pixel tracking. Data saved automatically to Excel."
            />
            <FeatureCard
              icon={<Clock className="w-6 h-6" />}
              title="Follow-Up Sequences"
              description="Build automated follow-up sequences with customizable delays and conditions."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Double-Send Prevention"
              description="Smart deduplication and logging. Prevent accidentally sending to the same person twice."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="documentation" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">How It Works</h2>

          <div className="space-y-8">
            <StepCard
              number="1"
              title="Upload Your Excel File"
              description="Place your leads.xlsx file in the designated directory. The system automatically monitors it for changes."
            />
            <StepCard
              number="2"
              title="Configure AI Model"
              description="Choose OpenAI or Ollama as your AI engine. Customize the email generation prompts and variables from your spreadsheet."
            />
            <StepCard
              number="3"
              title="Design Email Template"
              description="Create responsive HTML emails using MJML. Build personalized messages with dynamic variables."
            />
            <StepCard
              number="4"
              title="Set Up Email Service"
              description="Configure Gmail API or SMTP credentials. The system handles authentication and error handling."
            />
            <StepCard
              number="5"
              title="Enable Open Tracking"
              description="Automatic tracking pixels are injected into your emails. Opens are logged back to your Excel file in real-time."
            />
            <StepCard
              number="6"
              title="Monitor & Optimize"
              description="View comprehensive dashboards showing sent emails, open rates, and engagement metrics."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatCard number="99.9%" label="Delivery Rate" />
            <StatCard number="<1s" label="Detection Time" />
            <StatCard number="∞" label="Scalability" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Automate Your Campaigns?</h2>
          <p className="text-blue-100 text-lg mb-8">
            Start your first automated campaign in minutes. No credit card required.
          </p>
          <Link
            to="/dashboard"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Go to Dashboard <ArrowRight className="w-5 h-5 inline ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-12 px-6 text-slate-400 text-center">
        <p>&copy; 2024 ExcelAI. Automate your campaigns with intelligence.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-slate-700/50 border border-slate-600/50 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 text-blue-400">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-6">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
          <span className="text-slate-900 font-bold">{number}</span>
        </div>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
        {number}
      </div>
      <div className="text-slate-300 font-semibold">{label}</div>
    </div>
  );
}
