import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  Banknote,
  Calculator,
  ClipboardList,
  HandCoins,
  Home,
  Leaf,
  PiggyBank,
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
  const [pulseKey, setPulseKey] = useState(0);
  const bestOption = journey.options.find((option) => option.id === selectedProductId) ?? journey.options[0];
  const progress = Math.min(100, Math.max(8, Math.round((journey.affordability.estimatedMonthlyPayment / journey.affordability.paymentCap) * 100)));

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

  return (
    <main className="app-shell tile-shell">
      <section className="tile-header">
        <div>
          <p className="kicker">Greenbridge Bank</p>
          <h1>Loan options at a glance</h1>
          <p>Adjust the customer needs tile, then review affordability, product fit, and next actions without leaving this card.</p>
        </div>
        <div className="tile-header-actions">
          <button className="icon-button" title="Request fullscreen" onClick={() => window.openai?.requestDisplayMode?.({ mode: "fullscreen" })}>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <section className="tile-board" aria-label="Loan journey tiles">
        <article className="journey-tile input-tile">
          <PanelTitle eyebrow="1" icon={<HandCoins size={18} />} title="Customer needs" />
          <div className="purpose-row" aria-label="Loan purpose">
            {purposes.slice(0, 4).map((purpose) => (
              <button
                key={purpose.id}
                className={purpose.id === journey.selectedPurpose ? "purpose-chip active" : "purpose-chip"}
                onClick={() => refreshOptions({ selectedPurpose: purpose.id })}
              >
                {purpose.icon}
                <span>{purpose.label}</span>
              </button>
            ))}
          </div>
          <Field label="Amount" value={currency(journey.input.requestedAmount)}>
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

          <div className="income-grid">
            <NumberField label="Monthly income" value={journey.input.monthlyIncome} onChange={(value) => updateInput({ monthlyIncome: value })} onBlur={() => refreshOptions()} />
            <NumberField label="Commitments" value={journey.input.monthlyCommitments} onChange={(value) => updateInput({ monthlyCommitments: value })} onBlur={() => refreshOptions()} />
            <NumberField label="Housing cost" value={journey.input.housingCost} onChange={(value) => updateInput({ housingCost: value })} onBlur={() => refreshOptions()} />
            <NumberField label="Dependants" value={journey.input.dependants} onChange={(value) => updateInput({ dependants: value })} onBlur={() => refreshOptions()} />
          </div>
        </article>

        <article className="journey-tile">
          <PanelTitle eyebrow="2" icon={<Calculator size={18} />} title="Affordability" />
          <div className="tile-metric-row">
            <Metric label="Monthly" value={currency(journey.affordability.estimatedMonthlyPayment)} pulseKey={pulseKey} />
            <Metric label="Guardrail" value={currency(journey.affordability.paymentCap)} pulseKey={pulseKey} />
          </div>
          <div className="tile-status">
            <div className="radial compact" key={`radial-${pulseKey}`} style={{ "--progress": `${progress}%` } as React.CSSProperties}>
              <span>{progress}%</span>
              <small>used</small>
            </div>
            <div>
              <strong>{journey.affordability.status}</strong>
              <p>{journey.affordability.confidence} confidence</p>
            </div>
          </div>
        </article>

        <article className="journey-tile">
          <PanelTitle eyebrow="3" icon={<Banknote size={18} />} title="Best fit option" />
          {bestOption ? (
            <button className="option-tile active" onClick={() => setSelectedProductId(bestOption.id)} style={{ "--score": `${bestOption.eligibilityScore}%` } as React.CSSProperties}>
              <span className="fit-pill">{bestOption.fit}</span>
              <strong>{bestOption.name}</strong>
              <small>{bestOption.representativeApr}% APR representative</small>
              <span className="score-track" aria-hidden="true" />
              <div className="option-summary">
                <span>{currency(bestOption.monthlyPayment)} / mo</span>
                <span>{bestOption.eligibilityScore}% fit</span>
              </div>
            </button>
          ) : (
            <div className="empty-state">
              <strong>No matching option</strong>
              <span>Change amount or term.</span>
            </div>
          )}
        </article>

        <article className="journey-tile action-tile">
          <PanelTitle eyebrow="4" icon={<ClipboardList size={18} />} title="Next action" />
          <p>{bestOption ? bestOption.bestFor : "Pick an option to continue."}</p>
          <div className="action-row compact-actions">
            <button onClick={() => bestOption && askFollowUp(`Explain why ${bestOption.name} is the best option for this Greenbridge demo borrower.`)}>
              Explain
            </button>
            <button onClick={() => bestOption && askFollowUp(`Prepare a digital application checklist for ${bestOption.name}.`)}>
              Checklist
            </button>
          </div>
          <small>{isRefreshing ? "Updating options..." : "Illustrative only. Not financial advice."}</small>
        </article>
      </section>
    </main>
  );
}

function NumberField({ label, value, onChange, onBlur }: { label: string; value: number; onChange: (value: number) => void; onBlur: () => void }) {
  return (
    <label className="number-field">
      <span>{label}</span>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        onBlur={onBlur}
      />
    </label>
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

function PanelTitle({ eyebrow, icon, title }: { eyebrow?: string; icon: React.ReactNode; title: string }) {
  return (
    <div className="panel-title">
      <span>{icon}</span>
      <div>
        {eyebrow ? <small>{eyebrow}</small> : null}
        <strong>{title}</strong>
      </div>
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
