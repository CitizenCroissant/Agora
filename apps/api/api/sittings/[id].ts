/**
 * GET /api/sittings/[id]
 * Returns detailed information for a specific sitting
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase';
import { ApiError, handleError } from '../../lib/errors';
import { DbSitting, DbAgendaItem, DbSourceMetadata } from '../../lib/types';
import { SittingDetailResponse } from '@agora/shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'MethodNotAllowed',
      message: 'Only GET requests are allowed',
      status: 405,
    });
  }

  try {
    // Support both Vercel (query) and Express (params) routing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = (req.query.id || (req as any).params?.id) as string;

    if (!id || typeof id !== 'string') {
      throw new ApiError(400, 'Sitting ID is required', 'BadRequest');
    }

    // Fetch sitting
    const { data: sitting, error: sittingError } = await supabase
      .from('sittings')
      .select('*')
      .eq('id', id)
      .single();

    if (sittingError) {
      console.error('Supabase error:', sittingError);
      if (sittingError.code === 'PGRST116') {
        throw new ApiError(404, 'Sitting not found', 'NotFound');
      }
      throw new ApiError(500, 'Failed to fetch sitting', 'DatabaseError');
    }

    // Fetch agenda items
    const { data: agendaItems, error: itemsError } = await supabase
      .from('agenda_items')
      .select('*')
      .eq('sitting_id', id)
      .order('scheduled_time', { ascending: true, nullsFirst: false });

    if (itemsError) {
      console.error('Supabase error:', itemsError);
      throw new ApiError(500, 'Failed to fetch agenda items', 'DatabaseError');
    }

    // Fetch source metadata
    const { data: sourceMetadata, error: metadataError } = await supabase
      .from('source_metadata')
      .select('*')
      .eq('sitting_id', id)
      .single();

    if (metadataError && metadataError.code !== 'PGRST116') {
      console.error('Supabase error:', metadataError);
      // Non-critical error, continue without metadata
    }

    const dbSitting = sitting as DbSitting;
    const timeRange =
      dbSitting.start_time && dbSitting.end_time
        ? `${dbSitting.start_time.substring(0, 5)} - ${dbSitting.end_time.substring(0, 5)}`
        : dbSitting.start_time
        ? dbSitting.start_time.substring(0, 5)
        : undefined;

    const response: SittingDetailResponse = {
      id: dbSitting.id,
      official_id: dbSitting.official_id,
      date: dbSitting.date,
      start_time: dbSitting.start_time || undefined,
      end_time: dbSitting.end_time || undefined,
      type: dbSitting.type,
      title: dbSitting.title,
      description: dbSitting.description,
      location: dbSitting.location || undefined,
      time_range: timeRange,
      agenda_items: (agendaItems || []).map((item: DbAgendaItem) => ({
        id: item.id,
        sitting_id: item.sitting_id,
        scheduled_time: item.scheduled_time || undefined,
        title: item.title,
        description: item.description,
        category: item.category,
        reference_code: item.reference_code || undefined,
        official_url: item.official_url || undefined,
      })),
      source_metadata: sourceMetadata
        ? {
            id: (sourceMetadata as DbSourceMetadata).id,
            sitting_id: (sourceMetadata as DbSourceMetadata).sitting_id,
            original_source_url: (sourceMetadata as DbSourceMetadata)
              .original_source_url,
            last_synced_at: (sourceMetadata as DbSourceMetadata).last_synced_at,
            checksum: (sourceMetadata as DbSourceMetadata).checksum,
          }
        : {
            id: '',
            sitting_id: id,
            original_source_url: '',
            last_synced_at: new Date().toISOString(),
            checksum: '',
          },
    };

    // Set cache headers (cache for 5 minutes)
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}
