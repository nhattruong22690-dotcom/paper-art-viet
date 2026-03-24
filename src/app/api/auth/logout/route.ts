import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear the cookie
  response.cookies.set('pap-session', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/'
  });

  return response;
}
