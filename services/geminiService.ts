
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Transaction, FinancialSummary, ReceiptAnalysisResult, BudgetSuggestionResult, Category, TransactionType, Invoice, GoalSuggestion, ChatMessage, AiActionResponse, Profile, Product, Budget, Goal, CashFlowPoint, MarketTrendRecommendation, Investment, PortfolioSuggestion, EnterpriseMetrics, Anomaly } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to clean JSON string from Markdown code blocks
const cleanJsonString = (text: string) => {
    if (!text) return "[]";
    let clean = text.trim();
    
    // Remove markdown code blocks (```json ... ``` or ``` ... ```)
    clean = clean.replace(/```json/g, '').replace(/```/g, '');
    
    // Remove any text before the first [ or {
    const firstArray = clean.indexOf('[');
    const firstObj = clean.indexOf('{');
    
    if (firstArray !== -1 && (firstObj === -1 || firstArray < firstObj)) {
        clean = clean.substring(firstArray);
    } else if (firstObj !== -1) {
        clean = clean.substring(firstObj);
    }
    
    // Remove any text after the last ] or }
    const lastArray = clean.lastIndexOf(']');
    const lastObj = clean.lastIndexOf('}');
    
    if (lastArray !== -1 && (lastObj === -1 || lastArray > lastObj)) {
        clean = clean.substring(0, lastArray + 1);
    } else if (lastObj !== -1) {
        clean = clean.substring(0, lastObj + 1);
    }

    return clean.trim();
};

const extractSources = (response: GenerateContentResponse) => {
    const sources: { title: string; uri: string }[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
            if (chunk.web) {
                sources.push({ title: chunk.web.title, uri: chunk.web.uri });
            }
        });
    }
    return sources;
};

export const getFinancialAnalysis = async (
  transactions: Transaction[],
  summary: FinancialSummary,
  userQuery: string
): Promise<{ text: string; sources: { title: string; uri: string }[] }> => {
  try {
    const model = "gemini-2.5-flash";
    const systemInstruction = `You are an expert financial analyst for small to medium-sized businesses. 
Your tone should be professional, encouraging, and clear. 
Analyze the provided JSON data which includes a financial summary and a list of transactions. 
Based on this data, answer the user's query. 
Use Google Search to find up-to-date information on market trends, tax laws, or economic news if the user's query requires external context.

**FORMATTING INSTRUCTIONS:**
- Use **bold** for key figures and important terms.
- Use ### for Section Headers.
- Use - or * for bullet points.
- Keep paragraphs short and readable.
- Do NOT use complex markdown tables or code blocks.

Provide actionable insights, identify key trends, and offer specific, data-backed recommendations.`;

    const prompt = `
      **Financial Data:**
      \`\`\`json
      {
        "summary": ${JSON.stringify(summary)},
        "recent_transactions": ${JSON.stringify(transactions.slice(0, 50))} 
      }
      \`\`\`
      (Note: Only the most recent 50 transactions are provided for context.)

      **User Query:**
      "${userQuery}"

      **Your Analysis:**
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.5,
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "No analysis generated.";
    const sources = extractSources(response);

    return { text, sources };
  } catch (error) {
    console.error("Error generating financial analysis:", error);
    if (error instanceof Error) {
      return { text: `An error occurred while analyzing your financial data: ${error.message}. Please check your connection or API key.`, sources: [] };
    }
    return { text: 'An unknown error occurred while analyzing your financial data.', sources: [] };
  }
};

export const analyzeReceipt = async (base64ImageData: string, mimeType: string): Promise<ReceiptAnalysisResult> => {
  try {
    const model = 'gemini-2.5-flash';
    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64ImageData,
      },
    };
    const textPart = {
      text: "Analyze this receipt. Extract the vendor name, the full transaction date, and the final total amount. The date should be in YYYY-MM-DD format."
    };
    
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        vendor: { type: Type.STRING, description: 'The name of the store, vendor, or service provider.' },
        date: { type: Type.STRING, description: 'The date of the transaction in YYYY-MM-DD format.' },
        totalAmount: { type: Type.NUMBER, description: 'The final total amount paid on the receipt.' },
      },
      required: ['vendor', 'date', 'totalAmount'],
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: { parts: [textPart, imagePart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    
    // Basic validation
    if (!parsed.vendor || !parsed.date || typeof parsed.totalAmount !== 'number') {
        throw new Error("AI response is missing required fields or has an incorrect type.");
    }
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
        throw new Error(`AI returned an invalid date format: ${parsed.date}. Expected YYYY-MM-DD.`);
    }

    return parsed as ReceiptAnalysisResult;

  } catch (error) {
    console.error("Error analyzing receipt:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to analyze receipt: ${error.message}`);
    }
    throw new Error('An unknown error occurred during receipt analysis.');
  }
};

