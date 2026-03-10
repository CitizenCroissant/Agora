"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BillAmendmentsListResponse,
  AmendmentListItem,
  formatDate
} from "@agora/shared";
import { apiClient } from "@/lib/api";
import styles from "./amendments.module.css";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageHelp } from "@/components/PageHelp";

const PAGE_SIZE = 30;

function formatSortLabel(sortCode: string): string {
  if (sortCode === "adopté") return "Adopté";
  if (sortCode === "rejeté") return "Rejeté";
  return sortCode;
}

export default function BillAmendmentsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const billId = params.id as string;
  const billTextId = searchParams.get("bill_text_id") ?? undefined;

  const [data, setData] = useState<BillAmendmentsListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [texteLabel, setTexteLabel] = useState<string | null>(null);

  useEffect(() => {
    if (billId) {
      void load(billId, page, billTextId);
    }
  }, [billId, page, billTextId]);

  useEffect(() => {
    setPage(0);
  }, [billTextId]);

  useEffect(() => {
    if (!billTextId || !billId) {
      setTexteLabel(null);
      return;
    }
    let cancelled = false;
    void apiClient.getBill(billId).then((bill) => {
      if (cancelled) return;
      const t = bill.textes?.find((x) => x.id === billTextId);
      setTexteLabel(t ? t.label ?? t.numero ?? t.texte_ref : null);
    });
    return () => {
      cancelled = true;
    };
  }, [billId, billTextId]);

  const load = async (
    id: string,
    offsetPage: number,
    textId?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getBillAmendments(id, {
        limit: PAGE_SIZE,
        offset: offsetPage * PAGE_SIZE,
        ...(textId ? { bill_text_id: textId } : {})
      });
      setData(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de charger les amendements"
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const bill = data?.bill;
  const amendments = data?.amendments ?? [];
  const total = data?.total ?? 0;
  const hasMore = data?.has_more ?? false;
  const from = data?.offset ?? 0;
  const to = from + amendments.length;

  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: "Dossiers législatifs", href: "/bills" },
          {
            label: bill?.short_title || bill?.title || "Dossier",
            href: `/bills/${encodeURIComponent(billId)}`
          },
          { label: "Amendements" }
        ]}
      />
      <PageHelp
        title="À propos de cette liste"
        points={[
          "Les amendements sont listés par numéro. Le détail (auteur, libellé) est disponible sur le site de l’Assemblée.",
          "Lorsqu’un amendement a été mis aux voix, un lien vers le scrutin permet de voir le résultat du vote et le détail des votes des députés."
        ]}
      />

      {loading && !data && (
        <div className="stateLoading">Chargement des amendements...</div>
      )}

      {error && !loading && (
        <div className="stateError">
          <p>Erreur : {error}</p>
          <Link href={`/bills/${encodeURIComponent(billId)}`}>
            Retour au dossier
          </Link>
        </div>
      )}

      {!loading && data && (
        <>
          <section className={styles.header}>
            <h1 className={styles.title}>Amendements</h1>
            <p className={styles.subtitle}>
              {bill?.short_title || bill?.title}
            </p>
            {billTextId && (
              <p className={styles.texteFilter}>
                Version de texte : {texteLabel ?? "…"}
                {" · "}
                <Link
                  href={`/bills/${encodeURIComponent(billId)}/amendments`}
                  className={styles.texteFilterLink}
                >
                  Voir tous les amendements du dossier
                </Link>
              </p>
            )}
            <p className={styles.total}>
              {total} amendement{total !== 1 ? "s" : ""} au total
            </p>
          </section>

          {amendments.length === 0 ? (
            <p className={styles.empty}>
              Aucun amendement enregistré pour ce dossier.
            </p>
          ) : (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col" className={styles.colNumero}>
                        N°
                      </th>
                      <th scope="col" className={styles.colLien}>
                        Lien officiel
                      </th>
                      <th scope="col" className={styles.colVotes}>
                        Vote(s)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {amendments.map((a: AmendmentListItem) => (
                      <tr key={a.id}>
                        <td className={styles.colNumero}>
                          <span className={styles.numero}>{a.numero}</span>
                        </td>
                        <td className={styles.colLien}>
                          {a.official_url ? (
                            <a
                              href={a.official_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.extLink}
                            >
                              Voir sur assemblee-nationale.fr
                              <span className={styles.extArrow}>→</span>
                            </a>
                          ) : (
                            <span className={styles.noLink}>
                              Réf. {a.official_id}
                            </span>
                          )}
                        </td>
                        <td className={styles.colVotes}>
                          {a.scrutins && a.scrutins.length > 0 ? (
                            <ul className={styles.scrutinList}>
                              {a.scrutins.map((s) => (
                                <li key={s.id}>
                                  <Link
                                    href={`/votes/${encodeURIComponent(s.id)}`}
                                    className={styles.scrutinLink}
                                  >
                                    {formatDate(s.date_scrutin)} –{" "}
                                    {formatSortLabel(s.sort_code)}
                                    <span className={styles.scrutinTitre}>
                                      {s.titre.length > 60
                                        ? s.titre.slice(0, 57) + "…"
                                        : s.titre}
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className={styles.noVote}>
                              Non mis aux voix
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <nav className={styles.pagination} aria-label="Pagination">
                <span className={styles.paginationInfo}>
                  {from + 1}–{to} sur {total}
                </span>
                <div className={styles.paginationButtons}>
                  <button
                    type="button"
                    className={styles.paginationBtn}
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    aria-label="Page précédente"
                  >
                    Précédent
                  </button>
                  <button
                    type="button"
                    className={styles.paginationBtn}
                    disabled={!hasMore}
                    onClick={() => setPage((p) => p + 1)}
                    aria-label="Page suivante"
                  >
                    Suivant
                  </button>
                </div>
              </nav>
            </>
          )}

          <p className={styles.backLink}>
            <Link href={`/bills/${encodeURIComponent(billId)}`}>
              ← Retour au dossier
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
