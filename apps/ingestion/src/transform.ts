/**
 * Transform Assemblée nationale data to our domain model
 */

import crypto from 'crypto';
import {
  AssembleeSeance,
  SittingInsert,
  AgendaItemInsert,
  SourceMetadataInsert
} from './types';

/**
 * Transform a seance to a sitting
 */
export function transformSeance(seance: AssembleeSeance): SittingInsert {
  return {
    official_id: seance.uid,
    date: seance.dateSeance,
    start_time: seance.heureDebut,
    end_time: seance.heureFin,
    type: seance.typeSeance,
    title: seance.intitule || 'Séance',
    description: generateDescription(seance),
    location: seance.lieuLibelle
  };
}

/**
 * Transform seance agenda items
 */
export function transformAgendaItems(
  seance: AssembleeSeance,
  sittingId: string
): AgendaItemInsert[] {
  if (!seance.pointsOdj || seance.pointsOdj.length === 0) {
    return [];
  }

  return seance.pointsOdj.map((point) => ({
    sitting_id: sittingId,
    scheduled_time: point.heureDebut,
    title: point.intitule,
    description: point.intitule,
    category: point.nature || 'autre',
    reference_code: point.texteRef,
    official_url: point.texteRef
      ? `https://www.assemblee-nationale.fr/dyn/${seance.legislature}/dossiers_/${point.texteRef}`
      : undefined
  }));
}

/**
 * Create source metadata
 */
export function createSourceMetadata(
  seance: AssembleeSeance,
  sittingId: string
): SourceMetadataInsert {
  // Link to the date-specific agenda page on the official Assemblée nationale website
  // Format: https://www2.assemblee-nationale.fr/agendas/les-agendas/YYYY-MM-DD
  const sourceUrl = `https://www2.assemblee-nationale.fr/agendas/les-agendas/${seance.dateSeance}`;
  const checksum = generateChecksum(seance);

  return {
    sitting_id: sittingId,
    original_source_url: sourceUrl,
    last_synced_at: new Date().toISOString(),
    checksum
  };
}

/**
 * Generate a description from seance data
 */
function generateDescription(seance: AssembleeSeance): string {
  let description = seance.intitule || 'Séance';

  if (seance.pointsOdj && seance.pointsOdj.length > 0) {
    description += ` - ${seance.pointsOdj.length} point(s) à l'ordre du jour`;
  }

  return description;
}

/**
 * Generate checksum for change detection
 */
function generateChecksum(seance: AssembleeSeance): string {
  const data = JSON.stringify(seance);
  return crypto.createHash('sha256').update(data).digest('hex');
}
