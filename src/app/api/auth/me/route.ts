import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('pap-session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const userData = JSON.parse(Buffer.from(sessionToken, 'base64').toString('utf8'));

    return NextResponse.json({
      user: userData
    });
  } catch (err) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
