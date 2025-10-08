'use server';

/**
 * @fileOverview A personalized financial news feed AI agent.
 *
 * - personalizedFinancialNewsFeed - A function that handles the personalized financial news feed process.
 * - PersonalizedFinancialNewsFeedInput - The input type for the personalizedFinancialNewsFeed function.
 * - PersonalizedFinancialNewsFeedOutput - The return type for the personalizedFinancialNewsFeed function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedFinancialNewsFeedInputSchema = z.object({
  interests: z
    .string()
    .describe('The user interests for financial news, comma separated.'),
  investmentPortfolio: z
    .string()
    .describe('The user investment portfolio, comma separated.'),
});
export type PersonalizedFinancialNewsFeedInput = z.infer<
  typeof PersonalizedFinancialNewsFeedInputSchema
>;

const PersonalizedFinancialNewsFeedOutputSchema = z.object({
  newsFeed: z.array(
    z.object({
      title: z.string().describe('The title of the news article.'),
      summary: z.string().describe('The summary of the news article.'),
      url: z.string().describe('The URL of the news article.'),
      relevanceScore: z
        .number()
        .describe('A score indicating the relevance of the article.'),
    })
  ),
});
export type PersonalizedFinancialNewsFeedOutput = z.infer<
  typeof PersonalizedFinancialNewsFeedOutputSchema
>;

export async function personalizedFinancialNewsFeed(
  input: PersonalizedFinancialNewsFeedInput
): Promise<PersonalizedFinancialNewsFeedOutput> {
  return personalizedFinancialNewsFeedFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedFinancialNewsFeedPrompt',
  input: {schema: PersonalizedFinancialNewsFeedInputSchema},
  output: {schema: PersonalizedFinancialNewsFeedOutputSchema},
  prompt: `You are an AI assistant specializing in curating personalized financial news feeds for users.

You will use the user's stated interests and investment portfolio to filter and summarize relevant financial news articles.

Prioritize articles that directly relate to the user's interests and investments.
Provide a relevance score for each article to indicate its importance to the user.

User Interests: {{{interests}}}
Investment Portfolio: {{{investmentPortfolio}}}

Format the output as a JSON array of news articles, each with a title, summary, URL, and relevance score.
`,
});

const personalizedFinancialNewsFeedFlow = ai.defineFlow(
  {
    name: 'personalizedFinancialNewsFeedFlow',
    inputSchema: PersonalizedFinancialNewsFeedInputSchema,
    outputSchema: PersonalizedFinancialNewsFeedOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
