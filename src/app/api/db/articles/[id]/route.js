import { NextResponse } from 'next/server';
import { queryD1 } from '../../../../../lib/edgeDb';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const rows = await queryD1('SELECT * FROM articles WHERE id = ?;', [id]);
    if (!rows.length) {
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }
    const r = rows[0];
    const formatted = {
      ...r,
      isHero: Boolean(r.isHero),
      isEditorsPick: Boolean(r.isEditorsPick),
      isTrending: Boolean(r.isTrending),
      isLive: Boolean(r.isLive),
      placeholderAdEnabled: Boolean(r.placeholderAdEnabled),
      comments: r.comments ? (typeof r.comments === 'string' ? (JSON.parse(r.comments || '[]')) : r.comments) : [],
      adPlacements: r.adPlacements ? (typeof r.adPlacements === 'string' ? JSON.parse(r.adPlacements) : r.adPlacements) : [],
      coverImageCrop: r.coverImageCrop ? (typeof r.coverImageCrop === 'string' ? JSON.parse(r.coverImageCrop) : r.coverImageCrop) : null,
      coverVideoCrop: r.coverVideoCrop ? (typeof r.coverVideoCrop === 'string' ? JSON.parse(r.coverVideoCrop) : r.coverVideoCrop) : null
    };
    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const supertitleVal = (body.kicker?.trim() || body.supertitle?.trim() || '');
    const title = body.title || 'Untitled Article';
    const kicker = supertitleVal;
    const supertitle = supertitleVal;
    const category = body.category || 'Technology';
    const subSection = body.subSection || '';
    const author = body.author || 'Staff Reporter';
    const authorId = body.authorId || null;
    const assignedEditorId = body.assignedEditorId || null;
    const assignedEditorName = body.assignedEditorName || null;
    const status = body.status || 'Draft';
    const summary = body.summary || '';
    const content = body.content || '';
    const imageUrl = body.imageUrl || '';
    const coverMediaType = body.coverMediaType || (body.videoUrl ? 'video' : 'image');
    const videoUrl = body.videoUrl || '';
    const photoCaption = body.photoCaption || '';
    const photoCredit = body.photoCredit || '';
    const coverImageCrop = JSON.stringify(body.coverImageCrop || body.coverCropBox || {});
    const coverVideoCrop = JSON.stringify(body.coverVideoCrop || {});
    const coverMediaAspect = body.coverMediaAspect || '16:9';
    const readTime = body.readTime || '3 min read';
    const isHero = body.isHero ? 1 : 0;
    const isEditorsPick = body.isEditorsPick ? 1 : 0;
    const isTrending = body.isTrending ? 1 : 0;
    const isLive = body.isLive ? 1 : 0;
    const adPlacements = JSON.stringify(body.adPlacements || []);
    const placeholderAdEnabled = body.placeholderAdEnabled ? 1 : 0;
    const placeholderAdTargetUrl = body.placeholderAdTargetUrl || '';
    const placeholderAdHeadline = body.placeholderAdHeadline || '';
    const placeholderAdDescription = body.placeholderAdDescription || '';
    const placeholderAdCtaText = body.placeholderAdCtaText || '';
    const comments = JSON.stringify(body.comments || []);
    const editorFeedback = body.editorFeedback || null;
    const feedbackDate = body.feedbackDate || null;
    const publishedAt = body.status === 'Published' ? (body.publishedAt || new Date().toISOString()) : (body.publishedAt || null);
    const updatedAt = new Date().toISOString();

    const sql = `
      INSERT OR REPLACE INTO articles (
        id, title, kicker, supertitle, category, subSection, author, authorId,
        assignedEditorId, assignedEditorName, status, summary, content, imageUrl,
        coverMediaType, videoUrl, photoCaption, photoCredit, coverImageCrop,
        coverVideoCrop, coverMediaAspect, readTime, isHero, isEditorsPick,
        isTrending, isLive, adPlacements, placeholderAdEnabled,
        placeholderAdTargetUrl, placeholderAdHeadline, placeholderAdDescription,
        placeholderAdCtaText, comments, editorFeedback, feedbackDate,
        createdAt, publishedAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        COALESCE((SELECT createdAt FROM articles WHERE id = ?), ?), ?, ?
      );
    `;

    const paramsList = [
      id, title, kicker, supertitle, category, subSection, author, authorId,
      assignedEditorId, assignedEditorName, status, summary, content, imageUrl,
      coverMediaType, videoUrl, photoCaption, photoCredit, coverImageCrop,
      coverVideoCrop, coverMediaAspect, readTime, isHero, isEditorsPick,
      isTrending, isLive, adPlacements, placeholderAdEnabled,
      placeholderAdTargetUrl, placeholderAdHeadline, placeholderAdDescription,
      placeholderAdCtaText, comments, editorFeedback, feedbackDate,
      id, updatedAt, publishedAt, updatedAt
    ];

    await queryD1(sql, paramsList);

    return NextResponse.json({ success: true, data: { ...body, id, title, status, updatedAt } });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await queryD1('DELETE FROM articles WHERE id = ?;', [id]);
    return NextResponse.json({ success: true, message: 'Article deleted successfully' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

