import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const supabase = createRouteHandlerClient({ cookies });

  // 1. Fetch the user's credentials from your custom table
  const { data: userCredentials, error: credentialsError } = await supabase
    .from('user_credentials')
    .select('password_hash')
    .eq('email', email)
    .single();

  if (credentialsError || !userCredentials) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 });
  }

  // 2. Compare the provided password with the stored hash
  const isPasswordValid = await bcrypt.compare(password, userCredentials.password_hash);

  if (!isPasswordValid) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 });
  }

  // 3. If passwords match, sign the user in using Supabase Auth
  // This step is crucial for creating a session and setting the auth cookie
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return NextResponse.json({ error: signInError.message }, { status: 500 });
  }

  // 4. If successful, return a success message
  return NextResponse.json({ message: 'Login successful!' }, { status: 200 });
}