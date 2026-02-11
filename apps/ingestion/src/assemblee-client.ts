/**
 * Client for Assemblée nationale open data API
 *
 * Data sources (per legislature):
 *   16, 17: https://data.assemblee-nationale.fr/static/openData/repository/{leg}/vp/reunions/Agenda.json.zip
 *   14, 15: https://data.assemblee-nationale.fr/static/openData/repository/{leg}/vp/reunions/Agenda_{roman}.json.zip
 *
 * Legislature 14's archive is a single flat JSON file (reunions.reunion[]),
 * while 15-17 use one JSON file per reunion inside a json/reunion/ directory.
 */

import { Readable } from 'stream';
import unzipper from 'unzipper';
import { AssembleeReunionWrapper, AssembleeReunion, AssembleeSeance, AssembleePointOdj } from './types';

/** All legislatures for which agenda archives exist on data.assemblee-nationale.fr. */
export const LEGISLATURES_WITH_AGENDAS = ['14', '15', '16', '17'] as const;

/** Roman-numeral suffix used in the ZIP filename for older legislatures. */
const ROMAN_BY_LEG: Record<string, string> = {
  '14': 'XIV',
  '15': 'XV',
};

function zipUrlForLegislature(legislature: string): string {
  const roman = ROMAN_BY_LEG[legislature];
  const filename = roman ? `Agenda_${roman}.json.zip` : 'Agenda.json.zip';
  return `https://data.assemblee-nationale.fr/static/openData/repository/${legislature}/vp/reunions/${filename}`;
}

/** Extract legislature number from a reunion uid (e.g. "RUANR5L15S2018IDS20922" → 15). */
function legislatureFromUid(uid: string): number {
  const match = uid.match(/L(\d+)/);
  return match ? parseInt(match[1], 10) : 17;
}

/**
 * Parse the single-JSON archive format used by legislature 14.
 * Shape: { reunions: { reunion: AssembleeReunion[] } }
 *
 * Legislature 14 entries lack `@xsi:type`; we identify séances by the
 * presence of "IDS" in the uid (commissions use "IDC").
 */
async function parseSingleJsonArchive(buffer: Buffer): Promise<AssembleeReunion[]> {
  return new Promise<AssembleeReunion[]>((resolve, reject) => {
    let rawJson: string | null = null;
    Readable.from(buffer)
      .pipe(unzipper.Parse())
      .on('entry', async (entry: unzipper.Entry) => {
        if (entry.path.endsWith('.json') && !entry.path.includes('__')) {
          const content = await entry.buffer();
          rawJson = content.toString('utf-8');
        }
        entry.autodrain();
      })
      .on('error', reject)
      .on('close', () => {
        if (!rawJson) { resolve([]); return; }
        try {
          const data = JSON.parse(rawJson) as { reunions?: { reunion?: unknown[] } };
          const list = data?.reunions?.reunion;
          if (!Array.isArray(list)) { resolve([]); return; }

          // Cast to AssembleeReunion[], patching the missing @xsi:type field.
          const reunions: AssembleeReunion[] = [];
          for (const raw of list) {
            const r = raw as AssembleeReunion;
            if (!r.uid) continue;
            // Patch @xsi:type for leg-14 entries that lack it
            if (!r['@xsi:type']) {
              r['@xsi:type'] = r.uid.includes('IDS') ? 'seance_type' : 'reunionCommission_type';
            }
            reunions.push(r);
          }
          resolve(reunions);
        } catch (e) {
          reject(e);
        }
      });
  });
}

/**
 * Parse the per-file archive format used by legislatures 15-17.
 * Each reunion lives in its own json/reunion/*.json file.
 */
async function parsePerFileArchive(buffer: Buffer): Promise<AssembleeReunion[]> {
  const reunions: AssembleeReunion[] = [];
  await new Promise<void>((resolve, reject) => {
    Readable.from(buffer)
      .pipe(unzipper.Parse())
      .on('entry', async (entry: unzipper.Entry) => {
        const fileName = entry.path;
        if (fileName.endsWith('.json') && fileName.includes('json/reunion/')) {
          try {
            const content = await entry.buffer();
            const data: AssembleeReunionWrapper = JSON.parse(content.toString('utf-8'));
            if (data.reunion) {
              reunions.push(data.reunion);
            }
          } catch (error) {
            console.error(`Error parsing ${fileName}:`, error);
          }
        } else {
          entry.autodrain();
        }
      })
      .on('error', reject)
      .on('close', resolve);
  });
  return reunions;
}

export class AssembleeClient {
  /** Per-legislature cache: legislature → { reunions, expiry }. */
  private cacheByLegislature = new Map<string, { reunions: AssembleeReunion[]; expiry: Date }>();
  private readonly CACHE_DURATION_MS = 1000 * 60 * 60; // 1 hour

