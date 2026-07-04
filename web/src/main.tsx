import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  Calculator,
  Check,
  ChevronRight,
  ClipboardList,
  Home,
  Leaf,
  LineChart,
  PiggyBank,
  Play,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";
import "./styles.css";

type Purpose = "home_improvement" | "car" | "debt_consolidation" | "wedding" | "green_upgrade";
type Scenario = "strong" | "balanced" | "stretched";

type JourneyInput = {
  monthlyIncome: number;
  monthlyCommitments: number;
  housingCost: number;
  dependants: number;
  requestedAmount: number;
  termMonths: number;
};

type Affordability = {
  status: string;
  confidence: string;
  disposableIncome: number;
  paymentCap: number;
  estimatedMonthlyPayment: number;
  suggestedMaxBorrowing: number;
  notes: string[];
};

type Option = {
  id: string;
  name: string;
  representativeApr: number;
  arrangementFee: number;
  highlight: string;
  bestFor: string;
  caveat: string;
  monthlyPayment: number;
  totalRepayable: number;
  totalInterest: number;
  eligibilityScore: number;
  fit: string;
};

type TimelineItem = {
  label: string;
  status: string;
  detail: string;
};

type Journey = {
  brand?: {
    name: string;
    proposition: string;
  };
  selectedPurpose: Purpose;
  purposeLabel?: string;
  scenario: Scenario;
  input: JourneyInput;
  affordability: Affordability;
  options: Option[];
  timeline?: TimelineItem[];
  demoNotice?: string;
};

declare global {
  interface Window {
    openai?: {
      toolOutput?: unknown;
      callTool?: (name: string, args: Record<string, unknown>) => Promise<unknown>;
      sendFollowUpMessage?: (message: { prompt: string; scrollToBottom?: boolean }) => Promise<void>;
      requestDisplayMode?: (request: { mode: "inline" | "pip" | "fullscreen" }) => Promise<unknown>;
      setWidgetState?: (state: unknown) => void;
      widgetState?: unknown;
    };
  }
}

const fallbackJourney: Journey = {
  brand: {
    name: "Greenbridge Bank",
    proposition: "Borrowing with clarity, confidence, and a human next step."
  },
  selectedPurpose: "home_improvement",
  purposeLabel: "Home improvement",
  scenario: "balanced",
  input: {
    monthlyIncome: 3250,
    monthlyCommitments: 610,
    housingCost: 875,
    dependants: 1,
    requestedAmount: 10000,
    termMonths: 60
  },
  affordability: {
    status: "Possible with checks",
    confidence: "Medium",
    disposableIncome: 1595,
    paymentCap: 510,
    estimatedMonthlyPayment: 199,
    suggestedMaxBorrowing: 19500,
    notes: [
      "Estimated spare income after core commitments is GBP 1,595 per month.",
      "The demo affordability guardrail keeps repayments around GBP 510 or below.",
      "A dependant buffer of GBP 170 is included."
    ]
  },
  options: [
    {
      id: "gb-flex-personal",
      name: "Greenbridge Flex Loan",
      representativeApr: 6.9,
      arrangementFee: 0,
      highlight: "Low-friction personal loan with no arrangement fee.",
      bestFor: "Borrowers who want speed, clarity, and predictable monthly payments.",
      caveat: "Final APR depends on credit and affordability assessment.",
      monthlyPayment: 197,
      totalRepayable: 11820,
      totalInterest: 1820,
      eligibilityScore: 84,
      fit: "Best fit"
    },
    {
      id: "gb-premier",
      name: "Greenbridge Premier Loan",
      representativeApr: 7.2,
      arrangementFee: 99,
      highlight: "Higher borrowing range with guided application support.",
      bestFor: "Larger planned projects where confidence and handoff quality matter.",
      caveat: "Arrangement fee is included in total cost estimates for this demo.",
      monthlyPayment: 201,
      totalRepayable: 12060,
      totalInterest: 2060,
      eligibilityScore: 79,
      fit: "Good fit"
    }
  ],
  timeline: [
    { label: "Explore", status: "complete", detail: "Choose purpose and borrowing range." },
    { label: "Affordability", status: "active", detail: "Estimate monthly comfort and lending fit." },
    { label: "Compare", status: "active", detail: "Review product options and total cost." },
    { label: "Apply", status: "next", detail: "Prepare documents and channel handoff." }
  ],
  demoNotice: "Demo data only. This is not financial advice and is not connected to customer records or bank systems."
};

