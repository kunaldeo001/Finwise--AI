
'use server';

import {
  personalizedFinancialNewsFeed,
  PersonalizedFinancialNewsFeedOutput,
} from '@/ai/flows/personalized-financial-news-feed';
import { z } from 'zod';

const schema = z.object({
  interests: z.string().min(3, 'Interests must be at least 3 characters.'),
  investmentPortfolio: z.string().min(2, 'Portfolio must have at least one stock.'),
});

type FormState = {
  success: boolean;
  message: string;
  data: PersonalizedFinancialNewsFeedOutput | null;
};

export async function generateNewsFeed(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form data. Please provide both interests and portfolio items.',
      data: null,
    };
  }

  try {
    const result = await personalizedFinancialNewsFeed(validatedFields.data);
    // Add a dummy URL if not provided by the AI
    const newsFeedWithUrls = result.newsFeed.map(item => ({
      ...item,
      url: item.url || '#',
    }));

    return {
      success: true,
      message: 'News feed generated successfully.',
      data: { newsFeed: newsFeedWithUrls },
    };
  } catch (error) {
    console.error(error);
    // For demonstration, return dummy data on failure
    const dummyData = {
        newsFeed: [
            { title: 'Market Hits All-Time High', summary: 'Major indices soared today driven by tech stocks.', url: '#', relevanceScore: 0.9 },
            { title: 'Federal Reserve to Announce Rate Decision', summary: 'All eyes are on the Fed as they conclude their two-day meeting.', url: '#', relevanceScore: 0.8 },
            { title: 'Understanding Your 401(k)', summary: 'A deep dive into maximizing your retirement savings.', url: '#', relevanceScore: 0.7 },
        ]
    };
    return {
      success: true,
      message: 'Could not fetch live data. Showing sample news.',
      data: dummyData
    };
  }
}
