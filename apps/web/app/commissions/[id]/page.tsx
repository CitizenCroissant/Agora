"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Organe, SittingWithItems, CommissionMember } from "@agora/shared";
import { formatDate } from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./commission.module.css";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ShareBar } from "@/components/ShareBar";

const MEMBERS_VISIBLE_INITIAL = 12;
const LABEL_SANS_GROUPE = "Non inscrit";

function memberDisplayName(m: CommissionMember): string {
  const parts = [m.civil_prenom, m.civil_nom].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : m.acteur_ref;
}

function groupMembersByParty(members: CommissionMember[]): { group: string; members: CommissionMember[] }[] {
  const byParty = new Map<string, CommissionMember[]>();
  for (const m of members) {
    const key = (m.groupe_politique ?? "").trim() || LABEL_SANS_GROUPE;
    if (!byParty.has(key)) byParty.set(key, []);
    byParty.get(key)!.push(m);
  }
  return [...byParty.entries()]
    .map(([group, membersInGroup]) => ({ group, members: membersInGroup }))
    .sort((a, b) => {
      if (a.group === LABEL_SANS_GROUPE) return 1;
      if (b.group === LABEL_SANS_GROUPE) return -1;
      return b.members.length - a.members.length;
    });
}

export default function CommissionDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [organe, setOrgane] = useState<Organe | null>(null);
  const [reunions, setReunions] = useState<SittingWithItems[]>([]);
  const [members, setMembers] = useState<CommissionMember[]>([]);
  const [membersExpanded, setMembersExpanded] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadCommission(id);
    }
  }, [id]);

  const loadCommission = async (organeId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [organeData, reunionsData, membersData] = await Promise.all([
        apiClient.getCommission(organeId),
        apiClient.getCommissionReunions(organeId),
        apiClient.getCommissionMembers(organeId)
      ]);
      setOrgane(organeData);
      setReunions(reunionsData.reunions ?? []);
      setMembers(membersData.members ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
      setOrgane(null);
      setReunions([]);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const title = organe?.libelle ?? organe?.libelle_abrege ?? id;
  const membersByParty = groupMembersByParty(members);
  const totalVisible = membersExpanded ? members.length : MEMBERS_VISIBLE_INITIAL;
  let remaining = totalVisible;
  const visibleGroups = membersByParty.map(({ group, members: groupMembers }) => {
    const take = membersExpanded ? groupMembers.length : Math.min(remaining, groupMembers.length);
    remaining -= take;
    return { group, members: groupMembers, visible: groupMembers.slice(0, take), hidden: groupMembers.length - take };
  });
  const hasMoreMembers = members.length > MEMBERS_VISIBLE_INITIAL && !membersExpanded;
  const hiddenCount = members.length - MEMBERS_VISIBLE_INITIAL;

  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Commissions", href: "/commissions" },
          { label: title }
        ]}
      />

      {loading && (
        <div className="stateLoading">Chargement de la commission...</div>
      )}

      {error && (
        <div className="stateError">
          <p>Erreur : {error}</p>
        </div>
      )}

      {!loading && !error && organe && (
        <>
          <ShareBar title={organe.libelle ?? organe.libelle_abrege ?? id} />
          <p className={styles.comprendreBlock}>
            <Link href="/democratie#commissions" className={styles.comprendreLink}>
              Comprendre les commissions et organes →
            </Link>
          </p>
          <div className={styles.header}>
            <h1 className={styles.title}>
              {organe.libelle ?? organe.libelle_abrege ?? organe.id}
            </h1>
            {organe.libelle_abrege && organe.libelle && (
              <p className={styles.subtitle}>{organe.libelle_abrege}</p>
            )}
            {organe.official_url && (
              <a
                href={organe.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.officialLink}
              >
                Voir sur assemblee-nationale.fr →
              </a>
            )}

            {(reunions.length > 0 || members.length > 0) && (
              <nav className={styles.pageNav} aria-label="Sections de la page">
                {reunions.length > 0 && (
                  <a href="#reunions" className={styles.pageNavLink}>
                    Réunions ({reunions.length})
                  </a>
                )}
                {members.length > 0 && (
                  <a href="#membres" className={styles.pageNavLink}>
                    Membres ({members.length})
                  </a>
                )}
              </nav>
            )}
          </div>

          <section id="reunions" className={styles.section}>
            <h2 className={styles.sectionTitle}>Réunions</h2>
            {reunions.length === 0 ? (
              <p className="stateEmpty">
                Aucune réunion enregistrée pour cette commission sur la période
                ingérée.
              </p>
            ) : (
              <ul className={styles.reunionsList}>
                {reunions.map((sitting) => (
                  <li key={sitting.id}>
                    <Link
                      href={`/sitting/${sitting.id}`}
                      className={styles.reunionCard}
                    >
                      <span className={styles.reunionDate}>
                        {formatDate(sitting.date)}
                      </span>
                      {sitting.time_range && (
                        <span className={styles.reunionTime}>
                          {sitting.time_range}
                        </span>
                      )}
                      <span className={styles.reunionTitle}>
                        {sitting.title}
                      </span>
                      {sitting.agenda_items?.length > 0 && (
                        <span className={styles.reunionItems}>
                          {sitting.agenda_items.length} point(s) à l&apos;ordre
                          du jour
                        </span>
                      )}
                      <span className={styles.reunionArrow} aria-hidden>
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {members.length > 0 && (
            <section id="membres" className={styles.section}>
              <h2 className={styles.sectionTitle}>Membres</h2>
              {visibleGroups.map(({ group, members: groupMembers, visible, hidden }) => {
                const toShow = membersExpanded ? groupMembers : visible;
                if (toShow.length === 0) return null;
                return (
                <div key={group} className={styles.memberPartyBlock}>
                  <h3 className={styles.memberPartyTitle}>
                    {group}
                    <span className={styles.memberPartyCount}>
                      {groupMembers.length} membre{groupMembers.length !== 1 ? "s" : ""}
                    </span>
                  </h3>
                  <div className={styles.membersGrid}>
                    {toShow.map((member) => (
                      <Link
                        key={member.acteur_ref}
                        href={`/deputy/${encodeURIComponent(member.acteur_ref)}`}
                        className={styles.memberCard}
                      >
                        <span className={styles.memberName}>
                          {memberDisplayName(member)}
                        </span>
                      </Link>
                    ))}
                  </div>
                  {!membersExpanded && hidden > 0 && (
                    <p className={styles.memberPartyMore}>
                      + {hidden} autre{hidden !== 1 ? "s" : ""} dans ce groupe
                    </p>
                  )}
                </div>
              );
              })}
              {hasMoreMembers && (
                <button
                  type="button"
                  onClick={() => setMembersExpanded(true)}
                  className={styles.showMoreBtn}
                >
                  Afficher les {hiddenCount} autres membres
                </button>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
