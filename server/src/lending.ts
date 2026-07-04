export type LoanPurpose = "home_improvement" | "car" | "debt_consolidation" | "wedding" | "green_upgrade";
export type ApplicantScenario = "strong" | "balanced" | "stretched";
export type Channel = "digital" | "branch" | "phone";

export type AffordabilityInput = {
  monthlyIncome: number;
  monthlyCommitments: number;
  housingCost: number;
  dependants: number;
  requestedAmount: number;
  termMonths: number;
};

export type LoanProduct = {
  id: string;
  name: string;
  purposeFit: LoanPurpose[];
  minAmount: number;
  maxAmount: number;
  minTerm: number;
  maxTerm: number;
  representativeApr: number;
  arrangementFee: number;
  highlight: string;
  bestFor: string;
  caveat: string;
};

export const purposes: Record<LoanPurpose, string> = {
  home_improvement: "Home improvement",
  car: "Car purchase",
  debt_consolidation: "Debt consolidation",
  wedding: "Wedding or major event",
  green_upgrade: "Green home upgrade"
};

const products: LoanProduct[] = [
  {
    id: "gb-flex-personal",
    name: "Greenbridge Flex Loan",
    purposeFit: ["home_improvement", "car", "wedding"],
    minAmount: 1000,
    maxAmount: 25000,
    minTerm: 12,
    maxTerm: 84,
    representativeApr: 6.9,
    arrangementFee: 0,
    highlight: "Low-friction personal loan with no arrangement fee.",
    bestFor: "Borrowers who want speed, clarity, and predictable monthly payments.",
    caveat: "Final APR depends on credit and affordability assessment."
  },
  {
    id: "gb-green-home",
    name: "Greenbridge Green Home Loan",
    purposeFit: ["green_upgrade", "home_improvement"],
    minAmount: 2500,
    maxAmount: 35000,
    minTerm: 24,
    maxTerm: 96,
    representativeApr: 5.8,
    arrangementFee: 0,
    highlight: "Preferential demo rate for insulation, heat pump, solar, or EV charging work.",
    bestFor: "Customers improving energy efficiency and spreading the cost over longer terms.",
    caveat: "Customer may need supplier quotes or proof of eligible works."
  },
  {
    id: "gb-consolidator",
    name: "Greenbridge Consolidator",
    purposeFit: ["debt_consolidation"],
    minAmount: 3000,
    maxAmount: 40000,
    minTerm: 24,
    maxTerm: 84,
    representativeApr: 8.4,
    arrangementFee: 0,
    highlight: "Designed to simplify multiple repayments into one monthly payment.",
    bestFor: "Customers looking for a clearer repayment plan and fewer lenders.",
    caveat: "Consolidating debt may increase total interest if the term is extended."
  },
  {
    id: "gb-premier",
    name: "Greenbridge Premier Loan",
    purposeFit: ["home_improvement", "car", "green_upgrade"],
    minAmount: 15000,
    maxAmount: 50000,
    minTerm: 36,
    maxTerm: 96,
    representativeApr: 7.2,
    arrangementFee: 99,
    highlight: "Higher borrowing range with guided application support.",
    bestFor: "Larger planned projects where confidence and handoff quality matter.",
    caveat: "Arrangement fee is included in total cost estimates for this demo."
  }
];

const scenarioProfiles: Record<ApplicantScenario, AffordabilityInput> = {
  strong: {
    monthlyIncome: 4200,
    monthlyCommitments: 430,
    housingCost: 980,
    dependants: 0,
    requestedAmount: 12000,
    termMonths: 48
  },
  balanced: {
    monthlyIncome: 3250,
    monthlyCommitments: 610,
    housingCost: 875,
    dependants: 1,
    requestedAmount: 10000,
    termMonths: 60
  },
  stretched: {
    monthlyIncome: 2550,
    monthlyCommitments: 760,
    housingCost: 940,
    dependants: 2,
    requestedAmount: 14000,
    termMonths: 72
  }
};

export function getScenarioInput(scenario: ApplicantScenario = "balanced"): AffordabilityInput {
  return { ...scenarioProfiles[scenario] };
}

