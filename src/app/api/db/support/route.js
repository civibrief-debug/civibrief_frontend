import { NextResponse } from 'next/server';
import { queryD1 } from '../../../../lib/edgeDb';

export const runtime = 'edge';

export async function GET() {
  try {
    const rows = await queryD1('SELECT * FROM support_tickets ORDER BY createdAt DESC;');
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const id = body.id || `tick-${Date.now()}`;
    const name = body.name || '';
    const email = body.email;
    const subject = body.subject || '';
    const message = body.message || '';
    const status = body.status || 'Open';
    const createdAt = new Date().toISOString();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    await queryD1(
      `INSERT OR REPLACE INTO support_tickets (id, name, email, subject, message, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [id, name, email, subject, message, status, createdAt]
    );

    return NextResponse.json({ success: true, data: { id, name, email, subject, message, status, createdAt } });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
