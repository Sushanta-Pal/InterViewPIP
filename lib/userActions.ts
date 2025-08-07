// lib/userActions.ts

import { supabase } from './supabase';
import type { User } from '@clerk/nextjs/server';
import type { UserProfile, Session } from './types';

/**
 * Fetches a user's profile from the database.
 * @param userId - The ID of the user from Clerk.
 * @returns The user profile object or null if not found.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  // 'PGRST116' is the error code for "No rows found", which is not a real error in this case.
  if (error && error.code !== 'PGRST116') { 
    console.error('Error fetching user profile:', error);
    return null;
  }
  return data;
}

/**
 * Creates a new user profile if one doesn't already exist.
 * This should be called after a user signs up.
 * @param user - The user object from Clerk.
 */
export async function createUserProfile(user: User) {
    const existingProfile = await getUserProfile(user.id);
    if (existingProfile) {
        console.log("Profile already exists for user:", user.id);
        return existingProfile;
    }

    const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
            user_id: user.id,
            email: user.emailAddresses[0]?.emailAddress,
            username: user.username,
            session_history: [], // Start with an empty history
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating user profile:', error);
        return null;
    }
    console.log("Successfully created profile for user:", user.id);
    return data;
}

/**
 * Adds a new session to a user's session_history array in Supabase.
 * This function is called by the background worker.
 * @param userId - The ID of the user.
 * @param newSession - The new session object to add.
 */
export async function addSessionToHistory(userId: string, newSession: Session) {
  const userProfile = await getUserProfile(userId);
  if (!userProfile) {
    console.error('Cannot add session: User profile not found for user:', userId);
    return null;
  }

  // Prepend the new session to the beginning of the array
  const updatedHistory = [newSession, ...(userProfile.session_history || [])];
  
  // Recalculate average scores based on the new history
  const totalSessions = updatedHistory.length;
  const avgReading = updatedHistory.reduce((acc, s) => acc + s.feedback.scores.reading, 0) / totalSessions;
  const avgRepeating = updatedHistory.reduce((acc, s) => acc + s.feedback.scores.repetition, 0) / totalSessions;
  const avgComp = updatedHistory.reduce((acc, s) => acc + s.feedback.scores.comprehension, 0) / totalSessions;
  const avgOverall = updatedHistory.reduce((acc, s) => acc + s.feedback.scores.overall, 0) / totalSessions;

  // Update the user's profile in the database with the new history and scores
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ 
        session_history: updatedHistory,
        average_reading_score: Math.round(avgReading),
        average_repeating_score: Math.round(avgRepeating),
        average_comprehension_score: Math.round(avgComp),
        overall_average_score: Math.round(avgOverall),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating session history:', error);
  } else {
    console.log("Successfully added session for user:", userId);
  }
  return data;
}