export const getBudgetSuggestion = async (
  categoryId: string,
  allCategories: Category[],
  allTransactions: Transaction[],
): Promise<BudgetSuggestionResult> => {
  try {
    const categoryMap = new Map(allCategories.map(c => [c.id, c]));
    const targetCategory = categoryMap.get(categoryId);
    if (!targetCategory) {
      throw new Error("Category not found.");
    }
    
    const childCategoryIds = allCategories.filter(c => c.parentId === categoryId).map(c => c.id);
    const relevantCategoryIds = new Set([categoryId, ...childCategoryIds]);
    const relevantCategoryNames = [...relevantCategoryIds].map(id => categoryMap.get(id)?.name).filter(Boolean);

    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are a helpful financial assistant. Your goal is to suggest a realistic monthly budget for a specific expense category based on the user's past transaction data. Analyze the provided transactions, calculate an average monthly spending, and suggest a budget that is slightly rounded up. Provide a brief, one-sentence explanation for your suggestion.`;

    const relevantTransactions = allTransactions.filter(t => {
        const category = allCategories.find(c => c.name === t.category);
        return category && relevantCategoryIds.has(category.id) && t.type === TransactionType.EXPENSE;
    });

    const prompt = `
        **Category to budget for:** ${targetCategory.name}
        **This group includes subcategories:** ${relevantCategoryNames.slice(1).join(', ') || 'None'}
        **Past Transactions for this category group (up to 3 months):**
        \`\`\`json
        ${JSON.stringify(relevantTransactions.slice(0, 50))}
        \`\`\`
        Based on this data, suggest a monthly budget amount and provide a short explanation.
    `;
    
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        suggestedAmount: { type: Type.NUMBER, description: 'The suggested monthly budget amount, as a number.' },
        explanation: { type: Type.STRING, description: 'A single, brief sentence explaining the suggestion.' },
      },
      required: ['suggestedAmount', 'explanation'],
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      }
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);

    if (typeof parsed.suggestedAmount !== 'number' || !parsed.explanation) {
        throw new Error("AI response is missing required fields or has an incorrect type.");
    }

    return parsed as BudgetSuggestionResult;

  } catch (error) {
    console.error("Error generating budget suggestion:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to get suggestion: ${error.message}`);
    }
    throw new Error('An unknown error occurred during budget suggestion.');
  }
};

