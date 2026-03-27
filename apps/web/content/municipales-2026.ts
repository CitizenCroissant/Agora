/**
 * Content for the Municipales 2026 section.
 * The municipal elections took place on March 15 & 22, 2026.
 * This is a post-election informational resource.
 */

export const MUNICIPALES_2026 = {
  hero: {
    title: "Municipales 2026",
    subtitle:
      "Les élections municipales des 15 et 22 mars 2026 ont renouvelé les conseils municipaux des 34 945 communes de France. Retrouvez ici les informations essentielles, les résultats officiels et ce qu'il faut comprendre de ce scrutin local majeur.",
    badge: "Scrutin terminé"
  },

  keyFacts: {
    title: "Les chiffres clés",
    facts: [
      { label: "Communes concernées", value: "34 945" },
      { label: "1er tour", value: "15 mars 2026" },
      { label: "2nd tour", value: "22 mars 2026" },
      { label: "Mandat", value: "6 ans (2026–2032)" },
      { label: "Conseillers élus", value: "≈ 500 000" },
      { label: "Électeurs inscrits", value: "≈ 48 millions" }
    ]
  },

  howItWorks: {
    title: "Comment fonctionnent les municipales ?",
    intro:
      "Les élections municipales élisent les conseillers municipaux, qui désignent ensuite le maire parmi eux. Le mode de scrutin dépend de la taille de la commune.",
    modes: [
      {
        title: "Communes de 1 000 habitants et plus",
        body: "Scrutin de liste à deux tours avec représentation proportionnelle. Au premier tour, la liste qui obtient la majorité absolue remporte la moitié des sièges ; l'autre moitié est répartie proportionnellement entre toutes les listes ayant obtenu au moins 5 % des suffrages. Si aucune liste n'obtient la majorité absolue, un second tour est organisé : seules les listes ayant obtenu au moins 10 % des suffrages peuvent s'y présenter (avec possibilité de fusion pour celles au-dessus de 5 %). La liste arrivée en tête obtient la prime majoritaire.",
        highlight: "Les listes doivent respecter la parité stricte (alternance femme-homme)."
      },
      {
        title: "Communes de moins de 1 000 habitants",
        body: "Scrutin majoritaire plurinominal à deux tours. Les candidats se présentent individuellement (pas de liste obligatoire). Au premier tour, sont élus ceux qui obtiennent la majorité absolue et au moins 25 % des inscrits. Au second tour, la majorité relative suffit. Les électeurs peuvent panacher (rayer des noms, en ajouter d'autres).",
        highlight: "Pas d'obligation de parité dans ces communes."
      }
    ],
    electionOfMayor:
      "Une fois le conseil municipal élu, celui-ci se réunit dans les jours suivants pour élire le maire et ses adjoints parmi ses membres. Le maire est élu à la majorité absolue aux deux premiers tours, puis à la majorité relative au troisième tour si nécessaire."
  },

  timeline: {
    title: "Le calendrier des municipales 2026",
    events: [
      {
        date: "Février 2026",
        label: "Dépôt des candidatures",
        description:
          "Les candidats et listes déposent leur déclaration de candidature en préfecture."
      },
      {
        date: "Vendredi 13 mars",
        label: "Fin de la campagne officielle",
        description:
          "La campagne officielle s'achève le vendredi précédant le scrutin à minuit."
      },
      {
        date: "Dimanche 15 mars 2026",
        label: "Premier tour",
        description:
          "Vote dans les 34 945 communes de France. Dans les communes de 1 000 habitants et plus, les listes ayant obtenu la majorité absolue remportent directement."
      },
      {
        date: "Dimanche 22 mars 2026",
        label: "Second tour",
        description:
          "Second tour dans les communes où aucun candidat ou liste n'a obtenu la majorité absolue. Fusion de listes possible pour les communes ≥ 1 000 hab."
      },
      {
        date: "Fin mars – début avril",
        label: "Élection des maires",
        description:
          "Les nouveaux conseils municipaux se réunissent pour élire les maires et leurs adjoints. Les conseils communautaires (intercommunalités) sont ensuite constitués."
      }
    ]
  },

  localAndNational: {
    title: "Quel lien avec le Parlement ?",
    intro:
      "Les municipales n'élisent pas de députés ni de sénateurs, mais elles ont un impact indirect sur la vie parlementaire.",
    points: [
      {
        title: "Les grands électeurs du Sénat",
        body: "Les conseillers municipaux constituent l'essentiel du collège des grands électeurs qui élit les sénateurs. Un renouvellement municipal modifie donc la composition de ce collège et peut, à terme, changer la majorité sénatoriale lors des prochaines sénatoriales."
      },
      {
        title: "Le rôle des maires dans les politiques publiques",
        body: "Les maires appliquent localement les lois votées au Parlement : urbanisme, sécurité, éducation (écoles primaires), état civil, etc. Ils sont aussi un relais entre les citoyens et les institutions nationales."
      },
      {
        title: "Les intercommunalités",
        body: "Les conseillers communautaires (intercommunalités, métropoles, communautés d'agglomération) sont désignés dans le cadre des municipales. Ces structures gèrent des compétences majeures : transports, habitat, eau, déchets, développement économique."
      }
    ]
  },

  officialSources: {
    title: "Sources et résultats officiels",
    intro:
      "Consultez les résultats commune par commune et les données officielles du ministère de l'Intérieur.",
    sources: [
      {
        label: "Résultats des élections – Ministère de l'Intérieur",
        url: "https://www.resultats-elections.interieur.gouv.fr/",
        description:
          "Résultats officiels, commune par commune, avec détail des voix, sièges et élus."
      },
      {
        label: "Données ouvertes électorales – data.gouv.fr",
        url: "https://www.data.gouv.fr/fr/pages/donnees-des-elections/",
        description:
          "Jeux de données en open data : résultats par bureau de vote, listes de candidats, cartographies."
      },
      {
        label: "Service-public.fr – Élections municipales",
        url: "https://www.service-public.fr/particuliers/vosdroits/F1947",
        description:
          "Fiche officielle sur le droit de vote, les conditions d'éligibilité et le fonctionnement du scrutin municipal."
      },
      {
        label: "Code électoral – Légifrance",
        url: "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006070239/",
        description:
          "Le cadre juridique des élections en France : conditions, campagne, financement, contentieux."
      },
      {
        label: "Répertoire national des élus – data.gouv.fr",
        url: "https://www.data.gouv.fr/fr/datasets/repertoire-national-des-elus/",
        description:
          "Base de données de tous les élus de France mise à jour par le ministère de l'Intérieur, y compris les conseillers municipaux et maires."
      }
    ]
  },

  didYouKnow: {
    title: "Le saviez-vous ?",
    facts: [
      "En France, il y a 34 945 communes – plus que dans n'importe quel autre pays de l'Union européenne.",
      "85 % des communes françaises ont moins de 2 000 habitants.",
      "Le plus petit conseil municipal compte 7 membres (communes de moins de 100 habitants), le plus grand en compte 69 (Paris, Lyon, Marseille).",
      "Paris, Lyon et Marseille ont un système spécial : les habitants votent par arrondissement, et les conseillers d'arrondissement élisent ensuite le conseil de Paris/Lyon/Marseille, qui élit le maire.",
      "Les citoyens de l'Union européenne résidant en France peuvent voter aux municipales (mais pas aux élections nationales).",
      "Le taux de participation aux municipales de 2020 (premier tour) était de 44,7 %, contre 63,5 % en 2014 – la baisse s'explique par la crise sanitaire du Covid-19."
    ]
  },

  agoraAndMunicipales: {
    title: "Agora et les municipales",
    body: "Agora se concentre sur la transparence parlementaire : les séances et scrutins de l'Assemblée nationale. Les municipales ne relèvent pas directement de notre périmètre, mais elles sont un pilier de la démocratie française. Cette page a pour but de vous informer sur ce scrutin et de vous orienter vers les ressources officielles.",
    links: [
      { label: "Comprendre la démocratie", href: "/democratie" },
      { label: "Les élections municipales (fiche)", href: "/democratie/elections-municipales" },
      { label: "Suivre l'Assemblée nationale", href: "/" },
      { label: "Consulter les scrutins", href: "/votes" }
    ]
  }
} as const;