export function repayment(amount: number, apr: number, termMonths: number): number {
  const monthlyRate = apr / 100 / 12;
  if (monthlyRate === 0) return amount / termMonths;
  return (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
}

export function calculateAffordability(input: AffordabilityInput) {
  const dependantBuffer = input.dependants * 170;
  const essentialSpend = input.monthlyCommitments + input.housingCost + dependantBuffer;
  const disposable = Math.max(input.monthlyIncome - essentialSpend, 0);
  const paymentCap = Math.max(disposable * 0.32, 0);
  const stressPaymentCap = Math.max(disposable * 0.24, 0);
  const estimatedPayment = repayment(input.requestedAmount, 7.2, input.termMonths);
  const affordabilityRatio = paymentCap === 0 ? 2 : estimatedPayment / paymentCap;
  const maxComfortableBorrowing = Math.round((input.requestedAmount / Math.max(estimatedPayment, 1)) * stressPaymentCap / 100) * 100;

  const confidence =
    affordabilityRatio <= 0.78 ? "High" : affordabilityRatio <= 1 ? "Medium" : "Needs review";

  const status =
    confidence === "High"
      ? "Comfortable"
      : confidence === "Medium"
        ? "Possible with checks"
        : "Adjust amount or term";

  return {
    status,
    confidence,
    disposableIncome: Math.round(disposable),
    paymentCap: Math.round(paymentCap),
    estimatedMonthlyPayment: Math.round(estimatedPayment),
    suggestedMaxBorrowing: Math.max(maxComfortableBorrowing, 1000),
    notes: [
      `Estimated spare income after core commitments is GBP ${Math.round(disposable).toLocaleString("en-GB")} per month.`,
      `The demo affordability guardrail keeps repayments around GBP ${Math.round(paymentCap).toLocaleString("en-GB")} or below.`,
      input.dependants > 0
        ? `A dependant buffer of GBP ${dependantBuffer.toLocaleString("en-GB")} is included.`
        : "No dependant buffer is included in this scenario."
    ]
  };
}

export function compareOptions(input: AffordabilityInput & { purpose: LoanPurpose; scenario?: ApplicantScenario }) {
  const affordability = calculateAffordability(input);

  return products
    .filter((product) => {
      return (
        product.purposeFit.includes(input.purpose) &&
        input.requestedAmount >= product.minAmount &&
        input.requestedAmount <= product.maxAmount &&
        input.termMonths >= product.minTerm &&
        input.termMonths <= product.maxTerm
      );
    })
    .map((product) => {
      const monthlyPayment = repayment(input.requestedAmount + product.arrangementFee, product.representativeApr, input.termMonths);
      const totalRepayable = monthlyPayment * input.termMonths;
      const eligibilityScore = Math.max(
        52,
        Math.min(96, Math.round(96 - (monthlyPayment / Math.max(affordability.paymentCap, 1)) * 24 - product.representativeApr))
      );

      return {
        ...product,
        monthlyPayment: Math.round(monthlyPayment),
        totalRepayable: Math.round(totalRepayable),
        totalInterest: Math.round(totalRepayable - input.requestedAmount),
        eligibilityScore,
        fit: eligibilityScore > 82 ? "Best fit" : eligibilityScore > 68 ? "Good fit" : "Needs checks"
      };
    })
    .sort((a, b) => {
      if (a.fit === "Best fit" && b.fit !== "Best fit") return -1;
      if (b.fit === "Best fit" && a.fit !== "Best fit") return 1;
      return a.totalRepayable - b.totalRepayable;
    });
}

export function createJourney(input?: Partial<AffordabilityInput> & { purpose?: LoanPurpose; scenario?: ApplicantScenario }) {
  const scenario = input?.scenario ?? "balanced";
  const { purpose: requestedPurpose, scenario: _scenario, ...affordabilityInput } = input ?? {};
  const base = { ...getScenarioInput(scenario), ...affordabilityInput };
  const purpose = requestedPurpose ?? "home_improvement";
  const affordability = calculateAffordability(base);
  const options = compareOptions({ ...base, purpose, scenario });

  return {
    brand: {
      name: "Greenbridge Bank",
      proposition: "Borrowing with clarity, confidence, and a human next step."
    },
    selectedPurpose: purpose,
    purposeLabel: purposes[purpose],
    scenario,
    input: base,
    affordability,
    options,
    timeline: [
      { label: "Explore", status: "complete", detail: "Choose purpose and borrowing range." },
      { label: "Affordability", status: "active", detail: "Estimate monthly comfort and lending fit." },
      { label: "Compare", status: "active", detail: "Review product options and total cost." },
      { label: "Apply", status: "next", detail: "Prepare documents and channel handoff." }
    ],
    demoNotice: "Demo data only. This is not financial advice and is not connected to customer records or bank systems."
  };
}

export function checklist(productId: string, scenario: ApplicantScenario = "balanced", channel: Channel = "digital") {
  const product = products.find((item) => item.id === productId) ?? products[0];
  return {
    productId: product.id,
    productName: product.name,
    channel,
    scenario,
    documents: [
      "Proof of income for the last 3 months",
      "Current address history",
      "Existing credit commitments",
      product.id === "gb-green-home" ? "Supplier quote or eligible works summary" : "Loan purpose summary"
    ],
    questions: [
      "Is the requested term still comfortable if monthly costs rise?",
      "Would a lower amount or shorter term reduce total interest enough to matter?",
      "Does the customer need a branch, phone, or digital handoff?"
    ],
    handoff:
      channel === "branch"
        ? "Book an in-branch lending conversation with the selected product and affordability summary attached."
        : channel === "phone"
          ? "Schedule a specialist call and pre-fill the affordability summary for the advisor."
          : "Continue to a guided digital application with the checklist pre-populated."
  };
}
