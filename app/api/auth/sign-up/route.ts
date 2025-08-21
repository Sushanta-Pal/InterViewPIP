import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

  if (!email || !password || !full_name) {
    return NextResponse.json(
      { error: 'Email, password, and full name are required.' },
      { status: 400 }
    );
  }

  const supabase = createRouteHandlerClient({ cookies });

  // This single, efficient call now handles everything.
  // We pass the extra details in the `options.data` object.
  // A database trigger (which we will create next) will use this data.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        roll_number,
        university,
        department,
        phone_number,
        gender,
        date_of_birth,
      }
    }
  });

  if (error) {
    // Supabase will automatically handle errors like duplicate emails.
    return NextResponse.json({ error: error.message }, { status: error.status || 400 });
  }
  
  return NextResponse.json({ message: 'Registration successful! Please check your email to confirm your account.' }, { status: 201 });
}
