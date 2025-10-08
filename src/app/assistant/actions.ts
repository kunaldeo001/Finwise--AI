'use server';

import {
  financialChatbot,
  FinancialChatbotOutput,
} from '@/ai/ai-powered-financial-chatbot';
import { z } from 'zod';

const schema = z.object({
  query: z.string().min(1, 'Query is required.'),
  // These are hardcoded for now, but could be dynamic in a real app
  userData: z.string(),
  marketTrends: z.string(),
});

export type FormState = {
  success: boolean;
  message: string;
  response: FinancialChatbotOutput['advice'] | null;
  query: string;
};

export async function generateChatResponse(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      ...prevState,
      success: false,
      message: 'Invalid form data. Please provide a query.',
      response: null,
    };
  }

  try {
    const result = await financialChatbot(validatedFields.data);
    return {
      success: true,
      message: 'Response generated successfully.',
      response: result.advice,
      query: validatedFields.data.query,
    };
  } catch (error) {
    console.error(error);
    return {
      ...prevState,
      success: false,
      message: 'Failed to get a response from the AI. Please try again.',
      response: null,
    };
  }
}
