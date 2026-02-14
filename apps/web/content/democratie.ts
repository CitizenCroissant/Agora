/**
 * French copy for the "Comprendre la démocratie" educational section.
 * Kept in one file for easy revision without touching layout.
 */

export const DEMOCRATIE = {
  hub: {
    intro:
      "En quelques clics, découvrez comment les lois sont faites et comment vous pouvez participer.",
    cards: [
      {
        id: "loi",
        title: "Comment une loi est votée",
        description:
          "Du projet de loi à la promulgation : le parcours d’un texte en 7 étapes."
      },
      {
        id: "assemblee",
        title: "L’Assemblée nationale",
        description:
          "577 députés, les séances publiques et ce que vous voyez sur Agora."
      },
      {
        id: "senat",
        title: "Le Sénat",
        description:
          "La seconde chambre : son rôle, la navette, et la représentation des territoires."
      },
      {
        id: "citoyen",
        title: "Votre rôle de citoyen",
        description:
          "Voter, suivre les débats, contacter votre député et autres moyens de participer."
      },
      {
        id: "commissions",
        title: "Les commissions et organes",
        description:
          "Commissions permanentes, spéciales, d'enquête, missions d'information : organisation et rôle du travail en commission."
      },
      {
        id: "methodologie",
        title: "Comment nous présentons les votes",
        description:
          "D'où viennent les données, comment sont regroupés les votes (pour, contre, abstention, non votant), ce que signifient adopté et rejeté, et notre charte de neutralité.",
        externalHref: "/sources#methodologie"
      }
    ] as const
  },

  loi: {
    title: "Comment une loi est votée",
    intro:
      "Un texte de loi passe par plusieurs étapes avant d’être adopté. Voici le parcours simplifié.",
    steps: [
      {
        title: "Initiative",
        body: "Le texte vient du Gouvernement (on parle alors de « projet de loi ») ou de députés et sénateurs (« proposition de loi »)."
      },
      {
        title: "Examen en commission",
        body: "Des députés (ou sénateurs) étudient le texte en petit comité : c’est la commission. Ils peuvent le modifier avant la séance publique."
      },
      {
        title: "Débat à l’Assemblée",
        body: "En séance publique, les députés discutent le texte et proposent des amendements. C’est cette activité que vous pouvez suivre sur Agora."
      },
      {
        title: "Vote à l’Assemblée",
        body: "Les députés votent pour ou contre le texte (et les amendements). S’il est adopté, le texte part vers l’autre chambre."
      },
      {
        title: "Navette",
        body: "Le texte part au Sénat (ou à l’Assemblée s’il est parti du Sénat). La « navette » désigne ce va-et-vient entre les deux chambres, qui appliquent le même type de débat et de vote."
      },
      {
        title: "Accord entre les deux chambres",
        body: "Si Assemblée et Sénat ne sont pas d’accord, une commission mixte paritaire (CMP) peut proposer un compromis. Selon les cas, l’Assemblée peut avoir le dernier mot après une nouvelle lecture."
      },
      {
        title: "Promulgation",
        body: "Une fois le texte adopté par le Parlement, le Président de la République le promulgue. La loi est ensuite publiée au Journal officiel et entre en vigueur."
      }
    ],
    showAllLabel: "Tout afficher",
    nextLabel: "Étape suivante",
    prevLabel: "Étape précédente"
  },

  assemblee: {
    title: "L’Assemblée nationale",
    body: "L’Assemblée nationale réunit 577 députés, élus au suffrage universel direct pour cinq ans. Ils votent les lois, amendent les textes et contrôlent l’action du Gouvernement (questions, commissions d’enquête, etc.). Les séances publiques ont lieu dans l’hémicycle : c’est là que se tiennent les débats et les scrutins que vous pouvez consulter sur Agora.",
    summaryTitle: "En résumé",
    summary:
      "577 députés, élus pour 5 ans. Ils votent les lois, débattent en séance publique et contrôlent le Gouvernement. Agora vous permet de suivre l’ordre du jour et les scrutins.",
    links: [
      { label: "Voir le calendrier des séances", href: "/timeline" },
      { label: "Consulter les scrutins", href: "/votes" },
      { label: "Commissions et organes", href: "/commissions" },
      { label: "Trouver mon député", href: "/mon-depute" }
    ]
  },

  senat: {
    title: "Le Sénat",
    body: "Le Sénat est la « chambre haute » du Parlement. Ses 348 sénateurs sont élus au suffrage indirect (par des grands électeurs : maires, conseillers, etc.) pour six ans. Comme l’Assemblée, il vote et amende les lois. En cas de désaccord entre les deux chambres, le texte fait la « navette » jusqu’à accord, ou l’Assemblée peut, dans certains cas, trancher. Le Sénat représente surtout les collectivités territoriales.",
    summaryTitle: "En résumé",
    summary:
      "348 sénateurs, élus pour 6 ans au suffrage indirect. Ils participent au vote des lois et représentent les territoires. En cas de désaccord, navette ou dernier mot à l’Assemblée.",
    links: [{ label: "Comment une loi est votée", href: "/democratie#loi" }]
  },

  citoyen: {
    title: "Votre rôle de citoyen",
    body: "En tant que citoyen, vous pouvez participer de plusieurs façons : en votant aux élections, en suivant les débats et les votes (par exemple sur Agora), en contactant votre député pour lui faire part de votre avis, ou en vous informant via les sources officielles. Il existe aussi des pétitions et, dans certains cas, un référendum d’initiative partagée.",
    summaryTitle: "En résumé",
    summary:
      "Votez, suivez les débats sur Agora, contactez votre député, signez des pétitions. S’informer et faire entendre son avis font partie de la participation citoyenne.",
    contactDeputeTitle: "Comment contacter votre député",
    contactDeputeIntro:
      "Vous pouvez joindre votre député par courrier à l'Assemblée nationale, par téléphone via le standard, ou via sa fiche officielle sur le site de l'Assemblée (formulaire de contact ou coordonnées de sa permanence en circonscription).",
    contactDepute: [
      {
        label: "Par courrier",
        value:
          "M. le Député [Nom] / Mme la Députée [Nom]\nAssemblée nationale\n126 rue de l'Université\n75355 Paris 07 SP"
      },
      {
        label: "Par téléphone",
        value:
          "Standard de l'Assemblée : 01 40 63 60 00 (demander le député ou son cabinet)."
      },
      {
        label: "En ligne",
        value:
          "Sur la fiche du député sur assemblee-nationale.fr : lien « Contacter le député » ou formulaire. Utilisez « Mon député » sur Agora pour accéder à sa fiche officielle."
      }
    ],
    links: [
      { label: "Mon député", href: "/mon-depute" },
      { label: "Calendrier des séances", href: "/timeline" },
      {
        label: "Référendum d’initiative partagée (service-public.fr)",
        href: "https://www.service-public.fr/particuliers/vosdroits/F34514",
        external: true
      }
    ]
  },

  commissions: {
    title: "Les commissions et organes de l'Assemblée",
    intro:
      "En plus des séances publiques dans l'hémicycle, les députés travaillent en commissions et dans d'autres organes. Voici comment ils sont organisés et quel est leur rôle.",
    typesTitle: "Types d'organes",
    types: [
      {
        title: "Commissions permanentes",
        body: "Au nombre de huit (plafond fixé par la Constitution depuis 2008), ce sont les organes principaux du travail législatif : chaque projet ou proposition de loi est renvoyé à une commission permanente (sauf constitution d'une commission spéciale). Chaque député ne peut être membre que d'une seule commission permanente. Les huit commissions : affaires culturelles et éducation ; affaires économiques ; affaires étrangères ; affaires sociales ; défense nationale et forces armées ; développement durable et aménagement du territoire ; finances, économie générale et contrôle budgétaire ; lois constitutionnelles, législation et administration générale."
      },
      {
        title: "Commissions spéciales",
        body: "Créées à titre exceptionnel pour l'examen d'un texte (à la demande du Gouvernement ou d'une majorité de présidents de groupe, etc.). En pratique, la plupart des textes vont en commission permanente ; les commissions spéciales restent peu nombreuses par législature."
      },
      {
        title: "Commissions d'enquête",
        body: "Organes temporaires créés par une résolution, pour informer l'Assemblée sur des faits déterminés ou la gestion de services publics. Composition limitée (30 membres max), moyens d'enquête importants, rapport dans un délai maximal de six mois."
      },
      {
        title: "Missions d'information",
        body: "Créées par une commission permanente, plusieurs commissions, ou la Conférence des présidents (sujets transverses ou sensibles). Elles aboutissent à un rapport et peuvent donner lieu à un débat ou des questions en séance."
      },
      {
        title: "Délégations et autres organes",
        body: "Par exemple : délégation aux droits des femmes, aux collectivités territoriales. L'Assemblée distingue ces types dans ses données (commissions permanentes, d'enquête, missions, délégations, etc.)."
      }
    ],
    roleTitle: "Rôle des commissions permanentes",
    roleIntro:
      "Les commissions permanentes ont une double fonction (fiche de synthèse n°16, Assemblée nationale) :",
    rolePoints: [
      {
        title: "Préparation du débat législatif",
        body: "Examen des projets et propositions de loi, désignation d'un rapporteur, auditions, amendements. Depuis la révision constitutionnelle de 2008, la discussion en séance publique porte sur le texte adopté par la commission (et non plus sur le texte initial du Gouvernement), sauf exceptions (révision constitutionnelle, loi de finances, etc.). Les amendements adoptés en commission sont intégrés au texte de débat en séance."
      },
      {
        title: "Information et contrôle",
        body: "Les commissions informent l'Assemblée et exercent un contrôle sur l'action du Gouvernement : auditions, rapports, missions d'information, avis sur d'autres textes."
      }
    ],
    constitutionTitle: "Composition et fonctionnement",
    constitution: [
      {
        title: "Composition",
        body: "En début de législature puis chaque année au début de la session ordinaire, l'Assemblée nomme les membres des commissions permanentes sur la base de la représentation proportionnelle des groupes politiques. Chaque commission compte en principe un huitième des effectifs (soit environ 72 députés)."
      },
      {
        title: "Bureau",
        body: "Chaque commission élit un bureau : un président, quatre vice-présidents, quatre secrétaires. Règles particulières : commission des finances (président obligatoirement issu de l'opposition) ; commissions des affaires sociales et des finances (rapporteur général)."
      },
      {
        title: "Rapporteurs",
        body: "Pour chaque texte, la commission désigne un ou plusieurs rapporteurs parmi ses membres. Le rapporteur rédige le rapport, présente les amendements et porte la position de la commission en séance publique."
      },
      {
        title: "Réunions",
        body: "Les commissions ont des salles dédiées et des équipes de fonctionnaires. Le mercredi matin leur est réservé ; elles se réunissent souvent plusieurs fois par semaine, y compris en parallèle de la séance publique. Les réunions sont sonorisées et enregistrées."
      }
    ],
    saisineTitle: "Place dans la procédure",
    saisine: [
      {
        title: "Renvoi",
        body: "La règle est le renvoi à une commission permanente ; la commission spéciale est l'exception. En cas de conflit de compétences entre deux commissions permanentes, l'Assemblée tranche."
      },
      {
        title: "Saisine pour avis",
        body: "Une commission peut être saisie pour avis sur tout ou partie d'un texte renvoyé au fond à une autre (ex. les sept autres commissions donnent chaque année leur avis sur le projet de loi de finances)."
      },
      {
        title: "Délais",
        body: "Délai de six semaines entre le dépôt et l'examen en première lecture devant la première assemblée saisie, quatre semaines pour la seconde (sauf procédure accélérée, lois de finances). Depuis 2019, délai minimal de dix jours entre l'adoption du texte en commission et le début de l'examen en séance."
      }
    ],
    summaryTitle: "En résumé",
    summary:
      "Les commissions permanentes sont le cœur du travail législatif et du contrôle. Les réunions de commission (examen de textes, auditions, missions) complètent les séances publiques que vous pouvez suivre sur Agora.",
    links: [
      { label: "Voir toutes les commissions et organes", href: "/commissions" },
      { label: "Calendrier des séances et réunions", href: "/timeline" }
    ]
  }
} as const;
