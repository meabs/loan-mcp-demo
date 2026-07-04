import express from "express";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import {
  calculateAffordability,
  checklist,
  compareOptions,
  createJourney,
  getScenarioInput,
  type ApplicantScenario,
  type Channel,
  type LoanPurpose
} from "./lending.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = join(__dirname, "../..");
const widgetUri = "ui://greenbridge/loan-journey-v1.html";
const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? "https://loan.mcp.meaburn.com";
const port = Number(process.env.PORT ?? 3000);

const purposeSchema = z.enum(["home_improvement", "car", "debt_consolidation", "wedding", "green_upgrade"]);
const scenarioSchema = z.enum(["strong", "balanced", "stretched"]);
const channelSchema = z.enum(["digital", "branch", "phone"]);

function readWidgetHtml() {
  const js = readFileSync(join(rootDir, "web/dist/greenbridge-widget.js"), "utf8");
  let css = "";
  try {
    css = readFileSync(join(rootDir, "web/dist/greenbridge-widget.css"), "utf8");
  } catch {
    css = "";
  }

  return `
    <div id="root"></div>
    <style>${css}</style>
    <script type="module">${js}</script>
  `.trim();
}

function makeServer() {
  const server = new McpServer(
    {
      name: "greenbridge-loans",
      version: "1.0.0"
    },
    {
      instructions:
        "Greenbridge Bank is a fictional loan demo. Use start_loan_journey first for a visual borrower journey, then refine affordability, compare loan options, or prepare a checklist. All figures are mock data and not financial advice."
    }
  );

  registerAppResource(
    server,
    "Greenbridge loan journey",
    widgetUri,
    {
      description: "A polished borrower loan-selection and affordability widget.",
      _meta: {
        ui: {
          prefersBorder: false,
          domain: publicBaseUrl,
          csp: {
            connectDomains: [publicBaseUrl],
            resourceDomains: [publicBaseUrl]
          }
        }
      }
    },
    async () => ({
      contents: [
        {
          uri: widgetUri,
          mimeType: RESOURCE_MIME_TYPE,
          text: readWidgetHtml(),
          _meta: {
            ui: {
              prefersBorder: false,
              domain: publicBaseUrl,
              csp: {
                connectDomains: [publicBaseUrl],
                resourceDomains: [publicBaseUrl]
              }
            }
          }
        }
      ]
    })
  );

  const toolMeta = {
    ui: {
      resourceUri: widgetUri
    },
    "openai/toolInvocation/invoking": "Building the Greenbridge loan journey",
    "openai/toolInvocation/invoked": "Greenbridge loan journey ready"
  };

  registerAppTool(
    server,
    "start_loan_journey",
    {
      title: "Start loan journey",
      description:
        "Use this when a borrower wants to explore loan purposes, estimate affordability, and see a visual loan-selection journey.",
      inputSchema: {
        purpose: purposeSchema.optional(),
        requestedAmount: z.number().min(1000).max(50000).optional(),
        termMonths: z.number().int().min(12).max(96).optional(),
        scenario: scenarioSchema.optional()
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      },
      _meta: toolMeta
    },
    async ({ purpose, requestedAmount, termMonths, scenario }) => {
      const journey = createJourney({
        purpose: purpose as LoanPurpose | undefined,
        requestedAmount,
        termMonths,
        scenario: scenario as ApplicantScenario | undefined
      });
      return {
        structuredContent: journey,
        content: [
          {
            type: "text",
            text: `Opened the Greenbridge loan journey for ${journey.purposeLabel}. ${journey.demoNotice}`
          }
        ],
        _meta: {
          generatedAt: new Date().toISOString(),
          demoRunId: randomUUID()
        }
      };
    }
  );

  registerAppTool(
    server,
    "calculate_affordability",
    {
      title: "Calculate affordability",
      description:
        "Use this when the borrower changes income, outgoings, loan amount, term, or household assumptions and needs a refreshed affordability estimate.",
      inputSchema: {
        monthlyIncome: z.number().min(0).max(50000),
        monthlyCommitments: z.number().min(0).max(50000),
        housingCost: z.number().min(0).max(50000),
        dependants: z.number().int().min(0).max(8),
        requestedAmount: z.number().min(1000).max(50000),
        termMonths: z.number().int().min(12).max(96)
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      },
      _meta: {
        ...toolMeta,
        "openai/toolInvocation/invoking": "Refreshing affordability",
        "openai/toolInvocation/invoked": "Affordability refreshed"
      }
    },
    async (input) => {
      const affordability = calculateAffordability(input);
      return {
        structuredContent: {
          input,
          affordability,
          demoNotice: "Demo affordability only. This is not financial advice or a credit decision."
        },
        content: [
          {
            type: "text",
            text: `Estimated monthly payment is GBP ${affordability.estimatedMonthlyPayment}; affordability status is ${affordability.status}.`
          }
        ]
      };
    }
  );

  registerAppTool(
    server,
    "compare_loan_options",
    {
      title: "Compare loan options",
      description:
        "Use this when the borrower has a purpose, amount, term, and affordability profile and wants ranked Greenbridge demo loan options.",
      inputSchema: {
        purpose: purposeSchema,
        monthlyIncome: z.number().min(0).max(50000).optional(),
        monthlyCommitments: z.number().min(0).max(50000).optional(),
        housingCost: z.number().min(0).max(50000).optional(),
        dependants: z.number().int().min(0).max(8).optional(),
        requestedAmount: z.number().min(1000).max(50000),
        termMonths: z.number().int().min(12).max(96),
        scenario: scenarioSchema.optional()
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      },
      _meta: {
        ...toolMeta,
        "openai/toolInvocation/invoking": "Comparing loan options",
        "openai/toolInvocation/invoked": "Loan options compared"
      }
    },
    async ({ purpose, requestedAmount, termMonths, scenario, monthlyIncome, monthlyCommitments, housingCost, dependants }) => {
      const base = getScenarioInput((scenario ?? "balanced") as ApplicantScenario);
      const input = {
        ...base,
        monthlyIncome: monthlyIncome ?? base.monthlyIncome,
        monthlyCommitments: monthlyCommitments ?? base.monthlyCommitments,
        housingCost: housingCost ?? base.housingCost,
        dependants: dependants ?? base.dependants,
        requestedAmount,
        termMonths
      };
      const affordability = calculateAffordability(input);
      const options = compareOptions({ ...input, purpose: purpose as LoanPurpose, scenario: scenario as ApplicantScenario | undefined });
      return {
        structuredContent: {
          selectedPurpose: purpose,
          input,
          affordability,
          options,
          demoNotice: "Demo comparison only. Rates and eligibility are illustrative."
        },
        content: [
          {
            type: "text",
            text:
              options.length > 0
                ? `Compared ${options.length} Greenbridge demo loan option${options.length === 1 ? "" : "s"}.`
                : "No matching demo loan options were found for that amount and term."
          }
        ]
      };
    }
  );

  registerAppTool(
    server,
    "prepare_application_checklist",
    {
      title: "Prepare application checklist",
      description:
        "Use this when the borrower has selected a demo product and wants documents, questions, and a digital, branch, or phone handoff plan.",
      inputSchema: {
        productId: z.string().min(1),
        scenario: scenarioSchema.optional(),
        channel: channelSchema.optional()
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      },
      _meta: {
        ...toolMeta,
        "openai/toolInvocation/invoking": "Preparing next steps",
        "openai/toolInvocation/invoked": "Next steps prepared"
      }
    },
    async ({ productId, scenario, channel }) => {
      const result = checklist(productId, scenario as ApplicantScenario | undefined, channel as Channel | undefined);
      return {
        structuredContent: {
          checklist: result,
          demoNotice: "Demo checklist only. A real application would require regulated disclosures and eligibility checks."
        },
        content: [
          {
            type: "text",
            text: `Prepared a ${result.channel} application checklist for ${result.productName}.`
          }
        ]
      };
    }
  );

  return server;
}

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "greenbridge-loans", mcp: "/mcp" });
});

app.get(["/", "/preview"], (_req, res) => {
  res.type("html").send(`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Greenbridge Loans MCP Demo</title>
      </head>
      <body>${readWidgetHtml()}</body>
    </html>`);
});

app.post("/mcp", async (req, res) => {
  const server = makeServer();
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on("close", () => {
      transport.close();
      server.close();
    });
  } catch (error) {
    console.error("Error handling MCP request", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error"
        },
        id: null
      });
    }
  }
});

app.get("/mcp", (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Use POST for MCP Streamable HTTP requests."
    },
    id: null
  });
});

app.listen(port, () => {
  console.log(`Greenbridge Loans MCP server listening on http://127.0.0.1:${port}`);
});