const purposes: Array<{ id: Purpose; label: string; icon: React.ReactNode }> = [
  { id: "home_improvement", label: "Home", icon: <Home size={18} /> },
  { id: "car", label: "Car", icon: <Banknote size={18} /> },
  { id: "debt_consolidation", label: "Consolidate", icon: <PiggyBank size={18} /> },
  { id: "wedding", label: "Event", icon: <Sparkles size={18} /> },
  { id: "green_upgrade", label: "Green", icon: <Leaf size={18} /> }
];

const scenarios: Array<{ id: Scenario; label: string; tone: string }> = [
  { id: "strong", label: "Strong", tone: "More headroom" },
  { id: "balanced", label: "Balanced", tone: "Typical borrower" },
  { id: "stretched", label: "Stretched", tone: "Needs care" }
];

function currency(value: number) {
  return `GBP ${Math.round(value).toLocaleString("en-GB")}`;
}

function coerceJourney(value: unknown): Journey {
  if (value && typeof value === "object" && "affordability" in value && "input" in value) {
    return value as Journey;
  }
  return fallbackJourney;
}

function extractStructuredContent(result: unknown): Partial<Journey> | undefined {
  if (!result || typeof result !== "object") return undefined;
  if ("structuredContent" in result && result.structuredContent && typeof result.structuredContent === "object") {
    return result.structuredContent as Partial<Journey>;
  }
  return result as Partial<Journey>;
}

