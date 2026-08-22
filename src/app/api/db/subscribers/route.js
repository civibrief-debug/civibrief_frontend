import { NextResponse } from 'next/server';
import { queryD1 } from '../../../../lib/edgeDb';

export const runtime = 'edge';

export async function GET() {
  try {
    const rows = await queryD1('SELECT * FROM subscribers ORDER BY subscribedAt DESC;');
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const id = body.id || `sub-${Date.now()}`;
    const email = body.email;
    const plan = body.plan || 'Free';
    const status = body.status || 'Active';
    const subscribedAt = new Date().toISOString();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    await queryD1(
      `INSERT OR REPLACE INTO subscribers (id, email, plan, status, subscribedAt) VALUES (?, ?, ?, ?, ?);`,
      [id, email, plan, status, subscribedAt]
    );

    return NextResponse.json({ success: true, data: { id, email, plan, status, subscribedAt } });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
