/**
 * GET /api/ingestion-status
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../supabase';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'MethodNotAllowed',
      message: 'Only GET is allowed'
    });
  }

  try {
    const { data: latestSitting, error: sittingError } = await supabase
      .from('sittings')
      .select('date')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sittingError) {
      console.error('Supabase error (sittings):', sittingError);
      return res.status(500).json({
        error: 'DatabaseError',
        message: 'Failed to fetch latest sitting'
      });
    }

    const { data: latestSync, error: syncError } = await supabase
      .from('source_metadata')
      .select('last_synced_at')
      .order('last_synced_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (syncError) {
      console.error('Supabase error (source_metadata):', syncError);
      return res.status(500).json({
        error: 'DatabaseError',
        message: 'Failed to fetch last sync time'
      });
    }

    const latestDate = latestSitting?.date ?? null;
    const lastSyncedAt = latestSync?.last_synced_at ?? null;
    const syncAgeMs = lastSyncedAt
      ? Date.now() - new Date(lastSyncedAt).getTime()
      : null;
    const syncedWithin36h =
      syncAgeMs !== null && syncAgeMs < 36 * 60 * 60 * 1000;

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json({
      ok: true,
      agenda: {
        latest_sitting_date: latestDate,
        last_synced_at: lastSyncedAt,
        is_fresh: !!lastSyncedAt && syncedWithin36h
      },
      checked_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('ingestion-status error:', error);
    return res.status(500).json({
      error: 'InternalError',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
