import { ActivityLevel, Sex } from '../types';

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  intenso: 1.725,
  muy_intenso: 1.9,
};

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
 */
const calculateBMR = (weightKg: number, heightCm: number, age: number, sex: Sex): number => {
  if (sex === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
};

/**
 * Calculate Total Daily Energy Expenditure
 */
export const calculateTDEE = (
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex,
  activity: ActivityLevel
): number => {
  const bmr = calculateBMR(weightKg, heightCm, age, sex);
  const tdee = bmr * ACTIVITY_FACTORS[activity];
  return Math.round(tdee);
};

export const useCaloriesCalculator = () => {
  return { calculateTDEE };
};
