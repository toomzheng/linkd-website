import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return Supabase configuration from environment variables
    return NextResponse.json({
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_ANON_KEY
    });
  } catch (error) {
    console.error('Config API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve configuration' },
      { status: 500 }
    );
  }
} 