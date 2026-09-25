'use server';

import { financialChatbot } from '@/ai/ai-powered-financial-chatbot';
import { z } from 'zod';

const schema = z.object({
  query: z.string().min(1, 'Query is required.'),
  userData: z.string().default('{}'),
  history: z.string().optional(),
});

export type ChatFormState = {
  success: boolean;
  message: string;
  response: string | null;
  dataUsedExplanation?: string | null;
  suggestedFollowUps?: string[] | null;
  disclaimer?: string | null;
  query: string;
};

export async function generateChatResponse(
  prevState: ChatFormState,
  formData: FormData
): Promise<ChatFormState> {
  const validatedFields = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      ...prevState,
      success: false,
      message: 'Invalid form data. Please provide a query.',
      response: null,
    };
  }

  let historyArray: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  if (validatedFields.data.history) {
    try {
      historyArray = JSON.parse(validatedFields.data.history);
    } catch {
      historyArray = [];
    }
  }

  try {
    const result = await financialChatbot({
      query: validatedFields.data.query,
      userData: validatedFields.data.userData,
      history: historyArray,
    });

    return {
      success: true,
      message: 'Response generated successfully.',
      response: result.advice,
      dataUsedExplanation: result.dataUsedExplanation || null,
      suggestedFollowUps: result.suggestedFollowUps || null,
      disclaimer:
        result.disclaimer ||
        'FinWise AI provides educational and informational insights only and is not a registered financial advisor.',
      query: validatedFields.data.query,
    };
  } catch (error: any) {
    console.error('generateChatResponse error:', error);
    return {
      ...prevState,
      success: false,
      message: 'Failed to get a response from the AI. Please try again.',
      response: null,
    };
  }
}