export const getInvoiceReminderDraft = async (
    invoice: Invoice,
    profileName: string
): Promise<string> => {
    try {
        const model = "gemini-2.5-flash";
        const systemInstruction = `You are a professional and polite accounting assistant. Your task is to draft a short, friendly reminder email for an overdue invoice. The tone should be firm but courteous.`;

        const totalAmount = invoice.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        const prompt = `
            My business name is "${profileName}".
            I need to send a reminder for an invoice to my client, "${invoice.clientName}".
            
            Invoice Details:
            - Invoice ID: #${invoice.id.slice(-6)}
            - Due Date: ${invoice.dueDate}
            - Amount Due: ${totalAmount}
            
            Please draft a concise and friendly reminder email. Include the invoice ID, due date, and amount.
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
            }
        });

        return response.text || "";
    } catch (error) {
        console.error("Error generating invoice reminder:", error);
        if (error instanceof Error) {
            return `An error occurred: ${error.message}`;
        }
        return 'An unknown error occurred while generating the reminder.';
    }
};

export const getGoalSuggestion = async (
  description: string,
  currency: string,
): Promise<GoalSuggestion> => {
    try {
        const model = 'gemini-2.5-flash';
        const systemInstruction = `You are a helpful financial assistant. Your goal is to analyze a user's financial goal description and provide a structured response.
        - Give the goal a short, clear name.
        - Estimate a realistic target amount for the specified currency.
        - Provide a very brief, one-sentence reasoning for your estimate.
        The user is a small business owner or professional.`;

        const prompt = `
            User's goal description: "${description}"
            Currency for the target amount: ${currency}
        `;
        
        const responseSchema = {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'A short, clear name for the goal (e.g., "New Laptop Upgrade", "Emergency Fund").' },
            targetAmount: { type: Type.NUMBER, description: 'A realistic estimated cost for this goal in the specified currency.' },
            reasoning: { type: Type.STRING, description: 'A single, brief sentence explaining the estimated amount.' },
          },
          required: ['name', 'targetAmount', 'reasoning'],
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
          }
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);

        if (!parsed.name || typeof parsed.targetAmount !== 'number' || !parsed.reasoning) {
            throw new Error("AI response is missing required fields or has an incorrect type.");
        }

        return parsed as GoalSuggestion;
    } catch (error) {
        console.error("Error generating goal suggestion:", error);
        if (error instanceof Error) {
          throw new Error(`Failed to get suggestion: ${error.message}`);
        }
        throw new Error('An unknown error occurred during goal suggestion.');
    }
};

export const getChatResponse = async (
    dataContext: {
        profile: Profile;
        summary: FinancialSummary;
        transactions: Transaction[];
        invoices: Invoice[];
        budgets: Budget[];
        goals: Goal[];
        products: Product[];
        categories: Category[];
    },
    chatHistory: ChatMessage[],
    userQuery: string
): Promise<AiActionResponse> => {
    try {
        const model = 'gemini-2.5-flash';
        const systemInstruction = `You are an intelligent assistant for the "Yans Pro" financial app.
        Your capabilities are:
        1.  **Answering Questions**: Answer questions about the user's financial data provided in the context. Be concise and clear.
        2.  **Performing Actions**: If the user asks to perform an action (like adding a transaction or creating an invoice), identify the action and extract the parameters.
        
        **RESPONSE RULES:**
        - You MUST respond in the JSON format defined in the schema.
        - If answering a question, set responseType to "ANSWER" and provide the answer in responseText.
        - If performing an action, set responseType to "ACTION", set responseText to a confirmation message (e.g., "OK, adding that expense."), and populate the "action" object with the type and parameters.
        - Today's date is ${new Date().toISOString().split('T')[0]}. Use this for actions unless another date is specified.
        - For amounts, only use numbers, no currency symbols.
        - For invoice items, infer quantity as 1 if not specified.
        - Be smart about categories. If a user says "lunch", use a reasonable category like "Office Supplies" or another relevant one from the list.
        - The user is speaking to you; refer to them as "you" and yourself as "I".`;

        const prompt = `
            **Data Context:**
            \`\`\`json
            ${JSON.stringify(dataContext)}
            \`\`\`
            
            **Conversation History:**
            \`\`\`json
            ${JSON.stringify(chatHistory.slice(-6))}
            \`\`\`

            **User's Latest Message:**
            "${userQuery}"
        `;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                responseType: { type: Type.STRING, enum: ['ANSWER', 'ACTION'] },
                responseText: { type: Type.STRING, description: "A conversational response to the user. This is what the user will see." },
                action: {
                    type: Type.OBJECT,
                    nullable: true,
                    properties: {
                        type: { type: Type.STRING, enum: ['add_transaction', 'create_invoice', 'add_product'], description: "The type of action to perform." },
                        params: {
                            type: Type.OBJECT,
                            description: "Parameters for the action. Varies based on action type.",
                            properties: {
                                // For 'add_transaction'
                                description: { type: Type.STRING, nullable: true },
                                amount: { type: Type.NUMBER, nullable: true },
                                transactionType: { type: Type.STRING, enum: ['Income', 'Expense'], nullable: true, description: "The transaction's type ('Income' or 'Expense')." },
                                category: { type: Type.STRING, nullable: true },
                                date: { type: Type.STRING, format: 'date-time', nullable: true },
                                // For 'create_invoice'
                                clientName: { type: Type.STRING, nullable: true },
                                dueDate: { type: Type.STRING, format: 'date-time', nullable: true },
                                items: {
                                    type: Type.ARRAY,
                                    nullable: true,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            description: { type: Type.STRING },
                                            quantity: { type: Type.NUMBER },
                                            price: { type: Type.NUMBER },
                                        }
                                    }
                                },
                                // For 'add_product'
                                name: { type: Type.STRING, nullable: true },
                                price: { type: Type.NUMBER, nullable: true },
                                productType: { type: Type.STRING, enum: ['service', 'good'], nullable: true, description: "The product's type ('service' or 'good')."}
                            }
                        }
                    }
                }
            },
            required: ['responseType', 'responseText']
        };

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                temperature: 0.2
            }
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);

        if (!parsed.responseType || !parsed.responseText) {
            throw new Error("AI response is missing required fields.");
        }

        return parsed as AiActionResponse;

    } catch (error) {
        console.error("Error getting chat response:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to get chat response: ${error.message}`);
        }
        throw new Error('An unknown error occurred during chat processing.');
    }
};

