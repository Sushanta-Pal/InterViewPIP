import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const { 
    email, 
    password, 
    full_name,
    roll_number,
    university,
    department,
    phone_number,
    gender,
    date_of_birth,
  } = await request.json();

  const supabase = createRouteHandlerClient({ cookies });

  // Check if user already exists in user_details
  const { data: existingUser, error: existingUserError } = await supabase
    .from('user_details')
    .select('email')
    .eq('email', email)
    .single();

  if (existingUser) {
    return NextResponse.json({ error: 'User with this email already exists.' }, { status: 400 });
  }

  // Use a transaction to ensure both inserts succeed or fail together
  try {
    // 1. Insert into user_details table
    const { error: detailsError } = await supabase.from('user_details').insert({
      email,
      full_name,
      roll_number,
      university,
      department,
      phone_number,
      gender,
      date_of_birth,
    });

    if (detailsError) throw detailsError;

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insert into user_credentials table
    const { error: credentialsError } = await supabase.from('user_credentials').insert({
      email,
      password_hash: hashedPassword,
    });

    if (credentialsError) throw credentialsError;

    // Optionally, sign up the user in Supabase Auth to handle sessions, etc.
    // This is useful if you want to use Supabase's built-in session management
    const { error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError) throw authError;


  } catch (error: any) {
    // If anything goes wrong, return an error
    return NextResponse.json({ error: `An error occurred: ${error.message}` }, { status: 500 });
  }
  
  // If successful
  return NextResponse.json({ message: 'User registered successfully! Please check your email to confirm.' }, { status: 201 });
}