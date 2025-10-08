'use server';

/**
 * @fileOverview A financial goal setting AI agent.
 *
 * - financialGoalSetting - A function that handles the financial goal setting process.
 * - FinancialGoalSettingInput - The input type for the financialGoalSetting function.
 * - FinancialGoalSettingOutput - The return type for the financialGoalSetting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialGoalSettingInputSchema = z.object({
  goal: z.string().describe('The financial goal to be achieved (e.g., retirement, down payment).'),
  currentSavings: z.number().describe('The current amount of savings.'),
  monthlyContribution: z.number().describe('The amount of money that can be contributed monthly.'),
  riskTolerance: z.enum(['low', 'medium', 'high']).describe('The risk tolerance level of the user.'),
  timeHorizon: z.number().describe('The time horizon in years to achieve the goal.'),
});
export type FinancialGoalSettingInput = z.infer<typeof FinancialGoalSettingInputSchema>;

const FinancialGoalSettingOutputSchema = z.object({
  goal: z.string().describe('The financial goal to be achieved (e.g., retirement, down payment).'),
  estimatedSavingsRequired: z.number().describe('The estimated savings required to achieve the goal.'),
  recommendedInvestmentStrategy: z.string().describe('The recommended investment strategy to achieve the goal.'),
  estimatedTimeToGoal: z.number().describe('The estimated time in years to achieve the goal.'),
  progressTracking: z.string().describe('A summary of the progress towards the goal and recommendations.'),
});
export type FinancialGoalSettingOutput = z.infer<typeof FinancialGoalSettingOutputSchema>;

export async function financialGoalSetting(input: FinancialGoalSettingInput): Promise<FinancialGoalSettingOutput> {
  return financialGoalSettingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialGoalSettingPrompt',
  input: {schema: FinancialGoalSettingInputSchema},
  output: {schema: FinancialGoalSettingOutputSchema},
  prompt: `You are a financial advisor helping users to achieve their financial goals.

  Based on the user's goal, current savings, monthly contribution, risk tolerance, and time horizon, provide a recommended investment strategy, estimated time to achieve the goal, and progress tracking summary.

  Goal: {{{goal}}}
  Current Savings: {{{currentSavings}}}
  Monthly Contribution: {{{monthlyContribution}}}
  Risk Tolerance: {{{riskTolerance}}}
  Time Horizon: {{{timeHorizon}}} years
  `,
});

const financialGoalSettingFlow = ai.defineFlow(
  {
    name: 'financialGoalSettingFlow',
    inputSchema: FinancialGoalSettingInputSchema,
    outputSchema: FinancialGoalSettingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
