'use server';

/**
 * @fileOverview An AI-powered financial chatbot flow.
 *
 * - financialChatbot - A function that provides personalized financial insights and advice.
 * - FinancialChatbotInput - The input type for the financialChatbot function.
 * - FinancialChatbotOutput - The return type for the financialChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialChatbotInputSchema = z.object({
  userData: z
    .string()
    .describe('User financial data including investments, expenses, and goals.'),
  marketTrends: z.string().describe('Current stock market trends and analysis.'),
  query: z.string().describe('The user query or question.'),
});
export type FinancialChatbotInput = z.infer<typeof FinancialChatbotInputSchema>;

const FinancialChatbotOutputSchema = z.object({
  advice: z.string().describe('Personalized financial advice and insights.'),
});
export type FinancialChatbotOutput = z.infer<typeof FinancialChatbotOutputSchema>;

export async function financialChatbot(input: FinancialChatbotInput): Promise<FinancialChatbotOutput> {
  return financialChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialChatbotPrompt',
  input: {schema: FinancialChatbotInputSchema},
  output: {schema: FinancialChatbotOutputSchema},
  prompt: `You are a financial advisor chatbot providing personalized financial insights and advice.

  Based on the user's financial data and current market trends, answer the user's query.

  User Data: {{{userData}}}
  Market Trends: {{{marketTrends}}}
  Query: {{{query}}}

  Provide clear, actionable, and relevant financial advice.
  Speak with a helpful, trustworthy and concise tone.

  Include personalized planning when possible.

  Remember to respond in the first person.
  `,
});

const financialChatbotFlow = ai.defineFlow(
  {
    name: 'financialChatbotFlow',
    inputSchema: FinancialChatbotInputSchema,
    outputSchema: FinancialChatbotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