export const generateCashFlowForecast = async (
    historicalData: { month: string; netFlow: number }[]
): Promise<CashFlowPoint[]> => {
    try {
        const model = 'gemini-2.5-flash';
        const systemInstruction = `You are a financial forecasting expert. 
        Analyze the provided historical monthly net cash flow data.
        Identify trends, seasonality, and volatility.
        Predict the net cash flow for the next 3 months.
        Return the response as a JSON array of objects, where each object represents a future month.`;

        const prompt = `
            **Historical Monthly Net Cash Flow:**
            \`\`\`json
            ${JSON.stringify(historicalData)}
            \`\`\`
            
            Please predict the next 3 months.
            For each predicted month, provide:
            - "month": The name of the month and year (e.g., "Aug 24").
            - "forecastAmount": The predicted net cash flow amount (number).
            - "reasoning": A brief explanation for this prediction (string).
        `;

        const responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    month: { type: Type.STRING, description: "e.g., 'Aug 24'" },
                    forecastAmount: { type: Type.NUMBER },
                    reasoning: { type: Type.STRING },
                },
                required: ['month', 'forecastAmount', 'reasoning']
            }
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                temperature: 0.3
            }
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);

        if (!Array.isArray(parsed)) {
            throw new Error("AI did not return an array.");
        }

        return parsed.map((item: any) => ({
            month: item.month,
            forecastAmount: item.forecastAmount,
            isForecast: true,
            reasoning: item.reasoning
        }));

    } catch (error) {
        console.error("Error generating cash flow forecast:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate forecast: ${error.message}`);
        }
        throw new Error('An unknown error occurred during forecasting.');
    }
};

export const getPortfolioMarketData = async (
    symbols: string[], 
    currentPrices: { [symbol: string]: number } = {}
): Promise<{ [symbol: string]: number }> => {
    try {
        if (symbols.length === 0) return {};
        
        const model = 'gemini-2.5-flash';
        const prompt = `Find the current real-time stock/asset price for the following symbols: ${symbols.join(', ')}. 
        Return ONLY a raw JSON object where keys are symbols and values are the current price as a number. 
        Example: {"AAPL": 150.25, "BTC": 60000.00}
        Do not use markdown code blocks.`;
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });

        const jsonText = cleanJsonString(response.text || "{}");
        const parsed = JSON.parse(jsonText);
        
        // Validation: Ensure values are numbers
        Object.keys(parsed).forEach(key => {
            if (typeof parsed[key] !== 'number') delete parsed[key];
        });
        
        return parsed;
    } catch (error) {
        console.error("Error fetching market data, using simulation fallback:", error);
        
        // Fallback: Simulate random movement +/- 2% based on current price
        // If no current price is known, we default to 100 (which will be wrong, but better than 0 crash)
        const simulatedPrices: { [key: string]: number } = {};
        symbols.forEach(sym => {
            const basePrice = currentPrices[sym] || 100;
            const volatility = 0.04; // 4% range
            const change = (Math.random() * volatility) - (volatility / 2); // -2% to +2%
            const newPrice = basePrice * (1 + change);
            simulatedPrices[sym] = parseFloat(newPrice.toFixed(2));
        });
        
        return simulatedPrices;
    }
};

export const getMarketRecommendations = async (): Promise<{ recommendations: MarketTrendRecommendation[]; sources: { title: string; uri: string }[] }> => {
    try {
        const model = 'gemini-2.5-flash';
        const prompt = `Analyze current global market trends for ${new Date().getFullYear()}. 
        Identify 3 potential investment sectors or opportunities based on latest news.
        Provide a structured RAW JSON response (Array of Objects) with the following fields for each recommendation:
        - sector: The name of the sector (e.g. "Green Energy")
        - sentiment: "Bullish", "Bearish", or "Neutral"
        - reasoning: A short explanation (max 20 words)
        - riskLevel: "Low", "Medium", or "High"
        - suggestedAction: "Buy", "Hold", or "Watch"
        
        Do not use Markdown formatting or code blocks. Just the raw JSON string.`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });

        const jsonText = cleanJsonString(response.text || "[]");
        const recommendations = JSON.parse(jsonText) as MarketTrendRecommendation[];
        const sources = extractSources(response);
        return { recommendations, sources };
    } catch (error) {
        console.error("Error fetching market recommendations:", error);
        return { recommendations: [], sources: [] };
    }
};

