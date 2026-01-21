/**
 * Client for Assemblée nationale open data API
 * 
 * Data source: http://data.assemblee-nationale.fr/static/openData/repository/17/vp/reunions/Agenda.json.zip
 * This ZIP archive contains JSON files for all meetings (public sessions and commissions).
 */

import fetch from 'node-fetch';
import { Readable } from 'stream';
import unzipper from 'unzipper';
import { AssembleeReunionWrapper, AssembleeReunion, AssembleeSeance, AssembleePointOdj } from './types';

// Current legislature is 17 (2024-2029)
const AGENDA_ZIP_URL = 'http://data.assemblee-nationale.fr/static/openData/repository/17/vp/reunions/Agenda.json.zip';
const CURRENT_LEGISLATURE = 17;

export class AssembleeClient {
  private cachedData: Map<string, AssembleeReunion[]> = new Map();
  private cacheExpiry: Date | null = null;
  private readonly CACHE_DURATION_MS = 1000 * 60 * 60; // 1 hour

  /**
   * Fetch sessions for a given date
   */
  async fetchSeances(date: string): Promise<AssembleeSeance[]> {
    console.log(`Fetching séances for date: ${date}`);
    
    const allReunions = await this.fetchAllReunions();
    const dateOnly = date.split('T')[0]; // Extract YYYY-MM-DD
    
    // Filter public sessions (seance_type) for the given date
    const reunions = allReunions.filter(r => {
      if (!r.identifiants?.DateSeance) return false;
      const reunionDate = r.identifiants.DateSeance.split('+')[0];
      return reunionDate === dateOnly && r['@xsi:type'] === 'seance_type' && r.cycleDeVie.etat === 'Confirmé';
    });

    // Convert to legacy format for backward compatibility
    return reunions.map(r => this.convertToLegacyFormat(r));
  }

  /**
   * Fetch sessions for a date range
   */
  async fetchSeancesRange(from: string, to: string): Promise<AssembleeSeance[]> {
    console.log(`Fetching séances from ${from} to ${to}`);
    
    const allReunions = await this.fetchAllReunions();
    const fromDate = from.split('T')[0];
    const toDate = to.split('T')[0];
    
    // Filter public sessions within date range
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
   * Fetch all reunions from the ZIP archive
   */
  private async fetchAllReunions(): Promise<AssembleeReunion[]> {
    // Check cache
    if (this.cacheExpiry && new Date() < this.cacheExpiry && this.cachedData.size > 0) {
      console.log('Using cached data');
      const allData: AssembleeReunion[] = [];
      for (const items of this.cachedData.values()) {
        allData.push(...items);
      }
      return allData;
    }

    console.log('Downloading agenda data from Assemblée nationale...');
    const response = await fetch(AGENDA_ZIP_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to download agenda: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const reunions: AssembleeReunion[] = [];

    // Parse ZIP archive
    await new Promise<void>((resolve, reject) => {
      Readable.from(buffer)
        .pipe(unzipper.Parse())
        .on('entry', async (entry: unzipper.Entry) => {
          const fileName = entry.path;
          
          // Only process JSON files in json/reunion/ directory
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

    console.log(`Loaded ${reunions.length} reunions from archive`);

    // Update cache
    this.cachedData.clear();
    reunions.forEach(r => {
      // Some reunions may not have identifiants
      if (!r.identifiants || !r.identifiants.DateSeance) {
        return;
      }
      const date = r.identifiants.DateSeance.split('+')[0];
      if (!this.cachedData.has(date)) {
        this.cachedData.set(date, []);
      }
      this.cachedData.get(date)!.push(r);
    });
    this.cacheExpiry = new Date(Date.now() + this.CACHE_DURATION_MS);

    return reunions;
  }

  /**
   * Convert new format to legacy format for backward compatibility
   */
  private convertToLegacyFormat(reunion: AssembleeReunion): AssembleeSeance {
    // Extract date from DateSeance (format: YYYY-MM-DD+TZ)
    const dateSeance = reunion.identifiants?.DateSeance?.split('+')[0] || '';
    
    // Extract time from ISO timestamps
    const heureDebut = reunion.timeStampDebut ? 
      new Date(reunion.timeStampDebut).toTimeString().split(' ')[0] : undefined;
    const heureFin = reunion.timeStampFin ? 
      new Date(reunion.timeStampFin).toTimeString().split(' ')[0] : undefined;

    // Determine title/intitule
    const intitule = reunion.ODJ?.resumeODJ?.item || 
                     reunion.ODJ?.convocationODJ?.item || 
                     (reunion.identifiants?.quantieme ? `${reunion.identifiants.quantieme} séance` : 
                     'Séance publique');

    // Convert points ODJ
    let pointsOdj: AssembleePointOdj[] = [];
    if (reunion.ODJ?.pointsODJ?.pointODJ) {
      const points = Array.isArray(reunion.ODJ.pointsODJ.pointODJ) 
        ? reunion.ODJ.pointsODJ.pointODJ 
        : [reunion.ODJ.pointsODJ.pointODJ];
      
      pointsOdj = points
        .filter(p => p.cycleDeVie.etat === 'Confirmé') // Only confirmed points
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
      legislature: CURRENT_LEGISLATURE,
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
