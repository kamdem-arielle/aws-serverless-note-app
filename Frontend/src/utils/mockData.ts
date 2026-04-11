import { Note } from './types';

export const mockNotes: Note[] = [
{
  id: '1',
  title: 'Meeting Notes - Q4 Planning',
  content:
  'Discussed the roadmap for Q4. Key priorities include launching the new mobile app features, improving onboarding flow, and optimizing database queries. Next sync on Thursday.',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
  updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
  color: 'bg-blue-50'
},
{
  id: '2',
  title: 'Grocery List',
  content:
  '- Almond milk\n- Eggs\n- Spinach\n- Avocados\n- Whole wheat bread\n- Chicken breast\n- Greek yogurt',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  color: 'bg-green-50'
},
{
  id: '3',
  title: 'Book Recommendations',
  content:
  '1. "Atomic Habits" by James Clear\n2. "Deep Work" by Cal Newport\n3. "The Design of Everyday Things" by Don Norman\n4. "Project Hail Mary" by Andy Weir',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
  color: 'bg-yellow-50'
},
{
  id: '4',
  title: 'Travel Plans for Summer',
  content:
  'Looking into flights to Japan for late July. Need to check visa requirements, book JR pass, and find accommodations in Tokyo and Kyoto. Budget is around $3000.',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  color: 'bg-purple-50'
},
{
  id: '5',
  title: 'Project Ideas',
  content:
  '1. AI-powered recipe generator based on fridge contents\n2. Habit tracker with gamification elements\n3. Minimalist weather app with beautiful animations',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
  updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
  color: 'bg-pink-50'
},
{
  id: '6',
  title: 'Workout Routine',
  content:
  'Monday: Chest & Triceps\nTuesday: Back & Biceps\nWednesday: Rest/Cardio\nThursday: Legs & Core\nFriday: Shoulders\nWeekend: Active recovery (hiking/swimming)',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
  color: 'bg-orange-50'
}];