  /**
   * Fetch sessions for a given date.
   * @param legislature - "14"-"17" or "all". Default "17".
   */
  async fetchSeances(date: string, legislature = '17'): Promise<AssembleeSeance[]> {
    console.log(`Fetching séances for date: ${date}`);

    const allReunions = await this.fetchAllReunions(legislature);
    const dateOnly = date.split('T')[0];

    const reunions = allReunions.filter(r => {
      if (!r.identifiants?.DateSeance) return false;
      const reunionDate = r.identifiants.DateSeance.split('+')[0];
      return reunionDate === dateOnly && r['@xsi:type'] === 'seance_type' && r.cycleDeVie.etat === 'Confirmé';
    });

    return reunions.map(r => this.convertToLegacyFormat(r));
  }

  /**
   * Fetch sessions for a date range.
   * @param legislature - "14"-"17" or "all". Default "17".
   */
  async fetchSeancesRange(from: string, to: string, legislature = '17'): Promise<AssembleeSeance[]> {
    console.log(`Fetching séances from ${from} to ${to}`);

    const allReunions = await this.fetchAllReunions(legislature);
    const fromDate = from.split('T')[0];
    const toDate = to.split('T')[0];

    const reunions = allReunions.filter(r => {
      if (!r.identifiants?.DateSeance) return false;
      const reunionDate = r.identifiants.DateSeance.split('+')[0];
      return reunionDate >= fromDate && reunionDate <= toDate &&
             r['@xsi:type'] === 'seance_type' &&
             r.cycleDeVie.etat === 'Confirmé';
    });

    return reunions.map(r => this.convertToLegacyFormat(r));
  }

  /**
   * Fetch all reunions for one or all legislatures.
   * @param legislature - "14"-"17" or "all".
   */
  private async fetchAllReunions(legislature: string): Promise<AssembleeReunion[]> {
    const legs = legislature === 'all'
      ? [...LEGISLATURES_WITH_AGENDAS]
      : [legislature];

    const allReunions: AssembleeReunion[] = [];

    for (const leg of legs) {
      const reunions = await this.fetchReunionsForLegislature(leg);
      allReunions.push(...reunions);
    }

    return allReunions;
  }

  /**
   * Fetch and cache reunions for a single legislature.
   */
  private async fetchReunionsForLegislature(legislature: string): Promise<AssembleeReunion[]> {
    const cached = this.cacheByLegislature.get(legislature);
    if (cached && new Date() < cached.expiry) {
      console.log(`Using cached data (legislature ${legislature})`);
      return cached.reunions;
    }

    const url = zipUrlForLegislature(legislature);
    console.log(`Downloading agenda data for legislature ${legislature}...`);

    const response = await (globalThis as any).fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download agenda (legislature ${legislature}): ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Legislature 14 uses a single flat JSON; 15+ use per-file archives.
    const reunions = legislature === '14'
      ? await parseSingleJsonArchive(buffer)
      : await parsePerFileArchive(buffer);

    console.log(`Loaded ${reunions.length} reunions from archive (legislature ${legislature})`);

    this.cacheByLegislature.set(legislature, {
      reunions,
      expiry: new Date(Date.now() + this.CACHE_DURATION_MS),
    });

    return reunions;
  }

  /**
   * Convert raw reunion format to legacy AssembleeSeance format.
   */
  private convertToLegacyFormat(reunion: AssembleeReunion): AssembleeSeance {
    const dateSeance = reunion.identifiants?.DateSeance?.split('+')[0] || '';

    const heureDebut = reunion.timeStampDebut ?
      new Date(reunion.timeStampDebut).toTimeString().split(' ')[0] : undefined;
    const heureFin = reunion.timeStampFin ?
      new Date(reunion.timeStampFin).toTimeString().split(' ')[0] : undefined;

    const intitule = reunion.ODJ?.resumeODJ?.item ||
                     reunion.ODJ?.convocationODJ?.item ||
                     (reunion.identifiants?.quantieme ? `${reunion.identifiants.quantieme} séance` :
                     'Séance publique');

    let pointsOdj: AssembleePointOdj[] = [];
    if (reunion.ODJ?.pointsODJ?.pointODJ) {
      const points = Array.isArray(reunion.ODJ.pointsODJ.pointODJ)
        ? reunion.ODJ.pointsODJ.pointODJ
        : [reunion.ODJ.pointsODJ.pointODJ];

      pointsOdj = points
        .filter(p => p.cycleDeVie.etat === 'Confirmé')
        .map((p, index) => ({
          numero: index + 1,
          intitule: p.objet,
          nature: p.typePointODJ,
          texteRef: typeof p.dossiersLegislatifsRefs?.dossierRef === 'string'
            ? p.dossiersLegislatifsRefs.dossierRef
            : undefined,
        }));
    }

    return {
      uid: reunion.uid,
      legislature: legislatureFromUid(reunion.uid),
      dateSeance,
      heureDebut,
      heureFin,
      typeSeance: reunion['@xsi:type'],
      intitule,
      organeRef: reunion.organeReuniRef,
      lieuLibelle: reunion.lieu?.libelleLong,
      pointsOdj,
    };
  }
}

export const assembleeClient = new AssembleeClient();