// Interface for search results
export interface AssetSearchResult {
    symbol: string;
    name: string;
    currentPrice: number;
    type: 'Stock' | 'Crypto' | 'Bond' | 'Real Estate' | 'Mutual Fund';
}

export const searchAssets = async (query: string): Promise<AssetSearchResult[]> => {
    try {
        const model = 'gemini-2.5-flash';
        const prompt = `Search for financial assets matching the query: "${query}".
        Look for stocks, ETFs, cryptocurrencies, or mutual funds.
        Return a list of up to 5 matching assets.
        For each asset, provide:
        - symbol: Ticker symbol (e.g., AAPL, BTC, VOO).
        - name: Full name of the asset.
        - currentPrice: Current market price as a number (in USD).
        - type: Classify as 'Stock', 'Crypto', 'Bond', 'Real Estate', or 'Mutual Fund'.
        
        Return ONLY a raw JSON array. Do not use Markdown formatting.`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });

        const jsonText = cleanJsonString(response.text || "[]");
        return JSON.parse(jsonText) as AssetSearchResult[];
    } catch (error) {
        console.error("Error searching assets:", error);
        return [];
    }
};

export const getAiPortfolioAnalysis = async (
    portfolio: Investment[],
    totalValue: number
): Promise<{ suggestions: PortfolioSuggestion[]; sources: { title: string; uri: string }[] }> => {
    try {
        const model = 'gemini-2.5-flash';
        
        // Simplify portfolio for the prompt to save tokens and focus on structure
        const simplifiedPortfolio = portfolio.map(p => ({
            symbol: p.symbol,
            type: p.type,
            allocation: totalValue > 0 ? ((p.quantity * p.avgBuyPrice) / totalValue * 100).toFixed(2) + '%' : '0%',
            target: p.targetAllocation ? p.targetAllocation + '%' : 'Not set'
        }));

        const prompt = `Analyze this portfolio structure: ${JSON.stringify(simplifiedPortfolio)}.
        Total Portfolio Value: ${totalValue}.
        
        Using Google Search, identify current market trends and risks associated with these assets or asset classes.
        Based on the portfolio's current allocation and these real-time trends, suggest 3 to 5 specific investment actions.
        Suggestions can be to buy new assets (to diversify), sell existing ones (if risky), or hold/rebalance.
        
        Return the response as a RAW JSON Array (no markdown code blocks) of objects with this shape:
        [
            {
                "symbol": "Ticker",
                "name": "Asset Name",
                "action": "Buy" | "Sell" | "Hold" | "Rebalance",
                "reasoning": "Brief explanation (max 30 words) why this action is recommended based on current news/data.",
                "riskLevel": "Low" | "Medium" | "High",
                "targetPrice": 0 (Optional estimated target price, number)
            }
        ]
        
        Ensure valid JSON.`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.4
            }
        });

        const jsonText = cleanJsonString(response.text || "[]");
        const suggestions = JSON.parse(jsonText) as PortfolioSuggestion[];
        const sources = extractSources(response);
        return { suggestions, sources };

    } catch (error) {
        console.error("Error getting AI portfolio analysis:", error);
        return { suggestions: [], sources: [] };
    }
};

export const generateExecutiveSummary = async (
    metrics: EnterpriseMetrics,
    anomalies: Anomaly[],
    profileName: string
): Promise<string> => {
    try {
        const model = 'gemini-2.5-flash';
        const systemInstruction = `You are a high-level CFO (Chief Financial Officer) for a company named "${profileName}".
        Generate a concise, professional Executive Summary suitable for a board meeting.
        
        Focus on:
        1.  **Valuation & Health**: Comment on the current valuation and health score.
        2.  **Runway & Cash**: Assess the burn rate and runway. Is it safe?
        3.  **Risk Management**: Briefly mention any detected anomalies if they are severe.
        
        Format using Markdown with bolding for emphasis. Keep it under 200 words.`;

        const prompt = `
            Company Metrics:
            - Valuation: ${metrics.valuation}
            - Burn Rate: ${metrics.burnRate}
            - Runway: ${metrics.runwayMonths} months
            - Health Score: ${metrics.healthScore}/100
            - Est EBITDA: ${metrics.ebitdaEst}
            
            Anomalies Detected: ${anomalies.length}
            Top Anomaly: ${anomalies[0] ? anomalies[0].description : 'None'}
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                temperature: 0.6
            }
        });

        return response.text || "Summary unavailable.";

    } catch (error) {
        console.error("Error generating executive summary:", error);
        return "Failed to generate summary.";
    }
};
