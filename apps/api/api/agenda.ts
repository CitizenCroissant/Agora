/**
 * GET /api/agenda?date=YYYY-MM-DD
 * Returns agenda for a specific date
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../lib/supabase';
import { ApiError, handleError, validateDateFormat } from '../lib/errors';
import { DbSitting, DbAgendaItem, DbSourceMetadata } from '../lib/types';
import { AgendaResponse, SittingWithItems } from '@agora/shared';

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
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      throw new ApiError(400, 'Date parameter is required', 'BadRequest');
    }

    if (!validateDateFormat(date)) {
      throw new ApiError(
        400,
        'Invalid date format. Use YYYY-MM-DD',
        'BadRequest'
      );
    }

    // Fetch sittings for the date
    const { data: sittings, error: sittingsError } = await supabase
      .from('sittings')
      .select('*')
      .eq('date', date)
      .order('start_time', { ascending: true, nullsFirst: false });

    if (sittingsError) {
      console.error('Supabase error:', sittingsError);
      throw new ApiError(500, 'Failed to fetch sittings', 'DatabaseError');
    }

    if (!sittings || sittings.length === 0) {
      const response: AgendaResponse = {
        date,
        sittings: [],
        source: {
          label: 'Données officielles de l\'Assemblée nationale',
          last_updated_at: new Date().toISOString(),
        },
      };
      return res.status(200).json(response);
    }

    // Fetch agenda items for all sittings
    const sittingIds = sittings.map((s: DbSitting) => s.id);
    const { data: agendaItems, error: itemsError } = await supabase
      .from('agenda_items')
      .select('*')
      .in('sitting_id', sittingIds)
      .order('scheduled_time', { ascending: true, nullsFirst: false });

    if (itemsError) {
      console.error('Supabase error:', itemsError);
      throw new ApiError(500, 'Failed to fetch agenda items', 'DatabaseError');
    }

    // Fetch source metadata
    const { data: sourceMetadata, error: metadataError } = await supabase
      .from('source_metadata')
      .select('*')
      .in('sitting_id', sittingIds);

    if (metadataError) {
      console.error('Supabase error:', metadataError);
      // Non-critical error, continue without metadata
    }

    // Group agenda items by sitting
    const itemsBySitting = (agendaItems || []).reduce(
      (acc: Record<string, DbAgendaItem[]>, item: DbAgendaItem) => {
        if (!acc[item.sitting_id]) {
          acc[item.sitting_id] = [];
        }
        acc[item.sitting_id].push(item);
        return acc;
      },
      {}
    );

    // Build response
    const sittingsWithItems: SittingWithItems[] = sittings.map(
      (sitting: DbSitting) => {
        const items = itemsBySitting[sitting.id] || [];
        const timeRange =
          sitting.start_time && sitting.end_time
            ? `${sitting.start_time.substring(0, 5)} - ${sitting.end_time.substring(0, 5)}`
            : sitting.start_time
            ? sitting.start_time.substring(0, 5)
            : undefined;

        return {
          id: sitting.id,
          official_id: sitting.official_id,
          date: sitting.date,
          start_time: sitting.start_time || undefined,
          end_time: sitting.end_time || undefined,
          type: sitting.type,
          title: sitting.title,
          description: sitting.description,
          location: sitting.location || undefined,
          time_range: timeRange,
          agenda_items: items.map((item: DbAgendaItem) => ({
            id: item.id,
            sitting_id: item.sitting_id,
            scheduled_time: item.scheduled_time || undefined,
            title: item.title,
            description: item.description,
            category: item.category,
            reference_code: item.reference_code || undefined,
            official_url: item.official_url || undefined,
          })),
        };
      }
    );

    // Get latest sync time from source metadata
    const lastUpdated =
      sourceMetadata && sourceMetadata.length > 0
        ? Math.max(
            ...sourceMetadata.map((m: DbSourceMetadata) =>
              new Date(m.last_synced_at).getTime()
            )
          )
        : Date.now();

    const response: AgendaResponse = {
      date,
      sittings: sittingsWithItems,
      source: {
        label: 'Données officielles de l\'Assemblée nationale',
        last_updated_at: new Date(lastUpdated).toISOString(),
      },
    };

    // Set cache headers (cache for 5 minutes)
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}