function App() {
  const initial = useMemo(() => coerceJourney(window.openai?.toolOutput), []);
  const [journey, setJourney] = useState<Journey>(initial);
  const [selectedProductId, setSelectedProductId] = useState(initial.options[0]?.id ?? "");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const [guidedStep, setGuidedStep] = useState(0);
  const [isGuided, setIsGuided] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const bestOption = journey.options.find((option) => option.id === selectedProductId) ?? journey.options[0];
  const progress = Math.min(100, Math.max(8, Math.round((journey.affordability.estimatedMonthlyPayment / journey.affordability.paymentCap) * 100)));

  useEffect(() => {
    const timeout = window.setTimeout(() => setIntroVisible(false), 2200);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isGuided) return;

    const script: Array<Partial<Journey> & { input?: Partial<JourneyInput> }> = [
      { selectedPurpose: "green_upgrade", scenario: "strong", input: { requestedAmount: 8500, termMonths: 48 } },
      { selectedPurpose: "green_upgrade", scenario: "balanced", input: { requestedAmount: 16000, termMonths: 72 } },
      { selectedPurpose: "home_improvement", scenario: "balanced", input: { requestedAmount: 22000, termMonths: 84 } },
      { selectedPurpose: "debt_consolidation", scenario: "stretched", input: { requestedAmount: 12000, termMonths: 60 } }
    ];

    const current = script[guidedStep % script.length];
    const timeout = window.setTimeout(() => {
      refreshOptions(current);
      setGuidedStep((step) => step + 1);
    }, guidedStep === 0 ? 250 : 1900);

    return () => window.clearTimeout(timeout);
  }, [guidedStep, isGuided]);

  function updateInput(next: Partial<JourneyInput>) {
    const updated = { ...journey.input, ...next };
    const nextJourney = { ...journey, input: updated };
    setJourney(nextJourney);
    window.openai?.setWidgetState?.({ input: updated, selectedProductId });
  }

  async function refreshOptions(next?: Partial<Journey>) {
    const merged = { ...journey, ...next, input: { ...journey.input, ...next?.input } };
    setJourney(merged);
    setPulseKey((key) => key + 1);
    setIsRefreshing(true);
    try {
      const result = await window.openai?.callTool?.("compare_loan_options", {
        purpose: merged.selectedPurpose,
        scenario: merged.scenario,
        ...merged.input
      });
      const structured = extractStructuredContent(result);
      if (structured) {
        const nextJourney = {
          ...merged,
          ...structured,
          input: { ...merged.input, ...structured.input },
          options: structured.options ?? merged.options,
          affordability: structured.affordability ?? merged.affordability
        };
        setJourney(nextJourney);
        setPulseKey((key) => key + 1);
        setSelectedProductId(nextJourney.options[0]?.id ?? selectedProductId);
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  async function askFollowUp(prompt: string) {
    await window.openai?.sendFollowUpMessage?.({ prompt, scrollToBottom: true });
  }

  function toggleGuidedDemo() {
    setIntroVisible(false);
    setIsGuided((value) => !value);
    setGuidedStep(0);
  }

  return (
    <main className={introVisible ? "app-shell intro-active" : "app-shell"}>
      {introVisible ? (
        <section className="launch-overlay" aria-label="Greenbridge launch sequence">
          <div className="launch-grid" />
          <div className="launch-ring">
            <Building2 size={38} />
          </div>
          <div className="launch-copy">
            <span>Greenbridge Bank</span>
            <strong>Loan intelligence online</strong>
          </div>
        </section>
      ) : null}

      <section className="hero-band">
        <div className="motion-field" aria-hidden="true">
          <span className="motion-line line-a" />
          <span className="motion-line line-b" />
          <span className="motion-line line-c" />
          <span className="motion-node node-a" />
          <span className="motion-node node-b" />
          <span className="motion-node node-c" />
        </div>
        <div className="brand-lockup">
          <div className="brand-mark">
            <Building2 size={22} />
          </div>
          <div>
            <p className="kicker">Greenbridge Bank</p>
            <h1>Loan journey cockpit</h1>
          </div>
        </div>
        <div className="hero-actions">
          <button className={isGuided ? "guided-button active" : "guided-button"} onClick={toggleGuidedDemo}>
            <Play size={16} />
            <span>{isGuided ? "Stop demo" : "Start guided demo"}</span>
          </button>
          <button className="icon-button" title="Request fullscreen" onClick={() => window.openai?.requestDisplayMode?.({ mode: "fullscreen" })}>
            <ArrowRight size={18} />
          </button>
        </div>
        <p className="hero-copy">Explore borrowing power, compare illustrative products, and move from intent to a ready application checklist.</p>
        <div className="hero-metrics">
          <Metric label="Monthly estimate" value={currency(journey.affordability.estimatedMonthlyPayment)} pulseKey={pulseKey} />
          <Metric label="Comfort guardrail" value={currency(journey.affordability.paymentCap)} pulseKey={pulseKey} />
          <Metric label="Confidence" value={journey.affordability.confidence} pulseKey={pulseKey} />
        </div>
      </section>

      <section className="journey-strip">
        {(journey.timeline ?? fallbackJourney.timeline ?? []).map((item, index) => (
          <div className={`journey-step ${item.status}`} key={item.label} style={{ "--delay": `${index * 90}ms` } as React.CSSProperties}>
            <span>{item.status === "complete" ? <Check size={14} /> : <ChevronRight size={14} />}</span>
            <div>
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
            </div>
          </div>
        ))}
      </section>

      <section className="workspace-grid">
        <aside className="control-panel reveal-panel" style={{ "--delay": "80ms" } as React.CSSProperties}>
          <PanelTitle icon={<SlidersHorizontal size={18} />} title="Borrowing shape" />

          <div className="purpose-grid">
            {purposes.map((purpose) => (
              <button
                key={purpose.id}
                className={purpose.id === journey.selectedPurpose ? "purpose active" : "purpose"}
                onClick={() => refreshOptions({ selectedPurpose: purpose.id })}
              >
                {purpose.icon}
                <span>{purpose.label}</span>
              </button>
            ))}
          </div>

          <Field label="Loan amount" value={currency(journey.input.requestedAmount)}>
            <input
              type="range"
              min="1000"
              max="50000"
              step="500"
              value={journey.input.requestedAmount}
              onChange={(event) => updateInput({ requestedAmount: Number(event.target.value) })}
              onMouseUp={() => refreshOptions()}
              onTouchEnd={() => refreshOptions()}
            />
          </Field>

          <Field label="Term" value={`${journey.input.termMonths} months`}>
            <input
              type="range"
              min="12"
              max="96"
              step="6"
              value={journey.input.termMonths}
              onChange={(event) => updateInput({ termMonths: Number(event.target.value) })}
              onMouseUp={() => refreshOptions()}
              onTouchEnd={() => refreshOptions()}
            />
          </Field>

          <div className="scenario-row">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                className={scenario.id === journey.scenario ? "scenario active" : "scenario"}
                onClick={() => refreshOptions({ scenario: scenario.id })}
              >
                <strong>{scenario.label}</strong>
                <span>{scenario.tone}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="affordability-panel reveal-panel" style={{ "--delay": "170ms" } as React.CSSProperties}>
          <PanelTitle icon={<Calculator size={18} />} title="Affordability lens" />
          <div className="status-block">
            <div>
              <p className="eyebrow">Current view</p>
              <h2>{journey.affordability.status}</h2>
              <p>{journey.affordability.notes[0]}</p>
            </div>
            <div className="radial" key={`radial-${pulseKey}`} style={{ "--progress": `${progress}%` } as React.CSSProperties}>
              <span>{progress}%</span>
              <small>of guardrail</small>
            </div>
          </div>

          <div className="insight-grid">
            <Insight icon={<LineChart size={18} />} label="Disposable income" value={currency(journey.affordability.disposableIncome)} />
            <Insight icon={<ShieldCheck size={18} />} label="Suggested ceiling" value={currency(journey.affordability.suggestedMaxBorrowing)} />
            <Insight icon={<BadgeCheck size={18} />} label="Demo confidence" value={journey.affordability.confidence} />
          </div>

          <div className="note-list">
            {journey.affordability.notes.slice(1).map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        </section>

        <section className="products-panel reveal-panel" style={{ "--delay": "260ms" } as React.CSSProperties}>
          <PanelTitle icon={<Banknote size={18} />} title="Illustrative options" />
          <div className={isRefreshing ? "product-list refreshing" : "product-list"}>
            {journey.options.map((option, index) => (
              <button
                className={option.id === bestOption?.id ? "product active" : "product"}
                key={option.id}
                onClick={() => setSelectedProductId(option.id)}
                style={{ "--delay": `${index * 110}ms`, "--score": `${option.eligibilityScore}%` } as React.CSSProperties}
              >
                <span className="fit-pill">{option.fit}</span>
                <strong>{option.name}</strong>
                <span>{option.highlight}</span>
                <span className="score-track" aria-hidden="true" />
                <div className="product-values">
                  <span>{option.representativeApr}% APR</span>
                  <span>{currency(option.monthlyPayment)} / mo</span>
                  <span>{option.eligibilityScore}% fit</span>
                </div>
              </button>
            ))}
            {journey.options.length === 0 ? (
              <div className="empty-state">
                <strong>No matching demo products</strong>
                <span>Try a lower amount, shorter term, or different purpose.</span>
              </div>
            ) : null}
          </div>
        </section>

        <section className="detail-panel reveal-panel" style={{ "--delay": "350ms" } as React.CSSProperties}>
          <PanelTitle icon={<ClipboardList size={18} />} title="Next best action" />
          {bestOption ? (
            <>
              <div className="selected-product">
                <span className="fit-pill gold">{bestOption.fit}</span>
                <h2>{bestOption.name}</h2>
                <p>{bestOption.bestFor}</p>
                <dl>
                  <div>
                    <dt>Total repayable</dt>
                    <dd>{currency(bestOption.totalRepayable)}</dd>
                  </div>
                  <div>
                    <dt>Total interest</dt>
                    <dd>{currency(bestOption.totalInterest)}</dd>
                  </div>
                  <div>
                    <dt>Fee</dt>
                    <dd>{currency(bestOption.arrangementFee)}</dd>
                  </div>
                </dl>
                <p className="caveat">{bestOption.caveat}</p>
              </div>
              <div className="action-row">
                <button onClick={() => askFollowUp(`Explain why ${bestOption.name} is the best option for this Greenbridge demo borrower.`)}>
                  Explain recommendation
                </button>
                <button onClick={() => askFollowUp(`Prepare a digital application checklist for ${bestOption.name}.`)}>
                  Prepare checklist
                </button>
              </div>
            </>
          ) : null}
        </section>
      </section>

      <footer className="demo-footer">
        <span>{isRefreshing ? "Refreshing illustrative options..." : journey.demoNotice ?? fallbackJourney.demoNotice}</span>
        <span>Built for ChatGPT MCP app demonstrations</span>
      </footer>
    </main>
  );
}

function Metric({ label, value, pulseKey }: { label: string; value: string; pulseKey: number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong key={`${label}-${pulseKey}`}>{value}</strong>
    </div>
  );
}

function PanelTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="panel-title">
      <span>{icon}</span>
      <strong>{title}</strong>
    </div>
  );
}

function Field({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>
        <strong>{label}</strong>
        <em>{value}</em>
      </span>
      {children}
    </label>
  );
}

function Insight({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="insight">
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
