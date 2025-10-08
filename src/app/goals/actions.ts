
'use server';

import {
  financialGoalSetting,
  FinancialGoalSettingInput,
  FinancialGoalSettingOutput,
} from '@/ai/flows/financial-goal-setting';
import { z } from 'zod';

const schema = z.object({
  goal: z.string().min(3, 'Goal must be at least 3 characters.'),
  currentSavings: z.coerce.number().min(0, 'Current savings must be a positive number.'),
  monthlyContribution: z.coerce.number().min(0, 'Monthly contribution must be a positive number.'),
  riskTolerance: z.enum(['low', 'medium', 'high']),
  timeHorizon: z.coerce.number().min(1, 'Time horizon must be at least 1 year.'),
});

type FormState = {
  success: boolean;
  message: string;
  data: FinancialGoalSettingOutput | null;
};

export async function generateGoalSuggestion(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form data. Please check your inputs.',
      data: null,
    };
  }

  try {
    const result = await financialGoalSetting(validatedFields.data as FinancialGoalSettingInput);
    return {
      success: true,
      message: 'Suggestion generated successfully.',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to generate suggestion. Please try again later.',
      data: null,
    };
  }
}
